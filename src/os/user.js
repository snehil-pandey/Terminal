/**
 * Panfam OS - User & Security Authorization Subsystem
 * Virtual user management, group roles, authentication, and root simulation.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.PFUserManager = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class UserManager {
        constructor() {
            this.currentUser = 'snehil';
            this.users = {
                'root': { uid: 0, gid: 0, home: '/root', shell: '/bin/bash', groups: ['root'] },
                'snehil': { uid: 1000, gid: 1000, home: '/home/user', shell: '/bin/pfsh', groups: ['snehil', 'sudo', 'adm'] },
                'guest': { uid: 1001, gid: 1001, home: '/home/guest', shell: '/bin/sh', groups: ['guest'] }
            };
        }

        getCurrentUser() {
            return this.currentUser;
        }

        getUser(username) {
            return this.users[username] || null;
        }

        switchUser(username) {
            if (!this.users[username]) {
                throw new Error(`su: user ${username} does not exist`);
            }
            this.currentUser = username;
            return this.users[username];
        }

        isRoot() {
            return this.currentUser === 'root';
        }

        hasSudo(username = this.currentUser) {
            const u = this.users[username];
            return u && (u.uid === 0 || u.groups.includes('sudo'));
        }
    }

    return UserManager;
});
