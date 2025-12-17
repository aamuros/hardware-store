const { body, param, validationResult } = require('express-validator');
const { validatePhoneNumber, ALL_VALID_PREFIXES } = require('../services/smsService');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

/**
 * Custom validator for Philippine phone numbers
 * Supports all major networks: Globe, Smart, Sun, TNT, DITO, TM
 */
const isValidPhilippinePhone = (value) => {
  const result = validatePhoneNumber(value);
  if (!result.valid) {
    throw new Error(result.error);
  }
  return true;
};

/**
 * Sanitize phone number to standard format (09XXXXXXXXX)
 */
const sanitizePhoneNumber = (value) => {
  if (!value) return value;

  // Remove all non-digit characters
  let cleaned = value.toString().replace(/\D/g, '');

  // Handle +63 or 63 prefix
  if (cleaned.startsWith('63') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(2);
  }

  // Handle 9XXXXXXXXX (missing leading 0)
  if (cleaned.startsWith('9') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
};

// Order validation rules
const validateOrder = [
  body('customerName')
    .trim()
    .notEmpty().withMessage('Customer name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .customSanitizer(sanitizePhoneNumber)
    .custom(isValidPhilippinePhone)
    .withMessage('Invalid Philippine mobile number. Must be 11 digits starting with 09 (e.g., 09171234567)'),

  body('address')
    .trim()
    .notEmpty().withMessage('Address is required')
    .isLength({ min: 10, max: 500 }).withMessage('Address must be 10-500 characters'),

  body('barangay')
    .trim()
    .notEmpty().withMessage('Barangay is required')
    .isLength({ max: 100 }).withMessage('Barangay must be at most 100 characters'),

  body('landmarks')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Landmarks must be at most 200 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must be at most 500 characters'),

  body('items')
    .isArray({ min: 1 }).withMessage('At least one item is required'),

  body('items.*.productId')
    .isInt({ min: 1 }).withMessage('Invalid product ID'),

  body('items.*.quantity')
    .isInt({ min: 1, max: 999 }).withMessage('Quantity must be between 1 and 999'),

  body('items.*.unitPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Unit price cannot be negative'),

  body('items.*.variantId')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid variant ID'),

  validate,
];

// Product validation rules
const validateProduct = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Name must be 2-200 characters'),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

  body('unit')
    .trim()
    .notEmpty().withMessage('Unit is required')
    .isLength({ max: 50 }).withMessage('Unit must be at most 50 characters'),

  body('categoryId')
    .notEmpty().withMessage('Category is required')
    .isInt({ min: 1 }).withMessage('Invalid category ID'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must be at most 1000 characters'),

  body('sku')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('SKU must be at most 50 characters'),

  validate,
];

// Category validation rules
const validateCategory = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must be at most 500 characters'),

  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Icon must be at most 50 characters'),

  validate,
];

// Order status update validation rules
const validateOrderStatus = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid order ID'),

  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'completed', 'cancelled', 'rejected'])
    .withMessage('Invalid order status'),

  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Message must be at most 500 characters'),

  validate,
];

module.exports = {
  validateOrder,
  validateProduct,
  validateCategory,
  validateOrderStatus,
};
