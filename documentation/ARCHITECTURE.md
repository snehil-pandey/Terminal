# Panfam OS Architecture Specification (v4.2.0)

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
|                    Panfam Unified Services Container                    |
|      (SystemServiceContainer: single authoritative instance for all)     |
+-------------------------------------------------------------------------+
|            Panfam Shell (PFSH) & .pf Language Toolchain / Runtime       |
|            (PFLexer, PFParser, PFTypeChecker, PFInterpreter, PFPM)      |
+-------------------------------------------------------------------------+
|                    Panfam Kernel (Syscall & Security Layer)             |
|   (sys_spawn, sys_kill, fs.read, fs.write, meminfo, Audit Logging)      |
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

## 2. Core Subsystems & Service Architecture

### 2.1 Unified Service Container ([`../src/os/services.js`](../src/os/services.js))
- **Singleton Authority**: A single authoritative `SystemServiceContainer` instance governs kernel services, process accounting, virtual hardware, and the file system.
- **Cross-Subsystem Cohesion**: PFSH terminal, `.pf` scripts, Web Workers, and Desktop UI apps all bind to the same underlying VFS, ProcessManager, and Hardware state.
- **Worker Syscall Bridge**: Validated RPC communication proxy (`worker.js` -> `kernel.js`) preventing direct manipulation of privileged kernel memory.

### 2.2 Virtual Hardware Abstraction ([`../src/os/hardware.js`](../src/os/hardware.js))
- **Virtual CPU**: Multicore simulation (`Panfam Core-V4`), cycle execution accounting, clock speed (3.6GHz), dynamic load emulation, and thermal sensors.
- **Virtual Memory Controller**: 8GB simulated physical memory, per-process heap and memory allocation tracking, allocation limits, and out-of-memory guards.

### 2.3 Process Manager & Lifecycle ([`../src/os/process.js`](../src/os/process.js))
- Complete virtual process lifecycle: `CREATED`, `READY`, `RUNNING`, `SLEEPING`, `WAITING`, `TERMINATED`, `FAILED`.
- PID accounting, priority levels, memory accounting, CPU time metrics, and termination signals.
- Connected to shell `ps` and `kill` commands as well as the native Task Manager app.

### 2.4 Kernel Syscall Boundary ([`../src/os/kernel.js`](../src/os/kernel.js))
- Enforces strict security boundaries between userland and protected kernel data.
- System calls: `sys_spawn`, `sys_kill` (enforcing ownership/root privileges), `sys_read`, `sys_write`, `sys_meminfo`, `sys_cpuinfo`, and `sys_uname`.
- Real-time system audit log tracking every privileged action.

---

## 3. Native Application Suite ([`../src/apps/native_apps.js`](../src/apps/native_apps.js))

1. **PF Code Studio**: Full-featured code editor with syntax highlighting, live VFS file opening/saving, `pf check` type diagnostics, deterministic formatting, and run/stop worker process lifecycle controls.
2. **PF Task Manager**: Real-time operating system process monitor with live CPU and memory telemetry, process state badges, and authorized termination controls.
3. **PF File Manager**: Direct directory navigation across `/home/user`, `/`, `/etc`, `/bin`, and `/proc` with folder/file creation and live synchronization with PFSH.
4. **PF Settings**: Dynamic theme switcher (all 7 visual themes with high-contrast white text mode overlay) and disaster recovery backup export/import.
