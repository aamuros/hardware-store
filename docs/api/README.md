# API Reference

The Hardware Store API is a RESTful API built with Express.js. This document provides an overview of all available endpoints.

## Base URL

- **Development:** `http://localhost:3001/api`
- **Production:** `https://your-backend.railway.app/api`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. There are two types of users:

| User Type | Auth Endpoint | Description |
|-----------|---------------|-------------|
| Admin | `/api/admin/login` | Store staff and administrators |
| Customer | `/api/customers/login` | Customer accounts |

### Using Authentication

Include the JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### Token Expiration

Tokens expire after 7 days by default. After expiration, users must log in again.

## Response Format

All API responses follow this format:

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    { "field": "email", "message": "Email is required" }
  ]
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Something went wrong |

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Window:** 15 minutes
- **Max Requests:** 100 per window

When exceeded, you'll receive a `429 Too Many Requests` response.

---

## Endpoints Overview

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List all products |
| GET | `/products/:id` | Get product details |
| GET | `/categories` | List all categories |
| POST | `/orders` | Create a new order |
| GET | `/orders/:orderNumber` | Track order by number |

### Customer Endpoints (Customer Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/customers/register` | Create account |
| POST | `/customers/login` | Sign in |
| GET | `/customers/profile` | Get profile |
| PUT | `/customers/profile` | Update profile |
| GET | `/customers/orders` | Order history |
| GET | `/customers/addresses` | Saved addresses |
| GET | `/customers/wishlist` | Wishlist items |

### Admin Endpoints (Admin Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/login` | Admin sign in |
| GET | `/admin/orders` | List all orders |
| PATCH | `/admin/orders/:id/status` | Update order status |
| GET | `/admin/products` | List products (admin view) |
| POST | `/admin/products` | Create product |
| PUT | `/admin/products/:id` | Update product |
| DELETE | `/admin/products/:id` | Delete product |
| GET | `/admin/dashboard` | Dashboard stats |

---

## Detailed Documentation

- [Products API](./products.md) - Product listing, details, variants
- [Orders API](./orders.md) - Order creation, tracking, management
- [Customers API](./customers.md) - Customer accounts, addresses, wishlist
- [Admin API](./admin.md) - Admin authentication, product management

---

## Quick Examples

### Create an Order

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

### Admin Login

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

When input validation fails:

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

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

```json
{
  "success": false,
  "message": "Access denied. No token provided"
}
```

### Not Found Errors

```json
{
  "success": false,
  "message": "Product not found"
}
```

---

## Pagination

List endpoints support pagination:

```
GET /api/products?page=1&limit=20
```

Response includes pagination info:

```json
{
  "success": true,
  "data": {
    "items": [...],
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

## Filtering & Sorting

### Products

```
GET /api/products?category=1&available=true&search=hammer
```

| Parameter | Type | Description |
|-----------|------|-------------|
| category | number | Filter by category ID |
| available | boolean | Filter by availability |
| search | string | Search in name/description |

### Orders (Admin)

```
GET /api/admin/orders?status=pending&from=2024-01-01&to=2024-12-31
```

| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by order status |
| from | date | Start date (YYYY-MM-DD) |
| to | date | End date (YYYY-MM-DD) |
