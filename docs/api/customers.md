# Customers API

Complete documentation for customer account endpoints.

## Endpoints Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/customers/register` | No | Create account |
| POST | `/customers/login` | No | Sign in |
| GET | `/customers/profile` | Customer | Get profile |
| PUT | `/customers/profile` | Customer | Update profile |
| PUT | `/customers/password` | Customer | Change password |
| GET | `/customers/orders` | Customer | Order history |
| GET | `/customers/addresses` | Customer | List saved addresses |
| POST | `/customers/addresses` | Customer | Add address |
| PUT | `/customers/addresses/:id` | Customer | Update address |
| DELETE | `/customers/addresses/:id` | Customer | Delete address |
| GET | `/customers/wishlist` | Customer | Get wishlist |
| POST | `/customers/wishlist` | Customer | Add to wishlist |
| DELETE | `/customers/wishlist/:productId` | Customer | Remove from wishlist |

---

## Authentication

### Register

Create a new customer account.

```
POST /api/customers/register
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address |
| password | string | Yes | Min 6 characters |
| name | string | Yes | Full name |
| phone | string | No | Philippine phone number |

### Example Request

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

### Example Response

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

### Login

Sign in to an existing account.

```
POST /api/customers/login
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Email address |
| password | string | Yes | Password |

### Example Request

```bash
curl -X POST http://localhost:3001/api/customers/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "securepassword123"
  }'
```

### Example Response

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

## Profile Management

### Get Profile

Get the authenticated customer's profile.

```
GET /api/customers/profile
```

**Authentication:** Customer token required

### Example Response

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

Update customer profile information.

```
PUT /api/customers/profile
```

**Authentication:** Customer token required

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | Full name |
| phone | string | No | Phone number |

### Example Request

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

Update customer password.

```
PUT /api/customers/password
```

**Authentication:** Customer token required

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| currentPassword | string | Yes | Current password |
| newPassword | string | Yes | New password (min 6 chars) |

### Example Request

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

### List Addresses

Get all saved delivery addresses.

```
GET /api/customers/addresses
```

**Authentication:** Customer token required

### Example Response

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

Save a new delivery address.

```
POST /api/customers/addresses
```

**Authentication:** Customer token required

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| label | string | Yes | Address label (Home, Office, etc.) |
| address | string | Yes | Street address |
| barangay | string | Yes | Barangay name |
| landmarks | string | No | Nearby landmarks |
| isDefault | boolean | No | Set as default address |

### Example Request

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

Update an existing saved address.

```
PUT /api/customers/addresses/:id
```

**Authentication:** Customer token required

---

### Delete Address

Remove a saved address.

```
DELETE /api/customers/addresses/:id
```

**Authentication:** Customer token required

---

## Wishlist

### Get Wishlist

Get all products in customer's wishlist.

```
GET /api/customers/wishlist
```

**Authentication:** Customer token required

### Example Response

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

Add a product to wishlist.

```
POST /api/customers/wishlist
```

**Authentication:** Customer token required

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| productId | number | Yes | Product ID to add |

### Example Request

```bash
curl -X POST http://localhost:3001/api/customers/wishlist \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{ "productId": 5 }'
```

---

### Remove from Wishlist

Remove a product from wishlist.

```
DELETE /api/customers/wishlist/:productId
```

**Authentication:** Customer token required

### Example Request

```bash
curl -X DELETE http://localhost:3001/api/customers/wishlist/5 \
  -H "Authorization: Bearer <token>"
```

---

## Order History

### Get Customer Orders

Get order history for the authenticated customer.

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

### Example Response

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

### Email Already Exists

```json
{
  "success": false,
  "message": "Email already registered"
}
```

### Invalid Credentials

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

### Already in Wishlist

```json
{
  "success": false,
  "message": "Product already in wishlist"
}
```
