/**
 * Panfam OS - Window Manager & Interactive Desktop Shell
 * Manages draggable, resizable windows, taskbar, dock, application launcher,
 * virtual workspaces, and focus z-order.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.PFWindowManager = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class WindowInstance {
        constructor(id, title, appComponent, options = {}) {
            this.id = id;
            this.title = title;
            this.app = appComponent;
            this.options = options || {};
            this.width = options.width || 680;
            this.height = options.height || 440;
            this.x = options.x !== undefined ? options.x : 80;
            this.y = options.y !== undefined ? options.y : 60;
            this.workspace = options.workspace || 1;
            this.isMinimized = false;
            this.isMaximized = false;
            this.zIndex = 10;
            this.element = null;
        }
    }

    class WindowManager {
        constructor(containerEl = null, services = null) {
            this.windows = new Map();
            this.activeWindowId = null;
            this.nextWindowId = 1;
            this.topZ = 100;
            this.currentWorkspace = 1;
            this.container = containerEl;
            this.services = services || {}; // kernel, vfs, pm, hw
            this.dockEl = null;
            this.topBarEl = null;
            this.isDesktopActive = false;
        }

        setServices(services) {
            this.services = services;
        }

        init(container = document.body) {
            this.container = container;
            this.renderDesktopStructure();
            this.bindGlobalShortcuts();
            this.updateClock();
            setInterval(() => this.updateClock(), 1000);
        }

        renderDesktopStructure() {
            if (typeof document === 'undefined') return;

            // Check if desktop container already exists
            let desktop = document.getElementById('pf-desktop-environment');
            if (!desktop) {
                desktop = document.createElement('div');
                desktop.id = 'pf-desktop-environment';
                desktop.className = 'pf-desktop pf-desktop-hidden';
                this.container.appendChild(desktop);
            }

            desktop.innerHTML = `
                <header class="pf-topbar" id="pf-topbar">
                    <div class="pf-topbar-left">
                        <span class="pf-logo-badge">PFOS</span>
                        <span class="pf-active-app" id="pf-active-app-title">Desktop</span>
                    </div>
                    <div class="pf-topbar-center">
                        <div class="pf-workspace-switcher" id="pf-workspace-switcher">
                            <button class="pf-ws-btn active" data-ws="1">1</button>
                            <button class="pf-ws-btn" data-ws="2">2</button>
                            <button class="pf-ws-btn" data-ws="3">3</button>
                            <button class="pf-ws-btn" data-ws="4">4</button>
                        </div>
                    </div>
                    <div class="pf-topbar-right">
                        <button class="pf-mode-toggle" id="pf-btn-switch-cli" title="Toggle Terminal / Desktop (Ctrl+Alt+D)">Terminal Mode</button>
                        <span class="pf-sys-stat" id="pf-sys-cpu">CPU: 2%</span>
                        <span class="pf-sys-stat" id="pf-sys-mem">MEM: 18%</span>
                        <span class="pf-clock" id="pf-clock">00:00:00</span>
                    </div>
                </header>

                <main class="pf-workspace-canvas" id="pf-workspace-canvas"></main>

                <nav class="pf-dock" id="pf-dock">
                    <button class="pf-dock-item" data-app="terminal" title="PFSH Terminal">
                        <span class="pf-dock-icon">$_</span>
                        <span class="pf-dock-label">Terminal</span>
                    </button>
                    <button class="pf-dock-item" data-app="editor" title="PF Code Editor">
                        <span class="pf-dock-icon">&lt;/&gt;</span>
                        <span class="pf-dock-label">Editor</span>
                    </button>
                    <button class="pf-dock-item" data-app="files" title="Virtual File Manager">
                        <span class="pf-dock-icon">&#128193;</span>
                        <span class="pf-dock-label">Files</span>
                    </button>
                    <button class="pf-dock-item" data-app="monitor" title="Task & System Monitor">
                        <span class="pf-dock-icon">&#9881;</span>
                        <span class="pf-dock-label">Monitor</span>
                    </button>
                    <button class="pf-dock-item" data-app="settings" title="Panfam Settings">
                        <span class="pf-dock-icon">&#9889;</span>
                        <span class="pf-dock-label">Settings</span>
                    </button>
                </nav>
            `;

            this.bindEvents(desktop);
        }

        bindEvents(desktop) {
            // Workspace switcher
            const wsBtns = desktop.querySelectorAll('.pf-ws-btn');
            wsBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const ws = parseInt(e.target.dataset.ws, 10);
                    this.switchWorkspace(ws);
                });
            });

            // Switch to CLI
            const switchCliBtn = desktop.querySelector('#pf-btn-switch-cli');
            if (switchCliBtn) {
                switchCliBtn.addEventListener('click', () => {
                    this.toggleDesktop(false);
                });
            }

            // Dock apps
            const dockItems = desktop.querySelectorAll('.pf-dock-item');
            dockItems.forEach(item => {
                item.addEventListener('click', () => {
                    const app = item.dataset.app;
                    this.launchApp(app);
                });
            });
        }

        bindGlobalShortcuts() {
            if (typeof window === 'undefined') return;
            window.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.altKey && (e.key === 'd' || e.key === 'D')) {
                    e.preventDefault();
                    this.toggleDesktop(!this.isDesktopActive);
                }
            });
        }

        toggleDesktop(enable) {
            this.isDesktopActive = !!enable;
            const desktopEl = document.getElementById('pf-desktop-environment');
            const cliEl = document.getElementById('content');
            if (desktopEl) {
                if (this.isDesktopActive) {
                    desktopEl.classList.remove('pf-desktop-hidden');
                    if (cliEl) cliEl.classList.add('terminal-cli-hidden');
                    if (this.windows.size === 0) {
                        this.launchApp('monitor');
                    }
                } else {
                    desktopEl.classList.add('pf-desktop-hidden');
                    if (cliEl) cliEl.classList.remove('terminal-cli-hidden');
                    const inputEl = document.getElementById('cli-input') || document.getElementById('user-input');
                    if (inputEl) inputEl.focus();
                }
            }
        }

        switchWorkspace(ws) {
            this.currentWorkspace = ws;
            if (typeof document === 'undefined') return;
            const wsBtns = document.querySelectorAll('.pf-ws-btn');
            wsBtns.forEach(btn => {
                btn.classList.toggle('active', parseInt(btn.dataset.ws, 10) === ws);
            });

            // Update window visibility based on workspace
            this.windows.forEach(win => {
                if (win.element) {
                    if (win.workspace === ws && !win.isMinimized) {
                        win.element.style.display = 'flex';
                    } else {
                        win.element.style.display = 'none';
                    }
                }
            });
        }

        updateClock() {
            if (typeof document === 'undefined') return;
            const clockEl = document.getElementById('pf-clock');
            if (clockEl) {
                const now = new Date();
                clockEl.textContent = now.toTimeString().split(' ')[0];
            }

            // Update live telemetry from shared services
            if (this.services && this.services.hw) {
                const cpuEl = document.getElementById('pf-sys-cpu');
                const memEl = document.getElementById('pf-sys-mem');
                if (cpuEl) {
                    const stats = this.services.hw.getCPUStats ? this.services.hw.getCPUStats() : { loadPercent: 4 };
                    cpuEl.textContent = `CPU: ${stats.loadPercent}%`;
                }
                if (memEl && this.services.hw.memory) {
                    const memPercent = Math.round((this.services.hw.memory.usedBytes / this.services.hw.memory.totalBytes) * 100);
                    memEl.textContent = `MEM: ${memPercent}%`;
                }
            }
        }

        openWindow(title, appContent, options = {}) {
            const id = 'win_' + (this.nextWindowId++);
            const win = new WindowInstance(id, title, appContent, options);
            win.zIndex = ++this.topZ;
            win.workspace = options.workspace || this.currentWorkspace;
            this.windows.set(id, win);
            this.activeWindowId = id;

            if (typeof document !== 'undefined') {
                this.mountWindowElement(win);
            }

            return win;
        }

        mountWindowElement(win) {
            const canvas = document.getElementById('pf-workspace-canvas');
            if (!canvas) return;

            const winEl = document.createElement('section');
            winEl.id = win.id;
            winEl.className = 'pf-window';
            winEl.style.width = win.width + 'px';
            winEl.style.height = win.height + 'px';
            winEl.style.left = win.x + 'px';
            winEl.style.top = win.y + 'px';
            winEl.style.zIndex = win.zIndex;

            winEl.innerHTML = `
                <div class="pf-window-header" data-drag-handle="true">
                    <div class="pf-window-title">
                        <span class="pf-window-dot"></span>
                        <span class="pf-window-text">${win.title}</span>
                    </div>
                    <div class="pf-window-controls">
                        <button class="pf-btn-win pf-win-min" title="Minimize" data-action="min">&#8722;</button>
                        <button class="pf-btn-win pf-win-max" title="Maximize" data-action="max">&#9633;</button>
                        <button class="pf-btn-win pf-win-close" title="Close" data-action="close">&#10005;</button>
                    </div>
                </div>
                <div class="pf-window-body">
                    ${typeof win.app === 'string' ? win.app : ''}
                </div>
                <div class="pf-window-resize-handle"></div>
            `;

            if (typeof win.app !== 'string' && win.app instanceof Node) {
                winEl.querySelector('.pf-window-body').appendChild(win.app);
            }

            this.setupWindowInteractions(winEl, win);
            canvas.appendChild(winEl);
            win.element = winEl;

            this.focusWindow(win.id);
        }

        setupWindowInteractions(winEl, win) {
            const header = winEl.querySelector('.pf-window-header');
            const controls = winEl.querySelector('.pf-window-controls');
            const resizeHandle = winEl.querySelector('.pf-window-resize-handle');

            winEl.addEventListener('pointerdown', () => {
                this.focusWindow(win.id);
            });

            // Window Controls
            controls.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action === 'close') this.closeWindow(win.id);
                if (action === 'min') this.minimizeWindow(win.id);
                if (action === 'max') this.maximizeWindow(win.id);
            });

            // Window Dragging
            let isDragging = false;
            let dragStartX = 0;
            let dragStartY = 0;
            let initX = 0;
            let initY = 0;

            header.addEventListener('pointerdown', (e) => {
                if (e.target.closest('.pf-window-controls')) return;
                isDragging = true;
                dragStartX = e.clientX;
                dragStartY = e.clientY;
                initX = win.x;
                initY = win.y;
                winEl.setPointerCapture(e.pointerId);
                this.focusWindow(win.id);
            });

            header.addEventListener('pointermove', (e) => {
                if (!isDragging || win.isMaximized) return;
                const dx = e.clientX - dragStartX;
                const dy = e.clientY - dragStartY;
                win.x = Math.max(0, initX + dx);
                win.y = Math.max(30, initY + dy);
                winEl.style.left = win.x + 'px';
                winEl.style.top = win.y + 'px';
            });

            const stopDrag = (e) => {
                if (isDragging) {
                    isDragging = false;
                    try { winEl.releasePointerCapture(e.pointerId); } catch (_) {}
                }
            };
            header.addEventListener('pointerup', stopDrag);
            header.addEventListener('pointercancel', stopDrag);

            // Window Resizing
            let isResizing = false;
            let resizeStartX = 0;
            let resizeStartY = 0;
            let initW = 0;
            let initH = 0;

            if (resizeHandle) {
                resizeHandle.addEventListener('pointerdown', (e) => {
                    e.stopPropagation();
                    isResizing = true;
                    resizeStartX = e.clientX;
                    resizeStartY = e.clientY;
                    initW = win.width;
                    initH = win.height;
                    resizeHandle.setPointerCapture(e.pointerId);
                });

                resizeHandle.addEventListener('pointermove', (e) => {
                    if (!isResizing || win.isMaximized) return;
                    const dw = e.clientX - resizeStartX;
                    const dh = e.clientY - resizeStartY;
                    win.width = Math.max(300, initW + dw);
                    win.height = Math.max(200, initH + dh);
                    winEl.style.width = win.width + 'px';
                    winEl.style.height = win.height + 'px';
                });

                const stopResize = (e) => {
                    if (isResizing) {
                        isResizing = false;
                        try { resizeHandle.releasePointerCapture(e.pointerId); } catch (_) {}
                    }
                };
                resizeHandle.addEventListener('pointerup', stopResize);
                resizeHandle.addEventListener('pointercancel', stopResize);
            }
        }

        closeWindow(id) {
            const win = this.windows.get(id);
            if (win) {
                if (typeof win.options.onBeforeClose === 'function') {
                    const allowClose = win.options.onBeforeClose();
                    if (allowClose === false) {
                        return false;
                    }
                }
                if (win.element && win.element.parentNode) {
                    win.element.parentNode.removeChild(win.element);
                }
            }
            this.windows.delete(id);
            if (this.activeWindowId === id) {
                const remaining = Array.from(this.windows.keys());
                this.activeWindowId = remaining.length > 0 ? remaining[remaining.length - 1] : null;
                if (this.activeWindowId) this.focusWindow(this.activeWindowId);
            }
            return true;
        }

        focusWindow(id) {
            const win = this.windows.get(id);
            if (win) {
                win.zIndex = ++this.topZ;
                win.isMinimized = false;
                this.activeWindowId = id;
                if (win.element && typeof document !== 'undefined') {
                    win.element.style.zIndex = win.zIndex;
                    win.element.style.display = 'flex';
                    // Update active styling
                    document.querySelectorAll('.pf-window').forEach(el => el.classList.remove('active'));
                    win.element.classList.add('active');
                }
                if (typeof document !== 'undefined') {
                    const activeAppTitle = document.getElementById('pf-active-app-title');
                    if (activeAppTitle) activeAppTitle.textContent = win.title;
                }
            }
        }

        minimizeWindow(id) {
            const win = this.windows.get(id);
            if (win) {
                win.isMinimized = true;
                if (win.element) {
                    win.element.style.display = 'none';
                }
            }
        }

        maximizeWindow(id) {
            const win = this.windows.get(id);
            if (win) {
                win.isMaximized = !win.isMaximized;
                if (win.element) {
                    if (win.isMaximized) {
                        win.element.classList.add('maximized');
                    } else {
                        win.element.classList.remove('maximized');
                        win.element.style.width = win.width + 'px';
                        win.element.style.height = win.height + 'px';
                        win.element.style.left = win.x + 'px';
                        win.element.style.top = win.y + 'px';
                    }
                }
            }
        }

        launchApp(appName, initialArgs = {}) {
            const NativeApps = (typeof window !== 'undefined' && window.PFNativeApps) 
                ? window.PFNativeApps 
                : ((typeof require !== 'undefined') ? require('../apps/native_apps') : null);

            switch (appName) {
                case 'editor': {
                    if (NativeApps && NativeApps.createCodeStudio && typeof document !== 'undefined') {
                        const appDom = NativeApps.createCodeStudio(this.services, this, initialArgs);
                        const win = this.openWindow('PF Code Editor', appDom, {
                            width: 720,
                            height: 500,
                            onBeforeClose: () => {
                                if (appDom && typeof appDom.canClose === 'function') {
                                    return appDom.canClose();
                                }
                                return true;
                            }
                        });
                        win.appDom = appDom;
                        return win;
                    }
                    return this.openWindow('PF Code Editor', '<div class="pf-app-editor">PF Code Studio</div>', { width: 700, height: 480 });
                }
                case 'files': {
                    if (NativeApps && NativeApps.createFileManager && typeof document !== 'undefined') {
                        const appDom = NativeApps.createFileManager(this.services, this, initialArgs);
                        return this.openWindow('Virtual File Manager', appDom, { width: 660, height: 440 });
                    }
                    return this.openWindow('Virtual File Manager', '<div class="pf-app-files">File Manager</div>', { width: 620, height: 400 });
                }
                case 'monitor': {
                    if (NativeApps && NativeApps.createTaskManager && typeof document !== 'undefined') {
                        const appDom = NativeApps.createTaskManager(this.services, this, initialArgs);
                        return this.openWindow('Task & System Monitor', appDom, { width: 680, height: 460 });
                    }
                    return this.openWindow('Task & System Monitor', '<div class="pf-app-monitor">System Monitor</div>', { width: 640, height: 420 });
                }
                case 'settings': {
                    if (NativeApps && NativeApps.createSettings && typeof document !== 'undefined') {
                        const appDom = NativeApps.createSettings(this.services, this, initialArgs);
                        return this.openWindow('System Settings', appDom, { width: 520, height: 380 });
                    }
                    return this.openWindow('System Settings', '<div class="pf-app-settings">Settings</div>', { width: 500, height: 350 });
                }
                case 'terminal':
                default:
                    return this.openWindow('Terminal Session', `
                        <div class="pf-app-terminal">
                            <pre>Panfam Shell (PFSH) Session
Type 'help' or 'pf run &lt;file.pf&gt;'
</pre>
                        </div>
                    `, { width: 650, height: 400 });
            }
        }

        list() {
            return Array.from(this.windows.values());
        }
    }

    return {
        WindowInstance: WindowInstance,
        WindowManager: WindowManager
    };
});
