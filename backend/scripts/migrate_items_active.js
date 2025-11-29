const db = require('../db/database');

const migrateItemsActive = () => {
    console.log('🔄 Starting items active status migration...');

    try {
        // Check if column exists
        const tableInfo = db.prepare('PRAGMA table_info(items)').all();
        const hasIsActive = tableInfo.some(col => col.name === 'isActive');

        if (!hasIsActive) {
            console.log('📝 Adding isActive column to items table...');
            db.exec('ALTER TABLE items ADD COLUMN isActive BOOLEAN DEFAULT 1');
            console.log('✅ isActive column added successfully');
        } else {
            console.log('ℹ️ isActive column already exists');
        }

        console.log('🎉 Migration completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrateItemsActive();
