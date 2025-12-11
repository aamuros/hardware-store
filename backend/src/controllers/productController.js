const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getOrSet, CACHE_KEYS, CACHE_TTL, invalidateProducts } = require('../utils/cache');

// GET /api/products
const getAllProducts = async (req, res, next) => {
  try {
    const { category, available, page = 1, limit = 20 } = req.query;
    
    const where = { isDeleted: false };
    
    if (category) {
      where.categoryId = parseInt(category);
    }
    
    if (available !== undefined) {
      where.isAvailable = available === 'true';
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
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
        take: parseInt(limit),
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
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/search
const searchProducts = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
            { sku: { contains: q } },
          ],
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
        take: parseInt(limit),
      }),
      prisma.product.count({
        where: {
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
            { sku: { contains: q } },
          ],
          isAvailable: true,
          isDeleted: false,
        },
      }),
    ]);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
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
    const parsedId = parseInt(id);
    
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
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          categoryId: parseInt(categoryId),
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
        take: parseInt(limit),
        orderBy: {
          name: 'asc',
        },
      }),
      prisma.product.count({
        where: {
          categoryId: parseInt(categoryId),
          isAvailable: true,
          isDeleted: false,
        },
      }),
    ]);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/products
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, unit, categoryId, sku } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        unit,
        categoryId: parseInt(categoryId),
        sku,
        imageUrl,
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
    const parsedId = parseInt(id);
    
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
    
    const { name, description, price, unit, categoryId, sku, isAvailable } = req.body;
    
    const updateData = {};
    
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (unit) updateData.unit = unit;
    if (categoryId) updateData.categoryId = parseInt(categoryId);
    if (sku) updateData.sku = sku;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable === 'true' || isAvailable === true;
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
    const parsedId = parseInt(id);
    
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
    const parsedId = parseInt(id);
    
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

module.exports = {
  getAllProducts,
  searchProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleAvailability,
};
