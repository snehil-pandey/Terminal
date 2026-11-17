# Terminal Release Notes

---

### Reflection & Evolution
> *"Looking back at where this project began in 2022 with simple string concatenations and experimental escape hacks, it's humbling to see how far we've grown. What started as an aspiring journey into coding and web scripting has evolved into a production-grade, modular, security-hardened Linux CLI emulator. Engineering with cybersecurity at its peak, decoupling logic into cohesive modules, and building a true persistent POSIX filesystem is a testament to learning, iterating, and constantly raising the bar on our standards."*

---

### v.3.0 (Major Overhaul: Modular Architecture, Peak Cybersecurity & Linux VFS)
• **Architectural Redesign**: Deconstructed monolithic script into clean, modular layers (`src/core`, `src/fs`, `src/ui`, `src/commands`)  
• **Peak Cybersecurity & Anti-Injection**:
  - Full context-aware HTML entity sanitization eliminating DOM-based and stored XSS
  - Complete elimination of command/string injection via input sanitization (null byte & non-printable character stripping)
  - Strict directory traversal defenses forbidding illegal paths (`..`, `/`, `\`)
  - Strict Content Security Policy (CSP) integration preventing rogue remote script executions
  - Network request guardrails in `curl` restricting protocol schemes strictly to HTTP/HTTPS
• **Persistent Unix Virtual File System (VFS)**:
  - Authentic Linux directory hierarchy (`/bin`, `/etc`, `/dev`, `/home/user`, `/tmp`, `/var`)
  - Automatic synchronization and state persistence in browser cookies (`termfs_vfs_tree`) with storage resilience
  - File I/O redirection support (`>` and `>>`)
• **Interactive Linux Commands**:
  - Added `tty` printing authentic pseudo-terminal device `/dev/pts/0`
  - Added `ls` with support for `-a` and `-l` flags displaying file modes, owner, group, size, and timestamps
  - Added `pwd`, `cd`, `cat`, `touch`, `mkdir -p`, and `rm -r`
  - Added real-time process snapshot reporting (`ps`)
  - Added system utilities (`whoami`, `id`, `hostname`, `uname -a`, `uptime`, `date`, `env`, `export`, `cookies`, `history`, `curl`, `ping`, `ifconfig`, `reset`)
• **Theme Engine in Bash**:
  - Added on-the-fly theme switching via `theme <name>` command
  - Persisted in session cookies (`termfs_current_theme`)
  - Included 7 designer themes: `matrix`, `amber`, `cyberpunk`, `dracula`, `nord`, `monokai`, and `solarized`
• **Shell UX & Emulation**:
  - Bash-style prompt formatting (`[user@panfam-terminal:~]$`)
  - Full command history navigation with Up/Down arrow keys
  - Intelligent Tab auto-completion for both built-in commands and VFS filesystem paths
  - Matrix digital rain retained with enhanced cleanup controls (`matrix` / `engage`)
• **Testing & Quality Assurance**:
  - Standalone automated test suite ([test_suite.js](./tests/test_suite.js)) verifying security sanitization, filesystem integrity, and command pipelines. See [TESTING.md](./documentation/TESTING.md).
• **Documentation**:
  - See [README.md](./README.md), [COMMAND_REFERENCE.md](./documentation/COMMAND_REFERENCE.md), and [SECURITY.md](./documentation/SECURITY.md).

---

### v.2.2
• Correction of output when 'system\res' command is called  
• Implementation of error handling when 'system\battery' command is called

### v.2.1
• Addition of 'terminal\rn' to get release notes of Terminal  
• Addition of 'system\battery' command to get battery level and status  

### v.2.0
• Addition of get screen resolution through 'system\res'  
• Addition of 'terminal' command with it's sub-command 'terminal\v' to get terminal version in the place of 'bash-v'

### v.1.9
• Removal of glitch faced with ' ; ' seperator  
• Named the bash as Terminal

### v.1.8
• Addition of ' ; ' seperator to take multiple inputs of commands  
• Removal of error when user uses special characters(only & , < and > symbols) 

### v.1.7
• Removal of error while getting iOS device version  

### v.1.6
• Addition of command 'system\version' to get device version of Android an iOS devices  
• Addition of feature to identify difference between Linux and Android devices 

### v.1.5
• Removal of glitch with 'connect' command  
• Addition of command 'system\platform' to get device's operating system

### v.1.4
• Change in design of 'engage' output  
• Removal of glitch with 'network\ip' command

### v.1.3
• Addition of 'connect' command

### v.1.2
• Removal of case sensitivity of commands

### v.1.1
• Addition of '\abort' sub-command to halt the engage output  
• Addition of error handling when 'engage' and 'engage\abort' are used simultaneously

### v.1.0
• Change in the design of output when 'engage' command is called

### v.0.9
• Removal of glitch related to 'engage' command

### v.0.8
• Removal of glitch on clicking printed text

### v.0.7
• Removal of glitch occurring while pressing backspace

### v.0.6
• This update includes addition of 'echo' command to print text

### v.0.5
• This update includes modifications of bash  
• Addition of 'bash-v' command to get bash version

### v.0.4
• This update includes addition of 'list' command   
• Description to all commands which can be accessed by adding ' \? ' after any commands but not for sub-commands

### v.0.3
• This update includes addition of network commands with it's sub-commands '\gateway' and '\ip'  

### v.0.2
• This update includes addition of system command with it's sub-commands '\date' and '\time'  

### v.0.1
• This update includes addition of 'engage' and 'cls' commands  
• Removal of horizontal scrolling in bash
