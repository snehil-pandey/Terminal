# Terminal

[![Tests Status](https://img.shields.io/badge/tests-12%2F12%20passing-brightgreen)](#)
[![Security Hardened](https://img.shields.io/badge/cybersecurity-peak%20hardened-blue)](#)
[![Theme Engine](https://img.shields.io/badge/themes-7%20palettes-orange)](#)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen)](#)

---

## 💭 Reflection & Growth

> *"Looking back at where this project began in 2022 with simple string checks and experimental scripts, it's humbling to see how far we've come. What started as an aspiring journey into coding and web scripting has evolved into a production-grade, modular, security-hardened Linux CLI emulator. Engineering with cybersecurity at its peak, decoupling logic into cohesive modules, and building a true persistent POSIX filesystem is a testament to learning, iterating, and constantly raising the bar on our standards."*

---

A modular, dependency-free, cybersecurity-hardened web-based Linux CLI terminal running entirely in the browser. Features a fully persistent Virtual File System (VFS) with cookie persistence, multi-palette theming, tab-completion, and authentic POSIX utility emulations.

---

## 🚀 Key Highlights & What's New in v.3.0

- **Modular Architecture**: Rebuilt from the ground up with clean, decoupled modules (`core/security`, `core/storage`, `fs/vfs`, `ui/theme`, `commands/registry`, and `core/shell`).
- **Peak Cybersecurity & Zero Injection**:
  - Full HTML output escaping preventing DOM-based & stored XSS.
  - Strict input sanitization preventing null-byte and buffer-overflow attacks.
  - Path traversal protection prohibiting directory escape (`..`, `../`).
  - Safe network fetching restricting protocols to HTTP/HTTPS.
  - Content Security Policy (CSP) header enforcement.
- **Persistent Virtual File System (VFS)**:
  - Realistic Unix structure (`/bin`, `/etc`, `/dev`, `/home/user`, `/tmp`, `/var`).
  - Full persistence across page reloads using browser cookies (`termfs_vfs_tree`) with storage fallbacks.
  - Standard file operations: `ls`, `cat`, `touch`, `mkdir`, `rm`, `pwd`, `cd`, and file redirection (`>`, `>>`).
- **Interactive Theme Engine**:
  - Switch color schemes on the fly directly from the shell (`theme <name>`).
  - Themes persist in cookies across sessions.
  - Built-in palettes: `matrix`, `amber`, `cyberpunk`, `dracula`, `nord`, `monokai`, and `solarized`.
- **System & Device Utilities**:
  - `tty` returns the active pseudo-terminal terminal device (`/dev/pts/0`).
  - `ps` displays simulated running kernel and daemon processes.
  - `whoami`, `id`, `hostname`, `uname -a`, `uptime`, `date`, `env`, `export`, and `cookies`.
- **Animated Digital Rain**:
  - Integrated Matrix visual canvas (`matrix` / `engage`).

---

## 🛠️ Quick Start

Simply open [index.html](file:///S:/Common/projects/Terminal/index.html) in any modern web browser, or serve locally with Python or Node:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (npx)
npx serve .
```

Then open `http://localhost:8000/index.html` (or simply `http://localhost:8000/`).

---

## 💻 Available Commands

| Command | Usage | Description |
| :--- | :--- | :--- |
| `help` / `list` | `help` | Display command reference categorized by group |
| `man` | `man <command>` | View manual and synopsis for any command |
| `clear` / `cls` | `clear` | Clear terminal display buffer |
| `pwd` | `pwd` | Print current working directory |
| `cd` | `cd [dir]` | Change directory (supports `~`, `..`, relative and absolute paths) |
| `ls` | `ls [-a] [-l] [path]` | List directory contents with Unix permissions & timestamps |
| `cat` | `cat <file...>` | Display file contents |
| `grep` | `grep [-i] [-v] [-n] [-c] <pattern> [file...]` | Search text with regex matching and highlight |
| `head` | `head [-n lines] [file]` | Output initial lines of file or stdin pipe |
| `tail` | `tail [-n lines] [file]` | Output trailing lines of file or stdin pipe |
| `wc` | `wc [-l] [-w] [-c] [file]` | Print newline, word, and byte counts |
| `touch` | `touch <file...>` | Create empty file or update timestamp |
| `mkdir` | `mkdir [-p] <dir...>` | Create directory (supports nested `-p`) |
| `rm` | `rm [-r] <path...>` | Remove file or directory |
| `echo` | `echo [text] [> file]` | Print text or redirect output to file |
| `tty` | `tty` | Print current terminal name (`/dev/pts/0`) |
| `whoami` | `whoami` | Print effective current user |
| `id` | `id` | Print user and group identifiers |
| `hostname` | `hostname` | Display system hostname |
| `uname` | `uname [-a\|-r\|-m]` | Print OS and kernel details |
| `ps` | `ps` | Report current process table |
| `uptime` | `uptime` | Display system uptime and load averages |
| `date` | `date` | Display current system time and date |
| `env` / `printenv` | `env` | Display shell environment variables |
| `export` | `export KEY=VAL` | Set environment variable (e.g. `export THEME=dracula`) |
| `theme` | `theme [list\|name]` | List or switch active color theme |
| `cookies` | `cookies [clear]` | Inspect or wipe persistent session cookies |
| `history` | `history` | View history of executed commands |
| `curl` | `curl <url>` | Securely fetch web data (HTTP/HTTPS only) |
| `ping` | `ping <host>` | Emulate network ICMP ping diagnostics |
| `ifconfig` | `ifconfig` | Display virtual network interface details |
| `matrix` | `matrix [stop]` | Toggle Matrix rain animation on background canvas |
| `reset` | `reset` | Factory-reset terminal state and VFS cookies |

---

## 🎨 Themes

To switch themes, run `theme <name>` inside the shell:
```bash
[user@panfam-terminal:~]$ theme dracula
[user@panfam-terminal:~]$ theme amber
[user@panfam-terminal:~]$ theme cyberpunk
[user@panfam-terminal:~]$ theme nord
[user@panfam-terminal:~]$ theme monokai
[user@panfam-terminal:~]$ theme solarized
[user@panfam-terminal:~]$ theme matrix
```

---

## 🧪 Running Automated Tests

Run the included standalone Node test harness:

```bash
node tests/test_suite.js
```

All 12 test assertions check sanitization, XSS blocking, path traversal prevention, VFS integrity, theme switching, and command pipelines.

---

## 📜 Full Release History

Read the comprehensive version-by-version evolution in [release notes.md](file:///S:/Common/projects/Terminal/release%20notes.md).

For architectural specifications, see [ARCHITECTURE.md](file:///S:/Common/projects/Terminal/docs/ARCHITECTURE.md).
