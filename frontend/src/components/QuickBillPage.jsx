import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { itemsAPI, ordersAPI } from '../services/api';
import ConfirmModal from './ConfirmModal';

const QuickBillPage = () => {
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [activeTab, setActiveTab] = useState('KOT');
    const [cart, setCart] = useState([]);

    // Billing options
    const [discount, setDiscount] = useState(0);
    const [serviceCharge, setServiceCharge] = useState(false);
    const [showBillingOptions, setShowBillingOptions] = useState(false);

    // Bill completion
    const [bill, setBill] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoadingItems(true);
        try {
            const res = await itemsAPI.getAll();
            setItems(res.data?.success ? res.data.data : []);
        } catch (err) {
            console.error('fetchItems error', err);
            setItems([]);
        } finally {
            setLoadingItems(false);
        }
    };

    const filteredItems = useMemo(() => {
        return items.filter((i) => (i.category || '').toUpperCase() === (activeTab || '').toUpperCase());
    }, [items, activeTab]);

    // Cart operations
    const addItemToCart = (item) => {
        setCart((prev) => {
            const exist = prev.find((c) => c.id === item.id);
            if (exist) {
                return prev.map((c) =>
                    c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
                );
            }
            return [
                ...prev,
                {
                    id: item.id,
                    name: item.name,
                    price: Number(item.price),
                    category: item.category,
                    quantity: 1,
                },
            ];
        });
    };

    const incrementCartItem = (id) =>
        setCart((p) => p.map((c) => (c.id === id ? { ...c, quantity: c.quantity + 1 } : c)));

    const decrementCartItem = (id) =>
        setCart((p) => p.map((c) => (c.id === id ? { ...c, quantity: Math.max(1, c.quantity - 1) } : c)));

    const removeCartItem = (id) => setCart((p) => p.filter((c) => c.id !== id));

    const clearCart = () => {
        setCart([]);
        setDiscount(0);
        setServiceCharge(false);
        setShowBillingOptions(false);
    };

    const cartTotal = useMemo(() => {
        return cart.reduce((acc, c) => acc + Number((c.price * c.quantity).toFixed(4)), 0);
    }, [cart]);

    const calculateBill = () => {
        const subtotal = cartTotal;
        const serviceChargeAmount = serviceCharge ? subtotal * 0.10 : 0;
        const finalAmount = subtotal + serviceChargeAmount - parseFloat(discount || 0);
        return {
            subtotal: subtotal.toFixed(2),
            serviceChargeAmount: serviceChargeAmount.toFixed(2),
            discount: parseFloat(discount || 0).toFixed(2),
            finalAmount: Math.max(0, finalAmount).toFixed(2),
        };
    };

    const handlePayNow = async () => {
        if (!cart.length) {
            alert('Cart is empty');
            return;
        }

        setProcessing(true);
        try {
            // First, create an order for a temporary table (using table 99 as quick bill)
            const tempTableNumber = 30;

            // Add all cart items to the order
            const addResults = await Promise.all(
                cart.map((ci) =>
                    ordersAPI.addItem({
                        tableNumber: tempTableNumber,
                        itemId: ci.id,
                        quantity: parseInt(ci.quantity, 10),
                    })
                )
            );

            // Check if all items were added successfully
            const someFailed = addResults.find((r) => !(r?.data?.success));
            if (someFailed) {
                console.error('Some addItem calls failed', addResults);
                alert('Some items failed to add. Please try again.');
                setProcessing(false);
                setShowConfirm(false);
                return;
            }

            // Now finish the order
            const response = await ordersAPI.finishOrder({
                tableNumber: tempTableNumber,
                discount: parseFloat(discount || 0),
                serviceCharge: serviceCharge,
            });

            if (response.data.success) {
                setBill(response.data.data);
                clearCart();
                // Print bill automatically
                setTimeout(() => {
                    window.print();
                }, 500);
            }
        } catch (error) {
            console.error('Error processing quick bill:', error);
            alert(error.response?.data?.error || 'Failed to process bill');
        } finally {
            setProcessing(false);
            setShowConfirm(false);
        }
    };

    const isItemInCart = (itemId) => cart.some((c) => c.id === itemId);
    const truncate = (text, length = 20) =>
        text.length > length ? text.substring(0, length) + "..." : text;
    const fmt = (v) => Number(v).toFixed(2);

    const calculatedBill = cart.length > 0 ? calculateBill() : null;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        ⚡ Quick Bill
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">Fast checkout without table assignment</p>
                </div>

                {bill ? (
                    // Bill Completed View
                    <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-bold text-green-800 dark:text-green-200">✓ Bill Completed</h2>
                            <p className="text-green-600 dark:text-green-300 mt-2">Quick Bill #{bill.id}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Order Items</h3>
                            {bill.items.map((item) => (
                                <div key={item.id} className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                                    <span>{item.name} × {item.quantity}</span>
                                    <span className="font-semibold">LKR {item.subtotal.toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="mt-4 space-y-2">
                                <div className="flex justify-between text-lg text-gray-900 dark:text-gray-100">
                                    <span>Subtotal:</span>
                                    <span className="font-semibold">LKR {bill.subtotal.toFixed(2)}</span>
                                </div>
                                {bill.serviceCharge > 0 && (
                                    <div className="flex justify-between text-lg text-gray-900 dark:text-gray-100">
                                        <span>Service Charge (10%):</span>
                                        <span className="font-semibold">+LKR {bill.serviceChargeAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                {bill.discount > 0 && (
                                    <div className="flex justify-between text-lg text-red-600 dark:text-red-400">
                                        <span>Discount:</span>
                                        <span className="font-semibold">-LKR {bill.discount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-2 flex justify-between text-2xl font-bold">
                                    <span className="text-gray-900 dark:text-gray-100">Total:</span>
                                    <span className="text-green-600">LKR {bill.finalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => window.print()}
                                className="btn-secondary flex-1"
                            >
                                Print Again
                            </button>
                            <button
                                onClick={() => setBill(null)}
                                className="btn-primary flex-1"
                            >
                                New Bill
                            </button>
                        </div>
                    </div>
                ) : (
                    // Main Quick Bill Interface
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Items Selection */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Select Items</h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setActiveTab('KOT')}
                                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'KOT'
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            KOT
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('BOT')}
                                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'BOT'
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            BOT
                                        </button>
                                    </div>
                                </div>

                                {loadingItems ? (
                                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading items...</div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {filteredItems.length === 0 ? (
                                            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                                                No items in this category
                                            </div>
                                        ) : (
                                            filteredItems.map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => addItemToCart(item)}
                                                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all hover:shadow-lg active:scale-95 ${isItemInCart(item.id)
                                                            ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 dark:border-blue-400 shadow-md'
                                                            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-300'
                                                        }`}
                                                >
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                                        {truncate(item.name, 18)}
                                                    </div>
                                                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                                        LKR {fmt(item.price)}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cart and Billing */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm sticky top-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Cart</h3>

                                {cart.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        Cart is empty
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-2 max-h-[40vh] overflow-auto mb-4">
                                            {cart.map((c) => (
                                                <div
                                                    key={c.id}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                            {truncate(c.name, 15)}
                                                        </div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-300">
                                                            LKR {fmt(c.price)} × {c.quantity}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2 ml-2">
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => decrementCartItem(c.id)}
                                                                className="w-7 h-7 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100 font-bold hover:bg-gray-300 dark:hover:bg-gray-500"
                                                            >
                                                                -
                                                            </button>
                                                            <div className="w-10 h-7 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 font-semibold text-sm">
                                                                {c.quantity}
                                                            </div>
                                                            <button
                                                                onClick={() => incrementCartItem(c.id)}
                                                                className="w-7 h-7 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100 font-bold hover:bg-gray-300 dark:hover:bg-gray-500"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => removeCartItem(c.id)}
                                                            className="text-red-600 dark:text-red-400 text-xs hover:underline"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Billing Options Toggle */}
                                        <button
                                            onClick={() => setShowBillingOptions(!showBillingOptions)}
                                            className="w-full mb-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            {showBillingOptions ? '− Hide' : '+ Add'} Discount/Service Charge
                                        </button>

                                        {showBillingOptions && (
                                            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                        Discount (LKR)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={discount}
                                                        onChange={(e) => setDiscount(e.target.value)}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id="serviceCharge"
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                        checked={serviceCharge}
                                                        onChange={(e) => setServiceCharge(e.target.checked)}
                                                    />
                                                    <label
                                                        htmlFor="serviceCharge"
                                                        className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200"
                                                    >
                                                        Add Service Charge (10%)
                                                    </label>
                                                </div>
                                            </div>
                                        )}

                                        {/* Bill Summary */}
                                        {calculatedBill && (
                                            <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-2">
                                                <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                                    <span>Subtotal:</span>
                                                    <span className="font-semibold">LKR {calculatedBill.subtotal}</span>
                                                </div>
                                                {serviceCharge && (
                                                    <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                                        <span>Service Charge (10%):</span>
                                                        <span className="font-semibold text-green-600 dark:text-green-400">+LKR {calculatedBill.serviceChargeAmount}</span>
                                                    </div>
                                                )}
                                                {parseFloat(discount) > 0 && (
                                                    <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                                        <span>Discount:</span>
                                                        <span className="font-semibold text-red-600 dark:text-red-400">-LKR {calculatedBill.discount}</span>
                                                    </div>
                                                )}
                                                <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-2 flex justify-between text-xl font-bold">
                                                    <span className="text-gray-900 dark:text-gray-100">Total:</span>
                                                    <span className="text-blue-600 dark:text-blue-400">LKR {calculatedBill.finalAmount}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <button
                                            onClick={() => setShowConfirm(true)}
                                            disabled={processing}
                                            className="w-full py-3 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {processing ? 'Processing...' : '💳 Pay Now'}
                                        </button>

                                        <button
                                            onClick={clearCart}
                                            className="w-full py-2 rounded-lg mt-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                                        >
                                            Clear Cart
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handlePayNow}
                title="Complete Quick Bill"
                message={`Total amount: LKR ${calculatedBill?.finalAmount || '0.00'}. Proceed with payment?`}
            />
        </div>
    );
};

export default QuickBillPage;
