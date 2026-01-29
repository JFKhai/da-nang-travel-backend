const favoriteService = require('../services/favorite.service');

exports.toggleFavorite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { place_id } = req.body;

    const result = await favoriteService.toggleFavorite({
      userId,
      place_id,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const places = await favoriteService.getMyFavorites({ userId });

    res.status(200).json({
      success: true,
      data: places,
    });
  } catch (error) {
    next(error);
  }
};
