import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { itemsAPI, ordersAPI, subcategoriesAPI, authAPI, shopsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TableOrderPage = () => {
    const { tableNumber } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Waiter PIN state
    const [showWaiterPIN, setShowWaiterPIN] = useState(false);
    const [waiterPIN, setWaiterPIN] = useState('');
    const [waiter, setWaiter] = useState(null);
    const [pinError, setPinError] = useState('');
    const [verifyingPIN, setVerifyingPIN] = useState(false);

    const [items, setItems] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [shops, setShops] = useState([]);
    const [currentOrder, setCurrentOrder] = useState(null);

    const [loadingItems, setLoadingItems] = useState(false);
    const [loadingOrder, setLoadingOrder] = useState(false);
    const [submittingCart, setSubmittingCart] = useState(false);

    const [activeMainCategory, setActiveMainCategory] = useState('KOT'); // 'KOT', 'BOT'
    const [activeShop, setActiveShop] = useState(null); // shopId
    const [activeSubcategory, setActiveSubcategory] = useState(null);
    const [cart, setCart] = useState([]);
    const [editableOrderItems, setEditableOrderItems] = useState([]);

    // Custom item modal state
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customName, setCustomName] = useState('Additional Item');
    const [customPrice, setCustomPrice] = useState('');
    const [customQty, setCustomQty] = useState(1);
    const [editingCustomId, setEditingCustomId] = useState(null);

    useEffect(() => {
        fetchItems();
        fetchSubcategories();
        fetchShops();
        fetchTableOrder();
        setCart([]);
    }, [tableNumber]);

    // Reset subcategory when changing main category or shop
    useEffect(() => {
        setActiveSubcategory(null);
    }, [activeMainCategory, activeShop]);

    // Check if waiter PIN required
    useEffect(() => {
        if (!user && !waiter) {
            setShowWaiterPIN(true);
        }
    }, [user, waiter]);

    // Handle waiter PIN submission
    const handleWaiterPINSubmit = async () => {
        if (!waiterPIN || waiterPIN.length < 4) {
            setPinError('Please enter a valid PIN');
            return;
        }

        setVerifyingPIN(true);
        setPinError('');

        try {
            const response = await authAPI.verifyPin(waiterPIN);
            if (response.data.success) {
                setWaiter(response.data.data);
                setShowWaiterPIN(false);
                setWaiterPIN('');
            } else {
                setPinError('Invalid PIN');
            }
        } catch (error) {
            setPinError('Invalid PIN');
        } finally {
            setVerifyingPIN(false);
        }
    };

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

    // Fetch subcategories
    const fetchSubcategories = async () => {
        try {
            const res = await subcategoriesAPI.getAll();
            setSubcategories(res.data?.success ? res.data.data : []);
        } catch (err) {
            console.error('fetchSubcategories error', err);
            setSubcategories([]);
        }
    };

    // Fetch shops
    const fetchShops = async () => {
        try {
            const res = await shopsAPI.getAll();
            const shopList = res.data?.success ? res.data.data : [];
            setShops(shopList);
            if (shopList.length > 0 && !activeShop) {
                setActiveShop(shopList[0].id);
            }
        } catch (err) {
            console.error('fetchShops error', err);
            setShops([]);
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
                    added_by_name: it.added_by_name,
                    added_at: it.added_at,
                    batch_id: it.batch_id,
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

    // Filter items by category/shop and optionally by subcategory
    const filteredItems = useMemo(() => {
        let filtered = items.filter(i => i.isActive !== 0);

        // Filter by Main Category
        if (activeMainCategory !== 'ALL') {
            filtered = filtered.filter((i) => (i.category || '').toUpperCase() === activeMainCategory);
        }

        // Filter by Shop
        if (activeShop !== 'ALL') {
            filtered = filtered.filter((i) => i.shopId === activeShop);
        }

        // Filter by Subcategory
        if (activeSubcategory !== null) {
            filtered = filtered.filter((i) => i.subcategoryId === activeSubcategory);
        }

        return filtered;
    }, [items, activeMainCategory, activeShop, activeSubcategory]);

    // Get subcategories for current tab
    const currentSubcategories = useMemo(() => {
        let relevantSubcats = subcategories;

        // Filter by Main Category
        if (activeMainCategory !== 'ALL') {
            relevantSubcats = relevantSubcats.filter((sub) => sub.mainCategory === activeMainCategory);
        }

        // Filter by Shop (only show subcategories that exist in this shop)
        if (activeShop !== 'ALL') {
            const shopItems = items.filter(i => i.shopId === activeShop);
            const shopSubcatIds = new Set(shopItems.map(i => i.subcategoryId).filter(id => id));
            relevantSubcats = relevantSubcats.filter(sub => shopSubcatIds.has(sub.id));
        }

        return relevantSubcats;
    }, [subcategories, activeMainCategory, activeShop, items]);

    // ---------- CART ----------
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

    const addCustomItemToCart = ({ name, price, quantity }) => {
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

    const cartTotal = useMemo(() => {
        return cart.reduce((acc, c) => acc + Number((c.price * c.quantity).toFixed(4)), 0);
    }, [cart]);

    const submitCartToOrder = async () => {
        if (!cart.length) return alert('Cart is empty');
        setSubmittingCart(true);

        const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const currentUser = user || waiter;
        const userId = currentUser?.id;
        const userName = currentUser?.full_name || currentUser?.username || currentUser?.name || (user ? 'Admin/Cashier' : 'Waiter');

        try {
            const results = await Promise.all(
                cart.map((ci) => {
                    const payload = {
                        tableNumber: parseInt(tableNumber, 10),
                        quantity: parseInt(ci.quantity, 10),
                        userId,
                        userName,
                        batchId
                    };

                    if (ci.isCustom) {
                        payload.itemId = 19;
                        payload.custom = true;
                        payload.name = ci.name;
                        payload.price = Number(ci.price);
                    } else {
                        payload.itemId = ci.id;
                    }

                    return ordersAPI.addItem(payload);
                })
            );

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
                await ordersAPI.removeItem(orderItemId);
            } else {
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

    const fmt = (v) => Number(v).toFixed(2);

    const groupedOrders = useMemo(() => {
        const groups = {};
        editableOrderItems.forEach(item => {
            const batchId = item.batch_id || 'legacy';
            if (!groups[batchId]) {
                groups[batchId] = {
                    batchId,
                    addedBy: item.added_by_name || 'Unknown',
                    addedAt: item.added_at,
                    items: []
                };
            }
            groups[batchId].items.push(item);
        });

        return Object.values(groups).sort((a, b) => {
            if (a.batchId === 'legacy') return 1;
            if (b.batchId === 'legacy') return -1;
            return new Date(b.addedAt) - new Date(a.addedAt);
        });
    }, [editableOrderItems]);

    const consolidatedItems = useMemo(() => {
        const map = {};
        editableOrderItems.forEach(item => {
            const key = item.itemId;
            if (!map[key]) {
                map[key] = { ...item, quantity: 0 };
            }
            map[key].quantity += item.quantity;
        });
        return Object.values(map);
    }, [editableOrderItems]);

    const openCustomModalForCreate = () => {
        setEditingCustomId(null);
        setCustomName('Additional Item');
        setCustomPrice('');
        setCustomQty(1);
        setShowCustomModal(true);
    };

    const handleCustomSave = () => {
        const priceNum = Number(customPrice || 0);
        const qtyNum = Math.max(1, parseInt(customQty || 1, 10) || 1);

        if (!editingCustomId) {
            addCustomItemToCart({ name: customName || 'Additional Item', price: priceNum, quantity: qtyNum });
        } else {
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
                            <div className="mb-4 space-y-4">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Select Items</h2>
                                <div className="flex flex-col gap-3">
                                    {/* Row 1: Main Categories */}
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {['KOT', 'BOT'].map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setActiveMainCategory(cat)}
                                                className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${activeMainCategory === cat
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Row 2: Shops */}
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {shops.map((shop) => (
                                            <button
                                                key={shop.id}
                                                onClick={() => setActiveShop(shop.id)}
                                                className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${activeShop === shop.id
                                                    ? 'bg-purple-600 text-white shadow-md'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                    }`}
                                            >
                                                {shop.name}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Row 3: Subcategories */}
                                    {currentSubcategories.length > 0 && (
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            {currentSubcategories.map((subcat) => (
                                                <button
                                                    key={subcat.id}
                                                    onClick={() => setActiveSubcategory(subcat.id)}
                                                    className={`px-3 py-1 text-sm rounded transition-all whitespace-nowrap ${activeSubcategory === subcat.id
                                                        ? 'bg-green-600 text-white shadow-md'
                                                        : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500'
                                                        }`}
                                                >
                                                    {subcat.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {loadingItems ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading items...</div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                {/* Table Orders Section */}
                <div className="mt-8 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Table Orders</h3>

                    {loadingOrder ? (
                        <div className="text-gray-600 dark:text-gray-300">Loading...</div>
                    ) : editableOrderItems.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">No items yet</div>
                    ) : (
                        <>
                            {/* Grouped Orders */}
                            {groupedOrders.map((group) => (
                                <div key={group.batchId} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                                        <span className="font-bold text-blue-600 dark:text-blue-400">{group.addedBy}</span>
                                        <span className="text-xs">{group.addedAt ? new Date(group.addedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                    </div>
                                    <div className="space-y-3">
                                        {group.items.map((oi) => {
                                            const canEdit = user && (user.role === 'admin' || user.role === 'cashier');
                                            return (
                                                <div key={oi.id} className="flex items-center justify-between text-sm">
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">{truncate(oi.name)}</div>
                                                        <div className="text-xs text-gray-500">LKR {fmt(oi.price)}</div>
                                                    </div>

                                                    {canEdit ? (
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => decEditableItem(oi.id)} className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded text-gray-900 dark:text-gray-100">-</button>
                                                            <input type="number" min="0" value={oi.quantity} onChange={(e) => setEditableItemQty(oi.id, e.target.value)} className="w-10 text-center border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded text-xs py-1" />
                                                            <button onClick={() => incEditableItem(oi.id)} className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded text-gray-900 dark:text-gray-100">+</button>
                                                            <button onClick={() => handleLocalDelete(oi.id)} className="text-red-500 ml-1">✕</button>
                                                        </div>
                                                    ) : (
                                                        <div className="font-bold text-gray-700 dark:text-gray-300">x{oi.quantity}</div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Consolidated Summary */}
                            <div className="bg-blue-50 dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-900 rounded-lg p-4 shadow-sm">
                                <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3 border-b border-blue-200 dark:border-blue-900 pb-2">Total Summary</h4>
                                <div className="space-y-2 mb-4">
                                    {consolidatedItems.map((item) => (
                                        <div key={item.itemId} className="flex justify-between text-sm">
                                            <span className="text-gray-800 dark:text-gray-200">{item.name}</span>
                                            <span className="font-bold text-gray-900 dark:text-gray-100">x{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-blue-200 dark:border-blue-900 pt-3 flex justify-between font-bold text-lg text-gray-900 dark:text-gray-100">
                                    <span>Total</span>
                                    <span>LKR {fmt(editableOrderTotal)}</span>
                                </div>

                                {user && (user.role === 'admin' || user.role === 'cashier') && (
                                    <div className="space-y-3 mt-4">
                                        <button onClick={() => navigate(`/billing?table=${tableNumber}`)} className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg transform active:scale-95 transition-all">
                                            Go To Billing
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const response = await fetch(`http://localhost:5000/api/print/draft-bill/${tableNumber}`);
                                                    const blob = await response.blob();
                                                    const url = window.URL.createObjectURL(blob);
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.download = `draft-bill-table-${tableNumber}.pdf`;
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    link.remove();
                                                    window.URL.revokeObjectURL(url);
                                                } catch (error) {
                                                    alert('Failed to generate draft bill');
                                                }
                                            }}
                                            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            Get Draft Bill
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Waiter PIN Modal */}
            {showWaiterPIN && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-2 text-center text-gray-900 dark:text-white">
                            🔐 Enter Waiter PIN
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                            Table {tableNumber}
                        </p>

                        {pinError && (
                            <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm text-center">
                                {pinError}
                            </div>
                        )}

                        <div className="mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                            <div className="text-center text-4xl tracking-[0.5em] font-bold text-gray-900 dark:text-white min-h-[3rem] flex items-center justify-center">
                                {waiterPIN ? '•'.repeat(waiterPIN.length) : '••••'}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => {
                                        if (waiterPIN.length < 6) {
                                            setWaiterPIN(waiterPIN + num);
                                            setPinError('');
                                        }
                                    }}
                                    className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-2xl font-bold py-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all active:scale-95"
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                onClick={() => setWaiterPIN('')}
                                className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-semibold py-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all active:scale-95"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => {
                                    if (waiterPIN.length < 6) {
                                        setWaiterPIN(waiterPIN + '0');
                                        setPinError('');
                                    }
                                }}
                                className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-2xl font-bold py-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all active:scale-95"
                            >
                                0
                            </button>
                            <button
                                onClick={() => setWaiterPIN(waiterPIN.slice(0, -1))}
                                className="bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white text-sm font-semibold py-4 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all active:scale-95"
                            >
                                ⌫ Back
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleWaiterPINSubmit}
                                disabled={verifyingPIN || waiterPIN.length < 4}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {verifyingPIN ? 'Verifying...' : '✓ Submit'}
                            </button>
                            <button
                                onClick={() => navigate('/tables')}
                                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-3 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>

                        <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                            Enter your 4-6 digit PIN
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TableOrderPage;
