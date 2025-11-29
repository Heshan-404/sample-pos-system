const bcrypt = require('bcryptjs');
const db = require('../db/database');

class UserController {
    // GET /api/users - List all users
    async getUsers(req, res) {
        try {
            const users = db.prepare(`
                SELECT id, username, role, full_name, pin, is_active, created_at, updated_at 
                FROM users
                ORDER BY created_at DESC
            `).all();

            res.json({
                success: true,
                data: users
            });

        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch users'
            });
        }
    }

    // POST /api/users - Create new user
    async createUser(req, res) {
        try {
            const { username, password, role, full_name, pin } = req.body;

            // Validation
            if (!username || !password || !role || !full_name) {
                return res.status(400).json({
                    success: false,
                    error: 'Username, password, role, and full name are required'
                });
            }

            if (!['admin', 'cashier', 'waiter'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid role. Must be admin, cashier, or waiter'
                });
            }

            // If waiter, PIN is required
            if (role === 'waiter' && !pin) {
                return res.status(400).json({
                    success: false,
                    error: 'PIN is required for waiter role'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user
            const result = db.prepare(`
                INSERT INTO users (username, password, role, full_name, pin, is_active)
                VALUES (?, ?, ?, ?, ?, 1)
            `).run(username, hashedPassword, role, full_name, pin || null);

            const newUser = db.prepare(`
                SELECT id, username, role, full_name, pin, is_active, created_at
                FROM users WHERE id = ?
            `).get(result.lastInsertRowid);

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: newUser
            });

        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT') {
                return res.status(400).json({
                    success: false,
                    error: 'Username already exists'
                });
            }

            console.error('Create user error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create user'
            });
        }
    }

    // PUT /api/users/:id - Update user
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { username, password, role, full_name, pin, is_active } = req.body;

            // Check if user exists
            const existingUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Build update query dynamically
            const updates = [];
            const values = [];

            if (username) {
                updates.push('username = ?');
                values.push(username);
            }

            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                updates.push('password = ?');
                values.push(hashedPassword);
            }

            if (role) {
                if (!['admin', 'cashier', 'waiter'].includes(role)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid role'
                    });
                }
                updates.push('role = ?');
                values.push(role);
            }

            if (full_name) {
                updates.push('full_name = ?');
                values.push(full_name);
            }

            if (pin !== undefined) {
                updates.push('pin = ?');
                values.push(pin || null);
            }

            if (is_active !== undefined) {
                updates.push('is_active = ?');
                values.push(is_active ? 1 : 0);
            }

            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);

            db.prepare(`
                UPDATE users 
                SET ${updates.join(', ')}
                WHERE id = ?
            `).run(...values);

            const updatedUser = db.prepare(`
                SELECT id, username, role, full_name, pin, is_active, created_at, updated_at
                FROM users WHERE id = ?
            `).get(id);

            res.json({
                success: true,
                message: 'User updated successfully',
                data: updatedUser
            });

        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update user'
            });
        }
    }

    // DELETE /api/users/:id - Delete user
    async deleteUser(req, res) {
        try {
            const { id } = req.params;

            // Prevent deleting own account
            if (parseInt(id) === req.user.id) {
                return res.status(400).json({
                    success: false,
                    error: 'Cannot delete your own account'
                });
            }

            const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);

            if (result.changes === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            res.json({
                success: true,
                message: 'User deleted successfully'
            });

        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete user'
            });
        }
    }

    // PUT /api/users/:id/toggle - Toggle user active status
    async toggleUserStatus(req, res) {
        try {
            const { id } = req.params;

            const user = db.prepare('SELECT is_active FROM users WHERE id = ?').get(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            const newStatus = user.is_active ? 0 : 1;

            db.prepare(`
                UPDATE users 
                SET is_active = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(newStatus, id);

            res.json({
                success: true,
                message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`
            });

        } catch (error) {
            console.error('Toggle user status error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update user status'
            });
        }
    }
}

module.exports = new UserController();
