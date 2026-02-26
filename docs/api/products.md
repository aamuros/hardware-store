# Products API

This page documents all endpoints related to products — browsing the catalog, viewing product details, and admin operations for creating, updating, and deleting products.

## Endpoint Summary

| Method | Path | Auth Required | What It Does |
|--------|------|---------------|-------------|
| GET | `/products` | No | Lists products with pagination and filtering |
| GET | `/products/:id` | No | Gets full details for a single product |
| GET | `/products/:id/variants` | No | Gets all variants of a product |
| GET | `/products/:id/images` | No | Gets the image gallery for a product |
| GET | `/products/:id/bulk-pricing` | No | Gets bulk pricing tiers for a product |
| POST | `/admin/products` | Admin | Creates a new product |
| PUT | `/admin/products/:id` | Admin | Updates an existing product |
| DELETE | `/admin/products/:id` | Admin | Soft-deletes a product |

---

## List Products

Returns a paginated, filterable list of products. Only shows products that are available and not deleted (the admin endpoint shows everything).

```
GET /api/products
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Which page of results to return |
| limit | number | 20 | How many products per page (maximum 100) |
| category | number | — | Show only products in this category ID |
| available | boolean | — | Filter by availability status |
| search | string | — | Search by product name or description |
| sortBy | string | createdAt | Field to sort by |
| sortOrder | string | desc | Sort direction: `asc` or `desc` |

### Example

```bash
curl "http://localhost:3001/api/products?category=1&available=true&limit=10"
```

### Response

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

Returns full details for a single product, including its variants, images, and bulk pricing tiers (if any).

```
GET /api/products/:id
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | The product's ID |

### Example

```bash
curl http://localhost:3001/api/products/1
```

### Response

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

Returns all available variants for a product. Variants represent different versions of the same product — for example, different sizes or colors.

```
GET /api/products/:id/variants
```

### Response

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

Returns the volume discount tiers configured for a product. Customers ordering larger quantities can qualify for reduced prices.

```
GET /api/products/:id/bulk-pricing
```

### Response

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

Adds a new product to the catalog.

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
| unit | string | Yes | Unit of measure (piece, kg, meter, etc.) |
| sku | string | No | Stock keeping unit — must be unique if provided |
| categoryId | number | Yes | ID of the category this product belongs to |
| stockQuantity | number | No | Initial stock quantity (defaults to 0) |
| lowStockThreshold | number | No | Stock level that triggers a low-stock warning |
| isAvailable | boolean | No | Whether the product is visible to customers (defaults to true) |
| hasVariants | boolean | No | Whether this product uses variants (defaults to false) |
| hasBulkPricing | boolean | No | Whether bulk pricing tiers apply (defaults to false) |

### Example

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

### Response

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

Updates fields on an existing product. You only need to include the fields you want to change.

```
PUT /api/admin/products/:id
```

Requires an admin authentication token.

### Example

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

Performs a soft delete — the product is marked as deleted but not removed from the database. It will no longer appear on the storefront, but existing order records that reference it are preserved.

```
DELETE /api/admin/products/:id
```

Requires an admin authentication token.

### Example

```bash
curl -X DELETE http://localhost:3001/api/admin/products/25 \
  -H "Authorization: Bearer <token>"
```

### Response

```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## Product Data Model

For reference, here is the TypeScript-style shape of a product object as returned by the API:

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
