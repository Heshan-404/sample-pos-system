import { useState, useEffect } from 'react';
import { itemsAPI } from '../services/api';

const ItemManagement = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: 'KOT',
    });

    // Fetch items on component mount
    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const response = await itemsAPI.getAll();
            if (response.data.success) {
                setItems(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching items:', error);
            alert('Failed to fetch items');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await itemsAPI.create({
                name: formData.name,
                price: parseFloat(formData.price),
                category: formData.category,
            });

            if (response.data.success) {
                alert('Item created successfully!');
                setFormData({ name: '', price: '', category: 'KOT' });
                fetchItems(); // Refresh the list
            }
        } catch (error) {
            console.error('Error creating item:', error);
            alert(error.response?.data?.error || 'Failed to create item');
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
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-white">
                    Item Management
                </h1>

                {/* Add New Item Form */}
                <div className="card mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                        Add New Item
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Item Name
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Enter item name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Price
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    className="input-field"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Category
                                </label>
                                <select
                                    className="input-field"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
                                >
                                    <option value="KOT">KOT (Kitchen)</option>
                                    <option value="BOT">BOT (Beverage)</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary w-full" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Item'}
                        </button>
                    </form>
                </div>

                {/* Filter Section */}
                <div className="card mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                        Filter Items
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* Items List */}
                <div className="card">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                        All Items ({filteredItems.length})
                    </h2>

                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-gray-600 dark:text-gray-400">Loading items...</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-600 dark:text-gray-400">No items found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">ID</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Name</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Price</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Category</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.id}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">LKR {item.price.toFixed(2)}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${item.category === 'KOT'
                                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                        }`}
                                                >
                                                    {item.category}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItemManagement;
