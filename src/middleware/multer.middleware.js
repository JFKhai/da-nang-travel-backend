const multer = require('multer');

const storage = multer.memoryStorage();

const multerConfig = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB / file
  },
});

module.exports = {
  uploadSingle: multerConfig.single('image'),
  uploadMultiple: multerConfig.array('images', 5),
};
