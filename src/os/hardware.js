/**
 * Panfam OS (PFOS) - Core Virtual Hardware Abstraction
 * Represents simulated CPU, Memory Controller, Device Registry, and Display subsystem.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.PFHardware = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class VirtualCPU {
        constructor(cores = 4, mhz = 3600) {
            this.cores = cores;
            this.mhz = mhz;
            this.model = 'Panfam Core-V4 (x86_64 Virtualized)';
            this.utilization = 0.05; // 5% baseline
            this.instructionsExecuted = 0;
            this.temperature = 42.0; // Celsius
        }

        tick(cycles = 100) {
            this.instructionsExecuted += cycles;
            // Modulate realistic load
            this.utilization = Math.min(1.0, Math.max(0.02, this.utilization + (Math.random() * 0.06 - 0.03)));
        }

        getStats() {
            return {
                model: this.model,
                cores: this.cores,
                clockMhz: this.mhz,
                utilization: Math.round(this.utilization * 100),
                totalInstructions: this.instructionsExecuted,
                temperatureC: Math.round(this.temperature)
            };
        }
    }

    class VirtualMemoryController {
        constructor(totalBytes = 8 * 1024 * 1024 * 1024) { // 8 GB simulated
            this.totalBytes = totalBytes;
            this.allocatedBytes = 512 * 1024 * 1024; // Kernel reserve 512MB
            this.processAllocations = new Map(); // pid -> bytes
        }

        allocate(pid, bytes) {
            if (this.allocatedBytes + bytes > this.totalBytes) {
                throw new Error('PFOS Kernel Panic: Out of Virtual Memory');
            }
            this.allocatedBytes += bytes;
            const current = this.processAllocations.get(pid) || 0;
            this.processAllocations.set(pid, current + bytes);
            return true;
        }

        free(pid, bytes) {
            const current = this.processAllocations.get(pid) || 0;
            const toFree = Math.min(current, bytes);
            this.processAllocations.set(pid, current - toFree);
            this.allocatedBytes = Math.max(0, this.allocatedBytes - toFree);
        }

        freeAll(pid) {
            const current = this.processAllocations.get(pid) || 0;
            this.allocatedBytes = Math.max(0, this.allocatedBytes - current);
            this.processAllocations.delete(pid);
        }

        getStats() {
            return {
                totalBytes: this.totalBytes,
                usedBytes: this.allocatedBytes,
                freeBytes: this.totalBytes - this.allocatedBytes,
                usedMiB: Math.round(this.allocatedBytes / (1024 * 1024)),
                totalMiB: Math.round(this.totalBytes / (1024 * 1024)),
                percentUsed: Math.round((this.allocatedBytes / this.totalBytes) * 100)
            };
        }
    }

    class DeviceRegistry {
        constructor() {
            this.devices = [
                { id: 'cpu0', type: 'processor', name: 'Panfam Core-V4 #0', status: 'online' },
                { id: 'cpu1', type: 'processor', name: 'Panfam Core-V4 #1', status: 'online' },
                { id: 'mem0', type: 'memory', name: 'Virtual DDR4 Controller (8192 MB)', status: 'online' },
                { id: 'blk0', type: 'block_storage', name: 'Panfam VFS Root Storage Disk (32 GB)', status: 'mounted' },
                { id: 'net0', type: 'network', name: 'Virtual PCI Ethernet Adapter (eth0)', status: 'connected' },
                { id: 'disp0', type: 'display', name: 'Panfam Virtual Video Accelerator (1920x1080)', status: 'active' },
                { id: 'kbd0', type: 'input', name: 'Virtual POSIX Interactive Keyboard', status: 'active' }
            ];
        }

        list() {
            return [...this.devices];
        }

        get(id) {
            return this.devices.find(d => d.id === id) || null;
        }
    }

    class PFHardware {
        constructor() {
            this.cpu = new VirtualCPU();
            this.memory = new VirtualMemoryController();
            this.devices = new DeviceRegistry();
        }
    }

    return PFHardware;
});
