/**
 * Input Sanitization Middleware
 * Prevents XSS attacks by sanitizing user input
 */

// XSS sanitization function - removes dangerous patterns while preserving valid data
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Remove script tags and event handlers (actual XSS vectors)
  let sanitized = str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, 'data_blocked:')
    .trim();
  
  return sanitized;
};

// Strict HTML entity encoding for fields that will be rendered as HTML
const encodeHtmlEntities = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#96;')
    .trim();
};

// Fields that should be strictly HTML-encoded (user-generated content displayed as HTML)
const HTML_DISPLAY_FIELDS = ['description', 'bio', 'content', 'message', 'comment', 'notes'];

// Fields that should NOT be sanitized at all (URLs, paths, technical data)
const PRESERVE_FIELDS = ['password', 'url', 'href', 'src', 'path', 'imageurl', 'callback', 'redirect', 'token', 'authorization'];

// Recursively sanitize object with field-aware logic
const sanitizeObject = (obj, parentKey = '') => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    const lowerKey = parentKey.toLowerCase();
    
    // Don't sanitize technical/URL fields
    if (PRESERVE_FIELDS.some(field => lowerKey.includes(field))) {
      return obj;
    }
    
    // Strictly encode HTML display fields
    if (HTML_DISPLAY_FIELDS.some(field => lowerKey.includes(field))) {
      return encodeHtmlEntities(obj);
    }
    
    // Light sanitization for other fields (remove script injection)
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, parentKey));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key of Object.keys(obj)) {
      sanitized[key] = sanitizeObject(obj[key], key);
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Middleware to sanitize request body, query, and params
 */
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

/**
 * Password strength validator
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Password is required'] };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Middleware to validate password strength on password change
 */
const validatePassword = (req, res, next) => {
  const { newPassword } = req.body;
  
  if (newPassword) {
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: validation.errors,
      });
    }
  }
  
  next();
};

module.exports = {
  sanitizeInput,
  sanitizeString,
  sanitizeObject,
  encodeHtmlEntities,
  validatePasswordStrength,
  validatePassword,
};
