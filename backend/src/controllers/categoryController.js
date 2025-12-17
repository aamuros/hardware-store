const prisma = require('../utils/prismaClient');
const { getOrSet, CACHE_KEYS, CACHE_TTL, invalidateCategories } = require('../utils/cache');

// GET /api/categories
const getAllCategories = async (req, res, next) => {
  try {
    const categories = await getOrSet(
      CACHE_KEYS.ALL_CATEGORIES,
      async () => {
        return prisma.category.findMany({
          where: { isDeleted: false },
          include: {
            _count: {
              select: {
                products: {
                  where: { isDeleted: false }
                },
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        });
      },
      CACHE_TTL.CATEGORIES
    );

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/:id
const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format',
      });
    }

    const category = await getOrSet(
      CACHE_KEYS.CATEGORY(parsedId),
      async () => {
        return prisma.category.findUnique({
          where: { id: parsedId, isDeleted: false },
          include: {
            products: {
              where: { isAvailable: true, isDeleted: false },
              orderBy: { name: 'asc' },
            },
          },
        });
      },
      CACHE_TTL.CATEGORIES
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/categories
const createCategory = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
        description,
        icon,
      },
    });

    // Invalidate category cache
    invalidateCategories();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;

    const category = await prisma.category.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
    });

    // Invalidate category cache
    invalidateCategories();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/categories/:id (soft delete)
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category has active products
    const productsCount = await prisma.product.count({
      where: { categoryId: parseInt(id, 10), isDeleted: false },
    });

    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${productsCount} active products. Please move or delete them first.`,
      });
    }

    // Soft delete
    await prisma.category.update({
      where: { id: parseInt(id, 10) },
      data: { isDeleted: true },
    });

    // Invalidate category cache
    invalidateCategories();

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
