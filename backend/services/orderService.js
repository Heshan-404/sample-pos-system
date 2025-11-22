const db = require('../db/database');

class OrderService {
    // Get or create an open order for a table
    getOrCreateOpenOrder(tableNumber) {
        // Check if there's an open order for this table
        const stmt = db.prepare(`
      SELECT * FROM orders 
      WHERE tableNumber = ? AND status = 'open'
      LIMIT 1
    `);

        let order = stmt.get(tableNumber);

        // If no open order exists, create one
        if (!order) {
            const insertStmt = db.prepare(`
        INSERT INTO orders (tableNumber, status) 
        VALUES (?, 'open')
      `);

            const result = insertStmt.run(tableNumber);
            order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
        }

        return order;
    }

    // Add item to order
    addItemToOrder(tableNumber, itemId, quantity) {
        const addItem = db.transaction((tableNum, itemId, qty) => {
            // Get or create open order
            const order = this.getOrCreateOpenOrder(tableNum);

            // Check if item already exists in the order
            const existingItem = db.prepare(`
        SELECT * FROM order_items 
        WHERE orderId = ? AND itemId = ?
      `).get(order.id, itemId);

            if (existingItem) {
                // Update quantity if item exists
                db.prepare(`
          UPDATE order_items 
          SET quantity = quantity + ?
          WHERE orderId = ? AND itemId = ?
        `).run(qty, order.id, itemId);
            } else {
                // Insert new item
                db.prepare(`
          INSERT INTO order_items (orderId, itemId, quantity)
          VALUES (?, ?, ?)
        `).run(order.id, itemId, qty);
            }

            return order;
        });

        return addItem(tableNumber, itemId, quantity);
    }

    // Get order details for a table
    getTableOrder(tableNumber) {
        // Get open order for the table
        const order = db.prepare(`
      SELECT * FROM orders 
      WHERE tableNumber = ? AND status = 'open'
      LIMIT 1
    `).get(tableNumber);

        if (!order) {
            return null;
        }

        // Get order items with item details
        const items = db.prepare(`
      SELECT 
        oi.id,
        oi.quantity,
        i.id as itemId,
        i.name,
        i.price,
        i.category,
        (oi.quantity * i.price) as subtotal
      FROM order_items oi
      JOIN items i ON oi.itemId = i.id
      WHERE oi.orderId = ?
    `).all(order.id);

        // Calculate total
        const total = items.reduce((sum, item) => sum + item.subtotal, 0);

        return {
            ...order,
            items,
            total
        };
    }

    // Finish order and generate bill
    finishOrder(tableNumber, discount = 0, serviceCharge = false) {
        const finish = db.transaction((tableNum, disc, svcCharge) => {
            // Get the open order
            const orderData = this.getTableOrder(tableNum);

            if (!orderData) {
                throw new Error('No open order found for this table');
            }

            // Calculate bill amounts
            const subtotal = orderData.total;
            const serviceChargeAmount = svcCharge ? subtotal * 0.10 : 0;
            const finalAmount = subtotal + serviceChargeAmount - disc;
            const closedAt = new Date().toISOString();

            // Save to orders_history
            const historyStmt = db.prepare(`
        INSERT INTO orders_history (
          orderId, tableNumber, subtotal, discount, 
          serviceCharge, serviceChargeAmount, finalAmount, closed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

            const historyResult = historyStmt.run(
                orderData.id,
                tableNum,
                subtotal,
                disc,
                svcCharge ? 1 : 0,
                serviceChargeAmount,
                finalAmount,
                closedAt
            );

            const historyId = historyResult.lastInsertRowid;

            // Save items to orders_history_items
            const historyItemStmt = db.prepare(`
        INSERT INTO orders_history_items (
          historyId, itemName, itemPrice, itemCategory, quantity, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

            for (const item of orderData.items) {
                historyItemStmt.run(
                    historyId,
                    item.name,
                    item.price,
                    item.category,
                    item.quantity,
                    item.subtotal
                );
            }

            // Close the order
            db.prepare(`
        UPDATE orders 
        SET status = 'closed', closed_at = ?
        WHERE id = ?
      `).run(closedAt, orderData.id);

            // Return final bill
            return {
                orderId: orderData.id,
                historyId: historyId,
                tableNumber: tableNum,
                items: orderData.items,
                subtotal: parseFloat(subtotal.toFixed(2)),
                serviceCharge: svcCharge,
                serviceChargeAmount: parseFloat(serviceChargeAmount.toFixed(2)),
                discount: parseFloat(disc.toFixed(2)),
                finalAmount: parseFloat(finalAmount.toFixed(2)),
                closedAt: closedAt
            };
        });

        return finish(tableNumber, discount, serviceCharge);
    }
    // Bulk update multiple order item quantities
    updateMultipleOrderItems(items) {
        const update = db.transaction((items) => {
            items.forEach(i => {
                db.prepare(`
                UPDATE order_items
                SET quantity = ?
                WHERE id = ?
            `).run(i.quantity, i.orderItemId);
            });
        });

        update(items);
        return { success: true };
    }

}

module.exports = new OrderService();
