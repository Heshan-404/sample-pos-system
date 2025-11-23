import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Package, Grid3x3, History, Zap, Printer, Lock, Unlock } from "lucide-react";

export default function BottomNav() {
    const location = useLocation();

    const [isAdmin, setIsAdmin] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const correctPin = "1234";

    const navItems = [
        { path: "/tables", label: "Tables", icon: Grid3x3 },
        { path: "/", label: "Quick Bill", icon: Zap },
        { path: "/history", label: "History", icon: History },
        { path: "admin/item", label: "Items", icon: Package, admin: true },
        { path: "admin/printers", label: "Printers", icon: Printer, admin: true },
    ];

    const isActive = (path) => {
        if (path === "/") return location.pathname === "/";
        return location.pathname.startsWith(path);
    };

    return (
        <>
            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 z-40 safe-area-bottom">
                <div className="flex items-center justify-around h-16 px-2">

                    {/* Render nav items except admin-only ones */}
                    {navItems
                        .filter((item) => !item.admin || isAdmin)
                        .map(({ path, label, icon: Icon }) => (
                            <Link
                                key={path}
                                to={path}
                                className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-all duration-200 rounded-lg ${
                                    isActive(path)
                                        ? "text-primary-600 dark:text-primary-400"
                                        : "text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-300"
                                }`}
                            >
                                <div
                                    className={`p-2 rounded-xl transition-all duration-200 ${
                                        isActive(path)
                                            ? "bg-primary-100 dark:bg-primary-900/30"
                                            : ""
                                    }`}
                                >
                                    <Icon className={`w-5 h-5 ${isActive(path) ? "scale-110" : ""}`} />
                                </div>
                                <span className="text-xs font-medium">{label}</span>
                            </Link>
                        ))}

                    {/* Login / Admin Icon */}
                    <button
                        onClick={() => setShowPinModal(true)}
                        className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 dark:text-gray-400 hover:text-primary-500 transition rounded-lg"
                    >
                        <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700">
                            {isAdmin ? (
                                <Unlock className="w-5 h-5 text-green-600" />
                            ) : (
                                <Lock className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            )}
                        </div>
                        <span className="text-xs font-medium">{isAdmin ? "Admin" : "Login"}</span>
                    </button>
                </div>
            </nav>

            {/* PIN Modal */}
            {showPinModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-64">
                        <h2 className="text-lg font-semibold mb-3 text-center">
                            Enter Admin PIN
                        </h2>

                        <input
                            type="password"
                            maxLength={4}
                            placeholder="••••"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    if (e.target.value === correctPin) {
                                        setIsAdmin(true);
                                        setShowPinModal(false);
                                    } else {
                                        alert("Wrong PIN");
                                    }
                                }
                            }}
                            className="border w-full p-2 rounded-lg text-center text-lg tracking-widest outline-none"
                            autoFocus
                        />

                        <button
                            className="mt-4 bg-primary-600 text-white w-full py-2 rounded-lg"
                            onClick={() => setShowPinModal(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
