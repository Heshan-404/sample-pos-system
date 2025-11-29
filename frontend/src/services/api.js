import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    pinLogin: (pin) => api.post('/auth/pin-login', { pin }),
    verifyPin: (pin) => api.post('/auth/verify-pin', { pin }),
    logout: () => api.post('/auth/logout'),
    getCurrentUser: () => api.get('/auth/me')
};

// Users API
export const usersAPI = {
    getAll: () => api.get('/users'),
    create: (userData) => api.post('/users', userData),
    update: (id, userData) => api.put(`/users/${id}`, userData),
    delete: (id) => api.delete(`/users/${id}`),
    toggleStatus: (id) => api.put(`/users/${id}/toggle`)
};

// Items API (existing - just adding here)
export const itemsAPI = {
    getAll: () => api.get('/items'),
    create: (item) => api.post('/items', item),
    update: (id, item) => api.put(`/items/${id}`, item),
    delete: (id) => api.delete(`/items/${id}`),
    toggleStatus: (id) => api.put(`/items/${id}/toggle`)
};

// Subcategories API
export const subcategoriesAPI = {
    getAll: () => api.get('/subcategories'),
    create: (subcategory) => api.post('/subcategories', subcategory),
    update: (id, subcategory) => api.put(`/subcategories/${id}`, subcategory),
    delete: (id) => api.delete(`/subcategories/${id}`)
};

// Orders API
export const ordersAPI = {
    addItem: (data) => api.post('/orders/add-item', data),
    getTableOrder: (tableNumber) => api.get(`/orders/${tableNumber}`),
    updateItemQuantity: (orderItemId, quantity) => api.put(`/orders/update-item/${orderItemId}`, { quantity }),
    removeItem: (orderItemId) => api.delete(`/orders/remove-item/${orderItemId}`),
    finishOrder: (data) => api.post('/orders/finish', data),
    finishPartialOrder: (data) => api.post('/orders/finish-partial', data)
};

// History API
export const historyAPI = {
    getAll: () => api.get('/history'),
    getById: (id) => api.get(`/history/${id}`)
};

// Print API
export const printAPI = {
    printReceipt: (historyId) => api.post(`/print/receipt/${historyId}`),
    downloadPDF: (historyId) => api.get(`/print/pdf/${historyId}`, { responseType: 'blob' })
};

// KOT/BOT API
export const kotBotAPI = {
    send: (data) => api.post('/kot-bot/send', data),
    getHistory: (params) => api.get('/kot-bot/history', { params })
};

// Reports API
export const reportsAPI = {
    generateOrdersReport: (startDate, endDate) =>
        api.get('/reports/orders', {
            params: { startDate, endDate },
            responseType: 'blob'
        }),
    generateItemsSalesReport: (date) =>
        api.get('/reports/items-sales', {
            params: { date },
            responseType: 'blob'
        })
};

export default api;
