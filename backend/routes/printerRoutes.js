const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Get all printers
router.get('/', (req, res) => {
    try {
        const printers = db.prepare('SELECT * FROM printers ORDER BY created_at DESC').all();
        res.json({ success: true, data: printers });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add/Register a printer
router.post('/', (req, res) => {
    try {
        const { name, ip, port } = req.body;

        if (!name || !ip || !port) {
            return res.status(400).json({
                success: false,
                error: 'Name, IP, and Port are required'
            });
        }

        const stmt = db.prepare(`
            INSERT INTO printers (name, ip, port) 
            VALUES (?, ?, ?)
        `);

        const result = stmt.run(name, ip, parseInt(port));

        const printer = db.prepare('SELECT * FROM printers WHERE id = ?').get(result.lastInsertRowid);

        res.json({ success: true, data: printer });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update printer
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, ip, port, isActive } = req.body;

        const stmt = db.prepare(`
            UPDATE printers 
            SET name = ?, ip = ?, port = ?, isActive = ?
            WHERE id = ?
        `);

        stmt.run(name, ip, parseInt(port), isActive ? 1 : 0, id);

        const printer = db.prepare('SELECT * FROM printers WHERE id = ?').get(id);

        res.json({ success: true, data: printer });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete printer
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;

        const stmt = db.prepare('DELETE FROM printers WHERE id = ?');
        stmt.run(id);

        res.json({ success: true, message: 'Printer deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
