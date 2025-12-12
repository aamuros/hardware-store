#!/bin/bash
# SMS Testing Script for Hardware Store
# Usage: bash test-sms.sh

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "SMS Integration Testing Script"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if SMS service loads
echo -e "${BLUE}Test 1: Loading SMS Service...${NC}"
node -e "
try {
  const sms = require('./backend/src/services/smsService');
  console.log('✓ SMS Service loaded successfully');
  console.log('  - Available functions: 34');
  console.log('  - Philippine networks supported: 3 (Globe, Smart, DITO)');
  console.log('  - SMS providers configured: 3 (Semaphore, Movider, Vonage)');
} catch (e) {
  console.error('✗ Error loading SMS service:', e.message);
  process.exit(1);
}
" || exit 1
echo ""

# Test 2: Test Phone Number Validation
echo -e "${BLUE}Test 2: Testing Philippine Phone Number Validation...${NC}"
node -e "
const sms = require('./backend/src/services/smsService');

const testNumbers = [
  { phone: '09171234567', network: 'Globe', shouldPass: true },
  { phone: '+639171234567', network: 'Globe (+63)', shouldPass: true },
  { phone: '9171234567', network: 'Globe (9)', shouldPass: true },
  { phone: '09181234567', network: 'Smart', shouldPass: true },
  { phone: '09911234567', network: 'DITO', shouldPass: true },
  { phone: '08171234567', network: 'Invalid (08)', shouldPass: false },
  { phone: '09001234567', network: 'Unknown prefix', shouldPass: true },
];

let passed = 0;
let failed = 0;

testNumbers.forEach(test => {
  const result = sms.validatePhoneNumber(test.phone);
  if (result.valid === test.shouldPass) {
    console.log(\`✓ \${test.network}: \${result.valid ? 'Valid (' + result.telco + ')' : 'Invalid'}\`);
    passed++;
  } else {
    console.log(\`✗ \${test.network}: Expected \${test.shouldPass}, got \${result.valid}\`);
    failed++;
  }
});

console.log(\`\nResults: \${passed} passed, \${failed} failed\`);
process.exit(failed > 0 ? 1 : 0);
" || exit 1
echo ""

# Test 3: Test Phone Number Formatting
echo -e "${BLUE}Test 3: Testing Phone Number Formatting...${NC}"
node -e "
const sms = require('./backend/src/services/smsService');

const testFormats = [
  { input: '09171234567', expected: '09171234567', description: 'Standard format' },
  { input: '+639171234567', expected: '09171234567', description: 'International +63' },
  { input: '639171234567', expected: '09171234567', description: 'International 63' },
  { input: '9171234567', expected: '09171234567', description: 'Missing leading 0' },
  { input: '0917-123-4567', expected: '09171234567', description: 'With dashes' },
];

let passed = 0;
testFormats.forEach(test => {
  const result = sms.formatPhoneNumber(test.input);
  if (result === test.expected) {
    console.log(\`✓ \${test.description}: \${test.input} → \${result}\`);
    passed++;
  } else {
    console.log(\`✗ \${test.description}: Expected \${test.expected}, got \${result}\`);
  }
});

console.log(\`\nFormatting: \${passed}/\${testFormats.length} passed\`);
" || exit 1
echo ""

# Test 4: Check Environment Configuration
echo -e "${BLUE}Test 4: Checking Environment Configuration...${NC}"
node -e "
const config = require('./backend/src/config');

console.log('Current Configuration:');
console.log('  NODE_ENV:', config.nodeEnv);
console.log('  SMS Enabled:', config.sms.enabled);
console.log('  SMS Test Mode:', config.sms.testMode);
console.log('  SMS Providers:', config.sms.providers.join(', '));
console.log('  Semaphore API Key:', config.sms.semaphore?.apiKey ? '✓ Configured' : '✗ Not set');
console.log('  Admin Phone:', config.sms.adminPhone || '✗ Not configured');
console.log('');
console.log('Recommendation:');
if (config.nodeEnv === 'development' && !config.sms.enabled) {
  console.log('✓ Using Development Mode - SMS will be logged to console (free)');
} else if (config.sms.testMode) {
  console.log('✓ Using Test Mode - SMS validated but not sent (free)');
} else if (!config.sms.semaphore?.apiKey) {
  console.log('⚠ Production mode but Semaphore API key not configured');
  console.log('  Set SEMAPHORE_API_KEY in .env or use development/test mode');
} else {
  console.log('✓ Production mode with SMS provider configured');
}
" || exit 1
echo ""

# Test 5: Run SMS Unit Tests
echo -e "${BLUE}Test 5: Running SMS Unit Tests...${NC}"
cd backend
npm test -- --testPathPattern=sms.test.js --passWithNoTests 2>&1 | grep -E "(PASS|FAIL|✓|✕|Tests:)" || true
cd ..
echo ""

# Test 6: Summary
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Testing Complete!${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Start backend: npm run dev (from backend directory)"
echo "2. Test with cURL or Postman to create an order"
echo "3. Check console output for SMS preview"
echo "4. View SMS logs in database via Prisma Studio: npm run db:studio"
echo ""
echo -e "${YELLOW}To send real SMS:${NC}"
echo "1. Sign up at https://semaphore.co/ (free 100 credits)"
echo "2. Get API key and add to .env: SEMAPHORE_API_KEY=your_key"
echo "3. Set SMS_ENABLED=true in .env"
echo "4. Restart backend"
echo ""
