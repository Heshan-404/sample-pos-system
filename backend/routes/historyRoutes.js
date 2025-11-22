const express = require('express');
const historyController = require('../controllers/historyController');

const router = express.Router();

// Routes
router.get('/', historyController.getAllHistory.bind(historyController));
router.get('/table/:tableNumber', historyController.getHistoryByTable.bind(historyController));
router.get('/:id', historyController.getHistoryById.bind(historyController));

module.exports = router;
