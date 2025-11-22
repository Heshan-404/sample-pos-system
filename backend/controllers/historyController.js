const historyService = require('../services/historyService');

class HistoryController {
    // GET /history - Get all order history
    getAllHistory(req, res) {
        try {
            const history = historyService.getAllHistory();
            res.json({
                success: true,
                data: history
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // GET /history/table/:tableNumber - Get history for a specific table
    getHistoryByTable(req, res) {
        try {
            const { tableNumber } = req.params;
            const history = historyService.getHistoryByTable(parseInt(tableNumber));
            res.json({
                success: true,
                data: history
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // GET /history/:id - Get specific history record
    getHistoryById(req, res) {
        try {
            const { id } = req.params;
            const record = historyService.getHistoryById(parseInt(id));

            if (!record) {
                return res.status(404).json({
                    success: false,
                    error: 'History record not found'
                });
            }

            res.json({
                success: true,
                data: record
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new HistoryController();
