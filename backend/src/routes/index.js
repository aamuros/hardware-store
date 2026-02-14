const express = require('express');
const router = express.Router();

// Import route modules
const productRoutes = require('./productRoutes');
const categoryRoutes = require('./categoryRoutes');
const orderRoutes = require('./orderRoutes');
const adminRoutes = require('./adminRoutes');
const customerRoutes = require('./customerRoutes');
const variantRoutes = require('./variantRoutes');
const imageRoutes = require('./imageRoutes');
const bulkPricingRoutes = require('./bulkPricingRoutes');
const statsRoutes = require('./statsRoutes');

// Public routes
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/stats', statsRoutes);

// Variant routes (public GET, admin POST/PATCH/DELETE)
router.use('/', variantRoutes);

// Image routes (public GET, admin POST/PATCH/DELETE)
router.use('/', imageRoutes);

// Bulk pricing routes (public GET, admin POST/PATCH/DELETE)
router.use('/', bulkPricingRoutes);

// Admin routes (protected)
router.use('/admin', adminRoutes);

// Customer routes (auth + account features)
router.use('/customers', customerRoutes);

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
      customers: '/api/customers',
      stats: '/api/stats',
    },
  });
});

module.exports = router;
