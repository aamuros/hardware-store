const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { validateOrder } = require('../middleware/validators');
const { authenticateCustomer } = require('../middleware/auth');
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

        // Ensure productIds are integers
        const productIds = items.map(item => parseInt(item.productId || item.id, 10));

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
                hasVariants: true,
            },
        });

        // Fetch variants if any items have variantId
        const variantIds = items
            .filter(item => item.variantId)
            .map(item => parseInt(item.variantId, 10));

        let variantMap = new Map();
        if (variantIds.length > 0) {
            const variants = await prisma.productVariant.findMany({
                where: {
                    id: { in: variantIds },
                    isDeleted: false,
                },
                select: {
                    id: true,
                    name: true,
                    price: true,
                    stockQuantity: true,
                    isAvailable: true,
                    productId: true,
                },
            });
            variantMap = new Map(variants.map(v => [v.id, v]));
        }

        const productMap = new Map(products.map(p => [p.id, p]));
        const validationErrors = [];
        const validatedItems = [];

        for (const item of items) {
            const productId = parseInt(item.productId || item.id, 10);
            const variantId = item.variantId ? parseInt(item.variantId, 10) : null;
            const product = productMap.get(productId);
            const quantity = parseInt(item.quantity, 10) || 1;

            // Validate quantity is positive
            if (quantity <= 0) {
                validationErrors.push({
                    productId,
                    type: 'INVALID_QUANTITY',
                    message: 'Quantity must be greater than 0',
                });
                continue;
            }

            if (!product) {
                validationErrors.push({
                    productId,
                    type: 'NOT_FOUND',
                    message: 'Product not found',
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

            // Check variant stock if variantId is provided
            if (variantId) {
                const variant = variantMap.get(variantId);

                if (!variant) {
                    validationErrors.push({
                        productId,
                        variantId,
                        productName: product.name,
                        type: 'VARIANT_NOT_FOUND',
                        message: `Selected option for ${product.name} is no longer available`,
                    });
                    continue;
                }

                if (!variant.isAvailable) {
                    validationErrors.push({
                        productId,
                        variantId,
                        productName: product.name,
                        variantName: variant.name,
                        type: 'VARIANT_UNAVAILABLE',
                        message: `${product.name} (${variant.name}) is no longer available`,
                    });
                    continue;
                }

                if (variant.stockQuantity < quantity) {
                    validationErrors.push({
                        productId,
                        variantId,
                        productName: product.name,
                        variantName: variant.name,
                        type: 'INSUFFICIENT_STOCK',
                        message: `${product.name} (${variant.name}) only has ${variant.stockQuantity} items in stock`,
                        requestedQuantity: quantity,
                        availableQuantity: variant.stockQuantity,
                    });
                    continue;
                }

                // Variant item is valid
                validatedItems.push({
                    productId,
                    variantId,
                    name: product.name,
                    variantName: variant.name,
                    price: variant.price,
                    quantity,
                    stockQuantity: variant.stockQuantity,
                });
            } else {
                // Check product stock (non-variant product)
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
// Uses authenticateCustomer to optionally link order to logged-in customer
router.post('/', authenticateCustomer, validateOrder, orderController.createOrder);

// GET /api/orders/track/:orderNumber - Track order by order number
router.get('/track/:orderNumber', orderController.trackOrder);

// GET /api/orders/:id - Get order by ID (for customer to track)
router.get('/:id', orderController.getOrderById);

module.exports = router;

