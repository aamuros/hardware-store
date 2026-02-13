const prisma = require('../utils/prismaClient');
const { getOrSet, CACHE_KEYS, CACHE_TTL, invalidateProducts } = require('../utils/cache');

// Helper function to safely parse integers with validation
const safeParseInt = (value, defaultValue, min = 1, max = Infinity) => {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return defaultValue;
  return Math.min(Math.max(parsed, min), max);
};

// GET /api/products
const getAllProducts = async (req, res, next) => {
  try {
    const { category, available, page = 1, limit = 20 } = req.query;

    const where = { isDeleted: false };

    if (category) {
      const categoryId = safeParseInt(category, null);
      if (categoryId === null) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID format',
        });
      }
      where.categoryId = categoryId;
    }

    if (available !== undefined) {
      where.isAvailable = available === 'true';
    }

    const parsedPage = safeParseInt(page, 1, 1);
    const parsedLimit = safeParseInt(limit, 20, 1, 100); // Cap at 100 to prevent abuse
    const skip = (parsedPage - 1) * parsedLimit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take: parsedLimit,
        orderBy: {
          name: 'asc',
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/search
const searchProducts = async (req, res, next) => {
  try {
    const { q, category, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
    }

    const parsedPage = safeParseInt(page, 1, 1);
    const parsedLimit = safeParseInt(limit, 20, 1, 100);
    const skip = (parsedPage - 1) * parsedLimit;
    const searchTerm = q.trim();

    // Note: SQLite's LIKE is case-insensitive by default for ASCII characters
    // PostgreSQL would need mode: 'insensitive', but that's not supported in SQLite
    const searchWhere = {
      OR: [
        { name: { contains: searchTerm } },
        { description: { contains: searchTerm } },
        { sku: { contains: searchTerm } },
      ],
      isAvailable: true,
      isDeleted: false,
    };

    // Filter by category if provided
    if (category) {
      const categoryId = safeParseInt(category, null);
      if (categoryId !== null) {
        searchWhere.categoryId = categoryId;
      }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: searchWhere,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take: parsedLimit,
      }),
      prisma.product.count({ where: searchWhere }),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const product = await getOrSet(
      CACHE_KEYS.PRODUCT(parsedId),
      async () => {
        return prisma.product.findUnique({
          where: { id: parsedId, isDeleted: false },
          include: {
            category: true,
            variants: {
              where: { isDeleted: false },
              orderBy: { name: 'asc' },
            },
            images: {
              orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
            },
            bulkPricingTiers: {
              orderBy: { minQuantity: 'asc' },
            },
          },
        });
      },
      CACHE_TTL.PRODUCT_DETAIL
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/category/:categoryId
const getProductsByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          categoryId: parseInt(categoryId, 10),
          isAvailable: true,
          isDeleted: false,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take: parseInt(limit, 10),
        orderBy: {
          name: 'asc',
        },
      }),
      prisma.product.count({
        where: {
          categoryId: parseInt(categoryId, 10),
          isAvailable: true,
          isDeleted: false,
        },
      }),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/products
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, unit, categoryId, sku, stockQuantity, lowStockThreshold } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        unit,
        categoryId: parseInt(categoryId, 10),
        sku,
        imageUrl,
        stockQuantity: parseInt(stockQuantity, 10) || 0,
        lowStockThreshold: parseInt(lowStockThreshold, 10) || 10,
        isAvailable: true,
      },
      include: {
        category: true,
      },
    });

    // Invalidate product cache
    invalidateProducts();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: parsedId },
    });

    if (!existingProduct || existingProduct.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const { name, description, price, unit, categoryId, sku, isAvailable, stockQuantity, lowStockThreshold, hasVariants } = req.body;

    const updateData = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (unit) updateData.unit = unit;
    if (categoryId) updateData.categoryId = parseInt(categoryId, 10);
    if (sku !== undefined) updateData.sku = sku;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable === 'true' || isAvailable === true;
    if (stockQuantity !== undefined) updateData.stockQuantity = parseInt(stockQuantity, 10);
    if (lowStockThreshold !== undefined) updateData.lowStockThreshold = parseInt(lowStockThreshold, 10);
    if (hasVariants !== undefined) updateData.hasVariants = hasVariants === 'true' || hasVariants === true;
    if (req.file) updateData.imageUrl = `/uploads/${req.file.filename}`;

    const product = await prisma.product.update({
      where: { id: parsedId },
      data: updateData,
      include: {
        category: true,
      },
    });

    // Invalidate product cache
    invalidateProducts();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/products/:id (soft delete)
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: parsedId },
    });

    if (!existingProduct || existingProduct.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Soft delete
    await prisma.product.update({
      where: { id: parsedId },
      data: { isDeleted: true, isAvailable: false },
    });

    // Invalidate product cache
    invalidateProducts();

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/products/:id/availability
const toggleAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const { isAvailable } = req.body;

    const product = await prisma.product.update({
      where: { id: parsedId },
      data: { isAvailable },
    });

    // Invalidate product cache
    invalidateProducts();

    res.json({
      success: true,
      message: `Product marked as ${isAvailable ? 'available' : 'unavailable'}`,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/products/:id/stock
const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    const { stockQuantity, lowStockThreshold } = req.body;

    const updateData = {};
    if (stockQuantity !== undefined) {
      updateData.stockQuantity = parseInt(stockQuantity, 10);
    }
    if (lowStockThreshold !== undefined) {
      updateData.lowStockThreshold = parseInt(lowStockThreshold, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No stock data provided',
      });
    }

    const product = await prisma.product.update({
      where: { id: parsedId },
      data: updateData,
    });

    // Invalidate product cache
    invalidateProducts();

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/inventory/low-stock
const getLowStockProducts = async (req, res, next) => {
  try {
    // Use Prisma query API for database portability (works with both SQLite and PostgreSQL)
    const allAvailableProducts = await prisma.product.findMany({
      where: {
        isDeleted: false,
        isAvailable: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        stockQuantity: 'asc',
      },
    });

    // Filter products where stockQuantity <= lowStockThreshold
    const lowStockProducts = allAvailableProducts.filter(
      p => p.stockQuantity <= p.lowStockThreshold
    );

    res.json({
      success: true,
      data: lowStockProducts,
      count: lowStockProducts.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  searchProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleAvailability,
  updateStock,
  getLowStockProducts,
};
