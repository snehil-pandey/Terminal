/**
 * Panfam-Terminal Network Commands
 * Commands: ifconfig, ip, ping, dig, nslookup, route, ss, curl
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        const Security = require('../core/security');
        const ExecutionResult = require('./result');
        module.exports = factory(Security, ExecutionResult);
    } else {
        root.TerminalNetCommands = factory(root.TerminalSecurity, root.TerminalResult);
    }
})(typeof self !== 'undefined' ? self : this, function (Security, ExecutionResult) {
    'use strict';

    function registerNetCommands(registry) {
        // ifconfig
        registry.register('ifconfig', (args, stdin, ctx) => {
            const ifaces = ctx.network.getAllInterfaces();
            let out = '';
            for (const iface of ifaces) {
                out += `${iface.name}: flags=4163<${iface.flags.join(',')}>  mtu ${iface.mtu}\n`;
                out += `        inet ${iface.inet}  netmask ${iface.netmask}${iface.broadcast ? '  broadcast ' + iface.broadcast : ''}\n`;
                out += `        inet6 ${iface.inet6}  scopeid 0x20<link>\n`;
                out += `        ether ${iface.mac}  txqueuelen 1000  (Ethernet)\n`;
                out += `        RX packets ${iface.rxPackets}  bytes ${iface.rxBytes}\n`;
                out += `        TX packets ${iface.txPackets}  bytes ${iface.txBytes}\n\n`;
            }
            return ExecutionResult.ok(out.trimEnd());
        }, { description: 'Configure or view network interfaces', usage: 'ifconfig', category: 'Network' });

        // ip
        registry.register('ip', (args, stdin, ctx) => {
            const sub = args[0] || 'addr';
            if (sub === 'a' || sub === 'addr' || sub === 'address') {
                const ifaces = ctx.network.getAllInterfaces();
                let out = '';
                ifaces.forEach((iface, idx) => {
                    out += `${idx + 1}: ${iface.name}: <${iface.flags.join(',')}> mtu ${iface.mtu} qdisc noqueue state UP group default\n`;
                    out += `    link/ether ${iface.mac} brd ff:ff:ff:ff:ff:ff\n`;
                    out += `    inet ${iface.inet}/${iface.netmask === '255.0.0.0' ? '8' : '24'} scope global ${iface.name}\n`;
                    out += `       valid_lft forever preferred_lft forever\n`;
                });
                return ExecutionResult.ok(out.trimEnd());
            } else if (sub === 'r' || sub === 'route') {
                const routes = ctx.network.getRoutes();
                let out = '';
                for (const r of routes) {
                    out += `${r.destination === '0.0.0.0' ? 'default' : r.destination} via ${r.gateway} dev ${r.iface} proto static metric ${r.metric}\n`;
                }
                return ExecutionResult.ok(out.trimEnd());
            }
            return ExecutionResult.error(`ip: Object "${sub}" is unknown`, 1);
        }, { description: 'Show / manipulate routing, network devices, interfaces and tunnels', usage: 'ip [addr|route]', category: 'Network' });

        // ping
        registry.register('ping', (args, stdin, ctx) => {
            if (args.length === 0) return ExecutionResult.error('ping: usage error: Destination address required', 1);
            const targetHost = args.filter(a => !a.startsWith('-'))[0];
            const resolvedIp = ctx.network.resolveHost(targetHost, ctx.vfs) || '93.184.216.34';

            let out = `PING ${targetHost} (${resolvedIp}) 56(84) bytes of data.\n`;
            out += `64 bytes from ${resolvedIp}: icmp_seq=1 ttl=56 time=18.4 ms\n`;
            out += `64 bytes from ${resolvedIp}: icmp_seq=2 ttl=56 time=19.1 ms\n`;
            out += `64 bytes from ${resolvedIp}: icmp_seq=3 ttl=56 time=18.7 ms\n`;
            out += `--- ${targetHost} ping statistics ---\n`;
            out += `3 packets transmitted, 3 received, 0% packet loss, time 2003ms\n`;
            out += `rtt min/avg/max/mdev = 18.412/18.741/19.102/0.283 ms`;
            return ExecutionResult.ok(out);
        }, { description: 'Send ICMP ECHO_REQUEST to network hosts', usage: 'ping <host>', category: 'Network' });

        // dig & nslookup
        registry.register('dig', (args, stdin, ctx) => {
            const host = args.filter(a => !a.startsWith('+') && !a.startsWith('-'))[0];
            if (!host) return ExecutionResult.error('dig: missing host argument', 1);
            const ip = ctx.network.resolveHost(host, ctx.vfs) || '93.184.216.34';
            let out = `; <<>> DiG 9.18.18-Panfam <<>> ${host}\n`;
            out += `;; Got answer:\n;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 48210\n`;
            out += `;; QUESTION SECTION:\n;${host}.\t\t\tIN\tA\n\n`;
            out += `;; ANSWER SECTION:\n${host}.\t\t300\tIN\tA\t${ip}\n\n`;
            out += `;; Query time: 14 msec\n;; SERVER: 1.1.1.1#53(1.1.1.1)\n;; WHEN: ${new Date().toUTCString()}`;
            return ExecutionResult.ok(out);
        }, { description: 'DNS lookup utility', usage: 'dig <host>', category: 'Network' });

        registry.register('nslookup', (args, stdin, ctx) => {
            if (args.length === 0) return ExecutionResult.error('nslookup: missing host argument', 1);
            const host = args[0];
            const ip = ctx.network.resolveHost(host, ctx.vfs) || '93.184.216.34';
            let out = `Server:\t\t1.1.1.1\nAddress:\t1.1.1.1#53\n\nNon-authoritative answer:\nName:\t${host}\nAddress: ${ip}`;
            return ExecutionResult.ok(out);
        }, { description: 'Query Internet name servers interactively', usage: 'nslookup <host>', category: 'Network' });

        // ss / netstat
        registry.register('ss', (args, stdin, ctx) => {
            const sockets = ctx.network.getSockets();
            let out = 'Netid  State      Recv-Q Send-Q Local Address:Port        Peer Address:Port       Process\n';
            for (const s of sockets) {
                out += `${s.proto.padEnd(6)} ${s.state.padEnd(10)} 0      0      ${s.localAddr.padEnd(25)} ${s.remoteAddr.padEnd(23)} users:(("${s.program}",pid=${s.pid},fd=3))\n`;
            }
            return ExecutionResult.ok(out.trimEnd());
        }, { description: 'Another utility to investigate sockets', usage: 'ss [-tulpn]', category: 'Network' });

        // curl (secure real HTTP fetching with protocol whitelist)
        registry.register('curl', async (args) => {
            if (args.length === 0) return ExecutionResult.error("curl: try 'curl --help' or 'curl <url>'", 2);
            const url = args[args.length - 1];
            if (!Security.isSafeUrl(url)) {
                return ExecutionResult.error('curl: (3) URL rejected: Only HTTP/HTTPS protocols allowed', 3);
            }

            try {
                const res = await fetch(url);
                const text = await res.text();
                const truncated = text.length > 3000 ? text.substring(0, 3000) + '\n... [output truncated at 3KB]' : text;
                return ExecutionResult.ok(truncated);
            } catch (e) {
                return ExecutionResult.error(`curl: (6) Could not resolve host or network error: ${e.message}`, 6);
            }
        }, { description: 'Transfer data from or to a server', usage: 'curl <url>', category: 'Network' });
    }

    return { register: registerNetCommands };
});
