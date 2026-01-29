const { Favorite, Place, PlaceImage, Category } = require('../models');

exports.find = (where) => {
  return Favorite.findOne({ where });
};

exports.create = (data) => {
  return Favorite.create(data);
};

exports.delete = (favorite) => {
  return favorite.destroy();
};

exports.findAllByUser = (userId) => {
  return Favorite.findAll({
    where: { user_id: userId },
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
};
