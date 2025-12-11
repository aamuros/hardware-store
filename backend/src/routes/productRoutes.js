const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// GET /api/products - Get all products (with optional filters)
router.get('/', productController.getAllProducts);

// GET /api/products/search - Search products
router.get('/search', productController.searchProducts);

// GET /api/products/:id - Get product by ID
router.get('/:id', productController.getProductById);

// GET /api/products/category/:categoryId - Get products by category
router.get('/category/:categoryId', productController.getProductsByCategory);

module.exports = router;
