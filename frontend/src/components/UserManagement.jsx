import { useState, useEffect, useMemo } from 'react';
import { usersAPI } from '../services/api';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [roleFilter, setRoleFilter] = useState('all');
    const [showPinUpdate, setShowPinUpdate] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'cashier',
        full_name: '',
        pin: ''
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await usersAPI.getAll();
            if (response.data.success) {
                setUsers(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                password: '',
                role: user.role,
                full_name: user.full_name,
                pin: ''
            });
            setShowPinUpdate(false);
            setAdminPassword('');
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                password: '',
                role: 'cashier',
                full_name: '',
                pin: ''
            });
            setShowPinUpdate(false);
            setAdminPassword('');
        }
        setShowModal(true);
        setError('');
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setShowPinUpdate(false);
        setAdminPassword('');
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // Prepare update data
            const updateData = { ...formData };

            // For updates
            if (editingUser) {
                // Remove password if empty
                if (!updateData.password) {
                    delete updateData.password;
                }

                // Handle PIN update with admin password verification
                if (showPinUpdate && updateData.pin) {
                    if (!adminPassword) {
                        setError('Admin password is required to update PIN');
                        return;
                    }
                    updateData.adminPassword = adminPassword;
                } else {
                    delete updateData.pin;
                }

                await usersAPI.update(editingUser.id, updateData);
                setSuccessMessage('User updated successfully!');
            } else {
                // For new users
                if (!formData.password) {
                    setError('Password is required for new users');
                    return;
                }
                await usersAPI.create(formData);
                setSuccessMessage('User created successfully!');
            }

            handleCloseModal();
            fetchUsers();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to save user');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            await usersAPI.delete(id);
            setSuccessMessage('User deleted successfully!');
            fetchUsers();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to delete user');
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await usersAPI.toggleStatus(id);
            fetchUsers();
        } catch (error) {
            setError('Failed to toggle user status');
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            case 'cashier':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'waiter':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    // Filter users based on selected role
    const filteredUsers = useMemo(() => {
        if (roleFilter === 'all') return users;
        return users.filter(user => user.role === roleFilter);
    }, [users, roleFilter]);

    // Calculate user counts by role
    const userCounts = useMemo(() => ({
        all: users.length,
        admin: users.filter(u => u.role === 'admin').length,
        cashier: users.filter(u => u.role === 'cashier').length,
        waiter: users.filter(u => u.role === 'waiter').length
    }), [users]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    👥 User Management
                </h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="btn-primary"
                >
                    ➕ Add New User
                </button>
            </div>

            {successMessage && (
                <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg">
                    {successMessage}
                </div>
            )}

            {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Role Filter Buttons */}
            <div className="mb-6 flex gap-3 flex-wrap">
                <button
                    onClick={() => setRoleFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        roleFilter === 'all'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                    All Users ({userCounts.all})
                </button>
                <button
                    onClick={() => setRoleFilter('admin')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        roleFilter === 'admin'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                    Admins ({userCounts.admin})
                </button>
                <button
                    onClick={() => setRoleFilter('cashier')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        roleFilter === 'cashier'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                    Cashiers ({userCounts.cashier})
                </button>
                <button
                    onClick={() => setRoleFilter('waiter')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        roleFilter === 'waiter'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                    Waiters ({userCounts.waiter})
                </button>
            </div>

            {/* Users Table - PIN column removed */}
            <div className="card overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b dark:border-gray-700">
                            <th className="text-left p-4">Username</th>
                            <th className="text-left p-4">Full Name</th>
                            <th className="text-left p-4">Role</th>
                            <th className="text-left p-4">Status</th>
                            <th className="text-left p-4">Created</th>
                            <th className="text-left p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="p-4 font-medium">{user.username}</td>
                                <td className="p-4">{user.full_name}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoleBadgeColor(user.role)}`}>
                                        {user.role.toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => handleToggleStatus(user.id)}
                                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                            user.is_active
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        }`}
                                    >
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenModal(user)}
                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        {roleFilter === 'all' ? 'No users found.' : `No ${roleFilter}s found.`}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                            {editingUser ? 'Edit User' : 'Add New User'}
                        </h2>

                        {error && (
                            <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Username</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    disabled={!!editingUser}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Password {editingUser && '(leave blank to keep current)'}
                                </label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingUser}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Role</label>
                                <select
                                    className="input-field"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="cashier">Cashier</option>
                                    <option value="waiter">Waiter</option>
                                </select>
                            </div>

                            {/* PIN Section for Waiters */}
                            {formData.role === 'waiter' && (
                                <>
                                    {!editingUser ? (
                                        // Creating new waiter
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                PIN (4-6 digits)
                                            </label>
                                            <input
                                                type="text"
                                                pattern="[0-9]{4,6}"
                                                maxLength="6"
                                                className="input-field"
                                                value={formData.pin}
                                                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                                                placeholder="Enter 4-6 digit PIN"
                                                required
                                            />
                                        </div>
                                    ) : (
                                        // Editing existing waiter
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                            {!showPinUpdate ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPinUpdate(true)}
                                                    className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                                                >
                                                    🔐 Update PIN
                                                </button>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-sm font-medium">Update PIN</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowPinUpdate(false);
                                                                setFormData({ ...formData, pin: '' });
                                                                setAdminPassword('');
                                                            }}
                                                            className="text-red-600 text-sm hover:underline"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        pattern="[0-9]{4,6}"
                                                        maxLength="6"
                                                        className="input-field"
                                                        value={formData.pin}
                                                        onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                                                        placeholder="Enter new 4-6 digit PIN"
                                                        required
                                                    />
                                                    <div>
                                                        <label className="block text-sm font-medium mb-2 text-red-600 dark:text-red-400">
                                                            Admin Password Required *
                                                        </label>
                                                        <input
                                                            type="password"
                                                            className="input-field"
                                                            value={adminPassword}
                                                            onChange={(e) => setAdminPassword(e.target.value)}
                                                            placeholder="Enter your admin password"
                                                            required
                                                        />
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            Your password is required for security
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="submit"
                                    className="flex-1 btn-primary"
                                >
                                    {editingUser ? 'Update User' : 'Create User'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
