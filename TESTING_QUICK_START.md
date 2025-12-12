# How to Test SMS Integration - Quick Start

## 🚀 Quick Start (5 minutes, FREE)

### Step 1: Verify Everything Works
```bash
# Run the test script
bash test-sms.sh

# Or run the demo
node demo-sms.js
```
✅ All tests should pass

### Step 2: Start the Backend Server
```bash
cd backend
npm run dev
```

You should see:
```
Server running on http://localhost:3001
```

### Step 3: Create a Test Order (using cURL)

**Terminal 1** (already running the server):
```bash
# Server should be running from Step 2
```

**Terminal 2** (create an order):
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Juan Dela Cruz",
    "phone": "09171234567",
    "address": "123 Rizal Street, Makati City, Metro Manila",
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

### Step 4: Check Server Console

Look at **Terminal 1** where the server is running. You should see:

```
📱 ════════════════════════════════════════════════════
📱 SMS (Development Mode - No actual SMS sent)
📱 ════════════════════════════════════════════════════
📱 To: 09171234567 (GLOBE)
📱 Message: [Hardware Store] Order HW-20251212-0001 received! Total: P500.00...
📱 Length: 117 characters
📱 ════════════════════════════════════════════════════
```

✅ **SMS Preview is Working!**

---

## 📊 Testing Without Any Setup (RECOMMENDED)

**Current configuration in your `.env`:**
```env
NODE_ENV=development
SMS_ENABLED=false        # ← SMS logs to console, doesn't actually send
```

**What this means:**
- ✅ SMS messages are logged to console
- ✅ You can see what messages will be sent
- ✅ No API keys needed
- ✅ No costs
- ✅ Test the entire flow locally

**Perfect for:**
- Development
- Testing
- Demo purposes

---

## 🧪 Three Testing Modes Explained

### Mode 1: Development Mode (DEFAULT - Currently Active)
```env
NODE_ENV=development
SMS_ENABLED=false
SMS_TEST_MODE=false
```

**Behavior:**
```
📱 ════════════════════════════════════════════════════
📱 SMS (Development Mode - No actual SMS sent)
📱 ════════════════════════════════════════════════════
📱 To: 09171234567 (GLOBE)
📱 Message: [Store] Order HW-001 received! Total: P1500.00...
📱 Length: 110 characters
📱 ════════════════════════════════════════════════════
```

**Cost:** FREE ✓
**Use Case:** Local development

---

### Mode 2: Test Mode
```env
NODE_ENV=development
SMS_ENABLED=true
SMS_TEST_MODE=true      # ← Validates but doesn't send
```

**Behavior:**
```
📱 SMS Test Mode: Would send to 09171234567 (GLOBE): [Store] Order HW-001...
```

**Bonus:** SMS is saved to database (sms_logs table)

**Cost:** FREE ✓
**Use Case:** Testing with database logging

---

### Mode 3: Production Mode (Sends Real SMS)
```env
NODE_ENV=production
SMS_ENABLED=true
SMS_TEST_MODE=false
SEMAPHORE_API_KEY=your_api_key_here
```

**Behavior:**
Real SMS sent to customer phone numbers

**Cost:** Paid (₱0.35 per SMS with Semaphore)
**Use Case:** Production deployment

---

## 📱 Testing Different Phone Numbers

All these numbers should work and automatically detect the network:

```bash
# Globe numbers
09171234567   → GLOBE
09271234567   → GLOBE
09771234567   → GLOBE

# Smart/TNT/Sun numbers
09181234567   → SMART
09071234567   → SMART (TNT)
09221234567   → SMART (SUN)

# DITO numbers
09911234567   → DITO
09931234567   → DITO
```

Try creating orders with different numbers - SMS will detect the network automatically!

---

## 🔍 Viewing SMS Logs in Database

### Option 1: Using Prisma Studio (GUI)
```bash
cd backend
npm run db:studio
```
Then navigate to `sms_logs` table in the web interface.

### Option 2: Using SQLite CLI
```bash
cd backend

# Connect to database
sqlite3 dev.db

# View all SMS logs
SELECT phone, message, status, sentAt FROM sms_logs ORDER BY createdAt DESC LIMIT 10;

# Check success rate
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
  ROUND(100.0 * SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM sms_logs;

# Exit
.quit
```

---

## ✅ Complete Testing Checklist

- [ ] Run `bash test-sms.sh` - all 34 tests pass
- [ ] Run `node demo-sms.js` - see SMS preview
- [ ] Start backend: `npm run dev`
- [ ] Create an order via API
- [ ] See SMS logged to console
- [ ] Check database `sms_logs` table
- [ ] Test with different phone numbers
- [ ] Verify SMS templates are correct

---

## 🎯 Next: Enable Real SMS (Optional)

When ready to send real SMS to customers:

### 1. Sign Up for Free Trial
Visit https://semaphore.co/
- Free 100 credits (~35 SMS)
- No credit card required initially
- Instant API key

### 2. Update `.env`
```env
SMS_ENABLED=true
SMS_TEST_MODE=false
SEMAPHORE_API_KEY=your_api_key_from_semaphore
ADMIN_NOTIFICATION_PHONE=09171234567
```

### 3. Restart Server
```bash
npm run dev
```

### 4. Create an Order
Real SMS will now be sent!

---

## 🐛 Troubleshooting

**Q: SMS not showing in console?**
A: Check that `NODE_ENV=development` in your `.env`

**Q: Getting validation error for phone?**
A: Must start with `09` and be 11 digits total
- ✓ Valid: `09171234567`
- ✗ Invalid: `08171234567` (starts with 08)
- ✗ Invalid: `0917123456` (too short)

**Q: Want to check actual SMS sent?**
A: View database:
```bash
cd backend && npm run db:studio
# Navigate to sms_logs table
```

**Q: API returning 400 error?**
A: Check error message in response - likely phone validation. Try:
```bash
# Valid test numbers
09171234567  # Globe
09181234567  # Smart
09911234567  # DITO
```

---

## 📚 Files Reference

- 📄 **SMS_TESTING_GUIDE.md** - Comprehensive testing guide
- 🧪 **test-sms.sh** - Automated test script
- 🎬 **demo-sms.js** - SMS message demo
- 📱 **backend/src/services/smsService.js** - SMS service code
- ⚙️ **backend/src/config/index.js** - Configuration
- 📋 **backend/tests/sms.test.js** - Unit tests

---

## Summary

✅ **Current Status:** Everything working in Development Mode (FREE)
✅ **Phone Validation:** All Philippine networks supported
✅ **SMS Preview:** See messages in console before sending
✅ **Database Logging:** All SMS recorded in database
✅ **Unit Tests:** 34 tests passing

**To test right now:** `bash test-sms.sh` or `npm run dev` + create an order
**To send real SMS:** Get Semaphore API key and update `.env`
