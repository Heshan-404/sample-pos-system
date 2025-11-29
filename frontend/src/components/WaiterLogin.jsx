import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const WaiterLogin = () => {
    const navigate = useNavigate();
    const { pinLogin } = useAuth();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePinInput = (digit) => {
        if (pin.length < 6) {
            setPin(pin + digit);
        }
    };

    const handleBackspace = () => {
        setPin(pin.slice(0, -1));
    };

    const handleClear = () => {
        setPin('');
        setError('');
    };

    const handleSubmit = async () => {
        if (pin.length < 4) {
            setError('PIN must be at least 4 digits');
            return;
        }

        setError('');
        setLoading(true);

        const result = await pinLogin(pin);

        if (result.success) {
            navigate('/waiter');
        } else {
            setError(result.error);
            setPin('');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-600 to-teal-700 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        👨‍🍳 Waiter Login
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">Enter your PIN</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-4 text-center">
                        {error}
                    </div>
                )}

                {/* PIN Display */}
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 mb-6">
                    <div className="flex justify-center gap-3">
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                            <div
                                key={index}
                                className="w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-2xl font-bold"
                            >
                                {pin[index] ? '●' : ''}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Number Pad */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handlePinInput(num.toString())}
                            disabled={loading}
                            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-2xl font-bold py-4 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {num}
                        </button>
                    ))}

                    <button
                        onClick={handleClear}
                        disabled={loading}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-4 rounded-lg transition-colors"
                    >
                        Clear
                    </button>

                    <button
                        onClick={() => handlePinInput('0')}
                        disabled={loading}
                        className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-2xl font-bold py-4 rounded-lg transition-colors"
                    >
                        0
                    </button>

                    <button
                        onClick={handleBackspace}
                        disabled={loading}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-4 rounded-lg transition-colors"
                    >
                        ← Back
                    </button>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading || pin.length < 4}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3  px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Verifying...' : 'Login'}
                </button>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-green-600 dark:text-green-400 hover:underline text-sm"
                    >
                        ← Back to Admin Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WaiterLogin;
