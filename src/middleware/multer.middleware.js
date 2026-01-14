const multer = require('multer');

const storage = multer.memoryStorage();

const multerConfig = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB / file
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)');
      error.name = 'MulterError';
      return cb(error, false);
    }
    cb(null, true);
  },
});

module.exports = {
  uploadSingle: multerConfig.single('image'),
  uploadMultiple: multerConfig.array('images', 5),
};
