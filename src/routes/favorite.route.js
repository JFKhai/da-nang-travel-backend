const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favorite.controller');
const auth = require('../middlewares/auth');

router.post('/toggle', auth, favoriteController.toggleFavorite);

module.exports = router;
