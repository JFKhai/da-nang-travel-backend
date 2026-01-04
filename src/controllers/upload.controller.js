const { success } = require('../utils/response');
const AppError = require('../utils/AppError');
const {
  uploadImageService,
  createReviewS
} = require('../services/upload.service');

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Không có file upload', 400);
    }

    const result = await uploadImageService(req.file.path);

    res.status(200).send(
      success(result, 'Upload ảnh thành công')
    );
  } catch (err) {
    next(err);
  }
};

exports.createReview = async (req, res, next) => {
  try {
    const userId = req.user.id; // từ jwtVerify middleware

    const data = await createReviewS({
      body: req.body,
      files: req.files,
      userId
    });

    res.status(201).send(
      success(data, 'Tạo review thành công')
    );
  } catch (err) {
    next(err);
  }
};
