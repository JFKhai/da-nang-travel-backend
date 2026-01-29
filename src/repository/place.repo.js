const { Place, PlaceImage, Category } = require('../models');

exports.findById = (id, options = {}) => {
  return Place.findByPk(id, options);
};

exports.findByIdWithRelations = (id) => {
  return Place.findByPk(id, {
    include: [
      {
        model: PlaceImage,
        as: 'images',
      },
      {
        model: Category,
        as: 'categories',
        through: { attributes: [] },
      },
    ],
  });
};

exports.create = (data, options = {}) => {
  return Place.create(data, options);
};

exports.update = (place, data) => {
  return place.update(data);
};

exports.delete = (place, options = {}) => {
  return place.destroy(options);
};
