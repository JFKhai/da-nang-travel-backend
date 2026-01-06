const express = require('express');
const {uploadImage, createReview} = require('../controllers/upload.controller.js');
const upload = require('../middleware/multer.middleware.js');

const router = express.Router();

router.post(
  "/",
  upload.single("image"),
  uploadImage
);


router.post(
  '/reviews',
  upload.array('images', 5), // tối đa 5 ảnh
  createReview
);

module.exports = router;
