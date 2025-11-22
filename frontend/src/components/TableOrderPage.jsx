import {useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {itemsAPI, ordersAPI} from '../services/api';

/**
 * TableOrderPage
 *
 * Features:
 * - KOT / BOT tabs
 * - POS grid of items. Clicking a card adds qty=1 to cart (fast POS flow)
 * - Right-side Cart (live)
 * - Current Order (server order) editable locally, Save Changes does a bulk update + deletes items with qty 0
 *
 * Assumes ordersAPI has:
 * - getTableOrder(tableNumber)
 * - addItem({ tableNumber, itemId, quantity })
 * - updateItemsBulk(itemsArray)  // [{ orderItemId, quantity }, ...]
 * - removeItem(orderItemId)
 *
 * and itemsAPI.getAll()
 */

const TableOrderPage = () => {
    const {tableNumber} = useParams();
    const navigate = useNavigate();

    // data
    const [items, setItems] = useState([]);
    const [currentOrder, setCurrentOrder] = useState(null);

    // UI state
    const [loadingItems, setLoadingItems] = useState(false);
    const [loadingOrder, setLoadingOrder] = useState(false);
    const [submittingCart, setSubmittingCart] = useState(false);
    const [savingOrderChanges, setSavingOrderChanges] = useState(false);

    // POS UI state
    const [activeTab, setActiveTab] = useState('KOT'); // 'KOT' or 'BOT'
    const [cart, setCart] = useState([]); // cart = [{ id, name, price, category, quantity }]
    // Local editable copy of server current order items
    const [editableOrderItems, setEditableOrderItems] = useState([]); // each: { id (order_item id), itemId, name, price, category, quantity, subtotal }

    useEffect(() => {
        fetchItems();
        fetchTableOrder();
        // reset cart when table changes
        setCart([]);
    }, [tableNumber]);

    // Fetch items
    const fetchItems = async () => {
        setLoadingItems(true);
        try {
            const res = await itemsAPI.getAll();
            if (res.data?.success) {
                setItems(res.data.data || []);
            } else {
                setItems([]);
            }
        } catch (err) {
            console.error('Error fetching items:', err);
            setItems([]);
        } finally {
            setLoadingItems(false);
        }
    };

    // Fetch current order from server
    const fetchTableOrder = async () => {
        setLoadingOrder(true);
        try {
            const res = await ordersAPI.getTableOrder(parseInt(tableNumber, 10));
            if (res.data?.success && res.data.data) {
                setCurrentOrder(res.data.data);

                // build editable local copy from server response items
                const edited = (res.data.data.items || []).map((it) => ({
                    // note: server returns oi.id (order item id) plus item details
                    id: it.id, // order_items.id
                    itemId: it.itemId,
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
            console.error('Error fetching table order:', err);
            setCurrentOrder(null);
            setEditableOrderItems([]);
        } finally {
            setLoadingOrder(false);
        }
    };

    // Filtered items by active tab (category)
    const filteredItems = useMemo(() => {
        return items.filter((i) => (i.category || '').toUpperCase() === (activeTab || '').toUpperCase());
    }, [items, activeTab]);

    // CART OPERATIONS
    const addItemToCartQuick = (item) => {
        // clicking card adds quantity = 1
        setCart((prev) => {
            const exist = prev.find((c) => c.id === item.id);
            if (exist) {
                return prev.map((c) => (c.id === item.id ? {...c, quantity: c.quantity + 1} : c));
            }
            // new cart item keeps same fields as items (id refers to item.id)
            return [...prev, {
                id: item.id,
                name: item.name,
                price: Number(item.price),
                category: item.category,
                quantity: 1
            }];
        });
    };

    const incrementCartItem = (itemId) => {
        setCart((prev) => prev.map((c) => (c.id === itemId ? {...c, quantity: c.quantity + 1} : c)));
    };
    const decrementCartItem = (itemId) => {
        setCart((prev) =>
                prev
                    .map((c) => (c.id === itemId ? {...c, quantity: Math.max(1, c.quantity - 1)} : c))
            // keep quantity min 1 in cart
        );
    };
    const removeCartItem = (itemId) => {
        setCart((prev) => prev.filter((c) => c.id !== itemId));
    };
    const clearCart = () => setCart([]);

    const cartTotal = useMemo(() => {
        // compute accurately digit-by-digit
        return cart.reduce((acc, c) => acc + Number((c.price * c.quantity).toFixed(4)), 0);
    }, [cart]);

    // SUBMIT CART to server (same as add multiple items)
    const submitCartToOrder = async () => {
        if (!cart.length) {
            alert('Cart is empty');
            return;
        }
        setSubmittingCart(true);
        try {
            // If backend supports bulk, you would prefer that.
            // Here we call addItem for each cart item concurrently.
            const addPromises = cart.map((ci) =>
                ordersAPI.addItem({
                    tableNumber: parseInt(tableNumber, 10),
                    itemId: ci.id,
                    quantity: parseInt(ci.quantity, 10),
                })
            );

            const results = await Promise.all(addPromises);

            // If any failed, notify
            const someFailed = results.find((r) => !(r?.data?.success));
            if (someFailed) {
                console.error('Some addItem calls failed', results);
                alert('Some items failed to add. Check console for details.');
            } else {
                alert('Items added to order');
                clearCart();
                fetchTableOrder();
            }
        } catch (err) {
            console.error('Error adding cart items', err);
            alert(err?.response?.data?.error || 'Failed to add cart items');
        } finally {
            setSubmittingCart(false);
        }
    };

    // EDITABLE CURRENT ORDER (local changes)
    // Increment / decrement / set qty locally
    const incEditableItem = (orderItemId) => {
        setEditableOrderItems((prev) => prev.map((it) => (it.id === orderItemId ? {
            ...it,
            quantity: it.quantity + 1,
            subtotal: Number(((it.quantity + 1) * it.price).toFixed(4))
        } : it)));
    };
    const decEditableItem = (orderItemId) => {
        setEditableOrderItems((prev) =>
            prev.map((it) => {
                if (it.id !== orderItemId) return it;
                const newQty = Math.max(0, it.quantity - 1); // allow 0 (auto-delete on save)
                return {...it, quantity: newQty, subtotal: Number((newQty * it.price).toFixed(4))};
            })
        );
    };
    const setEditableItemQty = (orderItemId, value) => {
        const qty = Math.max(0, parseInt(value || '0', 10));
        setEditableOrderItems((prev) => prev.map((it) => (it.id === orderItemId ? {
            ...it,
            quantity: qty,
            subtotal: Number((qty * it.price).toFixed(4))
        } : it)));
    };
    const deleteEditableItemLocally = (orderItemId) => {
        // mark as quantity 0 (will be deleted on save) or remove from local list right away
        setEditableOrderItems((prev) => prev.filter((it) => it.id !== orderItemId));
    };

    // Save changes to server: bulk update + deletes
    const handleSaveOrderChanges = async () => {
        if (!editableOrderItems) return;
        setSavingOrderChanges(true);
        try {
            // Determine updates (qty >= 1) and deletes (items removed from editable list or qty === 0)
            // We need original server items to detect removals — use currentOrder.items
            const originalMap = new Map((currentOrder?.items || []).map((oi) => [oi.id, oi]));

            // Build map of edited items
            const editedMap = new Map(editableOrderItems.map((it) => [it.id, it]));

            // Items that were present in original but not in edited => deleted
            const deletes = [];
            for (const [origId, origItem] of originalMap.entries()) {
                if (!editedMap.has(origId)) {
                    deletes.push(origId);
                }
            }

            // Items that are present in edited with quantity 0 => delete as well
            for (const [id, edited] of editedMap.entries()) {
                if (edited.quantity === 0) {
                    if (!deletes.includes(id)) deletes.push(id);
                }
            }

            // For updates: items in edited with quantity >=1 AND quantity changed vs original
            const updates = [];
            for (const [id, edited] of editedMap.entries()) {
                if (edited.quantity >= 1) {
                    const orig = originalMap.get(id);
                    const origQty = orig ? Number(orig.quantity) : null;
                    if (origQty === null || origQty !== edited.quantity) {
                        updates.push({orderItemId: id, quantity: edited.quantity});
                    }
                }
            }

            // Execute bulk update (if any)
            if (updates.length) {
                await ordersAPI.updateItemsBulk(updates);
            }

            // Execute deletes (if any) — use concurrent deletes
            if (deletes.length) {
                const deletePromises = deletes.map((orderItemId) => ordersAPI.removeItem(orderItemId));
                await Promise.all(deletePromises);
            }

            alert('Order updated successfully');
            // Refresh server order
            fetchTableOrder();
        } catch (err) {
            console.error('Error saving order changes', err);
            alert(err?.response?.data?.error || 'Failed to save changes');
        } finally {
            setSavingOrderChanges(false);
        }
    };

    // Remove item from current order immediately (locally) and mark for deletion on save
    // Here we simply remove it from editableOrderItems local state.
    const handleLocalDeleteOrderItem = (orderItemId) => {
        // remove from local array — on save it will be detected as deleted
        setEditableOrderItems((prev) => prev.filter((it) => it.id !== orderItemId));
    };

    // Derived totals for editable order locally
    const editableOrderTotal = useMemo(() => {
        return editableOrderItems.reduce((s, it) => s + Number((it.price * it.quantity).toFixed(4)), 0);
    }, [editableOrderItems]);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Header spanning full width */}
                <div className="lg:col-span-3 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/tables')}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Back to tables"
                        >
                            <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor"
                                 viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                            </svg>
                        </button>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Table {tableNumber}</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={fetchTableOrder} className="btn-secondary" disabled={loadingOrder}>
                            {loadingOrder ? 'Refreshing...' : 'Refresh'}
                        </button>
                        <button
                            onClick={() => navigate(`/billing?table=${tableNumber}`)}
                            className="btn-success"
                        >
                            Go to Billing
                        </button>
                    </div>
                </div>

                {/* Left / Middle: POS Grid */}
                <div className="col-span-2">
                    <div className="card p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Add Items</h2>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setActiveTab('KOT')}
                                    className={`px-3 py-1 rounded ${activeTab === 'KOT' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    KOT
                                </button>
                                <button
                                    onClick={() => setActiveTab('BOT')}
                                    className={`px-3 py-1 rounded ${activeTab === 'BOT' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    BOT
                                </button>
                            </div>
                        </div>

                        {/* Items grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {loadingItems ? (
                                <div className="col-span-full text-center py-8 text-gray-500">Loading items...</div>
                            ) : filteredItems.length === 0 ? (
                                <div className="col-span-full text-center py-8 text-gray-500">No items in this
                                    category</div>
                            ) : (
                                filteredItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="relative bg-white dark:bg-gray-800 border rounded-lg p-3 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between"
                                    >
                                        {/* clicking entire card quickly adds 1 to cart */}
                                        <div onClick={() => addItemToCartQuick(item)} className="space-y-2">
                                            <div className="flex items-start justify-between">
                                                <div  className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.name}</div>
                                            </div>

                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-semibold ${item.category === 'KOT' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>
                                             LKR {Number(item.price)}
                                            </span>
                                              </div>
                                            </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Cart + Current Order */}
                <div className="lg:col-span-1">
                    <div className="card p-4 sticky top-6">
                        <h3 className="text-xl font-semibold mb-3">Cart</h3>

                        {cart.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">No items selected</div>
                        ) : (
                            <div className="space-y-3 max-h-[40vh] overflow-auto">
                                {cart.map((c) => (
                                    <div key={c.id}
                                         className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded">
                                        <div className="flex-1 pr-2">
                                            <div className="flex items-center justify-between">
                                                <div
                                                    className="font-semibold text-gray-800 dark:text-gray-200">{c.name}</div>
                                                <div
                                                    className="text-sm font-bold mx-6">${(c.price * c.quantity).toFixed(2)}</div>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                ${Number(c.price).toFixed(2)} × {c.quantity}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center gap-2">
                                            <div className="flex items-center space-x-1">
                                                <button onClick={() => decrementCartItem(c.id)}
                                                        className="px-2 py-1 bg-gray-100 rounded text-zinc-950">-
                                                </button>
                                                <div className="px-3 py-1 bg-white border rounded text-zinc-950">{c.quantity}</div>
                                                <button onClick={() => incrementCartItem(c.id)}
                                                        className="px-2 py-1 bg-gray-100 rounded text-zinc-950 ">+
                                                </button>
                                            </div>

                                            <button onClick={() => removeCartItem(c.id)}
                                                    className="text-xs text-red-600 hover:underline">Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="border-t mt-4 pt-4">
                            <div className="flex justify-between items-center mb-3">
                                <div className="text-gray-700 dark:text-gray-200 font-semibold">Total</div>
                                <div
                                    className="text-lg font-bold text-primary-600 dark:text-primary-400">${Number(cartTotal).toFixed(2)}</div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button onClick={submitCartToOrder} disabled={submittingCart || cart.length === 0}
                                        className="btn-primary w-full">
                                    {submittingCart ? 'Adding...' : 'Add to Order'}
                                </button>

                                <button onClick={clearCart} disabled={cart.length === 0}
                                        className="btn-secondary w-full">
                                    Clear Cart
                                </button>

                            </div>
                        </div>

                        {/* Current Order editable */}
                        <div className="mt-4">
                            <h4 className="text-lg font-semibold mb-2">Current Order</h4>

                            {loadingOrder ? (
                                <div className="text-sm text-gray-500">Loading...</div>
                            ) : !currentOrder || !currentOrder.items || currentOrder.items.length === 0 ? (
                                <div className="text-sm text-gray-500">No items yet</div>
                            ) : (
                                <>
                                    <div className="space-y-2 max-h-[30vh] overflow-auto">
                                        {editableOrderItems.map((oi) => (
                                            <div key={oi.id}
                                                 className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between ">
                                                        <div className="font-semibold text-sm">{oi.name}</div>
                                                        <div  className="text-sm font-bold mx-6">${(oi.price * oi.quantity).toFixed(2)} </div>
                                                    </div>
                                                    <div className="text-xs text-gray-500">${oi.price.toFixed(2)} × {oi.quantity} </div>
                                                </div>

                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="flex items-center space-x-1">
                                                        <button onClick={() => decEditableItem(oi.id)}
                                                                className="px-2 py-1 bg-gray-100 rounded text-zinc-950">-
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={oi.quantity}
                                                            onChange={(e) => setEditableItemQty(oi.id, e.target.value)}
                                                            className="w-16 text-center border rounded py-1 bg-white text-zinc-950"
                                                        />
                                                        <button onClick={() => incEditableItem(oi.id)}
                                                                className="px-2 py-1 bg-gray-100 rounded text-zinc-950">+
                                                        </button>
                                                    </div>
                                                    <button onClick={() => handleLocalDeleteOrderItem(oi.id)}
                                                            className="text-xs text-red-600 hover:underline">Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t mt-3 pt-3">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="text-gray-700 dark:text-gray-200 font-semibold">Order
                                                Total
                                            </div>
                                            <div
                                                className="text-lg font-bold text-primary-600 dark:text-primary-400">${Number(editableOrderTotal).toFixed(2)}</div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveOrderChanges}
                                                disabled={savingOrderChanges}
                                                className="btn-primary flex-1"
                                            >
                                                {savingOrderChanges ? 'Saving...' : 'Save Changes'}
                                            </button>

                                            <button
                                                onClick={fetchTableOrder}
                                                className="btn-secondary"
                                            >
                                                Discard
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TableOrderPage;
