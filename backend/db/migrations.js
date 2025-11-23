const db = require('./database');

/**
 * Migration to add subcategories support
 * This adds the subcategories table and subcategoryId column to items table
 */
function migrateSubcategories() {
    console.log('Running subcategories migration...');

    try {
        // Check if subcategories table exists
        const tableExists = db.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='subcategories'
        `).get();

        if (!tableExists) {
            console.log('Creating subcategories table...');
            db.exec(`
                CREATE TABLE subcategories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    mainCategory TEXT NOT NULL CHECK(mainCategory IN ('BOT', 'KOT')),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(name, mainCategory)
                )
            `);
            console.log('✅ Subcategories table created');
        } else {
            console.log('✅ Subcategories table already exists');
        }

        // Check if subcategoryId column exists in items table
        const columns = db.prepare(`PRAGMA table_info(items)`).all();
        const hasSubcategoryId = columns.some(col => col.name === 'subcategoryId');

        if (!hasSubcategoryId) {
            console.log('Adding subcategoryId column to items table...');
            db.exec(`
                ALTER TABLE items 
                ADD COLUMN subcategoryId INTEGER 
                REFERENCES subcategories(id) ON DELETE SET NULL
            `);
            console.log('✅ subcategoryId column added to items table');
        } else {
            console.log('✅ subcategoryId column already exists in items table');
        }

        console.log('✅ Subcategories migration completed successfully');

    } catch (error) {
        console.error('❌ Error running subcategories migration:', error);
        throw error;
    }
}

/**
 * Migration to add payment method and additional items fields
 */
function migratePaymentFields() {
    console.log('Running payment fields migration...');

    try {
        const columns = db.prepare(`PRAGMA table_info(orders_history)`).all();

        // Check and add paymentMethod column
        const hasPaymentMethod = columns.some(col => col.name === 'paymentMethod');
        if (!hasPaymentMethod) {
            console.log('Adding paymentMethod column...');
            db.exec(`
                ALTER TABLE orders_history 
                ADD COLUMN paymentMethod TEXT DEFAULT 'CASH' CHECK(paymentMethod IN ('CASH', 'CARD'))
            `);
            console.log('✅ paymentMethod column added');
        } else {
            console.log('✅ paymentMethod column already exists');
        }

        // Check and add additionalItems column
        const hasAdditionalItems = columns.some(col => col.name === 'additionalItems');
        if (!hasAdditionalItems) {
            console.log('Adding additionalItems column...');
            db.exec(`
                ALTER TABLE orders_history 
                ADD COLUMN additionalItems TEXT
            `);
            console.log('✅ additionalItems column added');
        } else {
            console.log('✅ additionalItems column already exists');
        }

        console.log('✅ Payment fields migration completed successfully');

    } catch (error) {
        console.error('❌ Error running payment fields migration:', error);
        throw error;
    }
}

module.exports = { migrateSubcategories, migratePaymentFields };
