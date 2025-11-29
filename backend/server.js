const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Initialize database (runs migrations)
require('./db/init');

const itemRoutes = require('./routes/itemRoutes');
const orderRoutes = require('./routes/orderRoutes');
const historyRoutes = require('./routes/historyRoutes');
const printerRoutes = require('./routes/printerRoutes');
const printRoutes = require('./routes/printRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));        // Authentication
app.use('/api/users', require('./routes/userRoutes'));       // User management
app.use('/api/items', itemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/subcategories', require('./routes/subcategoriesRoutes'));
app.use('/api/shops', require('./routes/shopRoutes'));
app.use('/api/printers', printerRoutes);
app.use('/api/print', printRoutes);
app.use('/api/kot-bot', require('./routes/kotBotRoutes'));   // KOT/BOT
app.use('/api/reports', require('./routes/reportsRoutes'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Serve static files from frontend build (production)
const path = require('path');
const fs = require('fs');
const frontendDistPath = path.join(__dirname, '../frontend/dist');

// Check if dist folder exists
if (fs.existsSync(frontendDistPath)) {
    console.log('📦 Serving frontend from:', frontendDistPath);
    app.use(express.static(frontendDistPath));

    // Serve index.html for all non-API routes (SPA support)
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
} else {
    console.log('⚠️  Frontend build not found. Run: npm run build in frontend folder');

    // 404 handler for missing frontend
    app.use((req, res) => {
        if (req.path.startsWith('/api')) {
            res.status(404).json({
                success: false,
                error: 'API route not found'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Frontend not built. Run: cd frontend && npm run build'
            });
        }
    });
}

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message
    });
});

// WebSocket for Print Server Communication
let printServerSocket = null;

io.on('connection', (socket) => {
    console.log('📱 Client connected:', socket.id);

    // Print server registration
    socket.on('register', (data) => {
        printServerSocket = socket;
        console.log('🖨️  Print server registered:', data.name);
        socket.emit('registered', { success: true });
    });

    // Print status updates
    socket.on('print-status', (data) => {
        console.log('📄 Print status update:', data);
        // You can broadcast this to connected clients if needed
        io.emit('print-status-update', data);
    });

    socket.on('disconnect', () => {
        console.log('📱 Client disconnected:', socket.id);
        if (socket === printServerSocket) {
            printServerSocket = null;
            console.log('🖨️  Print server disconnected');
        }
    });
});

// Export io for use in routes
app.set('io', io);
app.set('getPrintServerSocket', () => printServerSocket);

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
    console.log(`🔌 WebSocket server is running`);
});
