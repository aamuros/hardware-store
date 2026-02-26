# API Reference

This document provides a complete reference for the Hardware Store REST API. The backend is built with Express.js and follows standard REST conventions.

## Base URL

- **Local development:** `http://localhost:3001/api`
- **Production:** `https://<your-railway-domain>/api`

All endpoint paths listed below are relative to this base URL.

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. There are two separate authentication systems — one for admin/staff users and one for customers.

| User Type | Login Endpoint | Who Uses It |
|-----------|----------------|-------------|
| Admin/Staff | `POST /api/admin/login` | Store employees who manage orders and products |
| Customer | `POST /api/customers/login` | Customers who have created accounts |

After logging in, both return a JWT token. Include this token in all subsequent requests that require authentication:

```
Authorization: Bearer <your-jwt-token>
```

Tokens are valid for 7 days by default. After that, the user must log in again to get a fresh token.

## Response Format

Every API response uses a consistent JSON structure, regardless of the endpoint.

**Successful response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    { "field": "email", "message": "Email is required" }
  ]
}
```

The `errors` array is included when validation fails. Each entry specifies which field caused the error and a human-readable message.

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Request was successful |
| 201 | A new resource was created |
| 400 | The request was invalid (bad input, missing fields) |
| 401 | Authentication failed (missing or expired token) |
| 403 | You do not have permission to perform this action |
| 404 | The requested resource does not exist |
| 429 | Too many requests — rate limit exceeded |
| 500 | Something went wrong on the server |

## Rate Limiting

To prevent abuse, the API limits requests to **100 per 15-minute window** per IP address. If you exceed this, you will receive a `429 Too Many Requests` response. Wait a few minutes before trying again.

---

## Endpoint Summary

### Public Endpoints (no authentication required)

| Method | Path | What It Does |
|--------|------|-------------|
| GET | `/products` | Returns a paginated list of available products |
| GET | `/products/:id` | Returns details for a single product |
| GET | `/categories` | Returns all product categories |
| POST | `/orders` | Creates a new order |
| GET | `/orders/:orderNumber` | Looks up an order by its tracking number |

### Customer Endpoints (customer token required)

| Method | Path | What It Does |
|--------|------|-------------|
| POST | `/customers/register` | Creates a new customer account |
| POST | `/customers/login` | Authenticates and returns a token |
| GET | `/customers/profile` | Returns the logged-in customer's profile |
| PUT | `/customers/profile` | Updates profile information |
| GET | `/customers/orders` | Returns the customer's order history |
| GET | `/customers/addresses` | Lists saved delivery addresses |
| GET | `/customers/wishlist` | Lists wishlist items |

### Admin Endpoints (admin token required)

| Method | Path | What It Does |
|--------|------|-------------|
| POST | `/admin/login` | Authenticates an admin/staff user |
| GET | `/admin/orders` | Lists all orders with filtering |
| PATCH | `/admin/orders/:id/status` | Updates an order's status |
| GET | `/admin/products` | Lists products (includes deleted and out-of-stock) |
| POST | `/admin/products` | Adds a new product |
| PUT | `/admin/products/:id` | Edits an existing product |
| DELETE | `/admin/products/:id` | Soft-deletes a product |
| GET | `/admin/dashboard` | Returns dashboard statistics and summaries |

---

## Detailed Endpoint Documentation

Each set of endpoints has its own dedicated page with full request/response examples:

- [Products API](./products.md) — product listing, details, variants, bulk pricing, admin CRUD
- [Orders API](./orders.md) — order placement, tracking, status management
- [Customers API](./customers.md) — registration, login, addresses, wishlist
- [Admin API](./admin.md) — authentication, dashboard, product/category/user management

---

## Quick Examples

### Place a New Order

```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Juan Dela Cruz",
    "phone": "09171234567",
    "address": "123 Main St, Manila",
    "barangay": "Poblacion",
    "items": [
      { "productId": 1, "quantity": 2 }
    ]
  }'
```

### Get All Products

```bash
curl http://localhost:3001/api/products
```

### Log In as Admin

```bash
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

---

## Error Handling

### Validation Errors

When required fields are missing or have invalid values:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "phone", "message": "Phone must be a valid Philippine number" },
    { "field": "items", "message": "At least one item is required" }
  ]
}
```

### Authentication Errors

When login credentials are wrong:
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

When no token is provided for a protected endpoint:
```json
{
  "success": false,
  "message": "Access denied. No token provided"
}
```

### Not Found Errors

When a requested resource does not exist:
```json
{
  "success": false,
  "message": "Product not found"
}
```

---

## Pagination

List endpoints return paginated results. Control pagination with query parameters:

```
GET /api/products?page=1&limit=20
```

The response includes pagination metadata:

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

## Filtering and Sorting

### Product Filters

```
GET /api/products?category=1&available=true&search=hammer
```

| Parameter | Type | Description |
|-----------|------|-------------|
| category | number | Only show products in this category |
| available | boolean | Filter by availability |
| search | string | Search product names and descriptions |

### Order Filters (admin only)

```
GET /api/admin/orders?status=pending&from=2024-01-01&to=2024-12-31
```

| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by order status |
| from | date | Start date (YYYY-MM-DD format) |
| to | date | End date (YYYY-MM-DD format) |
