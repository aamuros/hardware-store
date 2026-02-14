const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { requireCustomer, authenticateCustomer } = require('../middleware/auth');
const config = require('../config');

// Controllers
const customerController = require('../controllers/customerController');
const passwordResetController = require('../controllers/passwordResetController');
const addressController = require('../controllers/addressController');
const wishlistController = require('../controllers/wishlistController');
const orderHistoryController = require('../controllers/orderHistoryController');

// Rate limiting for authentication endpoints (prevent brute force attacks)
// Skip rate limiting in test environment to allow tests to run
// TEMPORARILY DISABLED - Rate limiting commented out for testing
/* const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.nodeEnv === 'test' ? 1000 : 5, // limit each IP to 5 attempts per window (1000 for tests)
  message: {
    success: false,
    message: 'Too many attempts, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.nodeEnv === 'test', // Also skip entirely in test mode
}); */

// ============================================
// Public routes (no authentication required)
// ============================================

// Registration and login (with rate limiting)
// TEMPORARILY DISABLED - Rate limiting removed from routes
router.post('/register', /* authLimiter, */ customerController.register);
router.post('/login', /* authLimiter, */ customerController.login);

// Password reset
router.post('/forgot-password', /* authLimiter, */ passwordResetController.forgotPassword);
router.post('/verify-reset-token', passwordResetController.verifyResetToken);
router.post('/reset-password', /* authLimiter, */ passwordResetController.resetPassword);

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
