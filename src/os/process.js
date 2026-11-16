/**
 * Panfam OS (PFOS) - Process Manager & Scheduler
 * Manages virtual processes, states (Created, Ready, Running, Sleeping, Terminated),
 * PID accounting, priority levels, and cooperative execution lifecycle.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.PFProcessManager = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const ProcessState = {
        CREATED: 'CREATED',
        READY: 'READY',
        RUNNING: 'RUNNING',
        SLEEPING: 'SLEEPING',
        WAITING: 'WAITING',
        TERMINATED: 'TERMINATED',
        FAILED: 'FAILED'
    };

    class VirtualProcess {
        constructor(pid, name, ppid = 1, user = 'user', priority = 20) {
            this.pid = pid;
            this.ppid = ppid;
            this.name = name;
            this.user = user;
            this.state = ProcessState.CREATED;
            this.priority = priority;
            this.cpuTimeMs = 0;
            this.memoryBytes = 16 * 1024 * 1024; // 16MB standard baseline
            this.startTime = new Date();
            this.cwd = '/home/user';
            this.exitCode = null;
            this.threads = 1;
        }

        tick(ms = 10) {
            if (this.state === ProcessState.RUNNING) {
                this.cpuTimeMs += ms;
            }
        }
    }

    class ProcessManager {
        constructor(hardware = null) {
            this.hardware = hardware;
            this.processes = new Map();
            this.nextPid = 1;

            this.initKernelProcesses();
        }

        initKernelProcesses() {
            // PID 1: systemd / pfinit
            const initProc = this.spawn('pf-init', 0, 'root', 0);
            initProc.state = ProcessState.RUNNING;
            initProc.memoryBytes = 32 * 1024 * 1024;

            // System services
            const dbus = this.spawn('dbus-daemon', 1, 'messagebus', 10);
            dbus.state = ProcessState.SLEEPING;

            const udev = this.spawn('systemd-udevd', 1, 'root', 10);
            udev.state = ProcessState.SLEEPING;

            // Shell session
            const shell = this.spawn('pfsh', 1, 'user', 20);
            shell.state = ProcessState.RUNNING;
            shell.memoryBytes = 24 * 1024 * 1024;
        }

        spawn(name, ppid = 1, user = 'user', priority = 20) {
            const pid = this.nextPid++;
            const proc = new VirtualProcess(pid, name, ppid, user, priority);
            proc.state = ProcessState.READY;
            this.processes.set(pid, proc);

            if (this.hardware && this.hardware.memory) {
                this.hardware.memory.allocate(pid, proc.memoryBytes);
            }

            return proc;
        }

        terminate(pid, exitCode = 0) {
            const proc = this.processes.get(pid);
            if (!proc) return false;
            if (pid === 1) throw new Error('Refusing to terminate PID 1 (pf-init)');

            proc.state = ProcessState.TERMINATED;
            proc.exitCode = exitCode;

            if (this.hardware && this.hardware.memory) {
                this.hardware.memory.freeAll(pid);
            }

            this.processes.delete(pid);
            return true;
        }

        get(pid) {
            return this.processes.get(pid) || null;
        }

        list() {
            return Array.from(this.processes.values());
        }

        tick() {
            for (const proc of this.processes.values()) {
                if (proc.state === ProcessState.RUNNING) {
                    proc.tick(20);
                }
            }
            if (this.hardware && this.hardware.cpu) {
                this.hardware.cpu.tick(150);
            }
        }
    }

    return {
        ProcessState: ProcessState,
        VirtualProcess: VirtualProcess,
        ProcessManager: ProcessManager
    };
});
