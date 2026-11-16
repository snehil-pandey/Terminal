# Panfam-Terminal Test Documentation & Methodology

**Test Harness:** Node.js Standalone Runner  
**File:** [test_suite.js](file:///S:/Common/projects/Terminal/tests/test_suite.js)  
**Security Reference:** [SECURITY.md](file:///S:/Common/projects/Terminal/documentation/SECURITY.md)  
**Command Reference:** [COMMAND_REFERENCE.md](file:///S:/Common/projects/Terminal/documentation/COMMAND_REFERENCE.md)  
**Changelog:** [CHANGELOG.md](file:///S:/Common/projects/Terminal/CHANGELOG.md)

---

## 1. Test Architecture

The Panfam-Terminal test suite covers seven testing tiers:

1. **Security & Sanitization**: HTML entity escaping, null byte stripping, traversal prevention, protocol guards.
2. **POSIX Lexer**: Tokenization of single quotes, double quotes, escapes, operators (`&&`, `||`, `;`, `|`, `<`, `>`, `>>`, `2>`).
3. **AST Parser**: Verification of command nodes, pipeline trees, and binary operator precedence.
4. **Virtual File System**: Inode integrity, `/proc` dynamic synthetic files, symbolic link resolution, loop protection, and permission manipulation.
5. **Virtual Network**: Interface statistics, routing tables, and DNS resolution with `/etc/hosts` integration.
6. **Shell Pipeline & Redirection**: Execution of chained commands (`&&`, `||`), multi-stage pipelines (`|`), input redirection (`<`), and output redirection (`>`).
7. **Themes & Developer Tools**: Theme palette validation and simulated `git` repository workflows.

---

## 2. Running Automated Tests

Run the test suite with:

```bash
node tests/test_suite.js
```

### Verified Output
```text
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
```
