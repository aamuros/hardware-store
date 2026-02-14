const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const orderController = require('../controllers/orderController');
const { authenticate, isAdmin } = require('../middleware/auth');
const { validateProduct, validateCategory, validateOrderStatus } = require('../middleware/validators');
const upload = require('../middleware/upload');

// Public admin routes
router.post('/login', adminController.login);

// Protected routes - require authentication
router.use(authenticate);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Change password (current user)
router.patch('/change-password', adminController.changePassword);

// Order management
router.get('/orders', orderController.getAllOrders);
router.get('/orders/:id', orderController.getOrderDetails);
router.patch('/orders/:id/status', validateOrderStatus, orderController.updateOrderStatus);

// Product management
router.post('/products', upload.single('image'), validateProduct, productController.createProduct);
router.patch('/products/:id', upload.single('image'), productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);
router.patch('/products/:id/availability', productController.toggleAvailability);
router.patch('/products/:id/stock', productController.updateStock);

// Inventory management
router.get('/inventory/low-stock', productController.getLowStockProducts);

// Category management
router.get('/categories', categoryController.getAllCategories);
router.post('/categories', validateCategory, categoryController.createCategory);
router.patch('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// Reports
router.get('/reports/sales', adminController.getSalesReport);
router.get('/reports/products', adminController.getProductReport);
router.get('/reports/export', adminController.exportReport);

// User management (super admin only)
router.get('/users', isAdmin, adminController.getUsers);
router.post('/users', isAdmin, adminController.createUser);
router.patch('/users/:id', isAdmin, adminController.updateUser);
router.delete('/users/:id', isAdmin, adminController.deleteUser);

module.exports = router;
