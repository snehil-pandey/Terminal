# Panfam-Terminal Security Architecture & Threat Model

**Status:** Production Grade  
**Version:** 3.0.0  
**Security Classification:** Strict Browser-Sandboxed Virtual CLI

---

## 1. Trust Boundaries

```text
[ Browser Host / Host OS ]
        ▲
        │  [ STRICT BOUNDARY - No Node child_process, No eval(), No local filesystem ]
        ▼
[ Panfam-Terminal Execution Sandbox ]
   ├── TerminalSecurity ([security.js](../src/core/security.js))
   ├── POSIX Lexer & Parser ([lexer.js](../src/core/lexer.js), [parser.js](../src/core/parser.js))
   ├── Virtual File System ([vfs.js](../src/fs/vfs.js)) & Storage ([storage.js](../src/core/storage.js))
   ├── Virtual Network Subsystem ([network.js](../src/net/network.js))
   └── Command Registries ([registry.js](../src/commands/registry.js))
```

1. **Host Isolation**: The terminal executes entirely in the client-side JavaScript sandbox. It has zero capability to interact with, invoke, or modify the host operating system, files, or hardware.
2. **Network Isolation**: All networking commands (`ping`, `ifconfig`, `ip`, `dig`, `ss`) query the internal `VirtualNetwork` state. Real HTTP operations via `curl` are limited to `http:` and `https:`, run through browser CORS, and strictly sanitize all downloaded payloads.

---

## 2. Threat Scenarios & Mitigations

### 2.1 Cross-Site Scripting (XSS) & DOM Injection
- **Threat**: Malicious user inputs or files containing `<script>` or event handlers executed in DOM.
- **Mitigation**: All stdout, stderr, and prompt strings pass through `TerminalSecurity.escapeHtml` (`&`, `<`, `>`, `"`, `'`, `` ` ``) before rendering. No untrusted input is ever passed to `innerHTML` without explicit entity encoding.

### 2.2 Directory Traversal Attacks
- **Threat**: Accessing unauthorized path nodes or escaping virtual root via `../../`.
- **Mitigation**: `TerminalSecurity.isValidNodeName` rejects `..`, `.`, `/`, `\`, and null bytes (`\0`). All path lookups are resolved against the canonical directory tree.

### 2.3 Symbolic Link Recursion & Loop Denial-of-Service
- **Threat**: Circular symlinks (`A -> B -> A`) freezing browser event loops.
- **Mitigation**: `VirtualFileSystem.resolvePathWithSymlinks` enforces a hard recursion limit of `MAX_SYMLINK_DEPTH = 16`, throwing a controlled error on detected loops.

### 2.4 Command Injection & Shell Arbitrary Code Execution
- **Threat**: Exploiting shell syntax to invoke `eval()`, `new Function()`, or browser internals.
- **Mitigation**: Complete absence of `eval()` or dynamic script evaluation. All commands are dispatched via an explicit, typed `CommandRegistry` map with rigid parameter bounds.

### 2.5 Storage Quota & Cookie Exhaustion
- **Threat**: Malformed or oversized files causing cookie eviction and data corruption.
- **Mitigation**: Layered persistence architecture uses IndexedDB as primary bulk store, localStorage for configuration, and keeps cookies strictly under a 3.5KB safety ceiling. Full backup export/import allows disaster recovery.

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
