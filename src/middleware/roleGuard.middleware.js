const AppError = require('../utils/AppError.util');

const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new AppError('Unauthorized', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError('Bạn không có quyền truy cập tài nguyên này', 403)
      );
    }

    next();
  };
};

module.exports = roleGuard;
