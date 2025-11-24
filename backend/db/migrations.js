const db = require('./database');

/**
 * Migration to add subcategories support
 * This adds the subcategories table and subcategoryId column to items table
 */
function migrateSubcategories() {

    try {
        // Check if subcategories table exists
        const tableExists = db.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='subcategories'
        `).get();

        if (!tableExists) {
            db.exec(`
                CREATE TABLE subcategories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    mainCategory TEXT NOT NULL CHECK(mainCategory IN ('BOT', 'KOT')),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(name, mainCategory)
                )
            `);
        } else {
        }

        // Check if subcategoryId column exists in items table
        const columns = db.prepare(`PRAGMA table_info(items)`).all();
        const hasSubcategoryId = columns.some(col => col.name === 'subcategoryId');

        if (!hasSubcategoryId) {
            db.exec(`
                ALTER TABLE items 
                ADD COLUMN subcategoryId INTEGER 
                REFERENCES subcategories(id) ON DELETE SET NULL
            `);
        } else {
        }


    } catch (error) {
        throw error;
    }
}

/**
 * Migration to add payment method and additional items fields
 */
function migratePaymentFields() {

    try {
        const columns = db.prepare(`PRAGMA table_info(orders_history)`).all();

        // Check and add paymentMethod column
        const hasPaymentMethod = columns.some(col => col.name === 'paymentMethod');
        if (!hasPaymentMethod) {
            db.exec(`
                ALTER TABLE orders_history 
                ADD COLUMN paymentMethod TEXT DEFAULT 'CASH' CHECK(paymentMethod IN ('CASH', 'CARD'))
            `);
        } else {
        }

        // Check and add additionalItems column
        const hasAdditionalItems = columns.some(col => col.name === 'additionalItems');
        if (!hasAdditionalItems) {
            db.exec(`
                ALTER TABLE orders_history 
                ADD COLUMN additionalItems TEXT
            `);
        } else {
        }


    } catch (error) {
        throw error;
    }
}

module.exports = { migrateSubcategories, migratePaymentFields };
