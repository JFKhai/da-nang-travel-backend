const { success } = require('../utils/response.util');
const authService = require('../services/auth.service');

exports.register = async (req, res, next) => {
  console.log('Request Body:', req.body);
  try {
    const user = await authService.register(req.body);

    res.status(201).send(
      success(user, 'Đăng ký thành công')
    );
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  console.log('Request Body:', req.body);
  try {
    const result = await authService.login(req.body);

    res.status(200).send(
      success(result, 'Đăng nhập thành công')
    );
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);

    res.status(200).send(
      success(user, 'Lấy thông tin người dùng thành công')
    );
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await authService.updateProfile({
      userId,
      body: req.body,
      file: req.file,
    });

    res.status(200).send(
      success(result, 'Cập nhật thông tin thành công')
    );
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  console.log('Request Body:', req.body);
  try {
    const userId = req.user.id;
    const result = await authService.changePassword(userId, req.body);

    res.status(200).send(
      success(null, 'Đổi mật khẩu thành công')
    );
  } catch (err) {
    next(err);
  }
};

exports.adminGetUsers = async (req, res, next) => {
  try {
    const users = await authService.adminGetUsers();

    res.status(200).send(
      success(users, 'Lấy danh sách người dùng thành công')
    );
  } catch (err) {
    next(err);
  }
};

exports.adminUpdateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await authService.adminUpdateUser(id, req.body);

    res.status(200).send(
      success(result, 'Cập nhật trạng thái người dùng thành công')
    );
  } catch (err) {
    next(err);
  }
};
