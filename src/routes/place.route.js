const express = require('express');
const {
  getPlaces,
  getPlaceById,
  createPlace,
  updatePlace,
  softDeletePlace,
} = require('../controllers/place.controller');
const jwtVerify = require('../middleware/jwtVerify.middleware');
const roleGuard = require('../middleware/roleGuard.middleware');
const upload = require('../middleware/multer.middleware');

const router = express.Router();

// Public: Get all places with pagination (search, filter, sort)
router.get('/', getPlaces);

// Public: Get place by ID
router.get('/:id', getPlaceById);

// Admin only: Create place
router.post(
  '/',
  jwtVerify,
  roleGuard('admin'),
  upload.uploadMultiple,
  createPlace
);

// Admin only: Update place
router.put(
  '/:id',
  jwtVerify,
  roleGuard('admin'),
  upload.uploadMultiple,
  updatePlace
);

// Admin only: Soft delete place
router.delete('/:id', jwtVerify, roleGuard('admin'), softDeletePlace);

module.exports = router;
