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
                closedAt: history.closed_at
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
                closedAt: history.closed_at
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
}

module.exports = new PrintController();
