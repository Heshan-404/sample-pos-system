const db = require('../db/database');

class KOTBOTController {
    // POST /api/kot-bot/send - Send order to KOT and/or BOT
    async sendOrder(req, res) {
        try {
            const { tableNumber, items, waiterId, cashierId } = req.body;

            if (!tableNumber || !items || items.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Table number and items are required'
                });
            }

            // Separate items by category (KOT vs BOT)
            const kotItems = [];
            const botItems = [];

            // Get item details from database
            for (const orderItem of items) {
                const item = db.prepare(`
                    SELECT id, name, price, category 
                    FROM items 
                    WHERE id = ?
                `).get(orderItem.itemId);

                if (item) {
                    const itemWithQty = {
                        ...item,
                        quantity: orderItem.quantity,
                        notes: orderItem.notes || ''
                    };

                    if (item.category === 'KOT') {
                        kotItems.push(itemWithQty);
                    } else if (item.category === 'BOT') {
                        botItems.push(itemWithQty);
                    }
                }
            }

            const results = {
                kot: null,
                bot: null
            };

            // Create KOT if there are KOT items
            if (kotItems.length > 0) {
                const kotResult = db.prepare(`
                    INSERT INTO kot_history (order_id, table_number, waiter_id, items, printed_by)
                    VALUES (?, ?, ?, ?, ?)
                `).run(
                    0, // We'll link to order later if needed
                    tableNumber,
                    waiterId || null,
                    JSON.stringify(kotItems),
                    cashierId || req.user?.id || null
                );

                results.kot = {
                    id: kotResult.lastInsertRowid,
                    itemCount: kotItems.length,
                    items: kotItems
                };
            }

            // Create BOT if there are BOT items
            if (botItems.length > 0) {
                const botResult = db.prepare(`
                    INSERT INTO bot_history (order_id, table_number, waiter_id, items, printed_by)
                    VALUES (?, ?, ?, ?, ?)
                `).run(
                    0,
                    tableNumber,
                    waiterId || null,
                    JSON.stringify(botItems),
                    cashierId || req.user?.id || null
                );

                results.bot = {
                    id: botResult.lastInsertRowid,
                    itemCount: botItems.length,
                    items: botItems
                };
            }

            // Send to printers
            const printService = require('../services/printService');

            if (results.kot) {
                try {
                    await printService.printKOT(req.app, {
                        kotId: results.kot.id,
                        tableNumber,
                        items: kotItems,
                        waiterName: waiterId ? this.getWaiterName(waiterId) : 'N/A',
                        timestamp: new Date()
                    });
                } catch (error) {
                    console.error('KOT print error:', error);
                }
            }

            if (results.bot) {
                try {
                    await printService.printBOT(req.app, {
                        botId: results.bot.id,
                        tableNumber,
                        items: botItems,
                        waiterName: waiterId ? this.getWaiterName(waiterId) : 'N/A',
                        timestamp: new Date()
                    });
                } catch (error) {
                    console.error('BOT print error:', error);
                }
            }

            res.json({
                success: true,
                message: 'Order sent successfully',
                data: results
            });

        } catch (error) {
            console.error('Send KOT/BOT error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to send order'
            });
        }
    }

    // Helper to get waiter name
    getWaiterName(waiterId) {
        try {
            const waiter = db.prepare('SELECT full_name FROM users WHERE id = ?').get(waiterId);
            return waiter ? waiter.full_name : 'Unknown';
        } catch (error) {
            return 'Unknown';
        }
    }

    // GET /api/kot-bot/history - Get KOT/BOT history
    async getHistory(req, res) {
        try {
            const { date, tableNumber } = req.query;

            let kotQuery = 'SELECT * FROM kot_history';
            let botQuery = 'SELECT * FROM bot_history';
            const params = [];

            if (date) {
                kotQuery += ' WHERE DATE(printed_at) = ?';
                botQuery += ' WHERE DATE(printed_at) = ?';
                params.push(date);
            }

            if (tableNumber) {
                kotQuery += params.length > 0 ? ' AND table_number = ?' : ' WHERE table_number = ?';
                botQuery += params.length > 0 ? ' AND table_number = ?' : ' WHERE table_number = ?';
                params.push(tableNumber);
            }

            kotQuery += ' ORDER BY printed_at DESC LIMIT 50';
            botQuery += ' ORDER BY printed_at DESC LIMIT 50';

            const kotHistory = db.prepare(kotQuery).all(...params);
            const botHistory = db.prepare(botQuery).all(...params);

            // Parse JSON items
            kotHistory.forEach(kot => {
                try {
                    kot.items = JSON.parse(kot.items);
                } catch (e) {
                    kot.items = [];
                }
            });

            botHistory.forEach(bot => {
                try {
                    bot.items = JSON.parse(bot.items);
                } catch (e) {
                    bot.items = [];
                }
            });

            res.json({
                success: true,
                data: {
                    kot: kotHistory,
                    bot: botHistory
                }
            });

        } catch (error) {
            console.error('Get KOT/BOT history error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get history'
            });
        }
    }
}

module.exports = new KOTBOTController();
