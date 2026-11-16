/**
 * Panfam-Terminal System & Process Commands
 * Commands: uname, hostname, whoami, id, date, uptime, ps, free, top, kill, sleep, chmod, chown
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        const ExecutionResult = require('./result');
        module.exports = factory(ExecutionResult);
    } else {
        root.TerminalSysCommands = factory(root.TerminalResult);
    }
})(typeof self !== 'undefined' ? self : this, function (ExecutionResult) {
    'use strict';

    function registerSysCommands(registry) {
        // whoami
        registry.register('whoami', (args, stdin, ctx) => {
            return ExecutionResult.ok(ctx.user);
        }, { description: 'Print effective userid', usage: 'whoami', category: 'System' });

        // id
        registry.register('id', (args, stdin, ctx) => {
            if (ctx.user === 'root') {
                return ExecutionResult.ok('uid=0(root) gid=0(root) groups=0(root)');
            }
            return ExecutionResult.ok('uid=1000(user) gid=1000(user) groups=1000(user),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev)');
        }, { description: 'Print real and effective user and group IDs', usage: 'id', category: 'System' });

        // hostname
        registry.register('hostname', (args, stdin, ctx) => {
            try {
                return ExecutionResult.ok(ctx.vfs.readFile('/etc/hostname').trim());
            } catch (e) {
                return ExecutionResult.ok('panfam-terminal');
            }
        }, { description: 'Show system hostname', usage: 'hostname', category: 'System' });

        // uname
        registry.register('uname', (args) => {
            if (args.includes('-a') || args.includes('--all')) {
                return ExecutionResult.ok('Linux panfam-terminal 6.5.0-35-generic #36-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux');
            }
            if (args.includes('-r')) return ExecutionResult.ok('6.5.0-35-generic');
            if (args.includes('-m')) return ExecutionResult.ok('x86_64');
            return ExecutionResult.ok('Linux');
        }, { description: 'Print system information', usage: 'uname [-a|-r|-m]', category: 'System' });

        // date
        registry.register('date', () => {
            return ExecutionResult.ok(new Date().toString());
        }, { description: 'Print system date and time', usage: 'date', category: 'System' });

        // uptime
        registry.register('uptime', () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const mins = String(now.getMinutes()).padStart(2, '0');
            return ExecutionResult.ok(` ${hours}:${mins}:00 up 14 days,  3:22,  1 user,  load average: 0.08, 0.03, 0.01`);
        }, { description: 'Tell how long the system has been running', usage: 'uptime', category: 'System' });

        // ps
        registry.register('ps', () => {
            let out = '  PID TTY          TIME CMD\n';
            out += '    1 ?        00:00:01 systemd\n';
            out += '  142 ?        00:00:00 dbus-daemon\n';
            out += '  480 pts/0    00:00:00 bash\n';
            out += '  512 pts/0    00:00:00 ps';
            return ExecutionResult.ok(out);
        }, { description: 'Report a snapshot of the current processes', usage: 'ps', category: 'System' });

        // free
        registry.register('free', (args) => {
            const human = args.includes('-h');
            if (human) {
                return ExecutionResult.ok('               total        used        free      shared  buff/cache   available\nMem:           7.8Gi       1.8Gi       3.9Gi        42Mi       2.1Gi       5.7Gi\nSwap:          2.0Gi          0B       2.0Gi');
            }
            return ExecutionResult.ok('               total        used        free      shared  buff/cache   available\nMem:         8192000     1892400     4352100       43008     2139100     5891200\nSwap:        2097152           0     2097152');
        }, { description: 'Display amount of free and used memory in the system', usage: 'free [-h]', category: 'System' });

        // top
        registry.register('top', () => {
            let out = 'top - 23:45:00 up 14 days,  3:22,  1 user,  load average: 0.08, 0.03, 0.01\n';
            out += 'Tasks:   4 total,   1 running,   3 sleeping,   0 stopped,   0 zombie\n';
            out += '%Cpu(s):  1.2 us,  0.4 sy,  0.0 ni, 98.4 id,  0.0 wa,  0.0 hi,  0.0 si\n';
            out += 'MiB Mem :   8000.0 total,   4250.1 free,   1850.4 used,   2089.5 buff/cache\n\n';
            out += '  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND\n';
            out += '  480 user      20   0   14280   5120   3240 S   0.0   0.1   0:00.12 bash\n';
            out += '    1 root      20   0  168420  12540   8420 S   0.0   0.2   0:01.05 systemd\n';
            out += '  142 root      20   0   12450   4120   2850 S   0.0   0.1   0:00.08 dbus-daemon\n';
            out += '  512 user      20   0   18420   3840   2910 R   0.0   0.0   0:00.01 top';
            return ExecutionResult.ok(out);
        }, { description: 'Display Linux processes in real-time snapshot', usage: 'top', category: 'System' });

        // chmod
        registry.register('chmod', (args, stdin, ctx) => {
            if (args.length < 2) return ExecutionResult.error('chmod: missing operand', 1);
            const mode = args[0];
            const target = args[1];
            try {
                ctx.vfs.chmod(target, mode);
                return ExecutionResult.ok('');
            } catch (e) {
                return ExecutionResult.error(`chmod: ${e.message}`, 1);
            }
        }, { description: 'Change file mode bits', usage: 'chmod <mode> <file>', category: 'System' });

        // chown
        registry.register('chown', (args, stdin, ctx) => {
            if (args.length < 2) return ExecutionResult.error('chown: missing operand', 1);
            const ownership = args[0];
            const target = args[1];
            const parts = ownership.split(':');
            const owner = parts[0];
            const group = parts[1] || null;
            try {
                ctx.vfs.chown(target, owner, group);
                return ExecutionResult.ok('');
            } catch (e) {
                return ExecutionResult.error(`chown: ${e.message}`, 1);
            }
        }, { description: 'Change file owner and group', usage: 'chown <owner[:group]> <file>', category: 'System' });

        // sleep
        registry.register('sleep', async (args) => {
            if (args.length === 0) return ExecutionResult.error('sleep: missing operand', 1);
            const seconds = Math.min(10, Math.max(0.1, parseFloat(args[0]) || 1));
            await new Promise(r => setTimeout(r, seconds * 1000));
            return ExecutionResult.ok('');
        }, { description: 'Delay for a specified amount of time', usage: 'sleep <seconds>', category: 'System' });

        // desktop / gui
        const handleDesktop = (args, stdin, ctx) => {
            if (typeof window !== 'undefined' && window.pfWM) {
                const sub = args[0];
                if (sub === 'off' || sub === 'stop' || sub === 'cli') {
                    window.pfWM.toggleDesktop(false);
                    return ExecutionResult.ok('Switched to Panfam Shell (PFSH) CLI mode.');
                }
                window.pfWM.toggleDesktop(true);
                return ExecutionResult.ok('Launching Panfam OS Interactive Desktop Environment... (Press Ctrl+Alt+D or type "desktop off" to return)');
            }
            return ExecutionResult.ok('Panfam OS Desktop Environment initialized. In headless environment, desktop manager runs in virtual display :0.');
        };
        registry.register('desktop', handleDesktop, { description: 'Launch Panfam OS Interactive Desktop UI', usage: 'desktop [on|off]', category: 'System' });
        registry.register('gui', handleDesktop, { description: 'Launch Panfam OS Interactive Desktop UI', usage: 'gui [on|off]', category: 'System' });
    }

    return { register: registerSysCommands };
});
