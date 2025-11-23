// TableOrderPage.jsx
// Screenshot used for styling reference: /mnt/data/e7a9bdf2-32ec-4104-98ca-a87ca9c26d36.png

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { itemsAPI, ordersAPI } from '../services/api';

// Auto Light/Dark mode + bg option 3: light bg-gray-100 / dark bg-gray-900
// Cards: bg-white (light) / bg-gray-800 (dark)

const TableOrderPage = () => {
    const { tableNumber } = useParams();
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [currentOrder, setCurrentOrder] = useState(null);

    const [loadingItems, setLoadingItems] = useState(false);
    const [loadingOrder, setLoadingOrder] = useState(false);
    const [submittingCart, setSubmittingCart] = useState(false);

    const [activeTab, setActiveTab] = useState('KOT');
    const [cart, setCart] = useState([]);
    const [editableOrderItems, setEditableOrderItems] = useState([]);

    // Custom item modal state
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customName, setCustomName] = useState('Additional Item');
    const [customPrice, setCustomPrice] = useState('');
    const [customQty, setCustomQty] = useState(1);
    // editingCustomId: if null -> creating new, otherwise editing cart item with this id
    const [editingCustomId, setEditingCustomId] = useState(null);

    useEffect(() => {
        fetchItems();
        fetchTableOrder();
        setCart([]);
    }, [tableNumber]);

    // check if item is in cart → highlight card
    const isItemInCart = (itemId) => cart.some((c) => c.id === itemId && !c.isCustom);

    // Fetch items
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

    // Fetch order
    const fetchTableOrder = async () => {
        setLoadingOrder(true);
        try {
            const res = await ordersAPI.getTableOrder(parseInt(tableNumber, 10));
            if (res.data?.success && res.data.data) {
                setCurrentOrder(res.data.data);
                const edited = (res.data.data.items || []).map((it) => ({
                    id: it.id,
                    itemId: it.itemId || 0,
                    name: it.name,
                    price: Number(it.price),
                    category: it.category,
                    quantity: Number(it.quantity),
                    subtotal: Number(it.subtotal),
                }));
                setEditableOrderItems(edited);
            } else {
                setCurrentOrder(null);
                setEditableOrderItems([]);
            }
        } catch (err) {
            console.error('fetchTableOrder error', err);
            setCurrentOrder(null);
            setEditableOrderItems([]);
        } finally {
            setLoadingOrder(false);
        }
    };

    const filteredItems = useMemo(() => {
        return items.filter((i) => (i.category || '').toUpperCase() === (activeTab || '').toUpperCase());
    }, [items, activeTab]);

    // ---------- CART ----------
    // Add normal item (from items grid) to cart
    const addItemToCartQuick = (item) => {
        setCart((prev) => {
            const exist = prev.find((c) => c.id === item.id && !c.isCustom);
            if (exist) return prev.map((c) => (c.id === item.id && !c.isCustom ? { ...c, quantity: c.quantity + 1 } : c));
            return [
                ...prev,
                {
                    id: item.id,
                    name: item.name,
                    price: Number(item.price),
                    category: item.category,
                    quantity: 1,
                    isCustom: false,
                },
            ];
        });
    };
    const truncate = (text, length = 20) =>
        text.length > length ? text.substring(0, length) + "..." : text;
    // Add custom item to cart (new)
    const addCustomItemToCart = ({ name, price, quantity }) => {
        // create a unique id for local cart item (use timestamp + random)
        // const localId = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        setCart((prev) => [
            ...prev,
            {
                id: 0,
                name: name || 'Additional Item',
                price: Number(price || 0),
                quantity: Number(quantity || 1),
                isCustom: true,
            },
        ]);
    };

    const incrementCartItem = (id) =>
        setCart((p) => p.map((c) => (c.id === id ? { ...c, quantity: c.quantity + 1 } : c)));
    const decrementCartItem = (id) =>
        setCart((p) => p.map((c) => (c.id === id ? { ...c, quantity: Math.max(1, c.quantity - 1) } : c)));
    const removeCartItem = (id) => setCart((p) => p.filter((c) => c.id !== id));
    const clearCart = () => setCart([]);

    // precise total calculation (avoid float surprises)
    const cartTotal = useMemo(() => {
        // accumulate with integer cents-like approach using 4 decimal places
        return cart.reduce((acc, c) => acc + Number((c.price * c.quantity).toFixed(4)), 0);
    }, [cart]);

    const submitCartToOrder = async () => {
        if (!cart.length) return alert('Cart is empty');
        setSubmittingCart(true);
        try {
            // Attempt to send each cart item to backend.
            // For custom items, we include a "custom" flag and send name & price in payload.
            // Backend must support these fields. If not, it may fail — we handle errors per item.
            const results = await Promise.all(
                cart.map((ci) => {
                    if (ci.isCustom) {
                        // payload includes custom fields — adapt if your backend expects different keys
                        return ordersAPI.addItem({
                            tableNumber: parseInt(tableNumber, 10),
                            itemId: 19,
                            quantity: parseInt(ci.quantity, 10),
                            custom: true,
                            name: ci.name,
                            price: Number(ci.price),
                        });
                    }
                    return ordersAPI.addItem({
                        tableNumber: parseInt(tableNumber, 10),
                        itemId: ci.id,
                        quantity: parseInt(ci.quantity, 10),
                    });
                })
            );

            // If any failed, log and notify
            const someFailed = results.find((r) => !(r?.data?.success));
            if (someFailed) {
                console.error('Some addItem calls failed', results);
                alert('Some items failed to add. Check console for details.');
            } else {
                clearCart();
                fetchTableOrder();
            }
        } catch (err) {
            console.error('submitCartToOrder error', err);
            alert(err?.response?.data?.error || 'Failed to add cart items');
        } finally {
            setSubmittingCart(false);
        }
    };

    // ---------- REAL-TIME ORDER SYNC ----------



    const updateOrderItemQty = async (orderItemId, newQty) => {
        try {
            if (newQty === 0) {
                // Delete item
                await ordersAPI.removeItem(orderItemId);
            } else {
                // Update item quantity
                await ordersAPI.updateItemQuantity(orderItemId, newQty);
            }
        } catch (err) {
            console.error("updateOrderItemQty error", err);
            alert("Failed to update item");
        }
    };


    const incEditableItem = (id) => {
        const current = editableOrderItems.find((i) => i.id === id);
        const newQty = (current?.quantity || 0) + 1;
        setEditableOrderItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: newQty } : i)));
        updateOrderItemQty(id, newQty);
    };

    const decEditableItem = (id) => {
        const current = editableOrderItems.find((i) => i.id === id);
        const newQty = Math.max(0, (current?.quantity || 0) - 1);
        setEditableOrderItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: newQty } : i)));
        updateOrderItemQty(id, newQty);
    };

    const setEditableItemQty = (id, value) => {
        const qty = Math.max(0, parseInt(value || '0', 10) || 0);
        setEditableOrderItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
        updateOrderItemQty(id, qty);
    };

    const handleLocalDelete = (id) => {
        setEditableOrderItems((p) => p.filter((i) => i.id !== id));
        updateOrderItemQty(id, 0);
    };

    const editableOrderTotal = useMemo(
        () => editableOrderItems.reduce((s, it) => s + Number((it.price * it.quantity).toFixed(4)), 0),
        [editableOrderItems]
    );

    // helper to render price with 2 decimals
    const fmt = (v) => Number(v).toFixed(2);

    // -- Custom Item Modal handlers --
    const openCustomModalForCreate = () => {
        setEditingCustomId(null);
        setCustomName('Additional Item');
        setCustomPrice('');
        setCustomQty(1);
        setShowCustomModal(true);
    };

    const openCustomModalForEdit = (cartItem) => {
        setEditingCustomId(cartItem.id);
        setCustomName(cartItem.name);
        setCustomPrice(String(cartItem.price ?? ''));
        setCustomQty(cartItem.quantity ?? 1);
        setShowCustomModal(true);
    };

    const handleCustomSave = () => {
        const priceNum = Number(customPrice || 0);
        const qtyNum = Math.max(1, parseInt(customQty || 1, 10) || 1);

        if (!editingCustomId) {
            // create new
            addCustomItemToCart({ name: customName || 'Additional Item', price: priceNum, quantity: qtyNum });
        } else {
            // edit existing cart item
            setCart((prev) => prev.map((c) => (c.id === editingCustomId ? { ...c, name: customName, price: priceNum, quantity: qtyNum } : c)));
        }

        setShowCustomModal(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Header */}
                    <div className="md:col-span-3 flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/tables')} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800">
                                <svg className="w-6 h-6 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Table {tableNumber}</h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <button onClick={fetchTableOrder} className="px-3 py-2 bg-gray-200 dark:bg-gray-800 rounded text-sm text-gray-900 dark:text-gray-100">
                                {loadingOrder ? 'Refreshing...' : 'Refresh'}
                            </button>

                        </div>
                    </div>

                    {/* Left: Add Items */}
                    <div className="md:col-span-2">
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Add Items</h2>
                                <div className="flex gap-2">
                                    <button onClick={() => setActiveTab('KOT')} className={`px-3 py-1 rounded ${activeTab === 'KOT' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>
                                        KOT
                                    </button>
                                    <button onClick={() => setActiveTab('BOT')} className={`px-3 py-1 rounded ${activeTab === 'BOT' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>
                                        BOT
                                    </button>
                                </div>
                            </div>

                            {loadingItems ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading items...</div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {/* Custom Item card inserted first */}
                                    {/*<div*/}
                                    {/*    onClick={openCustomModalForCreate}*/}
                                    {/*    className="cursor-pointer flex flex-col items-center justify-center p-3 rounded-md border border-dashed border-gray-300 dark:border-gray-100 bg-gray-50 dark:bg-gray-700 hover:shadow-lg"*/}
                                    {/*    title="Add Custom Item"*/}
                                    {/*>*/}
                                    {/*    <div className="text-2xl font-bold text-gray-700 dark:text-gray-200">＋</div>*/}
                                    {/*    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">Custom Item</div>*/}
                                    {/*</div>*/}

                                    {filteredItems.length === 0 ? (
                                        <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">No items in this category</div>
                                    ) : (
                                        filteredItems.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => addItemToCartQuick(item)}
                                                className={`cursor-pointer p-3 rounded-md border hover:shadow-lg
                                                  ${isItemInCart(item.id)
                                                        ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 dark:border-blue-400'
                                                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                                                    }
                                             `}
                                            >
                                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{truncate(item.name)}
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-300 mt-2">LKR {fmt(item.price)}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Cart + Current Order stacked */}
                    <div className="md:col-span-1 flex flex-col gap-4 sticky top-6">
                        {/* Cart Card */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Add to Order (Cart)</h3>

                            {cart.length === 0 ? (
                                <div className="text-center py-6 text-gray-500 dark:text-gray-400">Cart is empty</div>
                            ) : (
                                <div className="space-y-3 max-h-[30vh] overflow-auto">
                                    {[...cart].reverse().map((c) => (
                                        <div key={c.id} className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600">
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                    <span>{truncate(c.name)}</span>
                                                    {c.isCustom && <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">Custom</span>}
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-300">LKR {fmt(c.price)} × {c.quantity}</div>
                                            </div>

                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => decrementCartItem(c.id)} className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100">-</button>
                                                    <div className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100">{c.quantity}</div>
                                                    <button onClick={() => incrementCartItem(c.id)} className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100">+</button>
                                                </div>

                                                <div className="flex items-center gap-2 mt-2">
                                                    <button onClick={() => removeCartItem(c.id)} className="text-red-600 dark:text-red-400 text-xs">Remove</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="text-gray-700 dark:text-gray-200 font-semibold">Total</div>
                                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">LKR {fmt(cartTotal)}</div>
                                </div>

                                <button onClick={submitCartToOrder} disabled={!cart.length || submittingCart} className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
                                    {submittingCart ? 'Adding...' : 'Add To Order'}
                                </button>

                                <button onClick={clearCart} disabled={!cart.length} className="w-full py-2 rounded mt-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50">
                                    Clear Cart
                                </button>
                            </div>
                        </div>


                    </div>
                </div>
                {/* Current Order Card */}
                <div className=" mt-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Current Order</h3>

                    {loadingOrder ? (
                        <div className="text-gray-600 dark:text-gray-300">Loading...</div>
                    ) : editableOrderItems.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 dark:text-gray-400">No items yet</div>
                    ) : (
                        <div className="space-y-3 max-h-[36vh] overflow-auto">
                            {editableOrderItems.map((oi) => (
                                <div key={oi.id} className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600">
                                    <div>
                                        <div className="font-semibold text-gray-900 dark:text-gray-100">{truncate(oi.name)}</div>
                                        <div className="text-xs text-gray-600 dark:text-gray-300">LKR {fmt(oi.price)} × {oi.quantity}</div>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => decEditableItem(oi.id)} className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100">-</button>
                                            <input type="number" min="0" value={oi.quantity} onChange={(e) => setEditableItemQty(oi.id, e.target.value)} className="w-16 text-center border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded" />
                                            <button onClick={() => incEditableItem(oi.id)} className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-gray-900 dark:text-gray-100">+</button>
                                        </div>
                                        <button onClick={() => handleLocalDelete(oi.id)} className="text-red-600 dark:text-red-400 text-xs mt-2">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3 flex justify-between font-bold text-gray-900 dark:text-gray-100">
                        <span>Order Total</span>
                        <span>LKR {fmt(editableOrderTotal)}</span>
                    </div>

                    <button onClick={() => navigate(`/billing?table=${tableNumber}`)} className="w-full py-2 rounded mt-3 bg-green-600 hover:bg-green-700 text-white">Go To Billing</button>
                </div>
            </div>

            {/* Custom Item Modal */}
            {/*{showCustomModal && (*/}
            {/*    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">*/}
            {/*        <div className="w-full max-w-md p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">*/}
            {/*            <div className="flex items-center justify-between mb-4">*/}
            {/*                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{editingCustomId ? 'Edit Custom Item' : 'Add Custom Item'}</h4>*/}
            {/*                <button onClick={() => setShowCustomModal(false)} className="text-gray-600 dark:text-gray-300">✕</button>*/}
            {/*            </div>*/}

            {/*            <div className="space-y-3">*/}
            {/*                <div>*/}
            {/*                    <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Name</label>*/}
            {/*                    <input value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />*/}
            {/*                </div>*/}

            {/*                <div>*/}
            {/*                    <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Price (LKR)</label>*/}
            {/*                    <input value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} type="number" min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />*/}
            {/*                </div>*/}

            {/*                <div>*/}
            {/*                    <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Quantity</label>*/}
            {/*                    <input value={customQty} onChange={(e) => setCustomQty(e.target.value)} type="number" min="1" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />*/}
            {/*                </div>*/}

            {/*                <div className="flex justify-end gap-2 mt-2">*/}
            {/*                    <button onClick={() => setShowCustomModal(false)} className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100">Cancel</button>*/}
            {/*                    <button onClick={handleCustomSave} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">{editingCustomId ? 'Save' : 'Add'}</button>*/}
            {/*                </div>*/}
            {/*            </div>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*)}*/}
        </div>
    );
};

export default TableOrderPage;
