/**
 * Panfam OS (PFOS) - System Call & Service Layer
 * Strict boundary enforcing permissions, process privileges, and audit logging.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.PFKernel = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class PFKernel {
        constructor(hardware, processManager, vfs, network) {
            this.hardware = hardware;
            this.processManager = processManager;
            this.vfs = vfs;
            this.network = network;
            this.auditLog = [];
            this.osInfo = {
                name: 'Panfam OS',
                id: 'panfam',
                version: '4.0.0-LTS',
                codename: 'Aether',
                arch: 'x86_64',
                kernel: 'PF Core v1.2'
            };
        }

        logAudit(action, caller, details, success = true) {
            this.auditLog.push({
                timestamp: new Date().toISOString(),
                action: action,
                caller: caller,
                details: details,
                status: success ? 'GRANTED' : 'DENIED'
            });
            if (this.auditLog.length > 500) this.auditLog.shift();
        }

        // Syscall: Process Spawn
        sys_spawn(name, callerPid = 1, user = 'user') {
            this.logAudit('process.spawn', `pid:${callerPid}`, { name, user });
            return this.processManager.spawn(name, callerPid, user);
        }

        // Syscall: Process Exit / Terminate
        sys_kill(targetPid, callerPid = 1, user = 'user') {
            const proc = this.processManager.get(targetPid);
            if (!proc) return false;
            // Permission check: only root or owner can kill
            if (user !== 'root' && proc.user !== user) {
                this.logAudit('process.kill', `pid:${callerPid}`, { targetPid }, false);
                throw new Error('EPERM: Operation not permitted');
            }
            this.logAudit('process.kill', `pid:${callerPid}`, { targetPid });
            return this.processManager.terminate(targetPid, 0);
        }

        // Syscall: Filesystem Read
        sys_read(pathStr, callerPid = 1, user = 'user') {
            this.logAudit('fs.read', `pid:${callerPid}`, { path: pathStr });
            return this.vfs.readFile(pathStr);
        }

        // Syscall: Filesystem Write
        sys_write(pathStr, content, callerPid = 1, user = 'user') {
            this.logAudit('fs.write', `pid:${callerPid}`, { path: pathStr, bytes: content.length });
            return this.vfs.writeFile(pathStr, content, user);
        }

        // Syscall: Memory Status
        sys_meminfo() {
            return this.hardware.memory.getStats();
        }

        // Syscall: CPU Status
        sys_cpuinfo() {
            return this.hardware.cpu.getStats();
        }

        // Syscall: System Info
        sys_uname() {
            return { ...this.osInfo };
        }
    }

    return PFKernel;
});
