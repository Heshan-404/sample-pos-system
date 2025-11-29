const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');

router.get('/', shopController.getAllShops.bind(shopController));
router.post('/', shopController.createShop.bind(shopController));

module.exports = router;
