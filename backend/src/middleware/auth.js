const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware
 * Validates JWT token and adds user to request object
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid authentication token'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'The authentication token has expired'
      });
    } else {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        error: 'Authentication error',
        message: 'An error occurred during authentication'
      });
    }
  }
};

/**
 * Optional authentication middleware
 * Validates JWT token if provided, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const authorizeRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      });
    }

    // For now, we'll use a simple role system
    // In a real application, you might have a roles table
    const userRole = req.user.role || 'user';
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

/**
 * Resource ownership middleware
 * Ensures user can only access their own resources
 */
const requireOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please log in to access this resource'
        });
      }

      const resourceId = req.params.id;
      let resource;

      // Get resource based on type
      switch (resourceType) {
        case 'task':
          const Task = require('../models/Task');
          resource = await Task.findById(resourceId);
          break;
        case 'user':
          resource = await User.findById(resourceId);
          break;
        default:
          return res.status(400).json({
            error: 'Invalid resource type',
            message: 'Unsupported resource type for ownership check'
          });
      }

      if (!resource) {
        return res.status(404).json({
          error: 'Resource not found',
          message: `${resourceType} not found`
        });
      }

      // Check ownership
      if (resource.user_id !== req.user.id && resource.id !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only access your own resources'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership middleware error:', error);
      return res.status(500).json({
        error: 'Authorization error',
        message: 'An error occurred during authorization'
      });
    }
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  authorizeRoles,
  requireOwnership
};
