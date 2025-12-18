const prisma = require('../utils/prismaClient');
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
    const { customerName, phone, address, barangay, landmarks, notes, items, savedAddressId } = req.body;

    // Get customer info if logged in (set by authenticateCustomer middleware)
    const customerId = req.customer?.id || null;

    // If savedAddressId is provided, fetch address from database
    let deliveryInfo = { customerName, phone, address, barangay, landmarks };

    if (savedAddressId && customerId) {
      const savedAddress = await prisma.savedAddress.findFirst({
        where: {
          id: parseInt(savedAddressId, 10),
          customerId: customerId,
        },
      });

      if (savedAddress) {
        deliveryInfo.address = savedAddress.address;
        deliveryInfo.barangay = savedAddress.barangay;
        deliveryInfo.landmarks = savedAddress.landmarks;
      }
    }

    // If logged in and customer name not provided, get from customer profile
    if (customerId && !deliveryInfo.customerName) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { name: true, phone: true },
      });
      if (customer) {
        deliveryInfo.customerName = customer.name;
        deliveryInfo.phone = deliveryInfo.phone || customer.phone;
      }
    }

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

    // Validate all products exist, are available, and have sufficient stock
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
      // Check stock availability (variant or product)
      if (item.variantId) {
        // Validate variant stock
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId },
        });
        if (!variant || variant.isDeleted) {
          return res.status(400).json({
            success: false,
            message: `Variant not found for product ${product.name}`,
          });
        }
        if (!variant.isAvailable) {
          return res.status(400).json({
            success: false,
            message: `${product.name} (${variant.name}) is currently unavailable`,
          });
        }
        if (variant.stockQuantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name} (${variant.name}). Available: ${variant.stockQuantity}, Requested: ${item.quantity}`,
            code: 'INSUFFICIENT_STOCK',
            productId: product.id,
            variantId: item.variantId,
            availableStock: variant.stockQuantity,
          });
        }
      } else if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`,
          code: 'INSUFFICIENT_STOCK',
          productId: product.id,
          availableStock: product.stockQuantity,
        });
      }
    }

    // Calculate order items with prices
    const orderItems = items.map(item => {
      const product = productMap.get(item.productId);
      // Use variant price if provided, otherwise product price
      const unitPrice = item.unitPrice || product.price;
      return {
        productId: item.productId,
        variantId: item.variantId || null,
        variantName: item.variantName || null,
        quantity: item.quantity,
        unitPrice: unitPrice,
        subtotal: unitPrice * item.quantity,
      };
    });

    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create order and deduct stock in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Deduct stock for each item (from variant or product)
      for (const item of items) {
        if (item.variantId) {
          // Deduct from variant stock
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });
        } else {
          // Deduct from product stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId, // Link to customer if logged in
          customerName: deliveryInfo.customerName,
          phone: deliveryInfo.phone,
          address: deliveryInfo.address,
          barangay: deliveryInfo.barangay,
          landmarks: deliveryInfo.landmarks,
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
              notes: customerId ? 'Order placed by registered customer' : 'Order placed by guest customer',
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

      return newOrder;
    });

    // Send SMS notification to customer
    try {
      await smsService.sendOrderConfirmation(phone, orderNumber, totalAmount, order.id);
    } catch (smsError) {
      console.error('SMS sending failed:', smsError.message);
      // Don't fail the order creation if SMS fails
    }

    // Send notification to admin
    try {
      await smsService.notifyAdminNewOrder(orderNumber, totalAmount, customerName);
    } catch (smsError) {
      console.error('Admin SMS notification failed:', smsError.message);
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
    const parsedId = parseInt(id, 10);

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

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

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
        take: parseInt(limit, 10),
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
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
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
      where: { id: parseInt(id, 10) },
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
      where: { id: parseInt(id, 10) },
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
      // Restore stock if order is being cancelled or rejected (and wasn't already)
      const isRestoreStock =
        (status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.REJECTED) &&
        previousStatus !== ORDER_STATUS.CANCELLED &&
        previousStatus !== ORDER_STATUS.REJECTED;

      if (isRestoreStock) {
        // Get order items to restore stock
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: parseInt(id, 10) },
        });

        // Restore stock for each item (to variant if applicable, otherwise to product)
        for (const item of orderItems) {
          if (item.variantId) {
            // Restore stock to variant
            const variant = await tx.productVariant.findUnique({
              where: { id: item.variantId },
              select: { isDeleted: true },
            });

            // Only restore stock if variant exists and isn't soft-deleted
            if (variant && !variant.isDeleted) {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: {
                  stockQuantity: {
                    increment: item.quantity,
                  },
                },
              });
            }
          } else {
            // Restore stock to product
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { isDeleted: true },
            });

            // Only restore stock if product exists and isn't soft-deleted
            if (product && !product.isDeleted) {
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  stockQuantity: {
                    increment: item.quantity,
                  },
                },
              });
            }
          }
        }
      }

      // Update the order
      const updated = await tx.order.update({
        where: { id: parseInt(id, 10) },
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
          orderId: parseInt(id, 10),
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
      await smsService.sendStatusUpdate(order.phone, order.orderNumber, status, message, order.id);
    } catch (smsError) {
      console.error('SMS sending failed:', smsError.message);
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
