const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const smsService = require('../services/smsService');
const { generateOrderNumber } = require('../utils/helpers');
const { logOrderStatus } = require('../utils/logger');

// Order statuses
const ORDER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
};

// POST /api/orders
const createOrder = async (req, res, next) => {
  try {
    const { customerName, phone, address, barangay, landmarks, notes, items } = req.body;
    
    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must have at least one item',
      });
    }
    
    // Get product details and calculate totals
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    
    // Validate all products exist and are available
    const productMap = new Map(products.map(p => [p.id, p]));
    
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product with ID ${item.productId} not found`,
        });
      }
      if (!product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is currently unavailable`,
        });
      }
    }
    
    // Calculate order items with prices
    const orderItems = items.map(item => {
      const product = productMap.get(item.productId);
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: product.price * item.quantity,
      };
    });
    
    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    
    // Generate order number
    const orderNumber = generateOrderNumber();
    
    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName,
        phone,
        address,
        barangay,
        landmarks,
        notes,
        totalAmount,
        status: ORDER_STATUS.PENDING,
        items: {
          create: orderItems,
        },
        // Create initial status history entry
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: ORDER_STATUS.PENDING,
            notes: 'Order placed by customer',
          },
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    
    // Send SMS notification to customer
    try {
      await smsService.sendOrderConfirmation(phone, orderNumber, totalAmount);
    } catch (smsError) {
      console.error('SMS sending failed:', smsError);
      // Don't fail the order creation if SMS fails
    }
    
    // Send notification to admin
    try {
      await smsService.notifyAdminNewOrder(orderNumber, totalAmount);
    } catch (smsError) {
      console.error('Admin SMS notification failed:', smsError);
    }
    
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        items: order.items,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/:id
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);
    
    if (isNaN(parsedId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }
    
    const order = await prisma.order.findUnique({
      where: { id: parsedId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                unit: true,
                imageUrl: true,
              },
            },
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

// GET /api/orders/track/:orderNumber
const trackOrder = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        orderNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        updatedAt: true,
        items: {
          include: {
            product: {
              select: {
                name: true,
                unit: true,
              },
            },
          },
        },
      },
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found. Please check your order number.',
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

// GET /api/admin/orders
const getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, startDate, endDate, search } = req.query;
    
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerName: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  unit: true,
                },
              },
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.order.count({ where }),
    ]);
    
    res.json({
      success: true,
      data: orders,
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

// GET /api/admin/orders/:id
const getOrderDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        smsLogs: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: {
              select: { id: true, username: true },
            },
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

// PATCH /api/admin/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body;
    
    // Validate status
    if (!Object.values(ORDER_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
        validStatuses: Object.values(ORDER_STATUS),
      });
    }
    
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    
    const previousStatus = order.status;
    
    // Update order status and create history entry in a transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update the order
      const updated = await tx.order.update({
        where: { id: parseInt(id) },
        data: { status },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
      
      // Create status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId: parseInt(id),
          fromStatus: previousStatus,
          toStatus: status,
          changedById: req.user?.id || null,
          notes: message || null,
        },
      });
      
      return updated;
    });
    
    // Log the status change
    logOrderStatus(order.orderNumber, previousStatus, status, req.user?.id);
    
    // Send SMS notification based on status change
    try {
      await smsService.sendStatusUpdate(order.phone, order.orderNumber, status, message);
    } catch (smsError) {
      console.error('SMS sending failed:', smsError);
    }
    
    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrderById,
  trackOrder,
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  ORDER_STATUS,
};
