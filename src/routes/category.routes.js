const express = require('express');
const categoryController = require('../controllers/category.controller');
const jwtVerify = require('../middleware/jwtVerify.middleware');
const roleGuard = require('../middleware/roleGuard.middleware');

const router = express.Router();

router.get('/', categoryController.listCategories);
router.get('/:id', categoryController.getCategoryById);

router.post('/', jwtVerify, roleGuard('admin'), categoryController.createCategory);
router.put('/:id', jwtVerify, roleGuard('admin'), categoryController.updateCategory);
router.delete('/:id', jwtVerify, roleGuard('admin'), categoryController.deleteCategory);

module.exports = router;