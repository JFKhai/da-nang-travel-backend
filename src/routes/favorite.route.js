const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favorite.controller');
const jwtVerify = require('../middleware/jwtVerify.middleware');

router.post('/toggle', jwtVerify, favoriteController.toggleFavorite);
router.get('/me', jwtVerify, favoriteController.getMyFavorites);

module.exports = router;
