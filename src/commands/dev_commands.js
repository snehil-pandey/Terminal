/**
 * Panfam-Terminal Developer & Package Commands
 * Commands: git, apt, tar, base64, sha256sum
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        const ExecutionResult = require('./result');
        module.exports = factory(ExecutionResult);
    } else {
        root.TerminalDevCommands = factory(root.TerminalResult);
    }
})(typeof self !== 'undefined' ? self : this, function (ExecutionResult) {
    'use strict';

    function registerDevCommands(registry) {
        // git (coherent simulated Git repository operations)
        registry.register('git', (args, stdin, ctx) => {
            const sub = args[0];
            if (!sub || sub === 'help' || sub === '--help') {
                return ExecutionResult.ok('usage: git [--version] [--help] <command> [<args>]\n\nSupported commands:\n   init       Create an empty Git repository\n   status     Show the working tree status\n   add        Add file contents to the index\n   commit     Record changes to the repository\n   branch     List, create, or delete branches\n   checkout   Switch branches or restore files\n   log        Show commit logs');
            }

            const gitDir = ctx.vfs.resolvePath('.git');
            const hasGit = ctx.vfs.exists(gitDir);

            if (sub === 'init') {
                if (hasGit) return ExecutionResult.ok(`Reinitialized existing Git repository in ${gitDir}/`);
                ctx.vfs.makeDir('.git/objects', true, ctx.user);
                ctx.vfs.makeDir('.git/refs/heads', true, ctx.user);
                ctx.vfs.writeFile('.git/HEAD', 'ref: refs/heads/main\n', ctx.user);
                ctx.vfs.writeFile('.git/index', '[]', ctx.user);
                ctx.vfs.writeFile('.git/commits', '[]', ctx.user);
                return ExecutionResult.ok(`Initialized empty Git repository in ${gitDir}/`);
            }

            if (!hasGit) {
                return ExecutionResult.error('fatal: not a git repository (or any of the parent directories): .git', 128);
            }

            if (sub === 'status') {
                let out = 'On branch main\n';
                out += 'No commits yet\n\n';
                out += 'Untracked files:\n  (use "git add <file>..." to include in what will be committed)\n';
                try {
                    const entries = ctx.vfs.readDir('.');
                    entries.filter(e => e.name !== '.git').forEach(e => {
                        out += `\t${e.name}\n`;
                    });
                } catch (e) {}
                out += '\nnothing added to commit but untracked files present';
                return ExecutionResult.ok(out);
            }

            if (sub === 'add') {
                return ExecutionResult.ok('');
            }

            if (sub === 'commit') {
                const mIdx = args.indexOf('-m');
                const msg = mIdx !== -1 && args[mIdx + 1] ? args[mIdx + 1] : 'Commit update';
                const now = new Date().toISOString();
                const hash = Math.random().toString(16).substring(2, 9);
                return ExecutionResult.ok(`[main (root-commit) ${hash}] ${msg}\n 1 file changed, 1 insertion(+)`);
            }

            if (sub === 'branch') {
                return ExecutionResult.ok('* main');
            }

            if (sub === 'log') {
                return ExecutionResult.ok(`commit a189eaed399f720151b22251f7fae2215cd6e2c3 (HEAD -> main)\nAuthor: Snehil Pandey <panfam@local>\nDate:   ${new Date().toUTCString()}\n\n    Initial commit on panfam-terminal`);
            }

            return ExecutionResult.error(`git: '${sub}' is not a git command. See 'git --help'.`, 1);
        }, { description: 'The stupid content tracker', usage: 'git <command> [<args>]', category: 'Development' });

        // apt / apt-get
        const aptHandler = (args, stdin, ctx) => {
            const sub = args[0];
            if (!sub) return ExecutionResult.ok('apt 2.6.1 (x86_64)\nUsage: apt [options] command\n\nCommands: update, install, remove, list');

            if (sub === 'update') {
                let out = 'Hit:1 http://archive.panfam.org/ubuntu jammy InRelease\n';
                out += 'Get:2 http://archive.panfam.org/ubuntu jammy-updates InRelease [115 kB]\n';
                out += 'Fetched 115 kB in 1s (115 kB/s)\n';
                out += 'Reading package lists... Done\n';
                out += 'Building dependency tree... Done\n';
                out += 'All packages are up to date.';
                return ExecutionResult.ok(out);
            }

            if (sub === 'install') {
                if (args.length < 2) return ExecutionResult.error('apt: missing package name', 1);
                const pkg = args[1];
                let out = `Reading package lists... Done\n`;
                out += `Building dependency tree... Done\n`;
                out += `The following NEW packages will be installed:\n  ${pkg}\n`;
                out += `0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.\n`;
                out += `Unpacking ${pkg} (1.0.0-panfam) ...\n`;
                out += `Setting up ${pkg} (1.0.0-panfam) ...`;
                return ExecutionResult.ok(out);
            }

            if (sub === 'list') {
                return ExecutionResult.ok('Listing... Done\nbash/jammy 5.2.15-2 amd64 [installed]\ncoreutils/jammy 9.1-1 amd64 [installed]\ngit/jammy 2.39.2-1 amd64 [installed]\nvim/jammy 9.0.1378-1 amd64 [installed]');
            }

            return ExecutionResult.ok(`apt: simulated action completed for '${sub}'`);
        };
        registry.register('apt', aptHandler, { description: 'Command-line package manager', usage: 'apt [update|install|list]', category: 'Package' });
        registry.register('apt-get', aptHandler, { description: 'APT package handling utility', usage: 'apt-get [update|install]', category: 'Package' });

        // base64
        registry.register('base64', (args, stdin) => {
            const decode = args.includes('-d');
            let content = '';
            const files = args.filter(a => a !== '-d');

            if (stdin !== null && stdin !== undefined) {
                content = String(stdin);
            } else if (files.length > 0) {
                content = files[0];
            } else {
                return ExecutionResult.error('base64: missing input', 1);
            }

            try {
                if (decode) {
                    if (typeof atob !== 'undefined') {
                        return ExecutionResult.ok(atob(content.trim()));
                    }
                    return ExecutionResult.ok(Buffer.from(content.trim(), 'base64').toString('utf-8'));
                } else {
                    if (typeof btoa !== 'undefined') {
                        return ExecutionResult.ok(btoa(content));
                    }
                    return ExecutionResult.ok(Buffer.from(content).toString('base64'));
                }
            } catch (e) {
                return ExecutionResult.error(`base64: invalid input: ${e.message}`, 1);
            }
        }, { description: 'Encode or decode base64 data and print to standard output', usage: 'base64 [-d] [string]', category: 'Development' });

        // sha256sum
        registry.register('sha256sum', (args, stdin, ctx) => {
            const target = args[0] || 'stdin';
            let str = '';
            if (args.length > 0) {
                try {
                    str = ctx.vfs.readFile(args[0]);
                } catch (e) {
                    return ExecutionResult.error(`sha256sum: ${args[0]}: No such file`, 1);
                }
            } else if (stdin !== null && stdin !== undefined) {
                str = String(stdin);
            } else {
                return ExecutionResult.error('sha256sum: missing input', 1);
            }

            // Pseudo-hash generation for simulated environment
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash |= 0;
            }
            const hex = Math.abs(hash).toString(16).padStart(64, 'a4b8c9d0');
            return ExecutionResult.ok(`${hex.slice(0, 64)}  ${target}`);
        }, { description: 'Compute and check SHA256 message digest', usage: 'sha256sum [file]', category: 'Development' });
    }

    return { register: registerDevCommands };
});
