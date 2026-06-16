import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  console.log('=================================');
  console.log('Authorization Header:', req.headers.authorization);
  console.log('Extracted Token:', token);
  console.log('=================================');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized, no token',
      statusCode: 401
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('Token Verified Successfully');
    console.log('Decoded Payload:', decoded);

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
    console.error('=================================');
    console.error('Auth Middleware Error');
    console.error('Name:', error.name);
    console.error('Message:', error.message);
    console.error('Token Used:', token);
    console.error('JWT_SECRET Exists:', !!process.env.JWT_SECRET);
    console.error('=================================');

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired, please refresh or login again',
        statusCode: 401
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
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