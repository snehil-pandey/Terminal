# Changelog

All notable changes to the Panfam-Terminal project are documented in this file.

---

## [3.0.0] - 2026-11-16

### Added
- **POSIX Lexer & AST Parser**: Full grammar support for single/double quotes, backslash escaping, semicolon sequences, logical operators (`&&`, `||`), multi-stage pipelines (`|`), input redirection (`<`), and output redirection (`>`, `>>`, `2>`).
- **Layered Storage Engine**: IndexedDB bulk persistence alongside localStorage and cookie drivers with backup export/import capabilities.
- **Advanced POSIX Virtual File System (VFS)**:
  - Inode-based node structure.
  - Symbolic links (`ln -s`, `readlink`) with recursion loop detection.
  - Synthetic `/proc` filesystem (`/proc/version`, `/proc/cpuinfo`, `/proc/meminfo`, `/proc/uptime`).
  - Permission and ownership modification (`chmod`, `chown`).
- **Virtual Network Subsystem**: Simulated interfaces (`eth0`, `lo`), IP routing table, socket inspection (`ss`), and virtual DNS resolver integrated with `/etc/hosts` and `/etc/resolv.conf`.
- **Domain Command Ecosystem**: Over 30 Linux utilities across Filesystem (`tree`, `stat`, `find`, `du`, `df`), Text Processing (`sed`, `awk`, `cut`, `sort`, `uniq`, `tr`, `tee`, `diff`), System (`free`, `top`, `sleep`), Network (`ip`, `dig`, `nslookup`, `ss`), and Development (`git`, `apt`, `base64`, `sha256sum`).
- **Standardized Execution Model**: Structured `ExecutionResult` separating stdout, stderr, and integer exit codes.
- **Comprehensive Documentation Suite**: Added [UPGRADE_AUDIT.md](file:///S:/Common/projects/Terminal/documentation/UPGRADE_AUDIT.md), [SECURITY.md](file:///S:/Common/projects/Terminal/documentation/SECURITY.md), [COMMAND_REFERENCE.md](file:///S:/Common/projects/Terminal/documentation/COMMAND_REFERENCE.md), and [TESTING.md](file:///S:/Common/projects/Terminal/documentation/TESTING.md).

### Changed
- Reconstructed shell execution engine to evaluate AST trees instead of naive string splitting.
- Modernized command registration into pluggable domain modules (`fs_commands.js`, `text_commands.js`, `sys_commands.js`, `net_commands.js`, `dev_commands.js`).
- Expanded automated test coverage from 13 to 18 unit, integration, and security assertions (100% pass rate).

### Fixed
- Fixed command conditional chaining broken by conflated stdout/stderr strings.
- Fixed potential symlink infinite loops via `MAX_SYMLINK_DEPTH` loop protection.
- Fixed storage truncation risks by integrating IndexedDB as bulk store.
