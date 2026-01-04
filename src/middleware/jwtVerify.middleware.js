const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError.util');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Kiểm tra header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Thiếu token xác thực', 401);
    }

    // 2. Lấy token
    const token = authHeader.split(' ')[1];

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Gắn user vào request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (err) {
    // Token hết hạn
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token đã hết hạn', 401));
    }

    // Token sai
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Token không hợp lệ', 401));
    }

    next(err);
  }
};
