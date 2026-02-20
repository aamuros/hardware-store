const prisma = require('../utils/prismaClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { validatePasswordStrength } = require('../middleware/sanitizer');

// POST /api/admin/login
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'This account has been deactivated. Please contact an administrator.',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Send login response immediately so transient DB errors
    // on the lastLogin update don't block the user
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
        },
      },
    });

    // Update last login (fire-and-forget – must not prevent login)
    prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    }).catch(err => {
      console.error('Failed to update lastLogin for user', user.id, err);
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrders,
      pendingOrders,
      totalProducts,
      todayRevenue,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.order.count({
        where: { status: 'pending' },
      }),
      prisma.product.count(),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: today },
          status: { in: ['delivered', 'completed'] },
        },
        _sum: { totalAmount: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          phone: true,
          totalAmount: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalOrders,
          todayOrders,
          pendingOrders,
          totalProducts,
          todayRevenue: todayRevenue._sum.totalAmount || 0,
        },
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/reports/sales
const getSalesReport = async (req, res, next) => {
  try {
    const { days, startDate, endDate } = req.query;

    // Build date range: support both `days` (from frontend) and startDate/endDate
    let start, end;
    end = new Date();
    end.setHours(23, 59, 59, 999);

    if (days) {
      start = new Date();
      start.setDate(start.getDate() - (parseInt(days, 10) - 1));
      start.setHours(0, 0, 0, 0);
    } else if (startDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      }
    } else {
      start = new Date();
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    }

    const dateFilter = {
      createdAt: { gte: start, lte: end },
    };

    // --- All orders in range (any status) ---
    const allOrdersInRange = await prisma.order.findMany({
      where: dateFilter,
      select: { id: true, totalAmount: true, createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    const totalOrders = allOrdersInRange.length;
    const totalRevenue = allOrdersInRange.reduce((sum, o) => sum + o.totalAmount, 0);

    // --- Status-specific counts ---
    const completedStatuses = ['delivered', 'completed'];
    const completedOrders = allOrdersInRange.filter(o => completedStatuses.includes(o.status)).length;
    const cancelledOrders = allOrdersInRange.filter(o => o.status === 'cancelled').length;
    const completedRevenue = allOrdersInRange
      .filter(o => completedStatuses.includes(o.status))
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingRevenue = allOrdersInRange
      .filter(o => o.status === 'pending')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const averageOrderValue = totalOrders > 0
      ? Math.round((totalRevenue / totalOrders) * 100) / 100
      : 0;

    // --- Orders by status ---
    const statusCounts = {};
    allOrdersInRange.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      _count: count,
    }));

    // --- Daily breakdown for charts ---
    // Use local date formatting to avoid UTC timezone shift
    const toLocalDateKey = (d) => {
      const dt = new Date(d);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    };

    const dailyBreakdown = {};
    const daysInRange = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    for (let i = 0; i < daysInRange; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateKey = toLocalDateKey(date);
      dailyBreakdown[dateKey] = { revenue: 0, completedRevenue: 0, orders: 0, completedOrders: 0 };
    }

    allOrdersInRange.forEach(order => {
      const dateKey = toLocalDateKey(order.createdAt);
      if (dailyBreakdown[dateKey]) {
        dailyBreakdown[dateKey].revenue += order.totalAmount;
        dailyBreakdown[dateKey].orders += 1;
        if (completedStatuses.includes(order.status)) {
          dailyBreakdown[dateKey].completedRevenue += order.totalAmount;
          dailyBreakdown[dateKey].completedOrders += 1;
        }
      }
    });

    const dailyData = Object.entries(dailyBreakdown).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      completedRevenue: Math.round(data.completedRevenue * 100) / 100,
      orders: data.orders,
      completedOrders: data.completedOrders,
    }));

    // --- Growth comparison with previous period ---
    const periodLength = daysInRange;
    const previousStart = new Date(start);
    previousStart.setDate(previousStart.getDate() - periodLength);
    const previousEnd = new Date(start);
    previousEnd.setMilliseconds(-1);

    const previousOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: previousStart, lte: previousEnd },
      },
      select: { totalAmount: true },
    });

    const previousTotal = previousOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const previousCount = previousOrders.length;
    const revenueGrowth = previousTotal > 0
      ? parseFloat(((totalRevenue - previousTotal) / previousTotal * 100).toFixed(1))
      : totalRevenue > 0 ? 100 : 0;
    const orderGrowth = previousCount > 0
      ? parseFloat(((totalOrders - previousCount) / previousCount * 100).toFixed(1))
      : totalOrders > 0 ? 100 : 0;

    res.json({
      success: true,
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        completedOrders,
        cancelledOrders,
        averageOrderValue,
        completedRevenue: Math.round(completedRevenue * 100) / 100,
        pendingRevenue: Math.round(pendingRevenue * 100) / 100,
        ordersByStatus,
        // Keep legacy fields for existing tests
        totalSales: Math.round(totalRevenue * 100) / 100,
        orderCount: totalOrders,
        // Period & growth
        period: { start: start.toISOString(), end: end.toISOString(), days: periodLength },
        growth: {
          revenue: revenueGrowth,
          orders: orderGrowth,
          previousPeriodRevenue: previousTotal,
          previousPeriodOrders: previousCount,
        },
        dailyData,
      },
    });
  } catch (error) {
    next(error);
  }
};


// GET /api/admin/reports/products
const getProductReport = async (req, res, next) => {
  try {
    const { days } = req.query;
    let dateFilter = {};
    if (days) {
      const start = new Date();
      start.setDate(start.getDate() - (parseInt(days, 10) - 1));
      start.setHours(0, 0, 0, 0);
      dateFilter = {
        order: { createdAt: { gte: start } },
      };
    }

    // --- Top products ---
    const topProductsRaw = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: dateFilter,
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: 10,
    });

    const productIds = topProductsRaw.map(p => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, price: true, imageUrl: true, category: { select: { name: true } } },
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    const topProducts = topProductsRaw.map(item => {
      const prod = productMap.get(item.productId) || {};
      return {
        id: item.productId,
        name: prod.name || 'Unknown',
        sku: prod.sku || null,
        imageUrl: prod.imageUrl || null,
        category: prod.category || null,
        totalSold: item._sum.quantity || 0,
        totalRevenue: item._sum.subtotal || 0,
      };
    });

    // --- Category stats ---
    const categories = await prisma.category.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        icon: true,
        products: {
          where: { isDeleted: false },
          select: { id: true },
        },
      },
    });

    // Get items for each category (aggregated via product-category join)
    const allItems = await prisma.orderItem.findMany({
      where: dateFilter,
      select: {
        quantity: true,
        subtotal: true,
        product: { select: { categoryId: true } },
      },
    });

    const categoryAgg = {};
    allItems.forEach(item => {
      const catId = item.product.categoryId;
      if (!categoryAgg[catId]) categoryAgg[catId] = { totalSold: 0, totalRevenue: 0 };
      categoryAgg[catId].totalSold += item.quantity;
      categoryAgg[catId].totalRevenue += item.subtotal;
    });

    const categoryStats = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      productCount: cat.products.length,
      totalSold: categoryAgg[cat.id]?.totalSold || 0,
      totalRevenue: categoryAgg[cat.id]?.totalRevenue || 0,
    }));

    res.json({
      success: true,
      data: { topProducts, categoryStats },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/reports/export
const exportReport = async (req, res, next) => {
  try {
    const { days } = req.query;
    let start = new Date();
    start.setDate(start.getDate() - (parseInt(days || '30', 10) - 1));
    start.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: start } },
      include: {
        items: {
          include: { product: { select: { name: true, sku: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build CSV
    const header = 'Order Number,Date,Customer,Phone,Status,Items,Total Amount\n';
    const rows = orders.map(o => {
      const date = new Date(o.createdAt).toISOString().split('T')[0];
      const items = o.items.map(i => `${i.product.name} x${i.quantity}`).join('; ');
      const customerName = (o.customerName || '').replace(/,/g, ' ');
      return `${o.orderNumber},${date},"${customerName}",${o.phone},${o.status},"${items}",${o.totalAmount.toFixed(2)}`;
    }).join('\n');

    const csv = header + rows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

// User management (admin only)
const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and name are required',
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors,
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: role || 'staff',
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, isActive, password } = req.body;

    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent removing the last admin
    if (targetUser.role === 'admin' && role && role !== 'admin') {
      const adminCount = await prisma.user.count({
        where: { role: 'admin', isActive: true },
      });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change role: this is the last active admin account',
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) {
      // Validate password strength before hashing
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Password does not meet requirements',
          errors: passwordValidation.errors,
        });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Don't allow deleting self
    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Protect the last admin account
    if (existingUser.role === 'admin') {
      const adminCount = await prisma.user.count({
        where: { role: 'admin', isActive: true },
      });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin account',
        });
      }
    }

    // Soft-delete all users by marking as inactive to preserve audit trail
    // and prevent foreign key constraint violations on order_status_history
    await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'New password does not meet requirements',
        errors: passwordValidation.errors,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getDashboard,
  getSalesReport,
  getProductReport,
  exportReport,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
};
