import { useState, useEffect } from 'react';
import { itemsAPI, subcategoriesAPI } from '../services/api';

const ItemManagement = () => {
    const [items, setItems] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [filteredSubcategories, setFilteredSubcategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');

    // Modal states
    const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
    const [subcategoryFormData, setSubcategoryFormData] = useState({
        name: '',
        mainCategory: 'KOT',
    });

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: 'KOT',
        subcategoryId: '',
    });

    // Fetch items and subcategories on component mount
    useEffect(() => {
        fetchItems();
        fetchSubcategories();
    }, []);

    // Update filtered subcategories when category changes
    useEffect(() => {
        const filtered = subcategories.filter(sub => sub.mainCategory === formData.category);
        setFilteredSubcategories(filtered);
        // Reset subcategory selection when category changes
        setFormData(prev => ({ ...prev, subcategoryId: '' }));
    }, [formData.category, subcategories]);

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

    const fetchSubcategories = async () => {
        try {
            const response = await subcategoriesAPI.getAll();
            if (response.data.success) {
                setSubcategories(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching subcategories:', error);
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
                subcategoryId: formData.subcategoryId || null,
            });

            if (response.data.success) {
                alert('Item created successfully!');
                setFormData({ name: '', price: '', category: 'KOT', subcategoryId: '' });
                fetchItems();
            }
        } catch (error) {
            console.error('Error creating item:', error);
            alert(error.response?.data?.error || 'Failed to create item');
        } finally {
            setLoading(false);
        }
    };

    const handleSubcategorySubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await subcategoriesAPI.create(subcategoryFormData);
            if (response.data.success) {
                alert('Subcategory created successfully!');
                setSubcategoryFormData({ name: '', mainCategory: 'KOT' });
                fetchSubcategories();
                setShowSubcategoryModal(false);
            }
        } catch (error) {
            console.error('Error creating subcategory:', error);
            alert(error.response?.data?.error || 'Failed to create subcategory');
        }
    };

    const handleDeleteSubcategory = async (id) => {
        if (!confirm('Are you sure you want to delete this subcategory?')) return;

        try {
            await subcategoriesAPI.delete(id);
            alert('Subcategory deleted successfully!');
            fetchSubcategories();
            fetchItems(); // Refresh items as their subcategory might be affected
        } catch (error) {
            console.error('Error deleting subcategory:', error);
            alert('Failed to delete subcategory');
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

                {/* Subcategory Management Button */}
                <div className="mb-4 flex justify-end">
                    <button
                        onClick={() => setShowSubcategoryModal(true)}
                        className="btn-secondary"
                    >
                        📋 Manage Subcategories
                    </button>
                </div>

                {/* Add New Item Form */}
                <div className="card mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                        Add New Item
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                    Main Category
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Subcategory *
                                </label>
                                <select
                                    className="input-field"
                                    value={formData.subcategoryId}
                                    onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                                    required
                                >
                                    <option value="">Select Subcategory</option>
                                    {filteredSubcategories.map((sub) => (
                                        <option key={sub.id} value={sub.id}>
                                            {sub.name}
                                        </option>
                                    ))}
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
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Subcategory</th>
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
                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {item.subcategoryName ? (
                                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded text-xs">
                                                        {item.subcategoryName}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic text-xs">None</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Subcategory Management Modal */}
            {showSubcategoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                    Manage Subcategories
                                </h2>
                                <button
                                    onClick={() => setShowSubcategoryModal(false)}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <span className="text-2xl">×</span>
                                </button>
                            </div>

                            {/* Add Subcategory Form */}
                            <form onSubmit={handleSubcategorySubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">
                                    Add New Subcategory
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Subcategory Name
                                        </label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={subcategoryFormData.name}
                                            onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, name: e.target.value })}
                                            required
                                            placeholder="e.g., Beers, Cocktails"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Main Category
                                        </label>
                                        <select
                                            className="input-field"
                                            value={subcategoryFormData.mainCategory}
                                            onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, mainCategory: e.target.value })}
                                            required
                                        >
                                            <option value="KOT">KOT (Kitchen)</option>
                                            <option value="BOT">BOT (Beverage)</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary w-full mt-4">
                                    Add Subcategory
                                </button>
                            </form>

                            {/* Existing Subcategories */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">
                                    Existing Subcategories
                                </h3>
                                <div className="space-y-4">
                                    {['KOT', 'BOT'].map((category) => (
                                        <div key={category}>
                                            <h4 className="font-medium text-gray-600 dark:text-gray-300 mb-2">
                                                {category} ({category === 'KOT' ? 'Kitchen' : 'Beverage'})
                                            </h4>
                                            <div className="space-y-2">
                                                {subcategories
                                                    .filter((sub) => sub.mainCategory === category)
                                                    .map((sub) => (
                                                        <div
                                                            key={sub.id}
                                                            className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-600 rounded"
                                                        >
                                                            <span className="text-gray-700 dark:text-gray-200">
                                                                {sub.name}
                                                            </span>
                                                            <button
                                                                onClick={() => handleDeleteSubcategory(sub.id)}
                                                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    ))}
                                                {subcategories.filter((sub) => sub.mainCategory === category).length === 0 && (
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                                                        No subcategories yet
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ItemManagement;
