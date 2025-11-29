const Unauthorized = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-600">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md text-center">
                <div className="text-6xl mb-4">🚫</div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Access Denied
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    You don't have permission to access this page.
                </p>
                <button
                    onClick={() => window.history.back()}
                    className="btn-primary"
                >
                    Go Back
                </button>
            </div>
        </div>
    );
};

export default Unauthorized;
