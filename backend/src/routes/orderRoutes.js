const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { validateOrder } = require('../middleware/validators');

// POST /api/orders - Create a new order
router.post('/', validateOrder, orderController.createOrder);

// GET /api/orders/:id - Get order by ID (for customer to track)
router.get('/:id', orderController.getOrderById);

// GET /api/orders/track/:orderNumber - Track order by order number
router.get('/track/:orderNumber', orderController.trackOrder);

module.exports = router;
