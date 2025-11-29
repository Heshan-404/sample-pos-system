const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'rip-robana-secret-key-2025';
const JWT_EXPIRES_IN = '24h';

class AuthController {
    // POST /api/auth/login - Admin/Cashier login
    async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Username and password are required'
                });
            }

            // Get user from database
            const user = db.prepare(`
                SELECT * FROM users 
                WHERE username = ? AND is_active = 1
            `).get(username);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
            }

            //  Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);

            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
            }

            // Check if user is admin or cashier
            if (user.role === 'waiter') {
                return res.status(403).json({
                    success: false,
                    error: 'Waiters must use PIN login'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    fullName: user.full_name
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            // Return user data (without password)
            const { password: _, ...userData } = user;

            res.json({
                success: true,
                data: {
                    user: userData,
                    token
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                error: 'Login failed'
            });
        }
    }

    // POST /api/auth/pin-login - Waiter PIN login
    async pinLogin(req, res) {
        try {
            const { pin } = req.body;

            if (!pin) {
                return res.status(400).json({
                    success: false,
                    error: 'PIN is required'
                });
            }

            // Get waiter by PIN
            const user = db.prepare(`
                SELECT * FROM users 
                WHERE pin = ? AND role = 'waiter' AND is_active = 1
            `).get(pin);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid PIN'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    fullName: user.full_name
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            // Return user data (without password)
            const { password: _, pin: __, ...userData } = user;

            res.json({
                success: true,
                data: {
                    user: userData,
                    token
                }
            });

        } catch (error) {
            console.error('PIN login error:', error);
            res.status(500).json({
                success: false,
                error: 'Login failed'
            });
        }
    }

    // GET /api/auth/me - Get current user
    async getCurrentUser(req, res) {
        try {
            const user = db.prepare(`
                SELECT id, username, role, full_name, is_active, created_at 
                FROM users 
                WHERE id = ?
            `).get(req.user.id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            res.json({
                success: true,
                data: user
            });

        } catch (error) {
            console.error('Get current user error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get user data'
            });
        }
    }

    // POST /api/auth/logout - Logout (client-side mostly)
    async logout(req, res) {
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }

    // POST /api/auth/verify-pin - Verify waiter PIN without full login
    async verifyPin(req, res) {
        try {
            const { pin } = req.body;

            if (!pin) {
                return res.status(400).json({
                    success: false,
                    error: 'PIN is required'
                });
            }

            // Get waiter by PIN
            const user = db.prepare(`
                SELECT id, username, full_name, role 
                FROM users 
                WHERE pin = ? AND role = 'waiter' AND is_active = 1
            `).get(pin);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid PIN'
                });
            }

            res.json({
                success: true,
                data: user
            });

        } catch (error) {
            console.error('Verify PIN error:', error);
            res.status(500).json({
                success: false,
                error: 'Verification failed'
            });
        }
    }
}

module.exports = new AuthController();
