import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header - Fixed top */}
      <Header onMenuClick={toggleSidebar} />

      {/* Sidebar Drawer */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main Content - with padding for header and bottom nav */}
      <main className=" pb-20 md:pb-8 px-4 md:px-6 lg:px-8 mx-auto">
        <div className="safe-area-inset mb-3">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Mobile only */}
      <BottomNav />

      {/* Footer - Hidden on mobile, visible on desktop */}

    </div>
  );
}
