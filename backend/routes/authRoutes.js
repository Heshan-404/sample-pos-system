const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/login - Regular login (admin/cashier)
router.post('/login', authController.login);

// POST /api/auth/pin-login - PIN login (waiter)
router.post('/pin-login', authController.pinLogin);

// GET /api/auth/me - Get current user (protected route)
router.get('/me', authenticate, authController.getCurrentUser);

// POST /api/auth/logout - Logout
router.post('/logout', authenticate, authController.logout);

// POST /api/auth/verify-pin - Verify waiter PIN (no auth required)
router.post('/verify-pin', authController.verifyPin);

module.exports = router;
