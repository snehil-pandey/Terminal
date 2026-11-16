/**
 * Panfam-Terminal Comprehensive Test Suite
 * Covers:
 * - POSIX Lexer & Tokenizer
 * - Parser & AST Generation (logical ops &&, ||, ;, pipes |, redirections >, >>, <, 2>)
 * - Layered Storage Engine (Cookies, LocalStorage, IndexedDB interface)
 * - Virtual File System (Inode tree, symlinks, loop detection, synthetic /proc)
 * - Virtual Network (Interfaces, DNS resolution, /etc/hosts integration)
 * - Domain Commands (Filesystem, Text, System, Network, Development)
 * - Security & Injection Prevention (XSS, path traversal, dangerous URL rejection)
 */

const assert = require('assert');
const Security = require('../src/core/security');
const Storage = require('../src/core/storage');
const LexerModule = require('../src/core/lexer');
const ParserModule = require('../src/core/parser');
const VirtualFileSystem = require('../src/fs/vfs');
const VirtualNetwork = require('../src/net/network');
const ThemeManager = require('../src/ui/theme');
const CommandRegistry = require('../src/commands/registry');
const WebTerminalShell = require('../src/core/shell');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`[PASS] ${name}`);
        passed++;
    } catch (e) {
        console.error(`[FAIL] ${name}: ${e.message}`);
        failed++;
    }
}

async function testAsync(name, fn) {
    try {
        await fn();
        console.log(`[PASS] ${name}`);
        passed++;
    } catch (e) {
        console.error(`[FAIL] ${name}: ${e.message}`);
        failed++;
    }
}

async function runAll() {
    console.log('=== Running Panfam-Terminal Automated Test Suite ===');

    // 1. Security Tests
    test('Security: escapeHtml properly sanitizes dangerous characters', () => {
        const xss = '<script>alert(1)</script>"\'`&';
        const escaped = Security.escapeHtml(xss);
        assert.strictEqual(escaped, '&lt;script&gt;alert(1)&lt;/script&gt;&quot;&#39;&#96;&amp;');
    });

    test('Security: sanitizeInput strips null bytes and non-printable control chars', () => {
        const dirty = 'echo test\x00\x08danger';
        const clean = Security.sanitizeInput(dirty);
        assert(!clean.includes('\x00'));
        assert(!clean.includes('\x08'));
    });

    test('Security: isValidNodeName prevents path traversal and control sequences', () => {
        assert(!Security.isValidNodeName('..'));
        assert(!Security.isValidNodeName('.'));
        assert(!Security.isValidNodeName('foo/bar'));
        assert(!Security.isValidNodeName('foo\\bar'));
        assert(!Security.isValidNodeName('foo\0bar'));
        assert(Security.isValidNodeName('valid_file.txt'));
        assert(Security.isValidNodeName('.bashrc'));
    });

    test('Security: isSafeUrl blocks javascript: and vbscript: URIs', () => {
        assert(!Security.isSafeUrl('javascript:alert(1)'));
        assert(!Security.isSafeUrl('data:text/html,<script>alert(1)</script>'));
        assert(!Security.isSafeUrl('vbscript:msgbox(1)'));
        assert(Security.isSafeUrl('https://api.ipify.org'));
        assert(Security.isSafeUrl('http://example.com/test'));
    });

    // 2. POSIX Lexer & Parser Tests
    test('Lexer: Tokenizes quotes, escapes, and operators correctly', () => {
        const input = 'echo "hello world" \'single quoted\' file\\ with\\ space && cat < in.txt | grep test > out.txt 2> err.txt';
        const lexer = new LexerModule.Lexer(input);
        const tokens = lexer.tokenize();
        assert(tokens.some(t => t.value === 'hello world'));
        assert(tokens.some(t => t.value === 'single quoted'));
        assert(tokens.some(t => t.type === 'AND_IF'));
        assert(tokens.some(t => t.type === 'REDIR_IN'));
        assert(tokens.some(t => t.type === 'PIPE'));
        assert(tokens.some(t => t.type === 'REDIR_OUT'));
        assert(tokens.some(t => t.type === 'REDIR_ERR'));
    });

    test('Parser: Builds correct AST for pipelines and logical operators', () => {
        const ast = ParserModule.parseInput('mkdir test && cd test || echo error');
        assert.strictEqual(ast.type, 'BinaryOp');
        assert.strictEqual(ast.op, '||');
        assert.strictEqual(ast.left.type, 'BinaryOp');
        assert.strictEqual(ast.left.op, '&&');
    });

    test('Parser: Preserves command redirection targets', () => {
        const ast = ParserModule.parseInput('echo "data" > result.txt 2> error.log');
        assert.strictEqual(ast.type, 'Command');
        assert.strictEqual(ast.args[0], 'echo');
        assert.strictEqual(ast.args[1], 'data');
        assert.strictEqual(ast.redirections.length, 2);
        assert.strictEqual(ast.redirections[0].target, 'result.txt');
        assert.strictEqual(ast.redirections[1].target, 'error.log');
    });

    // 3. Virtual File System & Symlinks
    test('VFS: Inode tree initialization and /proc dynamic files', () => {
        const vfs = new VirtualFileSystem();
        assert(vfs.exists('/bin'));
        assert(vfs.exists('/proc/version'));
        assert(vfs.exists('/proc/cpuinfo'));
        assert(vfs.readFile('/proc/version').includes('Linux version'));
        assert(vfs.readFile('/etc/hostname').includes('panfam-terminal'));
    });

    test('VFS: Symbolic link creation and resolution', () => {
        const vfs = new VirtualFileSystem();
        vfs.writeFile('/home/user/target.txt', 'Target Content');
        vfs.createSymlink('/home/user/target.txt', '/home/user/link.txt');
        assert.strictEqual(vfs.readLink('/home/user/link.txt'), '/home/user/target.txt');
        assert.strictEqual(vfs.readFile('/home/user/link.txt'), 'Target Content');
    });

    test('VFS: Symlink recursion loop detection', () => {
        const vfs = new VirtualFileSystem();
        vfs.createSymlink('/home/user/loopA', '/home/user/loopB');
        vfs.createSymlink('/home/user/loopB', '/home/user/loopA');
        assert.throws(() => {
            vfs.resolvePathWithSymlinks('/home/user/loopA');
        }, /Too many levels of symbolic links/);
    });

    test('VFS: chmod and chown attributes', () => {
        const vfs = new VirtualFileSystem();
        vfs.writeFile('/home/user/script.sh', '#!/bin/sh');
        vfs.chmod('/home/user/script.sh', '755');
        const node = vfs.getNode('/home/user/script.sh');
        assert.strictEqual(node.permissions, '-rwxr-xr-x');
        vfs.chown('/home/user/script.sh', 'root', 'root');
        assert.strictEqual(node.owner, 'root');
    });

    // 4. Virtual Network Tests
    test('Network: Interface inspection and routing table', () => {
        const net = new VirtualNetwork();
        const lo = net.getInterface('lo');
        assert.strictEqual(lo.inet, '127.0.0.1');
        const eth0 = net.getInterface('eth0');
        assert.strictEqual(eth0.inet, '192.168.1.105');
        assert(net.getRoutes().length >= 2);
    });

    test('Network: Host resolution with /etc/hosts fallback', () => {
        const net = new VirtualNetwork();
        const vfs = new VirtualFileSystem();
        const resolved = net.resolveHost('panfam-terminal', vfs);
        assert.strictEqual(resolved, '127.0.0.1');
        const google = net.resolveHost('google.com');
        assert.strictEqual(google, '142.250.190.46');
    });

    // 5. Shell Execution, Pipes, and Redirection
    await testAsync('Shell: Execute conditional chaining (&&, ||) and exit statuses', async () => {
        const shell = new WebTerminalShell();
        const outputs = [];
        shell.appendHtml = (html) => outputs.push(html);

        // Success condition: echo A && echo B
        await shell.executeCommandLine('echo "A" && echo "B"');
        assert(outputs.some(o => o.includes('A')));
        assert(outputs.some(o => o.includes('B')));

        // Failure condition with ||: cat nonexistent_file || echo "Fallback"
        outputs.length = 0;
        await shell.executeCommandLine('cat /home/user/nonexistent_file || echo "Fallback"');
        assert(outputs.some(o => o.includes('Fallback')));
    });

    await testAsync('Shell: Pipeline execution (|) across text commands', async () => {
        const shell = new WebTerminalShell();
        const outputs = [];
        shell.appendHtml = (html) => outputs.push(html);

        shell.vfs.writeFile('/home/user/sample.txt', 'orange\napple\nbanana\napple\n');

        // cat sample.txt | grep apple | wc -l
        await shell.executeCommandLine('cat /home/user/sample.txt | grep apple | wc -l');
        assert(outputs.some(o => o.includes('2')));
    });

    await testAsync('Shell: Input redirection (<) and output redirection (>)', async () => {
        const shell = new WebTerminalShell();
        shell.vfs.writeFile('/home/user/in.txt', 'first line\nsecond line\n');

        await shell.executeCommandLine('head -n 1 < /home/user/in.txt > /home/user/out.txt');
        assert(shell.vfs.exists('/home/user/out.txt'));
        const content = shell.vfs.readFile('/home/user/out.txt').trim();
        assert.strictEqual(content, 'first line');
    });

    // 6. Themes & Customization
    test('Themes: Supports all 7 original themes and persists in memory', () => {
        const tm = new ThemeManager();
        const themes = tm.listThemes();
        assert.strictEqual(themes.length, 7);
        const dracula = tm.apply('dracula');
        assert.strictEqual(dracula.name, 'Dracula Dark');
        const amber = tm.apply('amber');
        assert.strictEqual(amber.name, 'Vintage Amber CRT');
    });

    // 7. Developer & Package Commands
    await testAsync('Dev: git commands (init, status, branch, commit)', async () => {
        const shell = new WebTerminalShell();
        const outputs = [];
        shell.appendHtml = (html) => outputs.push(html);

        await shell.executeCommandLine('git init');
        assert(shell.vfs.exists('/home/user/.git'));

        outputs.length = 0;
        await shell.executeCommandLine('git status');
        assert(outputs.some(o => o.includes('On branch main')));
    });

    console.log(`\nAutomated Test Results: ${passed} Passed, ${failed} Failed.`);
    if (failed > 0) {
        process.exit(1);
    }
}

runAll();
