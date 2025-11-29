const db = require('../db/database');

class HistoryService {
  // Get all order history
  getAllHistory() {
    const history = db.prepare(`
            SELECT 
                COALESCE(orderId, id) as id,
                orderId,
                tableNumber,
                SUM(finalAmount) as finalAmount,
                MAX(closed_at) as closed_at
            FROM orders_history 
            GROUP BY COALESCE(orderId, id)
            ORDER BY closed_at DESC
        `).all();

    // Note: We don't fetch items here for performance, as the list view doesn't need them.
    // Items are fetched in getHistoryById when viewing details.

    return history;
  }

  // Get history for a specific table
  getHistoryByTable(tableNumber) {
    const history = db.prepare(`
            SELECT 
                COALESCE(orderId, id) as id,
                orderId,
                tableNumber,
                SUM(finalAmount) as finalAmount,
                MAX(closed_at) as closed_at
            FROM orders_history 
            WHERE tableNumber = ?
            GROUP BY COALESCE(orderId, id)
            ORDER BY closed_at DESC
        `).all(tableNumber);

    return history;
  }

  // Get a specific history record (merged by orderId)
  getHistoryById(id) {
    // Try to fetch by orderId first (assuming id passed is orderId)
    let records = db.prepare(`
            SELECT * FROM orders_history 
            WHERE orderId = ?
        `).all(id);

    // If no records found by orderId, try by id (legacy records where orderId might be null)
    if (records.length === 0) {
      records = db.prepare(`
                SELECT * FROM orders_history 
                WHERE id = ?
            `).all(id);
    }

    if (!records || records.length === 0) {
      return null;
    }

    // Merge records
    const mergedRecord = {
      id: id,
      orderId: records[0].orderId || id, // Fallback to id if orderId is null
      tableNumber: records[0].tableNumber,
      finalAmount: records.reduce((sum, r) => sum + r.finalAmount, 0),
      subtotal: records.reduce((sum, r) => sum + r.subtotal, 0),
      discount: records.reduce((sum, r) => sum + r.discount, 0),
      serviceChargeAmount: records.reduce((sum, r) => sum + r.serviceChargeAmount, 0),
      closed_at: records[records.length - 1].closed_at, // Use latest date
      items: []
    };

    // Fetch items for ALL historyIds associated with this order
    const historyIds = records.map(r => r.id);
    const placeholders = historyIds.map(() => '?').join(',');

    const items = db.prepare(`
            SELECT * FROM orders_history_items 
            WHERE historyId IN (${placeholders})
        `).all(...historyIds);

    mergedRecord.items = items;
    return mergedRecord;
  }
}

module.exports = new HistoryService();
