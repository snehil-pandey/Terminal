/**
 * Panfam OS - Native Package Manager (PFPM)
 * Manages package installation, dependency metadata, repository cache, and `.pfx` application packages.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.PFPackageManager = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class PackageManager {
        constructor(vfs = null) {
            this.vfs = vfs;
            this.installed = new Map([
                ['coreutils', { version: '1.0.0', desc: 'Core Panfam OS POSIX utilities', installedAt: '2026-11-16' }],
                ['pfsh', { version: '2.4.0', desc: 'Panfam Shell interpreter', installedAt: '2026-11-16' }],
                ['pfruntime', { version: '1.0.0', desc: '.pf native runtime and standard library', installedAt: '2026-11-16' }]
            ]);

            this.repoIndex = {
                'neofetch': { version: '7.1.0', desc: 'Fast system info tool for Panfam OS', deps: [] },
                'htop': { version: '3.2.2', desc: 'Interactive process viewer', deps: ['coreutils'] },
                'pf-editor': { version: '1.0.0', desc: 'Visual code editor for .pf source files', deps: ['pfruntime'] },
                'calculator': { version: '1.2.0', desc: 'Desktop calculator application', deps: [] }
            };
        }

        install(pkgName) {
            const meta = this.repoIndex[pkgName];
            if (!meta) throw new Error(`pfpm: package '${pkgName}' not found in repository`);
            this.installed.set(pkgName, {
                version: meta.version,
                desc: meta.desc,
                installedAt: new Date().toISOString()
            });
            return `Successfully installed ${pkgName} (${meta.version}) [PFOS Package]`;
        }

        remove(pkgName) {
            if (!this.installed.has(pkgName)) {
                throw new Error(`pfpm: package '${pkgName}' is not installed`);
            }
            if (['coreutils', 'pfsh', 'pfruntime'].includes(pkgName)) {
                throw new Error(`pfpm: cannot remove core system package '${pkgName}'`);
            }
            this.installed.delete(pkgName);
            return `Removed package ${pkgName}`;
        }

        listInstalled() {
            return Array.from(this.installed.entries()).map(([k, v]) => ({ name: k, ...v }));
        }

        search(term) {
            return Object.entries(this.repoIndex)
                .filter(([k, v]) => k.includes(term) || v.desc.includes(term))
                .map(([k, v]) => ({ name: k, ...v }));
        }
    }

    return PackageManager;
});
