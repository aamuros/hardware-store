# SMS Integration Testing Guide

## Testing Options

### 1. **Development Mode (No SMS Sent) - EASIEST**
Use this for immediate testing without any configuration or costs.

```env
# In .env file
NODE_ENV=development
SMS_ENABLED=false
SMS_TEST_MODE=false
```

**How it works:**
- SMS messages are logged to console
- No actual SMS sent
- No API keys needed
- Perfect for development

**Example output:**
```
📱 ════════════════════════════════════════════════════
📱 SMS (Development Mode - No actual SMS sent)
📱 ════════════════════════════════════════════════════
📱 To: 09171234567 (GLOBE)
📱 Message: [Hardware Store] Order HW-001 received! Total: P1500.00. We'll notify you when accepted. Salamat po!
📱 Length: 123 characters
📱 ════════════════════════════════════════════════════
```

### 2. **Test Mode (Validates Only) - RECOMMENDED FOR TESTING**
Validates phone numbers and logs SMS without consuming credits.

```env
SMS_ENABLED=true
SMS_TEST_MODE=true
```

**How it works:**
- Full validation of Philippine phone numbers
- SMS recorded in database (sms_logs table)
- Can test the entire flow
- No costs
- Best for QA/testing

### 3. **Free Trial SMS Providers**

#### **Option A: Semaphore (RECOMMENDED)**
- **Free tier**: 100 free credits (~35 PHP messages)
- **Sign up**: https://semaphore.co/
- **No credit card required** initially
- Best for Philippines

**Setup:**
```env
SMS_ENABLED=true
SMS_TEST_MODE=false
SEMAPHORE_API_KEY=your_semaphore_api_key
SMS_PROVIDERS=semaphore
```

#### **Option B: Vonage (formerly Nexmo)**
- **Free tier**: $2 credit (~6 SMS messages)
- **Sign up**: https://dashboard.nexmo.com/
- **Credit card required**
- International coverage

```env
SMS_ENABLED=true
VONAGE_API_KEY=your_vonage_api_key
VONAGE_API_SECRET=your_vonage_api_secret
SMS_PROVIDERS=vonage
```

#### **Option C: AWS SNS**
- **Free tier**: 100 SMS per month (for 12 months)
- **Sign up**: https://aws.amazon.com/sns/
- **Credit card required**
- Good for production scaling

### 4. **Run Existing Unit Tests**

Test the SMS service without any configuration:

```bash
# Test SMS phone validation
cd backend
npm test -- --testPathPattern=sms.test.js

# Output shows:
# ✓ 34 tests passing
# ✓ Phone validation for Globe, Smart, DITO
# ✓ Template generation
```

### 5. **Manual API Testing with cURL or Postman**

#### **Test Order Creation with SMS in Development Mode**

```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Juan Dela Cruz",
    "phone": "09171234567",
    "address": "123 Rizal St, Makati City, Metro Manila",
    "barangay": "Salcedo Village",
    "landmarks": "Near SM Makati",
    "items": [
      {
        "productId": 1,
        "quantity": 2
      }
    ]
  }'
```

**Expected response in dev mode:**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "orderNumber": "HW-20251212-0001",
    "totalAmount": 500.00,
    "status": "pending"
  }
}
```

**Check console output for:**
```
📱 SMS logged to console showing confirmation message
```

#### **Test Order Status Update**

```bash
# First get an order ID from the orders table
curl -X PATCH http://localhost:3001/api/admin/orders/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "accepted",
    "message": "Your order is ready for preparation"
  }'
```

### 6. **Check SMS Logs in Database**

```sql
-- View all SMS logs
SELECT id, phone, message, status, sentAt, error FROM sms_logs ORDER BY createdAt DESC LIMIT 10;

-- Check specific order SMS history
SELECT phone, message, status, sentAt FROM sms_logs WHERE orderId = 1;

-- Get SMS statistics
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
  ROUND(100.0 * SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM sms_logs;
```

### 7. **Test Different Phone Numbers**

Test with real Philippine phone numbers from different networks:

```bash
# Globe numbers
09171234567, 09271234567, 09771234567

# Smart/TNT/Sun numbers  
09181234567, 09071234567, 09221234567

# DITO numbers
09911234567, 09931234567
```

All these should validate successfully and generate SMS in test/dev mode.

### 8. **Test Phone Validation**

Test the validation directly:

```bash
node -e "
const sms = require('./src/services/smsService');

// Test different formats
console.log('09171234567:', sms.validatePhoneNumber('09171234567'));
console.log('+639171234567:', sms.validatePhoneNumber('+639171234567'));
console.log('639171234567:', sms.validatePhoneNumber('639171234567'));
console.log('9171234567:', sms.validatePhoneNumber('9171234567'));
console.log('Invalid (08XX):', sms.validatePhoneNumber('08171234567'));
"
```

### 9. **Recommended Testing Flow**

**Phase 1: Development** (FREE)
```env
NODE_ENV=development
SMS_ENABLED=false      # Only logs to console
```
✓ Test order creation
✓ Check console for SMS preview
✓ Verify phone validation works
✓ Check database sms_logs table

**Phase 2: Testing** (FREE)
```env
NODE_ENV=development
SMS_ENABLED=true
SMS_TEST_MODE=true     # Validate but don't send
```
✓ Test full flow with database logging
✓ Verify SMS templates
✓ Test different phone numbers
✓ Check error handling

**Phase 3: Production** (PAID)
```env
NODE_ENV=production
SMS_ENABLED=true
SMS_TEST_MODE=false
SEMAPHORE_API_KEY=xxxx  # With actual provider
```
✓ Real SMS sent to customers
✓ Monitor SMS logs
✓ Track delivery status

## Cost Comparison

| Provider | Free Tier | Cost | Best For |
|----------|-----------|------|----------|
| Semaphore | 100 credits (~35 SMS) | ₱0.35/SMS | Development, Philippines |
| Vonage | $2 credit (~6 SMS) | $0.0625/SMS | International |
| AWS SNS | 100 SMS/month (1yr) | $0.50/100 SMS | Production scaling |
| None (Dev Mode) | Unlimited | Free | Local testing |

## Troubleshooting

**SMS not being sent?**
```bash
# Check configuration
node -e "const config = require('./src/config'); console.log(config.sms);"

# Check if provider is configured
node -e "
const sms = require('./src/services/smsService');
console.log('Semaphore configured:', sms.isProviderConfigured('semaphore'));
console.log('Vonage configured:', sms.isProviderConfigured('vonage'));
"
```

**Phone validation failing?**
```bash
# Test phone number validation
node -e "
const sms = require('./src/services/smsService');
const result = sms.validatePhoneNumber('09171234567');
console.log(result);
"
```

**Check SMS logs in database:**
```bash
# Connect to database and check:
SELECT * FROM sms_logs WHERE status = 'failed' ORDER BY createdAt DESC;
```

## Next Steps

1. **Start with Development Mode** - no setup needed
2. **Test phone validation** - try different formats
3. **Create test orders** - see SMS logs in console
4. **When ready for real SMS** - get free trial from Semaphore
5. **Monitor SMS logs** - track delivery in database
