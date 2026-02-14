const config = require('../config');
const { logger, logError } = require('../utils/logger');

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// 404 handler
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Not found - ${req.originalUrl}`,
    code: 'NOT_FOUND',
  });
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  // Log the error
  logError(err, req);
  
  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(400).json({
      success: false,
      message: 'A record with this value already exists',
      code: 'DUPLICATE_ENTRY',
      field: err.meta?.target,
    });
  }
  
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found',
      code: 'NOT_FOUND',
    });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Foreign key constraint failed',
      code: 'FOREIGN_KEY_ERROR',
      field: err.meta?.field_name,
    });
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      errors: err.errors,
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token has expired',
      code: 'TOKEN_EXPIRED',
    });
  }
  
  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 5MB',
      code: 'FILE_TOO_LARGE',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field',
      code: 'UNEXPECTED_FILE',
    });
  }

  // Syntax error (invalid JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body',
      code: 'INVALID_JSON',
    });
  }

  // API Error (custom errors)
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code || 'API_ERROR',
      errors: err.errors,
    });
  }
  
  // Default error response
  const statusCode = err.statusCode || 500;
  const message = config.nodeEnv === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(statusCode).json({
    success: false,
    message,
    code: 'INTERNAL_ERROR',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};

module.exports = {
  notFound,
  errorHandler,
  ApiError,
};
