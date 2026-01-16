const { Category } = require('../models');
const AppError = require('../utils/AppError.util');

exports.listCategories = async () => {
    try {
        const categories = await Category.findAll({
        order: [['created_at', 'DESC']],
        });

        return categories;
    } catch (error) {
        throw new AppError('Lỗi khi lấy danh sách danh mục', 500);
    }
};

exports.getCategoryById = async (id) => {
  const categoryId = parseInt(id);
  if (Number.isNaN(categoryId) || categoryId < 1) {
    throw new AppError('ID category không hợp lệ', 400);
    }
  try {

  const category = await Category.findByPk(categoryId);
  if (!category) throw new AppError('Category không tồn tại', 404);

      return category;
  }catch (error) {
      throw new AppError('Lỗi khi lấy chi tiết danh mục', 500);   
    }
};

exports.createCategory = async (dto) => {
  try {
    const existed = await Category.findOne({ where: { slug: dto.slug } });

    if (existed) throw new AppError('Slug đã tồn tại', 400);
        const category = await Category.create(dto);
        return category;
    }catch (error) {
      throw new AppError('Lỗi khi tạo danh mục', 500);
    }
};

exports.updateCategory = async (id, dto) => {
  const category = await exports.getCategoryById(id);

  if (dto.slug && dto.slug !== category.slug) {
    const existed = await Category.findOne({ where: { slug: dto.slug } });
    if (existed) throw new AppError('Slug đã tồn tại', 400);
  }

  await category.update(dto);
  return category;
};

exports.deleteCategory = async (id) => {
  const category = await exports.getCategoryById(id);
  await category.destroy();
  return true;
};