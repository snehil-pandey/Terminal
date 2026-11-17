/**
 * Panfam-Terminal Central Modular Command Registry
 * Coordinates sub-registries: Filesystem, Text, System, Network, and Developer commands.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        const ExecutionResult = require('./result');
        const FsCommands = require('./fs_commands');
        const TextCommands = require('./text_commands');
        const SysCommands = require('./sys_commands');
        const NetCommands = require('./net_commands');
        const DevCommands = require('./dev_commands');
        module.exports = factory(ExecutionResult, FsCommands, TextCommands, SysCommands, NetCommands, DevCommands);
    } else {
        root.TerminalCommands = factory(
            root.TerminalResult,
            root.TerminalFsCommands,
            root.TerminalTextCommands,
            root.TerminalSysCommands,
            root.TerminalNetCommands,
            root.TerminalDevCommands
        );
    }
})(typeof self !== 'undefined' ? self : this, function (ExecutionResult, FsCommands, TextCommands, SysCommands, NetCommands, DevCommands) {
    'use strict';

    class CommandRegistry {
        constructor(shell) {
            this.shell = shell;
            this.commands = new Map();
            this.registerBuiltins();
        }

        register(name, handler, meta = {}) {
            this.commands.set(name.toLowerCase(), {
                name: name.toLowerCase(),
                handler: handler,
                description: meta.description || '',
                usage: meta.usage || name,
                category: meta.category || 'General'
            });
        }

        get(name) {
            return this.commands.get(name.toLowerCase());
        }

        list() {
            return Array.from(this.commands.values());
        }

        registerBuiltins() {
            // Register domain modules
            if (FsCommands && FsCommands.register) FsCommands.register(this);
            if (TextCommands && TextCommands.register) TextCommands.register(this);
            if (SysCommands && SysCommands.register) SysCommands.register(this);
            if (NetCommands && NetCommands.register) NetCommands.register(this);
            if (DevCommands && DevCommands.register) DevCommands.register(this);

            // help / list
            const helpHandler = () => {
                const list = this.list();
                const categories = {};
                for (const cmd of list) {
                    if (!categories[cmd.category]) categories[cmd.category] = [];
                    categories[cmd.category].push(cmd);
                }

                let out = '=== Panfam Linux Shell Command System ===\n';
                out += 'Full POSIX shell parsing with pipes (|), redirection (>, >>, <), logical operators (&&, ||), and themes.\n\n';

                for (const [cat, cmds] of Object.entries(categories)) {
                    out += `[${cat}]\n`;
                    for (const c of cmds) {
                        const padded = (c.name + '          ').slice(0, 12);
                        out += `  ${padded} ${c.description}\n`;
                    }
                    out += '\n';
                }
                out += 'Type man <command> or <command> --help for detailed synopsis.';
                return ExecutionResult.ok(out);
            };
            this.register('help', helpHandler, { description: 'Display list of available commands', category: 'General' });
            this.register('list', helpHandler, { description: 'Alias for help command', category: 'General' });

            // man
            this.register('man', (args) => {
                if (args.length === 0) return ExecutionResult.error('What manual page do you want? (e.g. man ls)', 1);
                const cmd = this.get(args[0]);
                if (!cmd) return ExecutionResult.error(`No manual entry for ${args[0]}`, 1);
                return ExecutionResult.ok(`NAME\n  ${cmd.name} - ${cmd.description}\n\nSYNOPSIS\n  ${cmd.usage}\n\nCATEGORY\n  ${cmd.category}`);
            }, { description: 'Format and display on-line manual pages', usage: 'man <command>', category: 'General' });

            // clear / cls
            this.register('clear', () => {
                this.shell.clear();
                return ExecutionResult.ok('');
            }, { description: 'Clear terminal screen buffer', usage: 'clear', category: 'General' });
            this.register('cls', () => {
                this.shell.clear();
                return ExecutionResult.ok('');
            }, { description: 'Clear screen (alias)', usage: 'cls', category: 'General' });

            // env / printenv
            const envHandler = (args, stdin, ctx) => {
                let out = '';
                for (const [k, v] of Object.entries(ctx.shell.environment)) {
                    out += `${k}=${v}\n`;
                }
                return ExecutionResult.ok(out.trimEnd());
            };
            this.register('env', envHandler, { description: 'Print environment variables', usage: 'env', category: 'System' });
            this.register('printenv', envHandler, { description: 'Print environment variables', usage: 'printenv', category: 'System' });

            // export
            this.register('export', (args, stdin, ctx) => {
                if (args.length === 0) return envHandler(args, stdin, ctx);
                for (const item of args) {
                    const eqIdx = item.indexOf('=');
                    if (eqIdx !== -1) {
                        const key = item.substring(0, eqIdx).trim();
                        let val = item.substring(eqIdx + 1).trim();
                        val = val.replace(/^['"]|['"]$/g, '');
                        ctx.shell.setEnv(key, val);
                    }
                }
                return ExecutionResult.ok('');
            }, { description: 'Set export attribute for shell variables', usage: 'export KEY=value', category: 'System' });

            // history
            this.register('history', (args, stdin, ctx) => {
                const hist = ctx.shell.getHistory();
                let out = '';
                hist.forEach((cmd, idx) => {
                    out += `${String(idx + 1).padStart(5)}  ${cmd}\n`;
                });
                return ExecutionResult.ok(out.trimEnd());
            }, { description: 'Display command history list', usage: 'history', category: 'General' });

            // theme
            this.register('theme', (args, stdin, ctx) => {
                if (args.length === 0 || args[0] === 'list') {
                    const themes = ctx.shell.themeManager.listThemes();
                    let out = '=== Available Terminal Themes ===\n';
                    out += 'Use theme <name> to switch (persisted across sessions).\n\n';
                    for (const t of themes) {
                        const mark = t.active ? ' * [ACTIVE]' : '';
                        out += `  ${t.id.padEnd(12)} - ${t.name}: ${t.description}${mark}\n`;
                    }
                    return ExecutionResult.ok(out.trimEnd());
                }

                const targetTheme = args[0].toLowerCase();
                try {
                    const theme = ctx.shell.themeManager.apply(targetTheme);
                    ctx.shell.setEnv('THEME', targetTheme);
                    return ExecutionResult.ok(`Switched theme to '${theme.name}' (${targetTheme})`);
                } catch (e) {
                    return ExecutionResult.error(e.message, 1);
                }
            }, { description: 'Switch theme palette (matrix, amber, cyberpunk, dracula, nord, monokai, solarized)', usage: 'theme [list|<theme>]', category: 'Customization' });

            // matrix / engage
            this.register('matrix', (args) => {
                if (args[0] === 'stop' || args[0] === 'abort') {
                    this.shell.stopMatrix();
                    return ExecutionResult.ok('Matrix rain animation halted.');
                }
                this.shell.startMatrix();
                return ExecutionResult.ok('Matrix digital rain started. Type "matrix stop" to halt.');
            }, { description: 'Toggle Matrix canvas visual rain animation', usage: 'matrix [stop]', category: 'Visuals' });

            this.register('engage', (args) => {
                if (args[0] === 'abort') {
                    this.shell.stopMatrix();
                    return ExecutionResult.ok('Matrix rain animation halted.');
                }
                this.shell.startMatrix();
                return ExecutionResult.ok('Engage initiated: Matrix stream running. Type "engage abort" to halt.');
            }, { description: 'Engage matrix simulation (legacy compatibility)', usage: 'engage [abort]', category: 'Visuals' });

            // reset
            this.register('reset', (args, stdin, ctx) => {
                ctx.vfs.reset();
                ctx.shell.clear();
                return ExecutionResult.ok('Terminal and Virtual File System reset to clean defaults.');
            }, { description: 'Reset terminal state and VFS storage to default', usage: 'reset', category: 'System' });
        }
    }

    return CommandRegistry;
});
