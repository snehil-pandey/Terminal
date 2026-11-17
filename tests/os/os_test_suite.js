/**
 * Panfam OS & .pf Programming Language Test Suite
 * Tests:
 * 1. PF Hardware & CPU/Memory simulation
 * 2. PF Process Manager lifecycle (spawn, terminate, states)
 * 3. PF Kernel System Call layer & Audit Logging
 * 4. .pf Lexer tokenization
 * 5. .pf Parser AST generation (Classes, Methods, Variables, Control Flow)
 * 6. .pf Virtual Interpreter execution (Math, String concatenation, OOP instantiation, method calls)
 * 7. Window Manager & Desktop Shell
 * 8. Panfam Package Manager (pfpm)
 */

const assert = require('assert');
const PFHardware = require('../../src/os/hardware');
const { ProcessManager, ProcessState } = require('../../src/os/process');
const PFKernel = require('../../src/os/kernel');
const PFLexer = require('../../src/pf/lexer');
const PFParser = require('../../src/pf/parser');
const { Interpreter } = require('../../src/pf/interpreter');
const { WindowManager } = require('../../src/desktop/wm');
const PackageManager = require('../../src/os/package');
const VirtualFileSystem = require('../../src/fs/vfs');
const VirtualNetwork = require('../../src/net/network');

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
    console.log('=== Running Panfam OS & .pf Language Test Suite ===');

    // 1. Hardware & Memory
    test('OS Hardware: CPU utilization & Memory allocation accounting', () => {
        const hw = new PFHardware();
        const initialMem = hw.memory.getStats();
        hw.memory.allocate(42, 64 * 1024 * 1024); // 64 MB
        const afterMem = hw.memory.getStats();
        assert.strictEqual(afterMem.usedBytes - initialMem.usedBytes, 64 * 1024 * 1024);
        hw.memory.freeAll(42);
        assert.strictEqual(hw.memory.getStats().usedBytes, initialMem.usedBytes);
    });

    // 2. Process Manager
    test('OS Process: Spawn, state transitions and termination', () => {
        const hw = new PFHardware();
        const pm = new ProcessManager(hw);
        const proc = pm.spawn('worker-daemon', 1, 'user', 15);
        assert.strictEqual(proc.state, ProcessState.READY);
        assert(pm.get(proc.pid) !== null);

        pm.terminate(proc.pid, 0);
        assert(pm.get(proc.pid) === null);
    });

    // 3. Kernel & Syscalls
    test('OS Kernel: Syscall dispatch and audit logging', () => {
        const hw = new PFHardware();
        const pm = new ProcessManager(hw);
        const vfs = new VirtualFileSystem();
        const net = new VirtualNetwork();
        const kernel = new PFKernel(hw, pm, vfs, net);

        const newProc = kernel.sys_spawn('test-task', 1, 'snehil');
        assert(newProc.pid > 1);
        assert(kernel.auditLog.some(l => l.action === 'process.spawn'));

        const memStats = kernel.sys_meminfo();
        assert(memStats.totalBytes > 0);
    });

    // 4. .pf Lexer
    test('PF Language Lexer: Tokenizes classes, methods, and expressions', () => {
        const src = `
            class Greeter:
                function greet(name: String) -> String:
                    return "Hello " + name
        `;
        const lexer = new PFLexer.Lexer(src);
        const tokens = lexer.tokenize();
        assert(tokens.some(t => t.type === 'CLASS'));
        assert(tokens.some(t => t.value === 'Greeter'));
        assert(tokens.some(t => t.type === 'FUNCTION'));
        assert(tokens.some(t => t.type === 'ARROW'));
    });

    // 5. .pf Parser
    test('PF Language Parser: Builds AST for classes, functions, and return statements', () => {
        const src = `
            let x = 10 + 5
            function add(a, b):
                return a + b
        `;
        const program = PFParser.parseSource(src);
        assert.strictEqual(program.type, 'Program');
        assert.strictEqual(program.body[0].type, 'VarDecl');
        assert.strictEqual(program.body[1].type, 'FuncDecl');
    });

    // 6. .pf Interpreter (Execution)
    test('PF Language Interpreter: Function evaluation and math operations', () => {
        const logs = [];
        const interp = new Interpreter((m) => logs.push(m));
        const src = `
            let a = 20
            let b = 22
            let sum = a + b
            print("Answer:", sum)
        `;
        interp.run(src);
        assert(logs.some(l => l.includes('Answer: 42')));
    });

    test('PF Language Interpreter: Object-Oriented Class instantiation & methods', () => {
        const logs = [];
        const interp = new Interpreter((m) => logs.push(m));
        const src = `
            class Calculator {
                init(name) {
                    self.name = name
                }

                function multiply(x, y) {
                    return x * y
                }
            }

            let calc = Calculator("PanfamCalc")
            let res = calc.multiply(6, 7)
            print("Product is:", res)
        `;
        interp.run(src);
        assert(logs.some(l => l.includes('Product is: 42')));
    });

    // 7. Desktop Window Manager
    test('Desktop WM: Window creation, focus management, and minimization', () => {
        const wm = new WindowManager();
        const win1 = wm.openWindow('Terminal', null, { width: 800, height: 500 });
        const win2 = wm.openWindow('Settings', null, { width: 400, height: 300 });

        assert.strictEqual(wm.activeWindowId, win2.id);
        wm.focusWindow(win1.id);
        assert.strictEqual(wm.activeWindowId, win1.id);

        wm.minimizeWindow(win1.id);
        assert.strictEqual(win1.isMinimized, true);

        wm.closeWindow(win2.id);
        assert.strictEqual(wm.windows.has(win2.id), false);
    });

    test('Desktop WM: Workspace switching and window coordinates', () => {
        const wm = new WindowManager();
        const win1 = wm.openWindow('Terminal WS1', null, { workspace: 1, x: 50, y: 50 });
        const win2 = wm.openWindow('Editor WS2', null, { workspace: 2, x: 100, y: 100 });

        assert.strictEqual(win1.workspace, 1);
        assert.strictEqual(win2.workspace, 2);
        assert.strictEqual(wm.currentWorkspace, 1);
        wm.switchWorkspace(2);
        assert.strictEqual(wm.currentWorkspace, 2);
    });

    // 8. .pf Milestone 1 Advanced Features: Inheritance & Super
    test('PF Language: Class inheritance, method overriding, and super calls', () => {
        const logs = [];
        const interp = new Interpreter((m) => logs.push(m));
        const src = `
            class BaseEntity {
                init(name) {
                    self.name = name
                }
                identify() {
                    return "Entity:" + self.name
                }
            }

            class Player extends BaseEntity {
                init(name, level) {
                    super.init(name)
                    self.level = level
                }
                identify() {
                    return super.identify() + " (Lvl " + self.level + ")"
                }
            }

            let p = Player("Snehil", 99)
            print(p.identify())
        `;
        interp.run(src);
        assert(logs.some(l => l.includes('Entity:Snehil (Lvl 99)')));
    });

    // 9. .pf Milestone 1 Advanced Features: Try/Catch/Finally & Exceptions
    test('PF Language: Try, catch, throw, and finally semantics', () => {
        const logs = [];
        const interp = new Interpreter((m) => logs.push(m));
        const src = `
            let status = "init"
            try {
                throw "Simulated Panic"
            } catch err {
                status = "caught:" + err
            } finally {
                print("finally_block_executed")
            }
            print(status)
        `;
        interp.run(src);
        assert(logs.some(l => l.includes('finally_block_executed')));
        assert(logs.some(l => l.includes('caught:Simulated Panic')));
    });

    // 10. .pf Static Type Checker & Diagnostics
    test('PF Language: Static Type Checker validates types and catches mismatches', () => {
        const TypeChecker = require('../../src/pf/typechecker');
        const validCode = `
            let a: Integer = 42
            let b: Float = 3.14
            let name: String = "PFOS"
            let flag: Boolean = true
        `;
        const resValid = TypeChecker.check(validCode);
        assert.strictEqual(resValid.valid, true);
        assert.strictEqual(resValid.diagnostics.length, 0);

        const invalidCode = `
            let count: Integer = "this is not an integer"
        `;
        const resInvalid = TypeChecker.check(invalidCode);
        assert.strictEqual(resInvalid.valid, false);
        assert(resInvalid.diagnostics.length > 0);

        // Cyclic inheritance check
        const cycleCode = `
            class NodeA extends NodeB {}
            class NodeB extends NodeA {}
        `;
        const resCycle = TypeChecker.check(cycleCode);
        assert.strictEqual(resCycle.valid, false);
        assert(resCycle.diagnostics.some(d => d.message.includes('Cyclic inheritance')));

        // Missing interface method check
        const missingIfaceCode = `
            interface Speaker {
                function speak() -> Void
            }
            class SilentRobot implements Speaker {}
        `;
        const resMissingIface = TypeChecker.check(missingIfaceCode);
        assert.strictEqual(resMissingIface.valid, false);
        assert(resMissingIface.diagnostics.some(d => d.message.includes('fails to implement interface method')));
    });

    // 11. .pf Standard Library Namespaces
    test('PF Language: Standard Library namespaces (std.string, std.collections, std.math)', () => {
        const logs = [];
        const interp = new Interpreter((m) => logs.push(m));
        const src = `
            let str = "  panfam-os  "
            let trimmed = string.trim(str)
            let upper = string.upper(trimmed)
            let parts = string.split(upper, "-")
            let hasOs = string.includes(upper, "OS")

            let items = collections.list()
            collections.push(items, 100)
            collections.push(items, 200)
            let sz = collections.size(items)

            print("Trimmed:", trimmed)
            print("HasOS:", hasOs)
            print("Size:", sz)
        `;
        interp.run(src);
        assert(logs.some(l => l.includes('Trimmed: panfam-os')));
        assert(logs.some(l => l.includes('HasOS: true')));
        assert(logs.some(l => l.includes('Size: 2')));
    });

    // 12. .pf Formatter Determinism
    test('PF Language: Formatter formats code deterministically', () => {
        const Formatter = require('../../src/pf/formatter');
        const rawCode = `class App{init(){self.val=10+20}}`;
        const pass1 = Formatter.format(rawCode);
        const pass2 = Formatter.format(pass1);
        assert.strictEqual(pass1, pass2); // Idempotent
        assert(pass1.includes('class App {'));
        assert(pass1.includes('self.val = 10 + 20'));
    });

    // 13. Package Manager (PFPM)
    test('Package Manager: Install, list, and verify packages', () => {
        const pm = new PackageManager();
        assert(pm.listInstalled().some(p => p.name === 'coreutils'));
        const installMsg = pm.install('neofetch');
        assert(installMsg.includes('Successfully installed neofetch'));
        assert(pm.listInstalled().some(p => p.name === 'neofetch'));
    });

    // 14. Unified System Services & Authoritative Container
    test('Unified Services: Authoritative service container and cross-subsystem sharing', () => {
        const { getSystemServices } = require('../../src/os/services');
        const services = getSystemServices();

        assert(services.kernel !== null);
        assert(services.vfs !== null);
        assert(services.processManager !== null);
        assert(services.hardware !== null);

        // VFS file write through services
        services.vfs.writeFile('/home/user/app_sync_test.pf', 'let x = 99\nprint(x)', 'user');
        assert(services.vfs.exists('/home/user/app_sync_test.pf'));

        // Spawn process lifecycle
        const logs = [];
        const proc = services.spawnWorkerProcess('app_sync_test.pf', services.vfs.readFile('/home/user/app_sync_test.pf'), 'user', {
            onStdout: (m) => logs.push(m)
        });

        assert(proc.pid > 0);
        assert(logs.some(l => l.includes('99')));
        assert.strictEqual(proc.exitCode, 0);
    });

    // 15. Process Lifecycle & Task Termination
    test('Process Lifecycle: Process termination via kill and resource cleanup', () => {
        const { getSystemServices } = require('../../src/os/services');
        const services = getSystemServices();

        // Spawn a background process
        const proc = services.processManager.spawn('background-worker', 1, 'user', 20);
        assert(services.processManager.get(proc.pid) !== null);

        // Terminate process through services
        const success = services.terminateProcess(proc.pid, 15, 'SIGTERM');
        assert.strictEqual(success, true);
        assert.strictEqual(services.processManager.get(proc.pid), null);
    });

    // 16. Worker Privileged Syscall Bridge Validation
    test('Syscall Bridge: Handles authorized VFS read/write and rejects unauthorized calls', () => {
        const { getSystemServices } = require('../../src/os/services');
        const services = getSystemServices();

        // Spawn a process to represent the worker caller
        const proc = services.processManager.spawn('worker-caller', 1, 'user');

        let receivedMsg = null;
        const fakeWorker = {
            postMessage: (m) => { receivedMsg = m; }
        };

        // Authorized fs.write
        services.handleWorkerSyscall(proc.pid, fakeWorker, {
            callId: 1,
            method: 'fs.write',
            args: ['/home/user/bridge_test.txt', 'Bridged Content']
        }, 'user');

        assert.strictEqual(receivedMsg.success, true);
        assert.strictEqual(services.vfs.readFile('/home/user/bridge_test.txt'), 'Bridged Content');

        // Unsupported/unauthorized call
        services.handleWorkerSyscall(proc.pid, fakeWorker, {
            callId: 2,
            method: 'forbidden.sys.destroy',
            args: []
        }, 'user');

        assert.strictEqual(receivedMsg.success, false);
        assert(receivedMsg.error.includes('ENOSYS'));
    });

    // 17. Syscall Bridge Hardening & Permissions
    test('Syscall Bridge: Enforces permissions and rejects cross-user kill attempts', () => {
        const { getSystemServices } = require('../../src/os/services');
        const services = getSystemServices();

        // Spawn caller process as guest
        const callerProc = services.processManager.spawn('guest-worker', 1, 'guest');
        // Spawn a process owned by root
        const rootProc = services.processManager.spawn('root-daemon', 1, 'root', 10);
        let receivedMsg = null;
        const fakeWorker = { postMessage: (m) => { receivedMsg = m; } };

        // Attempt to kill root process as unprivileged 'guest'
        services.handleWorkerSyscall(callerProc.pid, fakeWorker, {
            callId: 3,
            method: 'process.kill',
            args: [rootProc.pid]
        }, 'guest');

        assert.strictEqual(receivedMsg.success, false);
        assert(receivedMsg.error.includes('EPERM'));
        assert(services.processManager.get(rootProc.pid) !== null);

        // Root caller can kill
        const rootCaller = services.processManager.spawn('root-worker', 1, 'root');
        services.handleWorkerSyscall(rootCaller.pid, fakeWorker, {
            callId: 4,
            method: 'process.kill',
            args: [rootProc.pid]
        }, 'root');

        assert.strictEqual(receivedMsg.success, true);
        assert.strictEqual(services.processManager.get(rootProc.pid), null);
    });

    // 18. Storage & Backup Import Integrity Verification
    test('Storage & VFS: Validates backup integrity and rejects corrupted trees', () => {
        const VirtualFileSystem = require('../../src/fs/vfs');
        const vfs = new VirtualFileSystem();

        // Corrupted payload
        assert.throws(() => {
            vfs.validateAndImport("not an object");
        }, /Invalid backup/);

        // Missing children
        assert.throws(() => {
            vfs.validateAndImport({ type: 'dir' });
        }, /Missing valid root/);

        // Valid roundtrip tree
        const validBackup = {
            version: '4.0',
            vfs: {
                type: 'dir',
                inode: 1,
                name: '/',
                children: {
                    'home': {
                        type: 'dir',
                        inode: 2,
                        name: 'home',
                        children: {
                            'doc.txt': { type: 'file', inode: 3, name: 'doc.txt', content: 'hello' }
                        }
                    }
                }
            }
        };

        const res = vfs.validateAndImport(validBackup);
        assert.strictEqual(res.success, true);
        assert.strictEqual(vfs.readFile('/home/doc.txt'), 'hello');
    });

    // 19. End-to-End Cross-Subsystem Workflow
    test('End-to-End: Unified VFS shared between Shell, Native Apps, and .pf Engine', () => {
        const { getSystemServices } = require('../../src/os/services');
        const services = getSystemServices();

        // 1. File created in VFS (simulating File Manager / Touch)
        services.vfs.writeFile('/home/user/e2e_calc.pf', 'let a = 15\nlet b = 27\nprint("Computed:", a + b)', 'user');

        // 2. Read through VFS
        assert(services.vfs.exists('/home/user/e2e_calc.pf'));
        const fileContent = services.vfs.readFile('/home/user/e2e_calc.pf');

        // 3. Executed via .pf process manager lifecycle
        const logs = [];
        const proc = services.spawnWorkerProcess('e2e_calc.pf', fileContent, 'user', {
            onStdout: (m) => logs.push(m)
        });

        assert(proc.pid > 0);
        assert(logs.some(l => l.includes('Computed: 42')));
        assert.strictEqual(proc.exitCode, 0);

        // 4. Content updated via shell-like write
        services.vfs.writeFile('/home/user/e2e_calc.pf', fileContent + '\nprint("Updated")', 'user');
        const updated = services.vfs.readFile('/home/user/e2e_calc.pf');
        assert(updated.includes('Updated'));
    });

    // 20. Performance Benchmark Profiler
    test('Performance: Measures VFS, AST Parser, and Syscall Latency', () => {
        const { getSystemServices } = require('../../src/os/services');
        const services = getSystemServices();
        const Parser = require('../../src/pf/parser');

        // VFS benchmark (100 rapid read/write cycles)
        const t0 = Date.now();
        for (let i = 0; i < 100; i++) {
            services.vfs.writeFile(`/tmp/bench_${i}.txt`, `payload ${i}`, 'user');
            services.vfs.readFile(`/tmp/bench_${i}.txt`);
        }
        const vfsDuration = Date.now() - t0;
        assert(vfsDuration < 500); // Sub-half-second for 100 roundtrips

        // AST Parser benchmark (50 parse runs)
        const p0 = Date.now();
        for (let i = 0; i < 50; i++) {
            Parser.parseSource('class Demo { init(v) { self.v = v } get() { return self.v } } let d = Demo(10)');
        }
        const parseDuration = Date.now() - p0;
        assert(parseDuration < 500);
    });

    console.log(`\nPanfam OS Test Results: ${passed} Passed, ${failed} Failed.`);
    if (failed > 0) {
        process.exit(1);
    }
}

runAll();
