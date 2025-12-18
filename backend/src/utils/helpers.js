/**
 * Generate a unique order number
 * Format: HW-YYYYMMDD-XXXX (e.g., HW-20241211-0001)
 */
const generateOrderNumber = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  // Use timestamp + random for better uniqueness
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `HW-${dateStr}-${timestamp}${random}`.substring(0, 24);
};

/**
 * Format price to Philippine Peso
 */
const formatPrice = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
};

/**
 * Format date for display
 */
const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  return new Date(date).toLocaleDateString('en-PH', defaultOptions);
};

/**
 * Validate Philippine phone number
 */
const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^(09|\+639)\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Sanitize string input
 */
const sanitize = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Generate slug from string
 */
const generateSlug = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Paginate array
 */
const paginate = (array, page = 1, limit = 20) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  return {
    data: array.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: array.length,
      totalPages: Math.ceil(array.length / limit),
      hasNext: endIndex < array.length,
      hasPrev: page > 1,
    },
  };
};

module.exports = {
  generateOrderNumber,
  formatPrice,
  formatDate,
  isValidPhoneNumber,
  sanitize,
  generateSlug,
  paginate,
};
