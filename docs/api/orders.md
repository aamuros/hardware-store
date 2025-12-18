# Orders API

Complete documentation for order-related endpoints.

## Endpoints Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/orders` | No | Create a new order |
| GET | `/orders/:orderNumber` | No | Track order by number |
| GET | `/admin/orders` | Admin | List all orders |
| GET | `/admin/orders/:id` | Admin | Get order details |
| PATCH | `/admin/orders/:id/status` | Admin | Update order status |
| GET | `/customers/orders` | Customer | Customer order history |

---

## Order Statuses

| Status | Description |
|--------|-------------|
| `pending` | Order placed, awaiting review |
| `accepted` | Order accepted by store |
| `rejected` | Order rejected by store |
| `preparing` | Order being prepared |
| `out_for_delivery` | Driver is on the way |
| `delivered` | Order delivered to customer |
| `completed` | Order completed |
| `cancelled` | Order cancelled |

---

## Create Order

Create a new customer order.

```
POST /api/orders
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| customerName | string | Yes | Customer's full name |
| phone | string | Yes | Philippine phone (09XXXXXXXXX) |
| address | string | Yes | Delivery address |
| barangay | string | Yes | Barangay name |
| landmarks | string | No | Nearby landmarks |
| notes | string | No | Special instructions |
| items | array | Yes | Order items (min 1) |
| items[].productId | number | Yes | Product ID |
| items[].quantity | number | Yes | Quantity (min 1) |
| items[].variantId | number | No | Variant ID if applicable |

### Phone Number Formats

All these formats are accepted and normalized:

- `09171234567` (standard)
- `+639171234567` (international)
- `639171234567` (no plus)
- `9171234567` (no leading 0)

### Example Request

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

### Example Response

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

### SMS Notifications

When an order is created, the customer receives an SMS confirmation:

```
[Hardware Store] Order HW-20241218-0042 received! Total: P1,250.00. We'll notify you when accepted. Salamat po!
```

---

## Track Order

Track an order by its order number (no authentication required).

```
GET /api/orders/:orderNumber
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| orderNumber | string | Order number (e.g., HW-20241218-0042) |

### Example Request

```bash
curl http://localhost:3001/api/orders/HW-20241218-0042
```

### Example Response

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

---

## List Orders (Admin)

Get all orders with filtering and pagination.

```
GET /api/admin/orders
```

**Authentication:** Admin token required

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| status | string | - | Filter by status |
| from | date | - | Start date (YYYY-MM-DD) |
| to | date | - | End date (YYYY-MM-DD) |
| search | string | - | Search by order number or customer |

### Example Request

```bash
curl "http://localhost:3001/api/admin/orders?status=pending&limit=10" \
  -H "Authorization: Bearer <token>"
```

### Example Response

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

Get full details of a specific order.

```
GET /api/admin/orders/:id
```

**Authentication:** Admin token required

### Example Response

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

Update the status of an order. Triggers SMS notification to customer.

```
PATCH /api/admin/orders/:id/status
```

**Authentication:** Admin token required

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | Yes | New status |
| message | string | No | Custom SMS message |
| notes | string | No | Internal notes |

### Valid Status Transitions

| From | Allowed To |
|------|------------|
| pending | accepted, rejected |
| accepted | preparing, cancelled |
| preparing | out_for_delivery, cancelled |
| out_for_delivery | delivered |
| delivered | completed |

### Example Request

```bash
curl -X PATCH http://localhost:3001/api/admin/orders/42/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "status": "out_for_delivery",
    "notes": "Driver: Pedro - 09181234567"
  }'
```

### Example Response

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

### SMS Sent

```
[Hardware Store] Your order HW-20241218-0042 is out for delivery! Our driver is on the way. Salamat po!
```

---

## Customer Order History

Get order history for authenticated customer.

```
GET /api/customers/orders
```

**Authentication:** Customer token required

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |
| status | string | - | Filter by status |

### Example Request

```bash
curl http://localhost:3001/api/customers/orders \
  -H "Authorization: Bearer <customer-token>"
```

---

## Error Responses

### Validation Error

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

### Product Unavailable

```json
{
  "success": false,
  "message": "Some products are unavailable",
  "errors": [
    { "productId": 5, "message": "Product is out of stock" }
  ]
}
```

### Invalid Status Transition

```json
{
  "success": false,
  "message": "Cannot change status from 'delivered' to 'preparing'"
}
```
