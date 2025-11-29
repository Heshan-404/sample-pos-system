import { Link, useLocation, useNavigate } from 'react-router-dom';
import { X, Package, Grid3x3, Receipt, History, Zap, Users, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const navItems = [
    { path: '/', label: 'Quick Bill', icon: Zap, roles: ['admin', 'cashier'] },
    { path: '/tables', label: 'Tables', icon: Grid3x3, roles: ['admin', 'cashier'] },
    { path: '/billing', label: 'Billing', icon: Receipt, roles: ['admin', 'cashier'] },
    { path: '/history', label: 'History', icon: History, roles: ['admin', 'cashier'] },
];

const adminItems = [
    { path: '/admin/users', label: 'User Management', icon: Users },
    { path: '/admin/item', label: 'Items', icon: Package },
    { path: '/admin/printers', label: 'Printers', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isAdmin } = useAuth();

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
        onClose();
    };

    return (
        <>
            {/* Overlay - Mobile only */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.aside
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-gray-800 shadow-2xl z-50 md:hidden safe-area-left overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Menu</h2>
                                {user && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {user.full_name} ({user.role})
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Close menu"
                            >
                                <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                            </button>
                        </div>

                        {/* Navigation Items */}
                        <nav className="p-4 space-y-2">
                            {navItems
                                .filter(item => !item.roles || item.roles.includes(user?.role))
                                .map(({ path, label, icon: Icon }) => (
                                    <Link
                                        key={path}
                                        to={path}
                                        onClick={onClose}
                                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${isActive(path)
                                                ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{label}</span>
                                    </Link>
                                ))}

                            {/* Admin Section */}
                            {isAdmin && (
                                <>
                                    <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 mb-2">
                                            ADMIN
                                        </p>
                                    </div>
                                    {adminItems.map(({ path, label, icon: Icon }) => (
                                        <Link
                                            key={path}
                                            to={path}
                                            onClick={onClose}
                                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${isActive(path)
                                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span>{label}</span>
                                        </Link>
                                    ))}
                                </>
                            )}

                            {/* Logout */}
                            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </nav>
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    );
}
