const prisma = require('../utils/prismaClient');
const { invalidateProducts } = require('../utils/cache');

// GET /api/products/:productId/bulk-pricing
const getBulkPricingTiers = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const parsedProductId = parseInt(productId, 10);

        if (isNaN(parsedProductId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format',
            });
        }

        const tiers = await prisma.bulkPricingTier.findMany({
            where: { productId: parsedProductId },
            orderBy: { minQuantity: 'asc' },
        });

        res.json({
            success: true,
            data: tiers,
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/admin/products/:productId/bulk-pricing
const createBulkPricingTier = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const parsedProductId = parseInt(productId, 10);

        if (isNaN(parsedProductId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format',
            });
        }

        const { minQuantity, discountType, discountValue } = req.body;

        if (!minQuantity || !discountType || discountValue === undefined) {
            return res.status(400).json({
                success: false,
                message: 'minQuantity, discountType, and discountValue are required',
            });
        }

        if (!['percentage', 'fixed'].includes(discountType)) {
            return res.status(400).json({
                success: false,
                message: 'discountType must be "percentage" or "fixed"',
            });
        }

        if (discountValue < 0) {
            return res.status(400).json({
                success: false,
                message: 'discountValue must be a positive number',
            });
        }

        if (discountType === 'percentage' && discountValue > 100) {
            return res.status(400).json({
                success: false,
                message: 'Percentage discount cannot exceed 100%',
            });
        }

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id: parsedProductId },
        });

        if (!product || product.isDeleted) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        const tier = await prisma.bulkPricingTier.create({
            data: {
                productId: parsedProductId,
                minQuantity: parseInt(minQuantity, 10),
                discountType,
                discountValue: parseFloat(discountValue),
            },
        });

        // Enable hasBulkPricing on product if not already
        if (!product.hasBulkPricing) {
            await prisma.product.update({
                where: { id: parsedProductId },
                data: { hasBulkPricing: true },
            });
        }

        invalidateProducts();

        res.status(201).json({
            success: true,
            message: 'Bulk pricing tier created successfully',
            data: tier,
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/admin/bulk-pricing/:id
const updateBulkPricingTier = async (req, res, next) => {
    try {
        const { id } = req.params;
        const parsedId = parseInt(id, 10);

        if (isNaN(parsedId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid tier ID format',
            });
        }

        const existingTier = await prisma.bulkPricingTier.findUnique({
            where: { id: parsedId },
        });

        if (!existingTier) {
            return res.status(404).json({
                success: false,
                message: 'Tier not found',
            });
        }

        const { minQuantity, discountType, discountValue } = req.body;

        const updateData = {};
        if (minQuantity) updateData.minQuantity = parseInt(minQuantity, 10);
        if (discountType) {
            if (!['percentage', 'fixed'].includes(discountType)) {
                return res.status(400).json({
                    success: false,
                    message: 'discountType must be "percentage" or "fixed"',
                });
            }
            updateData.discountType = discountType;
        }
        if (discountValue !== undefined) updateData.discountValue = parseFloat(discountValue);

        const tier = await prisma.bulkPricingTier.update({
            where: { id: parsedId },
            data: updateData,
        });

        invalidateProducts();

        res.json({
            success: true,
            message: 'Bulk pricing tier updated successfully',
            data: tier,
        });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/admin/bulk-pricing/:id
const deleteBulkPricingTier = async (req, res, next) => {
    try {
        const { id } = req.params;
        const parsedId = parseInt(id, 10);

        if (isNaN(parsedId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid tier ID format',
            });
        }

        const tier = await prisma.bulkPricingTier.findUnique({
            where: { id: parsedId },
        });

        if (!tier) {
            return res.status(404).json({
                success: false,
                message: 'Tier not found',
            });
        }

        await prisma.bulkPricingTier.delete({
            where: { id: parsedId },
        });

        // Check if there are any tiers left
        const remainingTiers = await prisma.bulkPricingTier.count({
            where: { productId: tier.productId },
        });

        // If no tiers left, disable hasBulkPricing
        if (remainingTiers === 0) {
            await prisma.product.update({
                where: { id: tier.productId },
                data: { hasBulkPricing: false },
            });
        }

        invalidateProducts();

        res.json({
            success: true,
            message: 'Bulk pricing tier deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/products/:productId/calculate-price?quantity=X
const calculateBulkPrice = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.query;
        const parsedProductId = parseInt(productId, 10);
        const parsedQuantity = parseInt(quantity, 10);

        if (isNaN(parsedProductId) || isNaN(parsedQuantity)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID or quantity',
            });
        }

        const product = await prisma.product.findUnique({
            where: { id: parsedProductId },
            include: {
                bulkPricingTiers: {
                    orderBy: { minQuantity: 'desc' },
                },
            },
        });

        if (!product || product.isDeleted) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Find applicable tier (highest minQuantity that's <= requested quantity)
        const applicableTier = product.bulkPricingTiers.find(
            tier => parsedQuantity >= tier.minQuantity
        );

        let unitPrice = product.price;
        let discount = 0;
        let discountedUnitPrice = product.price;

        if (applicableTier) {
            if (applicableTier.discountType === 'percentage') {
                discount = (product.price * applicableTier.discountValue) / 100;
                discountedUnitPrice = product.price - discount;
            } else {
                discount = applicableTier.discountValue;
                discountedUnitPrice = product.price - discount;
            }
        }

        const totalOriginal = unitPrice * parsedQuantity;
        const totalDiscounted = discountedUnitPrice * parsedQuantity;
        const totalSavings = totalOriginal - totalDiscounted;

        res.json({
            success: true,
            data: {
                quantity: parsedQuantity,
                originalUnitPrice: unitPrice,
                discountedUnitPrice: Math.max(0, discountedUnitPrice),
                totalOriginal,
                totalDiscounted: Math.max(0, totalDiscounted),
                totalSavings: Math.max(0, totalSavings),
                appliedTier: applicableTier || null,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getBulkPricingTiers,
    createBulkPricingTier,
    updateBulkPricingTier,
    deleteBulkPricingTier,
    calculateBulkPrice,
};
