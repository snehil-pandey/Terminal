# Panfam-Terminal Command Reference

Complete reference of all supported commands in Panfam-Terminal v.3.0.

---

## 1. Filesystem Commands

| Command | Syntax | Description |
|:---|:---|:---|
| `pwd` | `pwd` | Print name of current working directory |
| `cd` | `cd [dir]` | Change directory (supports `~`, `..`, relative and absolute paths) |
| `ls` | `ls [-a] [-l] [path]` | List directory contents with permissions, owner, size, and timestamps |
| `cat` | `cat [file...]` | Concatenate files and print on standard output |
| `touch` | `touch <file...>` | Update file timestamps or create empty files |
| `mkdir` | `mkdir [-p] <dir...>` | Create directories (supports recursive `-p`) |
| `rmdir` | `rmdir <dir...>` | Remove empty directories |
| `rm` | `rm [-r] <file...>` | Remove files or directories recursively |
| `cp` | `cp <source> <dest>` | Copy file contents |
| `mv` | `mv <source> <dest>` | Move or rename files |
| `ln` | `ln [-s] <target> <link>` | Create symbolic or hard links |
| `readlink` | `readlink <file>` | Print resolved target of symbolic links |
| `stat` | `stat <file>` | Display detailed file status and inode metadata |
| `tree` | `tree [path]` | Display directory contents in a tree format |
| `find` | `find [path] [-name pattern]` | Search files in directory hierarchy |
| `df` | `df [-h]` | Report virtual filesystem disk space usage |
| `du` | `du [path]` | Estimate file space usage |
| `basename` | `basename <path>` | Strip directory prefix from file path |
| `dirname` | `dirname <path>` | Strip file component to return directory path |

---

## 2. Text Processing Commands

| Command | Syntax | Description |
|:---|:---|:---|
| `echo` | `echo [text...]` | Print arguments and expand environment variables |
| `printf` | `printf <format> [args...]` | Format and print data |
| `grep` | `grep [-i] [-v] [-n] [-c] <pattern> [file...]` | Regex search with case-insensitivity, line numbers, or counts |
| `head` | `head [-n <lines>] [file]` | Output first lines of file or stdin stream |
| `tail` | `tail [-n <lines>] [file]` | Output last lines of file or stdin stream |
| `wc` | `wc [-l] [-w] [-c] [file]` | Count lines, words, and characters |
| `sort` | `sort [-r] [-n] [file]` | Sort lines of text alphabetically or numerically |
| `uniq` | `uniq [-c] [file]` | Report or filter repeated adjacent lines |
| `cut` | `cut [-d delim] [-f field] [file]` | Extract specific column fields |
| `tr` | `tr <set1> <set2>` | Translate or transform character sets |
| `tee` | `tee [-a] [file...]` | Read from stdin and write to stdout and files |
| `diff` | `diff <file1> <file2>` | Compare files line by line |

---

## 3. System & Process Commands

| Command | Syntax | Description |
|:---|:---|:---|
| `whoami` | `whoami` | Print effective current user |
| `id` | `id` | Print real and effective user/group IDs |
| `hostname` | `hostname` | Print or show system hostname |
| `uname` | `uname [-a\|-r\|-m]` | Print system kernel and architecture information |
| `date` | `date` | Print current system date and time |
| `uptime` | `uptime` | Print how long virtual system has been active |
| `ps` | `ps` | Snapshot of active processes |
| `free` | `free [-h]` | Display memory usage |
| `top` | `top` | Real-time process snapshot |
| `chmod` | `chmod <mode> <file>` | Modify file permission bits (e.g. `chmod 755 file.sh`) |
| `chown` | `chown <owner[:group]> <file>` | Change file owner and group attributes |
| `sleep` | `sleep <seconds>` | Delay shell execution for specified interval |

---

## 4. Networking Commands

| Command | Syntax | Description |
|:---|:---|:---|
| `ifconfig` | `ifconfig` | View network interfaces (`eth0`, `lo`) |
| `ip` | `ip [addr\|route]` | Display device IP addresses and routing table |
| `ping` | `ping <host>` | Send simulated ICMP echo requests |
| `dig` | `dig <host>` | Perform DNS lookups |
| `nslookup` | `nslookup <host>` | Query name servers interactively |
| `ss` | `ss` | Investigate listening network sockets |
| `curl` | `curl <url>` | Secure HTTP/HTTPS data transfer |

---

## 5. Development & Utilities

| Command | Syntax | Description |
|:---|:---|:---|
| `git` | `git [init\|status\|add\|commit\|branch\|log]` | Simulated version control repository operations |
| `apt` / `apt-get` | `apt [update\|install\|list]` | Simulated package management |
| `base64` | `base64 [-d] [string]` | Base64 encoder and decoder |
| `sha256sum` | `sha256sum [file]` | Compute SHA256 checksums |
| `theme` | `theme [list\|name]` | List or switch active themes |
| `matrix` / `engage` | `matrix [stop]` | Toggle Matrix rain animation on background canvas |
| `clear` / `cls` | `clear` | Clear terminal display buffer |
| `history` | `history` | List command history |
| `reset` | `reset` | Reset VFS and terminal state back to clean default |
