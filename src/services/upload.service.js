const cloudinary = require("../config/cloudinary.config");

const uploadImageService = async (filePath) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "uploads",
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

const createReviewS = async ({ body, files, userId }) => {
  const transaction = await sequelize.transaction();

  try {
    const { place_id, title, content, stars } = body;

    // 1️⃣ Tạo review
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

    // 2️⃣ Nếu có ảnh → upload cloudinary
    if (files && files.length > 0) {
      const imagesData = [];

      for (const file of files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'reviews',
        });

        imagesData.push({
          place_id,
          review_id: review.id,
          url: result.secure_url,
        });
      }

      // 3️⃣ Lưu DB
      await PlaceImage.bulkCreate(imagesData, { transaction });
    }

    await transaction.commit();
    return review;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  uploadImageService,
  createReviewS
};