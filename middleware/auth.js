import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token, return error
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized, no token',
      statusCode: 401
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        statusCode: 401
      });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired, please refresh or login again',
        statusCode: 401
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Not authorized, token failed',
      statusCode: 401
    });
  }
};

export default protect;