import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ordersAPI, printAPI } from '../services/api';
import ConfirmModal from './ConfirmModal';

const BillingPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const tableFromUrl = searchParams.get('table');
    const [selectedTable, setSelectedTable] = useState(tableFromUrl ? parseInt(tableFromUrl, 10) : 1);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [serviceCharge, setServiceCharge] = useState(true); // Default to true
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [additionalItems, setAdditionalItems] = useState('');
    const [bill, setBill] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [printing, setPrinting] = useState(false);

    const [splitBillMode, setSplitBillMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState({}); // { groupKey: quantity }

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
                setSplitBillMode(false);
                setSelectedItems({});
            }
        } catch (error) {
            console.error('Error fetching order:', error);
        } finally {
            setLoading(false);
        }
    };

    // Consolidate items for display and billing
    const consolidatedItems = useMemo(() => {
        if (!currentOrder?.items) return [];
        const map = new Map();
        currentOrder.items.forEach(item => {
            const key = `${item.itemId}_${item.price}`;
            if (!map.has(key)) {
                map.set(key, {
                    ...item,
                    groupKey: key,
                    quantity: 0,
                    subtotal: 0,
                    originalItems: []
                });
            }
            const entry = map.get(key);
            entry.quantity += item.quantity;
            entry.subtotal += item.subtotal;
            entry.originalItems.push(item);
        });
        return Array.from(map.values());
    }, [currentOrder]);

    const toggleSplitMode = () => {
        setSplitBillMode(!splitBillMode);
        setSelectedItems({});
    };

    const handleItemSelection = (groupKey, maxQty, newQty) => {
        const qty = Math.max(0, Math.min(maxQty, parseInt(newQty) || 0));
        setSelectedItems(prev => ({
            ...prev,
            [groupKey]: qty
        }));
    };

    const calculateBill = () => {
        if (!currentOrder) return null;

        let subtotal = 0;

        if (splitBillMode) {
            consolidatedItems.forEach(item => {
                const qty = selectedItems[item.groupKey] || 0;
                if (qty > 0) {
                    subtotal += item.price * qty;
                }
            });
        } else {
            subtotal = currentOrder.total;
        }

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
            let response;

            if (splitBillMode) {
                const itemsToPay = [];

                // Distribute selected quantities to original items
                Object.entries(selectedItems).forEach(([groupKey, qty]) => {
                    if (qty <= 0) return;

                    const group = consolidatedItems.find(i => i.groupKey === groupKey);
                    if (!group) return;

                    let remainingQty = qty;
                    // Distribute FIFO
                    for (const originalItem of group.originalItems) {
                        if (remainingQty <= 0) break;

                        const take = Math.min(remainingQty, originalItem.quantity);
                        itemsToPay.push({
                            orderItemId: originalItem.id,
                            quantity: take
                        });
                        remainingQty -= take;
                    }
                });

                if (itemsToPay.length === 0) {
                    alert("Please select items to pay");
                    setLoading(false);
                    return;
                }

                response = await ordersAPI.finishPartialOrder({
                    tableNumber: selectedTable,
                    itemsToPay,
                    discount: parseFloat(discount || 0),
                    serviceCharge: serviceCharge,
                    paymentMethod: paymentMethod,
                    additionalItems: additionalItems,
                });
            } else {
                response = await ordersAPI.finishOrder({
                    tableNumber: selectedTable,
                    discount: parseFloat(discount || 0),
                    serviceCharge: serviceCharge,
                    paymentMethod: paymentMethod,
                    additionalItems: additionalItems,
                });
            }

            if (response.data.success) {
                setBill(response.data.data);
                setCurrentOrder(null);
                setDiscount(0);
                setServiceCharge(true);
                setPaymentMethod('CASH');
                setAdditionalItems('');

                // Auto-print receipt after finishing bill
                const historyId = response.data.data.historyId;
                if (historyId) {
                    try {
                        await printAPI.printReceipt(historyId);
                        console.log('Receipt printed successfully');
                    } catch (printError) {
                        console.error('Auto-print failed:', printError);
                    }
                }
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
                                onClick={() => {
                                    setBill(null);
                                    fetchTableOrder();
                                }}
                                className="btn-secondary text-lg py-3"
                            >
                                Back to Table
                            </button>
                        </div>
                        <div className="mt-4">
                            <button
                                onClick={() => navigate('/tables')}
                                className="w-full py-3 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 underline"
                            >
                                Go to Table Selection
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
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">Bill for Table {selectedTable}</h2>
                            <button
                                onClick={toggleSplitMode}
                                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${splitBillMode
                                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200'
                                    }`}
                            >
                                {splitBillMode ? 'Cancel Split' : 'Split Bill'}
                            </button>
                        </div>

                        <div className="mb-6 space-y-3">
                            <h3 className="text-lg font-semibold">Order Items</h3>
                            {consolidatedItems.map((item) => (
                                <div key={item.groupKey} className={`flex justify-between items-center p-3 rounded-lg border ${splitBillMode && (selectedItems[item.groupKey] || 0) > 0
                                    ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
                                    : 'bg-gray-50 border-gray-100 dark:bg-gray-700 dark:border-gray-600'
                                    }`}>
                                    <div className="flex-1">
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-amber-600 dark:text-amber-400">LKR {item.price.toFixed(2)} × {item.quantity}</p>
                                    </div>

                                    {splitBillMode ? (
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 px-2 py-1">
                                                <span className="text-xs text-gray-500">Pay:</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={item.quantity}
                                                    value={selectedItems[item.groupKey] || ''}
                                                    onChange={(e) => handleItemSelection(item.groupKey, item.quantity, e.target.value)}
                                                    className="w-12 text-center bg-transparent outline-none font-bold"
                                                    placeholder="0"
                                                />
                                                <span className="text-xs text-gray-400">/ {item.quantity}</span>
                                            </div>
                                            <p className="font-bold w-24 text-right">
                                                LKR {((selectedItems[item.groupKey] || 0) * item.price).toFixed(2)}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="font-bold">LKR {item.subtotal.toFixed(2)}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg space-y-4">
                            <h3 className="text-lg font-semibold">Billing Options</h3>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Payment Method</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('CASH')}
                                        className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${paymentMethod === 'CASH'
                                            ? 'bg-green-600 text-white shadow-lg'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        💵 Cash
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('CARD')}
                                        className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${paymentMethod === 'CARD'
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        💳 Card
                                    </button>
                                </div>
                            </div>

                            {/* Additional Items */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Additional Items (Optional)</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={additionalItems}
                                    onChange={(e) => setAdditionalItems(e.target.value)}
                                    placeholder="e.g., Extra napkins, spoon, takeaway box"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Discount Amount (LKR)</label>
                                <input type="number" min="0" step="0.01" className="input-field" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0.00" />
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" id="serviceCharge" className="w-5 h-5" checked={serviceCharge} onChange={(e) => setServiceCharge(e.target.checked)} />
                                <label htmlFor="serviceCharge" className="ml-3 text-sm font-medium">Add Service Charge (10%)</label>
                            </div>
                        </div>
                        {calculatedBill && (
                            <div className="mb-6 p-6 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-3">
                                <h3 className="text-lg font-semibold mb-4">Bill Summary {splitBillMode && '(Partial)'}</h3>
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
                            {loading ? 'Processing...' : (splitBillMode ? 'Finish Partial Bill' : 'Finish Bill & Close Order')}
                        </button>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleFinishBill}
                title={splitBillMode ? "Finish Partial Bill" : "Finish Bill"}
                message={`Are you sure you want to finish the ${splitBillMode ? 'partial ' : ''}bill for Table  ${selectedTable}?`}
            />
        </div>
    );
};

export default BillingPage;
