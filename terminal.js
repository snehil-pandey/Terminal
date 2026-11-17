/**
 * WebTerminal Entrypoint / Backward Compatibility Adapter
 * Coordinates Core Modules: Security, Storage, VFS, Theme, Commands, and Shell.
 */

(function () {
    'use strict';

    let shellInstance = null;

    function initTerminal() {
        const screenEl = document.getElementById('terminal-screen') || document.getElementById('out');
        const inputEl = document.getElementById('cli-input') || document.getElementById('user-input');
        const promptLabelEl = document.getElementById('prompt-label');

        if (!screenEl || !inputEl) return;

        // Obtain single authoritative system service container
        const services = (window.PFSystemServices && window.PFSystemServices.getSystemServices)
            ? window.PFSystemServices.getSystemServices()
            : null;

        shellInstance = new window.WebTerminalShell({
            user: 'user',
            hostname: 'panfam-terminal',
            services: services
        });

        // Update prompt label if present
        function refreshPromptLabel() {
            if (promptLabelEl && shellInstance) {
                promptLabelEl.innerHTML = shellInstance.getPromptHtml();
            }
        }

        const originalAppendHtml = shellInstance.appendHtml.bind(shellInstance);
        shellInstance.appendHtml = function (html) {
            originalAppendHtml(html);
            refreshPromptLabel();
        };

        shellInstance.onPromptChange = refreshPromptLabel;

        shellInstance.mount(screenEl, inputEl);
        refreshPromptLabel();

        // Keep input focused when clicking screen
        document.body.addEventListener('click', function (e) {
            // Do not steal focus if desktop is active or user is selecting text
            if (window.pfWM && window.pfWM.isDesktopActive) return;
            if (e.target.closest('#pf-desktop-environment')) return;
            if (window.getSelection && window.getSelection().toString().length > 0) return;
            inputEl.focus();
        });

        // Initialize Panfam OS Desktop Window Manager with authoritative services
        if (window.PFWindowManager) {
            window.pfWM = new window.PFWindowManager.WindowManager(null, services);
            window.pfWM.init(document.body);
        }

        window.termShell = shellInstance;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTerminal);
    } else {
        initTerminal();
    }
})();
