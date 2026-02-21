const prisma = require('../utils/prismaClient');
const smsService = require('../services/smsService');
const { invalidateProducts } = require('../utils/cache');
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
      const parsedAddressId = parseInt(savedAddressId, 10);
      if (isNaN(parsedAddressId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid saved address ID format',
        });
      }
      const savedAddress = await prisma.savedAddress.findFirst({
        where: {
          id: parsedAddressId,
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

    // Validate required delivery information
    if (!deliveryInfo.customerName || !deliveryInfo.phone || !deliveryInfo.address || !deliveryInfo.barangay) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, phone, address, and barangay are required for delivery',
      });
    }

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must have at least one item',
      });
    }

    // Pre-validate product IDs exist (basic check outside transaction)
    const productIds = items.map(item => item.productId);
    const variantIds = items.filter(item => item.variantId).map(item => item.variantId);

    // Generate order number before transaction
    const orderNumber = generateOrderNumber();

    // Create order with atomic stock validation and deduction inside transaction
    // This prevents race conditions where two users could buy the last item
    const order = await prisma.$transaction(async (tx) => {
      // Fetch products with row-level locking (SELECT FOR UPDATE behavior in transaction)
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });
      const productMap = new Map(products.map(p => [p.id, p]));

      // Fetch variants if needed
      const variants = variantIds.length > 0
        ? await tx.productVariant.findMany({ where: { id: { in: variantIds } } })
        : [];
      const variantMap = new Map(variants.map(v => [v.id, v]));

      // Validate all products exist, are available, and have sufficient stock
      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`VALIDATION:Product with ID ${item.productId} not found`);
        }
        if (!product.isAvailable || product.isDeleted) {
          throw new Error(`VALIDATION:${product.name} is currently unavailable`);
        }

        // Check stock availability (variant or product)
        if (item.variantId) {
          const variant = variantMap.get(item.variantId);
          if (!variant || variant.isDeleted) {
            throw new Error(`VALIDATION:Variant not found for product ${product.name}`);
          }
          if (!variant.isAvailable) {
            throw new Error(`VALIDATION:${product.name} (${variant.name}) is currently unavailable`);
          }
          if (variant.stockQuantity < item.quantity) {
            throw new Error(`STOCK:${product.name} (${variant.name}):${variant.stockQuantity}:${item.quantity}:${product.id}:${item.variantId}`);
          }
        } else if (product.stockQuantity < item.quantity) {
          throw new Error(`STOCK:${product.name}:${product.stockQuantity}:${item.quantity}:${product.id}`);
        }
      }

      // Calculate order items with prices
      const orderItems = items.map(item => {
        const product = productMap.get(item.productId);
        const unitPrice = item.unitPrice ?? product.price;
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

      // Deduct stock for each item (from variant or product)
      for (const item of items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });
        } else {
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
          customerId,
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
    }).catch((error) => {
      // Handle validation errors thrown from within the transaction
      if (error.message.startsWith('VALIDATION:')) {
        const message = error.message.replace('VALIDATION:', '');
        return { error: true, status: 400, message };
      }
      if (error.message.startsWith('STOCK:')) {
        const parts = error.message.replace('STOCK:', '').split(':');
        const [productName, available, requested, productId, variantId] = parts;
        return {
          error: true,
          status: 400,
          message: `Insufficient stock for ${productName}. Available: ${available}, Requested: ${requested}`,
          code: 'INSUFFICIENT_STOCK',
          productId: parseInt(productId, 10),
          variantId: variantId ? parseInt(variantId, 10) : undefined,
          availableStock: parseInt(available, 10),
        };
      }
      throw error;
    });

    // Handle validation errors
    if (order.error) {
      const response = {
        success: false,
        message: order.message,
      };
      if (order.code) response.code = order.code;
      if (order.productId) response.productId = order.productId;
      if (order.variantId) response.variantId = order.variantId;
      if (order.availableStock !== undefined) response.availableStock = order.availableStock;
      return res.status(order.status).json(response);
    }

    // Invalidate product cache after stock changes
    invalidateProducts();

    // Send SMS notification to customer
    try {
      await smsService.sendOrderConfirmation(order.phone || deliveryInfo.phone, order.orderNumber, order.totalAmount, order.id);
    } catch (smsError) {
      console.error('SMS sending failed:', smsError.message);
      // Don't fail the order creation if SMS fails
    }

    // Send notification to admin
    try {
      await smsService.notifyAdminNewOrder(order.orderNumber, order.totalAmount, order.customerName || deliveryInfo.customerName);
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

    // Check if we need to restore stock (moved outside transaction for cache invalidation)
    const isRestoreStock =
      (status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.REJECTED) &&
      previousStatus !== ORDER_STATUS.CANCELLED &&
      previousStatus !== ORDER_STATUS.REJECTED;

    // Update order status and create history entry in a transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {

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

      // Resolve changedById – ensure the user still exists to avoid FK errors
      let changedById = null;
      if (req.user?.id) {
        const adminUser = await tx.user.findUnique({ where: { id: req.user.id }, select: { id: true } });
        if (adminUser) {
          changedById = adminUser.id;
        }
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: parseInt(id, 10),
          fromStatus: previousStatus,
          toStatus: status,
          changedById,
          notes: message || null,
        },
      });

      return updated;
    });

    // Invalidate product cache if stock was restored
    if (isRestoreStock) {
      invalidateProducts();
    }

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
