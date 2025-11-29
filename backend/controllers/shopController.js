const db = require('../db/database');

class ShopController {
    // GET /shops - Get all shops
    getAllShops(req, res) {
        try {
            const shops = db.prepare('SELECT * FROM shops ORDER BY name').all();
            res.json({
                success: true,
                data: shops
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // POST /shops - Create a new shop
    createShop(req, res) {
        try {
            const { name } = req.body;
            if (!name) {
                return res.status(400).json({
                    success: false,
                    error: 'Shop name is required'
                });
            }

            const stmt = db.prepare('INSERT INTO shops (name) VALUES (?)');
            const result = stmt.run(name);

            const shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(result.lastInsertRowid);

            res.status(201).json({
                success: true,
                data: shop
            });
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return res.status(400).json({
                    success: false,
                    error: 'Shop name already exists'
                });
            }
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new ShopController();
