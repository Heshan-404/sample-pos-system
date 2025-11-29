import { useState, useEffect } from 'react';
import api, { shopsAPI } from '../services/api';

const PrinterManagement = () => {
    const [printers, setPrinters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        ip: '',
        port: '',
        shopId: ''
    });
    const [shops, setShops] = useState([]);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchPrinters();
        fetchShops();
    }, []);

    const fetchPrinters = async () => {
        setLoading(true);
        try {
            const response = await api.get('/printers');
            if (response.data.success) {
                setPrinters(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching printers:', error);
            alert('Failed to fetch printers');
        } finally {
            setLoading(false);
        }
    };

    const fetchShops = async () => {
        try {
            const response = await shopsAPI.getAll();
            if (response.data.success) {
                setShops(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching shops:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingId) {
                // Update existing printer
                const response = await api.put(`/printers/${editingId}`, formData);
                if (response.data.success) {
                    alert('Printer updated successfully!');
                    fetchPrinters();
                    resetForm();
                }
            } else {
                // Create new printer
                const response = await api.post('/printers', formData);
                if (response.data.success) {
                    alert('Printer registered successfully!');
                    fetchPrinters();
                    resetForm();
                }
            }
        } catch (error) {
            console.error('Error saving printer:', error);
            alert(error.response?.data?.error || 'Failed to save printer');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (printer) => {
        setFormData({
            name: printer.name,
            ip: printer.ip,
            port: printer.port,
            isActive: printer.isActive,
            shopId: printer.shopId || ''
        });
        setEditingId(printer.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this printer?')) {
            return;
        }

        setLoading(true);
        try {
            const response = await api.delete(`/printers/${id}`);
            if (response.data.success) {
                alert('Printer deleted successfully!');
                fetchPrinters();
            }
        } catch (error) {
            console.error('Error deleting printer:', error);
            alert('Failed to delete printer');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (printer) => {
        setLoading(true);
        try {
            const response = await api.put(`/printers/${printer.id}`, {
                ...printer,
                isActive: !printer.isActive
            });
            if (response.data.success) {
                fetchPrinters();
            }
        } catch (error) {
            console.error('Error updating printer:', error);
            alert('Failed to update printer status');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', ip: '', port: '', shopId: '' });
        setEditingId(null);
        setShowForm(false);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
                        🖨️ Printer Management
                    </h1>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="btn-primary"
                    >
                        {showForm ? 'Cancel' : '+ Add Printer'}
                    </button>
                </div>

                {/* Registration Form */}
                {showForm && (
                    <div className="card mb-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
                        <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
                            {editingId ? 'Edit Printer' : 'Register New Printer'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                    Printer Name
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Kitchen Printer"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                        IP Address
                                    </label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.ip}
                                        onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                                        placeholder="e.g., 192.168.1.100"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                        Port
                                    </label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={formData.port}
                                        onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                                        placeholder="e.g., 9100"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                    Assigned Shop
                                </label>
                                <select
                                    className="input-field"
                                    value={formData.shopId}
                                    onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                                >
                                    <option value="">None (General Printer)</option>
                                    {shops.map((shop) => (
                                        <option key={shop.id} value={shop.id}>
                                            {shop.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="btn-success flex-1"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : editingId ? 'Update Printer' : 'Register Printer'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Printers List */}
                <div className="card">
                    <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
                        Registered Printers
                    </h2>

                    {loading && !showForm ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600 dark:text-gray-400 text-lg">Loading...</p>
                        </div>
                    ) : printers.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600 dark:text-gray-400 text-lg">
                                No printers registered yet. Add your first printer above!
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            IP Address
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Port
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Shop
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {printers.map((printer) => (
                                        <tr key={printer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className="text-2xl mr-2">🖨️</span>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {printer.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                {printer.ip}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                {printer.port}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                {printer.shopName || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleToggleActive(printer)}
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${printer.isActive
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                        }`}
                                                >
                                                    {printer.isActive ? '● Active' : '○ Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => handleEdit(printer)}
                                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(printer.id)}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Info Card */}
                <div className="card mt-8 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                        💡 Quick Tips
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <li>• Only one printer can be active at a time</li>
                        <li>• Make sure your printer is connected to the network</li>
                        <li>• Default port for most ESC/POS printers is 9100</li>
                        <li>• The print server must be running to print receipts</li>
                        <li>• Receipts will automatically print when bills are finalized</li>
                        <br />
                        Default Print Credential
                        <li>• ip: 192.168.224.61 </li>
                        <li>•  port : 9100 </li>
                        <li>• name : default printer</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default PrinterManagement;
