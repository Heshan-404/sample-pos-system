const express = require('express');
const router = express.Router();
const kotBotController = require('../controllers/kotBotController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// POST /api/kot-bot/send - Send order to KOT/BOT
router.post('/send', kotBotController.sendOrder);

// GET /api/kot-bot/history - Get KOT/BOT history
router.get('/history', kotBotController.getHistory);

module.exports = router;
