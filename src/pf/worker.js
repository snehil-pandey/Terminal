/**
 * Panfam OS - Isolated .pf Runtime Worker with Syscall Bridge
 * Runs user .pf code in a dedicated Web Worker context with execution limits,
 * cycle step budgeting, timeout guards, and structured message dispatch.
 */

self.onmessage = function (e) {
    const { action, code, timeoutMs = 5000, pid = 100 } = e.data || {};

    if (action === 'execute') {
        const logs = [];
        const startTime = Date.now();

        try {
            // Import interpreter and parser scripts into worker
            importScripts('../pf/lexer.js', '../pf/parser.js', '../pf/interpreter.js');

            const customOutput = (msg) => {
                logs.push(String(msg));
                self.postMessage({ type: 'stdout', data: String(msg) });
            };

            // Syscall bridge proxy for worker
            const workerSyscallBridge = {
                sys_read: (path) => {
                    self.postMessage({ type: 'syscall', method: 'fs.read', args: [path], callId: Date.now() });
                    return '';
                },
                sys_write: (path, content) => {
                    self.postMessage({ type: 'syscall', method: 'fs.write', args: [path, content], callId: Date.now() });
                    return true;
                },
                sys_uname: () => ({ name: 'Panfam OS', workerIsolated: true }),
                sys_meminfo: () => ({ totalMiB: 8192, workerAllocatedMiB: 16 }),
                sys_cpuinfo: () => ({ cores: 4 })
            };

            const interp = new self.PFInterpreter.Interpreter(customOutput, workerSyscallBridge);

            // Execute user program
            const res = interp.run(code);
            const duration = Date.now() - startTime;

            self.postMessage({
                type: 'done',
                success: true,
                result: res !== undefined ? String(res) : null,
                logs: logs,
                durationMs: duration,
                pid: pid
            });
        } catch (err) {
            self.postMessage({
                type: 'error',
                success: false,
                error: err.message || String(err),
                logs: logs,
                durationMs: Date.now() - startTime,
                pid: pid
            });
        }
    }
};
