const { validationResult } = require('express-validator');
const orderService = require('../services/orderService');

class OrderController {
    // POST /orders/add-item - Add item to table order
    addItemToOrder(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { tableNumber, itemId, quantity } = req.body;
            const order = orderService.addItemToOrder(tableNumber, itemId, quantity);

            res.json({
                success: true,
                message: 'Item added to order',
                data: order
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // GET /orders/:tableNumber - Get order details for a table
    getTableOrder(req, res) {
        try {
            const { tableNumber } = req.params;
            const order = orderService.getTableOrder(parseInt(tableNumber));

            if (!order) {
                return res.json({
                    success: true,
                    data: null,
                    message: 'No open order for this table'
                });
            }

            res.json({
                success: true,
                data: order
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // POST /orders/finish - Finish order and generate bill
    async finishOrder(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        try {
            const { tableNumber, discount = 0, serviceCharge = false } = req.body;
            const bill = orderService.finishOrder(tableNumber, discount, serviceCharge);

            res.json({
                success: true,
                data: bill
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    // PUT /orders/update-item/:orderItemId - Update order item quantity
    updateOrderItemQuantity(req, res) {
        try {
            const { orderItemId } = req.params;
            const { quantity } = req.body;

            if (!quantity || quantity < 1) {
                return res.status(400).json({
                    success: false,
                    error: 'Quantity must be at least 1'
                });
            }

            const result = orderService.updateOrderItemQuantity(parseInt(orderItemId), parseInt(quantity));

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // DELETE /orders/remove-item/:orderItemId - Remove order item
    removeOrderItem(req, res) {
        try {
            const { orderItemId } = req.params;
            const result = orderService.removeOrderItem(parseInt(orderItemId));

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new OrderController();
