-- Patch migration: adds any columns/tables/indexes that may be missing
-- because the init migration was baselined on an older database.
-- All statements use IF NOT EXISTS for idempotency.

-- ============================================================
-- Missing columns on existing tables
-- ============================================================

-- categories: icon, imageUrl, isDeleted
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "icon" TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- products: sku, imageUrl, isDeleted, hasVariants, hasBulkPricing, lowStockThreshold
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sku" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "stockQuantity" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "lowStockThreshold" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "isAvailable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hasVariants" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hasBulkPricing" BOOLEAN NOT NULL DEFAULT false;

-- orders: customerId, landmarks, notes
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customerId" INTEGER;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "landmarks" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- order_items: variantId, variantName
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variantId" INTEGER;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variantName" TEXT;

-- sms_logs: response
ALTER TABLE "sms_logs" ADD COLUMN IF NOT EXISTS "response" TEXT;

-- order_status_history: notes
ALTER TABLE "order_status_history" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- ============================================================
-- Missing tables (IF NOT EXISTS)
-- ============================================================

CREATE TABLE IF NOT EXISTS "password_resets" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "admin_password_resets" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_password_resets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "product_images" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "bulk_pricing_tiers" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bulk_pricing_tiers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "product_variants" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "attributes" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "order_status_history" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedById" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "saved_addresses" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "barangay" TEXT NOT NULL,
    "landmarks" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "saved_addresses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "wishlist_items" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- Missing indexes (IF NOT EXISTS / safe creates)
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS "products_sku_key" ON "products"("sku");
CREATE INDEX IF NOT EXISTS "products_isDeleted_idx" ON "products"("isDeleted");
CREATE INDEX IF NOT EXISTS "products_isAvailable_idx" ON "products"("isAvailable");
CREATE INDEX IF NOT EXISTS "products_name_idx" ON "products"("name");
CREATE INDEX IF NOT EXISTS "products_categoryId_idx" ON "products"("categoryId");

CREATE INDEX IF NOT EXISTS "product_images_productId_idx" ON "product_images"("productId");
CREATE INDEX IF NOT EXISTS "bulk_pricing_tiers_productId_idx" ON "bulk_pricing_tiers"("productId");
CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_sku_key" ON "product_variants"("sku");
CREATE INDEX IF NOT EXISTS "product_variants_productId_idx" ON "product_variants"("productId");

CREATE INDEX IF NOT EXISTS "orders_customerId_idx" ON "orders"("customerId");
CREATE INDEX IF NOT EXISTS "order_items_variantId_idx" ON "order_items"("variantId");

CREATE UNIQUE INDEX IF NOT EXISTS "password_resets_token_key" ON "password_resets"("token");
CREATE INDEX IF NOT EXISTS "password_resets_customerId_idx" ON "password_resets"("customerId");
CREATE INDEX IF NOT EXISTS "password_resets_token_idx" ON "password_resets"("token");

CREATE UNIQUE INDEX IF NOT EXISTS "admin_password_resets_token_key" ON "admin_password_resets"("token");
CREATE INDEX IF NOT EXISTS "admin_password_resets_userId_idx" ON "admin_password_resets"("userId");
CREATE INDEX IF NOT EXISTS "admin_password_resets_token_idx" ON "admin_password_resets"("token");

CREATE INDEX IF NOT EXISTS "order_status_history_orderId_idx" ON "order_status_history"("orderId");
CREATE INDEX IF NOT EXISTS "order_status_history_changedById_idx" ON "order_status_history"("changedById");
CREATE INDEX IF NOT EXISTS "order_status_history_createdAt_idx" ON "order_status_history"("createdAt");

CREATE INDEX IF NOT EXISTS "saved_addresses_customerId_idx" ON "saved_addresses"("customerId");

CREATE INDEX IF NOT EXISTS "wishlist_items_customerId_idx" ON "wishlist_items"("customerId");
CREATE INDEX IF NOT EXISTS "wishlist_items_productId_idx" ON "wishlist_items"("productId");
CREATE UNIQUE INDEX IF NOT EXISTS "wishlist_items_customerId_productId_key" ON "wishlist_items"("customerId", "productId");

CREATE INDEX IF NOT EXISTS "sms_logs_orderId_idx" ON "sms_logs"("orderId");
CREATE INDEX IF NOT EXISTS "sms_logs_status_idx" ON "sms_logs"("status");

CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders"("status");
CREATE INDEX IF NOT EXISTS "orders_phone_idx" ON "orders"("phone");
CREATE INDEX IF NOT EXISTS "orders_orderNumber_idx" ON "orders"("orderNumber");
CREATE INDEX IF NOT EXISTS "orders_createdAt_idx" ON "orders"("createdAt");

CREATE INDEX IF NOT EXISTS "order_items_orderId_idx" ON "order_items"("orderId");
CREATE INDEX IF NOT EXISTS "order_items_productId_idx" ON "order_items"("productId");

-- ============================================================
-- Missing foreign keys (safe — skip if already exists)
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'password_resets_customerId_fkey') THEN
    ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_password_resets_userId_fkey') THEN
    ALTER TABLE "admin_password_resets" ADD CONSTRAINT "admin_password_resets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_images_productId_fkey') THEN
    ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bulk_pricing_tiers_productId_fkey') THEN
    ALTER TABLE "bulk_pricing_tiers" ADD CONSTRAINT "bulk_pricing_tiers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_productId_fkey') THEN
    ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_customerId_fkey') THEN
    ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_variantId_fkey') THEN
    ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_status_history_orderId_fkey') THEN
    ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_status_history_changedById_fkey') THEN
    ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'saved_addresses_customerId_fkey') THEN
    ALTER TABLE "saved_addresses" ADD CONSTRAINT "saved_addresses_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wishlist_items_customerId_fkey') THEN
    ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wishlist_items_productId_fkey') THEN
    ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
