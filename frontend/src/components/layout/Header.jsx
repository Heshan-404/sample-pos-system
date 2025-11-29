import { Menu } from 'lucide-react';

export default function Header({ onMenuClick }) {
    return (
        <header className="hidden fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-md safe-area-top">
            <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
                {/* Left: Menu button (mobile) */}
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-action-none"
                    aria-label="Toggle menu"
                >
                    <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </button>

                {/* Center: Logo */}
                <div className="flex-1 md:flex-none text-center md:text-left">
                    <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                        🍽️ Restaurant POS
                    </h1>
                </div>

                {/* Right: Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-2">


                    {/* Desktop nav items are handled by Sidebar on larger screens */}
                </nav>
            </div>
        </header>
    );
}
