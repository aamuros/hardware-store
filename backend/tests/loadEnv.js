/**
 * Jest Setup File - Load Test Environment
 * 
 * This file is executed BEFORE any tests run.
 * It ensures tests use the test database (.env.test with test.db)
 * instead of the development database (dev.db).
 * 
 * CRITICAL: This prevents tests from wiping your development data!
 */

const path = require('path');
require('dotenv').config({
    path: path.resolve(__dirname, '..', '.env.test'),
    override: true  // Override any existing env vars
});

// Verify we're using the test database
if (!process.env.DATABASE_URL?.includes('test.db')) {
    console.error('❌ ERROR: Tests must use test.db, not dev.db!');
    console.error('   Current DATABASE_URL:', process.env.DATABASE_URL);
    console.error('   Please ensure .env.test exists with DATABASE_URL="file:./test.db"');
    process.exit(1);
}

console.log('✓ Test environment loaded (using test.db)');
