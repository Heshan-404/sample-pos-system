import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const WaiterDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedTable, setSelectedTable] = useState(null);

    const tables = Array.from({ length: 15 }, (_, i) => i + 1);

    const handleTableSelect = (tableNum) => {
        setSelectedTable(tableNum);
        // Navigate to table order page
        navigate(`/table/${tableNum}`);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="card text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        👨‍🍳 Welcome, {user?.full_name}!
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400">
                        Select a table to take orders
                    </p>
                </div>

                {/* Table Grid */}
                <div className="card mb-6">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                        📋 Available Tables
                    </h2>

                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                        {tables.map((tableNum) => (
                            <button
                                key={tableNum}
                                onClick={() => handleTableSelect(tableNum)}
                                className="aspect-square rounded-xl bg-gradient-to-br from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold text-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex flex-col items-center justify-center"
                            >
                                <div className="text-sm opacity-80 mb-1">Table</div>
                                <div className="text-4xl">{tableNum}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="card text-center">
                        <div className="text-4xl mb-2">🏢</div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">My Tables</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Active today</p>
                    </div>
                    <div className="card text-center">
                        <div className="text-4xl mb-2">📝</div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Orders Taken</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">This shift</p>
                    </div>
                    <div className="card text-center">
                        <div className="text-4xl mb-2">⏱️</div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Shift Time</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                    </div>
                </div>

                {/* Instructions */}
                <div className="card mt-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                    <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
                        📖 Instructions
                    </h3>
                    <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                        <li>✅ Select a table to start taking orders</li>
                        <li>✅ Add items to the order</li>
                        <li>✅ Orders will automatically be sent to Kitchen/Bar</li>
                        <li>✅ Return here to select another table</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default WaiterDashboard;
