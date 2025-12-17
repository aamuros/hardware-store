const express = require('express');
const router = express.Router();
const { requireCustomer, authenticateCustomer } = require('../middleware/auth');

// Controllers
const customerController = require('../controllers/customerController');
const addressController = require('../controllers/addressController');
const wishlistController = require('../controllers/wishlistController');
const orderHistoryController = require('../controllers/orderHistoryController');

// ============================================
// Public routes (no authentication required)
// ============================================

// Registration and login
router.post('/register', customerController.register);
router.post('/login', customerController.login);

// ============================================
// Protected routes (customer authentication required)
// ============================================

// Profile management
router.get('/profile', requireCustomer, customerController.getProfile);
router.patch('/profile', requireCustomer, customerController.updateProfile);
router.patch('/change-password', requireCustomer, customerController.changePassword);

// Saved addresses
router.get('/addresses', requireCustomer, addressController.getAddresses);
router.post('/addresses', requireCustomer, addressController.createAddress);
router.patch('/addresses/:id', requireCustomer, addressController.updateAddress);
router.delete('/addresses/:id', requireCustomer, addressController.deleteAddress);
router.patch('/addresses/:id/default', requireCustomer, addressController.setDefaultAddress);

// Wishlist
router.get('/wishlist', requireCustomer, wishlistController.getWishlist);
router.get('/wishlist/ids', requireCustomer, wishlistController.getWishlistIds);
router.get('/wishlist/check/:productId', requireCustomer, wishlistController.checkWishlist);
router.post('/wishlist', requireCustomer, wishlistController.addToWishlist);
router.delete('/wishlist/:productId', requireCustomer, wishlistController.removeFromWishlist);

// Order history
router.get('/orders', requireCustomer, orderHistoryController.getOrderHistory);
router.get('/orders/:orderNumber', requireCustomer, orderHistoryController.getOrderDetail);

module.exports = router;
