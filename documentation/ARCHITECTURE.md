# Panfam OS Architecture Specification (v4.1.0)

**Project:** Panfam OS (PFOS)  
**Codename:** Aether  
**Architecture:** x86_64 Virtualized  
**Shell:** PFSH (Panfam Shell)  
**Native Language:** `.pf` (Panfam Language)  
**Package Manager:** PFPM  
**Related Documents:** [LANGUAGE_SPECIFICATION.md](./LANGUAGE_SPECIFICATION.md) | [SECURITY.md](./SECURITY.md) | [TESTING.md](./TESTING.md)

---

## 1. System Layers

```text
+-------------------------------------------------------------------------+
|                  Panfam Desktop Environment & Native Apps               |
|      (Terminal, PF Code Editor, File Manager, Process Monitor, Settings)|
+-------------------------------------------------------------------------+
|            Panfam Shell (PFSH) & .pf Language Toolchain / Runtime       |
|            (PFLexer, PFParser, PFTypeChecker, PFInterpreter, PFPM)      |
+-------------------------------------------------------------------------+
|                    Panfam Kernel (Syscall & Security Layer)             |
|   (process.spawn, fs.read, fs.write, meminfo, cpuinfo, Audit Logging)   |
+-------------------------------------------------------------------------+
|                  Core OS Services & Virtual Hardware                    |
|   ├── Virtual CPU & Multicore Cooperative Scheduler                    |
|   ├── Virtual Memory Controller & Process Accounting                    |
|   ├── Inode POSIX Virtual File System (VFS with symlinks & /proc)       |
|   ├── Virtual Network Subsystem (eth0, lo, Routing, DNS)               |
|   └── Layered Storage Engine (IndexedDB, LocalStorage, Safe Cookies)    |
+-------------------------------------------------------------------------+
```

---

## 2. Core Subsystems

### 2.1 Virtual Hardware Abstraction (`src/os/hardware.js`)
- **Virtual CPU**: Multicore simulation (`Panfam Core-V4`), cycle execution accounting, clock speed (3.6GHz), dynamic load emulation, and thermal sensors.
- **Virtual Memory Controller**: 8GB simulated physical memory, per-process heap and memory allocation tracking, allocation limits, and out-of-memory guards.
- **Device Registry**: Registers block devices, processors, memory controllers, virtual network adapters, and video accelerators.

### 2.2 Process Manager (`src/os/process.js`)
- Full virtual process lifecycle: `CREATED`, `READY`, `RUNNING`, `SLEEPING`, `WAITING`, `TERMINATED`, `FAILED`.
- PID accounting, parent PID mapping, priority levels, per-process memory limits, CPU accounting time, and exit codes.
- Pre-seeded with system processes: `PID 1 (pf-init)`, `dbus-daemon`, `systemd-udevd`, and `pfsh`.

### 2.3 Kernel Syscall Boundary (`src/os/kernel.js`)
- Enforces strict security boundaries between userland and protected kernel data.
- System calls: `sys_spawn`, `sys_kill` (enforcing ownership/root privileges), `sys_read`, `sys_write`, `sys_meminfo`, `sys_cpuinfo`, and `sys_uname`.
- Real-time tamper-evident system audit log tracking every privileged action.

### 2.4 User & Authentication (`src/os/user.js`)
- Multiple virtual accounts: `root` (UID 0), `snehil` (UID 1000, sudo), and `guest` (UID 1001).
- Enforces role-based authorization for administrative operations.

---

## 3. Panfam Programming Language (`.pf`)

The `.pf` language combines clean, readable syntax with structured, object-oriented semantics:

### 3.1 Compiler & Interpreter Subsystems
- **Lexer** ([`../src/pf/lexer.js`](../src/pf/lexer.js)): Tokenizes keywords (`class`, `extends`, `implements`, `interface`, `super`, `function`, `let`, `if`, `while`, `return`, `try`, `catch`, `finally`, `throw`), symbols, and types (`Integer`, `Float`, `String`, `Boolean`, `Any`, `Void`).
- **Parser** ([`../src/pf/parser.js`](../src/pf/parser.js)): Builds AST nodes (`ClassDecl`, `InterfaceDecl`, `FuncDecl`, `VarDecl`, `IfStmt`, `WhileStmt`, `TryStmt`, `ThrowStmt`, `SuperExpr`, `CallExpr`, `MemberExpr`, `AssignExpr`).
- **Static Type Checker** ([`../src/pf/typechecker.js`](../src/pf/typechecker.js)): Full compile-time static type analysis, assignment compatibility checks, class/interface hierarchy validation, and diagnostic error reports.
- **Interpreter** ([`../src/pf/interpreter.js`](../src/pf/interpreter.js)): Tree-walk virtual execution engine without `eval()` or `new Function()`. Includes standard library modules (`std.io`, `std.math`, `std.string`, `std.collections`, `std.time`, `std.system`) and loop safety guards.
- **Formatter** ([`../src/pf/formatter.js`](../src/pf/formatter.js)): AST-aware deterministic code formatter.

---

## 4. Desktop Window Manager (`src/desktop/wm.js`)
- Full window lifecycle management (create, minimize, maximize, restore, close, drag, resize, z-index focus stack).
- 4 Virtual Workspaces with instant hotkey or toolbar switching.
- Integrated Top Bar with live system telemetry (vCPU, vMem, clock) and interactive dock with native applications (Terminal, PF Code Editor, File Manager, Task Monitor, Settings).
- Seamless mode toggle between PFSH Terminal and Interactive Desktop (`desktop` command and `Ctrl+Alt+D` shortcut).

---

## 5. Package Ecosystem (`src/os/package.js`)
- Native package manager (`pfpm`) supporting package metadata, dependency tracking, repository installation, removal, and search.
- Pre-installed core packages: `coreutils`, `pfsh`, `pfruntime`.
