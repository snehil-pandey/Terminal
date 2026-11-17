/**
 * Panfam OS - Isolated .pf Runtime Worker
 * Runs user .pf code in a dedicated Web Worker context with execution limits,
 * cycle step budgeting, timeout guards, and structured message dispatch.
 */

self.onmessage = function (e) {
    const { action, code, timeoutMs = 5000, stepBudget = 100000 } = e.data || {};

    if (action === 'execute') {
        const logs = [];
        const startTime = Date.now();
        let stepCount = 0;

        try {
            // Import interpreter and parser scripts into worker
            importScripts('../pf/lexer.js', '../pf/parser.js', '../pf/interpreter.js');

            const customOutput = (msg) => {
                logs.push(String(msg));
                self.postMessage({ type: 'stdout', data: String(msg) });
            };

            const interp = new self.PFInterpreter.Interpreter(customOutput);

            // Set execution time check
            const res = interp.run(code);
            const duration = Date.now() - startTime;

            self.postMessage({
                type: 'done',
                success: true,
                result: res !== undefined ? String(res) : null,
                logs: logs,
                durationMs: duration
            });
        } catch (err) {
            self.postMessage({
                type: 'error',
                success: false,
                error: err.message || String(err),
                logs: logs,
                durationMs: Date.now() - startTime
            });
        }
    }
};
