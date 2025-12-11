import { z } from 'zod';

// Phone validation for Philippine numbers
const philippinePhoneRegex = /^(09|\+639)\d{9}$/;

// Common validation patterns
const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(philippinePhoneRegex, 'Please enter a valid Philippine mobile number (09XX or +639XX)');

const requiredString = (fieldName) =>
  z.string().min(1, `${fieldName} is required`);

// Checkout form validation
export const checkoutSchema = z.object({
  customerName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  phone: phoneSchema,
  address: z
    .string()
    .min(1, 'Address is required')
    .min(10, 'Please enter a complete address'),
  barangay: requiredString('Barangay'),
  landmarks: z
    .string()
    .optional()
    .transform((val) => val || ''),
  notes: z
    .string()
    .optional()
    .transform((val) => val || ''),
});

// Admin login form validation
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

// Admin password change validation
export const passwordChangeSchema = z
  .object({
    currentPassword: requiredString('Current password'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: requiredString('Password confirmation'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Product form validation
export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be less than 200 characters'),
  description: z.string().optional(),
  price: z
    .number({ invalid_type_error: 'Price must be a number' })
    .positive('Price must be greater than 0')
    .max(999999, 'Price is too high'),
  unit: requiredString('Unit'),
  categoryId: z
    .number({ invalid_type_error: 'Please select a category' })
    .positive('Please select a category'),
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(50, 'SKU must be less than 50 characters'),
});

// Category form validation
export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  icon: z.string().optional(),
});

// Order tracking form validation
export const orderTrackingSchema = z.object({
  orderNumber: z
    .string()
    .min(1, 'Order number is required')
    .regex(/^ORD-\d{8}-\w{4}$/, 'Please enter a valid order number (e.g., ORD-20231201-ABCD)'),
});

// Quantity validation
export const quantitySchema = z
  .number()
  .int('Quantity must be a whole number')
  .positive('Quantity must be at least 1')
  .max(999, 'Maximum quantity is 999');

// Search query validation
export const searchSchema = z.object({
  query: z
    .string()
    .min(2, 'Search must be at least 2 characters')
    .max(100, 'Search query is too long'),
});

// Helper function to validate a form
export const validateForm = (schema, data) => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data, errors: null };
  }
  
  // Transform Zod errors into a more usable format
  const errors = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });
  
  return { success: false, data: null, errors };
};

// Helper function to get field error
export const getFieldError = (errors, fieldName) => {
  return errors?.[fieldName] || null;
};

// Custom hook helper for form validation
export const createFormValidator = (schema) => {
  return {
    validate: (data) => validateForm(schema, data),
    validateField: (fieldName, value) => {
      const partialSchema = schema.pick({ [fieldName]: true });
      return validateForm(partialSchema, { [fieldName]: value });
    },
  };
};

export default {
  checkoutSchema,
  loginSchema,
  passwordChangeSchema,
  productSchema,
  categorySchema,
  orderTrackingSchema,
  quantitySchema,
  searchSchema,
  validateForm,
  getFieldError,
  createFormValidator,
};
