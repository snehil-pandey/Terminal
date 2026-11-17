# Panfam OS & .pf Test Documentation & Methodology

**Test Harness:** Unified Automated Runner ([`../tests/run_all_tests.js`](../tests/run_all_tests.js))  
**POSiX & CLI Test File:** [`../tests/test_suite.js`](../tests/test_suite.js)  
**OS Core, .pf Engine & E2E File:** [`../tests/os/os_test_suite.js`](../tests/os/os_test_suite.js)  
**Security Reference:** [SECURITY.md](./SECURITY.md)  
**Architecture Reference:** [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 1. Test Architecture & Coverage Layers

The test suite validates the full browser operating environment across 8 critical tiers:

1. **Security & Sanitization**: Strict HTML entity escaping, null byte stripping, traversal prevention, protocol guards.
2. **POSIX Shell & AST**: Tokenization, pipeline trees (`|`), logical chaining (`&&`, `||`), redirections (`<`, `>`, `>>`, `2>`).
3. **Virtual File System & Storage**: Inode structure, synthetic `/proc` endpoints, symlink resolution, loop detection, and backup import integrity validation (`validateAndImport`).
4. **Virtual Network**: Interface inspection (`lo`, `eth0`), routing tables, and DNS resolution with `/etc/hosts`.
5. **Virtual Hardware & Kernel**: Multi-core scheduler utilization, memory controller quotas, syscall boundary, and audit logging.
6. **.pf Language Engine**: Static type checking, cyclic inheritance validation, interface contracts, exception propagation (`try`/`catch`/`finally`), standard library modules, and code formatter idempotence.
7. **Process Lifecycle & Worker RPC Bridge**: Process creation, tracking, authorized SIGTERM/SIGKILL termination, and privilege enforcement.
8. **End-to-End System Integration & Benchmarking**: Cross-subsystem VFS sharing (Shell + Code Studio + File Manager), process tracking, and benchmark latency measurements.

---

## 2. Running Automated Tests

Run the complete test suite with:

```bash
node tests/run_all_tests.js
```

### Verified Test Results (40/40 Passing - 100% Pass Rate)

```text
====================================================
       PANFAM OS & .PF COMPLETE TEST RUNNER         
====================================================

>>> [1/2] Executing POSIX Shell, VFS & Commands Suite:
=== Running Panfam-Terminal Automated Test Suite ===
[PASS] Security: escapeHtml properly sanitizes dangerous characters
[PASS] Security: sanitizeInput strips null bytes and non-printable control chars
[PASS] Security: isValidNodeName prevents path traversal and control sequences
[PASS] Security: isSafeUrl blocks javascript: and vbscript: URIs
[PASS] Lexer: Tokenizes quotes, escapes, and operators correctly
[PASS] Parser: Builds correct AST for pipelines and logical operators
[PASS] Parser: Preserves command redirection targets
[PASS] VFS: Inode tree initialization and /proc dynamic files
[PASS] VFS: Symbolic link creation and resolution
[PASS] VFS: Symlink recursion loop detection
[PASS] VFS: chmod and chown attributes
[PASS] Network: Interface inspection and routing table
[PASS] Network: Host resolution with /etc/hosts fallback
[PASS] Shell: Execute conditional chaining (&&, ||) and exit statuses
[PASS] Shell: Pipeline execution (|) across text commands
[PASS] Shell: Input redirection (<) and output redirection (>)
[PASS] Themes: Supports all 7 original themes and persists in memory
[PASS] Dev: git commands (init, status, branch, commit)

Automated Test Results: 18 Passed, 0 Failed.

>>> [2/2] Executing Panfam OS Core & .pf Language Suite:
=== Running Panfam OS & .pf Language Test Suite ===
[PASS] OS Hardware: CPU utilization & Memory allocation accounting
[PASS] OS Process: Spawn, state transitions and termination
[PASS] OS Kernel: Syscall dispatch and audit logging
[PASS] PF Language Lexer: Tokenizes classes, methods, and expressions
[PASS] PF Language Parser: Builds AST for classes, functions, and return statements
[PASS] PF Language Interpreter: Function evaluation and math operations
[PASS] PF Language Interpreter: Object-Oriented Class instantiation & methods
[PASS] Desktop WM: Window creation, focus management, and minimization
[PASS] Desktop WM: Workspace switching and window coordinates
[PASS] PF Language: Class inheritance, method overriding, and super calls
[PASS] PF Language: Try, catch, throw, and finally semantics
[PASS] PF Language: Static Type Checker validates types and catches mismatches
[PASS] PF Language: Standard Library namespaces (std.string, std.collections, std.math)
[PASS] PF Language: Formatter formats code deterministically
[PASS] Package Manager: Install, list, and verify packages
[PASS] Unified Services: Authoritative service container and cross-subsystem sharing
[PASS] Process Lifecycle: Process termination via kill and resource cleanup
[PASS] Syscall Bridge: Handles authorized VFS read/write and rejects unauthorized calls
[PASS] Syscall Bridge: Enforces permissions and rejects cross-user kill attempts
[PASS] Storage & VFS: Validates backup integrity and rejects corrupted trees
[PASS] End-to-End: Unified VFS shared between Shell, Native Apps, and .pf Engine
[PASS] Performance: Measures VFS, AST Parser, and Syscall Latency

Panfam OS Test Results: 22 Passed, 0 Failed.

====================================================
 ALL 40 TESTS PASSED SUCCESSFULLY! (100% Pass Rate) 
====================================================
```
