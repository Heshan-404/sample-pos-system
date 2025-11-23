const express = require('express');
const router = express.Router();
const subcategoriesController = require('../controllers/subcategoriesController');

// Get all subcategories
router.get('/', subcategoriesController.getAllSubcategories);

// Get subcategories by main category (KOT or BOT)
router.get('/category/:category', subcategoriesController.getSubcategoriesByCategory);

// Create a new subcategory
router.post('/', subcategoriesController.createSubcategory);

// Update a subcategory
router.put('/:id', subcategoriesController.updateSubcategory);

// Delete a subcategory
router.delete('/:id', subcategoriesController.deleteSubcategory);

module.exports = router;
