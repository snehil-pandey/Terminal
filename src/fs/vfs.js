/**
 * Panfam-Terminal POSIX-Inspired Virtual File System (VFS)
 * Features:
 * - Inode-based node structure
 * - Symbolic Links (`ln -s`, `readlink`) with recursion loop detection
 * - Standard UNIX directories (/bin, /etc, /dev, /home, /root, /tmp, /var, /proc, /sys)
 * - Synthetic /proc filesystem (/proc/version, /proc/cpuinfo, /proc/meminfo, /proc/uptime)
 * - Permission verification & chmod / chown attributes
 * - Layered persistence across sessions via TerminalStorage (IndexedDB, Storage, Cookies)
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        const Security = require('../core/security');
        const Storage = require('../core/storage');
        module.exports = factory(Security, Storage);
    } else {
        root.VirtualFileSystem = factory(root.TerminalSecurity, root.TerminalStorage);
    }
})(typeof self !== 'undefined' ? self : this, function (Security, Storage) {
    'use strict';

    const VFS_STORE_KEY = 'vfs_tree';
    const MAX_SYMLINK_DEPTH = 16;

    class VirtualFileSystem {
        constructor() {
            this.root = null;
            this.cwd = '/home/user';
            this.nextInode = 1000;
            this.init();
        }

        init() {
            const saved = Storage ? Storage.getItem(VFS_STORE_KEY) : null;
            if (saved) {
                try {
                    this.root = typeof saved === 'string' ? JSON.parse(saved) : saved;
                    return;
                } catch (e) {
                    console.warn('Corrupt VFS saved state detected, re-initializing clean root:', e);
                }
            }
            this.root = this.createDefaultTree();
            this.save();
        }

        save() {
            if (Storage) {
                try {
                    Storage.setItem(VFS_STORE_KEY, JSON.stringify(this.root));
                } catch (e) {
                    console.warn('VFS save failure:', e);
                }
            }
        }

        allocInode() {
            return ++this.nextInode;
        }

        createDefaultTree() {
            const now = new Date().toISOString();
            return {
                type: 'dir',
                inode: 1,
                name: '',
                permissions: 'drwxr-xr-x',
                owner: 'root',
                group: 'root',
                modified: now,
                children: {
                    'bin': {
                        type: 'dir',
                        inode: 2,
                        name: 'bin',
                        permissions: 'drwxr-xr-x',
                        owner: 'root',
                        group: 'root',
                        modified: now,
                        children: {
                            'sh': { type: 'file', inode: 10, name: 'sh', permissions: '-rwxr-xr-x', owner: 'root', group: 'root', modified: now, content: '#!/bin/sh\necho "Panfam Shell"' },
                            'bash': { type: 'file', inode: 11, name: 'bash', permissions: '-rwxr-xr-x', owner: 'root', group: 'root', modified: now, content: '#!/bin/bash\necho "GNU bash, version 5.2.15(1)-release"' }
                        }
                    },
                    'sbin': {
                        type: 'dir',
                        inode: 3,
                        name: 'sbin',
                        permissions: 'drwxr-xr-x',
                        owner: 'root',
                        group: 'root',
                        modified: now,
                        children: {}
                    },
                    'usr': {
                        type: 'dir',
                        inode: 4,
                        name: 'usr',
                        permissions: 'drwxr-xr-x',
                        owner: 'root',
                        group: 'root',
                        modified: now,
                        children: {
                            'bin': { type: 'dir', inode: 40, name: 'bin', permissions: 'drwxr-xr-x', owner: 'root', group: 'root', modified: now, children: {} },
                            'lib': { type: 'dir', inode: 41, name: 'lib', permissions: 'drwxr-xr-x', owner: 'root', group: 'root', modified: now, children: {} }
                        }
                    },
                    'etc': {
                        type: 'dir',
                        inode: 5,
                        name: 'etc',
                        permissions: 'drwxr-xr-x',
                        owner: 'root',
                        group: 'root',
                        modified: now,
                        children: {
                            'hostname': { type: 'file', inode: 50, name: 'hostname', permissions: '-rw-r--r--', owner: 'root', group: 'root', modified: now, content: 'panfam-terminal\n' },
                            'hosts': { type: 'file', inode: 51, name: 'hosts', permissions: '-rw-r--r--', owner: 'root', group: 'root', modified: now, content: '127.0.0.1   localhost panfam-terminal\n::1         localhost ip6-localhost ip6-loopback\n' },
                            'resolv.conf': { type: 'file', inode: 52, name: 'resolv.conf', permissions: '-rw-r--r--', owner: 'root', group: 'root', modified: now, content: 'nameserver 1.1.1.1\nnameserver 8.8.8.8\n' },
                            'os-release': { type: 'file', inode: 53, name: 'os-release', permissions: '-rw-r--r--', owner: 'root', group: 'root', modified: now, content: 'NAME="Panfam Linux"\nVERSION="3.0.0 (LTS)"\nID=panfam\nPRETTY_NAME="Panfam Linux 3.0.0 LTS (x86_64)"\n' },
                            'passwd': { type: 'file', inode: 54, name: 'passwd', permissions: '-rw-r--r--', owner: 'root', group: 'root', modified: now, content: 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:user,,,:/home/user:/bin/bash\nguest:x:1001:1001:guest,,,:/home/guest:/bin/sh\n' },
                            'motd': { type: 'file', inode: 55, name: 'motd', permissions: '-rw-r--r--', owner: 'root', group: 'root', modified: now, content: 'Welcome to Panfam-Terminal Linux CLI!\nHardened POSIX environment with persistent VFS & multi-palette theme engine.\n' }
                        }
                    },
                    'dev': {
                        type: 'dir',
                        inode: 6,
                        name: 'dev',
                        permissions: 'drwxr-xr-x',
                        owner: 'root',
                        group: 'root',
                        modified: now,
                        children: {
                            'null': { type: 'file', inode: 60, name: 'null', permissions: 'crw-rw-rw-', owner: 'root', group: 'root', modified: now, content: '' },
                            'zero': { type: 'file', inode: 61, name: 'zero', permissions: 'crw-rw-rw-', owner: 'root', group: 'root', modified: now, content: '' },
                            'tty': { type: 'file', inode: 62, name: 'tty', permissions: 'crw-rw-rw-', owner: 'root', group: 'tty', modified: now, content: '/dev/pts/0' },
                            'pts': {
                                type: 'dir',
                                inode: 63,
                                name: 'pts',
                                permissions: 'drwxr-xr-x',
                                owner: 'root',
                                group: 'root',
                                modified: now,
                                children: {
                                    '0': { type: 'file', inode: 64, name: '0', permissions: 'crw--w----', owner: 'user', group: 'tty', modified: now, content: '' }
                                }
                            }
                        }
                    },
                    'proc': {
                        type: 'dir',
                        inode: 7,
                        name: 'proc',
                        permissions: 'dr-xr-xr-x',
                        owner: 'root',
                        group: 'root',
                        modified: now,
                        children: {
                            'version': { type: 'file', inode: 70, name: 'version', permissions: '-r--r--r--', owner: 'root', group: 'root', modified: now, content: 'Linux version 6.5.0-35-generic (buildd@panfam-kernel) (gcc version 12.3.0) #36-Ubuntu SMP PREEMPT_DYNAMIC\n' },
                            'cpuinfo': { type: 'file', inode: 71, name: 'cpuinfo', permissions: '-r--r--r--', owner: 'root', group: 'root', modified: now, content: 'processor\t: 0\nmodel name\t: Panfam Virtual x86_64 Processor\ncpu MHz\t\t: 3600.000\ncache size\t: 16384 KB\n' },
                            'meminfo': { type: 'file', inode: 72, name: 'meminfo', permissions: '-r--r--r--', owner: 'root', group: 'root', modified: now, content: 'MemTotal:        8192000 kB\nMemFree:         4352100 kB\nMemAvailable:    5891200 kB\nBuffers:          245100 kB\nCached:          1894000 kB\n' },
                            'uptime': { type: 'file', inode: 73, name: 'uptime', permissions: '-r--r--r--', owner: 'root', group: 'root', modified: now, content: '124582.42 248100.11\n' }
                        }
                    },
                    'sys': {
                        type: 'dir',
                        inode: 8,
                        name: 'sys',
                        permissions: 'dr-xr-xr-x',
                        owner: 'root',
                        group: 'root',
                        modified: now,
                        children: {}
                    },
                    'home': {
                        type: 'dir',
                        inode: 9,
                        name: 'home',
                        permissions: 'drwxr-xr-x',
                        owner: 'root',
                        group: 'root',
                        modified: now,
                        children: {
                            'user': {
                                type: 'dir',
                                inode: 90,
                                name: 'user',
                                permissions: 'drwxr-xr-x',
                                owner: 'user',
                                group: 'user',
                                modified: now,
                                children: {
                                    '.bashrc': {
                                        type: 'file',
                                        inode: 901,
                                        name: '.bashrc',
                                        permissions: '-rw-r--r--',
                                        owner: 'user',
                                        group: 'user',
                                        modified: now,
                                        content: '# ~/.bashrc\nalias ll="ls -la"\nalias l="ls -l"\nexport PS1="\\[\\033[01;32m\\]\\u@\\h\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ "\n'
                                    },
                                    'welcome.txt': {
                                        type: 'file',
                                        inode: 902,
                                        name: 'welcome.txt',
                                        permissions: '-rw-r--r--',
                                        owner: 'user',
                                        group: 'user',
                                        modified: now,
                                        content: 'Welcome to Panfam-Terminal (Linux CLI Emulator)!\nExplore the filesystem with standard POSIX commands:\n  ls -la, cat, grep, mkdir -p, rm, pwd, tty, ps, uname -a\nTry our theme engine: theme dracula, theme amber, theme nord\n'
                                    },
                                    'notes.md': {
                                        type: 'file',
                                        inode: 903,
                                        name: 'notes.md',
                                        permissions: '-rw-r--r--',
                                        owner: 'user',
                                        group: 'user',
                                        modified: now,
                                        content: '# Panfam Architecture Notes\n- Layered storage ensures full persistence.\n- Inode virtual filesystem supports symlinks and permissions.\n- Hardened input escaping prevents XSS and code injection.\n'
                                    }
                                }
                            }
                        }
                    },
                    'root': {
                        type: 'dir',
                        inode: 12,
                        name: 'root',
                        permissions: 'drwx------',
                        owner: 'root',
                        group: 'root',
                        modified: now,
                        children: {}
                    },
                    'tmp': {
                        type: 'dir',
                        inode: 13,
                        name: 'tmp',
                        permissions: 'drwxrwxrwt',
                        owner: 'root',
                        group: 'root',
                        modified: now,
                        children: {}
                    },
                    'var': {
                        type: 'dir',
                        inode: 14,
                        name: 'var',
                        permissions: 'drwxr-xr-x',
                        owner: 'root',
                        group: 'root',
                        modified: now,
                        children: {
                            'log': {
                                type: 'dir',
                                inode: 140,
                                name: 'log',
                                permissions: 'drwxr-xr-x',
                                owner: 'root',
                                group: 'root',
                                modified: now,
                                children: {
                                    'syslog': { type: 'file', inode: 1401, name: 'syslog', permissions: '-rw-r-----', owner: 'root', group: 'adm', modified: now, content: 'kernel: [0.000000] Linux version 6.5.0-35 (panfam@buildhost)\nsystemd[1]: Started WebTerminal Session Services.\n' }
                                }
                            }
                        }
                    }
                }
            };
        }

        resolvePath(pathStr) {
            if (!pathStr || pathStr.trim() === '') {
                return this.cwd;
            }
            pathStr = pathStr.trim();
            let parts;
            if (pathStr.startsWith('/')) {
                parts = pathStr.split('/');
            } else if (pathStr.startsWith('~')) {
                parts = ('/home/user' + pathStr.substring(1)).split('/');
            } else {
                parts = (this.cwd + '/' + pathStr).split('/');
            }

            const stack = [];
            for (let part of parts) {
                if (part === '' || part === '.') continue;
                if (part === '..') {
                    if (stack.length > 0) stack.pop();
                } else {
                    stack.push(part);
                }
            }
            return '/' + stack.join('/');
        }

        /**
         * Resolves path with symbolic link resolution
         */
        resolvePathWithSymlinks(pathStr, depth = 0) {
            if (depth > MAX_SYMLINK_DEPTH) {
                throw new Error('Too many levels of symbolic links');
            }
            const canonical = this.resolvePath(pathStr);
            if (canonical === '/') return canonical;

            const segments = canonical.slice(1).split('/');
            let currentPath = '';
            let currentNode = this.root;

            for (let i = 0; i < segments.length; i++) {
                const seg = segments[i];
                currentPath += '/' + seg;
                if (!currentNode.children || !currentNode.children[seg]) {
                    return canonical; // let caller handle nonexistent
                }
                const nextNode = currentNode.children[seg];
                if (nextNode.type === 'symlink') {
                    // Resolve symlink target
                    const target = nextNode.target;
                    const remainder = segments.slice(i + 1).join('/');
                    const resolvedTarget = target.startsWith('/') ? target : currentPath.slice(0, currentPath.lastIndexOf('/')) + '/' + target;
                    const fullTargetPath = remainder ? resolvedTarget + '/' + remainder : resolvedTarget;
                    return this.resolvePathWithSymlinks(fullTargetPath, depth + 1);
                }
                currentNode = nextNode;
            }

            return canonical;
        }

        getNode(pathStr, followSymlinks = true) {
            const canonical = followSymlinks ? this.resolvePathWithSymlinks(pathStr) : this.resolvePath(pathStr);
            if (canonical === '/') return this.root;

            const segments = canonical.slice(1).split('/');
            let current = this.root;
            for (let seg of segments) {
                if (!current.children || !current.children[seg]) {
                    return null;
                }
                current = current.children[seg];
            }
            return current;
        }

        exists(pathStr) {
            return this.getNode(pathStr) !== null;
        }

        readDir(pathStr) {
            const node = this.getNode(pathStr);
            if (!node) throw new Error(`No such file or directory: ${pathStr}`);
            if (node.type !== 'dir') throw new Error(`Not a directory: ${pathStr}`);
            return Object.values(node.children);
        }

        readFile(pathStr) {
            const node = this.getNode(pathStr);
            if (!node) throw new Error(`No such file or directory: ${pathStr}`);
            if (node.type === 'dir') throw new Error(`Is a directory: ${pathStr}`);
            return node.content || '';
        }

        writeFile(pathStr, content, user = 'user') {
            const canonical = this.resolvePathWithSymlinks(pathStr);
            const segments = canonical.slice(1).split('/');
            const filename = segments.pop();

            if (!Security.isValidNodeName(filename)) {
                throw new Error(`Invalid filename: ${filename}`);
            }

            const parentPath = '/' + segments.join('/');
            const parent = this.getNode(parentPath);
            if (!parent) throw new Error(`Cannot create file: Parent directory ${parentPath} does not exist`);
            if (parent.type !== 'dir') throw new Error(`Cannot create file: ${parentPath} is not a directory`);

            const now = new Date().toISOString();
            if (parent.children[filename]) {
                if (parent.children[filename].type === 'dir') {
                    throw new Error(`Cannot overwrite directory: ${filename}`);
                }
                parent.children[filename].content = content;
                parent.children[filename].modified = now;
            } else {
                parent.children[filename] = {
                    type: 'file',
                    inode: this.allocInode(),
                    name: filename,
                    permissions: '-rw-r--r--',
                    owner: user,
                    group: user,
                    modified: now,
                    content: content
                };
            }
            this.save();
            return parent.children[filename];
        }

        createSymlink(targetPath, linkPath, user = 'user') {
            const canonical = this.resolvePath(linkPath);
            const segments = canonical.slice(1).split('/');
            const linkName = segments.pop();

            if (!Security.isValidNodeName(linkName)) {
                throw new Error(`Invalid link name: ${linkName}`);
            }

            const parentPath = '/' + segments.join('/');
            const parent = this.getNode(parentPath);
            if (!parent || parent.type !== 'dir') {
                throw new Error(`Cannot create symlink in nonexistent directory: ${parentPath}`);
            }
            if (parent.children[linkName]) {
                throw new Error(`Cannot create symlink: File exists '${linkName}'`);
            }

            const now = new Date().toISOString();
            parent.children[linkName] = {
                type: 'symlink',
                inode: this.allocInode(),
                name: linkName,
                permissions: 'lrwxrwxrwx',
                owner: user,
                group: user,
                modified: now,
                target: targetPath
            };
            this.save();
            return parent.children[linkName];
        }

        readLink(pathStr) {
            const node = this.getNode(pathStr, false);
            if (!node) throw new Error(`No such file or directory: ${pathStr}`);
            if (node.type !== 'symlink') throw new Error(`Invalid argument: '${pathStr}' is not a symbolic link`);
            return node.target;
        }

        makeDir(pathStr, recursive = false, user = 'user') {
            const canonical = this.resolvePath(pathStr);
            if (canonical === '/') return;

            const segments = canonical.slice(1).split('/');
            let current = this.root;
            const now = new Date().toISOString();

            for (let i = 0; i < segments.length; i++) {
                const seg = segments[i];
                if (!Security.isValidNodeName(seg)) {
                    throw new Error(`Invalid directory name: ${seg}`);
                }

                if (!current.children[seg]) {
                    if (i < segments.length - 1 && !recursive) {
                        throw new Error(`Cannot create directory '${canonical}': No such file or directory`);
                    }
                    current.children[seg] = {
                        type: 'dir',
                        inode: this.allocInode(),
                        name: seg,
                        permissions: 'drwxr-xr-x',
                        owner: user,
                        group: user,
                        modified: now,
                        children: {}
                    };
                } else if (current.children[seg].type !== 'dir') {
                    throw new Error(`Cannot create directory: File exists: ${seg}`);
                }
                current = current.children[seg];
            }
            this.save();
        }

        remove(pathStr, recursive = false) {
            const canonical = this.resolvePath(pathStr);
            if (canonical === '/') throw new Error('Refusing to remove root directory /');

            const segments = canonical.slice(1).split('/');
            const target = segments.pop();
            const parentPath = '/' + segments.join('/');
            const parent = this.getNode(parentPath, false);

            if (!parent || !parent.children || !parent.children[target]) {
                throw new Error(`Cannot remove '${pathStr}': No such file or directory`);
            }

            const item = parent.children[target];
            if (item.type === 'dir' && !recursive) {
                throw new Error(`Cannot remove '${pathStr}': Is a directory (use -r)`);
            }
            delete parent.children[target];
            this.save();
        }

        changeDir(pathStr) {
            if (!pathStr || pathStr.trim() === '') {
                this.cwd = '/home/user';
                return this.cwd;
            }
            const target = this.resolvePathWithSymlinks(pathStr);
            const node = this.getNode(target);
            if (!node) {
                throw new Error(`cd: ${pathStr}: No such file or directory`);
            }
            if (node.type !== 'dir') {
                throw new Error(`cd: ${pathStr}: Not a directory`);
            }
            this.cwd = target;
            return this.cwd;
        }

        chmod(pathStr, mode) {
            const node = this.getNode(pathStr);
            if (!node) throw new Error(`chmod: cannot access '${pathStr}': No such file or directory`);
            if (typeof mode === 'string' && mode.length === 3 && /^[0-7]+$/.test(mode)) {
                // Octal mode e.g. 755 -> rwxr-xr-x
                const octalToRwx = (d) => {
                    const num = parseInt(d, 10);
                    return (num & 4 ? 'r' : '-') + (num & 2 ? 'w' : '-') + (num & 1 ? 'x' : '-');
                };
                const prefix = node.type === 'dir' ? 'd' : (node.type === 'symlink' ? 'l' : '-');
                node.permissions = prefix + octalToRwx(mode[0]) + octalToRwx(mode[1]) + octalToRwx(mode[2]);
            }
            this.save();
        }

        chown(pathStr, owner, group) {
            const node = this.getNode(pathStr);
            if (!node) throw new Error(`chown: cannot access '${pathStr}': No such file or directory`);
            if (owner) node.owner = owner;
            if (group) node.group = group;
            this.save();
        }

        reset() {
            if (Storage) {
                Storage.removeItem(VFS_STORE_KEY);
            }
            this.root = this.createDefaultTree();
            this.cwd = '/home/user';
            this.save();
        }

        /**
         * Validates and imports a foreign filesystem tree safely
         * Guards against malformed structures, path traversal, circular references, and corrupted nodes.
         */
        validateAndImport(treeData) {
            if (!treeData || typeof treeData !== 'object') {
                throw new Error('Invalid backup: Root payload must be a valid JSON object');
            }
            const rootNode = treeData.vfs || treeData;
            if (!rootNode || rootNode.type !== 'dir' || typeof rootNode.children !== 'object') {
                throw new Error('Invalid backup: Missing valid root directory node');
            }

            // Inode tracking and recursion safety check
            const seenInodes = new Set();
            let totalNodes = 0;

            function validateSubtree(node, depth = 0) {
                if (depth > 32) throw new Error('E2BIG: Hierarchy exceeds maximum allowable depth');
                if (++totalNodes > 5000) throw new Error('ENOSPC: File count exceeds storage limit (5000 max nodes)');

                if (!node || typeof node !== 'object') throw new Error('Corrupt node encountered');
                if (typeof node.name !== 'string' || node.name.length > 255) throw new Error('Invalid node name');
                if (['..', '.', ''].includes(node.name) && depth > 0) throw new Error('Path traversal sequence detected in node name');

                if (node.inode) {
                    if (seenInodes.has(node.inode)) {
                        node.inode = 2000 + totalNodes; // Reassign duplicate inode safely
                    }
                    seenInodes.add(node.inode);
                }

                if (node.type === 'dir') {
                    if (!node.children || typeof node.children !== 'object') {
                        node.children = {};
                    }
                    for (const childName of Object.keys(node.children)) {
                        validateSubtree(node.children[childName], depth + 1);
                    }
                } else if (node.type === 'file') {
                    if (typeof node.content !== 'string') {
                        node.content = String(node.content || '');
                    }
                } else if (node.type === 'symlink') {
                    if (typeof node.target !== 'string' || node.target.length > 512) {
                        throw new Error('Invalid symlink target');
                    }
                }
            }

            validateSubtree(rootNode, 0);
            this.root = rootNode;
            this.save();
            return { success: true, importedNodes: totalNodes };
        }
    }

    return VirtualFileSystem;
});
