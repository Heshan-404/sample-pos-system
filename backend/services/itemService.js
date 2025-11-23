const db = require('../db/database');

class ItemService {
    // Get all items with subcategory information
    getAllItems() {
        const stmt = db.prepare(`
            SELECT 
                items.*, 
                subcategories.name as subcategoryName,
                subcategories.mainCategory as subcategoryMainCategory
            FROM items
            LEFT JOIN subcategories ON items.subcategoryId = subcategories.id
            ORDER BY items.category, items.name
        `);
        return stmt.all();
    }

    // Create a new item
    createItem(name, price, category, subcategoryId = null) {
        const stmt = db.prepare(`
      INSERT INTO items (name, price, category, subcategoryId) 
      VALUES (?, ?, ?, ?)
    `);

        const result = stmt.run(name, price, category, subcategoryId);

        // Return the created item with subcategory info
        const getStmt = db.prepare(`
            SELECT 
                items.*, 
                subcategories.name as subcategoryName,
                subcategories.mainCategory as subcategoryMainCategory
            FROM items
            LEFT JOIN subcategories ON items.subcategoryId = subcategories.id
            WHERE items.id = ?
        `);
        return getStmt.get(result.lastInsertRowid);
    }

    // Get item by ID
    getItemById(id) {
        const stmt = db.prepare('SELECT * FROM items WHERE id = ?');
        return stmt.get(id);
    }
}

module.exports = new ItemService();
