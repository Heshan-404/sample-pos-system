const { validationResult } = require('express-validator');
const db = require('../db/database');
const printService = require('../services/printService');

class PrintController {
    // POST /print/receipt/:historyId - Print a receipt for a completed order
    async printReceipt(req, res) {
        try {
            const { historyId } = req.params;

            // Get the order history
            const history = db.prepare(`
                SELECT * FROM orders_history WHERE id = ?
            `).get(historyId);

            if (!history) {
                return res.status(404).json({
                    success: false,
                    error: 'Order history not found'
                });
            }

            // Get the items
            const items = db.prepare(`
                SELECT * FROM orders_history_items WHERE historyId = ?
            `).all(historyId);

            // Prepare bill data for printing
            const billData = {
                tableNumber: history.tableNumber,
                items: items,
                subtotal: history.subtotal,
                discount: history.discount,
                serviceCharge: history.serviceCharge === 1,
                serviceChargeAmount: history.serviceChargeAmount,
                finalAmount: history.finalAmount,
                closedAt: history.closed_at,
                paymentMethod: history.paymentMethod || 'CASH',
                additionalItems: history.additionalItems || ''
            };

            // Send print job
            const printResult = await printService.sendPrintJob(req.app, billData);

            res.json({
                success: true,
                message: 'Print job sent successfully',
                data: printResult
            });

        } catch (error) {
            console.error('Print error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // GET /print/pdf/:historyId - Download PDF receipt
    async downloadPDF(req, res) {
        try {
            const { historyId } = req.params;

            // Get the order history
            const history = db.prepare(`
                SELECT * FROM orders_history WHERE id = ?
            `).get(historyId);

            if (!history) {
                return res.status(404).json({
                    success: false,
                    error: 'Order history not found'
                });
            }

            // Get the items
            const items = db.prepare(`
                SELECT * FROM orders_history_items WHERE historyId = ?
            `).all(historyId);

            // Prepare bill data
            const billData = {
                tableNumber: history.tableNumber,
                items: items,
                subtotal: history.subtotal,
                discount: history.discount,
                serviceCharge: history.serviceCharge === 1,
                serviceChargeAmount: history.serviceChargeAmount,
                finalAmount: history.finalAmount,
                closedAt: history.closed_at,
                paymentMethod: history.paymentMethod || 'CASH',
                additionalItems: history.additionalItems || ''
            };

            // Generate PDF
            const pdfBuffer = await printService.generatePDFReceipt(billData);

            // Send PDF as download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=receipt-${historyId}.pdf`);
            res.send(pdfBuffer);

        } catch (error) {
            console.error('PDF generation error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // GET /print/draft-bill/:tableNumber - Get draft bill for current table order
    async getDraftBill(req, res) {
        try {
            const { tableNumber } = req.params;

            // Get current order for this table
            const order = db.prepare(`
                SELECT * FROM orders WHERE tableNumber = ?
            `).get(tableNumber);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    error: 'No active order for this table'
                });
            }

            // Get order items
            const items = db.prepare(`
                SELECT oi.*, i.name, i.price 
                FROM order_items oi
                LEFT JOIN items i ON oi.itemId = i.id
                WHERE oi.tableNumber = ?
            `).all(tableNumber);

            if (!items || items.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'No items in order'
                });
            }

            // Calculate totals
            const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const serviceChargeAmount = subtotal * 0.10; // 10% service charge
            const finalAmount = subtotal + serviceChargeAmount;

            // Prepare draft bill data
            const draftData = {
                tableNumber,
                items: items.map(item => ({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })),
                subtotal,
                discount: 0,
                serviceCharge: true,
                serviceChargeAmount,
                finalAmount,
                isDraft: true,
                closedAt: new Date().toISOString()
            };

            // Generate PDF
            const pdfBuffer = await printService.generateReceiptPDF(draftData);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=draft-bill-table-${tableNumber}.pdf`);
            res.send(pdfBuffer);

        } catch (error) {
            console.error('Draft bill error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new PrintController();
