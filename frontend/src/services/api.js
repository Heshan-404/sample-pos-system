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
    finishOrder: (data) => api.post('/orders/finish', data),
};

// History API
export const historyAPI = {
    getAll: () => api.get('/history'),
    getByTable: (tableNumber) => api.get(`/history/table/${tableNumber}`),
    getById: (id) => api.get(`/history/${id}`),
};

export default api;
