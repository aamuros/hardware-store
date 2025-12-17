const prisma = require('../utils/prismaClient');

// GET /api/customers/wishlist
const getWishlist = async (req, res, next) => {
    try {
        const wishlistItems = await prisma.wishlistItem.findMany({
            where: {
                customerId: req.customer.id,
                // Filter out deleted products at database level
                product: {
                    isDeleted: false,
                },
            },
            orderBy: { addedAt: 'desc' },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        price: true,
                        unit: true,
                        imageUrl: true,
                        isAvailable: true,
                        stockQuantity: true,
                        category: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        res.json({
            success: true,
            data: wishlistItems,
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/customers/wishlist
const addToWishlist = async (req, res, next) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required',
            });
        }

        // Check if product exists and is not deleted
        const product = await prisma.product.findFirst({
            where: {
                id: parseInt(productId, 10),
                isDeleted: false,
            },
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Check if already in wishlist
        const existing = await prisma.wishlistItem.findUnique({
            where: {
                customerId_productId: {
                    customerId: req.customer.id,
                    productId: parseInt(productId, 10),
                },
            },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Product already in wishlist',
            });
        }

        const wishlistItem = await prisma.wishlistItem.create({
            data: {
                customerId: req.customer.id,
                productId: parseInt(productId, 10),
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        imageUrl: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: 'Added to wishlist',
            data: wishlistItem,
        });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/customers/wishlist/:productId
const removeFromWishlist = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const existing = await prisma.wishlistItem.findUnique({
            where: {
                customerId_productId: {
                    customerId: req.customer.id,
                    productId: parseInt(productId, 10),
                },
            },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Product not in wishlist',
            });
        }

        await prisma.wishlistItem.delete({
            where: {
                customerId_productId: {
                    customerId: req.customer.id,
                    productId: parseInt(productId, 10),
                },
            },
        });

        res.json({
            success: true,
            message: 'Removed from wishlist',
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/customers/wishlist/check/:productId
const checkWishlist = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const existing = await prisma.wishlistItem.findUnique({
            where: {
                customerId_productId: {
                    customerId: req.customer.id,
                    productId: parseInt(productId, 10),
                },
            },
        });

        res.json({
            success: true,
            data: {
                inWishlist: !!existing,
            },
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/customers/wishlist/ids - Get all product IDs in wishlist (for bulk checking)
const getWishlistIds = async (req, res, next) => {
    try {
        const wishlistItems = await prisma.wishlistItem.findMany({
            where: { customerId: req.customer.id },
            select: { productId: true },
        });

        res.json({
            success: true,
            data: wishlistItems.map(item => item.productId),
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    checkWishlist,
    getWishlistIds,
};
