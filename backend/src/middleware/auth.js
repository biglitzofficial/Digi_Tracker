const { verifyAccessToken } = require('../utils/tokens');
const userRepository = require('../repositories/userRepository');
const { sanitizeUser } = require('../db/userHelpers');
const AppError = require('../utils/AppError');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Access token required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await userRepository.findById(decoded.userId);
    if (!user || user.isActive === false) {
      throw new AppError('User not found or inactive', 401);
    }

    req.user = await sanitizeUser(user);
    req.businessId = user.businessId ? String(user.businessId) : null;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError(error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token', 401));
    }
    next(error);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('Insufficient permissions', 403));
  }
  next();
};

const tenantScope = (req, res, next) => {
  if (req.user.role === 'super_admin') {
    req.tenantFilter = req.query.businessId ? { businessId: req.query.businessId } : {};
  } else if (req.businessId) {
    req.tenantFilter = { businessId: req.businessId };
  } else {
    return next(new AppError('No business context', 403));
  }
  next();
};

module.exports = { authenticate, authorize, tenantScope };
