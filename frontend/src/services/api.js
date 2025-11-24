import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Items API
export const itemsAPI = {
    getAll: () => api.get('/items'),
    create: (data) => api.post('/items', data),
};

// Orders API
export const ordersAPI = {
    addItem: (data) => api.post('/orders/add-item', data),
    getTableOrder: (tableNumber) => api.get(`/orders/${tableNumber}`),
    updateItemQuantity: (orderItemId, quantity) => api.put(`/orders/update-item/${orderItemId}`, { quantity }),
    removeItem: (orderItemId) => api.delete(`/orders/remove-item/${orderItemId}`),
    finishOrder: (data) => api.post('/orders/finish', data),
};

// History API
export const historyAPI = {
    getAll: () => api.get('/history'),
    getByTable: (tableNumber) => api.get(`/history/table/${tableNumber}`),
    getById: (id) => api.get(`/history/${id}`),
};

// Subcategories API
export const subcategoriesAPI = {
    getAll: () => api.get('/subcategories'),
    getByCategory: (category) => api.get(`/subcategories/category/${category}`),
    create: (data) => api.post('/subcategories', data),
    update: (id, data) => api.put(`/subcategories/${id}`, data),
    delete: (id) => api.delete(`/subcategories/${id}`),
};

// Print API
export const printAPI = {
    printReceipt: (historyId) => api.post(`/print/receipt/${historyId}`),
    downloadPDF: (historyId) => api.get(`/print/pdf/${historyId}`, { responseType: 'blob' }),
};

// Reports API
export const reportsAPI = {
    generateOrdersReport: (startDate, endDate) => api.get('/reports/orders', {
        params: { startDate, endDate },
        responseType: 'blob'
    }),
    generateItemsSalesReport: (date) => api.get('/reports/items-sales', {
        params: { date },
        responseType: 'blob'
    }),
};

export default api;
