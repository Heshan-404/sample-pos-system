const db = require('../db/database');

// Get all subcategories
exports.getAllSubcategories = (req, res) => {
    try {
        const subcategories = db.prepare('SELECT * FROM subcategories ORDER BY mainCategory, name').all();
        res.json({ success: true, data: subcategories });
    } catch (error) {
        console.error('Error fetching subcategories:', error);
        res.status(500).json({ error: 'Failed to fetch subcategories' });
    }
};

// Get subcategories by main category
exports.getSubcategoriesByCategory = (req, res) => {
    const { category } = req.params;
    try {
        const subcategories = db.prepare('SELECT * FROM subcategories WHERE mainCategory = ? ORDER BY name').all(category);
        res.json({ success: true, data: subcategories });
    } catch (error) {
        console.error('Error fetching subcategories:', error);
        res.status(500).json({ error: 'Failed to fetch subcategories' });
    }
};

// Create a new subcategory
exports.createSubcategory = (req, res) => {
    const { name, mainCategory } = req.body;

    if (!name || !mainCategory) {
        return res.status(400).json({ error: 'Name and main category are required' });
    }

    if (!['KOT', 'BOT'].includes(mainCategory)) {
        return res.status(400).json({ error: 'Main category must be KOT or BOT' });
    }

    try {
        const result = db.prepare('INSERT INTO subcategories (name, mainCategory) VALUES (?, ?)').run(name, mainCategory);
        const newSubcategory = db.prepare('SELECT * FROM subcategories WHERE id = ?').get(result.lastInsertRowid);
        res.json({ success: true, data: newSubcategory });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            res.status(400).json({ error: 'Subcategory already exists in this category' });
        } else {
            console.error('Error creating subcategory:', error);
            res.status(500).json({ error: 'Failed to create subcategory' });
        }
    }
};

// Update a subcategory
exports.updateSubcategory = (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    try {
        db.prepare('UPDATE subcategories SET name = ? WHERE id = ?').run(name, id);
        const updatedSubcategory = db.prepare('SELECT * FROM subcategories WHERE id = ?').get(id);
        res.json({ success: true, data: updatedSubcategory });
    } catch (error) {
        console.error('Error updating subcategory:', error);
        res.status(500).json({ error: 'Failed to update subcategory' });
    }
};

// Delete a subcategory
exports.deleteSubcategory = (req, res) => {
    const { id } = req.params;
    try {
        db.prepare('DELETE FROM subcategories WHERE id = ?').run(id);
        res.json({ success: true, message: 'Subcategory deleted successfully' });
    } catch (error) {
        console.error('Error deleting subcategory:', error);
        res.status(500).json({ error: 'Failed to delete subcategory' });
    }
};
