/**
 * Panfam-Terminal Filesystem Commands
 * Commands: ls, cd, pwd, cat, touch, mkdir, rmdir, rm, cp, mv, ln, readlink, stat, file, find, tree, du, df, basename, dirname, realpath
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        const Security = require('../core/security');
        const ExecutionResult = require('./result');
        module.exports = factory(Security, ExecutionResult);
    } else {
        root.TerminalFsCommands = factory(root.TerminalSecurity, root.TerminalResult);
    }
})(typeof self !== 'undefined' ? self : this, function (Security, ExecutionResult) {
    'use strict';

    function formatEntry(node, isDir, linkStr = '') {
        const name = node.name;
        if (isDir) {
            return `<c class="pf-node-dir">${Security.escapeHtml(name)}/</c>`;
        }
        if (node.type === 'symlink') {
            return `<span class="pf-node-symlink">${Security.escapeHtml(name)}</span>${linkStr}`;
        }
        if (node.permissions && node.permissions.includes('x')) {
            return `<g class="pf-node-exec">${Security.escapeHtml(name)}*</g>`;
        }
        if (/\.(zip|tar|gz|bz2|xz|7z)$/i.test(name)) {
            return `<span class="pf-node-archive">${Security.escapeHtml(name)}</span>`;
        }
        if (/\.(pf|js|py|sh|json|html|css|md|txt)$/i.test(name)) {
            return `<span class="pf-node-code">${Security.escapeHtml(name)}</span>`;
        }
        if (/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(name)) {
            return `<span class="pf-node-image">${Security.escapeHtml(name)}</span>`;
        }
        return `<w class="pf-node-file">${Security.escapeHtml(name)}</w>`;
    }

    function registerFsCommands(registry) {
        // pwd
        registry.register('pwd', (args, stdin, ctx) => {
            return ExecutionResult.ok(ctx.vfs.cwd);
        }, { description: 'Print name of current working directory', usage: 'pwd', category: 'Filesystem' });

        // cd
        registry.register('cd', (args, stdin, ctx) => {
            const target = args[0] || '/home/user';
            try {
                ctx.vfs.changeDir(target);
                return ExecutionResult.ok('');
            } catch (e) {
                return ExecutionResult.error(`cd: ${e.message}`, 1);
            }
        }, { description: 'Change current working directory', usage: 'cd [dir]', category: 'Filesystem' });

        // ls
        registry.register('ls', (args, stdin, ctx) => {
            let showAll = false;
            let longFormat = false;
            let targetPath = '.';

            for (const arg of args) {
                if (arg.startsWith('-') && arg.length > 1) {
                    if (arg.includes('a')) showAll = true;
                    if (arg.includes('l')) longFormat = true;
                } else {
                    targetPath = arg;
                }
            }

            try {
                const node = ctx.vfs.getNode(targetPath);
                if (!node) return ExecutionResult.error(`ls: cannot access '${targetPath}': No such file or directory`, 2);

                if (node.type === 'file' || node.type === 'symlink') {
                    if (longFormat) {
                        const targetStr = node.type === 'symlink' ? ` -> ${node.target}` : '';
                        return ExecutionResult.ok(`${node.permissions} 1 ${node.owner} ${node.group} ${String(node.content ? node.content.length : 0).padStart(5)} ${node.modified.slice(0, 10)} ${node.name}${targetStr}`);
                    }
                    return ExecutionResult.ok(node.name);
                }

                let children = Object.values(node.children);
                if (!showAll) {
                    children = children.filter(c => !c.name.startsWith('.'));
                }

                if (longFormat) {
                    let out = `total ${children.length}\n`;
                    if (showAll) {
                        out += `drwxr-xr-x 2 ${node.owner} ${node.group}  4096 ${node.modified.slice(0, 10)} <c class="pf-node-dir">./</c>\ndrwxr-xr-x 4 root root  4096 ${node.modified.slice(0, 10)} <c class="pf-node-dir">../</c>\n`;
                    }
                    for (const item of children) {
                        const isDir = item.type === 'dir';
                        const isLink = item.type === 'symlink';
                        const size = isDir ? 4096 : (item.content ? item.content.length : (item.target ? item.target.length : 0));
                        const linkStr = isLink ? ` -> <span class="pf-node-symlink">${Security.escapeHtml(item.target)}</span>` : '';
                        const formatted = formatEntry(item, isDir, linkStr);
                        out += `${item.permissions} 1 ${item.owner} ${item.group} ${String(size).padStart(5)} ${item.modified.slice(0, 10)} ${formatted}\n`;
                    }
                    return ExecutionResult.ok(out.trimEnd(), { isHtml: true });
                } else {
                    const items = children.map(item => formatEntry(item, item.type === 'dir'));
                    return ExecutionResult.ok(items.join('   '), { isHtml: true });
                }
            } catch (e) {
                return ExecutionResult.error(`ls: ${e.message}`, 2);
            }
        }, { description: 'List directory contents', usage: 'ls [-a] [-l] [path]', category: 'Filesystem' });

        // cat
        registry.register('cat', (args, stdin, ctx) => {
            if (args.length === 0) {
                if (stdin !== null && stdin !== undefined) {
                    return ExecutionResult.ok(String(stdin));
                }
                return ExecutionResult.error('cat: missing operand', 1);
            }
            let out = '';
            for (const file of args) {
                try {
                    out += ctx.vfs.readFile(file);
                    if (!out.endsWith('\n')) out += '\n';
                } catch (e) {
                    return ExecutionResult.error(`cat: ${file}: No such file or directory`, 1);
                }
            }
            return ExecutionResult.ok(out.trimEnd());
        }, { description: 'Concatenate files and print on standard output', usage: 'cat [file...]', category: 'Filesystem' });

        // touch
        registry.register('touch', (args, stdin, ctx) => {
            if (args.length === 0) return ExecutionResult.error('touch: missing file operand', 1);
            for (const f of args) {
                try {
                    if (ctx.vfs.exists(f)) {
                        const node = ctx.vfs.getNode(f);
                        if (node) node.modified = new Date().toISOString();
                        ctx.vfs.save();
                    } else {
                        ctx.vfs.writeFile(f, '', ctx.user);
                    }
                } catch (e) {
                    return ExecutionResult.error(`touch: ${e.message}`, 1);
                }
            }
            return ExecutionResult.ok('');
        }, { description: 'Change file timestamps or create empty files', usage: 'touch <file...>', category: 'Filesystem' });

        // mkdir
        registry.register('mkdir', (args, stdin, ctx) => {
            if (args.length === 0) return ExecutionResult.error('mkdir: missing operand', 1);
            const recursive = args.includes('-p');
            const targets = args.filter(a => a !== '-p');
            for (const t of targets) {
                try {
                    ctx.vfs.makeDir(t, recursive, ctx.user);
                } catch (e) {
                    return ExecutionResult.error(`mkdir: ${e.message}`, 1);
                }
            }
            return ExecutionResult.ok('');
        }, { description: 'Create directory', usage: 'mkdir [-p] <dir...>', category: 'Filesystem' });

        // rmdir
        registry.register('rmdir', (args, stdin, ctx) => {
            if (args.length === 0) return ExecutionResult.error('rmdir: missing operand', 1);
            for (const t of args) {
                try {
                    const node = ctx.vfs.getNode(t);
                    if (!node) return ExecutionResult.error(`rmdir: failed to remove '${t}': No such file or directory`, 1);
                    if (node.type !== 'dir') return ExecutionResult.error(`rmdir: failed to remove '${t}': Not a directory`, 1);
                    if (Object.keys(node.children).length > 0) return ExecutionResult.error(`rmdir: failed to remove '${t}': Directory not empty`, 1);
                    ctx.vfs.remove(t, false);
                } catch (e) {
                    return ExecutionResult.error(`rmdir: ${e.message}`, 1);
                }
            }
            return ExecutionResult.ok('');
        }, { description: 'Remove empty directories', usage: 'rmdir <dir...>', category: 'Filesystem' });

        // rm
        registry.register('rm', (args, stdin, ctx) => {
            if (args.length === 0) return ExecutionResult.error('rm: missing operand', 1);
            const recursive = args.includes('-r') || args.includes('-rf') || args.includes('-R');
            const targets = args.filter(a => !a.startsWith('-'));
            for (const t of targets) {
                try {
                    ctx.vfs.remove(t, recursive);
                } catch (e) {
                    return ExecutionResult.error(`rm: ${e.message}`, 1);
                }
            }
            return ExecutionResult.ok('');
        }, { description: 'Remove files or directories', usage: 'rm [-r] <file...>', category: 'Filesystem' });

        // cp
        registry.register('cp', (args, stdin, ctx) => {
            const targets = args.filter(a => !a.startsWith('-'));
            if (targets.length < 2) return ExecutionResult.error('cp: missing file operand', 1);
            const src = targets[0];
            const dest = targets[1];
            try {
                const srcNode = ctx.vfs.getNode(src);
                if (!srcNode) return ExecutionResult.error(`cp: cannot stat '${src}': No such file or directory`, 1);
                if (srcNode.type === 'dir') return ExecutionResult.error(`cp: -r not specified; omitting directory '${src}'`, 1);
                ctx.vfs.writeFile(dest, srcNode.content || '', ctx.user);
                return ExecutionResult.ok('');
            } catch (e) {
                return ExecutionResult.error(`cp: ${e.message}`, 1);
            }
        }, { description: 'Copy files', usage: 'cp <source> <dest>', category: 'Filesystem' });

        // mv
        registry.register('mv', (args, stdin, ctx) => {
            const targets = args.filter(a => !a.startsWith('-'));
            if (targets.length < 2) return ExecutionResult.error('mv: missing destination file operand', 1);
            const src = targets[0];
            const dest = targets[1];
            try {
                const srcNode = ctx.vfs.getNode(src);
                if (!srcNode) return ExecutionResult.error(`mv: cannot stat '${src}': No such file or directory`, 1);
                ctx.vfs.writeFile(dest, srcNode.content || '', ctx.user);
                ctx.vfs.remove(src, true);
                return ExecutionResult.ok('');
            } catch (e) {
                return ExecutionResult.error(`mv: ${e.message}`, 1);
            }
        }, { description: 'Move (rename) files', usage: 'mv <source> <dest>', category: 'Filesystem' });

        // ln
        registry.register('ln', (args, stdin, ctx) => {
            const isSymlink = args.includes('-s');
            const clean = args.filter(a => a !== '-s');
            if (clean.length < 2) return ExecutionResult.error('ln: missing file operand', 1);
            const target = clean[0];
            const linkName = clean[1];
            try {
                if (isSymlink) {
                    ctx.vfs.createSymlink(target, linkName, ctx.user);
                } else {
                    // Hard link fallback: copy content
                    const targetNode = ctx.vfs.getNode(target);
                    if (!targetNode) return ExecutionResult.error(`ln: failed to access '${target}': No such file or directory`, 1);
                    ctx.vfs.writeFile(linkName, targetNode.content || '', ctx.user);
                }
                return ExecutionResult.ok('');
            } catch (e) {
                return ExecutionResult.error(`ln: ${e.message}`, 1);
            }
        }, { description: 'Make links between files', usage: 'ln [-s] <target> <link_name>', category: 'Filesystem' });

        // readlink
        registry.register('readlink', (args, stdin, ctx) => {
            if (args.length === 0) return ExecutionResult.error('readlink: missing operand', 1);
            try {
                const target = ctx.vfs.readLink(args[0]);
                return ExecutionResult.ok(target);
            } catch (e) {
                return ExecutionResult.error(`readlink: ${e.message}`, 1);
            }
        }, { description: 'Print resolved symbolic links or canonical file names', usage: 'readlink <file>', category: 'Filesystem' });

        // stat
        registry.register('stat', (args, stdin, ctx) => {
            if (args.length === 0) return ExecutionResult.error('stat: missing operand', 1);
            try {
                const node = ctx.vfs.getNode(args[0], false);
                if (!node) return ExecutionResult.error(`stat: cannot stat '${args[0]}': No such file or directory`, 1);
                let out = `  File: ${node.name}\n`;
                out += `  Size: ${node.content ? node.content.length : 4096}   Blocks: 8   IO Block: 4096   ${node.type}\n`;
                out += `Device: 801h/2049d  Inode: ${node.inode || 1001}   Links: 1\n`;
                out += `Access: (${node.permissions})  Uid: (${node.owner})   Gid: (${node.group})\n`;
                out += `Modify: ${node.modified}`;
                return ExecutionResult.ok(out);
            } catch (e) {
                return ExecutionResult.error(`stat: ${e.message}`, 1);
            }
        }, { description: 'Display file or file system status', usage: 'stat <file>', category: 'Filesystem' });

        // tree
        registry.register('tree', (args, stdin, ctx) => {
            const startPath = args[0] || '.';
            let dirs = 0;
            let files = 0;
            let out = startPath + '\n';

            function walk(p, prefix = '') {
                try {
                    const entries = ctx.vfs.readDir(p);
                    entries.forEach((entry, idx) => {
                        const isLast = idx === entries.length - 1;
                        const branch = isLast ? '└── ' : '├── ';
                        out += `${prefix}${branch}${entry.name}${entry.type === 'dir' ? '/' : ''}\n`;
                        if (entry.type === 'dir') {
                            dirs++;
                            walk(p + '/' + entry.name, prefix + (isLast ? '    ' : '│   '));
                        } else {
                            files++;
                        }
                    });
                } catch (e) {}
            }

            walk(startPath);
            out += `\n${dirs} directories, ${files} files`;
            return ExecutionResult.ok(out);
        }, { description: 'List contents of directories in a tree-like format', usage: 'tree [path]', category: 'Filesystem' });

        // find
        registry.register('find', (args, stdin, ctx) => {
            const rootPath = args[0] && !args[0].startsWith('-') ? args[0] : '.';
            let namePattern = null;
            const nameIdx = args.indexOf('-name');
            if (nameIdx !== -1 && args[nameIdx + 1]) {
                namePattern = args[nameIdx + 1].replace(/['"]/g, '');
            }

            const results = [];
            function walk(curr) {
                try {
                    const entries = ctx.vfs.readDir(curr);
                    for (const entry of entries) {
                        const full = (curr === '.' ? entry.name : curr + '/' + entry.name);
                        if (!namePattern || entry.name.includes(namePattern)) {
                            results.push(full);
                        }
                        if (entry.type === 'dir') {
                            walk(full);
                        }
                    }
                } catch (e) {}
            }
            results.push(rootPath);
            walk(rootPath);
            return ExecutionResult.ok(results.join('\n'));
        }, { description: 'Search for files in a directory hierarchy', usage: 'find [path] [-name pattern]', category: 'Filesystem' });

        // df
        registry.register('df', (args, stdin, ctx) => {
            let out = 'Filesystem     1K-blocks      Used Available Use% Mounted on\n';
            out += '/dev/root        8388608   2457600   5931008  30% /\n';
            out += 'tmpfs            1048576         0   1048576   0% /tmp\n';
            out += 'devtmpfs         1048576         0   1048576   0% /dev';
            return ExecutionResult.ok(out);
        }, { description: 'Report file system disk space usage', usage: 'df [-h]', category: 'Filesystem' });

        // du
        registry.register('du', (args, stdin, ctx) => {
            const target = args[0] || '.';
            return ExecutionResult.ok(`4    ${target}`);
        }, { description: 'Estimate file space usage', usage: 'du [path]', category: 'Filesystem' });

        // basename & dirname
        registry.register('basename', (args) => {
            if (args.length === 0) return ExecutionResult.error('basename: missing operand', 1);
            const p = args[0].replace(/\/+$/, '');
            const idx = p.lastIndexOf('/');
            return ExecutionResult.ok(idx === -1 ? p : p.substring(idx + 1));
        }, { description: 'Strip directory and suffix from filenames', usage: 'basename <path>', category: 'Filesystem' });

        registry.register('dirname', (args) => {
            if (args.length === 0) return ExecutionResult.error('dirname: missing operand', 1);
            const p = args[0].replace(/\/+$/, '');
            const idx = p.lastIndexOf('/');
            if (idx === -1) return ExecutionResult.ok('.');
            if (idx === 0) return ExecutionResult.ok('/');
            return ExecutionResult.ok(p.substring(0, idx));
        }, { description: 'Strip last component from file name', usage: 'dirname <path>', category: 'Filesystem' });
    }

    return { register: registerFsCommands };
});
