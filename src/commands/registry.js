/**
 * WebTerminal Modular Command Registry
 * Contains built-in Linux and system commands with strict parameter checking.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        const Security = require('../core/security');
        module.exports = factory(Security);
    } else {
        root.TerminalCommands = factory(root.TerminalSecurity);
    }
})(typeof self !== 'undefined' ? self : this, function (Security) {
    'use strict';

    class CommandRegistry {
        constructor(shell) {
            this.shell = shell;
            this.commands = new Map();
            this.registerDefaults();
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

        registerDefaults() {
            // help / list
            const helpHandler = (args) => {
                const list = this.list();
                const categories = {};
                for (const cmd of list) {
                    if (!categories[cmd.category]) categories[cmd.category] = [];
                    categories[cmd.category].push(cmd);
                }

                let out = '<y>=== WebLinux Shell Command System ===</y>\n';
                out += '<w>Commands support standard Linux flags, pipes, arguments, and theme switching.</w>\n\n';

                for (const [cat, cmds] of Object.entries(categories)) {
                    out += `<c>[${Security.escapeHtml(cat)}]</c>\n`;
                    for (const c of cmds) {
                        const padded = (c.name + '          ').slice(0, 12);
                        out += `  <g>${Security.escapeHtml(padded)}</g> <w>${Security.escapeHtml(c.description)}</w>\n`;
                    }
                    out += '\n';
                }
                out += '<w>Type <g>man &lt;command&gt;</g> or <g>&lt;command&gt; --help</g> for usage details.</w>';
                return out;
            };
            this.register('help', helpHandler, { description: 'Display list of available commands', category: 'General' });
            this.register('list', helpHandler, { description: 'Alias for help command', category: 'General' });

            // man
            this.register('man', (args) => {
                if (args.length === 0) return '<o>What manual page do you want? (e.g. man ls)</o>';
                const cmd = this.get(args[0]);
                if (!cmd) return `<o>No manual entry for ${Security.escapeHtml(args[0])}</o>`;
                return `<y>NAME</y>\n  ${cmd.name} - ${Security.escapeHtml(cmd.description)}\n\n<y>SYNOPSIS</y>\n  <g>${Security.escapeHtml(cmd.usage)}</g>`;
            }, { description: 'Format and display on-line manual pages', usage: 'man <command>', category: 'General' });

            // clear / cls
            this.register('clear', () => {
                this.shell.clear();
                return null;
            }, { description: 'Clear the terminal screen', usage: 'clear', category: 'General' });
            this.register('cls', () => {
                this.shell.clear();
                return null;
            }, { description: 'Clear screen (Windows/DOS alias)', usage: 'cls', category: 'General' });

            // pwd
            this.register('pwd', () => {
                return Security.escapeHtml(this.shell.vfs.cwd);
            }, { description: 'Print name of current/working directory', usage: 'pwd', category: 'Filesystem' });

            // tty
            this.register('tty', () => {
                return '/dev/pts/0';
            }, { description: 'Print the file name of the terminal connected to standard input', usage: 'tty', category: 'System' });

            // whoami
            this.register('whoami', () => {
                return Security.escapeHtml(this.shell.user);
            }, { description: 'Print effective userid', usage: 'whoami', category: 'System' });

            // id
            this.register('id', () => {
                if (this.shell.user === 'root') {
                    return 'uid=0(root) gid=0(root) groups=0(root)';
                }
                return 'uid=1000(user) gid=1000(user) groups=1000(user),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev)';
            }, { description: 'Print real and effective user and group IDs', usage: 'id', category: 'System' });

            // hostname
            this.register('hostname', () => {
                try {
                    return Security.escapeHtml(this.shell.vfs.readFile('/etc/hostname').trim());
                } catch (e) {
                    return 'panfam-terminal';
                }
            }, { description: 'Show system hostname', usage: 'hostname', category: 'System' });

            // uname
            this.register('uname', (args) => {
                if (args.includes('-a') || args.includes('--all')) {
                    return 'Linux panfam-terminal 6.5.0-35-generic #36-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux';
                }
                if (args.includes('-r')) return '6.5.0-35-generic';
                if (args.includes('-m')) return 'x86_64';
                return 'Linux';
            }, { description: 'Print system information', usage: 'uname [-a|-r|-m]', category: 'System' });

            // date
            this.register('date', () => {
                return Security.escapeHtml(new Date().toString());
            }, { description: 'Print system date and time', usage: 'date', category: 'System' });

            // uptime
            this.register('uptime', () => {
                const now = new Date();
                const hours = String(now.getHours()).padStart(2, '0');
                const mins = String(now.getMinutes()).padStart(2, '0');
                return ` ${hours}:${mins}:00 up 14 days,  3:22,  1 user,  load average: 0.08, 0.03, 0.01`;
            }, { description: 'Tell how long the system has been running', usage: 'uptime', category: 'System' });

            // ps
            this.register('ps', (args) => {
                let out = '  PID TTY          TIME CMD\n';
                out += '    1 ?        00:00:01 systemd\n';
                out += '  142 ?        00:00:00 dbus-daemon\n';
                out += '  480 pts/0    00:00:00 bash\n';
                out += '  512 pts/0    00:00:00 ps';
                return `<w>${Security.escapeHtml(out)}</w>`;
            }, { description: 'Report a snapshot of the current processes', usage: 'ps [aux]', category: 'System' });

            // ls
            this.register('ls', (args) => {
                let showAll = false;
                let longFormat = false;
                let targetPath = '.';

                for (const arg of args) {
                    if (arg.startsWith('-')) {
                        if (arg.includes('a')) showAll = true;
                        if (arg.includes('l')) longFormat = true;
                    } else {
                        targetPath = arg;
                    }
                }

                try {
                    const resolved = this.shell.vfs.resolvePath(targetPath);
                    const node = this.shell.vfs.getNode(resolved);
                    if (!node) return `<o>ls: cannot access '${Security.escapeHtml(targetPath)}': No such file or directory</o>`;

                    if (node.type === 'file') {
                        if (longFormat) {
                            return `<w>${node.permissions} 1 ${node.owner} ${node.group} ${String(node.content.length).padStart(5)} ${node.modified.slice(0, 10)} </w><g>${Security.escapeHtml(node.name)}</g>`;
                        }
                        return `<g>${Security.escapeHtml(node.name)}</g>`;
                    }

                    let children = Object.values(node.children);
                    if (!showAll) {
                        children = children.filter(c => !c.name.startsWith('.'));
                    }

                    if (longFormat) {
                        let out = `total ${children.length}\n`;
                        if (showAll) {
                            out += `<c>drwxr-xr-x 2 ${node.owner} ${node.group}  4096 ${node.modified.slice(0,10)} .</c>\n`;
                            out += `<c>drwxr-xr-x 4 root root  4096 ${node.modified.slice(0,10)} ..</c>\n`;
                        }
                        for (const item of children) {
                            const isDir = item.type === 'dir';
                            const colorTag = isDir ? 'c' : 'w';
                            const size = isDir ? 4096 : (item.content ? item.content.length : 0);
                            out += `<w>${item.permissions} 1 ${item.owner} ${item.group} ${String(size).padStart(5)} ${item.modified.slice(0, 10)} </w><${colorTag}>${Security.escapeHtml(item.name)}${isDir ? '/' : ''}</${colorTag}>\n`;
                        }
                        return out.trimEnd();
                    } else {
                        const items = children.map(item => {
                            return item.type === 'dir'
                                ? `<c>${Security.escapeHtml(item.name)}/</c>`
                                : `<w>${Security.escapeHtml(item.name)}</w>`;
                        });
                        return items.join('   ');
                    }
                } catch (e) {
                    return `<o>ls: ${Security.escapeHtml(e.message)}</o>`;
                }
            }, { description: 'List directory contents', usage: 'ls [-a] [-l] [path]', category: 'Filesystem' });

            // cd
            this.register('cd', (args) => {
                const target = args[0] || '/home/user';
                try {
                    this.shell.vfs.changeDir(target);
                    return null;
                } catch (e) {
                    return `<o>${Security.escapeHtml(e.message)}</o>`;
                }
            }, { description: 'Change the shell working directory', usage: 'cd [dir]', category: 'Filesystem' });

            // cat
            this.register('cat', (args) => {
                if (args.length === 0) return '<o>cat: missing operand</o>';
                let out = '';
                for (const file of args) {
                    try {
                        const content = this.shell.vfs.readFile(file);
                        out += Security.escapeHtml(content) + '\n';
                    } catch (e) {
                        out += `<o>cat: ${Security.escapeHtml(file)}: No such file or directory</o>\n`;
                    }
                }
                return out.trimEnd();
            }, { description: 'Concatenate files and print on the standard output', usage: 'cat <file...>', category: 'Filesystem' });

            // echo
            this.register('echo', (args) => {
                const raw = args.join(' ');
                // Safe handling of environment variables like $USER, $HOME
                const replaced = raw.replace(/\$([A-Z_]+)/g, (_, varName) => {
                    return this.shell.getEnv(varName) || '';
                });
                return Security.escapeHtml(replaced);
            }, { description: 'Write arguments to the standard output', usage: 'echo [text...]', category: 'General' });

            // mkdir
            this.register('mkdir', (args) => {
                if (args.length === 0) return '<o>mkdir: missing operand</o>';
                const recursive = args.includes('-p');
                const targets = args.filter(a => a !== '-p');
                for (const target of targets) {
                    try {
                        this.shell.vfs.makeDir(target, recursive, this.shell.user);
                    } catch (e) {
                        return `<o>${Security.escapeHtml(e.message)}</o>`;
                    }
                }
                return null;
            }, { description: 'Make directories', usage: 'mkdir [-p] <directory...>', category: 'Filesystem' });

            // touch
            this.register('touch', (args) => {
                if (args.length === 0) return '<o>touch: missing file operand</o>';
                for (const filename of args) {
                    try {
                        if (this.shell.vfs.exists(filename)) {
                            // Touch updates timestamp
                            const node = this.shell.vfs.getNode(filename);
                            if (node) node.modified = new Date().toISOString();
                            this.shell.vfs.save();
                        } else {
                            this.shell.vfs.writeFile(filename, '', this.shell.user);
                        }
                    } catch (e) {
                        return `<o>${Security.escapeHtml(e.message)}</o>`;
                    }
                }
                return null;
            }, { description: 'Change file timestamps or create empty file', usage: 'touch <file...>', category: 'Filesystem' });

            // rm
            this.register('rm', (args) => {
                if (args.length === 0) return '<o>rm: missing operand</o>';
                const recursive = args.includes('-r') || args.includes('-rf') || args.includes('-R');
                const targets = args.filter(a => !a.startsWith('-'));
                for (const target of targets) {
                    try {
                        this.shell.vfs.remove(target, recursive);
                    } catch (e) {
                        return `<o>${Security.escapeHtml(e.message)}</o>`;
                    }
                }
                return null;
            }, { description: 'Remove files or directories', usage: 'rm [-r] <file...>', category: 'Filesystem' });

            // env / printenv
            const envHandler = () => {
                let out = '';
                const env = this.shell.environment;
                for (const [k, v] of Object.entries(env)) {
                    out += `<g>${Security.escapeHtml(k)}</g>=<w>${Security.escapeHtml(v)}</w>\n`;
                }
                return out.trimEnd();
            };
            this.register('env', envHandler, { description: 'Print environment variables', usage: 'env', category: 'System' });
            this.register('printenv', envHandler, { description: 'Print all or part of environment', usage: 'printenv', category: 'System' });

            // export
            this.register('export', (args) => {
                if (args.length === 0) return envHandler();
                for (const item of args) {
                    const eqIdx = item.indexOf('=');
                    if (eqIdx !== -1) {
                        const key = item.substring(0, eqIdx).trim();
                        let val = item.substring(eqIdx + 1).trim();
                        // Strip quotes
                        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                            val = val.slice(1, -1);
                        }
                        this.shell.setEnv(key, val);
                    }
                }
                return null;
            }, { description: 'Set export attribute for shell variables', usage: 'export KEY=value', category: 'System' });

            // history
            this.register('history', () => {
                const history = this.shell.getHistory();
                let out = '';
                history.forEach((cmd, idx) => {
                    const num = String(idx + 1).padStart(5, ' ');
                    out += `<w>${num}  ${Security.escapeHtml(cmd)}</w>\n`;
                });
                return out.trimEnd();
            }, { description: 'Display command history list', usage: 'history', category: 'General' });

            // theme
            this.register('theme', (args) => {
                if (args.length === 0 || args[0] === 'list') {
                    const themes = this.shell.themeManager.listThemes();
                    let out = '<y>=== Available Terminal Themes ===</y>\n';
                    out += '<w>Use </w><g>theme &lt;name&gt;</g><w> to switch (persisted in cookies).\n\n</w>';
                    for (const t of themes) {
                        const activeMark = t.active ? '<g> * [ACTIVE]</g>' : '';
                        out += `  <c>${t.id.padEnd(12)}</c> - <w>${t.name}</w>: ${t.description}${activeMark}\n`;
                    }
                    return out.trimEnd();
                }

                const targetTheme = args[0].toLowerCase();
                try {
                    const theme = this.shell.themeManager.apply(targetTheme);
                    this.shell.setEnv('THEME', targetTheme);
                    return `<g>Successfully switched theme to '${theme.name}' (${targetTheme})</g>`;
                } catch (e) {
                    return `<o>${Security.escapeHtml(e.message)}</o>`;
                }
            }, { description: 'List or switch visual shell themes (matrix, amber, cyberpunk, dracula, nord, monokai, solarized)', usage: 'theme [list|<theme_name>]', category: 'Customization' });

            // curl / fetch (sanitized)
            this.register('curl', async (args) => {
                if (args.length === 0) return '<o>curl: try \'curl --help\' or \'curl &lt;url&gt;\'</o>';
                const url = args[args.length - 1];
                if (!Security.isSafeUrl(url)) {
                    return `<o>curl: (3) URL rejected: Only HTTP/HTTPS protocols allowed</o>`;
                }

                try {
                    const res = await fetch(url);
                    const text = await res.text();
                    // Limit output size to prevent DOM freezing
                    const truncated = text.length > 2000 ? text.substring(0, 2000) + '\n... [truncated]' : text;
                    return Security.escapeHtml(truncated);
                } catch (e) {
                    return `<o>curl: (6) Could not resolve host or network error: ${Security.escapeHtml(e.message)}</o>`;
                }
            }, { description: 'Transfer data from or to a server securely', usage: 'curl <url>', category: 'Network' });

            // ping
            this.register('ping', (args) => {
                if (args.length === 0) return '<o>ping: usage error: Destination address required</o>';
                const host = Security.escapeHtml(args[0]);
                let out = `PING ${host} (93.184.216.34) 56(84) bytes of data.\n`;
                out += `64 bytes from 93.184.216.34: icmp_seq=1 ttl=56 time=18.4 ms\n`;
                out += `64 bytes from 93.184.216.34: icmp_seq=2 ttl=56 time=19.1 ms\n`;
                out += `64 bytes from 93.184.216.34: icmp_seq=3 ttl=56 time=18.7 ms\n`;
                out += `--- ${host} ping statistics ---\n`;
                out += `3 packets transmitted, 3 received, 0% packet loss, time 2003ms`;
                return `<w>${out}</w>`;
            }, { description: 'Send ICMP ECHO_REQUEST to network hosts', usage: 'ping <host>', category: 'Network' });

            // ifconfig / ip
            this.register('ifconfig', () => {
                let out = 'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n';
                out += '        inet 192.168.1.105  netmask 255.255.255.0  broadcast 192.168.1.255\n';
                out += '        inet6 fe80::a00:27ff:fe4e:66a1  prefixlen 64  scopeid 0x20<link>\n';
                out += '        ether 08:00:27:4e:66:a1  txqueuelen 1000  (Ethernet)\n\n';
                out += 'lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n';
                out += '        inet 127.0.0.1  netmask 255.0.0.0\n';
                out += '        loop  txqueuelen 1000  (Local Loopback)';
                return `<w>${Security.escapeHtml(out)}</w>`;
            }, { description: 'Configure a network interface', usage: 'ifconfig', category: 'Network' });

            // cookies - examine stored cookies
            this.register('cookies', (args) => {
                if (typeof document === 'undefined') return 'No document cookies available.';
                if (args[0] === 'clear') {
                    const cookies = document.cookie.split(';');
                    for (let c of cookies) {
                        const eq = c.indexOf('=');
                        const name = eq > -1 ? c.substr(0, eq).trim() : c.trim();
                        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;';
                    }
                    return '<g>All terminal cookies cleared.</g>';
                }
                const raw = document.cookie;
                if (!raw) return '<w>No cookies currently stored for this session.</w>';
                const parts = raw.split(';').map(p => p.trim());
                let out = '<y>=== Active Session Cookies ===</y>\n';
                parts.forEach(p => {
                    const [k, v] = p.split('=');
                    out += `  <c>${Security.escapeHtml(decodeURIComponent(k))}</c>: <w>${Security.escapeHtml(decodeURIComponent(v || '').slice(0, 80))}</w>\n`;
                });
                out += '\n<w>Type <g>cookies clear</g> to reset all session cookies.</w>';
                return out.trimEnd();
            }, { description: 'View or clear active session cookies', usage: 'cookies [clear]', category: 'System' });

            // matrix / engage
            this.register('matrix', (args) => {
                if (args[0] === 'stop' || args[0] === 'abort') {
                    this.shell.stopMatrix();
                    return '<g>Matrix rain animation halted.</g>';
                }
                this.shell.startMatrix();
                return '<g>Matrix digital rain started. Type "matrix stop" to halt.</g>';
            }, { description: 'Trigger or halt Matrix digital rain visual canvas', usage: 'matrix [stop]', category: 'Visuals' });

            this.register('engage', (args) => {
                if (args[0] === 'abort') {
                    this.shell.stopMatrix();
                    return '<g>Matrix rain animation halted.</g>';
                }
                this.shell.startMatrix();
                return '<g>Engage initiated: Matrix stream running. Type "engage abort" to halt.</g>';
            }, { description: 'Engage matrix simulation (legacy compatibility)', usage: 'engage [abort]', category: 'Visuals' });

            // grep
            this.register('grep', (args, stdin) => {
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

                if (cleanArgs.length === 0) {
                    return '<o>grep: missing pattern</o>';
                }

                let pattern = cleanArgs[0];
                if ((pattern.startsWith('"') && pattern.endsWith('"')) || (pattern.startsWith("'") && pattern.endsWith("'"))) {
                    pattern = pattern.slice(1, -1);
                }

                let linesToSearch = [];
                const files = cleanArgs.slice(1);

                if (files.length > 0) {
                    for (const file of files) {
                        try {
                            const content = this.shell.vfs.readFile(file);
                            const fileLines = content.split('\n');
                            fileLines.forEach((l, idx) => {
                                linesToSearch.push({ line: l, lineNum: idx + 1, source: files.length > 1 ? file : null });
                            });
                        } catch (e) {
                            return `<o>grep: ${Security.escapeHtml(file)}: No such file or directory</o>`;
                        }
                    }
                } else if (stdin !== null && stdin !== undefined) {
                    const stdinLines = String(stdin).split('\n');
                    stdinLines.forEach((l, idx) => {
                        linesToSearch.push({ line: l, lineNum: idx + 1, source: null });
                    });
                } else {
                    return '<o>grep: no input provided</o>';
                }

                let flags = ignoreCase ? 'i' : '';
                let regex;
                try {
                    regex = new RegExp(pattern, flags);
                } catch (e) {
                    return `<o>grep: invalid regular expression: ${Security.escapeHtml(e.message)}</o>`;
                }

                const matches = linesToSearch.filter(item => {
                    const matched = regex.test(item.line);
                    return invertMatch ? !matched : matched;
                });

                if (countOnly) {
                    return String(matches.length);
                }

                if (matches.length === 0) return null;

                let out = '';
                for (const m of matches) {
                    let prefix = '';
                    if (m.source) prefix += `<c>${Security.escapeHtml(m.source)}:</c>`;
                    if (lineNumbers) prefix += `<g>${m.lineNum}:</g>`;
                    
                    let lineContent = Security.escapeHtml(m.line);
                    if (!invertMatch) {
                        const hlRegex = new RegExp(`(${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, ignoreCase ? 'gi' : 'g');
                        lineContent = lineContent.replace(hlRegex, '<y><b>$1</b></y>');
                    }
                    out += `${prefix}${lineContent}\n`;
                }
                return out.trimEnd();
            }, { description: 'Search text for patterns', usage: 'grep [-i] [-v] [-n] [-c] <pattern> [file...]', category: 'Text' });

            // head
            this.register('head', (args, stdin) => {
                let linesCount = 10;
                let files = [];
                for (let i = 0; i < args.length; i++) {
                    if (args[i] === '-n' && args[i + 1]) {
                        linesCount = parseInt(args[i + 1], 10) || 10;
                        i++;
                    } else if (args[i].startsWith('-') && /^\-\d+$/.test(args[i])) {
                        linesCount = parseInt(args[i].substring(1), 10) || 10;
                    } else {
                        files.push(args[i]);
                    }
                }

                let text = '';
                if (files.length > 0) {
                    try {
                        text = this.shell.vfs.readFile(files[0]);
                    } catch (e) {
                        return `<o>head: cannot open '${Security.escapeHtml(files[0])}': No such file</o>`;
                    }
                } else if (stdin !== null && stdin !== undefined) {
                    text = String(stdin);
                } else {
                    return '<o>head: missing file operand</o>';
                }

                const lines = text.split('\n').slice(0, linesCount);
                return Security.escapeHtml(lines.join('\n'));
            }, { description: 'Output the first part of files', usage: 'head [-n lines] [file]', category: 'Text' });

            // tail
            this.register('tail', (args, stdin) => {
                let linesCount = 10;
                let files = [];
                for (let i = 0; i < args.length; i++) {
                    if (args[i] === '-n' && args[i + 1]) {
                        linesCount = parseInt(args[i + 1], 10) || 10;
                        i++;
                    } else if (args[i].startsWith('-') && /^\-\d+$/.test(args[i])) {
                        linesCount = parseInt(args[i].substring(1), 10) || 10;
                    } else {
                        files.push(args[i]);
                    }
                }

                let text = '';
                if (files.length > 0) {
                    try {
                        text = this.shell.vfs.readFile(files[0]);
                    } catch (e) {
                        return `<o>tail: cannot open '${Security.escapeHtml(files[0])}': No such file</o>`;
                    }
                } else if (stdin !== null && stdin !== undefined) {
                    text = String(stdin);
                } else {
                    return '<o>tail: missing file operand</o>';
                }

                const allLines = text.split('\n');
                const lines = allLines.slice(Math.max(0, allLines.length - linesCount));
                return Security.escapeHtml(lines.join('\n'));
            }, { description: 'Output the last part of files', usage: 'tail [-n lines] [file]', category: 'Text' });

            // wc
            this.register('wc', (args, stdin) => {
                let showLines = false;
                let showWords = false;
                let showBytes = false;
                const files = [];

                for (const arg of args) {
                    if (arg.startsWith('-') && arg.length > 1) {
                        if (arg.includes('l')) showLines = true;
                        if (arg.includes('w')) showWords = true;
                        if (arg.includes('c') || arg.includes('m')) showBytes = true;
                    } else {
                        files.push(arg);
                    }
                }

                if (!showLines && !showWords && !showBytes) {
                    showLines = true;
                    showWords = true;
                    showBytes = true;
                }

                let text = '';
                let label = '';
                if (files.length > 0) {
                    try {
                        text = this.shell.vfs.readFile(files[0]);
                        label = files[0];
                    } catch (e) {
                        return `<o>wc: ${Security.escapeHtml(files[0])}: No such file</o>`;
                    }
                } else if (stdin !== null && stdin !== undefined) {
                    text = String(stdin);
                } else {
                    return '<o>wc: missing input</o>';
                }

                const lines = text.length === 0 ? 0 : text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
                const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
                const bytes = text.length;

                const parts = [];
                if (showLines) parts.push(String(lines).padStart(6));
                if (showWords) parts.push(String(words).padStart(6));
                if (showBytes) parts.push(String(bytes).padStart(6));
                if (label) parts.push(label);

                return `<w>${Security.escapeHtml(parts.join(' '))}</w>`;
            }, { description: 'Print newline, word, and byte counts for each file', usage: 'wc [-l] [-w] [-c] [file]', category: 'Text' });

            // reset
            this.register('reset', () => {
                this.shell.vfs.reset();
                this.shell.clear();
                return '<g>Terminal and Virtual File System reset to clean defaults.</g>';
            }, { description: 'Reset the terminal state and VFS cookies to default', usage: 'reset', category: 'System' });
        }
    }

    return CommandRegistry;
});
