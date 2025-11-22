const db = require('../db/database');

class HistoryService {
    // Get all order history
    getAllHistory() {
        const history = db.prepare(`
      SELECT * FROM orders_history 
      ORDER BY closed_at DESC
    `).all();

        // Get items for each history entry
        for (const record of history) {
            const items = db.prepare(`
        SELECT * FROM orders_history_items 
        WHERE historyId = ?
      `).all(record.id);
            record.items = items;
        }

        return history;
    }

    // Get history for a specific table
    getHistoryByTable(tableNumber) {
        const history = db.prepare(`
      SELECT * FROM orders_history 
      WHERE tableNumber = ?
      ORDER BY closed_at DESC
    `).all(tableNumber);

        // Get items for each history entry
        for (const record of history) {
            const items = db.prepare(`
        SELECT * FROM orders_history_items 
        WHERE historyId = ?
      `).all(record.id);
            record.items = items;
        }

        return history;
    }

    // Get a specific history record
    getHistoryById(id) {
        const record = db.prepare(`
      SELECT * FROM orders_history 
      WHERE id = ?
    `).get(id);

        if (!record) {
            return null;
        }

        const items = db.prepare(`
      SELECT * FROM orders_history_items 
      WHERE historyId = ?
    `).all(id);

        record.items = items;
        return record;
    }
}

module.exports = new HistoryService();
