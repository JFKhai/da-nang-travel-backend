const { sequelize } = require('../models');
const AppError = require('../utils/AppError.util');
const {
  uploadMultipleBuffersToCloudinary,
  deleteMultipleFromCloudinary,
} = require('../utils/cloudinaryUpload.util');

const placeRepo = require('../repository/place.repo');
const reviewRepo = require('../repository/review.repo');

exports.createReview = async ({ body, files, userId }) => {
  const transaction = await sequelize.transaction();
  try {
    const place = await placeRepo.findById(body.place_id);
    if (!place) throw new AppError('Địa điểm không tồn tại', 404);

    const review = await reviewRepo.createReview(
      { ...body, user_id: userId },
      { transaction }
    );

    if (files?.length) {
      const uploads = await uploadMultipleBuffersToCloudinary(files, 'images');
      await reviewRepo.createImages(
        uploads.map((u) => ({
          place_id: body.place_id,
          review_id: review.id,
          url: u.secure_url,
          public_id: u.public_id,
        })),
        { transaction }
      );
    }

    await transaction.commit();
    return review;
  } catch (e) {
    await transaction.rollback();
    throw e;
  }
};

exports.updateReview = async ({ reviewId, userId, body }) => {
  const review = await reviewRepo.findById(reviewId);
  if (!review) throw new AppError('Review không tồn tại', 404);
  if (review.user_id !== userId) throw new AppError('Forbidden', 403);

  return reviewRepo.update(review, body);
};

exports.deleteReview = async ({ reviewId, userId }) => {
  const transaction = await sequelize.transaction();
  try {
    const review = await reviewRepo.findById(reviewId, {
      include: ['images'],
      transaction,
    });

    if (!review) throw new AppError('Review không tồn tại', 404);
    if (review.user_id !== userId) throw new AppError('Forbidden', 403);

    await deleteMultipleFromCloudinary(
      review.images.map((i) => i.public_id)
    );

    await reviewRepo.deleteImagesByReviewId(reviewId, { transaction });
    await reviewRepo.delete(review, { transaction });

    await transaction.commit();
    return true;
  } catch (e) {
    await transaction.rollback();
    throw e;
  }
};

exports.listReviewsByPlace = async (placeId) => {
  return reviewRepo.listByPlace(placeId);
};
