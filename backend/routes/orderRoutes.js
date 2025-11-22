const express = require('express');
const { body, param } = require('express-validator');
const orderController = require('../controllers/orderController');

const router = express.Router();

// Validation middleware
const addItemValidation = [
    body('tableNumber')
        .notEmpty()
        .withMessage('Table number is required')
        .isInt({ min: 1, max: 30 })
        .withMessage('Table number must be between 1 and 30'),
    body('itemId')
        .notEmpty()
        .withMessage('Item ID is required')
        .isInt({ min: 1 })
        .withMessage('Item ID must be a valid integer'),
    body('quantity')
        .notEmpty()
        .withMessage('Quantity is required')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1')
];

const finishOrderValidation = [
    body('tableNumber')
        .notEmpty()
        .withMessage('Table number is required')
        .isInt({ min: 1, max: 30 })
        .withMessage('Table number must be between 1 and 30'),
    body('discount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Discount must be a positive number or zero'),
    body('serviceCharge')
        .optional()
        .isBoolean()
        .withMessage('Service charge must be a boolean')
];

// Routes
router.post('/add-item', addItemValidation, orderController.addItemToOrder.bind(orderController));
router.get('/:tableNumber', orderController.getTableOrder.bind(orderController));
router.post('/finish', finishOrderValidation, orderController.finishOrder.bind(orderController));

module.exports = router;
