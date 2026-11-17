# Panfam OS Security Architecture & Threat Model (v4.0)

**Status:** Hardened Production Grade  
**Version:** 4.0.0  
**Security Classification:** Strict Browser-Sandboxed Virtual Operating Environment  
**Related Documents:** [ARCHITECTURE.md](./ARCHITECTURE.md) | [LANGUAGE_SPECIFICATION.md](./LANGUAGE_SPECIFICATION.md) | [TESTING.md](./TESTING.md)

---

## 1. System Trust Boundaries

```text
[ Browser Host / Host Operating System ]
        ▲
        │  [ STRICT BOUNDARY - No Node child_process, No eval(), No native filesystem ]
        ▼
[ Panfam OS (PFOS) Privileged System Core ]
   ├── PFKernel & Syscall Guard ([kernel.js](../src/os/kernel.js))
   ├── ProcessManager & Quota Accounting ([process.js](../src/os/process.js))
   ├── VirtualFileSystem & Inode Controller ([vfs.js](../src/fs/vfs.js))
   └── SystemServiceContainer & Syscall Dispatcher ([services.js](../src/os/services.js))
        ▲
        │  [ ISOLATED MESSAGE RPC BRIDGE (Worker onmessage / postMessage) ]
        ▼
[ Isolated Execution Boundary ]
   ├── .pf Web Worker Engine ([worker.js](../src/pf/worker.js))
   ├── PF Code Studio ([native_apps.js](../src/apps/native_apps.js))
   └── Unprivileged Userland Programs
```

1. **Host Isolation**: The entire operating environment executes strictly in the client-side JavaScript sandbox. It has zero capability to interact with, invoke, or modify the host operating system, local files, or hardware.
2. **Worker RPC Boundary**: User `.pf` programs execute in dedicated Web Workers. Workers possess no direct JavaScript reference or prototype handle to `PFKernel`, `VirtualFileSystem`, or `ProcessManager`. All interactions must pass through structured JSON messages (`postMessage`) validated by `SystemServiceContainer.handleWorkerSyscall`.

---

## 2. Threat Scenarios & Mitigations

### 2.1 Syscall Forgery & Unauthorized Elevation
- **Threat**: A worker script attempts to terminate another user's process or write to system paths (`/bin`, `/etc`).
- **Mitigation**:
  - Permissions are strictly enforced **on the kernel side** (`kernel.js`), never trusted to the worker.
  - `sys_kill` verifies the process owner UID: non-root users attempting to terminate other processes receive `EPERM: Operation not permitted` and an audit entry is logged.
  - Syscall arguments are validated against strict type, length (max 1024 chars for paths), and payload quotas (max 5MB file write ceiling).

### 2.2 Terminated Worker / Zombie RPC Attacks
- **Threat**: A worker terminated via SIGTERM/SIGKILL attempts to send subsequent syscall messages to modify storage.
- **Mitigation**: `handleWorkerSyscall` checks `this.processManager.get(pid)`. If the process has been terminated or no longer exists in the authoritative table, the RPC is rejected immediately with `ESRCH: Process has terminated`.

### 2.3 Backup Import Corruption & Path Traversal Attacks
- **Threat**: An attacker feeds a crafted JSON backup containing `..` path traversal sequences, duplicate inodes, or circular directory hierarchies.
- **Mitigation**: `vfs.validateAndImport(data)` recursively validates every imported node:
  - Rejects traversal characters (`..`, `.`, empty names, `/`, `\`).
  - Enforces a maximum hierarchy depth of 32 levels.
  - Enforces a hard ceiling of 5,000 nodes (`ENOSPC`).
  - Detects duplicate inodes and reallocates them deterministically.

### 2.4 Cross-Site Scripting (XSS) & DOM Injection
- **Threat**: File names, prompt outputs, or error messages attempting HTML injection.
- **Mitigation**:
  - All outputs pass through `TerminalSecurity.escapeHtml` or `TerminalSecurity.sanitizeHtml`.
  - Disallows `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<input>`, `<button>`, `<style>`, `<link>`, and inline event handlers (`onload`, `onclick`, `onerror`).

### 2.5 Infinite Loops & Resource Exhaustion
- **Threat**: Malicious `.pf` code with infinite loops (`while true {}`) freezing the browser tab.
- **Mitigation**:
  - Web Workers isolate CPU utilization away from the main UI browser thread.
  - Watchdog timeouts (default 10s) automatically trigger SIGKILL, terminating the worker instance and freeing all allocated virtual hardware memory.
  - Tree-walk interpreter maintains an instruction step guard (50,000 iterations ceiling per block).

---

## 3. Content Security Policy (CSP)

Implemented in [`index.html`](../index.html):
```http
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
connect-src 'self' https:;
img-src 'self' data: https:;
```
