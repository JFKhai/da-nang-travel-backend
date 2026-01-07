const {
  uploadMultipleBuffersToCloudinary,
  deleteMultipleFromCloudinary,
} = require('../utils/cloudinaryUpload.util');

const { sequelize } = require('../models');
const Place = require('../models/Place');
const PlaceReview = require('../models/PlaceReview');
const PlaceImage = require('../models/PlaceImage');
const User = require('../models/User');
const AppError = require('../utils/AppError.util');

exports.createReview = async ({ body, files, userId }) => {
  const transaction = await sequelize.transaction();

  try {
    const { place_id, title, content, stars } = body;

    // 1️⃣ Validate
    if (!place_id || !stars) {
      throw new AppError('Thiếu place_id hoặc stars', 400);
    }

    // 2️⃣ Check place
    const place = await Place.findByPk(place_id);
    if (!place) {
      throw new AppError('Địa điểm không tồn tại', 404);
    }

    // 3️⃣ Create review
    const review = await PlaceReview.create(
      {
        place_id,
        title,
        content,
        stars,
        user_id: userId,
      },
      { transaction }
    );

    let images = [];

    // 4️⃣ Upload images (memoryStorage → buffer)
    if (files && files.length > 0) {
      const uploadResults = await uploadMultipleBuffersToCloudinary(
        files,
        'images'
      );

      const imagesData = uploadResults.map((img) => ({
        place_id,
        review_id: review.id,
        url: img.secure_url,
        public_id: img.public_id,
      }));

      images = await PlaceImage.bulkCreate(imagesData, {
        transaction,
      });
    }

    await transaction.commit();

    return { review, images };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

exports.updateReview = async ({ reviewId, userId, body }) => {
  const { title, content, stars } = body;

  if (!title && !content && !stars) {
    throw new AppError('Không có dữ liệu để cập nhật', 400);
  }

  const review = await PlaceReview.findByPk(reviewId);

  if (!review) {
    throw new AppError('Review không tồn tại', 404);
  }

  if (review.user_id !== userId) {
    throw new AppError('Bạn không có quyền sửa review này', 403);
  }

  await review.update({
    title: title ?? review.title,
    content: content ?? review.content,
    stars: stars ?? review.stars,
  });

  return review;
};



exports.deleteReview = async ({ reviewId, userId }) => {
  const transaction = await sequelize.transaction();

  try {
    const review = await PlaceReview.findByPk(reviewId, {
      include: [
        {
          model: PlaceImage,
          as: 'images',
        },
      ],
      transaction,
    });

    if (!review) {
      throw new AppError('Review không tồn tại', 404);
    }

    if (review.user_id !== userId) {
      throw new AppError('Bạn không có quyền xóa review này', 403);
    }

    const publicIds = review.images.map(
      (img) => img.public_id
    );

    await deleteMultipleFromCloudinary(publicIds);

    await PlaceImage.destroy({
      where: { review_id: reviewId },
      transaction,
    });

    await review.destroy({ transaction });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

exports.listReviewsByPlace = async (place_id) => {
  return await PlaceReview.findAll({
    where: { place_id },
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
};
