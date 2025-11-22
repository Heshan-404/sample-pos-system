import { useEffect } from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {title}
                    </h3>

                    {/* Message */}
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {message}
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
