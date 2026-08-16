const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { AppError } = require('./errorHandler');

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'hms_super_secret_access_token_key_12345!';

/**
 * Authenticates the request by checking the JWT in authorization header
 */
const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Your token has expired. Please log in again.', 401));
      }
      return next(new AppError('Invalid token. Please authenticate again.', 401));
    }

    // Find user in database and fetch their profile based on their role
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        patientProfile: true,
        doctorProfile: true,
        staffProfile: true
      }
    });

    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // Grant access to protected route and store user details in req
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Restricts access to specific roles
 * @param  {...string} roles - Permitted roles (ADMIN, DOCTOR, NURSE, RECEPTIONIST, PATIENT)
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo
};
