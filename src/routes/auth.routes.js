const express = require('express');
const {register, login, getMe, updateProfile, changePassword} = require('../controllers/auth.controller');
const jwtVerify = require('../middleware/jwtVerify.middleware');
const upload = require('../middleware/multer.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', jwtVerify, getMe);
router.put('/me', jwtVerify, upload.single('avatar'), updateProfile);
router.put('/change-password', jwtVerify, changePassword);


module.exports = router;
