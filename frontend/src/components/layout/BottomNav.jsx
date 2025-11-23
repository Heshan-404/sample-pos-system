import { Link, useLocation } from 'react-router-dom';
import { Package, Grid3x3, Receipt, History, Zap,Printer } from 'lucide-react';

const navItems = [
    { path: '/', label: 'Items', icon: Package },
    { path: '/tables', label: 'Tables', icon: Grid3x3 },
    { path: '/quick-bill', label: 'Quick Bill', icon: Zap },
    { path: '/history', label: 'History', icon: History },
    { path: '/printers', label: 'Printers', icon: Printer },
];

export default function BottomNav() {
    const location = useLocation();

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0  bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 z-40 safe-area-bottom">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map(({ path, label, icon: Icon }) => (
                    <Link
                        key={path}
                        to={path}
                        className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-all duration-200 rounded-lg ${isActive(path)
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-300'
                            }`}
                    >
                        <div className={`p-2 rounded-xl transition-all duration-200 ${isActive(path) ? 'bg-primary-100 dark:bg-primary-900/30' : ''
                            }`}>
                            <Icon className={`w-5 h-5 ${isActive(path) ? 'scale-110' : ''}`} />
                        </div>
                        <span className="text-xs font-medium">{label}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}
