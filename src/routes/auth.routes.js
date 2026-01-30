const express = require('express');
const {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    adminGetUsers,
    adminUpdateUser
} = require('../controllers/auth.controller');

const jwtVerify = require('../middleware/jwtVerify.middleware');
const roleGuard = require('../middleware/roleGuard.middleware')
const upload = require('../middleware/multer.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', jwtVerify, getMe);
router.put('/me', jwtVerify, upload.uploadSingle, updateProfile);
router.put('/change-password', jwtVerify, changePassword);
router.get('/admin/users', jwtVerify, roleGuard('admin'), adminGetUsers);
router.put('/admin/users/:id', jwtVerify, roleGuard('admin'), adminUpdateUser);

module.exports = router;
