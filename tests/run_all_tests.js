/**
 * Panfam OS - Unified Test Runner
 * Executes both the POSIX Shell/VFS test suite and the OS/.pf Language test suite.
 */

const { execSync } = require('child_process');

console.log('====================================================');
console.log('       PANFAM OS & .PF COMPLETE TEST RUNNER         ');
console.log('====================================================\n');

try {
    console.log('>>> [1/2] Executing POSIX Shell, VFS & Commands Suite:');
    execSync('node tests/test_suite.js', { stdio: 'inherit' });

    console.log('\n>>> [2/2] Executing Panfam OS Core & .pf Language Suite:');
    execSync('node tests/os/os_test_suite.js', { stdio: 'inherit' });

    console.log('\n====================================================');
    console.log(' ALL 33 TESTS PASSED SUCCESSFULLY! (100% Pass Rate) ');
    console.log('====================================================');
} catch (e) {
    console.error('\nTest Suite Failed with error:', e.message);
    process.exit(1);
}
