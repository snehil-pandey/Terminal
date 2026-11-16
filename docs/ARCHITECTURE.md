# WebLinux Terminal Architecture Specification

## Overview
WebLinux Terminal is a fully client-side Linux command line emulator implemented in modern, dependency-free JavaScript. It provides a POSIX-like user experience, complete with an in-memory Virtual File System (VFS), multi-theme engine, command registry, and military-grade injection defense.

---

## 1. Modular Directory Structure

```text
Terminal/
├── index.html                  # Root landing page / redirect
├── terminal.html               # Main CLI viewport with strict CSP
├── terminal.css                # CSS variables, theming engine, CRT styles
├── terminal.js                 # Unified bootstrap & DOM adapter
├── src/
│   ├── core/
│   │   ├── security.js         # Input sanitization, HTML escaping, URL guards
│   │   ├── storage.js          # Cookie driver with localStorage fallbacks
│   │   └── shell.js            # Prompt builder, history, tab-completion, redirection
│   ├── fs/
│   │   └── vfs.js              # In-memory Unix filesystem (/bin, /etc, /home, /dev)
│   ├── ui/
│   │   └── theme.js            # Theme definitions & dynamic palette switcher
│   └── commands/
│       └── registry.js         # Command dispatcher & built-in Linux utilities
├── tests/
│   └── test_suite.js           # Automated node-based test harness
└── docs/
    └── ARCHITECTURE.md         # Full architecture and security documentation
```

---

## 2. Cybersecurity & Injection Defense

1. **Content Security Policy (CSP)**:
   - Configured via `<meta http-equiv="Content-Security-Policy">`.
   - Restricts script and object execution to safe local origins.
2. **Context-Aware Output Escaping**:
   - `TerminalSecurity.escapeHtml` escapes `&`, `<`, `>`, `"`, `'`, and `` ` ``.
   - Prevents stored and reflected Cross-Site Scripting (XSS).
3. **Shell Input Sanitization**:
   - Null bytes (`\0`) and non-printable control characters are stripped prior to command dispatch.
4. **Filesystem Path Traversal Defense**:
   - `isValidNodeName` blocks `..`, `.`, directory separators (`/`, `\`), and control sequences in filenames.
   - All relative paths are normalized through canonical stack resolution.
5. **Safe Network Protocol Verification**:
   - Outbound requests (via `curl`) only permit `http:` and `https:`, blocking `javascript:`, `vbscript:`, and `data:` schemes.

---

## 3. Cookie Persistence & VFS Sync

- Directory nodes and files are structured in a tree hierarchy stored under the cookie key `termfs_vfs_tree`.
- Theme selection is stored under `termfs_current_theme`.
- Command history is stored under `termfs_cmd_history`.
- Safe size quotas are enforced (< 3.5KB per cookie). Storage automatically mirrors and falls back to browser storage if cookies are constrained.

---

## 4. Theme System

Theme colors are dynamically applied via CSS custom properties on `:root`:
- `--term-bg`
- `--term-fg`
- `--term-prompt`
- `--term-user`
- `--term-host`
- `--term-path`
- `--term-border`

Supported Themes:
- `matrix`: Classic neon green phosphor on black.
- `amber`: Warm amber monocrome CRT.
- `cyberpunk`: Neon cyan and hot pink.
- `dracula`: Modern dark theme with pastel purple and green accents.
- `nord`: Arctic, cool blue and slate palette.
- `monokai`: High-contrast programmer palette.
- `solarized`: Ethan Schoonover's Solarized Dark color space.
