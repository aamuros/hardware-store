/**
 * Winston Logger Configuration
 * Provides structured logging for the application
 */

const winston = require('winston');
const path = require('path');
const config = require('../config');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }

    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }

    return log;
  })
);

// Define log format for JSON (production)
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports = [
  // Console transport - always enabled
  new winston.transports.Console({
    format: config.nodeEnv === 'production' ? jsonFormat : logFormat,
  }),
];

// Add file transports in production
if (config.nodeEnv === 'production') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: jsonFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: jsonFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Create a stream object for Morgan integration
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

/**
 * Log helper functions
 */
const logRequest = (req, message = 'Request received') => {
  logger.info(message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
};

// Fields that should never be logged
const SENSITIVE_FIELDS = ['password', 'currentPassword', 'newPassword', 'token', 'apiKey', 'secret'];

/**
 * Sanitize object by removing sensitive fields
 */
const sanitizeForLogging = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = { ...obj };
  for (const field of SENSITIVE_FIELDS) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  return sanitized;
};

const logError = (error, req = null) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    code: error.code,
  };

  if (req) {
    errorInfo.method = req.method;
    errorInfo.url = req.originalUrl;
    errorInfo.ip = req.ip;
    // Sanitize request body to prevent logging sensitive data
    errorInfo.body = sanitizeForLogging(req.body);
  }

  logger.error('Error occurred', errorInfo);
};

const logAuth = (action, userId, success, ip) => {
  logger.info(`Authentication: ${action}`, {
    userId,
    success,
    ip,
  });
};

const logOrderStatus = (orderId, oldStatus, newStatus, userId) => {
  logger.info('Order status changed', {
    orderId,
    oldStatus,
    newStatus,
    changedBy: userId,
  });
};

module.exports = {
  logger,
  logRequest,
  logError,
  logAuth,
  logOrderStatus,
};
