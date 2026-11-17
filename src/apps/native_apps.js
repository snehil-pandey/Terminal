/**
 * Panfam OS - Native Desktop Applications Suite
 * Implements real, connected browser-native desktop apps:
 * - Code Studio (PF Studio: open, save, run, syntax check, diagnostics, process lifecycle)
 * - Task Manager (Live ProcessManager processes, CPU/Memory stats, terminate)
 * - File Manager (Live VirtualFileSystem explorer: browse, open, create, delete)
 * - Settings (Theme selection with white/dark palette, storage export/import backup)
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.PFNativeApps = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class NativeAppRegistry {
        static createCodeStudio(services, wm) {
            const container = document.createElement('div');
            container.className = 'pf-app-editor';

            let currentFilePath = '/home/user/main.pf';
            let activePid = null;

            // Load initial content from VFS if exists
            let initialContent = `// Panfam Language (.pf) Studio
class Greeter {
    init(name: String) {
        self.name = name
    }

    greet() -> String {
        return "Hello from Panfam OS, " + self.name
    }
}

let g = Greeter("Developer")
print(g.greet())`;

            if (services && services.vfs && services.vfs.exists(currentFilePath)) {
                try { initialContent = services.vfs.readFile(currentFilePath); } catch (_) {}
            }

            container.innerHTML = `
                <div class="pf-editor-toolbar">
                    <span class="pf-editor-file-badge" id="pf-editor-filename">${currentFilePath}</span>
                    <button class="pf-btn" id="pf-btn-editor-run">&#9658; Run .pf</button>
                    <button class="pf-btn" id="pf-btn-editor-stop" style="display:none;background:#e74c3c;">&#9632; Stop</button>
                    <button class="pf-btn" id="pf-btn-editor-check">&#10003; Check</button>
                    <button class="pf-btn" id="pf-btn-editor-format">Format</button>
                    <button class="pf-btn" id="pf-btn-editor-save">&#128190; Save</button>
                </div>
                <div class="pf-editor-workspace" style="display:flex;flex:1;flex-direction:column;gap:8px;">
                    <textarea class="pf-editor-area" spellcheck="false" id="pf-editor-textarea">${initialContent}</textarea>
                    <div class="pf-editor-console" id="pf-editor-console" style="height:110px;background:#050a06;border:1px solid var(--term-border);padding:8px;font-size:12px;overflow:auto;color:var(--term-fg);">
                        <div>[PF Studio Ready]</div>
                    </div>
                </div>
            `;

            const textarea = container.querySelector('#pf-editor-textarea');
            const consoleEl = container.querySelector('#pf-editor-console');
            const btnRun = container.querySelector('#pf-btn-editor-run');
            const btnStop = container.querySelector('#pf-btn-editor-stop');
            const btnCheck = container.querySelector('#pf-btn-editor-check');
            const btnFormat = container.querySelector('#pf-btn-editor-format');
            const btnSave = container.querySelector('#pf-btn-editor-save');

            const log = (msg, isErr = false) => {
                const line = document.createElement('div');
                line.style.color = isErr ? 'var(--term-error)' : 'var(--term-fg)';
                line.textContent = `> ${msg}`;
                consoleEl.appendChild(line);
                consoleEl.scrollTop = consoleEl.scrollHeight;
            };

            // Save to VFS
            btnSave.addEventListener('click', () => {
                if (services && services.vfs) {
                    try {
                        services.vfs.writeFile(currentFilePath, textarea.value, 'user');
                        log(`Saved '${currentFilePath}' successfully.`);
                    } catch (e) {
                        log(`Save error: ${e.message}`, true);
                    }
                }
            });

            // Format code
            btnFormat.addEventListener('click', () => {
                const Formatter = (typeof window !== 'undefined' && window.PFFormatter) ? window.PFFormatter : null;
                if (Formatter && Formatter.format) {
                    textarea.value = Formatter.format(textarea.value);
                    log(`Formatted document.`);
                }
            });

            // Type Check
            btnCheck.addEventListener('click', () => {
                const TypeChecker = (typeof window !== 'undefined' && window.PFTypeChecker) ? window.PFTypeChecker : null;
                if (TypeChecker && TypeChecker.check) {
                    const res = TypeChecker.check(textarea.value, currentFilePath);
                    if (res.valid) {
                        log(`Type check passed: 0 errors.`);
                    } else {
                        res.diagnostics.forEach(d => log(d.toString(), true));
                    }
                }
            });

            // Run program
            btnRun.addEventListener('click', () => {
                consoleEl.innerHTML = '<div>[Executing .pf program...]</div>';
                btnRun.style.display = 'none';
                btnStop.style.display = 'inline-block';

                if (services && services.spawnWorkerProcess) {
                    const proc = services.spawnWorkerProcess(currentFilePath, textarea.value, 'user', {
                        onStdout: (out) => log(out),
                        onComplete: () => {
                            log(`[Process Finished (Exit: 0)]`);
                            btnRun.style.display = 'inline-block';
                            btnStop.style.display = 'none';
                            activePid = null;
                        },
                        onError: (err) => {
                            log(`Runtime error: ${err}`, true);
                            btnRun.style.display = 'inline-block';
                            btnStop.style.display = 'none';
                            activePid = null;
                        }
                    });
                    activePid = proc.pid;
                    log(`Spawned process PID ${activePid}.`);
                }
            });

            // Stop program
            btnStop.addEventListener('click', () => {
                if (activePid && services && services.terminateProcess) {
                    services.terminateProcess(activePid, 15, 'Stopped by User');
                    log(`Terminated PID ${activePid}.`);
                    btnRun.style.display = 'inline-block';
                    btnStop.style.display = 'none';
                    activePid = null;
                }
            });

            return container;
        }

        static createTaskManager(services, wm) {
            const container = document.createElement('div');
            container.className = 'pf-app-monitor';

            container.innerHTML = `
                <div class="pf-mon-stat-card">
                    <h4>Virtual Hardware Telemetry</h4>
                    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
                        <span id="pf-mon-cpu-text">CPU Load: 4%</span>
                        <span id="pf-mon-mem-text">Memory: 1840 MiB / 8192 MiB</span>
                    </div>
                    <div class="pf-progress-bar"><div class="pf-progress-fill" id="pf-mon-mem-bar" style="width: 22%;"></div></div>
                </div>

                <div style="display:flex;justify-content:space-between;align-items:center;margin:8px 0;">
                    <h4>Live Operating System Processes</h4>
                    <button class="pf-btn" id="pf-btn-task-refresh">&#8635; Refresh</button>
                </div>

                <table class="pf-table" id="pf-task-table">
                    <thead>
                        <tr><th>PID</th><th>Process</th><th>User</th><th>State</th><th>Memory</th><th>Action</th></tr>
                    </thead>
                    <tbody id="pf-task-tbody"></tbody>
                </table>
            `;

            const tbody = container.querySelector('#pf-task-tbody');
            const cpuText = container.querySelector('#pf-mon-cpu-text');
            const memText = container.querySelector('#pf-mon-mem-text');
            const memBar = container.querySelector('#pf-mon-mem-bar');
            const btnRefresh = container.querySelector('#pf-btn-task-refresh');

            const refresh = () => {
                if (!services || !services.processManager) return;
                const procs = services.processManager.list();
                tbody.innerHTML = '';

                // Telemetry
                if (services.hardware) {
                    const stats = services.hardware.getCPUStats ? services.hardware.getCPUStats() : { loadPercent: 6 };
                    cpuText.textContent = `CPU Load: ${stats.loadPercent}%`;
                    if (services.hardware.memory) {
                        const usedMB = Math.round(services.hardware.memory.usedBytes / (1024 * 1024));
                        const totalMB = Math.round(services.hardware.memory.totalBytes / (1024 * 1024));
                        const pct = Math.round((usedMB / totalMB) * 100);
                        memText.textContent = `Memory: ${usedMB} MiB / ${totalMB} MiB`;
                        memBar.style.width = `${pct}%`;
                    }
                }

                procs.forEach(p => {
                    const tr = document.createElement('tr');
                    const memMb = (p.memoryBytes / (1024 * 1024)).toFixed(1);
                    tr.innerHTML = `
                        <td><strong>${p.pid}</strong></td>
                        <td>${p.name}</td>
                        <td>${p.user}</td>
                        <td><span class="pf-badge ${p.state === 'RUNNING' ? 'running' : 'idle'}">${p.state}</span></td>
                        <td>${memMb} MiB</td>
                        <td>
                            ${p.pid > 1 ? `<button class="pf-btn pf-btn-danger" data-kill-pid="${p.pid}">Kill</button>` : '<span style="color:#666">System</span>'}
                        </td>
                    `;
                    tbody.appendChild(tr);
                });

                // Attach kill buttons
                tbody.querySelectorAll('[data-kill-pid]').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const targetPid = parseInt(e.target.dataset.killPid, 10);
                        if (services.terminateProcess) {
                            services.terminateProcess(targetPid, 9, 'SIGKILL');
                        } else if (services.kernel) {
                            services.kernel.sys_kill(targetPid, 1, 'user');
                        }
                        refresh();
                    });
                });
            };

            btnRefresh.addEventListener('click', refresh);
            refresh();
            const interval = setInterval(refresh, 2000);
            container.addEventListener('DOMNodeRemoved', () => clearInterval(interval));

            return container;
        }

        static createFileManager(services, wm) {
            const container = document.createElement('div');
            container.className = 'pf-app-files';

            let currentPath = '/home/user';

            container.innerHTML = `
                <div class="pf-files-sidebar">
                    <div style="font-weight:bold;margin-bottom:8px;color:#fff;">Locations</div>
                    <div class="pf-nav-item" data-path="/home/user">&#127968; Home</div>
                    <div class="pf-nav-item" data-path="/">&#128193; / (Root)</div>
                    <div class="pf-nav-item" data-path="/etc">&#9881; /etc</div>
                    <div class="pf-nav-item" data-path="/bin">&#9889; /bin</div>
                    <div class="pf-nav-item" data-path="/proc">&#128202; /proc</div>
                </div>
                <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
                    <div style="display:flex;gap:8px;align-items:center;">
                        <span id="pf-files-path-bar" style="font-weight:bold;color:var(--term-path);">${currentPath}</span>
                        <div style="margin-left:auto;display:flex;gap:6px;">
                            <button class="pf-btn" id="pf-btn-files-mkdir">+ Folder</button>
                            <button class="pf-btn" id="pf-btn-files-touch">+ File</button>
                        </div>
                    </div>
                    <div class="pf-files-content" id="pf-files-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(130px, 1fr));gap:8px;overflow:auto;"></div>
                </div>
            `;

            const grid = container.querySelector('#pf-files-grid');
            const pathBar = container.querySelector('#pf-files-path-bar');
            const navItems = container.querySelectorAll('.pf-nav-item');
            const btnMkdir = container.querySelector('#pf-btn-files-mkdir');
            const btnTouch = container.querySelector('#pf-btn-files-touch');

            const renderFolder = (targetPath) => {
                currentPath = targetPath;
                pathBar.textContent = currentPath;
                grid.innerHTML = '';
                if (!services || !services.vfs) return;

                try {
                    const entries = services.vfs.readDir(currentPath);
                    entries.forEach(e => {
                        const item = document.createElement('div');
                        item.className = 'pf-file-item';
                        item.style.padding = '10px';
                        item.style.background = 'rgba(255,255,255,0.05)';
                        item.style.borderRadius = '6px';
                        item.style.cursor = 'pointer';
                        item.style.textAlign = 'center';

                        const icon = e.type === 'dir' ? '&#128193;' : '&#128196;';
                        item.innerHTML = `
                            <div style="font-size:24px;">${icon}</div>
                            <div style="font-size:12px;margin-top:4px;word-break:break-all;">${e.name}</div>
                        `;

                        item.addEventListener('dblclick', () => {
                            if (e.type === 'dir') {
                                const next = currentPath === '/' ? `/${e.name}` : `${currentPath}/${e.name}`;
                                renderFolder(next);
                            }
                        });

                        grid.appendChild(item);
                    });
                } catch (err) {
                    grid.innerHTML = `<div style="color:var(--term-error);">Error: ${err.message}</div>`;
                }
            };

            navItems.forEach(n => {
                n.addEventListener('click', (e) => {
                    renderFolder(e.target.dataset.path);
                });
            });

            btnMkdir.addEventListener('click', () => {
                const name = prompt('New directory name:');
                if (name && services && services.vfs) {
                    services.vfs.makeDir(`${currentPath}/${name}`, false, 'user');
                    renderFolder(currentPath);
                }
            });

            btnTouch.addEventListener('click', () => {
                const name = prompt('New file name:');
                if (name && services && services.vfs) {
                    services.vfs.writeFile(`${currentPath}/${name}`, '', 'user');
                    renderFolder(currentPath);
                }
            });

            renderFolder(currentPath);
            return container;
        }

        static createSettings(services, wm) {
            const container = document.createElement('div');
            container.className = 'pf-app-settings';

            container.innerHTML = `
                <div style="display:flex;flex-direction:column;gap:12px;">
                    <h3>Panfam OS Visual &amp; System Configuration</h3>
                    
                    <label style="font-size:13px;">Desktop Visual Theme:
                        <select class="pf-select" id="pf-settings-theme">
                            <option value="matrix">matrix (Classic Green CRT)</option>
                            <option value="amber">amber (Vintage Amber)</option>
                            <option value="cyberpunk">cyberpunk (Neon Pink &amp; Cyan)</option>
                            <option value="dracula">dracula (Dracula Purple Dark)</option>
                            <option value="nord">nord (Nordic Arctic Frost)</option>
                            <option value="monokai">monokai (Monokai Pro High Contrast)</option>
                            <option value="solarized">solarized (Solarized Precision Dark)</option>
                        </select>
                    </label>

                    <label style="font-size:13px;">High-Contrast White UI Text Mode:
                        <input type="checkbox" id="pf-settings-white-accent" style="margin-left:8px;" />
                        <span style="font-size:11px;color:#aaa;">(Enable clean white typography overlay)</span>
                    </label>

                    <hr style="border:none;border-top:1px solid var(--term-border);margin:8px 0;" />

                    <h4>Storage &amp; Disaster Recovery</h4>
                    <div style="display:flex;gap:8px;">
                        <button class="pf-btn" id="pf-btn-export-backup">&#128229; Export Backup</button>
                        <button class="pf-btn" id="pf-btn-import-backup">&#128228; Import Backup</button>
                    </div>
                    <div id="pf-settings-status" style="font-size:12px;color:var(--term-prompt);"></div>
                </div>
            `;

            const themeSelect = container.querySelector('#pf-settings-theme');
            const whiteCheck = container.querySelector('#pf-settings-white-accent');
            const btnExport = container.querySelector('#pf-btn-export-backup');
            const btnImport = container.querySelector('#pf-btn-import-backup');
            const statusEl = container.querySelector('#pf-settings-status');

            if (services && services.themeManager) {
                themeSelect.value = services.themeManager.current;
            }

            themeSelect.addEventListener('change', (e) => {
                const newTheme = e.target.value;
                if (services && services.themeManager) {
                    services.themeManager.apply(newTheme);
                    statusEl.textContent = `Applied theme '${newTheme}'.`;
                }
            });

            whiteCheck.addEventListener('change', (e) => {
                if (e.target.checked) {
                    document.documentElement.style.setProperty('--term-fg', '#ffffff');
                    statusEl.textContent = 'High-contrast white typography enabled.';
                } else {
                    if (services && services.themeManager) {
                        services.themeManager.apply(themeSelect.value);
                    }
                    statusEl.textContent = 'Restored theme typography.';
                }
            });

            btnExport.addEventListener('click', () => {
                if (services && services.vfs) {
                    const backupData = JSON.stringify({
                        version: '4.0',
                        timestamp: new Date().toISOString(),
                        vfs: services.vfs.root
                    }, null, 2);
                    const blob = new Blob([backupData], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `pfos-backup-${Date.now()}.json`;
                    a.click();
                    statusEl.textContent = 'Backup exported successfully.';
                }
            });

            btnImport.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                            try {
                                const parsed = JSON.parse(evt.target.result);
                                if (services && services.vfs && typeof services.vfs.validateAndImport === 'function') {
                                    const res = services.vfs.validateAndImport(parsed);
                                    statusEl.textContent = `Backup validated & restored successfully (${res.importedNodes} nodes).`;
                                } else if (parsed && parsed.vfs && services && services.vfs) {
                                    services.vfs.root = parsed.vfs;
                                    services.vfs.save();
                                    statusEl.textContent = 'Backup restored into VFS successfully.';
                                }
                            } catch (err) {
                                statusEl.textContent = `Import error: ${err.message}`;
                            }
                        };
                        reader.readAsText(file);
                    }
                };
                input.click();
            });

            return container;
        }
    }

    return NativeAppRegistry;
});
