# Orders API

This page documents all endpoints related to orders — placing an order, tracking it, and managing orders from the admin dashboard.

## Endpoint Summary

| Method | Path | Auth Required | What It Does |
|--------|------|---------------|-------------|
| POST | `/orders` | No | Places a new order |
| GET | `/orders/:orderNumber` | No | Tracks an order by its order number |
| GET | `/admin/orders` | Admin | Lists all orders with filtering and pagination |
| GET | `/admin/orders/:id` | Admin | Gets full details of a specific order |
| PATCH | `/admin/orders/:id/status` | Admin | Changes an order's status |
| GET | `/customers/orders` | Customer | Gets the logged-in customer's order history |

---

## Order Statuses

Every order moves through a series of statuses. Here is what each one means:

| Status | Meaning |
|--------|---------|
| `pending` | Order has been placed and is waiting for the store to review it |
| `accepted` | Store has accepted the order |
| `rejected` | Store has declined the order (a reason is provided) |
| `preparing` | Order is being packed and prepared for delivery |
| `out_for_delivery` | A driver has picked up the order and is heading to the customer |
| `delivered` | The order has been handed to the customer |
| `completed` | Order is fully finished |
| `cancelled` | Order was cancelled before delivery |

---

## Place an Order

This is the main endpoint customers interact with. It creates a new order, calculates the total, and triggers an SMS confirmation to the customer's phone.

```
POST /api/orders
```

No authentication is required — even guest users (without an account) can place orders.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| customerName | string | Yes | Customer's full name |
| phone | string | Yes | Philippine mobile number (e.g., 09171234567) |
| address | string | Yes | Street address for delivery |
| barangay | string | Yes | Barangay (neighborhood/district) |
| landmarks | string | No | Nearby landmarks to help the driver |
| notes | string | No | Any special instructions |
| items | array | Yes | List of products to order (at least one) |
| items[].productId | number | Yes | ID of the product |
| items[].quantity | number | Yes | How many units to order (minimum 1) |
| items[].variantId | number | No | ID of a specific variant, if applicable |

### Accepted Phone Number Formats

The API accepts phone numbers in several common formats and normalizes them automatically:

- `09171234567` — standard 11-digit format
- `+639171234567` — international with plus sign
- `639171234567` — international without plus sign
- `9171234567` — without leading zero

### Example

```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Juan Dela Cruz",
    "phone": "09171234567",
    "address": "123 Rizal Street, Makati City",
    "barangay": "Poblacion",
    "landmarks": "Near Mercury Drug",
    "notes": "Call when nearby",
    "items": [
      { "productId": 1, "quantity": 2 },
      { "productId": 5, "quantity": 1, "variantId": 3 }
    ]
  }'
```

### Response

```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "id": 42,
    "orderNumber": "HW-20241218-0042",
    "customerName": "Juan Dela Cruz",
    "phone": "09171234567",
    "status": "pending",
    "totalAmount": 1250.00,
    "items": [
      {
        "productId": 1,
        "productName": "Claw Hammer",
        "quantity": 2,
        "unitPrice": 350.00,
        "subtotal": 700.00
      },
      {
        "productId": 5,
        "productName": "Premium Paint",
        "variantName": "4 Liters",
        "quantity": 1,
        "unitPrice": 550.00,
        "subtotal": 550.00
      }
    ],
    "createdAt": "2024-12-18T10:30:00.000Z"
  }
}
```

The order number follows the format `HW-YYYYMMDD-XXXX`. Customers can use this number to track their order.

### SMS Notification

When the order is created, the customer receives a confirmation text:
```
[Hardware Store] Order HW-20241218-0042 received! Total: P1,250.00. We'll notify you when accepted. Salamat po!
```

---

## Track an Order

Allows anyone to look up an order by its order number. No login is required — the customer just needs the number they received via SMS.

```
GET /api/orders/:orderNumber
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| orderNumber | string | The order number, e.g., `HW-20241218-0042` |

### Example

```bash
curl http://localhost:3001/api/orders/HW-20241218-0042
```

### Response

```json
{
  "success": true,
  "data": {
    "orderNumber": "HW-20241218-0042",
    "status": "preparing",
    "totalAmount": 1250.00,
    "createdAt": "2024-12-18T10:30:00.000Z",
    "statusHistory": [
      { "status": "pending", "timestamp": "2024-12-18T10:30:00.000Z" },
      { "status": "accepted", "timestamp": "2024-12-18T10:35:00.000Z" },
      { "status": "preparing", "timestamp": "2024-12-18T10:40:00.000Z" }
    ]
  }
}
```

The `statusHistory` array shows every status change the order has gone through, in chronological order.

---

## List All Orders (Admin)

Returns all orders with support for filtering by status, date range, and search.

```
GET /api/admin/orders
```

Requires an admin authentication token.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page |
| status | string | — | Filter by order status |
| from | date | — | Only show orders placed on or after this date (YYYY-MM-DD) |
| to | date | — | Only show orders placed on or before this date (YYYY-MM-DD) |
| search | string | — | Search by order number or customer name |

### Example

```bash
curl "http://localhost:3001/api/admin/orders?status=pending&limit=10" \
  -H "Authorization: Bearer <token>"
```

### Response

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 42,
        "orderNumber": "HW-20241218-0042",
        "customerName": "Juan Dela Cruz",
        "phone": "09171234567",
        "status": "pending",
        "totalAmount": 1250.00,
        "itemCount": 2,
        "createdAt": "2024-12-18T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 156,
      "totalPages": 16
    }
  }
}
```

---

## Get Order Details (Admin)

Returns the complete record for a single order, including all items, the full status history, and any SMS messages that were triggered.

```
GET /api/admin/orders/:id
```

Requires an admin authentication token.

### Response

```json
{
  "success": true,
  "data": {
    "id": 42,
    "orderNumber": "HW-20241218-0042",
    "customerName": "Juan Dela Cruz",
    "phone": "09171234567",
    "address": "123 Rizal Street, Makati City",
    "barangay": "Poblacion",
    "landmarks": "Near Mercury Drug",
    "notes": "Call when nearby",
    "status": "preparing",
    "totalAmount": 1250.00,
    "items": [
      {
        "id": 1,
        "product": {
          "id": 1,
          "name": "Claw Hammer",
          "imageUrl": "/uploads/hammer.jpg"
        },
        "quantity": 2,
        "unitPrice": 350.00,
        "subtotal": 700.00
      }
    ],
    "statusHistory": [
      {
        "fromStatus": null,
        "toStatus": "pending",
        "changedBy": null,
        "createdAt": "2024-12-18T10:30:00.000Z"
      },
      {
        "fromStatus": "pending",
        "toStatus": "accepted",
        "changedBy": { "name": "Admin" },
        "createdAt": "2024-12-18T10:35:00.000Z"
      }
    ],
    "smsLogs": [
      {
        "message": "[Hardware Store] Order received...",
        "status": "sent",
        "sentAt": "2024-12-18T10:30:05.000Z"
      }
    ],
    "createdAt": "2024-12-18T10:30:00.000Z",
    "updatedAt": "2024-12-18T10:40:00.000Z"
  }
}
```

---

## Update Order Status (Admin)

Moves an order to the next stage in the workflow. Each status change triggers an SMS notification to the customer.

```
PATCH /api/admin/orders/:id/status
```

Requires an admin authentication token.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | Yes | The new status to set |
| message | string | No | Custom message to include in the SMS |
| notes | string | No | Internal notes (not sent to customer) |

### Allowed Status Transitions

Not every status can transition to every other status. The valid paths are:

| Current Status | Can Change To |
|---------------|---------------|
| pending | accepted, rejected |
| accepted | preparing, cancelled |
| preparing | out_for_delivery, cancelled |
| out_for_delivery | delivered |
| delivered | completed |

Attempting an invalid transition (for example, going from "delivered" back to "preparing") will return a 400 error.

### Example

```bash
curl -X PATCH http://localhost:3001/api/admin/orders/42/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "status": "out_for_delivery",
    "notes": "Driver: Pedro - 09181234567"
  }'
```

### Response

```json
{
  "success": true,
  "message": "Order status updated to out_for_delivery",
  "data": {
    "id": 42,
    "orderNumber": "HW-20241218-0042",
    "status": "out_for_delivery"
  }
}
```

### SMS Triggered

```
[Hardware Store] Your order HW-20241218-0042 is out for delivery! Our driver is on the way. Salamat po!
```

---

## Customer Order History

Returns the order history for the currently logged-in customer.

```
GET /api/customers/orders
```

Requires a customer authentication token.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Results per page |
| status | string | — | Filter by order status |

### Example

```bash
curl http://localhost:3001/api/customers/orders \
  -H "Authorization: Bearer <customer-token>"
```

---

## Error Responses

### Validation Error (invalid input)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "phone", "message": "Invalid Philippine phone number format" },
    { "field": "items", "message": "At least one item is required" }
  ]
}
```

### Product Out of Stock

```json
{
  "success": false,
  "message": "Some products are unavailable",
  "errors": [
    { "productId": 5, "message": "Product is out of stock" }
  ]
}
```

### Invalid Status Change

```json
{
  "success": false,
  "message": "Cannot change status from 'delivered' to 'preparing'"
}
```
