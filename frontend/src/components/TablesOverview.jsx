import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';

const TableCard = ({ tableNumber, hasOrder, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`cursor-pointer rounded-xl p-6 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 ${hasOrder
                    ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-800 dark:to-yellow-900 border-2 border-yellow-400'
                    : 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800 dark:to-green-900 border-2 border-green-400'
                }`}
        >
            <div className="text-center">
                <div className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
                    {tableNumber}
                </div>
                <div className={`text-sm font-semibold ${hasOrder
                        ? 'text-yellow-800 dark:text-yellow-200'
                        : 'text-green-800 dark:text-green-200'
                    }`}>
                    {hasOrder ? 'In Progress' : 'Available'}
                </div>
            </div>
        </div>
    );
};

const TablesOverview = () => {
    const [tablesStatus, setTablesStatus] = useState({});
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const tableNumbers = Array.from({ length: 30 }, (_, i) => i + 1);

    useEffect(() => {
        fetchAllTablesStatus();
    }, []);

    const fetchAllTablesStatus = async () => {
        setLoading(true);
        try {
            const statusMap = {};

            // Fetch status for all tables
            for (const tableNum of tableNumbers) {
                try {
                    const response = await ordersAPI.getTableOrder(tableNum);
                    statusMap[tableNum] = response.data.data !== null;
                } catch (error) {
                    statusMap[tableNum] = false;
                }
            }

            setTablesStatus(statusMap);
        } catch (error) {
            console.error('Error fetching tables status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTableClick = (tableNumber) => {
        navigate(`/table/${tableNumber}`);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">


                {/*<div className="mb-6 flex justify-between items-center">*/}
                {/*    <div className="flex gap-4">*/}
                {/*        <div className="flex items-center gap-2">*/}
                {/*            <div className="w-4 h-4 rounded bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-400"></div>*/}
                {/*            <span className="text-sm text-gray-700 dark:text-gray-300">Available</span>*/}
                {/*        </div>*/}
                {/*        <div className="flex items-center gap-2">*/}
                {/*            <div className="w-4 h-4 rounded bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-400"></div>*/}
                {/*            <span className="text-sm text-gray-700 dark:text-gray-300">In Progress</span>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*    <button*/}
                {/*        onClick={fetchAllTablesStatus}*/}
                {/*        className="btn-secondary text-sm"*/}
                {/*        disabled={loading}*/}
                {/*    >*/}
                {/*        {loading ? 'Refreshing...' : 'Refresh'}*/}
                {/*    </button>*/}
                {/*</div>*/}

                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400 text-lg">Loading tables...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {tableNumbers.map((tableNum) => (
                            <TableCard
                                key={tableNum}
                                tableNumber={tableNum}
                                hasOrder={tablesStatus[tableNum] || false}
                                onClick={() => handleTableClick(tableNum)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TablesOverview;
