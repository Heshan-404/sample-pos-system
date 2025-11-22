import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { itemsAPI, ordersAPI } from '../services/api';
import AutocompleteSearch from './AutocompleteSearch';

const TableOrderPage = () => {
    const { tableNumber } = useParams();
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        fetchItems();
        fetchTableOrder();
    }, [tableNumber]);

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
            const response = await ordersAPI.getTableOrder(parseInt(tableNumber));
            if (response.data.success) {
                setCurrentOrder(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching order:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleItemSelect = (item) => {
        setSelectedItem(item);
    };

    const handleAddItem = async () => {
        if (!selectedItem) {
            alert('Please select an item');
            return;
        }

        if (quantity < 1) {
            alert('Quantity must be at least 1');
            return;
        }

        setLoading(true);
        try {
            const response = await ordersAPI.addItem({
                tableNumber: parseInt(tableNumber),
                itemId: selectedItem.id,
                quantity: parseInt(quantity),
            });

            if (response.data.success) {
                alert('Item added successfully!');
                setSelectedItem(null);
                setQuantity(1);
                fetchTableOrder();
            }
        } catch (error) {
            console.error('Error adding item:', error);
            alert(error.response?.data?.error || 'Failed to add item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/tables')}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
                            Table {tableNumber}
                        </h1>
                    </div>
                    <button
                        onClick={fetchTableOrder}
                        className="btn-secondary"
                        disabled={loading}
                    >
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Add Items */}
                    <div>
                        <div className="card">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                                Add Item
                            </h2>

                            <div className="space-y-4">
                                {/* Autocomplete Search */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Search Item
                                    </label>
                                    <AutocompleteSearch
                                        items={items}
                                        onSelect={handleItemSelect}
                                        placeholder="Type to search items..."
                                    />
                                </div>

                                {/* Selected Item Display */}
                                {selectedItem && (
                                    <div className="p-4 bg-primary-50 dark:bg-primary-900 rounded-lg border-2 border-primary-200 dark:border-primary-700">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-gray-800 dark:text-gray-200">
                                                    {selectedItem.name}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    ${selectedItem.price.toFixed(2)}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedItem.category === 'KOT'
                                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                }`}>
                                                {selectedItem.category}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Quantity */}
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
                                    />
                                </div>

                                {/* Add Button */}
                                <button
                                    onClick={handleAddItem}
                                    className="btn-primary w-full"
                                    disabled={loading || !selectedItem}
                                >
                                    {loading ? 'Adding...' : 'Add to Order'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Current Order */}
                    <div>
                        <div className="card">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                                Current Order
                            </h2>

                            {loading ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                                </div>
                            ) : !currentOrder || !currentOrder.items || currentOrder.items.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-600 dark:text-gray-400">No items yet</p>
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
                                                    <span className={`text-xs px-2 py-1 rounded-full ${item.category === 'KOT'
                                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                        }`}>
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

                                    <button
                                        onClick={() => navigate(`/billing?table=${tableNumber}`)}
                                        className="btn-success w-full mt-6"
                                    >
                                        Go to Billing
                                    </button>
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
