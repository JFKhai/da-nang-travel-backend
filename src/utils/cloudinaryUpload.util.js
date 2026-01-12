const cloudinary = require('../config/cloudinary.config');
const AppError = require('./AppError.util');

const uploadBufferToCloudinary = (
  buffer,
  folder = 'uploads',
  resourceType = 'image'
) => {
  return new Promise((resolve, reject) => {
    if (!buffer) {
      return reject(new AppError('File buffer không tồn tại', 400));
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          return reject(
            new AppError('Upload Cloudinary thất bại', 500, error)
          );
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    stream.end(buffer);
  });
};

const uploadMultipleBuffersToCloudinary = async (
  files = [],
  folder = 'uploads'
) => {
  if (!files || files.length === 0) return [];

  const uploadPromises = files.map((file) =>
    uploadBufferToCloudinary(file.buffer, folder)
  );

  return Promise.all(uploadPromises);
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(error);
  }
};

const deleteMultipleFromCloudinary = async (publicIds = []) => {
  if (!publicIds.length) return;

  try {
    await cloudinary.api.delete_resources(publicIds);
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  uploadBufferToCloudinary,
  uploadMultipleBuffersToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
};
