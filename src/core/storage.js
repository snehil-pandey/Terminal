/**
 * WebTerminal Cookie Storage & Persistence Engine
 * Supports cookie storage with graceful fallback to localStorage when cookie quota is exceeded.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.TerminalStorage = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const COOKIE_PREFIX = 'termfs_';

    /**
     * Set a cookie safely with attributes
     * @param {string} name
     * @param {string} value
     * @param {number} days
     */
    function setCookie(name, value, days = 30) {
        if (typeof document === 'undefined') return;
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = '; expires=' + date.toUTCString();
        // SameSite=Lax and Secure if HTTPS
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
     * @param {string} name
     * @returns {string|null}
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
     * @param {string} name
     */
    function deleteCookie(name) {
        if (typeof document === 'undefined') return;
        document.cookie = encodeURIComponent(COOKIE_PREFIX + name) + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }

    /**
     * Unified getItem: checks cookie first, falls back to localStorage
     * @param {string} key
     * @returns {string|null}
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
     * Unified setItem: writes cookie, also mirrors to localStorage for resilience
     * @param {string} key
     * @param {string} value
     */
    function setItem(key, value) {
        // Enforce safe payload size to prevent cookie overflow (>4KB)
        if (value.length < 3500) {
            setCookie(key, value);
        }
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem(COOKIE_PREFIX + key, value);
            } catch (e) {
                console.warn('localStorage set error:', e);
            }
        }
    }

    /**
     * Unified removeItem
     * @param {string} key
     */
    function removeItem(key) {
        deleteCookie(key);
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(COOKIE_PREFIX + key);
        }
    }

    return {
        setCookie: setCookie,
        getCookie: getCookie,
        deleteCookie: deleteCookie,
        getItem: getItem,
        setItem: setItem,
        removeItem: removeItem
    };
});
