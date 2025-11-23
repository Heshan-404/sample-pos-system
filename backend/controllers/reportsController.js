const db = require('../db/database');

/**
 * Generate Orders Report CSV
 * Shows all orders between start and end date
 */
exports.generateOrdersReport = async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
    }

    try {
        // Fetch orders in date range
        const orders = db.prepare(`
            SELECT * FROM orders_history 
            WHERE DATE(closed_at) BETWEEN DATE(?) AND DATE(?)
            ORDER BY closed_at DESC
        `).all(startDate, endDate);

        // Fetch items for all orders
        const ordersWithItems = orders.map(order => {
            const items = db.prepare(`
                SELECT * FROM orders_history_items 
                WHERE historyId = ?
            `).all(order.id);
            return { ...order, items };
        });

        // Generate CSV content
        let csvContent = '';

        // Summary section
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, o) => sum + o.finalAmount, 0);
        const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

        csvContent += 'Orders Report\n';
        csvContent += `Period:,${startDate},to,${endDate}\n`;
        csvContent += '\n';
        csvContent += 'Summary\n';
        csvContent += `Total Orders:,${totalOrders}\n`;
        csvContent += `Total Revenue:,${totalRevenue.toFixed(2)}\n`;
        csvContent += `Average Order Value:,${avgOrderValue.toFixed(2)}\n`;
        csvContent += '\n\n';

        // Orders Details Header
        csvContent += 'Order ID,Table Number,Date,Time,Item Name,Quantity,Unit Price,Item Total,Subtotal,Service Charge,Discount,Total Amount\n';

        // Orders data
        ordersWithItems.forEach(order => {
            const orderDate = new Date(order.closed_at);
            const dateStr = orderDate.toLocaleDateString();
            const timeStr = orderDate.toLocaleTimeString();

            if (order.items.length === 0) {
                csvContent += `${order.id},${order.tableNumber},${dateStr},${timeStr},,,,,${order.subtotal.toFixed(2)},${order.serviceChargeAmount.toFixed(2)},${order.discount.toFixed(2)},${order.finalAmount.toFixed(2)}\n`;
            } else {
                order.items.forEach((item, index) => {
                    if (index === 0) {
                        // First item includes order totals
                        csvContent += `${order.id},${order.tableNumber},${dateStr},${timeStr},"${item.itemName}",${item.quantity},${item.itemPrice.toFixed(2)},${item.subtotal.toFixed(2)},${order.subtotal.toFixed(2)},${order.serviceChargeAmount.toFixed(2)},${order.discount.toFixed(2)},${order.finalAmount.toFixed(2)}\n`;
                    } else {
                        // Subsequent items only show item details
                        csvContent += `,,,,${item.itemName},${item.quantity},${item.itemPrice.toFixed(2)},${item.subtotal.toFixed(2)},,,,\n`;
                    }
                });
            }
        });

        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=orders-report-${startDate}-to-${endDate}.csv`);
        res.send(csvContent);

    } catch (error) {
        console.error('Error generating orders report:', error);
        res.status(500).json({ error: 'Failed to generate orders report' });
    }
};

/**
 * Generate Items Sales Report CSV
 * Shows item-wise sales for a specific date
 */
exports.generateItemsSalesReport = async (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: 'Date is required' });
    }

    try {
        // Fetch all items sold on this date
        const itemsSales = db.prepare(`
            SELECT 
                ohi.itemName,
                ohi.itemCategory,
                ohi.itemPrice,
                SUM(ohi.quantity) as totalQuantity,
                SUM(ohi.subtotal) as totalRevenue,
                COUNT(DISTINCT ohi.historyId) as numberOfOrders
            FROM orders_history_items ohi
            INNER JOIN orders_history oh ON ohi.historyId = oh.id
            WHERE DATE(oh.closed_at) = DATE(?)
            GROUP BY ohi.itemName, ohi.itemPrice
            ORDER BY totalRevenue DESC
        `).all(date);

        // Generate CSV content
        let csvContent = '';

        // Summary section
        const totalItems = itemsSales.reduce((sum, i) => sum + i.totalQuantity, 0);
        const totalRevenue = itemsSales.reduce((sum, i) => sum + i.totalRevenue, 0);

        csvContent += 'Items Sales Report\n';
        csvContent += `Date:,${date}\n`;
        csvContent += '\n';
        csvContent += 'Summary\n';
        csvContent += `Total Items Sold:,${totalItems}\n`;
        csvContent += `Total Revenue:,${totalRevenue.toFixed(2)}\n`;
        csvContent += `Number of Different Items:,${itemsSales.length}\n`;
        csvContent += '\n\n';

        // Items table header
        csvContent += 'Item Name,Category,Unit Price,Quantity Sold,Total Revenue,Number of Orders\n';

        // Items data
        itemsSales.forEach(item => {
            csvContent += `"${item.itemName}",${item.itemCategory},${item.itemPrice.toFixed(2)},${item.totalQuantity},${item.totalRevenue.toFixed(2)},${item.numberOfOrders}\n`;
        });

        // Total row
        csvContent += '\n';
        csvContent += `TOTAL,,${totalItems},${totalRevenue.toFixed(2)}\n`;

        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=items-sales-report-${date}.csv`);
        res.send(csvContent);

    } catch (error) {
        console.error('Error generating items sales report:', error);
        res.status(500).json({ error: 'Failed to generate items sales report' });
    }
};
