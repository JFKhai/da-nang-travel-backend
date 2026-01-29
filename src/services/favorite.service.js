const AppError = require('../utils/AppError.util');
const placeRepo = require('../repository/place.repo');
const favoriteRepo = require('../repository/favorite.repo');

exports.toggleFavorite = async ({ userId, place_id }) => {
  const place = await placeRepo.findById(place_id);
  if (!place) {
    throw new AppError('Địa điểm không tồn tại', 404);
  }

  const existed = await favoriteRepo.find({
    user_id: userId,
    place_id,
  });

  if (existed) {
    await favoriteRepo.delete(existed);
    return { is_favorited: false };
  }

  await favoriteRepo.create({
    user_id: userId,
    place_id,
  });

  return { is_favorited: true };
};

exports.getMyFavorites = async ({ userId }) => {
  const favorites = await favoriteRepo.findAllByUser(userId);
  return favorites.map((f) => f.place);
};
