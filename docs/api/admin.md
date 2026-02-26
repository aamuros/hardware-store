# Admin API

This page documents all endpoints used by the admin dashboard — authentication, order management, product and category CRUD, user management, and dashboard statistics.

## Endpoint Summary

### Authentication

| Method | Path | Auth | What It Does |
|--------|------|------|-------------|
| POST | `/admin/login` | No | Authenticates an admin or staff user |

### Dashboard

| Method | Path | Auth | What It Does |
|--------|------|------|-------------|
| GET | `/admin/dashboard` | Admin | Returns summary statistics for the dashboard |

### Order Management

| Method | Path | Auth | What It Does |
|--------|------|------|-------------|
| GET | `/admin/orders` | Admin | Lists all orders with filtering |
| GET | `/admin/orders/:id` | Admin | Gets full details of a specific order |
| PATCH | `/admin/orders/:id/status` | Admin | Advances an order to the next status |

### Product Management

| Method | Path | Auth | What It Does |
|--------|------|------|-------------|
| GET | `/admin/products` | Admin | Lists all products (including deleted and out-of-stock) |
| POST | `/admin/products` | Admin | Creates a new product |
| PUT | `/admin/products/:id` | Admin | Updates a product |
| DELETE | `/admin/products/:id` | Admin | Soft-deletes a product |
| PATCH | `/admin/products/:id/availability` | Admin | Toggles a product's availability on or off |

### Category Management

| Method | Path | Auth | What It Does |
|--------|------|------|-------------|
| GET | `/admin/categories` | Admin | Lists all categories |
| POST | `/admin/categories` | Admin | Creates a new category |
| PUT | `/admin/categories/:id` | Admin | Renames or updates a category |
| DELETE | `/admin/categories/:id` | Admin | Deletes a category |

### Staff Management

| Method | Path | Auth | What It Does |
|--------|------|------|-------------|
| GET | `/admin/users` | Admin | Lists all admin/staff user accounts |
| POST | `/admin/users` | Admin | Creates a new admin or staff account |

---

## Authentication

### Admin Login

Authenticates an admin or staff user and returns a JWT token.

```
POST /api/admin/login
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | The admin username |
| password | string | Yes | The admin password |

### Example

```bash
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### Response

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

The `role` field is either `"admin"` (full access to everything) or `"staff"` (limited to order processing and product management).

---

## Dashboard

### Get Dashboard Statistics

Returns a summary of key metrics — today's orders, revenue figures, stock alerts, recent orders, and top-selling products. This data powers the main dashboard page.

```
GET /api/admin/dashboard
```

Requires an admin authentication token.

### Response

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

### List All Orders

Returns a paginated list of all orders. Supports filtering by status, date range, and keyword search.

```
GET /api/admin/orders
```

Requires an admin authentication token.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page |
| status | string | — | Show only orders with this status |
| from | date | — | Only orders placed on or after this date (YYYY-MM-DD) |
| to | date | — | Only orders placed on or before this date (YYYY-MM-DD) |
| search | string | — | Search by order number or customer name |

---

### Get Order Details

Returns the complete record for a specific order, including all line items, the full status history timeline, and any SMS messages that were triggered.

```
GET /api/admin/orders/:id
```

Requires an admin authentication token.

---

### Update Order Status

Changes an order's status (e.g., from "pending" to "accepted"). This also triggers an SMS notification to the customer.

```
PATCH /api/admin/orders/:id/status
```

Requires an admin authentication token.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | Yes | The new status |
| notes | string | No | Internal notes about this status change |

### Valid Statuses

`pending`, `accepted`, `rejected`, `preparing`, `out_for_delivery`, `delivered`, `completed`, `cancelled`

Note: not all transitions are allowed. For example, you cannot go from "delivered" back to "preparing". See the [Orders API](./orders.md) page for the full transition table.

### Example

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

Unlike the public product listing endpoint, the admin version includes soft-deleted products, out-of-stock items, and full stock details.

```
GET /api/admin/products
```

Requires an admin authentication token.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page |
| category | number | — | Filter by category ID |
| available | boolean | — | Filter by availability |
| lowStock | boolean | — | Show only products with stock below the low-stock threshold |
| includeDeleted | boolean | false | Include soft-deleted products in the results |
| search | string | — | Search by product name or SKU |

---

### Create Product

Adds a new product to the store.

```
POST /api/admin/products
```

Requires an admin authentication token.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Product name |
| description | string | No | Product description |
| price | number | Yes | Price in PHP |
| unit | string | Yes | Unit of measure (piece, kg, meter, set, etc.) |
| sku | string | No | Stock Keeping Unit — must be unique if provided |
| categoryId | number | Yes | Which category this product belongs to |
| stockQuantity | number | No | Initial quantity in stock (defaults to 0) |
| lowStockThreshold | number | No | Stock level that triggers a low-stock warning |
| isAvailable | boolean | No | Whether the product is visible on the storefront (defaults to true) |
| hasVariants | boolean | No | Whether this product has variants like size or color (defaults to false) |
| hasBulkPricing | boolean | No | Whether bulk pricing tiers apply (defaults to false) |

---

### Update Product

Updates one or more fields on an existing product. Only include the fields you want to change.

```
PUT /api/admin/products/:id
```

Requires an admin authentication token.

---

### Delete Product

Performs a soft delete — the product is flagged as deleted and hidden from the storefront, but the database record is kept so that existing orders still reference it correctly.

```
DELETE /api/admin/products/:id
```

Requires an admin authentication token.

---

### Toggle Availability

A quick way to mark a product as available or unavailable without updating other fields.

```
PATCH /api/admin/products/:id/availability
```

Requires an admin authentication token.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| isAvailable | boolean | Yes | The new availability status |

---

## Category Management

### List Categories

Returns all categories, each with a count of how many active products it contains.

```
GET /api/admin/categories
```

Requires an admin authentication token.

### Response

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

Adds a new product category.

```
POST /api/admin/categories
```

Requires an admin authentication token.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Category name — must be unique |
| description | string | No | A short description of the category |
| icon | string | No | An emoji or icon identifier for the UI |

---

### Update Category

Updates a category's name, description, or icon.

```
PUT /api/admin/categories/:id
```

Requires an admin authentication token.

---

### Delete Category

Deletes a category. **Important:** a category cannot be deleted if there are products still assigned to it. Reassign or remove those products first.

```
DELETE /api/admin/categories/:id
```

Requires an admin authentication token.

---

## Staff Management

### List Admin Users

Returns all admin and staff accounts. Only accessible by users with the `admin` role.

```
GET /api/admin/users
```

Requires an admin authentication token (admin role only — staff cannot access this).

---

### Create Admin User

Creates a new admin or staff account. Only accessible by users with the `admin` role.

```
POST /api/admin/users
```

Requires an admin authentication token (admin role only).

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | Login username — must be unique |
| password | string | Yes | Password (minimum 6 characters) |
| name | string | Yes | Display name for the dashboard |
| role | string | No | Either `"admin"` or `"staff"` (defaults to `"staff"`) |

---

## Error Responses

### No Token Provided

```json
{
  "success": false,
  "message": "Access denied. No token provided"
}
```

### Invalid or Expired Token

```json
{
  "success": false,
  "message": "Invalid token"
}
```

### Insufficient Permissions

Returned when a staff user tries to access an admin-only endpoint (like user management):

```json
{
  "success": false,
  "message": "Access denied. Admin role required"
}
```

### Resource Not Found

```json
{
  "success": false,
  "message": "Order not found"
}
```
