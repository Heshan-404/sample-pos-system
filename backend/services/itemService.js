const db = require('../db/database');

class ItemService {
    // Get all items (no filtering on backend)
    getAllItems() {
        const stmt = db.prepare('SELECT * FROM items ORDER BY category, name');
        return stmt.all();
    }

    // Create a new item
    createItem(name, price, category) {
        const stmt = db.prepare(`
      INSERT INTO items (name, price, category) 
      VALUES (?, ?, ?)
    `);

        const result = stmt.run(name, price, category);

        // Return the created item
        const getStmt = db.prepare('SELECT * FROM items WHERE id = ?');
        return getStmt.get(result.lastInsertRowid);
    }

    // Get item by ID
    getItemById(id) {
        const stmt = db.prepare('SELECT * FROM items WHERE id = ?');
        return stmt.get(id);
    }
}

module.exports = new ItemService();
