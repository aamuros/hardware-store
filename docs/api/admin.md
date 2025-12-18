# Admin API

Complete documentation for admin/staff endpoints.

## Endpoints Overview

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/admin/login` | No | Admin sign in |

### Dashboard
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/dashboard` | Admin | Dashboard statistics |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/orders` | Admin | List all orders |
| GET | `/admin/orders/:id` | Admin | Get order details |
| PATCH | `/admin/orders/:id/status` | Admin | Update order status |

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/products` | Admin | List products (admin view) |
| POST | `/admin/products` | Admin | Create product |
| PUT | `/admin/products/:id` | Admin | Update product |
| DELETE | `/admin/products/:id` | Admin | Delete product |
| PATCH | `/admin/products/:id/availability` | Admin | Toggle availability |

### Categories
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/categories` | Admin | List categories |
| POST | `/admin/categories` | Admin | Create category |
| PUT | `/admin/categories/:id` | Admin | Update category |
| DELETE | `/admin/categories/:id` | Admin | Delete category |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/users` | Admin | List admin users |
| POST | `/admin/users` | Admin | Create admin user |

---

## Authentication

### Admin Login

```
POST /api/admin/login
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | Admin username |
| password | string | Yes | Admin password |

### Example Request

```bash
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### Example Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "name": "Administrator",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## Dashboard

### Get Dashboard Statistics

```
GET /api/admin/dashboard
```

**Authentication:** Admin token required

### Example Response

```json
{
  "success": true,
  "data": {
    "orders": {
      "today": 12,
      "pending": 5,
      "total": 1250
    },
    "revenue": {
      "today": 15000.00,
      "thisWeek": 85000.00,
      "thisMonth": 320000.00
    },
    "products": {
      "total": 150,
      "lowStock": 8,
      "outOfStock": 2
    },
    "recentOrders": [
      {
        "id": 42,
        "orderNumber": "HW-20241218-0042",
        "customerName": "Juan Dela Cruz",
        "totalAmount": 1250.00,
        "status": "pending",
        "createdAt": "2024-12-18T10:30:00.000Z"
      }
    ],
    "topProducts": [
      {
        "id": 1,
        "name": "Claw Hammer",
        "totalSold": 150,
        "revenue": 52500.00
      }
    ]
  }
}
```

---

## Order Management

### List Orders

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
| search | string | - | Search order number or customer |

---

### Get Order Details

```
GET /api/admin/orders/:id
```

**Authentication:** Admin token required

Returns full order details including items, status history, and SMS logs.

---

### Update Order Status

```
PATCH /api/admin/orders/:id/status
```

**Authentication:** Admin token required

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | Yes | New status |
| notes | string | No | Internal notes |

### Valid Statuses

`pending`, `accepted`, `rejected`, `preparing`, `out_for_delivery`, `delivered`, `completed`, `cancelled`

### Example Request

```bash
curl -X PATCH http://localhost:3001/api/admin/orders/42/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "status": "accepted",
    "notes": "Order confirmed, preparing for delivery"
  }'
```

---

## Product Management

### List Products (Admin View)

```
GET /api/admin/products
```

**Authentication:** Admin token required

Includes deleted products and full stock information.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| category | number | - | Filter by category |
| available | boolean | - | Filter by availability |
| lowStock | boolean | - | Show only low stock items |
| includeDeleted | boolean | false | Include soft-deleted |
| search | string | - | Search name/SKU |

---

### Create Product

```
POST /api/admin/products
```

**Authentication:** Admin token required

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Product name |
| description | string | No | Description |
| price | number | Yes | Price in PHP |
| unit | string | Yes | Unit (piece, kg, meter, etc.) |
| sku | string | No | SKU (unique) |
| categoryId | number | Yes | Category ID |
| stockQuantity | number | No | Initial stock |
| lowStockThreshold | number | No | Low stock alert level |
| isAvailable | boolean | No | Default: true |
| hasVariants | boolean | No | Uses variants |
| hasBulkPricing | boolean | No | Has volume discounts |

---

### Update Product

```
PUT /api/admin/products/:id
```

**Authentication:** Admin token required

Accepts same fields as create (all optional).

---

### Delete Product

```
DELETE /api/admin/products/:id
```

**Authentication:** Admin token required

Performs a soft delete (sets `isDeleted = true`).

---

### Toggle Availability

Quick toggle for product availability.

```
PATCH /api/admin/products/:id/availability
```

**Authentication:** Admin token required

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| isAvailable | boolean | Yes | New availability status |

---

## Category Management

### List Categories

```
GET /api/admin/categories
```

**Authentication:** Admin token required

### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Tools",
      "description": "Hand and power tools",
      "icon": "🔨",
      "productCount": 45
    }
  ]
}
```

---

### Create Category

```
POST /api/admin/categories
```

**Authentication:** Admin token required

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Category name (unique) |
| description | string | No | Description |
| icon | string | No | Emoji or icon name |

---

### Update Category

```
PUT /api/admin/categories/:id
```

**Authentication:** Admin token required

---

### Delete Category

```
DELETE /api/admin/categories/:id
```

**Authentication:** Admin token required

> [!WARNING]
> Cannot delete categories with associated products. Reassign products first.

---

## User Management

### List Admin Users

```
GET /api/admin/users
```

**Authentication:** Admin token required (admin role only)

---

### Create Admin User

```
POST /api/admin/users
```

**Authentication:** Admin token required (admin role only)

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | Username (unique) |
| password | string | Yes | Password (min 6 chars) |
| name | string | Yes | Display name |
| role | string | No | Role: "admin" or "staff" |

---

## Error Responses

### Unauthorized

```json
{
  "success": false,
  "message": "Access denied. No token provided"
}
```

### Invalid Token

```json
{
  "success": false,
  "message": "Invalid token"
}
```

### Forbidden (Wrong Role)

```json
{
  "success": false,
  "message": "Access denied. Admin role required"
}
```

### Not Found

```json
{
  "success": false,
  "message": "Order not found"
}
```
