const prisma = require('../utils/prismaClient');
const { invalidateProducts } = require('../utils/cache');

// GET /api/products/:productId/variants
const getVariantsByProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const parsedProductId = parseInt(productId, 10);

        if (isNaN(parsedProductId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format',
            });
        }

        const variants = await prisma.productVariant.findMany({
            where: {
                productId: parsedProductId,
                isDeleted: false,
            },
            orderBy: {
                name: 'asc',
            },
        });

        res.json({
            success: true,
            data: variants,
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/admin/products/:productId/variants
const createVariant = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const parsedProductId = parseInt(productId, 10);

        if (isNaN(parsedProductId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format',
            });
        }

        // Check if product exists and has variants enabled
        const product = await prisma.product.findUnique({
            where: { id: parsedProductId },
        });

        if (!product || product.isDeleted) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        if (!product.hasVariants) {
            return res.status(400).json({
                success: false,
                message: 'Product does not have variants enabled. Update the product first.',
            });
        }

        const { name, sku, price, stockQuantity, attributes, isAvailable } = req.body;

        if (!name || price === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Name and price are required',
            });
        }

        // Safely handle attributes JSON
        let attributesJson = null;
        if (attributes) {
            try {
                attributesJson = typeof attributes === 'string'
                    ? attributes
                    : JSON.stringify(attributes);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid attributes format',
                });
            }
        }

        const variant = await prisma.productVariant.create({
            data: {
                productId: parsedProductId,
                name,
                sku: sku || null,
                price: parseFloat(price),
                stockQuantity: parseInt(stockQuantity, 10) || 0,
                attributes: attributesJson,
                isAvailable: isAvailable !== undefined ? (isAvailable === 'true' || isAvailable === true) : true,
            },
        });

        // Invalidate product cache
        invalidateProducts();

        res.status(201).json({
            success: true,
            message: 'Variant created successfully',
            data: variant,
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                message: 'SKU already exists',
            });
        }
        next(error);
    }
};

// PATCH /api/admin/variants/:id
const updateVariant = async (req, res, next) => {
    try {
        const { id } = req.params;
        const parsedId = parseInt(id, 10);

        if (isNaN(parsedId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid variant ID format',
            });
        }

        // Check if variant exists
        const existingVariant = await prisma.productVariant.findUnique({
            where: { id: parsedId },
        });

        if (!existingVariant || existingVariant.isDeleted) {
            return res.status(404).json({
                success: false,
                message: 'Variant not found',
            });
        }

        const { name, sku, price, stockQuantity, attributes, isAvailable } = req.body;

        const updateData = {};

        if (name) updateData.name = name;
        if (sku !== undefined) updateData.sku = sku || null;
        if (price !== undefined) updateData.price = parseFloat(price);
        if (stockQuantity !== undefined) updateData.stockQuantity = parseInt(stockQuantity, 10);
        if (attributes !== undefined) updateData.attributes = attributes ? JSON.stringify(attributes) : null;
        if (isAvailable !== undefined) updateData.isAvailable = isAvailable === 'true' || isAvailable === true;

        const variant = await prisma.productVariant.update({
            where: { id: parsedId },
            data: updateData,
        });

        // Invalidate product cache
        invalidateProducts();

        res.json({
            success: true,
            message: 'Variant updated successfully',
            data: variant,
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                message: 'SKU already exists',
            });
        }
        next(error);
    }
};

// DELETE /api/admin/variants/:id (soft delete)
const deleteVariant = async (req, res, next) => {
    try {
        const { id } = req.params;
        const parsedId = parseInt(id, 10);

        if (isNaN(parsedId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid variant ID format',
            });
        }

        // Check if variant exists
        const existingVariant = await prisma.productVariant.findUnique({
            where: { id: parsedId },
        });

        if (!existingVariant || existingVariant.isDeleted) {
            return res.status(404).json({
                success: false,
                message: 'Variant not found',
            });
        }

        // Soft delete
        await prisma.productVariant.update({
            where: { id: parsedId },
            data: { isDeleted: true, isAvailable: false },
        });

        // Invalidate product cache
        invalidateProducts();

        res.json({
            success: true,
            message: 'Variant deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/admin/variants/:id/stock
const updateVariantStock = async (req, res, next) => {
    try {
        const { id } = req.params;
        const parsedId = parseInt(id, 10);

        if (isNaN(parsedId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid variant ID format',
            });
        }

        const { stockQuantity } = req.body;

        if (stockQuantity === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Stock quantity is required',
            });
        }

        // Check if variant exists
        const existingVariant = await prisma.productVariant.findUnique({
            where: { id: parsedId },
        });

        if (!existingVariant || existingVariant.isDeleted) {
            return res.status(404).json({
                success: false,
                message: 'Variant not found',
            });
        }

        const variant = await prisma.productVariant.update({
            where: { id: parsedId },
            data: { stockQuantity: parseInt(stockQuantity, 10) },
        });

        // Invalidate product cache
        invalidateProducts();

        res.json({
            success: true,
            message: 'Variant stock updated successfully',
            data: variant,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getVariantsByProduct,
    createVariant,
    updateVariant,
    deleteVariant,
    updateVariantStock,
};
