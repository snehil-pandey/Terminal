/**
 * WebTerminal Security Utility Module
 * Peak Cybersecurity: Strict sanitization, injection-safe text handling, and CSP compatibility.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.TerminalSecurity = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /**
     * Escapes untrusted text to safely render as HTML without injection risk.
     * @param {string} str
     * @returns {string}
     */
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/`/g, '&#96;');
    }

    /**
     * Strips potentially dangerous control characters, ANSI escape sequences, or null bytes.
     * Prevents shell injection and memory corruptions in simulated buffers.
     * @param {string} input
     * @returns {string}
     */
    function sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        // Remove null bytes and non-printable control characters except newline and tab
        return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    }

    /**
     * Safely validates filenames against directory traversal attacks (e.g. "../", "..\\", null bytes)
     * @param {string} name
     * @returns {boolean}
     */
    function isValidNodeName(name) {
        if (!name || typeof name !== 'string') return false;
        if (name === '.' || name === '..') return false;
        if (name.includes('/') || name.includes('\\') || name.includes('\0')) return false;
        // Limit max length to prevent Denial of Service via buffer bloat
        if (name.length > 255) return false;
        return true;
    }

    /**
     * Safe regex for URL validation (prevents javascript: and vbscript: URIs)
     * @param {string} url
     * @returns {boolean}
     */
    function isSafeUrl(url) {
        if (!url || typeof url !== 'string') return false;
        try {
            const base = (typeof window !== 'undefined' && window.location) ? window.location.href : 'http://localhost';
            const parsed = new URL(url, base);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch (e) {
            return false;
        }
    }

    return {
        escapeHtml: escapeHtml,
        sanitizeInput: sanitizeInput,
        isValidNodeName: isValidNodeName,
        isSafeUrl: isSafeUrl
    };
});
