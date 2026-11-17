/**
 * Panfam-Terminal Reconstructed Shell Engine
 * Integrates:
 * - POSIX Parser & Lexer (supporting pipes, redirections, logical ops: &&, ||, ;)
 * - Execution Context & Command Registry
 * - Output Virtualization & DOM Sanitization
 * - Command History, Navigation & Tab Completion
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        const Security = require('./security');
        const Storage = require('./storage');
        const Parser = require('./parser');
        const VirtualFileSystem = require('../fs/vfs');
        const VirtualNetwork = require('../net/network');
        const ThemeManager = require('../ui/theme');
        const CommandRegistry = require('../commands/registry');
        module.exports = factory(Security, Storage, Parser, VirtualFileSystem, VirtualNetwork, ThemeManager, CommandRegistry);
    } else {
        root.WebTerminalShell = factory(
            root.TerminalSecurity,
            root.TerminalStorage,
            root.TerminalParser,
            root.VirtualFileSystem,
            root.VirtualNetwork,
            root.TerminalTheme,
            root.TerminalCommands
        );
    }
})(typeof self !== 'undefined' ? self : this, function (Security, Storage, ParserModule, VirtualFileSystem, VirtualNetwork, ThemeManager, CommandRegistry) {
    'use strict';

    const HISTORY_KEY = 'cmd_history';
    const MAX_HISTORY = 200;

    class WebTerminalShell {
        constructor(options = {}) {
            this.user = options.user || 'user';
            this.hostname = options.hostname || 'panfam-terminal';

            // Support injection of authoritative system services or fallback gracefully
            if (options.services) {
                this.services = options.services;
                this.vfs = options.services.vfs;
                this.network = options.services.network;
                this.kernel = options.services.kernel;
                this.processManager = options.services.processManager;
                this.themeManager = options.services.themeManager || new ThemeManager();
            } else {
                this.vfs = options.vfs || new VirtualFileSystem();
                this.network = options.network || new VirtualNetwork();
                this.themeManager = options.themeManager || new ThemeManager();
                this.kernel = options.kernel || null;
                this.processManager = options.processManager || null;
            }

            this.commands = new CommandRegistry(this);
            this.lastExitCode = 0;

            this.environment = {
                'USER': this.user,
                'HOME': '/home/user',
                'SHELL': '/bin/bash',
                'TERM': 'xterm-256color',
                'PATH': '/usr/local/bin:/usr/bin:/bin',
                'LANG': 'en_US.UTF-8',
                'THEME': this.themeManager.current
            };

            this.history = [];
            this.historyIndex = -1;
            this.outputContainer = null;
            this.inputElement = null;
            this.matrixAnimationId = null;

            this.loadHistory();
        }

        loadHistory() {
            const saved = Storage ? Storage.getItem(HISTORY_KEY) : null;
            if (saved) {
                try {
                    this.history = typeof saved === 'string' ? JSON.parse(saved) : saved;
                } catch (e) {
                    this.history = [];
                }
            }
        }

        saveHistory() {
            if (Storage) {
                try {
                    Storage.setItem(HISTORY_KEY, JSON.stringify(this.history.slice(-MAX_HISTORY)));
                } catch (e) {}
            }
        }

        getHistory() {
            return this.history;
        }

        getEnv(key) {
            if (key === '?') return String(this.lastExitCode);
            return this.environment[key] || '';
        }

        setEnv(key, val) {
            this.environment[key] = val;
            if (key === 'THEME') {
                this.themeManager.apply(val);
            }
        }

        getPromptHtml() {
            const displayPath = this.vfs.cwd.startsWith('/home/user')
                ? '~' + this.vfs.cwd.slice('/home/user'.length)
                : this.vfs.cwd;
            return `<c>[${Security.escapeHtml(this.user)}@${Security.escapeHtml(this.hostname)}</c>:<y>${Security.escapeHtml(displayPath || '/')}</y>]<g>$</g> `;
        }

        mount(outputEl, inputEl) {
            this.outputContainer = outputEl;
            this.inputElement = inputEl;

            this.themeManager.apply(this.themeManager.current);
            this.printBanner();
            this.setupEventListeners();
        }

        printBanner() {
            let banner = '<c>Linux panfam-terminal 6.5.0-35-generic x86_64 Panfam Linux LTS</c>\n';
            banner += '<w>POSIX-compliant shell AST, persistent VFS &amp; 7 visual themes enabled.</w>\n';
            banner += '<w>Type <g>help</g> or <g>list</g> for commands, or <g>theme list</g> to customize.</w>\n';
            this.appendHtml(banner);
        }

        setupEventListeners() {
            if (!this.inputElement) return;

            let isExecuting = false;

            this.inputElement.addEventListener('keydown', async (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (isExecuting) return; // Prevent double trigger / interleaved execution
                    const line = this.inputElement.value;
                    this.inputElement.value = '';
                    isExecuting = true;
                    try {
                        await this.executeCommandLine(line);
                    } finally {
                        isExecuting = false;
                    }
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (this.history.length > 0) {
                        if (this.historyIndex === -1) {
                            this.historyIndex = this.history.length - 1;
                        } else if (this.historyIndex > 0) {
                            this.historyIndex--;
                        }
                        this.inputElement.value = this.history[this.historyIndex] || '';
                    }
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (this.historyIndex !== -1) {
                        if (this.historyIndex < this.history.length - 1) {
                            this.historyIndex++;
                            this.inputElement.value = this.history[this.historyIndex] || '';
                        } else {
                            this.historyIndex = -1;
                            this.inputElement.value = '';
                        }
                    }
                } else if (e.key === 'Tab') {
                    e.preventDefault();
                    this.handleTabCompletion();
                } else if (e.ctrlKey && e.key === 'l') {
                    e.preventDefault();
                    this.clear();
                } else if (e.ctrlKey && e.key === 'c') {
                    e.preventDefault();
                    this.appendHtml(this.getPromptHtml() + Security.escapeHtml(this.inputElement.value) + '^C\n');
                    this.inputElement.value = '';
                }
            });
        }

        handleTabCompletion() {
            const raw = this.inputElement.value;
            const parts = raw.split(/\s+/);
            const currentToken = parts[parts.length - 1];

            if (parts.length === 1) {
                const matches = this.commands.list()
                    .map(c => c.name)
                    .filter(name => name.startsWith(currentToken.toLowerCase()));
                if (matches.length === 1) {
                    this.inputElement.value = matches[0] + ' ';
                } else if (matches.length > 1) {
                    this.appendHtml(`\n<w>${matches.join('    ')}</w>\n`);
                }
            } else {
                try {
                    let dirPath = '.';
                    let filePrefix = currentToken;
                    if (currentToken.includes('/')) {
                        const lastSlash = currentToken.lastIndexOf('/');
                        dirPath = currentToken.substring(0, lastSlash) || '/';
                        filePrefix = currentToken.substring(lastSlash + 1);
                    }
                    const entries = this.vfs.readDir(dirPath);
                    const matches = entries
                        .filter(e => e.name.startsWith(filePrefix))
                        .map(e => e.name + (e.type === 'dir' ? '/' : ''));

                    if (matches.length === 1) {
                        const prefix = dirPath === '.' ? '' : (dirPath.endsWith('/') ? dirPath : dirPath + '/');
                        parts[parts.length - 1] = prefix + matches[0];
                        this.inputElement.value = parts.join(' ');
                    } else if (matches.length > 1) {
                        this.appendHtml(`\n<w>${matches.join('    ')}</w>\n`);
                    }
                } catch (e) {}
            }
        }

        async executeCommandLine(rawLine) {
            const cleanLine = Security.sanitizeInput(rawLine).trim();
            const prompt = this.getPromptHtml();

            if (!cleanLine) {
                this.appendHtml(prompt + '\n');
                if (typeof this.onPromptChange === 'function') this.onPromptChange();
                return;
            }

            if (this.history[this.history.length - 1] !== cleanLine) {
                this.history.push(cleanLine);
                if (this.history.length > MAX_HISTORY) this.history.shift();
                this.saveHistory();
            }
            this.historyIndex = -1;

            this.appendHtml(prompt + Security.escapeHtml(cleanLine) + '\n');

            try {
                const ast = ParserModule.parseInput(cleanLine);
                if (ast) {
                    const result = await this.executeAstNode(ast);
                    this.lastExitCode = result ? result.exitCode : 0;
                }
            } catch (err) {
                this.appendHtml(`<o>bash: syntax error: ${Security.escapeHtml(err.message)}</o>\n`);
                this.lastExitCode = 2;
            } finally {
                // Instantly update active input prompt label after command completes
                if (typeof this.onPromptChange === 'function') {
                    this.onPromptChange();
                }
            }
        }

        async executeAstNode(node, stdin = null) {
            if (!node) return { exitCode: 0, stdout: '', stderr: '' };

            if (node.type === 'BinaryOp') {
                if (node.op === ';') {
                    await this.executeAstNode(node.left);
                    return await this.executeAstNode(node.right);
                } else if (node.op === '&&') {
                    const leftRes = await this.executeAstNode(node.left);
                    if (leftRes.exitCode === 0 && node.right) {
                        return await this.executeAstNode(node.right);
                    }
                    return leftRes;
                } else if (node.op === '||') {
                    const leftRes = await this.executeAstNode(node.left);
                    if (leftRes.exitCode !== 0 && node.right) {
                        return await this.executeAstNode(node.right);
                    }
                    return leftRes;
                }
            } else if (node.type === 'Pipeline') {
                let currentInput = stdin;
                let lastResult = null;
                for (let i = 0; i < node.commands.length; i++) {
                    const cmdNode = node.commands[i];
                    lastResult = await this.executeCommandNode(cmdNode, currentInput, i === node.commands.length - 1);
                    currentInput = lastResult ? lastResult.stdout : '';
                }
                return lastResult;
            } else if (node.type === 'Command') {
                return await this.executeCommandNode(node, stdin, true);
            }

            return { exitCode: 0, stdout: '', stderr: '' };
        }

        async executeCommandNode(cmdNode, stdin = null, isFinalInPipeline = true) {
            if (!cmdNode || cmdNode.args.length === 0) return { exitCode: 0, stdout: '', stderr: '' };

            const cmdName = cmdNode.args[0].toLowerCase();
            const args = cmdNode.args.slice(1);

            // Handle input redirection (< file)
            let effectiveStdin = stdin;
            for (const r of cmdNode.redirections) {
                if (r.type === '<' && r.target) {
                    try {
                        effectiveStdin = this.vfs.readFile(r.target);
                    } catch (e) {
                        this.appendHtml(`<o>bash: ${Security.escapeHtml(r.target)}: No such file or directory</o>\n`);
                        return { exitCode: 1, stdout: '', stderr: e.message };
                    }
                }
            }

            const cmd = this.commands.get(cmdName);
            if (!cmd) {
                this.appendHtml(`<o>bash: ${Security.escapeHtml(cmdName)}: command not found</o>\n`);
                return { exitCode: 127, stdout: '', stderr: 'command not found' };
            }

            const ctx = {
                shell: this,
                vfs: this.vfs,
                network: this.network,
                user: this.user,
                hostname: this.hostname
            };

            try {
                const res = await cmd.handler(args, effectiveStdin, ctx);
                const stdout = res ? (res.stdout || '') : '';
                const stderr = res ? (res.stderr || '') : '';
                const exitCode = res ? (res.exitCode !== undefined ? res.exitCode : 0) : 0;

                // Handle output redirection (>, >>, 2>)
                let hasStdoutRedir = false;
                for (const r of cmdNode.redirections) {
                    if (r.type === '>' && r.target) {
                        this.vfs.writeFile(r.target, stdout, this.user);
                        hasStdoutRedir = true;
                    } else if (r.type === '>>' && r.target) {
                        let existing = '';
                        if (this.vfs.exists(r.target)) existing = this.vfs.readFile(r.target);
                        this.vfs.writeFile(r.target, existing + stdout, this.user);
                        hasStdoutRedir = true;
                    } else if (r.type === '2>' && r.target) {
                        this.vfs.writeFile(r.target, stderr, this.user);
                    }
                }

                if (stderr) {
                    this.appendHtml(`<o>${Security.escapeHtml(stderr)}</o>\n`);
                }

                if (isFinalInPipeline && !hasStdoutRedir && stdout) {
                    if (res && res.metadata && res.metadata.isHtml) {
                        this.appendHtml(`${Security.sanitizeHtml(stdout)}\n`);
                    } else {
                        this.appendHtml(`<w>${Security.escapeHtml(stdout)}</w>\n`);
                    }
                }

                return { exitCode, stdout, stderr };
            } catch (err) {
                this.appendHtml(`<o>Error executing ${Security.escapeHtml(cmdName)}: ${Security.escapeHtml(err.message)}</o>\n`);
                return { exitCode: 1, stdout: '', stderr: err.message };
            }
        }

        appendHtml(html) {
            if (!this.outputContainer) return;
            const span = document.createElement('span');
            span.innerHTML = html.replace(/\n/g, '<br>');
            this.outputContainer.appendChild(span);

            if (this.inputElement && typeof window !== 'undefined') {
                const termContainer = document.getElementById('terminal-container');
                const inputLine = document.getElementById('input-line') || this.inputElement;
                if (termContainer && inputLine.getBoundingClientRect && termContainer.getBoundingClientRect) {
                    const cRect = termContainer.getBoundingClientRect();
                    const iRect = inputLine.getBoundingClientRect();
                    const targetScroll = termContainer.scrollTop + (iRect.top - cRect.top) - (cRect.height * 0.42);
                    termContainer.scrollTo({
                        top: Math.max(0, targetScroll),
                        behavior: 'smooth'
                    });
                } else if (inputLine.getBoundingClientRect) {
                    const rect = inputLine.getBoundingClientRect();
                    const targetY = window.innerHeight * 0.42;
                    const scrollOffset = rect.top + window.scrollY - targetY;
                    window.scrollTo({
                        top: Math.max(0, scrollOffset),
                        behavior: 'smooth'
                    });
                }
            }
        }

        clear() {
            if (this.outputContainer) {
                this.outputContainer.innerHTML = '';
            }
        }

        startMatrix() {
            const canvas = document.querySelector('canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const chars = '0123456789ABCDEF$#@%&*+';
            const fontSize = 16;
            const columns = Math.floor(canvas.width / fontSize);
            const drops = Array(columns).fill(1);

            if (this.matrixAnimationId) clearInterval(this.matrixAnimationId);

            this.matrixAnimationId = setInterval(() => {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--term-prompt') || '#0f0';
                ctx.font = `${fontSize}px monospace`;

                for (let i = 0; i < drops.length; i++) {
                    const text = chars[Math.floor(Math.random() * chars.length)];
                    ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                        drops[i] = 0;
                    }
                    drops[i]++;
                }
            }, 35);
        }

        stopMatrix() {
            if (this.matrixAnimationId) {
                clearInterval(this.matrixAnimationId);
                this.matrixAnimationId = null;
            }
            const canvas = document.querySelector('canvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.width = 0;
                canvas.height = 0;
            }
        }
    }

    return WebTerminalShell;
});
