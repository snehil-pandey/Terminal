/**
 * Panfam OS (PFOS) - Authoritative System Service Container
 * Manages single authoritative instances of:
 * - Hardware Abstraction (Virtual Hardware, CPU, Memory)
 * - Virtual File System (Inode tree, /proc, symlinks)
 * - Virtual Network (Interfaces, routing, DNS)
 * - Process Manager & Scheduler (Virtual process lifecycles)
 * - Panfam Kernel (Syscalls, audit log, security boundary)
 * - Storage & Persistence Engine (IndexedDB, LocalStorage)
 * - System Bus & Worker Bridge (Worker RPC with syscall validation)
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        const Hardware = require('./hardware');
        const ProcessModule = require('./process');
        const PFKernel = require('./kernel');
        const VirtualFileSystem = require('../fs/vfs');
        const VirtualNetwork = require('../net/network');
        const Storage = require('../core/storage');
        const ThemeManager = require('../ui/theme');
        module.exports = factory(Hardware, ProcessModule, PFKernel, VirtualFileSystem, VirtualNetwork, Storage, ThemeManager);
    } else {
        root.PFSystemServices = factory(
            root.PFHardware,
            root.PFProcessManager,
            root.PFKernel,
            root.VirtualFileSystem,
            root.VirtualNetwork,
            root.TerminalStorage,
            root.TerminalTheme
        );
    }
})(typeof self !== 'undefined' ? self : this, function (HardwareModule, ProcessModule, PFKernel, VirtualFileSystem, VirtualNetwork, Storage, ThemeManager) {
    'use strict';

    class SystemServiceContainer {
        constructor() {
            this.initialized = false;
            this.hardware = null;
            this.processManager = null;
            this.vfs = null;
            this.network = null;
            this.kernel = null;
            this.storage = Storage;
            this.themeManager = null;
            this.activeWorkers = new Map(); // pid -> { worker, proc, startTime }

            this.init();
        }

        init() {
            if (this.initialized) return;

            // 1. Hardware Abstraction
            const VirtualHardware = HardwareModule.VirtualHardware || HardwareModule;
            this.hardware = new VirtualHardware();

            // 2. Process Manager
            const ProcessManager = ProcessModule.ProcessManager || ProcessModule;
            this.processManager = new ProcessManager(this.hardware);

            // 3. Virtual File System
            this.vfs = new VirtualFileSystem();

            // 4. Virtual Network
            this.network = new VirtualNetwork();

            // 5. Kernel Syscall & Security Boundary
            this.kernel = new PFKernel(this.hardware, this.processManager, this.vfs, this.network);

            // 6. Theme Manager
            if (ThemeManager) {
                this.themeManager = new ThemeManager();
            }

            this.initialized = true;
        }

        // Worker Execution with Privileged Syscall Bridge
        spawnWorkerProcess(name, code, user = 'user', options = {}) {
            const proc = this.processManager.spawn(name, 1, user, options.priority || 20);
            proc.state = ProcessModule.ProcessState ? ProcessModule.ProcessState.RUNNING : 'RUNNING';

            let worker = null;
            const pid = proc.pid;
            const timeoutMs = options.timeoutMs || 10000;

            if (typeof Worker !== 'undefined') {
                try {
                    worker = new Worker('src/pf/worker.js');
                    this.activeWorkers.set(pid, { worker, proc, startTime: Date.now() });

                    // Handle messages & privileged syscall bridge
                    worker.onmessage = (e) => {
                        const msg = e.data || {};

                        if (msg.type === 'syscall') {
                            this.handleWorkerSyscall(pid, worker, msg, user);
                            return;
                        }

                        if (msg.type === 'stdout' && typeof options.onStdout === 'function') {
                            options.onStdout(msg.data);
                        }

                        if (msg.type === 'done') {
                            this.terminateProcess(pid, 0, 'Completed');
                            if (typeof options.onComplete === 'function') options.onComplete(msg);
                        }

                        if (msg.type === 'error') {
                            this.terminateProcess(pid, 1, msg.error);
                            if (typeof options.onError === 'function') options.onError(msg.error);
                        }
                    };

                    worker.onerror = (err) => {
                        this.terminateProcess(pid, 1, err.message || 'Worker Error');
                        if (typeof options.onError === 'function') options.onError(err.message || 'Worker Error');
                    };

                    // Send start action
                    worker.postMessage({
                        action: 'execute',
                        code: code,
                        timeoutMs: timeoutMs,
                        pid: pid
                    });

                    // Timeout watchdog guard
                    setTimeout(() => {
                        if (this.activeWorkers.has(pid)) {
                            this.terminateProcess(pid, 124, 'Execution Timeout Exceeded');
                            if (typeof options.onError === 'function') {
                                options.onError(`Process ${pid} timed out after ${timeoutMs}ms`);
                            }
                        }
                    }, timeoutMs);

                } catch (err) {
                    // Fallback to inline execution if Web Worker creation is gated
                    this.executeInlineProcess(pid, proc, code, options);
                }
            } else {
                // Environment without Worker (e.g. Node tests)
                this.executeInlineProcess(pid, proc, code, options);
            }

            return proc;
        }

        executeInlineProcess(pid, proc, code, options = {}) {
            const InterpreterModule = (typeof require !== 'undefined') ? require('../pf/interpreter') : (root.PFInterpreter || null);
            if (!InterpreterModule) {
                this.terminateProcess(pid, 1, 'Interpreter unavailable');
                return;
            }
            try {
                const logs = [];
                const interp = new InterpreterModule.Interpreter((m) => {
                    logs.push(m);
                    if (options.onStdout) options.onStdout(m);
                }, this.kernel);

                const res = interp.run(code);
                this.terminateProcess(pid, 0, 'Completed');
                if (options.onComplete) options.onComplete({ success: true, result: res, logs });
            } catch (e) {
                this.terminateProcess(pid, 1, e.message);
                if (options.onError) options.onError(e.message);
            }
        }

        handleWorkerSyscall(pid, worker, msg, user) {
            const { callId, method, args = [] } = msg;

            try {
                let result = null;
                switch (method) {
                    case 'fs.read':
                        result = this.kernel.sys_read(args[0], pid, user);
                        break;
                    case 'fs.write':
                        result = this.kernel.sys_write(args[0], args[1], pid, user);
                        break;
                    case 'fs.list':
                        result = this.vfs.readDir(args[0] || '.');
                        break;
                    case 'sys.meminfo':
                        result = this.kernel.sys_meminfo();
                        break;
                    case 'sys.cpuinfo':
                        result = this.kernel.sys_cpuinfo();
                        break;
                    case 'sys.uname':
                        result = this.kernel.sys_uname();
                        break;
                    default:
                        throw new Error(`ENOSYS: Unsupported syscall '${method}'`);
                }

                worker.postMessage({
                    type: 'syscall_result',
                    callId: callId,
                    success: true,
                    data: result
                });
            } catch (err) {
                worker.postMessage({
                    type: 'syscall_result',
                    callId: callId,
                    success: false,
                    error: err.message
                });
            }
        }

        terminateProcess(pid, exitCode = 0, reason = 'Terminated') {
            const active = this.activeWorkers.get(pid);
            if (active && active.worker) {
                try { active.worker.terminate(); } catch (_) {}
            }
            this.activeWorkers.delete(pid);

            const proc = this.processManager.get(pid);
            if (proc) {
                proc.exitReason = reason;
                return this.processManager.terminate(pid, exitCode);
            }
            return false;
        }
    }

    // Authoritative Singleton instance for Panfam OS
    let singletonInstance = null;

    function getSystemServices() {
        if (!singletonInstance) {
            singletonInstance = new SystemServiceContainer();
        }
        return singletonInstance;
    }

    return {
        SystemServiceContainer: SystemServiceContainer,
        getSystemServices: getSystemServices
    };
});
