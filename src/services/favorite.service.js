const { Favorite, Place, PlaceImage, Category } = require('../models');
const AppError = require('../utils/AppError.util');

exports.toggleFavorite = async ({ userId, place_id }) => {
  // 1. Check place tồn tại
  const place = await Place.findByPk(place_id);
  if (!place) {
    throw new AppError('Địa điểm không tồn tại', 404);
  }

  // 2. Check favorite đã tồn tại chưa
  const existed = await Favorite.findOne({
    where: {
      user_id: userId,
      place_id,
    },
  });

  // 3. Toggle
  if (existed) {
    await existed.destroy();
    return {
      is_favorited: false,
      message: 'Đã bỏ khỏi danh sách yêu thích',
    };
  }

  await Favorite.create({
    user_id: userId,
    place_id,
  });

  return {
    is_favorited: true,
    message: 'Đã thêm vào danh sách yêu thích',
  };
};


exports.getMyFavorites = async ({ userId }) => {
  const favorites = await Favorite.findAll({
    where: {
      user_id: userId,
    },
    include: [
      {
        model: Place,
        as: 'place',
        include: [
          {
            model: PlaceImage,
            as: 'coverImage',
            attributes: ['id', 'url'],
          },
          {
            model: Category,
            as: 'categories',
            attributes: ['id', 'name', 'slug'],
            through: { attributes: [] },
          },
        ],
      },
    ],
    order: [['created_at', 'DESC']],
  });

  // chỉ trả về place
  return favorites.map((fav) => fav.place);
};