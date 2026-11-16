/**
 * WebTerminal Test Suite
 * Validates Security (escaping, sanitization), VFS operations,
 * Storage persistence, Theme management, and Command execution.
 */

const assert = require('assert');
const Security = require('../src/core/security');
const Storage = require('../src/core/storage');
const VirtualFileSystem = require('../src/fs/vfs');
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
    console.log('--- Running WebTerminal Security & Core Tests ---');

    // 1. Security Tests
    test('Security: escapeHtml sanitizes dangerous tags and quotes', () => {
        const xss = '<script>alert(1)</script>"\'`&';
        const escaped = Security.escapeHtml(xss);
        assert.strictEqual(escaped, '&lt;script&gt;alert(1)&lt;/script&gt;&quot;&#39;&#96;&amp;');
    });

    test('Security: sanitizeInput strips null bytes and control chars', () => {
        const dirty = 'echo hello\x00\x08world\x1b[31m';
        const clean = Security.sanitizeInput(dirty);
        assert(!clean.includes('\x00'), 'Should remove null bytes');
        assert(!clean.includes('\x08'), 'Should remove backspace byte');
    });

    test('Security: isValidNodeName prevents path traversal', () => {
        assert(!Security.isValidNodeName('..'));
        assert(!Security.isValidNodeName('.'));
        assert(!Security.isValidNodeName('foo/bar'));
        assert(!Security.isValidNodeName('foo\\bar'));
        assert(!Security.isValidNodeName('foo\0bar'));
        assert(Security.isValidNodeName('valid_file.txt'));
        assert(Security.isValidNodeName('.bashrc'));
    });

    test('Security: isSafeUrl blocks non-http schemes', () => {
        assert(!Security.isSafeUrl('javascript:alert(1)'));
        assert(!Security.isSafeUrl('data:text/html,<script>alert(1)</script>'));
        assert(!Security.isSafeUrl('vbscript:msgbox(1)'));
        assert(Security.isSafeUrl('https://api.ipify.org'));
        assert(Security.isSafeUrl('http://example.com/test'));
    });

    // 2. VFS Tests
    test('VFS: Default tree structure created properly', () => {
        const vfs = new VirtualFileSystem();
        assert(vfs.exists('/bin'));
        assert(vfs.exists('/etc'));
        assert(vfs.exists('/home/user'));
        assert(vfs.exists('/etc/os-release'));
        assert(vfs.readFile('/etc/hostname').includes('panfam-terminal'));
    });

    test('VFS: Path resolution handles relative, ~, and .. correctly', () => {
        const vfs = new VirtualFileSystem();
        vfs.cwd = '/home/user';
        assert.strictEqual(vfs.resolvePath('.'), '/home/user');
        assert.strictEqual(vfs.resolvePath('..'), '/home');
        assert.strictEqual(vfs.resolvePath('../..'), '/');
        assert.strictEqual(vfs.resolvePath('../../..'), '/');
        assert.strictEqual(vfs.resolvePath('~/notes.md'), '/home/user/notes.md');
        assert.strictEqual(vfs.resolvePath('/etc/passwd'), '/etc/passwd');
    });

    test('VFS: File creation, reading, and deletion', () => {
        const vfs = new VirtualFileSystem();
        vfs.writeFile('/home/user/test.txt', 'Hello Cyber Linux');
        assert.strictEqual(vfs.readFile('/home/user/test.txt'), 'Hello Cyber Linux');
        vfs.remove('/home/user/test.txt');
        assert(!vfs.exists('/home/user/test.txt'));
    });

    test('VFS: Directory creation and listing', () => {
        const vfs = new VirtualFileSystem();
        vfs.makeDir('/home/user/projects/web', true);
        assert(vfs.exists('/home/user/projects/web'));
        vfs.writeFile('/home/user/projects/web/app.js', 'console.log("ok");');
        const entries = vfs.readDir('/home/user/projects/web');
        assert.strictEqual(entries.length, 1);
        assert.strictEqual(entries[0].name, 'app.js');
    });

    // 3. Theme Manager Tests
    test('ThemeManager: Theme listing and switching', () => {
        const tm = new ThemeManager();
        const themes = tm.listThemes();
        assert(themes.length >= 6, 'Should support at least 6 themes');
        const amber = tm.apply('amber');
        assert.strictEqual(amber.name, 'Vintage Amber CRT');
        assert.strictEqual(tm.getCurrent().id, 'amber');
        assert.throws(() => tm.apply('non-existent-theme'));
    });

    // 4. Shell & Command Execution Tests
    await testAsync('Shell: Execute Linux commands (pwd, whoami, tty, ls, cat)', async () => {
        const shell = new WebTerminalShell();
        const outputs = [];
        shell.appendHtml = (html) => outputs.push(html);

        // pwd
        await shell.executeSingleStatement('pwd');
        assert(outputs.some(o => o.includes('/home/user')));

        // whoami
        outputs.length = 0;
        await shell.executeSingleStatement('whoami');
        assert(outputs.some(o => o.includes('user')));

        // tty
        outputs.length = 0;
        await shell.executeSingleStatement('tty');
        assert(outputs.some(o => o.includes('/dev/pts/0')));

        // ls
        outputs.length = 0;
        await shell.executeSingleStatement('ls');
        assert(outputs.some(o => o.includes('welcome.txt')));

        // cat
        outputs.length = 0;
        await shell.executeSingleStatement('cat /etc/hostname');
        assert(outputs.some(o => o.includes('panfam-terminal')));
    });

    await testAsync('Shell: Redirection (> and >>)', async () => {
        const shell = new WebTerminalShell();
        await shell.executeSingleStatement('echo "first line" > /home/user/redirect.txt');
        assert(shell.vfs.exists('/home/user/redirect.txt'));
        assert(shell.vfs.readFile('/home/user/redirect.txt').includes('first line'));

        await shell.executeSingleStatement('echo "second line" >> /home/user/redirect.txt');
        const fullContent = shell.vfs.readFile('/home/user/redirect.txt');
        assert(fullContent.includes('first line'));
        assert(fullContent.includes('second line'));
    });

    await testAsync('Shell: Theme switching command', async () => {
        const shell = new WebTerminalShell();
        const outputs = [];
        shell.appendHtml = (html) => outputs.push(html);

        await shell.executeSingleStatement('theme dracula');
        assert.strictEqual(shell.themeManager.current, 'dracula');
        assert(outputs.some(o => o.includes('Dracula Dark')));
    });

    await testAsync('Shell: grep, head, tail, wc, and pipeline (|)', async () => {
        const shell = new WebTerminalShell();
        const outputs = [];
        shell.appendHtml = (html) => outputs.push(html);

        // write test file
        shell.vfs.writeFile('/home/user/lines.txt', 'alpha\nbeta\ngamma\ndelta\nepsilon\nzeta\n');

        // grep
        await shell.executeSingleStatement('grep -i "GAMMA" /home/user/lines.txt');
        assert(outputs.some(o => o.includes('gamma')));

        // pipe: cat lines.txt | grep beta
        outputs.length = 0;
        await shell.executeSingleStatement('cat /home/user/lines.txt | grep beta');
        assert(outputs.some(o => o.includes('beta')));

        // head -n 2
        outputs.length = 0;
        await shell.executeSingleStatement('head -n 2 /home/user/lines.txt');
        assert(outputs.some(o => o.includes('alpha') && o.includes('beta')));

        // tail -n 2
        outputs.length = 0;
        await shell.executeSingleStatement('tail -n 2 /home/user/lines.txt');
        assert(outputs.some(o => o.includes('epsilon') || o.includes('zeta')));

        // wc -l
        outputs.length = 0;
        await shell.executeSingleStatement('wc -l /home/user/lines.txt');
        assert(outputs.some(o => o.includes('6')));
    });

    console.log(`\nTests finished: ${passed} Passed, ${failed} Failed.`);
    if (failed > 0) {
        process.exit(1);
    }
}

runAll();
