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
    });

    // 11. Package Manager (PFPM)
    test('Package Manager: Install, list, and verify packages', () => {
        const pm = new PackageManager();
        assert(pm.listInstalled().some(p => p.name === 'coreutils'));
        const installMsg = pm.install('neofetch');
        assert(installMsg.includes('Successfully installed neofetch'));
        assert(pm.listInstalled().some(p => p.name === 'neofetch'));
    });

    console.log(`\nPanfam OS Test Results: ${passed} Passed, ${failed} Failed.`);
    if (failed > 0) {
        process.exit(1);
    }
}

runAll();
