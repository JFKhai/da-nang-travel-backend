const cloudinary = require('../config/cloudinary.config.js');
const {uploadImageService, createReviewS} = require('../services/upload.service.js');

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await uploadImageService(req.file.path);

    res.status(200).json({
      message: "Upload successful",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Upload failed",
      error: error.message,
    });
  }
};

const createReview = async (req, res) => {
  try {
    const userId = req.user.id; // lấy từ middleware auth
    const data = await createReviewS({
      body: req.body,
      files: req.files,
      userId,
    });

    return res.status(201).json({
      message: 'Create review success',
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || 'Create review failed',
    });
  }
};

module.exports = {
  uploadImage,
  createReview
};