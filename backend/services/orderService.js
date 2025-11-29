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
    addItemToOrder(tableNumber, itemId, quantity, userId = null, userName = null, batchId = null) {
        const addItem = db.transaction((tableNum, itemId, qty, uId, uName, bId) => {
            // Get or create open order
            const order = this.getOrCreateOpenOrder(tableNum);

            // Check if item already exists in the order AND batch
            let existingItem;
            if (bId) {
                existingItem = db.prepare(`
                    SELECT * FROM order_items 
                    WHERE orderId = ? AND itemId = ? AND batch_id = ?
                `).get(order.id, itemId, bId);
            } else {
                // Fallback for legacy/single item add without batch
                existingItem = db.prepare(`
                    SELECT * FROM order_items 
                    WHERE orderId = ? AND itemId = ? AND batch_id IS NULL
                `).get(order.id, itemId);
            }

            if (existingItem) {
                // Update quantity if item exists in same batch
                db.prepare(`
                  UPDATE order_items 
                  SET quantity = quantity + ?
                  WHERE id = ?
                `).run(qty, existingItem.id);
            } else {
                // Insert new item
                const addedAt = new Date().toISOString();
                db.prepare(`
                  INSERT INTO order_items (orderId, itemId, quantity, added_by_user_id, added_by_name, batch_id, added_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?)
                `).run(order.id, itemId, qty, uId, uName, bId, addedAt);
            }

            return order;
        });

        return addItem(tableNumber, itemId, quantity, userId, userName, batchId);
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
        oi.added_by_name,
        oi.added_at,
        oi.batch_id,
        i.id as itemId,
        i.name,
        i.price,
        i.category,
        (oi.quantity * i.price) as subtotal
      FROM order_items oi
      JOIN items i ON oi.itemId = i.id
      WHERE oi.orderId = ?
      ORDER BY oi.added_at ASC
    `).all(order.id);

        // Calculate total
        const total = items.reduce((sum, item) => sum + item.subtotal, 0);

        return {
            ...order,
            items,
            total
        };
    }

    // Finish partial order (or full order if all items selected)
    finishPartialOrder(tableNumber, itemsToPay, discount = 0, serviceCharge = false, paymentMethod = 'CASH', additionalItems = '') {
        const finish = db.transaction((tableNum, itemsPay, disc, svcCharge, payMethod, addItems) => {
            // Get the open order
            const orderData = this.getTableOrder(tableNum);
            if (!orderData) throw new Error('No open order found for this table');

            // Validate items and calculate subtotal
            let subtotal = 0;
            const itemsToProcess = [];

            for (const payItem of itemsPay) {
                const originalItem = orderData.items.find(i => i.id === payItem.orderItemId);
                if (!originalItem) throw new Error(`Item not found in order: ${payItem.orderItemId}`);
                if (payItem.quantity > originalItem.quantity) throw new Error(`Invalid quantity for item: ${originalItem.name}`);

                const itemSubtotal = originalItem.price * payItem.quantity;
                subtotal += itemSubtotal;

                itemsToProcess.push({
                    ...originalItem,
                    payQuantity: payItem.quantity,
                    paySubtotal: itemSubtotal
                });
            }

            // Calculate bill amounts
            const serviceChargeAmount = svcCharge ? subtotal * 0.10 : 0;
            const finalAmount = subtotal + serviceChargeAmount - disc;
            const closedAt = new Date().toISOString();

            // Save to orders_history
            const historyStmt = db.prepare(`
                INSERT INTO orders_history (
                  orderId, tableNumber, subtotal, discount, 
                  serviceCharge, serviceChargeAmount, finalAmount, closed_at,
                  paymentMethod, additionalItems
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const historyResult = historyStmt.run(
                orderData.id, tableNum, subtotal, disc, svcCharge ? 1 : 0,
                serviceChargeAmount, finalAmount, closedAt, payMethod, addItems
            );
            const historyId = historyResult.lastInsertRowid;

            // Save items to orders_history_items
            const historyItemStmt = db.prepare(`
                INSERT INTO orders_history_items (
                  historyId, itemName, itemPrice, itemCategory, quantity, subtotal,
                  added_by_name, added_at, batch_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const updateQtyStmt = db.prepare("UPDATE order_items SET quantity = quantity - ? WHERE id = ?");
            const deleteItemStmt = db.prepare("DELETE FROM order_items WHERE id = ?");

            for (const item of itemsToProcess) {
                // Add to history
                historyItemStmt.run(
                    historyId, item.name, item.price, item.category,
                    item.payQuantity, item.paySubtotal,
                    item.added_by_name, item.added_at, item.batch_id
                );

                // Update original order
                if (item.payQuantity === item.quantity) {
                    deleteItemStmt.run(item.id);
                } else {
                    updateQtyStmt.run(item.payQuantity, item.id);
                }
            }

            // Check if order is empty
            const remainingItems = db.prepare("SELECT count(*) as count FROM order_items WHERE orderId = ?").get(orderData.id);
            if (remainingItems.count === 0) {
                db.prepare("UPDATE orders SET status = 'closed', closed_at = ? WHERE id = ?").run(closedAt, orderData.id);
            }

            return {
                orderId: orderData.id,
                historyId: historyId,
                tableNumber: tableNum,
                items: itemsToProcess.map(i => ({
                    name: i.name,
                    quantity: i.payQuantity,
                    subtotal: i.paySubtotal,
                    price: i.price
                })),
                subtotal: parseFloat(subtotal.toFixed(2)),
                serviceCharge: svcCharge,
                serviceChargeAmount: parseFloat(serviceChargeAmount.toFixed(2)),
                discount: parseFloat(disc.toFixed(2)),
                finalAmount: parseFloat(finalAmount.toFixed(2)),
                closedAt: closedAt
            };
        });

        return finish(tableNumber, itemsToPay, discount, serviceCharge, paymentMethod, additionalItems);
    }

    // Finish full order (wrapper for finishPartialOrder)
    finishOrder(tableNumber, discount = 0, serviceCharge = false, paymentMethod = 'CASH', additionalItems = '') {
        const orderData = this.getTableOrder(tableNumber);
        if (!orderData) throw new Error('No open order found for this table');

        const itemsToPay = orderData.items.map(i => ({
            orderItemId: i.id,
            quantity: i.quantity
        }));

        return this.finishPartialOrder(tableNumber, itemsToPay, discount, serviceCharge, paymentMethod, additionalItems);
    }

    // Update single order item quantity
    updateOrderItemQuantity(orderItemId, quantity) {
        const stmt = db.prepare(`
            UPDATE order_items
            SET quantity = ?
            WHERE id = ?
        `);
        stmt.run(quantity, orderItemId);
        return { success: true, message: 'Order item updated' };
    }

    // Remove order item
    removeOrderItem(orderItemId) {
        const stmt = db.prepare(`
            DELETE FROM order_items
            WHERE id = ?
        `);
        stmt.run(orderItemId);
        return { success: true, message: 'Order item removed' };
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
