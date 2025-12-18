# Products API

Complete documentation for product-related endpoints.

## Endpoints Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/products` | No | List all products |
| GET | `/products/:id` | No | Get product by ID |
| GET | `/products/:id/variants` | No | Get product variants |
| GET | `/products/:id/images` | No | Get product images |
| GET | `/products/:id/bulk-pricing` | No | Get bulk pricing tiers |
| POST | `/admin/products` | Admin | Create product |
| PUT | `/admin/products/:id` | Admin | Update product |
| DELETE | `/admin/products/:id` | Admin | Delete product (soft) |

---

## List Products

Retrieve a paginated list of products.

```
GET /api/products
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max 100) |
| category | number | - | Filter by category ID |
| available | boolean | - | Filter by availability |
| search | string | - | Search in name/description |
| sortBy | string | createdAt | Sort field |
| sortOrder | string | desc | Sort direction (asc/desc) |

### Example Request

```bash
curl "http://localhost:3001/api/products?category=1&available=true&limit=10"
```

### Example Response

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Claw Hammer",
        "description": "Heavy-duty claw hammer for general use",
        "price": 350.00,
        "unit": "piece",
        "sku": "TOOL-001",
        "imageUrl": "/uploads/hammer.jpg",
        "stockQuantity": 50,
        "isAvailable": true,
        "hasVariants": false,
        "hasBulkPricing": true,
        "category": {
          "id": 1,
          "name": "Tools"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5
    }
  }
}
```

---

## Get Product by ID

Retrieve detailed information about a single product.

```
GET /api/products/:id
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Product ID |

### Example Request

```bash
curl http://localhost:3001/api/products/1
```

### Example Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Premium Wall Paint",
    "description": "High-quality wall paint available in different sizes",
    "price": 450.00,
    "unit": "liter",
    "sku": "PAINT-001",
    "imageUrl": "/uploads/paint.jpg",
    "stockQuantity": 100,
    "lowStockThreshold": 10,
    "isAvailable": true,
    "hasVariants": true,
    "hasBulkPricing": true,
    "category": {
      "id": 2,
      "name": "Paint"
    },
    "variants": [
      {
        "id": 1,
        "name": "1 Liter",
        "sku": "PAINT-001-1L",
        "price": 450.00,
        "stockQuantity": 50,
        "isAvailable": true
      },
      {
        "id": 2,
        "name": "4 Liters",
        "sku": "PAINT-001-4L",
        "price": 1600.00,
        "stockQuantity": 30,
        "isAvailable": true
      }
    ],
    "images": [
      {
        "id": 1,
        "imageUrl": "/uploads/paint-1.jpg",
        "altText": "Paint can front view",
        "isPrimary": true
      }
    ],
    "bulkPricingTiers": [
      { "minQuantity": 10, "discountType": "percentage", "discountValue": 5 },
      { "minQuantity": 25, "discountType": "percentage", "discountValue": 10 }
    ]
  }
}
```

---

## Get Product Variants

Get all variants for a product.

```
GET /api/products/:id/variants
```

### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Small - Red",
      "sku": "TSHIRT-001-S-RED",
      "price": 299.00,
      "stockQuantity": 15,
      "attributes": { "size": "S", "color": "Red" },
      "isAvailable": true
    },
    {
      "id": 2,
      "name": "Medium - Red",
      "sku": "TSHIRT-001-M-RED",
      "price": 299.00,
      "stockQuantity": 25,
      "attributes": { "size": "M", "color": "Red" },
      "isAvailable": true
    }
  ]
}
```

---

## Get Bulk Pricing

Get volume discount tiers for a product.

```
GET /api/products/:id/bulk-pricing
```

### Example Response

```json
{
  "success": true,
  "data": [
    { "minQuantity": 10, "discountType": "percentage", "discountValue": 5 },
    { "minQuantity": 25, "discountType": "percentage", "discountValue": 10 },
    { "minQuantity": 50, "discountType": "percentage", "discountValue": 15 },
    { "minQuantity": 100, "discountType": "percentage", "discountValue": 20 }
  ]
}
```

---

## Create Product (Admin)

Create a new product.

```
POST /api/admin/products
```

**Authentication:** Admin token required

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Product name |
| description | string | No | Product description |
| price | number | Yes | Price in PHP |
| unit | string | Yes | Unit of measure (piece, kg, meter) |
| sku | string | No | Stock keeping unit (unique) |
| categoryId | number | Yes | Category ID |
| stockQuantity | number | No | Initial stock (default: 0) |
| lowStockThreshold | number | No | Low stock alert threshold |
| isAvailable | boolean | No | Availability (default: true) |
| hasVariants | boolean | No | Uses variants (default: false) |
| hasBulkPricing | boolean | No | Has bulk pricing (default: false) |

### Example Request

```bash
curl -X POST http://localhost:3001/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Phillips Screwdriver Set",
    "description": "5-piece screwdriver set",
    "price": 299.00,
    "unit": "set",
    "sku": "TOOL-SCREWDRIVER-SET",
    "categoryId": 1,
    "stockQuantity": 50
  }'
```

### Example Response

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": 25,
    "name": "Phillips Screwdriver Set",
    "price": 299.00,
    "sku": "TOOL-SCREWDRIVER-SET"
  }
}
```

---

## Update Product (Admin)

Update an existing product.

```
PUT /api/admin/products/:id
```

**Authentication:** Admin token required

### Example Request

```bash
curl -X PUT http://localhost:3001/api/admin/products/25 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "price": 349.00,
    "stockQuantity": 75
  }'
```

---

## Delete Product (Admin)

Soft delete a product (sets isDeleted flag).

```
DELETE /api/admin/products/:id
```

**Authentication:** Admin token required

### Example Request

```bash
curl -X DELETE http://localhost:3001/api/admin/products/25 \
  -H "Authorization: Bearer <token>"
```

### Example Response

```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## Product Data Model

```typescript
interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  unit: string;
  sku?: string;
  imageUrl?: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isAvailable: boolean;
  isDeleted: boolean;
  hasVariants: boolean;
  hasBulkPricing: boolean;
  categoryId: number;
  category?: Category;
  variants?: ProductVariant[];
  images?: ProductImage[];
  bulkPricingTiers?: BulkPricingTier[];
  createdAt: Date;
  updatedAt: Date;
}
```
