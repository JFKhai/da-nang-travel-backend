const cloudinary = require('../config/cloudinary.config.js');
const uploadImageService = require('../services/upload.service.js');

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

module.exports = uploadImage;