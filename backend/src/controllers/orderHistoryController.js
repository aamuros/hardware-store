const prisma = require('../utils/prismaClient');
const { invalidateProducts } = require('../utils/cache');

// GET /api/customers/orders
const getOrderHistory = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: { customerId: req.customer.id },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit, 10),
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    totalAmount: true,
                    createdAt: true,
                    _count: {
                        select: { items: true },
                    },
                },
            }),
            prisma.order.count({
                where: { customerId: req.customer.id },
            }),
        ]);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    page: parseInt(page, 10),
                    limit: parseInt(limit, 10),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit, 10)),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/customers/orders/:orderNumber
const getOrderDetail = async (req, res, next) => {
    try {
        const { orderNumber } = req.params;

        const order = await prisma.order.findFirst({
            where: {
                orderNumber,
                customerId: req.customer.id,
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                imageUrl: true,
                                unit: true,
                            },
                        },
                    },
                },
                statusHistory: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                        fromStatus: true,
                        toStatus: true,
                        notes: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        res.json({
            success: true,
            data: order,
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/customers/orders/:orderNumber/cancel
const cancelOrder = async (req, res, next) => {
    try {
        const { orderNumber } = req.params;

        const order = await prisma.order.findFirst({
            where: {
                orderNumber,
                customerId: req.customer.id,
            },
            include: {
                items: true,
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Only allow cancellation of pending orders
        if (order.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending orders can be cancelled',
            });
        }

        // Cancel the order and restore stock in a transaction
        const updatedOrder = await prisma.$transaction(async (tx) => {
            // Restore stock for each item
            for (const item of order.items) {
                if (item.variantId) {
                    const variant = await tx.productVariant.findUnique({
                        where: { id: item.variantId },
                        select: { isDeleted: true },
                    });
                    if (variant && !variant.isDeleted) {
                        await tx.productVariant.update({
                            where: { id: item.variantId },
                            data: {
                                stockQuantity: { increment: item.quantity },
                            },
                        });
                    }
                } else {
                    const product = await tx.product.findUnique({
                        where: { id: item.productId },
                        select: { isDeleted: true },
                    });
                    if (product && !product.isDeleted) {
                        await tx.product.update({
                            where: { id: item.productId },
                            data: {
                                stockQuantity: { increment: item.quantity },
                            },
                        });
                    }
                }
            }

            // Update order status
            const updated = await tx.order.update({
                where: { id: order.id },
                data: { status: 'cancelled' },
            });

            // Create status history entry
            await tx.orderStatusHistory.create({
                data: {
                    orderId: order.id,
                    fromStatus: order.status,
                    toStatus: 'cancelled',
                    changedById: null,
                    notes: 'Cancelled by customer',
                },
            });

            return updated;
        });

        // Invalidate product cache so storefront reflects restored stock immediately
        invalidateProducts();

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: updatedOrder,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getOrderHistory,
    getOrderDetail,
    cancelOrder,
};
