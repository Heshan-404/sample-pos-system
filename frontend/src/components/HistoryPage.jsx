import { useState, useEffect } from 'react';
import { historyAPI, reportsAPI } from '../services/api';

const HistoryPage = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Reports state
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportEndDate, setReportEndDate] = useState('');
    const [itemsReportDate, setItemsReportDate] = useState('');
    const [generatingReport, setGeneratingReport] = useState(false);

    useEffect(() => {
        fetchHistory();
        // Set default dates to today
        const today = new Date().toISOString().split('T')[0];
        setReportStartDate(today);
        setReportEndDate(today);
        setItemsReportDate(today);
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await historyAPI.getAll();
            if (response.data.success) {
                setHistory(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
            alert('Failed to fetch history');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (bill) => {
        setSelectedBill(bill);
        setShowDetailModal(true);
    };

    const closeModal = () => {
        setShowDetailModal(false);
        setSelectedBill(null);
    };

    const handleGenerateOrdersReport = async () => {
        if (!reportStartDate || !reportEndDate) {
            alert('Please select both start and end dates');
            return;
        }

        setGeneratingReport(true);
        try {
            const response = await reportsAPI.generateOrdersReport(reportStartDate, reportEndDate);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `orders-report-${reportStartDate}-to-${reportEndDate}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            alert('Orders report generated successfully!');
        } catch (error) {
            console.error('Error generating orders report:', error);
            alert('Failed to generate orders report');
        } finally {
            setGeneratingReport(false);
        }
    };

    const handleGenerateItemsSalesReport = async () => {
        if (!itemsReportDate) {
            alert('Please select a date');
            return;
        }

        setGeneratingReport(true);
        try {
            const response = await reportsAPI.generateItemsSalesReport(itemsReportDate);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `items-sales-report-${itemsReportDate}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            alert('Items sales report generated successfully!');
        } catch (error) {
            console.error('Error generating items sales report:', error);
            alert('Failed to generate items sales report');
        } finally {
            setGeneratingReport(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-white">
                    Orders History
                </h1>

                {/* Reports Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Orders Report */}
                    <div className="card">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">📊 Orders Report</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Generate a CSV report of all orders in a date range (opens in Excel)</p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={reportStartDate}
                                    onChange={(e) => setReportStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={reportEndDate}
                                    onChange={(e) => setReportEndDate(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleGenerateOrdersReport}
                                disabled={generatingReport}
                                className="btn-primary w-full"
                            >
                                {generatingReport ? 'Generating...' : 'Generate Report'}
                            </button>
                        </div>
                    </div>

                    {/* Items Sales Report */}
                    <div className="card">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">📈 Items Sales Report</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Generate a CSV report of item sales for a specific date (opens in Excel)</p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={itemsReportDate}
                                    onChange={(e) => setItemsReportDate(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleGenerateItemsSalesReport}
                                disabled={generatingReport}
                                className="btn-success w-full"
                            >
                                {generatingReport ? 'Generating...' : 'Generate Report'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="card">
                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600 dark:text-gray-400 text-lg">Loading history...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600 dark:text-gray-400 text-lg">No orders history yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Order ID</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Table No</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Total Amount</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Date</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {history.map((bill) => (
                                        <tr key={bill.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">#{bill.orderId}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Table {bill.tableNumber}</td>
                                            <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">
                                                ${bill.finalAmount.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {new Date(bill.closed_at).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleViewDetails(bill)}
                                                    className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-all duration-200"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedBill && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                        onClick={closeModal}
                    ></div>

                    {/* Modal */}
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-6 transform transition-all max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Order #{selectedBill.orderId} - Table {selectedBill.tableNumber}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Items */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Items</h3>
                                <div className="space-y-2">
                                    {selectedBill.items.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-800 dark:text-gray-200">{item.itemName}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    ${item.itemPrice.toFixed(2)} × {item.quantity}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-800 dark:text-gray-200">
                                                    ${item.subtotal.toFixed(2)}
                                                </p>
                                                <span className={`text-xs px-2 py-1 rounded-full ${item.itemCategory === 'KOT'
                                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                    }`}>
                                                    {item.itemCategory}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Bill Summary */}
                            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-2">
                                <div className="flex justify-between text-lg">
                                    <span className="text-gray-700 dark:text-gray-300">Subtotal:</span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                                        ${selectedBill.subtotal.toFixed(2)}
                                    </span>
                                </div>

                                {selectedBill.serviceCharge > 0 && (
                                    <div className="flex justify-between text-lg">
                                        <span className="text-gray-700 dark:text-gray-300">Service Charge (10%):</span>
                                        <span className="font-semibold text-green-600 dark:text-green-400">
                                            +${selectedBill.serviceChargeAmount.toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                {selectedBill.discount > 0 && (
                                    <div className="flex justify-between text-lg">
                                        <span className="text-gray-700 dark:text-gray-300">Discount:</span>
                                        <span className="font-semibold text-red-600 dark:text-red-400">
                                            -${selectedBill.discount.toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-2 flex justify-between text-2xl font-bold">
                                    <span className="text-gray-800 dark:text-gray-200">Total:</span>
                                    <span className="text-green-600 dark:text-green-400">
                                        ${selectedBill.finalAmount.toFixed(2)}
                                    </span>
                                </div>

                                <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                                    Closed at: {new Date(selectedBill.closed_at).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
