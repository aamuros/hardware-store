const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
// GET /api/products/:productId/images - Get all images for a product
router.get('/products/:productId/images', imageController.getProductImages);

// Admin routes (protected)
// POST /api/admin/products/:productId/images - Upload images
router.post(
    '/admin/products/:productId/images',
    authenticate,
    upload.array('images', 10), // Max 10 images at a time
    imageController.uploadImages
);

// DELETE /api/admin/images/:id - Delete an image
router.delete('/admin/images/:id', authenticate, imageController.deleteImage);

// PATCH /api/admin/products/:productId/images/reorder - Reorder images
router.patch(
    '/admin/products/:productId/images/reorder',
    authenticate,
    imageController.reorderImages
);

// PATCH /api/admin/images/:id/primary - Set as primary image
router.patch('/admin/images/:id/primary', authenticate, imageController.setPrimaryImage);

module.exports = router;
