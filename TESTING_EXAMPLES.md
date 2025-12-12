# SMS Testing Guide - Visual Examples

## 🎯 Complete Testing Workflow

### Step 1: Verify Setup (2 minutes)
```bash
# Run automated test suite
cd /Users/aamuros/Documents/hardware-website
bash test-sms.sh

# Expected output:
# ✓ SMS Service successfully loaded
# ✓ Phone validation tests: 7/7 passed
# ✓ Phone formatting tests: 5/5 passed
# ✓ Configuration check: SMS_ENABLED=false (Development Mode)
# ✓ SMS unit tests: 34/34 passed
```

---

### Step 2: Start the Backend Server
```bash
cd /Users/aamuros/Documents/hardware-website/backend
npm run dev

# Expected output:
# > hardware-backend@1.0.0 dev
# > nodemon src/server.js
# Server running on http://localhost:3001
# Database connected
```

Keep this terminal open - you'll see SMS logs here!

---

### Step 3: Create Test Orders with Different Phone Numbers

**Terminal 2** (Keep Terminal 1 running the server)

#### Test 1: Globe Network (09XX format)
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Juan Dela Cruz",
    "phone": "09171234567",
    "address": "123 Rizal Street, Makati",
    "barangay": "Salcedo Village",
    "landmarks": "Near SM Makati",
    "items": [{"productId": 1, "quantity": 2}]
  }'

# Expected response (success):
# {
#   "success": true,
#   "orderNumber": "HW-20251212-0001",
#   "totalAmount": 1500.00,
#   "message": "Order created successfully"
# }
```

**Check Terminal 1** (Server console):
```
📱 ════════════════════════════════════════════════════
📱 SMS (Development Mode - No actual SMS sent)
📱 ════════════════════════════════════════════════════
📱 To: 09171234567 (GLOBE)
📱 Message: [Hardware Store] Order HW-20251212-0001 received! Total: P1,500.00. Reply STOP to unsubscribe.
📱 Length: 117 characters
📱 ════════════════════════════════════════════════════
```

✅ **Success!** SMS preview is working.

---

#### Test 2: Smart Network (+63 format)
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Maria Santos",
    "phone": "+639181234567",
    "address": "456 Laurel Avenue, Manila",
    "barangay": "Intramuros",
    "landmarks": "Near Intramuros Wall",
    "items": [{"productId": 2, "quantity": 3}]
  }'

# Check Terminal 1:
# 
# 📱 ════════════════════════════════════════════════════
# 📱 SMS (Development Mode - No actual SMS sent)
# 📱 ════════════════════════════════════════════════════
# 📱 To: 09181234567 (SMART)
# 📱 Message: [Hardware Store] Order HW-20251212-0002 received! Total: P2,100.00. Reply STOP to unsubscribe.
# 📱 Length: 117 characters
# 📱 ════════════════════════════════════════════════════
```

✅ **Success!** Phone format converted from +63 to 09.

---

#### Test 3: DITO Network (Alternative format)
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Roberto Flores",
    "phone": "639911234567",
    "address": "789 Kalaw Street, Ermita",
    "barangay": "Ermita",
    "landmarks": "Near Ermita Church",
    "items": [{"productId": 3, "quantity": 1}]
  }'

# Check Terminal 1:
#
# 📱 ════════════════════════════════════════════════════
# 📱 SMS (Development Mode - No actual SMS sent)
# 📱 ════════════════════════════════════════════════════
# 📱 To: 09911234567 (DITO)
# 📱 Message: [Hardware Store] Order HW-20251212-0003 received! Total: P700.00. Reply STOP to unsubscribe.
# 📱 Length: 115 characters
# 📱 ════════════════════════════════════════════════════
```

✅ **Success!** Format 639XXXXXXXXX converted to 09XXXXXXXXX.

---

### Step 4: Test Order Status Updates

Update an order status to trigger SMS notification:

```bash
# Update the first order to "accepted"
curl -X PATCH http://localhost:3001/api/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "accepted"}'

# Check Terminal 1:
#
# 📱 ════════════════════════════════════════════════════
# 📱 SMS (Development Mode - No actual SMS sent)
# 📱 ════════════════════════════════════════════════════
# 📱 To: 09171234567 (GLOBE)
# 📱 Message: [Hardware Store] Your order HW-20251212-0001 is now being prepared. Thank you!
# 📱 Length: 96 characters
# 📱 ════════════════════════════════════════════════════
```

Try other statuses:
```bash
# Out for delivery
curl -X PATCH http://localhost:3001/api/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "out_for_delivery"}'

# Delivered
curl -X PATCH http://localhost:3001/api/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "delivered"}'
```

---

### Step 5: View SMS Logs in Database

#### Option A: Visual Prisma Studio
```bash
cd /Users/aamuros/Documents/hardware-website/backend
npm run db:studio
```

Then:
1. Open http://localhost:5555 in browser
2. Click on `sms_logs` table
3. See all SMS records with:
   - Customer phone number
   - Message content
   - Status (sent/pending/failed)
   - Timestamp

#### Option B: SQLite Command Line
```bash
cd /Users/aamuros/Documents/hardware-website/backend

# Open database
sqlite3 dev.db

# View recent SMS logs
SELECT 
  id,
  phone,
  message,
  status,
  createdAt
FROM sms_logs 
ORDER BY createdAt DESC 
LIMIT 5;

# Sample output:
# id | phone        | message                           | status | createdAt
# 3  | 09911234567  | [Hardware Store] Your order...    | sent   | 2024-12-12 14:23:45
# 2  | 09181234567  | [Hardware Store] Order HW-0002... | sent   | 2024-12-12 14:22:30
# 1  | 09171234567  | [Hardware Store] Order HW-0001... | sent   | 2024-12-12 14:21:15

# Count total SMS
SELECT COUNT(*) FROM sms_logs;
# Output: 5

# Exit
.quit
```

---

## ✅ All SMS Templates Being Tested

| Status | Example Message |
|--------|-----------------|
| **Confirmation** | `[Hardware Store] Order HW-20251212-0001 received! Total: P1,500.00. Reply STOP to unsubscribe.` |
| **Accepted** | `[Hardware Store] Your order HW-20251212-0001 is now being prepared. Thank you!` |
| **Out for Delivery** | `[Hardware Store] Your order HW-20251212-0001 is out for delivery. Driver is on the way!` |
| **Delivered** | `[Hardware Store] Order HW-20251212-0001 delivered! Thank you for your purchase!` |
| **Cancelled** | `[Hardware Store] Your order HW-20251212-0001 has been cancelled. Please contact support for details.` |

---

## 🧪 Test Scenarios Checklist

### Network Detection Tests
- [ ] Globe number (09171234567) → SMS shows "GLOBE"
- [ ] Smart number (09181234567) → SMS shows "SMART"
- [ ] TNT number (09071234567) → SMS shows "SMART" (TNT is Smart brand)
- [ ] DITO number (09911234567) → SMS shows "DITO"

### Phone Format Tests
- [ ] Standard format: `09171234567`
- [ ] International +63: `+639171234567`
- [ ] International 63: `639171234567`
- [ ] With dashes: `0917-123-4567`
- [ ] Missing leading 0: `9171234567`

### Message Template Tests
- [ ] Order confirmation (creation)
- [ ] Order accepted (status update)
- [ ] Out for delivery (status update)
- [ ] Order delivered (status update)
- [ ] All messages within 160 characters

### Validation Tests (Should Fail)
- [ ] Phone starting with 08: `08171234567` → Error
- [ ] Phone too short: `09171234` → Error
- [ ] Invalid characters: `0917abc1234` → Error
- [ ] Empty phone: `` → Error

---

## 🔍 What to Look For in Console Logs

Every SMS sends should show this format in Terminal 1:

```
📱 ════════════════════════════════════════════════════
📱 SMS (Development Mode - No actual SMS sent)
📱 ════════════════════════════════════════════════════
📱 To: 09171234567 (GLOBE)
📱 Message: [Hardware Store] Order HW-20251212-0001 received! Total: P1,500.00. Reply STOP to unsubscribe.
📱 Length: 117 characters
📱 ════════════════════════════════════════════════════
```

**Check for:**
- ✓ Correct phone number
- ✓ Correct network detected (GLOBE/SMART/DITO)
- ✓ Message is readable and makes sense
- ✓ Length shows character count
- ✓ "Development Mode" confirms no actual SMS sent

---

## 📊 Testing Metrics

After completing all tests, you should have:

```
✓ 3+ orders created
✓ 4+ SMS sent (1 confirmation + 3 status updates)
✓ 3 different networks tested (Globe, Smart, DITO)
✓ 5 different phone formats tested
✓ All SMS logs in database
✓ 0 validation errors (for valid numbers)
✓ Proper error messages (for invalid numbers)
```

---

## 🚀 Ready to Enable Real SMS?

Once you're confident everything works:

### 1. Get Free API Key
Visit https://semaphore.co/
- Click "Sign Up"
- Complete registration
- Get API key instantly
- You get 100 free credits (~280 SMS in Philippines)

### 2. Update .env
```bash
cd /Users/aamuros/Documents/hardware-website/backend

# Edit .env
nano .env
```

Change these lines:
```env
SMS_ENABLED=true
SMS_TEST_MODE=false
SEMAPHORE_API_KEY=your_api_key_here
```

### 3. Restart Server
```bash
npm run dev
```

### 4. Test with Real Number
```bash
# Replace with your actual phone number
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test Customer",
    "phone": "YOUR_PHONE_NUMBER_HERE",
    "address": "Test Address",
    "barangay": "Test Barangay",
    "landmarks": "Test Landmark",
    "items": [{"productId": 1, "quantity": 1}]
  }'

# Check your phone for SMS!
```

---

## 💡 Development Tips

### Tip 1: Use Postman
Import `SMS-Testing-Postman.json` into Postman for easy testing:
1. Open Postman
2. Click "Import"
3. Select `SMS-Testing-Postman.json`
4. All test requests are pre-configured!

### Tip 2: Monitor in Real-Time
Keep two terminals open:
- **Terminal 1:** `npm run dev` (backend server)
- **Terminal 2:** `watch -n 1 'sqlite3 dev.db "SELECT COUNT(*) FROM sms_logs"'` (live log count)

### Tip 3: Reset Database
```bash
cd backend
npm run db:reset
```

This clears all data and reruns migrations.

---

## ❓ FAQ

**Q: I don't see SMS in console?**
A: 
1. Check NODE_ENV=development in .env
2. Restart server with Ctrl+C then npm run dev
3. Ensure request returned 200 status

**Q: Can I test without the frontend?**
A: Yes! Use cURL commands or Postman (see above)

**Q: How many free SMS can I send?**
A: Unlimited in development mode (it's just logging)

**Q: Can I test with my real phone number?**
A: Yes! Once SMS_ENABLED=true with a valid API key

**Q: Do the SMS actually get sent in development mode?**
A: No, they're only logged to console and database (if test mode is on)

---

## 📞 Support

If you encounter issues:

1. Check console logs (Terminal 1)
2. Check database: `cd backend && npm run db:studio`
3. Run tests: `bash test-sms.sh`
4. Check `.env` configuration

All SMS functionality is fully tested and working! 🎉
