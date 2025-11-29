const db = require('./database');

/**
 * Migration: Create users table and add user tracking to orders
 */
function migrateUsersTable() {
    console.log('Running users migration...');

    try {
        // Create users table
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('admin', 'cashier', 'waiter')),
                full_name TEXT NOT NULL,
                pin TEXT,
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check if waiter_id column exists in orders_history
        const columns = db.prepare("PRAGMA table_info(orders_history)").all();
        const hasWaiterId = columns.some(col => col.name === 'waiter_id');
        const hasCashierId = columns.some(col => col.name === 'cashier_id');

        if (!hasWaiterId) {
            db.exec('ALTER TABLE orders_history ADD COLUMN waiter_id INTEGER');
            console.log('Added waiter_id to orders_history');
        }

        if (!hasCashierId) {
            db.exec('ALTER TABLE orders_history ADD COLUMN cashier_id INTEGER');
            console.log('Added cashier_id to orders_history');
        }

        // Create KOT history table
        db.exec(`
            CREATE TABLE IF NOT EXISTS kot_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                table_number INTEGER NOT NULL,
                waiter_id INTEGER,
                items TEXT NOT NULL,
                printed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                printed_by INTEGER,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (waiter_id) REFERENCES users(id),
                FOREIGN KEY (printed_by) REFERENCES users(id)
            )
        `);

        // Create BOT history table
        db.exec(`
            CREATE TABLE IF NOT EXISTS bot_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                table_number INTEGER NOT NULL,
                waiter_id INTEGER,
                items TEXT NOT NULL,
                printed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                printed_by INTEGER,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (waiter_id) REFERENCES users(id),
                FOREIGN KEY (printed_by) REFERENCES users(id)
            )
        `);

        console.log('✓ Users migration completed successfully');
    } catch (error) {
        console.error('Users migration error:', error);
        throw error;
    }
}

/**
 * Seed default admin user (password: admin123)
 */
function seedDefaultUsers() {
    const bcrypt = require('bcryptjs');

    try {
        const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();

        if (existingUsers.count === 0) {
            console.log('Seeding default admin user...');

            const hashedPassword = bcrypt.hashSync('admin123', 10);

            db.prepare(`
                INSERT INTO users (username, password, role, full_name, is_active)
                VALUES (?, ?, ?, ?, ?)
            `).run('admin', hashedPassword, 'admin', 'System Administrator', 1);

            console.log('✓ Default admin user created (username: admin, password: admin123)');
        }
    } catch (error) {
        console.error('Seed users error:', error);
    }
}

module.exports = {
    migrateUsersTable,
    seedDefaultUsers
};
