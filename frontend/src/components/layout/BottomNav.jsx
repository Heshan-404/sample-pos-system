import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Package, Grid3x3, History, Zap, Users, Settings, Lock, LogOut, Store } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navItems = [
    { path: "/tables", label: "Tables", icon: Grid3x3 },
    { path: "/quick-bill", label: "Quick Bill", icon: Zap, roles: ['admin', 'cashier'] },
    { path: "/history", label: "History", icon: History, roles: ['admin', 'cashier'] },
];

const adminItems = [
    { path: "/admin/users", label: "Users", icon: Users },
    { path: "/admin/item", label: "Items", icon: Package },
    { path: "/admin/shops", label: "Shops", icon: Store },
    { path: "/admin/printers", label: "Printers", icon: Settings },
];

export default function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isAdmin, login } = useAuth();

    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [loginError, setLoginError] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);

    const isActive = (path) => {
        if (path === "/") return location.pathname === "/";
        return location.pathname.startsWith(path);
    };

    const hasAdminAccess = isAdmin;

    const handleAdminLogin = async () => {
        if (!loginForm.username || !loginForm.password) {
            setLoginError('Please enter username and password');
            return;
        }

        setLoggingIn(true);
        setLoginError('');

        const result = await login(loginForm);

        if (result.success) {
            setShowLoginModal(false);
            setLoginForm({ username: '', password: '' });
            navigate('/quick-bill');
        } else {
            setLoginError(result.error || 'Login failed');
        }

        setLoggingIn(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/tables');
    };

    return (
        <>
            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 z-40 safe-area-bottom">
                <div className="flex items-center justify-around h-16 px-2">

                    {/* Render nav items */}
                    {navItems
                        .filter(item => !item.roles || (user && item.roles.includes(user.role)))
                        .map(({ path, label, icon: Icon }) => (
                            <Link
                                key={path}
                                to={path}
                                className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-all duration-200 rounded-lg ${isActive(path)
                                    ? "text-primary-600 dark:text-primary-400"
                                    : "text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-300"
                                    }`}
                            >
                                <div
                                    className={`p-2 rounded-xl transition-all duration-200 ${isActive(path)
                                        ? "bg-primary-100 dark:bg-primary-900/30"
                                        : ""
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${isActive(path) ? "scale-110" : ""}`} />
                                </div>
                                <span className="text-xs font-medium">{label}</span>
                            </Link>
                        ))}

                    {/* Admin Section */}
                    {hasAdminAccess && adminItems.map(({ path, label, icon: Icon }) => (
                        <Link
                            key={path}
                            to={path}
                            className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-all duration-200 rounded-lg ${isActive(path)
                                ? "text-primary-600 dark:text-primary-400"
                                : "text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-300"
                                }`}
                        >
                            <div
                                className={`p-2 rounded-xl transition-all duration-200 ${isActive(path)
                                    ? "bg-primary-100 dark:bg-primary-900/30"
                                    : ""
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive(path) ? "scale-110" : ""}`} />
                            </div>
                            <span className="text-xs font-medium">{label}</span>
                        </Link>
                    ))}

                    {/* Login/Logout Button */}
                    {!user ? (
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 dark:text-gray-400 hover:text-primary-500 transition rounded-lg"
                        >
                            <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700">
                                <Lock className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-medium">Login</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="flex flex-col items-center justify-center flex-1 h-full text-red-600 dark:text-red-400 hover:text-red-500 transition rounded-lg"
                        >
                            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                                <LogOut className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-medium">Logout</span>
                        </button>
                    )}
                </div>
            </nav>

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6">
                        <h2 className="text-2xl font-bold mb-4 text-center text-gray-900 dark:text-white">
                            🔐 Login
                        </h2>

                        {loginError && (
                            <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                                {loginError}
                            </div>
                        )}

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={loginForm.username}
                                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                                    className="input-field"
                                    placeholder="Enter username"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={loginForm.password}
                                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                                    className="input-field"
                                    placeholder="Enter password"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleAdminLogin}
                                disabled={loggingIn}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loggingIn ? 'Logging in...' : 'Login'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowLoginModal(false);
                                    setLoginForm({ username: '', password: '' });
                                    setLoginError('');
                                }}
                                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>

                        <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                            Admin: admin / admin123
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
