const express = require('express');
const printController = require('../controllers/printController');

const router = express.Router();

// Print receipt for a completed order
router.post('/receipt/:historyId', printController.printReceipt.bind(printController));

// Download PDF receipt
router.get('/pdf/:historyId', printController.downloadPDF.bind(printController));

// Get draft bill for current table order
router.get('/draft-bill/:tableNumber', printController.getDraftBill.bind(printController));

module.exports = router;
