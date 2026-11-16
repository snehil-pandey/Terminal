/**
 * WebTerminal Virtual File System (VFS)
 * Realistic Linux hierarchy (/bin, /etc, /home, /var, /tmp, /usr, /dev)
 * Persistent across sessions via TerminalStorage (cookies & storage).
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

    const VFS_COOKIE_KEY = 'vfs_tree';

    class VirtualFileSystem {
        constructor() {
            this.root = null;
            this.cwd = '/home/user';
            this.init();
        }

        /**
         * Initialize VFS with default Unix tree or load from cookies/storage
         */
        init() {
            const saved = Storage ? Storage.getItem(VFS_COOKIE_KEY) : null;
            if (saved) {
                try {
                    this.root = JSON.parse(saved);
                    return;
                } catch (e) {
                    console.warn('Failed parsing saved VFS, reconstructing clean VFS:', e);
                }
            }
            this.root = this.createDefaultTree();
            this.save();
        }

        save() {
            if (Storage) {
                try {
                    Storage.setItem(VFS_COOKIE_KEY, JSON.stringify(this.root));
                } catch (e) {
                    console.error('Error persisting VFS:', e);
                }
            }
        }

        createDefaultTree() {
            const now = new Date().toISOString();
            return {
                type: 'dir',
                name: '',
                permissions: 'drwxr-xr-x',
                owner: 'root',
                group: 'root',
                modified: now,
                children: {
                    'bin': {
                        type: 'dir',
                        name: 'bin',
                        permissions: 'drwxr-xr-x',
                        owner: 'root',
                        group: 'root',
                        modified: now,
                        children: {
                            'sh': { type: 'file', name: 'sh', permissions: '-rwxr-xr-x', owner: 'root', group: 'root', modified: now, content: '#!/bin/sh\necho "Unix Shell Simulator"' },
                            'bash': { type: 'file', name: 'bash', permissions: '-rwxr-xr-x', owner: 'root', group: 'root', modified: now, content: '#!/bin/bash\necho "GNU bash, version 5.2.15"' }
                        }
                    },
                    'etc': {
                        type: 'dir',
                        name: 'etc',
                        permissions: 'drwxr-xr-x',
                        owner: 'root',
                        group: 'root',
                        modified: now,
                        children: {
                            'hostname': { type: 'file', name: 'hostname', permissions: '-rw-r--r--', owner: 'root', group: 'root', modified: now, content: 'panfam-terminal' },
                            'os-release': { type: 'file', name: 'os-release', permissions: '-rw-r--r--', owner: 'root', group: 'root', modified: now, content: 'NAME="WebLinux"\nVERSION="2.4.0-LTS"\nID=weblinux\nPRETTY_NAME="WebLinux 2.4.0 (x86_64)"' },
                            'passwd': { type: 'file', name: 'passwd', permissions: '-rw-r--r--', owner: 'root', group: 'root', modified: now, content: 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:user,,,:/home/user:/bin/bash\nguest:x:1001:1001:guest,,,:/home/guest:/bin/sh' },
                            'motd': { type: 'file', name: 'motd', permissions: '-rw-r--r--', owner: 'root', group: 'root', modified: now, content: 'Welcome to WebTerminal Linux CLI!\nHardened against injections. Full cookie persistence enabled.' }
                        }
                    },
                    'dev': {
                        type: 'dir',
                        name: 'dev',
                        permissions: 'drwxr-xr-x',
                        owner: 'root',
                        group: 'root',
                        modified: now,
                        children: {
                            'null': { type: 'file', name: 'null', permissions: 'crw-rw-rw-', owner: 'root', group: 'root', modified: now, content: '' },
                            'zero': { type: 'file', name: 'zero', permissions: 'crw-rw-rw-', owner: 'root', group: 'root', modified: now, content: '' },
                            'tty': { type: 'file', name: 'tty', permissions: 'crw-rw-rw-', owner: 'root', group: 'tty', modified: now, content: '/dev/pts/0' },
                            'pts': {
                                type: 'dir',
                                name: 'pts',
                                permissions: 'drwxr-xr-x',
                                owner: 'root',
                                group: 'root',
                                modified: now,
                                children: {
                                    '0': { type: 'file', name: '0', permissions: 'crw--w----', owner: 'user', group: 'tty', modified: now, content: '' }
                                }
                            }
                        }
                    },
                    'home': {
                        type: 'dir',
                        name: 'home',
                        permissions: 'drwxr-xr-x',
                        owner: 'root',
                        group: 'root',
                        modified: now,
                        children: {
                            'user': {
                                type: 'dir',
                                name: 'user',
                                permissions: 'drwxr-xr-x',
                                owner: 'user',
                                group: 'user',
                                modified: now,
                                children: {
                                    '.bashrc': { type: 'file', name: '.bashrc', permissions: '-rw-r--r--', owner: 'user', group: 'user', modified: now, content: '# .bashrc\nalias ll="ls -la"\nexport THEME="matrix"\n' },
                                    'welcome.txt': { type: 'file', name: 'welcome.txt', permissions: '-rw-r--r--', owner: 'user', group: 'user', modified: now, content: 'Welcome to your Linux web CLI environment!\nType "help" or "list" to explore available commands.\nTry "theme matrix", "ls -la", "cat /etc/os-release", "ps", "tty", and "env".' },
                                    'notes.md': { type: 'file', name: 'notes.md', permissions: '-rw-r--r--', owner: 'user', group: 'user', modified: now, content: '# Security Notes\n1. All inputs are strictly sanitized.\n2. DOM injection prevented via strict entity escaping.\n3. State is persisted directly into browser cookies with fallback to local storage.' }
                                }
                            }
                        }
                    },
                    'tmp': {
                        type: 'dir',
                        name: 'tmp',
                        permissions: 'drwxrwxrwt',
                        owner: 'root',
                        group: 'root',
                        modified: now,
                        children: {}
                    },
                    'var': {
                        type: 'dir',
                        name: 'var',
                        permissions: 'drwxr-xr-x',
                        owner: 'root',
                        group: 'root',
                        modified: now,
                        children: {
                            'log': {
                                type: 'dir',
                                name: 'log',
                                permissions: 'drwxr-xr-x',
                                owner: 'root',
                                group: 'root',
                                modified: now,
                                children: {
                                    'syslog': { type: 'file', name: 'syslog', permissions: '-rw-r-----', owner: 'root', group: 'adm', modified: now, content: 'kernel: [0.000000] Linux version 2.4.0 (panfam@buildhost)\nsystemd[1]: Started WebTerminal Session Services.' }
                                }
                            }
                        }
                    }
                }
            };
        }

        /**
         * Resolves relative or absolute path string into a canonical absolute path
         * @param {string} pathStr
         * @returns {string}
         */
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
         * Get node at specified path
         * @param {string} pathStr
         * @returns {Object|null}
         */
        getNode(pathStr) {
            const canonical = this.resolvePath(pathStr);
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

        /**
         * Check if path exists
         * @param {string} pathStr
         * @returns {boolean}
         */
        exists(pathStr) {
            return this.getNode(pathStr) !== null;
        }

        /**
         * List directory contents
         * @param {string} pathStr
         * @returns {Array<Object>|null}
         */
        readDir(pathStr) {
            const node = this.getNode(pathStr);
            if (!node) throw new Error(`No such file or directory: ${pathStr}`);
            if (node.type !== 'dir') throw new Error(`Not a directory: ${pathStr}`);
            return Object.values(node.children);
        }

        /**
         * Read file content
         * @param {string} pathStr
         * @returns {string}
         */
        readFile(pathStr) {
            const node = this.getNode(pathStr);
            if (!node) throw new Error(`No such file or directory: ${pathStr}`);
            if (node.type === 'dir') throw new Error(`Is a directory: ${pathStr}`);
            return node.content || '';
        }

        /**
         * Write content to file, creating or overwriting
         * @param {string} pathStr
         * @param {string} content
         * @param {string} user
         */
        writeFile(pathStr, content, user = 'user') {
            const canonical = this.resolvePath(pathStr);
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

        /**
         * Create a directory
         * @param {string} pathStr
         * @param {boolean} recursive (-p)
         * @param {string} user
         */
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

        /**
         * Remove file or directory
         * @param {string} pathStr
         * @param {boolean} recursive (-r)
         */
        remove(pathStr, recursive = false) {
            const canonical = this.resolvePath(pathStr);
            if (canonical === '/') throw new Error('Refusing to remove root directory /');

            const segments = canonical.slice(1).split('/');
            const target = segments.pop();
            const parentPath = '/' + segments.join('/');
            const parent = this.getNode(parentPath);

            if (!parent || !parent.children || !parent.children[target]) {
                throw new Error(`Cannot remove '${pathStr}': No such file or directory`);
            }

            const item = parent.children[target];
            if (item.type === 'dir') {
                if (!recursive) {
                    throw new Error(`Cannot remove '${pathStr}': Is a directory (use -r)`);
                }
            }
            delete parent.children[target];
            this.save();
        }

        /**
         * Change current working directory
         * @param {string} pathStr
         * @returns {string} new cwd
         */
        changeDir(pathStr) {
            if (!pathStr || pathStr.trim() === '') {
                this.cwd = '/home/user';
                return this.cwd;
            }
            const target = this.resolvePath(pathStr);
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

        /**
         * Reset filesystem to clean default
         */
        reset() {
            if (Storage) {
                Storage.removeItem(VFS_COOKIE_KEY);
            }
            this.root = this.createDefaultTree();
            this.cwd = '/home/user';
            this.save();
        }
    }

    return VirtualFileSystem;
});
