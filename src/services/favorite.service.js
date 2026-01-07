const { Favorite, Place } = require('../models');
const AppError = require('../utils/AppError');

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
