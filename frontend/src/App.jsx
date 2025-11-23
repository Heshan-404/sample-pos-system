import {Route, Routes, useLocation} from 'react-router-dom';
import {AnimatePresence} from 'framer-motion';
import ItemManagement from './components/ItemManagement';
import TablesOverview from './components/TablesOverview';
import TableOrderPage from './components/TableOrderPage';
import BillingPage from './components/BillingPage';
import HistoryPage from './components/HistoryPage';
import QuickBillPage from './components/QuickBillPage';
import Layout from './components/layout/Layout';
import PageTransition from './components/layout/PageTransition';
import PrinterManagement from './components/PrinterManagement';
import './index.css';

function App() {
    const location = useLocation();

    return (
        <Layout>
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route
                        path="/admin/item"
                        element={
                            <PageTransition>
                                <ItemManagement/>
                            </PageTransition>
                        }
                    />
                    <Route
                        path="/tables"
                        element={
                            <PageTransition>
                                <TablesOverview/>
                            </PageTransition>
                        }
                    />
                    <Route
                        path="/table/:tableNumber"
                        element={
                            <PageTransition>
                                <TableOrderPage/>
                            </PageTransition>
                        }
                    />
                    <Route
                        path="/billing"
                        element={
                            <PageTransition>
                                <BillingPage/>
                            </PageTransition>
                        }
                    />
                    <Route
                        path="/"
                        element={
                            <PageTransition>
                                <QuickBillPage/>
                            </PageTransition>
                        }
                    />
                    <Route
                        path="/history"
                        element={
                            <PageTransition>
                                <HistoryPage/>
                            </PageTransition>
                        }
                    />
                    <Route
                        path="admin/printers"
                        element={
                            <PageTransition>
                                <PrinterManagement/>
                            </PageTransition>
                        }
                    />
                </Routes>
            </AnimatePresence>
        </Layout>
    );
}

export default App;

