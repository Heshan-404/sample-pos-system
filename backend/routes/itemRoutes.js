const express = require('express');
const { body } = require('express-validator');
const itemController = require('../controllers/itemController');

const router = express.Router();

// Validation middleware for creating items
const createItemValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('price')
        .notEmpty()
        .withMessage('Price is required')
        .isFloat({ min: 0.01 })
        .withMessage('Price must be a positive number'),
    body('category')
        .notEmpty()
        .withMessage('Category is required')
        .isIn(['BOT', 'KOT'])
        .withMessage('Category must be either BOT or KOT')
];

// Routes
router.get('/', itemController.getAllItems.bind(itemController));
router.post('/', createItemValidation, itemController.createItem.bind(itemController));
router.put('/:id/toggle', itemController.toggleItemStatus.bind(itemController));

module.exports = router;
