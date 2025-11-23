const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Company Information
const COMPANY_INFO = {
    name: 'AGA SURF VIEW',
    address: 'N0:74/A, Galagahadeniya Watta,\nDodampahala, Hirikata, Dikwella',
    phones: '(+94) 78 58 92 109, (+94) 76 70 98 262',
    copyright: '© 2025 AGA SURF VIEW. All rights reserved.',
    logoPath: path.join(__dirname, '../../image.png')
};

/**
 * Generate PDF receipt
 * @param {Object} billData - The bill data
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generatePDFReceipt(billData) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: [226.77, 500], margin: 10 }); // 80mm width
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });

            const { tableNumber, items, subtotal, discount, serviceCharge, serviceChargeAmount, finalAmount, closedAt } = billData;
            const date = new Date(closedAt);

            // Add logo if exists
            if (fs.existsSync(COMPANY_INFO.logoPath)) {
                try {
                    doc.image(COMPANY_INFO.logoPath, {
                        fit: [80, 80],
                        align: 'center',
                        x: (doc.page.width - 80) / 2
                    });
                    doc.moveDown(0.5);
                } catch (err) {
                    console.log('Logo not added:', err.message);
                }
            }

            // Company name
            doc.fontSize(16).font('Helvetica-Bold').text(COMPANY_INFO.name, { align: 'center' });
            doc.moveDown(0.3);

            // Address
            doc.fontSize(8).font('Helvetica').text(COMPANY_INFO.address, { align: 'center' });
            doc.moveDown(0.2);

            // Phone numbers
            doc.fontSize(7).text(COMPANY_INFO.phones, { align: 'center' });
            doc.moveDown(0.5);

            // Separator
            doc.strokeColor('#000000').moveTo(10, doc.y).lineTo(doc.page.width - 10, doc.y).stroke();
            doc.moveDown(0.5);

            // Receipt header
            doc.fontSize(10).font('Helvetica-Bold').text('RECEIPT', { align: 'center' });
            doc.moveDown(0.3);

            // Date and Table info
            doc.fontSize(8).font('Helvetica');
            doc.text(`Date: ${date.toLocaleDateString()}  Time: ${date.toLocaleTimeString()}`, { align: 'left' });
            doc.text(`Table: ${tableNumber}`, { align: 'left' });
            doc.moveDown(0.5);

            // Items table header
            doc.strokeColor('#000000').moveTo(10, doc.y).lineTo(doc.page.width - 10, doc.y).stroke();
            doc.moveDown(0.3);
            doc.fontSize(8).font('Helvetica-Bold');

            // Column headers
            doc.text('Item', 10, doc.y, { width: 120, continued: false });
            const headerY = doc.y - 10;
            doc.text('Qty', 135, headerY, { width: 30, continued: false });
            doc.text('Price', doc.page.width - 60, headerY, { width: 50, align: 'right' });
            doc.moveDown(0.3);

            // Items - single line per item
            doc.font('Helvetica');
            items.forEach(item => {
                const itemName = item.name || item.itemName;

                // Item name
                doc.text(itemName, 10, doc.y, { width: 120, continued: false });
                const itemY = doc.y - 10;

                // Quantity
                doc.text(`x${item.quantity}`, 135, itemY, { width: 30, continued: false });

                // Price (right-aligned)
                doc.text(`LKR ${item.subtotal.toFixed(2)}`, doc.page.width - 60, itemY, { width: 50, align: 'right' });

                doc.moveDown(0.2);
            });

            doc.moveDown(0.2);
            doc.strokeColor('#000000').moveTo(10, doc.y).lineTo(doc.page.width - 10, doc.y).stroke();
            doc.moveDown(0.3);

            // Totals
            doc.fontSize(9);

            doc.text('Subtotal:', 10, doc.y, { continued: true });
            doc.text(`LKR ${subtotal.toFixed(2)}`, { align: 'right' });

            if (serviceCharge) {
                doc.text('Service Charge (10%):', 10, doc.y, { continued: true });
                doc.text(`LKR ${serviceChargeAmount.toFixed(2)}`, { align: 'right' });
            }

            if (discount > 0) {
                doc.text('Discount:', 10, doc.y, { continued: true });
                doc.text(`-LKR ${discount.toFixed(2)}`, { align: 'right' });
            }

            doc.moveDown(0.3);
            doc.fontSize(12).font('Helvetica-Bold');
            doc.text('TOTAL:', 10, doc.y, { continued: true });
            doc.text(`LKR ${finalAmount.toFixed(2)}`, { align: 'right' });

            doc.moveDown(0.5);
            doc.strokeColor('#000000').moveTo(10, doc.y).lineTo(doc.page.width - 10, doc.y).stroke();
            doc.moveDown(0.5);

            // Thank you message
            doc.fontSize(10).font('Helvetica-Bold').text('Thank You! Come Again!', { align: 'center' });
            doc.moveDown(0.5);

            // Copyright
            doc.fontSize(6).font('Helvetica').text(COMPANY_INFO.copyright, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Format receipt content for ESC/POS printer (Enhanced text-based)
 * @param {Object} billData - The bill data to format
 * @returns {String} - Formatted receipt text
 */
function formatReceipt(billData) {
    const { tableNumber, items, subtotal, discount, serviceCharge, serviceChargeAmount, finalAmount, closedAt } = billData;

    const date = new Date(closedAt);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString();

    let receipt = '';

    // Header with company name (add 3 spaces to start)
    receipt += '    ===========================================\n';
    // Bold on (ESC E 1), company name, Bold off (ESC E 0)
    receipt += '                   \x1B\x45\x01Rip Robana\x1B\x45\x00\n';
    receipt += '    ===========================================\n';
    receipt += '\n';

    // Company Address
    receipt += '           N0:74/A, Galagahadeniya Watta,\n';
    receipt += '          Dodampahala, Hirikata, Dikwella\n';
    receipt += '\n';

    // Phone Numbers - both on same line
    receipt += '     (+94) 78 58 92 109, (+94) 76 70 98 262\n';
    receipt += '\n';
    receipt += '    ===========================================\n';
    receipt += '\n';

    // Table number with date/time right-aligned
    const tableText = `    Table No: ${tableNumber}`;
    const dateTimeText = `${dateStr}  ${timeStr}`;
    const tableLineWidth = 47;
    let spacing = tableLineWidth - tableText.length - dateTimeText.length;
    receipt += tableText + ' '.repeat(Math.max(spacing, 1)) + dateTimeText + '\n';
    receipt += '\n';
    receipt += '    -------------------------------------------\n';

    // Column headers
    receipt += '    Name                     Qty     Price(LKR)\n';
    receipt += '    -------------------------------------------\n';

    // Items with fixed column widths and right-aligned price
    items.forEach(item => {
        const itemName = item.name || item.itemName;
        const qty = `x${item.quantity}`;
        const price = item.subtotal.toFixed(2);

        // Fixed column widths: Name(25), Qty(9), Price(8 right-aligned)
        const nameCol = itemName.substring(0, 25).padEnd(25);
        const qtyCol = qty.padEnd(9);
        const priceCol = price.padStart(8);  // Right-align price in 8-char width

        receipt += `    ${nameCol}${qtyCol}${priceCol}\n`;
    });

    receipt += '    -------------------------------------------\n';
    receipt += '\n';

    // Totals section
    const formatTotal = (label, amount) => {
        const amountStr = `${amount.toFixed(2)}`;
        spacing = 46 - 4 - label.length - amountStr.length;
        return '    ' + label + ' '.repeat(Math.max(spacing, 1)) + amountStr + '\n';
    };

    receipt += formatTotal('Subtotal:', subtotal);

    if (serviceCharge) {
        receipt += formatTotal('Service Charge (10%):', serviceChargeAmount);
    }

    if (discount > 0) {
        receipt += formatTotal('Discount:', -discount);
    }

    receipt += '\n';
    receipt += '    ===========================================\n';
    // Format TOTAL with LKR prefix
    const totalAmountStr = `LKR ${finalAmount.toFixed(2)}`;
    const totalSpacing = 46 - 4 - 'TOTAL:'.length - totalAmountStr.length;
    receipt += '    TOTAL:' + ' '.repeat(Math.max(totalSpacing, 1)) + totalAmountStr + '\n';
    receipt += '    ===========================================\n';
    receipt += '\n';

    // Thank you message
    receipt += '    -------------------------------------------\n';
    receipt += '               Thank You! Come Again!\n';
    receipt += '    -------------------------------------------\n';
    receipt += '\n';

    // Powered by footer (smaller/subtle)
    receipt += '             - zynctechsolutions.com -\n';

    return receipt;
}

/**
 * Send print job to print server via WebSocket
 * @param {Object} app - Express app instance
 * @param {Object} billData - Bill data to print
 * @returns {Promise} - Print job result
 */
async function sendPrintJob(app, billData) {
    return new Promise((resolve, reject) => {
        try {
            // Get active printer
            const printer = db.prepare('SELECT * FROM printers WHERE isActive = 1 LIMIT 1').get();

            if (!printer) {
                return reject(new Error('No active printer found. Please register and activate a printer.'));
            }

            // Get WebSocket connection
            const getPrintServerSocket = app.get('getPrintServerSocket');
            const printServerSocket = getPrintServerSocket();

            if (!printServerSocket) {
                return reject(new Error('Print server is not connected. Please start the print server.'));
            }

            // Format receipt for thermal printer
            const receiptContent = formatReceipt(billData);

            // Create print job
            const jobId = uuidv4();
            const printJob = {
                jobId,
                printer: {
                    name: printer.name,
                    ip: printer.ip,
                    port: printer.port
                },
                content: receiptContent
            };

            console.log('📄 Sending print job:', jobId);

            // Send to print server
            printServerSocket.emit('print-job', printJob);

            resolve({
                success: true,
                jobId,
                printer: printer.name
            });

        } catch (error) {
            console.error('Print error:', error);
            reject(error);
        }
    });
}

module.exports = {
    sendPrintJob,
    formatReceipt,
    generatePDFReceipt
};
