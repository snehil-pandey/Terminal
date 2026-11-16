/**
 * Panfam-Terminal Execution Result & Helper Definitions
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.TerminalResult = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class ExecutionResult {
        constructor(stdout = '', stderr = '', exitCode = 0, metadata = {}) {
            this.stdout = stdout || '';
            this.stderr = stderr || '';
            this.exitCode = exitCode !== undefined ? exitCode : 0;
            this.metadata = metadata || {};
        }

        static ok(stdout, metadata) {
            return new ExecutionResult(stdout, '', 0, metadata);
        }

        static error(stderr, exitCode = 1, metadata) {
            return new ExecutionResult('', stderr, exitCode, metadata);
        }
    }

    return ExecutionResult;
});
