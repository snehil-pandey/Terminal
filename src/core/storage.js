/**
 * Panfam-Terminal Layered Storage Engine
 * Layered Persistence Architecture:
 * 1. IndexedDB (primary bulk store for VFS, package db, session state)
 * 2. localStorage (lightweight fallback, terminal configs, theme preferences)
 * 3. Cookie store (small session compatibility, backwards compatibility)
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.TerminalStorage = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const DB_NAME = 'panfam_terminal_db';
    const DB_VERSION = 1;
    const STORE_NAME = 'terminal_store';
    const COOKIE_PREFIX = 'termfs_';

    let idbPromise = null;

    /**
     * Open or initialize the IndexedDB instance
     * @returns {Promise<IDBDatabase|null>}
     */
    function openDatabase() {
        if (idbPromise) return idbPromise;
        if (typeof indexedDB === 'undefined') {
            return Promise.resolve(null);
        }

        idbPromise = new Promise((resolve) => {
            try {
                const request = indexedDB.open(DB_NAME, DB_VERSION);
                request.onupgradeneeded = function (event) {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
                    }
                };
                request.onsuccess = function (event) {
                    resolve(event.target.result);
                };
                request.onerror = function (event) {
                    console.warn('IndexedDB open error:', event.target.error);
                    resolve(null);
                };
            } catch (e) {
                console.warn('IndexedDB not supported or blocked:', e);
                resolve(null);
            }
        });

        return idbPromise;
    }

    /**
     * Get item from IndexedDB asynchronously
     * @param {string} key
     * @returns {Promise<any>}
     */
    async function getIdbItem(key) {
        const db = await openDatabase();
        if (!db) return null;

        return new Promise((resolve) => {
            try {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const req = store.get(key);
                req.onsuccess = () => {
                    resolve(req.result ? req.result.value : null);
                };
                req.onerror = () => {
                    resolve(null);
                };
            } catch (e) {
                resolve(null);
            }
        });
    }

    /**
     * Put item into IndexedDB asynchronously
     * @param {string} key
     * @param {any} value
     * @returns {Promise<boolean>}
     */
    async function setIdbItem(key, value) {
        const db = await openDatabase();
        if (!db) return false;

        return new Promise((resolve) => {
            try {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const req = store.put({ key: key, value: value, updatedAt: new Date().toISOString() });
                req.onsuccess = () => resolve(true);
                req.onerror = () => resolve(false);
            } catch (e) {
                resolve(false);
            }
        });
    }

    /**
     * Delete item from IndexedDB
     * @param {string} key
     * @returns {Promise<boolean>}
     */
    async function removeIdbItem(key) {
        const db = await openDatabase();
        if (!db) return false;

        return new Promise((resolve) => {
            try {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const req = store.delete(key);
                req.onsuccess = () => resolve(true);
                req.onerror = () => resolve(false);
            } catch (e) {
                resolve(false);
            }
        });
    }

    /**
     * Set a cookie safely with attributes
     */
    function setCookie(name, value, days = 30) {
        if (typeof document === 'undefined') return;
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = '; expires=' + date.toUTCString();
        const secure = (typeof window !== 'undefined' && window.location.protocol === 'https:') ? '; Secure' : '';
        const cookieStr = encodeURIComponent(COOKIE_PREFIX + name) + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax' + secure;
        try {
            document.cookie = cookieStr;
        } catch (e) {
            console.warn('Cookie set error:', e);
        }
    }

    /**
     * Read cookie by name
     */
    function getCookie(name) {
        if (typeof document === 'undefined') return null;
        const target = encodeURIComponent(COOKIE_PREFIX + name) + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i].trim();
            if (c.indexOf(target) === 0) {
                try {
                    return decodeURIComponent(c.substring(target.length));
                } catch (e) {
                    return c.substring(target.length);
                }
            }
        }
        return null;
    }

    /**
     * Delete cookie by name
     */
    function deleteCookie(name) {
        if (typeof document === 'undefined') return;
        document.cookie = encodeURIComponent(COOKIE_PREFIX + name) + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }

    /**
     * Synchronous getItem: checks cookies, then localStorage
     */
    function getItem(key) {
        const val = getCookie(key);
        if (val !== null) return val;
        if (typeof localStorage !== 'undefined') {
            return localStorage.getItem(COOKIE_PREFIX + key);
        }
        return null;
    }

    /**
     * Synchronous setItem: sets cookie (if within 3.5KB size budget) and localStorage
     */
    function setItem(key, value) {
        if (typeof value === 'string' && value.length < 3500) {
            setCookie(key, value);
        }
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem(COOKIE_PREFIX + key, value);
            } catch (e) {
                console.warn('localStorage set error:', e);
            }
        }
        // Asynchronously mirror to IndexedDB for bulk resilience
        setIdbItem(key, value).catch(() => {});
    }

    /**
     * Synchronous removeItem
     */
    function removeItem(key) {
        deleteCookie(key);
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(COOKIE_PREFIX + key);
        }
        removeIdbItem(key).catch(() => {});
    }

    /**
     * Full Export of VFS & Terminal State for Backup
     * @returns {Promise<string>} JSON string of state
     */
    async function exportState() {
        const backup = {
            version: 1,
            timestamp: new Date().toISOString(),
            data: {}
        };

        if (typeof localStorage !== 'undefined') {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k.startsWith(COOKIE_PREFIX)) {
                    backup.data[k.substring(COOKIE_PREFIX.length)] = localStorage.getItem(k);
                }
            }
        }

        // Add IndexedDB state
        const db = await openDatabase();
        if (db) {
            await new Promise((resolve) => {
                try {
                    const tx = db.transaction(STORE_NAME, 'readonly');
                    const store = tx.objectStore(STORE_NAME);
                    const req = store.getAll();
                    req.onsuccess = () => {
                        if (Array.isArray(req.result)) {
                            req.result.forEach(item => {
                                backup.data[item.key] = item.value;
                            });
                        }
                        resolve();
                    };
                    req.onerror = () => resolve();
                } catch (e) {
                    resolve();
                }
            });
        }

        return JSON.stringify(backup, null, 2);
    }

    /**
     * Import and Restore Terminal State from JSON backup
     * @param {string|object} backupData
     * @returns {Promise<boolean>}
     */
    async function importState(backupData) {
        try {
            const parsed = typeof backupData === 'string' ? JSON.parse(backupData) : backupData;
            if (!parsed || !parsed.data) return false;

            for (const [key, value] of Object.entries(parsed.data)) {
                setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            }
            return true;
        } catch (e) {
            console.error('Import error:', e);
            return false;
        }
    }

    return {
        setCookie: setCookie,
        getCookie: getCookie,
        deleteCookie: deleteCookie,
        getItem: getItem,
        setItem: setItem,
        removeItem: removeItem,
        getIdbItem: getIdbItem,
        setIdbItem: setIdbItem,
        removeIdbItem: removeIdbItem,
        exportState: exportState,
        importState: importState
    };
});
