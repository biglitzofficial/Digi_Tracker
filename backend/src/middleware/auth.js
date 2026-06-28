const { verifyAccessToken } = require('../utils/tokens');
const userRepository = require('../repositories/userRepository');
const businessRepository = require('../repositories/businessRepository');
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

/** Super admin can perform any authorized action. */
const authorize = (...roles) => (req, res, next) => {
  if (req.user.role === 'super_admin') return next();
  if (!roles.includes(req.user.role)) {
    return next(new AppError('Insufficient permissions', 403));
  }
  next();
};

async function resolveSuperAdminBusinessId(req) {
  const explicitId = req.query.businessId || req.body?.businessId;
  if (explicitId) return String(explicitId);

  const { businesses } = await businessRepository.findAll({}, 1, 100);
  if (businesses.length >= 1) return String(businesses[0]._id);
  return null;
}

const tenantScope = async (req, res, next) => {
  try {
    if (req.user.role === 'super_admin') {
      const resolved = await resolveSuperAdminBusinessId(req);
      if (resolved) req.businessId = resolved;
      req.tenantFilter = req.businessId ? { businessId: req.businessId } : {};
      return next();
    }

    if (!req.businessId) return next(new AppError('No business context', 403));
    req.tenantFilter = { businessId: req.businessId };
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate, authorize, tenantScope };
