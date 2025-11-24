const net = require('net');
const { io } = require('socket.io-client');
const chalk = require('chalk');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Print queue for retry mechanism
const printQueue = [];
let isProcessingQueue = false;

// Connect to backend WebSocket
const socket = io(BACKEND_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity
});

// === WebSocket Event Handlers ===

socket.on('connect', () => {
    console.log(chalk.green('✅ Connected to cloud backend'));
    console.log(chalk.cyan(`🔗 Server: ${BACKEND_URL}`));

    // Register this print server
    socket.emit('register', {
        name: 'Local Print Server',
        timestamp: new Date().toISOString()
    });
});

socket.on('disconnect', () => {
    // console.log(chalk.yellow('⚠️  Disconnected from cloud backend'));
});

socket.on('connect_error', (error) => {
    // console.log(chalk.red('❌ Connection error:'), error.message);
});

socket.on('print-job', (data) => {
    // console.log(chalk.blue('\n📨 Received print job:'));
    // console.log(chalk.gray('  Job ID:'), data.jobId);
    // console.log(chalk.gray('  Printer:'), data.printer.name);
    // console.log(chalk.gray('  IP:PORT:'), `${data.printer.ip}:${data.printer.port}`);

    // Add to queue and process
    printQueue.push(data);
    processQueue();
});

// === Printing Function ===

async function printToDevice(printer, content, jobId) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        let hasResponded = false;

        const timeout = setTimeout(() => {
            if (!hasResponded) {
                hasResponded = true;
                client.destroy();
                reject(new Error('Print timeout'));
            }
        }, 5000);

        client.connect(printer.port, printer.ip, () => {
            // console.log(chalk.green(`✅ Connected to printer ${printer.name}`));

            // Build print buffer with ESC/POS commands
            const buffer = Buffer.concat([
                // Initialize printer
                Buffer.from([0x1B, 0x40]),                    // ESC @ - Initialize printer

                // Set alignment to left  
                Buffer.from([0x1B, 0x61, 0x00]),              // ESC a 0 - Left align

                // The actual content
                Buffer.from(content, 'utf8'),

                // Feed paper and cut
                Buffer.from([0x0A, 0x0A, 0x0A, 0x0A, 0x0A]),  // Multiple line feeds
                Buffer.from([0x1D, 0x56, 0x00])               // GS V 0 - Full cut
            ]);

            // console.log(chalk.cyan(`📝 Sending ${buffer.length} bytes to printer`));
            // console.log(chalk.gray('=== RECEIPT CONTENT START ==='));
            // console.log(content);
            // console.log(chalk.gray('=== RECEIPT CONTENT END ==='));

            // Send print data
            client.write(buffer);
            client.end();
        });

        client.on('close', () => {
            if (!hasResponded) {
                clearTimeout(timeout);
                hasResponded = true;
                // console.log(chalk.green(`✅ Print job completed: ${jobId}`));
                resolve();
            }
        });

        client.on('error', (err) => {
            if (!hasResponded) {
                clearTimeout(timeout);
                hasResponded = true;
                // console.log(chalk.red(`❌ Print error: ${err.message}`));
                reject(err);
            }
        });
    });
}

// === Queue Processing ===

async function processQueue() {
    if (isProcessingQueue || printQueue.length === 0) {
        return;
    }

    isProcessingQueue = true;

    while (printQueue.length > 0) {
        const job = printQueue.shift();

        try {
            await printToDevice(job.printer, job.content, job.jobId);

            // Notify backend of success
            socket.emit('print-status', {
                jobId: job.jobId,
                status: 'completed',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            // console.log(chalk.yellow(`⚠️  Print failed, will retry...`));

            // Add back to queue for retry (max 3 attempts)
            job.attempts = (job.attempts || 0) + 1;

            if (job.attempts < 3) {
                printQueue.push(job);
            } else {
                // console.log(chalk.red(`❌ Print job failed after 3 attempts: ${job.jobId}`));

                socket.emit('print-status', {
                    jobId: job.jobId,
                    status: 'failed',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }

            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    isProcessingQueue = false;
}

// === Startup ===

console.log(chalk.cyan.bold(`
╔════════════════════════════════════════╗
║     🖨️  LOCAL PRINT SERVER STARTING    ║
╠════════════════════════════════════════╣
║  Backend: ${BACKEND_URL.padEnd(27)}  ║
║  Status:  Connecting...                ║
╚════════════════════════════════════════╝
`));

// Graceful shutdown
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n⚠️  Shutting down...'));
    socket.disconnect();
    process.exit(0);
});
