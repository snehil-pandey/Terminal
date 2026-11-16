# Panfam OS (PFOS)

[![Tests Status](https://img.shields.io/badge/tests-27%2F27%20passing-brightgreen)](#)
[![OS Architecture](https://img.shields.io/badge/architecture-PF%20Core%20v1.2-blue)](#)
[![Native Language](https://img.shields.io/badge/language-.pf%20v1.0-purple)](#)
[![Security Hardened](https://img.shields.io/badge/cybersecurity-peak%20hardened-blue)](#)
[![Theme Engine](https://img.shields.io/badge/themes-7%20palettes-orange)](#)

---

## 💭 Reflection & Growth

> *"Looking back at where this project began in 2022 with simple string checks and experimental scripts, it's humbling to see how far we've come. What started as an aspiring journey into coding and web scripting has evolved into a production-grade, modular, security-hardened Linux CLI emulator and complete operating environment. Engineering with cybersecurity at its peak, decoupling logic into cohesive modules, and building a true persistent POSIX filesystem is a testament to learning, iterating, and constantly raising the bar on our standards."*

---

**Panfam OS** is an independent, programmable operating environment running in the browser, featuring its own native programming language (`.pf`), POSIX shell (PFSH), virtual hardware architecture, process manager, layered persistence engine, and desktop capabilities.

---

## 🚀 Panfam OS Subsystems

- **PF Core & Hardware Abstraction**: Multicore virtual CPU simulation, virtual memory controller with heap and process limits, device registry, and kernel syscall security layer (`sys_spawn`, `sys_kill`, `sys_read`, `sys_write`, `sys_meminfo`, `sys_cpuinfo`, audit logs).
- **Native Programming Language (`.pf`)**: Dedicated lexer, recursive-descent parser, and tree-walk interpreter without `eval()`. Supports classes, methods, constructors (`init`), variables, control flow, and standard libraries (`std.io`, `std.math`, `std.system`).
- **Panfam Shell (PFSH)**: POSIX AST execution engine supporting quotes, escapes, multi-stage pipelines (`|`), input/output redirections (`<`, `>`, `>>`, `2>`), and logical operators (`&&`, `||`, `;`).
- **Package Manager (`pfpm`)**: Native package lifecycle management (`install`, `remove`, `list`, `search`) and application bundles.
- **Desktop Window Manager**: Draggable, resizable windows with focus management, minimization, and maximization.
- **Persistent VFS**: Inode-based filesystem with symbolic links (`ln -s`, `readlink`), loop protection, permissions (`chmod`, `chown`), and synthetic `/proc`.
- **7 Preserved Themes**: `matrix`, `amber`, `cyberpunk`, `dracula`, `nord`, `monokai`, and `solarized`.

---

## 🛠️ Quick Start

Launch [index.html](file:///S:/Common/projects/Terminal/index.html) in any browser, or run a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .
```

Open `http://localhost:8000/`.

---

## 💻 Sample `.pf` Code Execution

Run `.pf` programs directly inside the shell:

```bash
# Evaluate inline code
[snehil@panfam ~]$ pf eval 'let x = 6 * 7; print("Answer:", x)'

# Execute a .pf program file
[snehil@panfam ~]$ cat << 'EOF' > test.pf
class Greeter {
    init(prefix) {
        self.prefix = prefix
    }
    function greet(name) {
        return self.prefix + " " + name
    }
}
let g = Greeter("Welcome to Panfam OS,")
print(g.greet("Snehil"))
EOF
[snehil@panfam ~]$ pf run test.pf
```

---

## 🧪 Automated Testing

Run the unified test runner covering all 27 OS, language, and shell assertions:

```bash
node tests/run_all_tests.js
```

---

## 📜 Complete Documentation

- OS Architecture Specification: [ARCHITECTURE.md](file:///S:/Common/projects/Terminal/documentation/ARCHITECTURE.md)
- Native Language Specification (`.pf`): [LANGUAGE_SPECIFICATION.md](file:///S:/Common/projects/Terminal/documentation/LANGUAGE_SPECIFICATION.md)
- Cybersecurity & Threat Model: [SECURITY.md](file:///S:/Common/projects/Terminal/documentation/SECURITY.md)
- Command Reference: [COMMAND_REFERENCE.md](file:///S:/Common/projects/Terminal/documentation/COMMAND_REFERENCE.md)
- Engineering Upgrade Audit: [UPGRADE_AUDIT.md](file:///S:/Common/projects/Terminal/documentation/UPGRADE_AUDIT.md)
- Testing Methodology: [TESTING.md](file:///S:/Common/projects/Terminal/documentation/TESTING.md)
- Changelog: [CHANGELOG.md](file:///S:/Common/projects/Terminal/CHANGELOG.md)
