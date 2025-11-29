const { validationResult } = require('express-validator');
const itemService = require('../services/itemService');

class ItemController {
    // GET /items - Return all items (no filtering)
    getAllItems(req, res) {
        try {
            const items = itemService.getAllItems();
            res.json({
                success: true,
                data: items
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // POST /items - Create new item
    createItem(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { name, price, category, subcategoryId } = req.body;
            const item = itemService.createItem(name, price, category, subcategoryId || null);

            res.status(201).json({
                success: true,
                data: item
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // PUT /items/:id/toggle - Toggle item status
    toggleItemStatus(req, res) {
        try {
            const { id } = req.params;
            const item = itemService.toggleItemStatus(id);

            res.json({
                success: true,
                data: item
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new ItemController();
