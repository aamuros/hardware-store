const express = require('express');
const router = express.Router();
const bulkPricingController = require('../controllers/bulkPricingController');
const { authenticate } = require('../middleware/auth');

// Public routes
// GET /api/products/:productId/bulk-pricing - Get bulk pricing tiers
router.get('/products/:productId/bulk-pricing', bulkPricingController.getBulkPricingTiers);

// GET /api/products/:productId/calculate-price - Calculate price with bulk discount
router.get('/products/:productId/calculate-price', bulkPricingController.calculateBulkPrice);

// Admin routes (protected)
// POST /api/admin/products/:productId/bulk-pricing - Create tier
router.post(
    '/admin/products/:productId/bulk-pricing',
    authenticate,
    bulkPricingController.createBulkPricingTier
);

// PATCH /api/admin/bulk-pricing/:id - Update tier
router.patch('/admin/bulk-pricing/:id', authenticate, bulkPricingController.updateBulkPricingTier);

// DELETE /api/admin/bulk-pricing/:id - Delete tier
router.delete('/admin/bulk-pricing/:id', authenticate, bulkPricingController.deleteBulkPricingTier);

module.exports = router;
