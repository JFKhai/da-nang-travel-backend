const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');

const jwtVerify = require('../middleware/jwtVerify.middleware');
const roleGuard = require('../middleware/roleGuard.middleware');

router.get(
    '/dashboard-stats',
    jwtVerify,
    roleGuard('admin'),
    adminController.getDashboardStats
);

module.exports = router;