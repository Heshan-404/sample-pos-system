import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import ItemManagement from './components/ItemManagement';
import TablesOverview from './components/TablesOverview';
import TableOrderPage from './components/TableOrderPage';
import BillingPage from './components/BillingPage';
import HistoryPage from './components/HistoryPage';
import './index.css';

function Navigation() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              🍽️ Restaurant POS
            </h1>
          </div>
          <div className="flex space-x-4">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${isActive('/') && location.pathname === '/'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              Items
            </Link>
            <Link
              to="/tables"
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${isActive('/table')
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              Tables
            </Link>
            <Link
              to="/billing"
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${isActive('/billing')
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              Billing
            </Link>
            <Link
              to="/history"
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${isActive('/history')
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              History
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Navigation />

        <main className="py-8">
          <Routes>
            <Route path="/" element={<ItemManagement />} />
            <Route path="/tables" element={<TablesOverview />} />
            <Route path="/table/:tableNumber" element={<TableOrderPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </main>

        <footer className="bg-white dark:bg-gray-800 shadow-lg mt-12">
          <div className="container mx-auto px-4 py-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Restaurant POS System © 2025 | Built with React & Express
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
