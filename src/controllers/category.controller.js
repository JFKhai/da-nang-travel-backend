const { success } = require('../utils/response.util');
const categoryService = require('../services/category.service');

exports.listCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.listCategories();
    res.status(200).send(success(categories, 'Lấy danh sách category thành công'));
  } catch (err) {
    next(err);
  }
};

exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    res.status(200).send(success(category, 'Lấy chi tiết category thành công'));
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const dto = req.body;
    const category = await categoryService.createCategory(dto);
    res.status(201).send(success(category, 'Tạo category thành công'));
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const dto = req.body;
    const category = await categoryService.updateCategory(req.params.id, dto);
    res.status(200).send(success(category, 'Cập nhật category thành công'));
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.status(200).send(success(null, 'Xóa category thành công'));
  } catch (err) {
    next(err);
  }
};