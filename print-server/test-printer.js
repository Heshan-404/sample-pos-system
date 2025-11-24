const net = require('net');

// Your printer details
const PRINTER_IP = '192.168.224.61';
const PRINTER_PORT = 9100;

console.log(`Testing printer at ${PRINTER_IP}:${PRINTER_PORT}...`);

const client = new net.Socket();

client.connect(PRINTER_PORT, PRINTER_IP, () => {

    // Simple test print
    const testContent = '\n\nTEST PRINT\nFrom Restaurant POS\n\n\n';

    const buffer = Buffer.concat([
        Buffer.from([0x1B, 0x40]),        // Initialize
        Buffer.from(testContent, 'utf8'), // Content
        Buffer.from([0x0A, 0x0A, 0x0A]),  // Line feeds
        Buffer.from([0x1D, 0x56, 0x00])   // Cut paper
    ]);

    // console.log(`Sending ${buffer.length} bytes...`);
    client.write(buffer);

    setTimeout(() => {
        client.end();
        console.log('Done!');
        process.exit(0);
    }, 1000);
});

client.on('error', (err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
