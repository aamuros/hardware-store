# Customers API

This page documents all endpoints related to customer accounts — registration, login, profile management, saved addresses, wishlist, and order history.

## Endpoint Summary

| Method | Path | Auth Required | What It Does |
|--------|------|---------------|-------------|
| POST | `/customers/register` | No | Creates a new customer account |
| POST | `/customers/login` | No | Logs in and returns a JWT token |
| GET | `/customers/profile` | Customer | Gets the logged-in customer's profile |
| PUT | `/customers/profile` | Customer | Updates profile info (name, phone) |
| PUT | `/customers/password` | Customer | Changes the account password |
| GET | `/customers/orders` | Customer | Gets the customer's order history |
| GET | `/customers/addresses` | Customer | Lists all saved addresses |
| POST | `/customers/addresses` | Customer | Saves a new delivery address |
| PUT | `/customers/addresses/:id` | Customer | Updates a saved address |
| DELETE | `/customers/addresses/:id` | Customer | Deletes a saved address |
| GET | `/customers/wishlist` | Customer | Lists all wishlist items |
| POST | `/customers/wishlist` | Customer | Adds a product to the wishlist |
| DELETE | `/customers/wishlist/:productId` | Customer | Removes a product from the wishlist |

---

## Registration

Creates a new customer account. After registration, the customer is automatically logged in and a JWT token is returned.

```
POST /api/customers/register
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Must be a valid email address and not already registered |
| password | string | Yes | Minimum 6 characters |
| name | string | Yes | Customer's full name |
| phone | string | No | Philippine mobile number |

### Example

```bash
curl -X POST http://localhost:3001/api/customers/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "securepassword123",
    "name": "Juan Dela Cruz",
    "phone": "09171234567"
  }'
```

### Response

```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "customer": {
      "id": 1,
      "email": "juan@example.com",
      "name": "Juan Dela Cruz"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## Login

Authenticates a customer with their email and password, and returns a JWT token for accessing protected endpoints.

```
POST /api/customers/login
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | The registered email address |
| password | string | Yes | The account password |

### Example

```bash
curl -X POST http://localhost:3001/api/customers/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "securepassword123"
  }'
```

### Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "customer": {
      "id": 1,
      "email": "juan@example.com",
      "name": "Juan Dela Cruz"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## Profile

### Get Profile

Returns the profile of the currently logged-in customer.

```
GET /api/customers/profile
```

Requires a customer authentication token.

### Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "juan@example.com",
    "name": "Juan Dela Cruz",
    "phone": "09171234567",
    "createdAt": "2024-12-01T00:00:00.000Z"
  }
}
```

---

### Update Profile

Updates the customer's name or phone number. The email cannot be changed through this endpoint.

```
PUT /api/customers/profile
```

Requires a customer authentication token.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | Updated full name |
| phone | string | No | Updated phone number |

### Example

```bash
curl -X PUT http://localhost:3001/api/customers/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Juan D. Cruz",
    "phone": "09181234567"
  }'
```

---

### Change Password

Updates the customer's password. The current password must be provided for verification.

```
PUT /api/customers/password
```

Requires a customer authentication token.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| currentPassword | string | Yes | The current password (for verification) |
| newPassword | string | Yes | The new password (minimum 6 characters) |

### Example

```bash
curl -X PUT http://localhost:3001/api/customers/password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "currentPassword": "oldpassword123",
    "newPassword": "newsecurepassword456"
  }'
```

---

## Saved Addresses

Customers can save delivery addresses to their account so they do not have to re-type them every time they place an order.

### List Addresses

```
GET /api/customers/addresses
```

Requires a customer authentication token.

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "label": "Home",
      "address": "123 Rizal Street, Makati City",
      "barangay": "Poblacion",
      "landmarks": "Near Mercury Drug",
      "isDefault": true
    },
    {
      "id": 2,
      "label": "Office",
      "address": "456 Ayala Avenue, Makati City",
      "barangay": "Bel-Air",
      "landmarks": "Ground floor, ABC Building",
      "isDefault": false
    }
  ]
}
```

---

### Add Address

Saves a new delivery address to the customer's account.

```
POST /api/customers/addresses
```

Requires a customer authentication token.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| label | string | Yes | A label like "Home", "Office", etc. |
| address | string | Yes | Street address |
| barangay | string | Yes | Barangay name |
| landmarks | string | No | Nearby landmarks to help with delivery |
| isDefault | boolean | No | Whether to set this as the default address |

### Example

```bash
curl -X POST http://localhost:3001/api/customers/addresses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "label": "Home",
    "address": "123 Rizal Street, Makati City",
    "barangay": "Poblacion",
    "landmarks": "Near Mercury Drug",
    "isDefault": true
  }'
```

---

### Update Address

Updates an existing saved address.

```
PUT /api/customers/addresses/:id
```

Requires a customer authentication token. Accepts the same fields as the add endpoint (all optional).

---

### Delete Address

Removes a saved address from the customer's account.

```
DELETE /api/customers/addresses/:id
```

Requires a customer authentication token.

---

## Wishlist

Customers can save products to a wishlist for quick access later.

### View Wishlist

```
GET /api/customers/wishlist
```

Requires a customer authentication token.

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "addedAt": "2024-12-15T00:00:00.000Z",
      "product": {
        "id": 5,
        "name": "Power Drill",
        "price": 2500.00,
        "imageUrl": "/uploads/drill.jpg",
        "isAvailable": true
      }
    }
  ]
}
```

---

### Add to Wishlist

Adds a product to the customer's wishlist. Each product can only be added once — trying to add a duplicate returns an error.

```
POST /api/customers/wishlist
```

Requires a customer authentication token.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| productId | number | Yes | The ID of the product to add |

### Example

```bash
curl -X POST http://localhost:3001/api/customers/wishlist \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{ "productId": 5 }'
```

---

### Remove from Wishlist

Removes a product from the customer's wishlist.

```
DELETE /api/customers/wishlist/:productId
```

Requires a customer authentication token.

### Example

```bash
curl -X DELETE http://localhost:3001/api/customers/wishlist/5 \
  -H "Authorization: Bearer <token>"
```

---

## Order History

Returns a paginated list of orders placed by the logged-in customer.

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

### Response

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 42,
        "orderNumber": "HW-20241218-0042",
        "status": "delivered",
        "totalAmount": 1250.00,
        "itemCount": 2,
        "createdAt": "2024-12-18T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

## Error Responses

### Email Already Registered

```json
{
  "success": false,
  "message": "Email already registered"
}
```

### Wrong Email or Password

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Address Not Found

```json
{
  "success": false,
  "message": "Address not found"
}
```

### Product Already in Wishlist

```json
{
  "success": false,
  "message": "Product already in wishlist"
}
```
