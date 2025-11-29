import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import WaiterLogin from './components/WaiterLogin';
import Unauthorized from './components/Unauthorized';
import WaiterDashboard from './components/WaiterDashboard';
import UserManagement from './components/UserManagement';
import ItemManagement from './components/ItemManagement';
import TablesOverview from './components/TablesOverview';
import TableOrderPage from './components/TableOrderPage';
import BillingPage from './components/BillingPage';
import HistoryPage from './components/HistoryPage';
import QuickBillPage from './components/QuickBillPage';
import Layout from './components/layout/Layout';
import PageTransition from './components/layout/PageTransition';
import PrinterManagement from './components/PrinterManagement';
import ShopManagement from './components/ShopManagement';
import './index.css';

function App() {
    const location = useLocation();

    return (
        <AuthProvider>
            <Routes location={location}>
                {/* Public Routes */}
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Public Table Routes */}
                <Route
                    path="/tables"
                    element={
                        <Layout>
                            <PageTransition>
                                <TablesOverview />
                            </PageTransition>
                        </Layout>
                    }
                />
                <Route
                    path="/table/:tableNumber"
                    element={
                        <Layout>
                            <PageTransition>
                                <TableOrderPage />
                            </PageTransition>
                        </Layout>
                    }
                />

                {/* Protected Routes */}
                <Route
                    path="/*"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <AnimatePresence mode="wait">
                                    <Routes location={location} key={location.pathname}>
                                        {/* Admin Routes */}
                                        <Route
                                            path="/admin/users"
                                            element={
                                                <ProtectedRoute roles={['admin']}>
                                                    <PageTransition>
                                                        <UserManagement />
                                                    </PageTransition>
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/item"
                                            element={
                                                <ProtectedRoute roles={['admin']}>
                                                    <PageTransition>
                                                        <ItemManagement />
                                                    </PageTransition>
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/printers"
                                            element={
                                                <ProtectedRoute roles={['admin']}>
                                                    <PageTransition>
                                                        <PrinterManagement />
                                                    </PageTransition>
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/admin/shops"
                                            element={
                                                <ProtectedRoute roles={['admin']}>
                                                    <PageTransition>
                                                        <ShopManagement />
                                                    </PageTransition>
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Cashier/Admin Routes */}
                                        <Route
                                            path="/billing"
                                            element={
                                                <ProtectedRoute roles={['admin', 'cashier']}>
                                                    <PageTransition>
                                                        <BillingPage />
                                                    </PageTransition>
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/quick-bill"
                                            element={
                                                <ProtectedRoute roles={['admin', 'cashier']}>
                                                    <PageTransition>
                                                        <QuickBillPage />
                                                    </PageTransition>
                                                </ProtectedRoute>
                                            }
                                        />
                                        <Route
                                            path="/history"
                                            element={
                                                <ProtectedRoute roles={['admin', 'cashier']}>
                                                    <PageTransition>
                                                        <HistoryPage />
                                                    </PageTransition>
                                                </ProtectedRoute>
                                            }
                                        />

                                        {/* Catch all */}
                                        <Route path="*" element={<Navigate to="/tables" replace />} />
                                    </Routes>
                                </AnimatePresence>
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                {/* Default redirect to tables */}
                <Route path="/" element={<Navigate to="/tables" replace />} />
            </Routes>
        </AuthProvider>
    );
}

export default App;
