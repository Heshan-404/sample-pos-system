const db = require('../db/database');

const fixShopIds = () => {
    try {
        const kitchenId = db.prepare("SELECT id FROM shops WHERE name = 'Kitchen'").get().id;
        const barId = db.prepare("SELECT id FROM shops WHERE name = 'Bar'").get().id;

        console.log('🔄 Fixing item shopIds...');
        const info = db.prepare("UPDATE items SET shopId = ? WHERE category = 'KOT' AND shopId IS NULL").run(kitchenId);
        const info2 = db.prepare("UPDATE items SET shopId = ? WHERE category = 'BOT' AND shopId IS NULL").run(barId);

        console.log(`✅ Updated ${info.changes} KOT items`);
        console.log(`✅ Updated ${info2.changes} BOT items`);
    } catch (error) {
        console.error('❌ Fix failed:', error);
    }
};

fixShopIds();
