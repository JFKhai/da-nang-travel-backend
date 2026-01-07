const express = require('express');
const reviewController = require('../controllers/review.controller');
const jwtVerify = require('../middleware/jwtVerify.middleware');
const upload = require('../middleware/multer.middleware');

const router = express.Router();

router.post(
  '/',
  jwtVerify,
  upload.uploadMultiple,
  reviewController.createReview
);

router.put(
  '/:id',
  jwtVerify,
  reviewController.updateReview
);

router.delete(
  '/:id',
  jwtVerify,
  reviewController.deleteReview
);

module.exports = router;
