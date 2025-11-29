import { useState } from 'react';

const MixedPaymentModal = ({ isOpen, onClose, onConfirm, totalAmount }) => {
    const [cashAmount, setCashAmount] = useState('');
    const [cardAmount, setCardAmount] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const total = parseFloat(totalAmount || 0);
    const cash = parseFloat(cashAmount || 0);
    const card = parseFloat(cardAmount || 0);
    const sum = cash + card;
    const remaining = total - sum;

    const handleConfirm = () => {
        if (sum < total) {
            setError(`Payment incomplete. Remaining: LKR ${remaining.toFixed(2)}`);
            return;
        }

        if (sum > total) {
            setError(`Payment exceeds total. Excess: LKR ${(sum - total).toFixed(2)}`);
            return;
        }

        onConfirm({
            cash,
            card,
            paymentMethod: 'MIXED'
        });

        handleClose();
    };

    const handleClose = () => {
        setCashAmount('');
        setCardAmount('');
        setError('');
        onClose();
    };

    const handleCashChange = (value) => {
        setCashAmount(value);
        if (value && total) {
            const cashVal = parseFloat(value || 0);
            const remainingForCard = Math.max(0, total - cashVal);
            setCardAmount(remainingForCard.toFixed(2));
        }
        setError('');
    };

    const handleCardChange = (value) => {
        setCardAmount(value);
        if (value && total) {
            const cardVal = parseFloat(value || 0);
            const remainingForCash = Math.max(0, total - cardVal);
            setCashAmount(remainingForCash.toFixed(2));
        }
        setError('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                    💳 Mixed Payment
                </h2>

                {error && (
                    <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Total Amount:</span>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            LKR {total.toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            💵 Cash Amount
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={cashAmount}
                            onChange={(e) => handleCashChange(e.target.value)}
                            className="input-field"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            💳 Card Amount
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={cardAmount}
                            onChange={(e) => handleCardChange(e.target.value)}
                            className="input-field"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Cash:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">LKR {cash.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Card:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">LKR {card.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-2 flex justify-between font-bold">
                        <span className="text-gray-900 dark:text-white">Total:</span>
                        <span className={sum === total ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            LKR {sum.toFixed(2)}
                        </span>
                    </div>
                    {remaining !== 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                                LKR {Math.abs(remaining).toFixed(2)}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleConfirm}
                        disabled={sum !== total}
                        className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirm Payment
                    </button>
                    <button
                        onClick={handleClose}
                        className="flex-1 btn-secondary"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MixedPaymentModal;
