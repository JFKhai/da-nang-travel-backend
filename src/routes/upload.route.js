const express = require('express');
const uploadImageController = require('../controllers/upload.controller.js');
const upload = require('../middleware/multer.middleware.js');

const router = express.Router();

router.post(
  "/",
  upload.single("image"),
  uploadImageController
);

module.exports = router;
