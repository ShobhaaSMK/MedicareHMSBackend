const jwt = require('jsonwebtoken');
const db = require('../db');

// JWT secret key - should match the one in authController
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware to verify JWT token
 * Adds user info to req.user if token is valid
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header or x-access-token header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1] || req.headers['x-access-token'];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Optionally verify user still exists and is active
    const { rows } = await db.query(
      'SELECT "UserId", "UserName", "RoleId", "Status" FROM "Users" WHERE "UserId" = $1',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (rows[0].Status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'User account is not active',
      });
    }

    // Add user info to request object
    req.user = {
      userId: decoded.userId,
      userName: decoded.userName,
      roleId: decoded.roleId,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error authenticating token',
      error: error.message,
    });
  }
};

module.exports = {
  authenticateToken,
};

