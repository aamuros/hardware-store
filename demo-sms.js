#!/usr/bin/env node
/**
 * Quick SMS Testing Demo
 * Shows how SMS will work in development mode
 */

const sms = require('./backend/src/services/smsService');

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║         SMS Integration Testing Demo                          ║');
console.log('║     (Shows what SMS messages look like in development)        ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Test 1: Order Confirmation
console.log('━━━ Test 1: Order Confirmation SMS ━━━');
const confirmMsg = sms.SMS_TEMPLATES.ORDER_CONFIRMATION('HW-20251212-0001', 1500.50, 'Juan\'s Hardware Store');
console.log(`\nCustomer: Juan Dela Cruz`);
console.log(`Phone: 09171234567 (GLOBE)`);
console.log(`Message:\n"${confirmMsg}"\n`);
console.log(`Length: ${confirmMsg.length} characters (Max SMS length: 160)`);

// Test 2: Order Accepted
console.log('\n━━━ Test 2: Order Accepted SMS ━━━');
const acceptMsg = sms.SMS_TEMPLATES.ORDER_ACCEPTED('HW-20251212-0001', 'Juan\'s Hardware Store');
console.log(`\nCustomer Phone: 09181234567 (SMART)`);
console.log(`Message:\n"${acceptMsg}"\n`);
console.log(`Length: ${acceptMsg.length} characters`);

// Test 3: Out for Delivery
console.log('\n━━━ Test 3: Out for Delivery SMS ━━━');
const deliveryMsg = sms.SMS_TEMPLATES.ORDER_OUT_FOR_DELIVERY('HW-20251212-0001', '30 minutes');
console.log(`\nCustomer Phone: 09221234567 (SMART/SUN)`);
console.log(`Message:\n"${deliveryMsg}"\n`);
console.log(`Length: ${deliveryMsg.length} characters`);

// Test 4: Order Delivered
console.log('\n━━━ Test 4: Order Delivered SMS ━━━');
const deliveredMsg = sms.SMS_TEMPLATES.ORDER_DELIVERED('HW-20251212-0001', 'Juan\'s Hardware Store');
console.log(`\nCustomer Phone: 09911234567 (DITO)`);
console.log(`Message:\n"${deliveredMsg}"\n`);
console.log(`Length: ${deliveredMsg.length} characters`);

// Test 5: Admin Notification
console.log('\n━━━ Test 5: Admin Notification SMS ━━━');
const adminMsg = sms.SMS_TEMPLATES.ADMIN_NEW_ORDER('HW-20251212-0001', 1500.50, 'Juan Dela Cruz');
console.log(`\nAdmin Phone: 09171234567`);
console.log(`Message:\n"${adminMsg}"\n`);
console.log(`Length: ${adminMsg.length} characters`);

// Test 6: Phone validation examples
console.log('\n━━━ Test 6: Phone Number Validation ━━━');
const testPhones = [
  '09171234567',
  '+639171234567',
  '09181234567',
  '09911234567',
  '0917-123-4567',
];

console.log('\nSupported Philippine phone number formats:\n');
testPhones.forEach(phone => {
  const result = sms.validatePhoneNumber(phone);
  console.log(`✓ ${phone.padEnd(16)} → ${result.formatted} (${result.telco})`);
});

// Test 7: Telco detection
console.log('\n━━━ Test 7: Automatic Telco Detection ━━━');
const telcoExamples = [
  { phone: '09171234567', expected: 'GLOBE' },
  { phone: '09271234567', expected: 'GLOBE' },
  { phone: '09181234567', expected: 'SMART' },
  { phone: '09071234567', expected: 'SMART (TNT)' },
  { phone: '09221234567', expected: 'SMART (SUN)' },
  { phone: '09911234567', expected: 'DITO' },
];

console.log('\nAutomatic network detection:\n');
telcoExamples.forEach(example => {
  const telco = sms.getTelco(example.phone);
  console.log(`${example.phone} → ${telco}`);
});

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                    Demo Complete!                             ║');
console.log('╠════════════════════════════════════════════════════════════════╣');
console.log('║                                                                ║');
console.log('║  In DEVELOPMENT MODE:                                         ║');
console.log('║  • SMS messages are logged to console (like above)            ║');
console.log('║  • No actual SMS sent                                         ║');
console.log('║  • No costs                                                   ║');
console.log('║  • Perfect for testing locally                               ║');
console.log('║                                                                ║');
console.log('║  When you create an order with:                              ║');
console.log('║    POST /api/orders                                          ║');
console.log('║                                                                ║');
console.log('║  You\'ll see SMS output like above in the server console      ║');
console.log('║                                                                ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');
