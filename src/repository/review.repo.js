const { PlaceReview, PlaceImage, User } = require('../models');

exports.createReview = (data, options = {}) =>
  PlaceReview.create(data, options);

exports.findById = (id, options = {}) =>
  PlaceReview.findByPk(id, options);

exports.update = (review, data) =>
  review.update(data);

exports.delete = (review, options = {}) =>
  review.destroy(options);

exports.createImages = (data, options = {}) =>
  PlaceImage.bulkCreate(data, options);

exports.deleteImagesByReviewId = (reviewId, options = {}) =>
  PlaceImage.destroy({
    where: { review_id: reviewId },
    ...options,
  });

exports.listByPlace = (placeId) =>
  PlaceReview.findAll({
    where: { place_id: placeId },
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'full_name', 'avatar_url'],
      },
      {
        model: PlaceImage,
        as: 'images',
        attributes: ['id', 'url', 'caption', 'sort_order'],
      },
    ],
    order: [['created_at', 'DESC']],
  });
