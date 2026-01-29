const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError.util');
const {
  uploadBufferToCloudinary,
} = require('../utils/cloudinaryUpload.util');

const userRepo = require('../repository/user.repo');

exports.register = async ({ email, password, full_name }) => {
  const existedUser = await userRepo.findByEmail(email);
  if (existedUser) {
    throw new AppError('Email đã tồn tại', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userRepo.create({
    email,
    password: hashedPassword,
    full_name,
  });

  const userJson = user.toJSON();
  delete userJson.password;

  return userJson;
};

exports.login = async ({ email, password }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  const userJson = user.toJSON();
  delete userJson.password;

  return { token, user: userJson };
};

exports.getMe = async (userId) => {
  const user = await userRepo.findById(userId, {
    attributes: { exclude: ['password'] },
  });

  if (!user) {
    throw new AppError('Người dùng không tồn tại', 404);
  }

  return user;
};

exports.updateProfile = async ({ userId, body, file }) => {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new AppError('Người dùng không tồn tại', 404);
  }

  let avatar_url = user.avatar_url;

  if (file) {
    const uploadResult = await uploadBufferToCloudinary(
      file.buffer,
      'image'
    );
    avatar_url = uploadResult.secure_url;
  }

  await userRepo.update(user, {
    full_name: body.full_name ?? user.full_name,
    avatar_url,
  });

  const userJson = user.toJSON();
  delete userJson.password;

  return userJson;
};

exports.changePassword = async (userId, data) => {
  const { old_password, new_password } = data;

  if (!old_password || !new_password) {
    throw new AppError('Thiếu mật khẩu', 400);
  }

  const user = await userRepo.findById(userId);
  if (!user) {
    throw new AppError('Người dùng không tồn tại', 404);
  }

  const isMatch = await bcrypt.compare(old_password, user.password);
  if (!isMatch) {
    throw new AppError('Mật khẩu cũ không đúng', 400);
  }

  const hashedPassword = await bcrypt.hash(new_password, 10);
  await userRepo.update(user, { password: hashedPassword });

  return true;
};
