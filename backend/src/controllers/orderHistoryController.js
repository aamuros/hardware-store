const prisma = require('../utils/prismaClient');

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

module.exports = {
    getOrderHistory,
    getOrderDetail,
};
