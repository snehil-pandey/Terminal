/**
 * Panfam Programming Language (.pf) - Code Formatter
 * Formats .pf source code with consistent indentation,
 * standardized spacing around operators, and clean block structure.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.PFFormatter = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    function format(source) {
        if (!source || typeof source !== 'string') return '';

        const lines = source.split(/\r?\n/);
        let indentLevel = 0;
        const indentStr = '    ';
        const formattedLines = [];

        for (let line of lines) {
            let trimmed = line.trim();
            if (trimmed.length === 0) {
                formattedLines.push('');
                continue;
            }

            // Adjust indent if line starts with closing brace
            if (trimmed.startsWith('}') || trimmed.startsWith(')')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }

            // Standardize spaces around operators: =, ==, !=, +, -, *, /
            trimmed = trimmed
                .replace(/\s*([=+\-*/<>!]=|[=+\-*/<>])\s*/g, ' $1 ')
                .replace(/\s*,\s*/g, ', ')
                .replace(/\s*:\s*/g, ': ')
                .replace(/\(\s+/g, '(')
                .replace(/\s+\)/g, ')')
                .replace(/\{\s*/g, ' {')
                .replace(/\s+/g, ' ');

            // Ensure proper indent
            const lineOutput = indentStr.repeat(indentLevel) + trimmed;
            formattedLines.push(lineOutput);

            // If line ends with opening brace, increase indent for next lines
            if (trimmed.endsWith('{')) {
                indentLevel++;
            }
        }

        return formattedLines.join('\n').trim() + '\n';
    }

    return {
        format: format
    };
});
