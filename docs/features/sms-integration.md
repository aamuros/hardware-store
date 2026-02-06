# SMS Integration

The Hardware Store application includes SMS notifications to keep customers informed about their order status. This document covers configuration, usage, and testing.

## Overview

SMS notifications are sent automatically at key points in the order lifecycle:

| Event | Recipient | Message |
|-------|-----------|---------|
| Order placed | Customer | Order confirmation with total |
| Order accepted | Customer | Order is being prepared |
| Order rejected | Customer | Order was rejected with reason |
| Out for delivery | Customer | Driver is on the way |
| Order delivered | Customer | Delivery confirmation |
| New order | Admin | New order notification |

## Supported Networks

The SMS service supports all major Philippine mobile networks:

| Network | Prefixes |
|---------|----------|
| Globe | 0905, 0906, 0915, 0916, 0917, 0926, 0927, 0935, 0936, 0937, 0945, 0955, 0956, 0965, 0966, 0967, 0975, 0976, 0977, 0995, 0996, 0997 |
| Smart/TNT/Sun | 0907, 0908, 0909, 0910, 0911, 0912, 0918, 0919, 0920, 0921, 0928, 0929, 0930, 0931, 0938, 0939, 0940, 0946, 0947, 0948, 0949, 0950, 0951, 0961, 0963, 0968, 0969, 0970, 0971, 0981, 0989, 0992, 0998, 0999 |
| DITO | 0991, 0992, 0993, 0994 |

## Phone Number Formats

The system automatically normalizes phone numbers. All these formats are accepted:

```
09171234567        ✓ Standard
+639171234567      ✓ International with +
639171234567       ✓ International without +
9171234567         ✓ Without leading 0
0917-123-4567      ✓ With dashes
```

---

## Configuration

### Environment Variables

Configure SMS in `backend/.env`:

```env
# Master switch - set to true to enable SMS
SMS_ENABLED=false

# Test mode - validates and logs but doesn't send
SMS_TEST_MODE=true

# Sender name (max 11 characters)
SMS_SENDER_NAME=HARDWARE

# Provider priority (fallback order)
SMS_PROVIDERS=semaphore,movider,vonage

# Retry attempts per SMS
SMS_MAX_RETRIES=2

# Admin phone for order notifications
ADMIN_NOTIFICATION_PHONE=09171234567
```

### Provider Configuration

#### Semaphore ✅ (Primary Provider - Configured)

```env
SEMAPHORE_API_KEY=your_api_key
```

- **Website:** https://semaphore.co/
- **Cost:** ~₱0.35 per SMS
- **Coverage:** All Philippine networks

#### Movider (Backup)

```env
MOVIDER_API_KEY=your_api_key
MOVIDER_API_SECRET=your_api_secret
```

- **Website:** https://movider.co/
- **Cost:** ~₱0.50 per SMS
- **Status:** Available as backup if Semaphore fails

#### Vonage (International Backup)

```env
VONAGE_API_KEY=your_api_key
VONAGE_API_SECRET=your_api_secret
```

- **Website:** https://dashboard.nexmo.com/
- **Cost:** ~$0.05 per SMS
- **Status:** Available for international use cases

---

## Operating Modes

### Development Mode (Default)

SMS messages are logged to the console only. No actual SMS is sent.

```env
NODE_ENV=development
SMS_ENABLED=false
```

**Console Output:**
```
📱 ════════════════════════════════════════════════════
📱 SMS (Development Mode - No actual SMS sent)
📱 ════════════════════════════════════════════════════
📱 To: 09171234567 (GLOBE)
📱 Message: [Hardware Store] Order HW-001 received! Total: P1500.00
📱 Length: 60 characters
📱 ════════════════════════════════════════════════════
```

### Test Mode

SMS is validated and logged to the database, but not actually sent.

```env
SMS_ENABLED=true
SMS_TEST_MODE=true
```

### Production Mode

Real SMS messages are sent to customers.

```env
NODE_ENV=production
SMS_ENABLED=true
SMS_TEST_MODE=false
SEMAPHORE_API_KEY=your_real_api_key
```

---

## SMS Templates

### Order Confirmation

```
[Hardware Store] Order HW-20241218-0042 received! Total: P1,250.00. We'll notify you when accepted. Salamat po!
```

### Order Accepted

```
[Hardware Store] Your order HW-20241218-0042 is now being prepared. We'll notify you when it's out for delivery. Salamat po!
```

### Order Rejected

```
[Hardware Store] Sorry, your order HW-20241218-0042 could not be processed. Reason: [reason]. Please contact us for assistance.
```

### Out for Delivery

```
[Hardware Store] Your order HW-20241218-0042 is out for delivery! Our driver is on the way. Salamat po!
```

### Order Delivered

```
[Hardware Store] Order HW-20241218-0042 has been delivered! Thank you for shopping with us. Salamat po!
```

### Admin Notification

```
[New Order] HW-20241218-0042 - Juan Dela Cruz (09171234567) - P1,250.00 - 2 items
```

---

## Testing SMS

### 1. Run Unit Tests

```bash
cd backend
npm test -- --testPathPattern=sms.test.js
```

### 2. Test with cURL

Create an order to trigger SMS:

```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test Customer",
    "phone": "09171234567",
    "address": "123 Test Street",
    "barangay": "Test Barangay",
    "items": [{ "productId": 1, "quantity": 1 }]
  }'
```

Check the server console for SMS output (in development mode).

### 3. View SMS Logs

Open Prisma Studio:

```bash
cd backend
npm run db:studio
```

Navigate to the `sms_logs` table to see all SMS records.

---

## Database Logging

All SMS attempts are logged to the `sms_logs` table:

| Field | Description |
|-------|-------------|
| phone | Recipient phone number |
| message | Full SMS message |
| status | "pending", "sent", or "failed" |
| sentAt | Timestamp when sent |
| error | Error message if failed |
| response | Provider response |
| orderId | Related order ID |

---

## Cost Estimation

### Per-Message Costs

| Provider | Cost per SMS |
|----------|--------------|
| Semaphore | ₱0.35 |
| Movider | ₱0.50 |
| Vonage | $0.05 (~₱2.80) |

### Monthly Estimates

| Orders/Month | SMS/Order | Total SMS | Semaphore Cost |
|--------------|-----------|-----------|----------------|
| 50 | 3 | 150 | ₱52.50 |
| 100 | 3 | 300 | ₱105.00 |
| 500 | 3 | 1,500 | ₱525.00 |

---

## Troubleshooting

### SMS Not Sending

1. Check `SMS_ENABLED=true` in `.env`
2. Check `SMS_TEST_MODE=false` for real SMS
3. Verify API key is correct
4. Check provider account has credits
5. View error in `sms_logs` table

### Phone Validation Failing

1. Ensure phone is 11 digits starting with 09
2. Try different formats (with/without +63)
3. Check if prefix is in supported list

### SMS Not Appearing in Console

1. Restart the server after `.env` changes
2. Check `NODE_ENV=development`
3. Look for errors in server logs

### Check SMS Logs

```bash
# Open Prisma Studio
npm run db:studio

# Or query directly
sqlite3 prisma/dev.db "SELECT * FROM sms_logs ORDER BY createdAt DESC LIMIT 10;"
```

---

## Best Practices

1. **Start in Development Mode** - Test without costs
2. **Use Test Mode** - Validate before production
3. **Monitor Credits** - Set up low balance alerts
4. **Log Everything** - SMS logs help debugging
5. **Keep Messages Short** - Under 160 chars to avoid splitting
6. **Handle Failures** - Implement retry logic (built-in)
