import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ordersAPI, printAPI } from '../services/api';
import ConfirmModal from './ConfirmModal';

const BillingPage = () => {
    const [searchParams] = useSearchParams();
    const tableFromUrl = searchParams.get('table');
    const [selectedTable, setSelectedTable] = useState(tableFromUrl ? parseInt(tableFromUrl, 10) : 1);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [serviceCharge, setServiceCharge] = useState(false);
    const [bill, setBill] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [printing, setPrinting] = useState(false);

    const tableNumbers = Array.from({ length: 30 }, (_, i) => i + 1);

    useEffect(() => {
        fetchTableOrder();
    }, [selectedTable]);

    const fetchTableOrder = async () => {
        setLoading(true);
        try {
            const response = await ordersAPI.getTableOrder(selectedTable);
            if (response.data.success) {
                setCurrentOrder(response.data.data);
                setBill(null);
                setDiscount(0);
                setServiceCharge(false);
            }
        } catch (error) {
            console.error('Error fetching order:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateBill = () => {
        if (!currentOrder) return null;
        const subtotal = currentOrder.total;
        const serviceChargeAmount = serviceCharge ? subtotal * 0.10 : 0;
        const finalAmount = subtotal + serviceChargeAmount - parseFloat(discount || 0);
        return {
            subtotal: subtotal.toFixed(2),
            serviceChargeAmount: serviceChargeAmount.toFixed(2),
            discount: parseFloat(discount || 0).toFixed(2),
            finalAmount: finalAmount.toFixed(2),
        };
    };

    const handleFinishBill = async () => {
        setLoading(true);
        try {
            const response = await ordersAPI.finishOrder({
                tableNumber: selectedTable,
                discount: parseFloat(discount || 0),
                serviceCharge: serviceCharge,
            });
            if (response.data.success) {
                setBill(response.data.data);
                setCurrentOrder(null);
                setDiscount(0);
                setServiceCharge(false);
            }
        } catch (error) {
            console.error('Error finishing bill:', error);
            alert(error.response?.data?.error || 'Failed to finish bill');
        } finally {
            setLoading(false);
            setShowConfirm(false);
        }
    };

    const handlePrintReceipt = async () => {
        if (!bill || !bill.historyId) {
            alert('No bill to print');
            return;
        }

        setPrinting(true);
        try {
            const response = await printAPI.printReceipt(bill.historyId);
            if (response.data.success) {
                alert('Receipt sent to printer!');
            }
        } catch (error) {
            console.error('Error printing receipt:', error);
            alert(error.response?.data?.error || 'Failed to print receipt');
        } finally {
            setPrinting(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!bill || !bill.historyId) {
            alert('No bill to download');
            return;
        }

        setPrinting(true);
        try {
            const response = await printAPI.downloadPDF(bill.historyId);

            // Create a download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `receipt-table-${bill.tableNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            alert('PDF downloaded successfully!');
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Failed to download PDF');
        } finally {
            setPrinting(false);
        }
    };

    const calculatedBill = calculateBill();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">


                {/*<div className="card mb-8">*/}
                {/*    <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">*/}
                {/*        Select Table*/}
                {/*    </h2>*/}
                {/*    <select*/}
                {/*        className="input-field max-w-xs"*/}
                {/*        value={selectedTable}*/}
                {/*        onChange={(e) => setSelectedTable(parseInt(e.target.value))}*/}
                {/*    >*/}
                {/*        {tableNumbers.map((num) => (*/}
                {/*            <option key={num} value={num}>Table {num}</option>*/}
                {/*        ))}*/}
                {/*    </select>*/}
                {/*</div>*/}

                {bill ? (
                    <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-bold text-green-800 dark:text-green-200">✓ Bill Completed</h2>
                            <p className="text-green-600 dark:text-green-300 mt-2">Table {bill.tableNumber}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                            <h3 className="text-xl font-semibold mb-4">Order Items</h3>
                            {bill.items.map((item) => (
                                <div key={item.id} className="flex justify-between py-2 border-b">
                                    <span >{item.name} × {item.quantity}</span>
                                    <span className="font-semibold">LKR {item.subtotal.toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="mt-4 space-y-2">
                                <div className="flex justify-between text-lg">
                                    <span>Subtotal:</span>
                                    <span className="font-semibold">LKR {bill.subtotal.toFixed(2)}</span>
                                </div>
                                {bill.serviceCharge > 0 && (
                                    <div className="flex justify-between text-lg">
                                        <span>Service Charge (10%):</span>
                                        <span className="font-semibold">+LKR {bill.serviceChargeAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                {bill.discount > 0 && (
                                    <div className="flex justify-between text-lg text-red-600">
                                        <span>Discount:</span>
                                        <span className="font-semibold">-LKR {bill.discount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="border-t-2 pt-2 flex justify-between text-2xl font-bold">
                                    <span>Total:</span>
                                    <span className="text-green-600">LKR {bill.finalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                            <button
                                onClick={handlePrintReceipt}
                                className="btn-primary text-lg py-3"
                                disabled={printing}
                            >
                                {printing ? '🖨️ Printing...' : '🖨️ Print Receipt'}
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                className="btn-success text-lg py-3"
                                disabled={printing}
                            >
                                {printing ? '📄 Generating...' : '📄 Download PDF'}
                            </button>
                            <button
                                onClick={() => { setBill(null); fetchTableOrder(); }}
                                className="btn-secondary text-lg py-3"
                            >
                                New Bill
                            </button>
                        </div>
                    </div>
                ) : loading ? (
                    <div className="card text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400 text-lg">Loading...</p>
                    </div>
                ) : !currentOrder || !currentOrder.items || currentOrder.items.length === 0 ? (
                    <div className="card text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400 text-lg">No open order for Table {selectedTable}</p>
                    </div>
                ) : (
                    <div className="card">
                        <h2 className="text-2xl font-semibold mb-6">Bill for Table {selectedTable}</h2>
                        <div className="mb-6 space-y-3">
                            <h3 className="text-lg font-semibold">Order Items</h3>
                            {currentOrder.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-amber-300">LKR {item.price.toFixed(2)} × {item.quantity}</p>
                                    </div>
                                    <p className="font-bold">LKR {item.subtotal.toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg space-y-4">
                            <h3 className="text-lg font-semibold">Billing Options</h3>
                            <div>
                                <label className="block text-sm font-medium mb-2">Discount Amount (LKR )</label>
                                <input type="number" min="0" step="0.01" className="input-field" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0.00" />
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" id="serviceCharge" className="w-5 h-5" checked={serviceCharge} onChange={(e) => setServiceCharge(e.target.checked)} />
                                <label htmlFor="serviceCharge" className="ml-3 text-sm font-medium">Add Service Charge (10%)</label>
                            </div>
                        </div>
                        {calculatedBill && (
                            <div className="mb-6 p-6 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-3">
                                <h3 className="text-lg font-semibold mb-4">Bill Summary</h3>
                                <div className="flex justify-between text-lg">
                                    <span>Subtotal:</span>
                                    <span className="font-semibold">LKR {calculatedBill.subtotal}</span>
                                </div>
                                {serviceCharge && (
                                    <div className="flex justify-between text-lg">
                                        <span>Service Charge (10%):</span>
                                        <span className="font-semibold text-green-600">+LKR {calculatedBill.serviceChargeAmount}</span>
                                    </div>
                                )}
                                {parseFloat(discount) > 0 && (
                                    <div className="flex justify-between text-lg">
                                        <span>Discount:</span>
                                        <span className="font-semibold text-red-600">-LKR {calculatedBill.discount}</span>
                                    </div>
                                )}
                                <div className="border-t-2 pt-3 flex justify-between text-2xl font-bold">
                                    <span>Final Amount:</span>
                                    <span className="text-primary-600">LKR {calculatedBill.finalAmount}</span>
                                </div>
                            </div>
                        )}
                        <button onClick={() => setShowConfirm(true)} className="btn-success w-full text-lg py-3" disabled={loading}>
                            {loading ? 'Processing...' : 'Finish Bill & Close Order'}
                        </button>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleFinishBill}
                title="Finish Bill"
                message={`Are you sure you want to finish the bill for Table  ${selectedTable}?`}
            />
        </div>
    );
};

export default BillingPage;
