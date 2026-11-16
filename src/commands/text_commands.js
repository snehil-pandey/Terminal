/**
 * Panfam-Terminal Text Processing Commands
 * Commands: echo, printf, grep, sed, awk, cut, sort, uniq, tr, wc, nl, head, tail, tee, diff
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        const Security = require('../core/security');
        const ExecutionResult = require('./result');
        module.exports = factory(Security, ExecutionResult);
    } else {
        root.TerminalTextCommands = factory(root.TerminalSecurity, root.TerminalResult);
    }
})(typeof self !== 'undefined' ? self : this, function (Security, ExecutionResult) {
    'use strict';

    function registerTextCommands(registry) {
        // echo
        registry.register('echo', (args, stdin, ctx) => {
            const raw = args.join(' ');
            const expanded = raw.replace(/\$([A-Za-z0-9_]+)/g, (_, v) => ctx.shell.getEnv(v) || '');
            return ExecutionResult.ok(expanded);
        }, { description: 'Write arguments to the standard output', usage: 'echo [text...]', category: 'Text' });

        // printf
        registry.register('printf', (args) => {
            if (args.length === 0) return ExecutionResult.ok('');
            let format = args[0];
            format = format.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
            return ExecutionResult.ok(format);
        }, { description: 'Format and print data', usage: 'printf <format> [arguments...]', category: 'Text' });

        // grep
        registry.register('grep', (args, stdin, ctx) => {
            let ignoreCase = false;
            let invertMatch = false;
            let countOnly = false;
            let lineNumbers = false;
            const cleanArgs = [];

            for (const arg of args) {
                if (arg.startsWith('-') && arg.length > 1) {
                    if (arg.includes('i')) ignoreCase = true;
                    if (arg.includes('v')) invertMatch = true;
                    if (arg.includes('c')) countOnly = true;
                    if (arg.includes('n')) lineNumbers = true;
                } else {
                    cleanArgs.push(arg);
                }
            }

            if (cleanArgs.length === 0) return ExecutionResult.error('grep: missing pattern', 2);
            const pattern = cleanArgs[0].replace(/^['"]|['"]$/g, '');
            const files = cleanArgs.slice(1);

            let lines = [];
            if (files.length > 0) {
                for (const file of files) {
                    try {
                        const content = ctx.vfs.readFile(file);
                        content.split('\n').forEach((l, idx) => {
                            lines.push({ text: l, lineNum: idx + 1, source: files.length > 1 ? file : null });
                        });
                    } catch (e) {
                        return ExecutionResult.error(`grep: ${file}: No such file or directory`, 2);
                    }
                }
            } else if (stdin !== null && stdin !== undefined) {
                String(stdin).split('\n').forEach((l, idx) => {
                    lines.push({ text: l, lineNum: idx + 1, source: null });
                });
            } else {
                return ExecutionResult.error('grep: no input provided', 2);
            }

            let regex;
            try {
                regex = new RegExp(pattern, ignoreCase ? 'i' : '');
            } catch (e) {
                return ExecutionResult.error(`grep: invalid regular expression: ${e.message}`, 2);
            }

            const matches = lines.filter(item => {
                const matched = regex.test(item.text);
                return invertMatch ? !matched : matched;
            });

            if (countOnly) {
                return ExecutionResult.ok(String(matches.length));
            }

            const out = matches.map(m => {
                let prefix = '';
                if (m.source) prefix += `${m.source}:`;
                if (lineNumbers) prefix += `${m.lineNum}:`;
                return prefix + m.text;
            }).join('\n');

            return ExecutionResult.ok(out, { matchCount: matches.length });
        }, { description: 'Search text for patterns', usage: 'grep [-i] [-v] [-n] [-c] <pattern> [file...]', category: 'Text' });

        // head
        registry.register('head', (args, stdin, ctx) => {
            let n = 10;
            const files = [];
            for (let i = 0; i < args.length; i++) {
                if (args[i] === '-n' && args[i + 1]) {
                    n = parseInt(args[i + 1], 10) || 10;
                    i++;
                } else if (/^-\d+$/.test(args[i])) {
                    n = parseInt(args[i].substring(1), 10) || 10;
                } else {
                    files.push(args[i]);
                }
            }

            let text = '';
            if (files.length > 0) {
                try {
                    text = ctx.vfs.readFile(files[0]);
                } catch (e) {
                    return ExecutionResult.error(`head: cannot open '${files[0]}': No such file`, 1);
                }
            } else if (stdin !== null && stdin !== undefined) {
                text = String(stdin);
            } else {
                return ExecutionResult.error('head: missing input', 1);
            }

            const lines = text.split('\n').slice(0, n);
            return ExecutionResult.ok(lines.join('\n'));
        }, { description: 'Output the first part of files', usage: 'head [-n lines] [file]', category: 'Text' });

        // tail
        registry.register('tail', (args, stdin, ctx) => {
            let n = 10;
            const files = [];
            for (let i = 0; i < args.length; i++) {
                if (args[i] === '-n' && args[i + 1]) {
                    n = parseInt(args[i + 1], 10) || 10;
                    i++;
                } else if (/^-\d+$/.test(args[i])) {
                    n = parseInt(args[i].substring(1), 10) || 10;
                } else {
                    files.push(args[i]);
                }
            }

            let text = '';
            if (files.length > 0) {
                try {
                    text = ctx.vfs.readFile(files[0]);
                } catch (e) {
                    return ExecutionResult.error(`tail: cannot open '${files[0]}': No such file`, 1);
                }
            } else if (stdin !== null && stdin !== undefined) {
                text = String(stdin);
            } else {
                return ExecutionResult.error('tail: missing input', 1);
            }

            const allLines = text.split('\n');
            const lines = allLines.slice(Math.max(0, allLines.length - n));
            return ExecutionResult.ok(lines.join('\n'));
        }, { description: 'Output the last part of files', usage: 'tail [-n lines] [file]', category: 'Text' });

        // wc
        registry.register('wc', (args, stdin, ctx) => {
            let showL = false, showW = false, showC = false;
            const files = [];
            for (const a of args) {
                if (a.startsWith('-') && a.length > 1) {
                    if (a.includes('l')) showL = true;
                    if (a.includes('w')) showW = true;
                    if (a.includes('c') || a.includes('m')) showC = true;
                } else {
                    files.push(a);
                }
            }
            if (!showL && !showW && !showC) {
                showL = true; showW = true; showC = true;
            }

            let text = '';
            let label = '';
            if (files.length > 0) {
                try {
                    text = ctx.vfs.readFile(files[0]);
                    label = files[0];
                } catch (e) {
                    return ExecutionResult.error(`wc: ${files[0]}: No such file`, 1);
                }
            } else if (stdin !== null && stdin !== undefined) {
                text = String(stdin);
            } else {
                return ExecutionResult.error('wc: missing input', 1);
            }

            const lines = text.length === 0 ? 0 : text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
            const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
            const bytes = text.length;

            const res = [];
            if (showL) res.push(String(lines).padStart(6));
            if (showW) res.push(String(words).padStart(6));
            if (showC) res.push(String(bytes).padStart(6));
            if (label) res.push(label);

            return ExecutionResult.ok(res.join(' '));
        }, { description: 'Print newline, word, and byte counts for each file', usage: 'wc [-l] [-w] [-c] [file]', category: 'Text' });

        // sort
        registry.register('sort', (args, stdin, ctx) => {
            const reverse = args.includes('-r');
            const numeric = args.includes('-n');
            const files = args.filter(a => !a.startsWith('-'));

            let text = '';
            if (files.length > 0) {
                try {
                    text = ctx.vfs.readFile(files[0]);
                } catch (e) {
                    return ExecutionResult.error(`sort: cannot read '${files[0]}': No such file`, 2);
                }
            } else if (stdin !== null && stdin !== undefined) {
                text = String(stdin);
            }

            const lines = text.split('\n').filter(Boolean);
            lines.sort((a, b) => {
                if (numeric) {
                    const na = parseFloat(a) || 0;
                    const nb = parseFloat(b) || 0;
                    return na - nb;
                }
                return a.localeCompare(b);
            });
            if (reverse) lines.reverse();
            return ExecutionResult.ok(lines.join('\n'));
        }, { description: 'Sort lines of text files', usage: 'sort [-r] [-n] [file]', category: 'Text' });

        // uniq
        registry.register('uniq', (args, stdin, ctx) => {
            let countOnly = args.includes('-c');
            const files = args.filter(a => !a.startsWith('-'));

            let text = '';
            if (files.length > 0) {
                try {
                    text = ctx.vfs.readFile(files[0]);
                } catch (e) {
                    return ExecutionResult.error(`uniq: cannot read '${files[0]}': No such file`, 1);
                }
            } else if (stdin !== null && stdin !== undefined) {
                text = String(stdin);
            }

            const lines = text.split('\n');
            const out = [];
            let lastLine = null;
            let count = 0;

            for (const l of lines) {
                if (l === lastLine) {
                    count++;
                } else {
                    if (lastLine !== null) {
                        out.push(countOnly ? `${String(count).padStart(7)} ${lastLine}` : lastLine);
                    }
                    lastLine = l;
                    count = 1;
                }
            }
            if (lastLine !== null) {
                out.push(countOnly ? `${String(count).padStart(7)} ${lastLine}` : lastLine);
            }

            return ExecutionResult.ok(out.join('\n'));
        }, { description: 'Report or omit repeated lines', usage: 'uniq [-c] [file]', category: 'Text' });

        // cut
        registry.register('cut', (args, stdin, ctx) => {
            let delimiter = '\t';
            let field = 1;
            const files = [];

            for (let i = 0; i < args.length; i++) {
                if (args[i] === '-d' && args[i + 1]) {
                    delimiter = args[i + 1];
                    i++;
                } else if (args[i] === '-f' && args[i + 1]) {
                    field = parseInt(args[i + 1], 10) || 1;
                    i++;
                } else if (!args[i].startsWith('-')) {
                    files.push(args[i]);
                }
            }

            let text = '';
            if (files.length > 0) {
                try {
                    text = ctx.vfs.readFile(files[0]);
                } catch (e) {
                    return ExecutionResult.error(`cut: ${files[0]}: No such file`, 1);
                }
            } else if (stdin !== null && stdin !== undefined) {
                text = String(stdin);
            }

            const lines = text.split('\n').map(line => {
                const parts = line.split(delimiter);
                return parts[field - 1] !== undefined ? parts[field - 1] : '';
            });

            return ExecutionResult.ok(lines.join('\n'));
        }, { description: 'Remove sections from each line of files', usage: 'cut [-d delim] [-f field] [file]', category: 'Text' });

        // tr
        registry.register('tr', (args, stdin) => {
            if (args.length < 2 || stdin === null || stdin === undefined) {
                return ExecutionResult.error('tr: missing operand or stdin', 1);
            }
            const set1 = args[0];
            const set2 = args[1];
            let out = String(stdin);

            if (set1 === '[:lower:]' && set2 === '[:upper:]') {
                out = out.toUpperCase();
            } else if (set1 === '[:upper:]' && set2 === '[:lower:]') {
                out = out.toLowerCase();
            } else {
                for (let i = 0; i < set1.length; i++) {
                    const target = set1[i];
                    const replacement = i < set2.length ? set2[i] : set2[set2.length - 1];
                    out = out.split(target).join(replacement);
                }
            }
            return ExecutionResult.ok(out);
        }, { description: 'Translate or delete characters', usage: 'tr <set1> <set2>', category: 'Text' });

        // tee
        registry.register('tee', (args, stdin, ctx) => {
            const content = stdin !== null && stdin !== undefined ? String(stdin) : '';
            const append = args.includes('-a');
            const files = args.filter(a => a !== '-a');

            for (const f of files) {
                try {
                    let existing = '';
                    if (append && ctx.vfs.exists(f)) {
                        existing = ctx.vfs.readFile(f);
                    }
                    ctx.vfs.writeFile(f, existing + content, ctx.user);
                } catch (e) {}
            }
            return ExecutionResult.ok(content);
        }, { description: 'Read from standard input and write to standard output and files', usage: 'tee [-a] [file...]', category: 'Text' });

        // diff
        registry.register('diff', (args, stdin, ctx) => {
            if (args.length < 2) return ExecutionResult.error('diff: missing operand', 2);
            try {
                const f1 = ctx.vfs.readFile(args[0]).split('\n');
                const f2 = ctx.vfs.readFile(args[1]).split('\n');

                let diffOut = '';
                const max = Math.max(f1.length, f2.length);
                for (let i = 0; i < max; i++) {
                    if (f1[i] !== f2[i]) {
                        if (f1[i] !== undefined) diffOut += `< ${f1[i]}\n`;
                        if (f2[i] !== undefined) diffOut += `> ${f2[i]}\n`;
                    }
                }
                return ExecutionResult.ok(diffOut.trimEnd());
            } catch (e) {
                return ExecutionResult.error(`diff: ${e.message}`, 2);
            }
        }, { description: 'Compare files line by line', usage: 'diff <file1> <file2>', category: 'Text' });
    }

    return { register: registerTextCommands };
});
