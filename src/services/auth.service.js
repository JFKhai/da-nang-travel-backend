const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError.util');
const cloudinary = require('../config/cloudinary.config');

exports.register = async ({ email, password, full_name }) => {
  // 1. Check email tồn tại
  const existedUser = await User.findOne({ where: { email } });
  if (existedUser) {
    throw new AppError('Email đã tồn tại', 400);
  }

  // 2. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Tạo user
  const user = await User.create({
    email,
    password: hashedPassword,
    full_name
  });

  // 4. Remove password trước khi trả
  const userJson = user.toJSON();
  delete userJson.password;

  return userJson;
};

exports.login = async ({ email, password }) => {
  // 1. Tìm user
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }

  // 2. Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }

  // 3. Tạo JWT
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // 4. Remove password
  const userJson = user.toJSON();
  delete userJson.password;

  return {
    token,
    user: userJson
  };
};

exports.getMe = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: {
      exclude: ['password']
    }
  });

  if (!user) {
    throw new AppError('Người dùng không tồn tại', 404);
  }

  return user;
};

exports.updateProfile = async ({ userId, body, file }) => {
  const { full_name } = body;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('Người dùng không tồn tại', 404);
  }

  let avatar_url = user.avatar_url;

  // 👇 nếu có upload ảnh mới
  if (file) {
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: 'avatars',
      resource_type: 'image',
    });

    avatar_url = uploadResult.secure_url;
  }

  // 👇 check có gì để update không
  if (!full_name && !file) {
    throw new AppError('Không có dữ liệu để cập nhật', 400);
  }

  await user.update({
    full_name: full_name ?? user.full_name,
    avatar_url,
  });

  const userJson = user.toJSON();
  delete userJson.password;

  return userJson;
};


exports.changePassword = async (userId, data) => {
  const { old_password, new_password } = data;

  // 1. Validate input
  if (!old_password || !new_password) {
    throw new AppError('Vui lòng nhập đầy đủ mật khẩu', 400);
  }

  if (new_password.length < 6) {
    throw new AppError('Mật khẩu mới tối thiểu 6 ký tự', 400);
  }

  // 2. Tìm user
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('Người dùng không tồn tại', 404);
  }

  // 3. Check mật khẩu cũ
  const isMatch = await bcrypt.compare(old_password, user.password);
  if (!isMatch) {
    throw new AppError('Mật khẩu cũ không đúng', 400);
  }

  // 4. Hash mật khẩu mới
  const hashedPassword = await bcrypt.hash(new_password, 10);

  await user.update({ password: hashedPassword });

  return true;
};

