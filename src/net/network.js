/**
 * Panfam-Terminal Virtual Network Simulation
 * Provides unified virtual interfaces (eth0, lo), IP routing, ARP cache,
 * DNS resolution (/etc/resolv.conf and /etc/hosts integration), and simulated sockets.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.VirtualNetwork = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class VirtualNetwork {
        constructor() {
            this.interfaces = {
                'lo': {
                    name: 'lo',
                    flags: ['UP', 'LOOPBACK', 'RUNNING'],
                    mtu: 65536,
                    inet: '127.0.0.1',
                    netmask: '255.0.0.0',
                    inet6: '::1',
                    mac: '00:00:00:00:00:00',
                    rxPackets: 42,
                    txPackets: 42,
                    rxBytes: 3120,
                    txBytes: 3120
                },
                'eth0': {
                    name: 'eth0',
                    flags: ['UP', 'BROADCAST', 'RUNNING', 'MULTICAST'],
                    mtu: 1500,
                    inet: '192.168.1.105',
                    netmask: '255.255.255.0',
                    broadcast: '192.168.1.255',
                    inet6: 'fe80::a00:27ff:fe4e:66a1/64',
                    mac: '08:00:27:4e:66:a1',
                    rxPackets: 1542,
                    txPackets: 980,
                    rxBytes: 1420840,
                    txBytes: 254120
                }
            };

            this.dnsRecords = {
                'localhost': '127.0.0.1',
                'panfam-terminal': '127.0.0.1',
                'google.com': '142.250.190.46',
                'github.com': '140.82.121.4',
                'api.ipify.org': '104.26.12.205',
                'cloudflare.com': '104.16.132.229',
                'kernel.org': '198.145.21.9'
            };

            this.routingTable = [
                { destination: '0.0.0.0', gateway: '192.168.1.1', genmask: '0.0.0.0', flags: 'UG', metric: 100, iface: 'eth0' },
                { destination: '192.168.1.0', gateway: '0.0.0.0', genmask: '255.255.255.0', flags: 'U', metric: 100, iface: 'eth0' }
            ];

            this.openSockets = [
                { proto: 'tcp', localAddr: '0.0.0.0:22', remoteAddr: '0.0.0.0:*', state: 'LISTEN', pid: 480, program: 'sshd' },
                { proto: 'tcp', localAddr: '127.0.0.1:8000', remoteAddr: '0.0.0.0:*', state: 'LISTEN', pid: 512, program: 'python3' },
                { proto: 'udp', localAddr: '0.0.0.0:68', remoteAddr: '0.0.0.0:*', state: 'UNCONN', pid: 210, program: 'dhclient' }
            ];
        }

        resolveHost(host, vfs = null) {
            if (!host) return null;
            // 1. Check /etc/hosts if VFS provided
            if (vfs) {
                try {
                    const hostsContent = vfs.readFile('/etc/hosts');
                    const lines = hostsContent.split('\n');
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed.startsWith('#')) continue;
                        const parts = trimmed.split(/\s+/);
                        const ip = parts[0];
                        const aliases = parts.slice(1);
                        if (aliases.includes(host)) {
                            return ip;
                        }
                    }
                } catch (e) {}
            }

            // 2. Check virtual DNS records
            if (this.dnsRecords[host.toLowerCase()]) {
                return this.dnsRecords[host.toLowerCase()];
            }

            // 3. Check if already an IP
            if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
                return host;
            }

            return null;
        }

        getInterface(name) {
            return this.interfaces[name] || null;
        }

        getAllInterfaces() {
            return Object.values(this.interfaces);
        }

        getRoutes() {
            return this.routingTable;
        }

        getSockets() {
            return this.openSockets;
        }
    }

    return VirtualNetwork;
});
