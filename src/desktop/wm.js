/**
 * Panfam OS - Window Manager & Desktop Shell
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
            this.width = options.width || 640;
            this.height = options.height || 420;
            this.x = options.x !== undefined ? options.x : 80;
            this.y = options.y !== undefined ? options.y : 60;
            this.isMinimized = false;
            this.isMaximized = false;
            this.zIndex = 10;
        }
    }

    class WindowManager {
        constructor() {
            this.windows = new Map();
            this.activeWindowId = null;
            this.nextWindowId = 1;
            this.topZ = 100;
        }

        openWindow(title, appComponent, options = {}) {
            const id = 'win_' + (this.nextWindowId++);
            const win = new WindowInstance(id, title, appComponent, options);
            win.zIndex = ++this.topZ;
            this.windows.set(id, win);
            this.activeWindowId = id;
            return win;
        }

        closeWindow(id) {
            this.windows.delete(id);
            if (this.activeWindowId === id) {
                const remaining = Array.from(this.windows.keys());
                this.activeWindowId = remaining.length > 0 ? remaining[remaining.length - 1] : null;
            }
        }

        focusWindow(id) {
            const win = this.windows.get(id);
            if (win) {
                win.zIndex = ++this.topZ;
                win.isMinimized = false;
                this.activeWindowId = id;
            }
        }

        minimizeWindow(id) {
            const win = this.windows.get(id);
            if (win) {
                win.isMinimized = true;
            }
        }

        maximizeWindow(id) {
            const win = this.windows.get(id);
            if (win) {
                win.isMaximized = !win.isMaximized;
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
