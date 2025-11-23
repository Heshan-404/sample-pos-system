const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');

// Get orders report (date range)
router.get('/orders', reportsController.generateOrdersReport);

// Get items sales report (specific date)
router.get('/items-sales', reportsController.generateItemsSalesReport);

module.exports = router;
