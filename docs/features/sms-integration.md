# SMS Integration

The application includes an automated SMS notification system that keeps customers informed about their orders. This document explains how it works, how to configure it, and how to test it.

## How It Works

SMS messages are sent automatically at key points during the order lifecycle. Neither the admin nor the customer needs to do anything manually — the system handles it whenever an order's status changes.

| When This Happens | Who Receives the SMS | What the Message Says |
|-------------------|---------------------|----------------------|
| Customer places an order | Customer | Confirmation with order number and total |
| Admin accepts the order | Customer | Notification that the order is being prepared |
| Admin rejects the order | Customer | Notification with the reason for rejection |
| Order goes out for delivery | Customer | Alert that the driver is on the way |
| Order is delivered | Customer | Delivery confirmation and thank-you |
| A new order comes in | Admin | Summary of the new order |

## Supported Phone Networks

The system works with all major Philippine mobile networks. Phone number prefixes are validated before sending.

| Network | Common Prefixes |
|---------|----------------|
| Globe | 0905, 0906, 0915, 0916, 0917, 0926, 0927, 0935, 0936, 0937, 0945, 0955, 0956, 0965, 0966, 0967, 0975, 0976, 0977, 0995, 0996, 0997 |
| Smart / TNT / Sun | 0907, 0908, 0909, 0910, 0911, 0912, 0918, 0919, 0920, 0921, 0928, 0929, 0930, 0931, 0938, 0939, 0940, 0946, 0947, 0948, 0949, 0950, 0951, 0961, 0963, 0968, 0969, 0970, 0971, 0981, 0989, 0992, 0998, 0999 |
| DITO | 0991, 0992, 0993, 0994 |

## Phone Number Handling

Customers can enter their phone number in any common format. The system normalizes it automatically.

```
09171234567        → accepted (standard local format)
+639171234567      → accepted (international with +)
639171234567       → accepted (international without +)
9171234567         → accepted (without leading zero)
0917-123-4567      → accepted (with dashes — dashes are stripped)
```

All numbers are stored internally in the `09XXXXXXXXX` format.

---

## Configuration

### Environment Variables

Add these to `backend/.env` to control SMS behavior:

```env
# Master on/off switch — set to true to activate the SMS system
SMS_ENABLED=false

# When true, messages are validated and logged but not actually sent
SMS_TEST_MODE=true

# Sender name that appears on the recipient's phone (max 11 characters)
SMS_SENDER_NAME=HARDWARE

# Order in which providers are tried — if the first one fails, the next is used
SMS_PROVIDERS=semaphore,movider,vonage

# How many times to retry a failed send before giving up
SMS_MAX_RETRIES=2

# Phone number that receives admin notifications for new orders
ADMIN_NOTIFICATION_PHONE=09171234567
```

### Provider Setup

The system supports three SMS providers. You only need to configure one — Semaphore is the recommended default for Philippine-based stores.

#### Semaphore (recommended)

```env
SEMAPHORE_API_KEY=your_api_key
```

- Sign up at [semaphore.co](https://semaphore.co/)
- Rates are around ₱0.35 per message
- Covers all Philippine networks

#### Movider (backup)

```env
MOVIDER_API_KEY=your_api_key
MOVIDER_API_SECRET=your_api_secret
```

- Sign up at [movider.co](https://movider.co/)
- Rates are around ₱0.50 per message
- Can serve as a fallback if Semaphore is unreachable

#### Vonage (international backup)

```env
VONAGE_API_KEY=your_api_key
VONAGE_API_SECRET=your_api_secret
```

- Sign up at [dashboard.nexmo.com](https://dashboard.nexmo.com/)
- Rates are around $0.05 per message (about ₱2.80)
- Useful if you ever need to send SMS outside the Philippines

---

## Operating Modes

### Development Mode (default)

When running locally, SMS is disabled by default. Messages are printed to the server console instead of being sent. This lets you see exactly what would be sent without needing an API key or spending credits.

```env
NODE_ENV=development
SMS_ENABLED=false
```

Console output looks like this:
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

Messages are validated, formatted, and saved to the database log, but not actually delivered to the phone. This is useful for verifying that the system constructs messages correctly before going live.

```env
SMS_ENABLED=true
SMS_TEST_MODE=true
```

### Production Mode

Real SMS messages are sent to customers through the configured provider.

```env
NODE_ENV=production
SMS_ENABLED=true
SMS_TEST_MODE=false
SEMAPHORE_API_KEY=your_real_api_key
```

---

## Message Templates

Below are the actual message templates the system uses. `[Hardware Store]` is replaced with your `STORE_NAME` value.

**Order Confirmation** (sent when customer places an order):
```
[Hardware Store] Order HW-20241218-0042 received! Total: P1,250.00. We'll notify you when accepted. Salamat po!
```

**Order Accepted** (sent when admin marks order as accepted):
```
[Hardware Store] Your order HW-20241218-0042 is now being prepared. We'll notify you when it's out for delivery. Salamat po!
```

**Order Rejected** (sent when admin rejects the order):
```
[Hardware Store] Sorry, your order HW-20241218-0042 could not be processed. Reason: [reason]. Please contact us for assistance.
```

**Out for Delivery** (sent when order status changes to out_for_delivery):
```
[Hardware Store] Your order HW-20241218-0042 is out for delivery! Our driver is on the way. Salamat po!
```

**Delivered** (sent when order is marked as delivered):
```
[Hardware Store] Order HW-20241218-0042 has been delivered! Thank you for shopping with us. Salamat po!
```

**Admin Notification** (sent to the admin phone when a new order arrives):
```
[New Order] HW-20241218-0042 - Juan Dela Cruz (09171234567) - P1,250.00 - 2 items
```

---

## Testing the SMS System

### Run the Unit Tests

The SMS service has its own dedicated test file:

```bash
cd backend
npm test -- --testPathPattern=sms.test.js
```

These tests cover phone number validation, message formatting, and provider fallback logic.

### Trigger an SMS Manually with cURL

Place an order through the API to see the console output:

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

In development mode, the SMS content will appear in the server console.

### Check the SMS Log Table

Every SMS attempt — whether successful, failed, or running in test mode — is recorded in the `sms_logs` database table. You can inspect these records using Prisma Studio:

```bash
cd backend
npm run db:studio
```

Open the `sms_logs` table in Prisma Studio to see the full history.

---

## Database Logging

All SMS activity is written to the `sms_logs` table regardless of mode. Each record captures:

| Column | What It Stores |
|--------|---------------|
| `phone` | The recipient's phone number |
| `message` | The full text of the SMS |
| `status` | `"pending"`, `"sent"`, or `"failed"` |
| `sentAt` | Timestamp of when the message was delivered |
| `error` | Error details if the send failed |
| `response` | Raw response from the SMS provider |
| `orderId` | The order that triggered this message |

---

## Cost Estimates

Each order generates roughly 3 SMS messages on average (confirmation, status update, delivery notification). Here is what monthly costs look like for different order volumes using Semaphore:

| Orders per Month | SMS per Order | Total Messages | Estimated Cost |
|------------------|---------------|----------------|----------------|
| 50 | 3 | 150 | ₱52.50 |
| 100 | 3 | 300 | ₱105.00 |
| 500 | 3 | 1,500 | ₱525.00 |

---

## Troubleshooting

**SMS messages are not sending:**
1. Confirm `SMS_ENABLED=true` in your `.env`
2. Confirm `SMS_TEST_MODE=false` if you want real delivery
3. Double-check your provider API key
4. Make sure the provider account has credits loaded
5. Look at the `sms_logs` table for error details

**Phone number validation is failing:**
1. Make sure the number is 11 digits and starts with `09`
2. Try entering it in a different format (see the accepted formats above)
3. Check that the prefix is in the supported list for Globe, Smart, TNT, Sun, or DITO

**No SMS output in the console during development:**
1. Restart the server after changing `.env` values — the environment file is only read at startup
2. Verify `NODE_ENV=development` is set
3. Check the server logs for any error messages

---

## Best Practices

1. **Start in development mode** — get everything working before enabling real SMS
2. **Use test mode before going live** — confirm messages look correct without spending credits
3. **Keep messages under 160 characters** — longer messages are split into multiple SMS segments, which costs more
4. **Monitor your provider credits** — set up low-balance alerts if your provider supports it
5. **Check the logs** — the `sms_logs` table is your first stop when debugging delivery issues
6. **Let the retry logic handle transient failures** — the system automatically retries failed sends up to `SMS_MAX_RETRIES` times
