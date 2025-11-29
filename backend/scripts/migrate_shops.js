const db = require('../db/database');

const migrateShops = () => {
    console.log('🔄 Starting shops migration...');

    try {
        // 1. Create shops table
        db.exec(`
            CREATE TABLE IF NOT EXISTS shops (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Shops table created');

        // 2. Insert default shops if they don't exist
        const insertShop = db.prepare('INSERT OR IGNORE INTO shops (name) VALUES (?)');
        insertShop.run('Kitchen');
        insertShop.run('Bar');
        console.log('✅ Default shops (Kitchen, Bar) inserted');

        // Get shop IDs
        const kitchenId = db.prepare("SELECT id FROM shops WHERE name = 'Kitchen'").get().id;
        const barId = db.prepare("SELECT id FROM shops WHERE name = 'Bar'").get().id;

        // 3. Add shopId to items table
        const itemTableInfo = db.prepare('PRAGMA table_info(items)').all();
        if (!itemTableInfo.some(col => col.name === 'shopId')) {
            console.log('📝 Adding shopId to items table...');
            db.exec('ALTER TABLE items ADD COLUMN shopId INTEGER REFERENCES shops(id) ON DELETE SET NULL');

            // Migrate existing items
            console.log('🔄 Migrating existing items to shops...');
            db.prepare("UPDATE items SET shopId = ? WHERE category = 'KOT'").run(kitchenId);
            db.prepare("UPDATE items SET shopId = ? WHERE category = 'BOT'").run(barId);
            console.log('✅ Items migrated');
        } else {
            console.log('ℹ️ shopId column already exists in items table');
        }

        // 4. Add shopId to printers table
        const printerTableInfo = db.prepare('PRAGMA table_info(printers)').all();
        if (!printerTableInfo.some(col => col.name === 'shopId')) {
            console.log('📝 Adding shopId to printers table...');
            db.exec('ALTER TABLE printers ADD COLUMN shopId INTEGER REFERENCES shops(id) ON DELETE SET NULL');
            console.log('✅ shopId added to printers table');
        } else {
            console.log('ℹ️ shopId column already exists in printers table');
        }

        console.log('🎉 Shops migration completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrateShops();
