/**
 * WebTerminal Theme Registry and Switcher
 * Supports dynamic CSS variable injection and cookie persistence.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        const Storage = require('../core/storage');
        module.exports = factory(Storage);
    } else {
        root.TerminalTheme = factory(root.TerminalStorage);
    }
})(typeof self !== 'undefined' ? self : this, function (Storage) {
    'use strict';

    const THEME_COOKIE_KEY = 'current_theme';

    const THEMES = {
        'matrix': {
            name: 'Matrix Classic',
            description: 'Retro green phosphor on deep black',
            vars: {
                '--term-bg': '#050a05',
                '--term-fg': '#5aff00',
                '--term-prompt': '#76ff26',
                '--term-user': '#00ff88',
                '--term-host': '#5aff00',
                '--term-path': '#00e5ff',
                '--term-border': '#153d10',
                '--term-selection': 'rgba(90, 255, 0, 0.25)',
                '--term-error': '#ff4d4d',
                '--term-warn': '#ffd152',
                '--term-info': '#40c4ff'
            }
        },
        'amber': {
            name: 'Vintage Amber CRT',
            description: 'Warm monocrome glowing CRT terminal',
            vars: {
                '--term-bg': '#0f0a00',
                '--term-fg': '#ffb000',
                '--term-prompt': '#ffb000',
                '--term-user': '#ffcc00',
                '--term-host': '#ffa000',
                '--term-path': '#ffd24d',
                '--term-border': '#3d2b00',
                '--term-selection': 'rgba(255, 176, 0, 0.25)',
                '--term-error': '#ff4d4d',
                '--term-warn': '#ffe066',
                '--term-info': '#ffa500'
            }
        },
        'cyberpunk': {
            name: 'Cyberpunk Neon',
            description: 'High-contrast neon pink and electric cyan',
            vars: {
                '--term-bg': '#0d0221',
                '--term-fg': '#00f0ff',
                '--term-prompt': '#ff007f',
                '--term-user': '#ffe600',
                '--term-host': '#ff007f',
                '--term-path': '#00f0ff',
                '--term-border': '#ff007f',
                '--term-selection': 'rgba(255, 0, 127, 0.3)',
                '--term-error': '#ff2a6d',
                '--term-warn': '#ffe600',
                '--term-info': '#05d9e8'
            }
        },
        'dracula': {
            name: 'Dracula Dark',
            description: 'Sleek modern dark theme with purple accent',
            vars: {
                '--term-bg': '#282a36',
                '--term-fg': '#f8f8f2',
                '--term-prompt': '#50fa7b',
                '--term-user': '#ff79c6',
                '--term-host': '#bd93f9',
                '--term-path': '#8be9fd',
                '--term-border': '#44475a',
                '--term-selection': 'rgba(68, 71, 90, 0.5)',
                '--term-error': '#ff5555',
                '--term-warn': '#f1fa8c',
                '--term-info': '#8be9fd'
            }
        },
        'nord': {
            name: 'Nordic Frost',
            description: 'Arctic, north-bluish clean developer theme',
            vars: {
                '--term-bg': '#2e3440',
                '--term-fg': '#eceff4',
                '--term-prompt': '#a3be8c',
                '--term-user': '#88c0d0',
                '--term-host': '#81a1c1',
                '--term-path': '#ebcb8b',
                '--term-border': '#4c566a',
                '--term-selection': 'rgba(136, 192, 208, 0.25)',
                '--term-error': '#bf616a',
                '--term-warn': '#ebcb8b',
                '--term-info': '#88c0d0'
            }
        },
        'monokai': {
            name: 'Monokai Pro',
            description: 'Iconic high contrast programming palette',
            vars: {
                '--term-bg': '#272822',
                '--term-fg': '#f8f8f2',
                '--term-prompt': '#a6e22e',
                '--term-user': '#f92672',
                '--term-host': '#fd971f',
                '--term-path': '#66d9ef',
                '--term-border': '#3e3d32',
                '--term-selection': 'rgba(255, 255, 255, 0.2)',
                '--term-error': '#f92672',
                '--term-warn': '#e6db74',
                '--term-info': '#66d9ef'
            }
        },
        'solarized': {
            name: 'Solarized Dark',
            description: 'Precision colors engineered for eye comfort',
            vars: {
                '--term-bg': '#002b36',
                '--term-fg': '#839496',
                '--term-prompt': '#859900',
                '--term-user': '#268bd2',
                '--term-host': '#b58900',
                '--term-path': '#2aa198',
                '--term-border': '#073642',
                '--term-selection': 'rgba(7, 54, 66, 0.6)',
                '--term-error': '#dc322f',
                '--term-warn': '#b58900',
                '--term-info': '#2aa198'
            }
        }
    };

    class ThemeManager {
        constructor() {
            this.current = 'matrix';
            this.loadSaved();
        }

        loadSaved() {
            const saved = Storage ? Storage.getItem(THEME_COOKIE_KEY) : null;
            if (saved && THEMES[saved]) {
                this.current = saved;
            }
        }

        listThemes() {
            return Object.keys(THEMES).map(k => ({
                id: k,
                name: THEMES[k].name,
                description: THEMES[k].description,
                active: k === this.current
            }));
        }

        apply(themeName) {
            const theme = THEMES[themeName];
            if (!theme) {
                throw new Error(`Unknown theme: '${themeName}'. Available: ${Object.keys(THEMES).join(', ')}`);
            }
            this.current = themeName;
            if (Storage) {
                Storage.setItem(THEME_COOKIE_KEY, themeName);
            }

            if (typeof document !== 'undefined') {
                const rootEl = document.documentElement;
                for (const [prop, val] of Object.entries(theme.vars)) {
                    rootEl.style.setProperty(prop, val);
                }
                document.body.setAttribute('data-theme', themeName);
            }
            return theme;
        }

        getCurrent() {
            return {
                id: this.current,
                ...THEMES[this.current]
            };
        }
    }

    return ThemeManager;
});
