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

  console.log('\n========== AUTH DEBUG ==========');
  console.log('Authorization Header:', req.headers.authorization);
  console.log('Extracted Token:', token);
  console.log('JWT_SECRET Exists:', !!process.env.JWT_SECRET);
  console.log('JWT_EXPIRE:', process.env.JWT_EXPIRE);
  console.log('================================\n');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized, no token',
      statusCode: 401
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('\n========== TOKEN VERIFIED ==========');
    console.log('Decoded Payload:', decoded);
    console.log('====================================\n');

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
    console.log('\n========== JWT ERROR ==========');
    console.log('FULL ERROR:', error);
    console.log('Error Name:', error.name);
    console.log('Error Message:', error.message);
    console.log('Token Used:', token);
    console.log('JWT_SECRET Exists:', !!process.env.JWT_SECRET);
    console.log('JWT_SECRET Value:', process.env.JWT_SECRET);
    console.log('================================\n');

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