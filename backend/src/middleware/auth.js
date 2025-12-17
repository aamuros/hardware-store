const jwt = require('jsonwebtoken');
const config = require('../config');

// Verify JWT token middleware
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
};

// Check if user is staff or admin
const isStaff = (req, res, next) => {
  if (!['admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Staff access required',
    });
  }
  next();
};

// Customer authentication - OPTIONAL (allows guest checkout)
// Sets req.customer if valid token present, otherwise continues
const authenticateCustomer = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token - continue as guest
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    // Only set customer if token type is customer
    if (decoded.type === 'customer') {
      req.customer = decoded;
    }

    next();
  } catch (error) {
    // Invalid token - continue as guest
    next();
  }
};

// Customer authentication - REQUIRED
// Returns 401 if no valid customer token
const requireCustomer = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    // Verify token is for a customer
    if (decoded.type !== 'customer') {
      return res.status(401).json({
        success: false,
        message: 'Customer authentication required',
      });
    }

    req.customer = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session has expired. Please log in again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authentication',
    });
  }
};

module.exports = {
  authenticate,
  isAdmin,
  isStaff,
  authenticateCustomer,
  requireCustomer,
};
