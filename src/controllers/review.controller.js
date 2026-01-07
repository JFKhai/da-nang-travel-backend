const reviewService = require('../services/review.service');
const { success } = require('../utils/response.util');

exports.createReview = async (req, res, next) => {
  try {
    const result = await reviewService.createReview({
      body: req.body,
      files: req.files,
      userId: req.user.id,
    });

    res.status(201).send(
      success(result, 'Tạo review thành công')
    );
  } catch (err) {
    next(err);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.id;

    const result = await reviewService.updateReview({
      reviewId,
      userId,
      body: req.body,
    });

    res.status(200).send(
      success(result, 'Cập nhật review thành công')
    );
  } catch (err) {
    next(err);
  }
};


exports.deleteReview = async (req, res, next) => {
  try {
    await reviewService.deleteReview({
      reviewId: req.params.id,
      userId: req.user.id,
    });

    res.status(200).send(
      success(null, 'Xóa review thành công')
    );
  } catch (err) {
    next(err);
  }
};

