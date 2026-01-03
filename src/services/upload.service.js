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

module.exports = uploadImageService;
