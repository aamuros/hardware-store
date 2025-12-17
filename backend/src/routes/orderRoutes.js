const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { validateOrder } = require('../middleware/validators');
const prisma = require('../utils/prismaClient');

// POST /api/orders/validate-cart - Validate cart items before checkout
router.post('/validate-cart', async (req, res, next) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart items are required',
            });
        }

        const productIds = items.map(item => item.productId || item.id);

        // Fetch all products in the cart
        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds },
                isDeleted: false,
            },
            select: {
                id: true,
                name: true,
                price: true,
                isAvailable: true,
                stockQuantity: true,
            },
        });

        const productMap = new Map(products.map(p => [p.id, p]));
        const validationErrors = [];
        const validatedItems = [];

        for (const item of items) {
            const productId = item.productId || item.id;
            const product = productMap.get(productId);
            const quantity = item.quantity || 1;

            if (!product) {
                validationErrors.push({
                    productId,
                    type: 'NOT_FOUND',
                    message: `Product not found`,
                });
                continue;
            }

            if (!product.isAvailable) {
                validationErrors.push({
                    productId,
                    productName: product.name,
                    type: 'UNAVAILABLE',
                    message: `${product.name} is no longer available`,
                });
                continue;
            }

            if (product.stockQuantity < quantity) {
                validationErrors.push({
                    productId,
                    productName: product.name,
                    type: 'INSUFFICIENT_STOCK',
                    message: `${product.name} only has ${product.stockQuantity} items in stock`,
                    requestedQuantity: quantity,
                    availableQuantity: product.stockQuantity,
                });
                continue;
            }

            // Item is valid
            validatedItems.push({
                productId,
                name: product.name,
                price: product.price,
                quantity,
                stockQuantity: product.stockQuantity,
            });
        }

        res.json({
            success: validationErrors.length === 0,
            valid: validationErrors.length === 0,
            errors: validationErrors,
            validatedItems,
            message: validationErrors.length > 0
                ? `${validationErrors.length} item(s) have issues`
                : 'All items are valid',
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/orders - Create a new order
router.post('/', validateOrder, orderController.createOrder);

// GET /api/orders/:id - Get order by ID (for customer to track)
router.get('/:id', orderController.getOrderById);

// GET /api/orders/track/:orderNumber - Track order by order number
router.get('/track/:orderNumber', orderController.trackOrder);

module.exports = router;

