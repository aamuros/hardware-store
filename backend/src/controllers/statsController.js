const prisma = require('../utils/prismaClient');

// GET /api/stats - Public stats for the homepage
const getPublicStats = async (req, res, next) => {
  try {
    const [
      totalProducts,
      deliveredOrders,
      totalCustomers,
    ] = await Promise.all([
      // Count available (non-deleted) products
      prisma.product.count({
        where: { isDeleted: false, isAvailable: true },
      }),
      // Count delivered/completed orders
      prisma.order.count({
        where: { status: { in: ['delivered', 'completed'] } },
      }),
      // Count unique customers (registered + unique guest phone numbers)
      prisma.$queryRaw`
        SELECT (
          (SELECT COUNT(*) FROM customers WHERE "isActive" = true)
          +
          (SELECT COUNT(DISTINCT phone) FROM orders WHERE "customerId" IS NULL)
        ) AS total
      `,
    ]);

    const uniqueCustomers = Number(totalCustomers[0]?.total || 0);

    res.json({
      success: true,
      data: {
        totalProducts,
        deliveredOrders,
        totalCustomers: uniqueCustomers,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicStats,
};
