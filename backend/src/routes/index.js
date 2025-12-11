const express = require('express');
const router = express.Router();

// Import route modules
const productRoutes = require('./productRoutes');
const categoryRoutes = require('./categoryRoutes');
const orderRoutes = require('./orderRoutes');
const adminRoutes = require('./adminRoutes');

// Public routes
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);

// Admin routes (protected)
router.use('/admin', adminRoutes);

// API info route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Hardware Store API',
    version: '1.0.0',
    endpoints: {
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
      admin: '/api/admin',
    },
  });
});

module.exports = router;
