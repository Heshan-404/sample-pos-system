const db = require('../db/database');

class ItemService {
    // Get all items with subcategory and shop information
    getAllItems() {
        const stmt = db.prepare(`
            SELECT 
                items.*, 
                subcategories.name as subcategoryName,
                subcategories.mainCategory as subcategoryMainCategory,
                shops.name as shopName
            FROM items
            LEFT JOIN subcategories ON items.subcategoryId = subcategories.id
            LEFT JOIN shops ON items.shopId = shops.id
            ORDER BY items.category, items.name
        `);
        return stmt.all();
    }

    // Create a new item
    createItem(name, price, category, subcategoryId = null, shopId = null) {
        const stmt = db.prepare(`
      INSERT INTO items (name, price, category, subcategoryId, shopId) 
      VALUES (?, ?, ?, ?, ?)
    `);

        const result = stmt.run(name, price, category, subcategoryId, shopId);

        // Return the created item with subcategory info
        const getStmt = db.prepare(`
            SELECT 
                items.*, 
                subcategories.name as subcategoryName,
                subcategories.mainCategory as subcategoryMainCategory,
                shops.name as shopName
            FROM items
            LEFT JOIN subcategories ON items.subcategoryId = subcategories.id
            LEFT JOIN shops ON items.shopId = shops.id
            WHERE items.id = ?
        `);
        return getStmt.get(result.lastInsertRowid);
    }

    // Get item by ID
    getItemById(id) {
        const stmt = db.prepare('SELECT * FROM items WHERE id = ?');
        return stmt.get(id);
    }

    // Toggle item status
    toggleItemStatus(id) {
        const item = this.getItemById(id);
        if (!item) {
            throw new Error('Item not found');
        }

        const newStatus = item.isActive ? 0 : 1;
        const stmt = db.prepare('UPDATE items SET isActive = ? WHERE id = ?');
        stmt.run(newStatus, id);

        return { ...item, isActive: newStatus };
    }
}

module.exports = new ItemService();
