import { useState, useEffect } from 'react';
import { itemsAPI, ordersAPI } from '../services/api';

const OrderPage = () => {
    const [selectedTable, setSelectedTable] = useState(1);
    const [items, setItems] = useState([]);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [loading, setLoading] = useState(false);

    // Filters (client-side)
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');

    // Item selection
    const [selectedItemId, setSelectedItemId] = useState('');
    const [quantity, setQuantity] = useState(1);

    // Generate table numbers 1-30
    const tableNumbers = Array.from({ length: 30 }, (_, i) => i + 1);

    useEffect(() => {
        fetchItems();
    }, []);

    useEffect(() => {
        if (selectedTable) {
            fetchTableOrder();
        }
    }, [selectedTable]);

    const fetchItems = async () => {
        try {
            const response = await itemsAPI.getAll();
            if (response.data.success) {
                setItems(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching items:', error);
        }
    };

    const fetchTableOrder = async () => {
        setLoading(true);
        try {
            const response = await ordersAPI.getTableOrder(selectedTable);
            if (response.data.success) {
                setCurrentOrder(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching order:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();

        if (!selectedItemId) {
            alert('Please select an item');
            return;
        }

        setLoading(true);
        try {
            const response = await ordersAPI.addItem({
                tableNumber: selectedTable,
                itemId: parseInt(selectedItemId),
                quantity: parseInt(quantity),
            });

            if (response.data.success) {
                alert('Item added to order!');
                setSelectedItemId('');
                setQuantity(1);
                fetchTableOrder(); // Refresh order
            }
        } catch (error) {
            console.error('Error adding item:', error);
            alert(error.response?.data?.error || 'Failed to add item');
        } finally {
            setLoading(false);
        }
    };

    // CLIENT-SIDE FILTERING
    const filteredItems = items.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-white">
                    Table Ordering System
                </h1>

                {/* Table Selection */}
                <div className="card mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                        Select Table
                    </h2>
                    <select
                        className="input-field max-w-xs"
                        value={selectedTable}
                        onChange={(e) => setSelectedTable(parseInt(e.target.value))}
                    >
                        {tableNumbers.map((num) => (
                            <option key={num} value={num}>
                                Table {num}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Add Items */}
                    <div>
                        {/* Item Filters */}
                        <div className="card mb-6">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                                Search & Filter Items
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Search by Name
                                    </label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search items..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Filter by Category
                                    </label>
                                    <select
                                        className="input-field"
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                    >
                                        <option value="ALL">All Categories</option>
                                        <option value="KOT">KOT (Kitchen)</option>
                                        <option value="BOT">BOT (Beverage)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Add Item Form */}
                        <div className="card">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                                Add Item to Table {selectedTable}
                            </h2>
                            <form onSubmit={handleAddItem} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Select Item ({filteredItems.length} available)
                                    </label>
                                    <select
                                        className="input-field"
                                        value={selectedItemId}
                                        onChange={(e) => setSelectedItemId(e.target.value)}
                                        required
                                    >
                                        <option value="">Choose an item...</option>
                                        {filteredItems.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.name} - ${item.price.toFixed(2)} [{item.category}]
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Quantity
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="input-field"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        required
                                    />
                                </div>

                                <button type="submit" className="btn-primary w-full" disabled={loading}>
                                    {loading ? 'Adding...' : 'Add to Order'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Current Order */}
                    <div>
                        <div className="card">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                                Current Order - Table {selectedTable}
                            </h2>

                            {loading ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-600 dark:text-gray-400">Loading order...</p>
                                </div>
                            ) : !currentOrder || !currentOrder.items || currentOrder.items.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-600 dark:text-gray-400">No items in the order yet</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3 mb-6">
                                        {currentOrder.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        ${item.price.toFixed(2)} × {item.quantity}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-800 dark:text-gray-200">
                                                        ${item.subtotal.toFixed(2)}
                                                    </p>
                                                    <span
                                                        className={`text-xs px-2 py-1 rounded-full ${item.category === 'KOT'
                                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                            }`}
                                                    >
                                                        {item.category}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t-2 border-gray-200 dark:border-gray-600 pt-4">
                                        <div className="flex justify-between items-center text-xl font-bold">
                                            <span className="text-gray-700 dark:text-gray-200">Total:</span>
                                            <span className="text-primary-600 dark:text-primary-400">
                                                ${currentOrder.total.toFixed(2)}
                                            </span>
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

export default OrderPage;
