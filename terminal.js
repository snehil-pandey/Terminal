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

        shellInstance = new window.WebTerminalShell({
            user: 'user',
            hostname: 'panfam-terminal'
        });

        // Update prompt label if present
        function refreshPromptLabel() {
            if (promptLabelEl) {
                promptLabelEl.innerHTML = shellInstance.getPromptHtml();
            }
        }

        const originalAppendHtml = shellInstance.appendHtml.bind(shellInstance);
        shellInstance.appendHtml = function (html) {
            originalAppendHtml(html);
            refreshPromptLabel();
        };

        shellInstance.mount(screenEl, inputEl);
        refreshPromptLabel();

        // Keep input focused when clicking screen
        document.body.addEventListener('click', function (e) {
            // Do not steal focus if user is selecting text
            if (window.getSelection && window.getSelection().toString().length > 0) return;
            inputEl.focus();
        });

        window.termShell = shellInstance;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTerminal);
    } else {
        initTerminal();
    }
})();
