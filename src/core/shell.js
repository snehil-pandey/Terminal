/**
 * WebTerminal Shell Engine
 * Linux bash emulation, readline handling, command history, auto-completion, and piping.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        const Security = require('./security');
        const Storage = require('./storage');
        const VirtualFileSystem = require('../fs/vfs');
        const ThemeManager = require('../ui/theme');
        const CommandRegistry = require('../commands/registry');
        module.exports = factory(Security, Storage, VirtualFileSystem, ThemeManager, CommandRegistry);
    } else {
        root.WebTerminalShell = factory(
            root.TerminalSecurity,
            root.TerminalStorage,
            root.VirtualFileSystem,
            root.TerminalTheme,
            root.TerminalCommands
        );
    }
})(typeof self !== 'undefined' ? self : this, function (Security, Storage, VirtualFileSystem, ThemeManager, CommandRegistry) {
    'use strict';

    const HISTORY_COOKIE_KEY = 'cmd_history';
    const MAX_HISTORY = 100;

    class WebTerminalShell {
        constructor(options = {}) {
            this.user = options.user || 'user';
            this.hostname = options.hostname || 'panfam-terminal';
            this.vfs = new VirtualFileSystem();
            this.themeManager = new ThemeManager();
            this.commands = new CommandRegistry(this);
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
            const saved = Storage ? Storage.getItem(HISTORY_COOKIE_KEY) : null;
            if (saved) {
                try {
                    this.history = JSON.parse(saved);
                } catch (e) {
                    this.history = [];
                }
            }
        }

        saveHistory() {
            if (Storage) {
                try {
                    Storage.setItem(HISTORY_COOKIE_KEY, JSON.stringify(this.history.slice(-MAX_HISTORY)));
                } catch (e) {
                    console.warn('History save failed:', e);
                }
            }
        }

        getHistory() {
            return this.history;
        }

        getEnv(key) {
            return this.environment[key] || '';
        }

        setEnv(key, val) {
            this.environment[key] = val;
            if (key === 'THEME') {
                this.themeManager.apply(val);
            }
        }

        /**
         * Formats prompt with current user, host, and path (like bash PS1: [user@box:~/dir]$)
         */
        getPromptText() {
            const displayPath = this.vfs.cwd.startsWith('/home/user')
                ? '~' + this.vfs.cwd.slice('/home/user'.length)
                : this.vfs.cwd;
            return `[${this.user}@${this.hostname}:${displayPath || '/'}]# `;
        }

        getPromptHtml() {
            const displayPath = this.vfs.cwd.startsWith('/home/user')
                ? '~' + this.vfs.cwd.slice('/home/user'.length)
                : this.vfs.cwd;
            return `<c>[${Security.escapeHtml(this.user)}@${Security.escapeHtml(this.hostname)}</c>:<y>${Security.escapeHtml(displayPath || '/')}</y>]<g>$</g> `;
        }

        /**
         * Mount shell to DOM
         */
        mount(outputEl, inputEl) {
            this.outputContainer = outputEl;
            this.inputElement = inputEl;

            // Apply active theme
            this.themeManager.apply(this.themeManager.current);

            // Banner
            this.printBanner();

            // Setup input listener
            this.setupEventListeners();
        }

        printBanner() {
            let banner = '<c>Linux panfam-terminal 6.5.0-35-generic x86_64 WebLinux LTS</c>\n';
            banner += '<w>All system actions, cookies &amp; filesystem are active and injection-hardened.</w>\n';
            banner += '<w>Type <g>help</g> or <g>list</g> to see commands, or <g>theme list</g> to customize.</w>\n';
            this.appendHtml(banner);
        }

        setupEventListeners() {
            if (!this.inputElement) return;

            this.inputElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const line = this.inputElement.value;
                    this.inputElement.value = '';
                    this.executeCommandLine(line);
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
                // Command completion
                const matches = this.commands.list()
                    .map(c => c.name)
                    .filter(name => name.startsWith(currentToken.toLowerCase()));
                if (matches.length === 1) {
                    this.inputElement.value = matches[0] + ' ';
                } else if (matches.length > 1) {
                    this.appendHtml(`\n<w>${matches.join('    ')}</w>\n`);
                }
            } else {
                // Path completion
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
                } catch (e) {
                    // Ignore path lookup errors during tab
                }
            }
        }

        async executeCommandLine(rawLine) {
            const cleanLine = Security.sanitizeInput(rawLine).trim();
            const prompt = this.getPromptHtml();

            if (!cleanLine) {
                this.appendHtml(prompt + '\n');
                return;
            }

            // Save history
            if (this.history[this.history.length - 1] !== cleanLine) {
                this.history.push(cleanLine);
                if (this.history.length > MAX_HISTORY) this.history.shift();
                this.saveHistory();
            }
            this.historyIndex = -1;

            this.appendHtml(prompt + Security.escapeHtml(cleanLine) + '\n');

            // Support semicolons (e.g. `mkdir test; cd test; ls`)
            const statements = cleanLine.split(';').map(s => s.trim()).filter(Boolean);

            for (const stmt of statements) {
                await this.executeSingleStatement(stmt);
            }
        }

        async executeSingleStatement(statement) {
            // Check for output redirection `>` or `>>`
            let redirectFile = null;
            let appendMode = false;
            let cmdSegment = statement;

            if (statement.includes('>>')) {
                const parts = statement.split('>>');
                cmdSegment = parts[0].trim();
                redirectFile = parts[1].trim();
                appendMode = true;
            } else if (statement.includes('>')) {
                const parts = statement.split('>');
                cmdSegment = parts[0].trim();
                redirectFile = parts[1].trim();
                appendMode = false;
            }

            // Support pipes: cmd1 | cmd2 | cmd3
            const pipeSegments = cmdSegment.split('|').map(s => s.trim()).filter(Boolean);
            let pipeData = null;

            for (let i = 0; i < pipeSegments.length; i++) {
                const segment = pipeSegments[i];
                const tokens = this.tokenize(segment);
                if (tokens.length === 0) continue;

                const cmdName = tokens[0].toLowerCase();
                const args = tokens.slice(1);

                const cmd = this.commands.get(cmdName);
                if (!cmd) {
                    this.appendHtml(`<o>bash: ${Security.escapeHtml(cmdName)}: command not found</o>\n`);
                    return;
                }

                try {
                    // Pass pipeData as second argument (stdin)
                    const output = await cmd.handler(args, pipeData);
                    // Pass output to next command in pipeline, strip HTML formatting for downstream stdin
                    if (output !== null && output !== undefined) {
                        pipeData = String(output).replace(/<[^>]*>?/gm, '');
                    } else {
                        pipeData = '';
                    }

                    // If this is the final command in pipeline
                    if (i === pipeSegments.length - 1) {
                        if (output !== null && output !== undefined && output !== '') {
                            if (redirectFile) {
                                const plainText = output.replace(/<[^>]*>?/gm, '');
                                let existing = '';
                                if (appendMode && this.vfs.exists(redirectFile)) {
                                    existing = this.vfs.readFile(redirectFile);
                                    if (existing && !existing.endsWith('\n')) existing += '\n';
                                }
                                this.vfs.writeFile(redirectFile, existing + plainText, this.user);
                            } else {
                                this.appendHtml(output + '\n');
                            }
                        }
                    }
                } catch (err) {
                    this.appendHtml(`<o>Error executing ${Security.escapeHtml(cmdName)}: ${Security.escapeHtml(err.message)}</o>\n`);
                    return;
                }
            }
        }

        /**
         * Safely tokenize command arguments while preserving quotes and avoiding injections
         */
        tokenize(input) {
            const tokens = [];
            let current = '';
            let inQuotes = false;
            let quoteChar = '';

            for (let i = 0; i < input.length; i++) {
                const c = input[i];
                if ((c === '"' || c === "'") && !inQuotes) {
                    inQuotes = true;
                    quoteChar = c;
                } else if (c === quoteChar && inQuotes) {
                    inQuotes = false;
                    quoteChar = '';
                } else if (/\s/.test(c) && !inQuotes) {
                    if (current) {
                        tokens.push(current);
                        current = '';
                    }
                } else {
                    current += c;
                }
            }
            if (current) tokens.push(current);
            return tokens;
        }

        appendHtml(html) {
            if (!this.outputContainer) return;
            const span = document.createElement('span');
            span.innerHTML = html.replace(/\n/g, '<br>');
            this.outputContainer.appendChild(span);

            // Keep the active input prompt positioned comfortably in the upper half of the viewport
            if (this.inputElement) {
                const inputLine = document.getElementById('input-line') || this.inputElement;
                const rect = inputLine.getBoundingClientRect();
                const targetY = window.innerHeight * 0.42; // Stay around 40-45% from top
                const scrollOffset = rect.top + window.scrollY - targetY;
                window.scrollTo({
                    top: Math.max(0, scrollOffset),
                    behavior: 'smooth'
                });
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
