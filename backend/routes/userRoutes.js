const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// All user routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// GET /api/users - List all users
router.get('/', userController.getUsers);

// POST /api/users - Create new user
router.post('/', userController.createUser);

// PUT /api/users/:id - Update user
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', userController.deleteUser);

// PUT /api/users/:id/toggle - Toggle user active status
router.put('/:id/toggle', userController.toggleUserStatus);

module.exports = router;
