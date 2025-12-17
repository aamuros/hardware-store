const express = require('express');
const router = express.Router();
const variantController = require('../controllers/variantController');
const { authenticate } = require('../middleware/auth');

// Public routes
// GET /api/products/:productId/variants - Get all variants for a product
router.get('/products/:productId/variants', variantController.getVariantsByProduct);

// Admin routes (protected)
// POST /api/admin/products/:productId/variants - Create a new variant
router.post('/admin/products/:productId/variants', authenticate, variantController.createVariant);

// PATCH /api/admin/variants/:id - Update a variant
router.patch('/admin/variants/:id', authenticate, variantController.updateVariant);

// DELETE /api/admin/variants/:id - Soft delete a variant
router.delete('/admin/variants/:id', authenticate, variantController.deleteVariant);

// PATCH /api/admin/variants/:id/stock - Update variant stock
router.patch('/admin/variants/:id/stock', authenticate, variantController.updateVariantStock);

module.exports = router;
