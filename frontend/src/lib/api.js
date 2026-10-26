import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Add token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401 errors — try refreshing the token, then redirect if that fails
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retrying and not the refresh/login endpoint itself
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/login') &&
            !originalRequest.url?.includes('/auth/refresh')
        ) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh_token');

            if (!refreshToken) {
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // Queue this request until refresh completes
                return new Promise((resolve, reject) => {
                    refreshQueue.push({ resolve, reject });
                }).then((newToken) => {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                });
            }

            isRefreshing = true;

            try {
                const res = await api.post('/auth/refresh', { refresh_token: refreshToken });
                const { access_token, refresh_token: newRefresh } = res.data;

                localStorage.setItem('access_token', access_token);
                localStorage.setItem('refresh_token', newRefresh);

                // Retry queued requests
                refreshQueue.forEach(({ resolve }) => resolve(access_token));
                refreshQueue = [];

                originalRequest.headers.Authorization = `Bearer ${access_token}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh also failed — force logout
                refreshQueue.forEach(({ reject }) => reject(refreshError));
                refreshQueue = [];
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getCurrentUser: () => api.get('/users/me'),
};

// User API
export const userAPI = {
    getProfile: () => api.get('/users/me'),
    updateProfile: (data) => api.put('/users/me', data),
    getUserById: (id) => api.get(`/users/${id}`),
    listUsers: (params) => api.get('/users', { params }),
};

// Skills API
export const skillsAPI = {
    getCategories: () => api.get('/skills/categories'),
    getSkills: (params) => api.get('/skills', { params }),
};

// Services API
export const servicesAPI = {
    listServices: (params) => api.get('/services', { params }),
    getService: (id) => api.get(`/services/${id}`),
    createService: (data) => api.post('/services', data),
    updateService: (id, data) => api.put(`/services/${id}`, data),
    deleteService: (id) => api.delete(`/services/${id}`),
    getMyServices: (params) => api.get('/services/my-services', { params }),
};

// Orders API
export const ordersAPI = {
    listOrders: (params) => api.get('/orders', { params }),
    getOrder: (id) => api.get(`/orders/${id}`),
    createOrder: (data) => api.post('/orders', data),
    updateOrderStatus: (id, data) => api.put(`/orders/${id}/status`, data),
    updatePayment: (id, data) => api.put(`/orders/${id}/payment`, data),
};
// Reviews API
export const reviewsAPI = {
    getServiceReviews: (serviceId, params) => api.get(`/reviews/service/${serviceId}`, { params }),
    getUserReviews: (userId, params) => api.get(`/reviews/user/${userId}`, { params }),
    createReview: (data) => api.post('/reviews', data),
    getOrderReview: (orderId) => api.get(`/reviews/order/${orderId}`),
    updateReview: (id, data) => api.put(`/reviews/${id}`, data),
    addResponse: (id, data) => api.post(`/reviews/${id}/response`, data),
};
// Admin API
export const adminAPI = {
    getStats: () => api.get('/admin/stats'),
    listUsers: (params) => api.get('/admin/users', { params }),
    updateUserStatus: (id, status) => api.put(`/admin/users/${id}/status`, null, { params: { new_status: status } }),
    updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, null, { params: { new_role: role } }),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    listServices: (params) => api.get('/admin/services', { params }),
    deleteService: (id) => api.delete(`/admin/services/${id}`),
};
// Chat API
export const chatAPI = {
    listConversations: () => api.get('/chat/conversations'),
    createConversation: (data) => api.post('/chat/conversations', data),
    getMessages: (conversationId, params) => api.get(`/chat/conversations/${conversationId}/messages`, { params }),
    sendMessage: (conversationId, data) => api.post(`/chat/conversations/${conversationId}/messages`, data),
    markAsRead: (conversationId) => api.put(`/chat/conversations/${conversationId}/read`),
    getUnreadCount: () => api.get('/chat/unread-count'),
};
// Portfolio API
export const portfolioAPI = {
    getUserPortfolio: (userId) => api.get(`/portfolio/user/${userId}`),
    addProject: (data) => api.post('/portfolio', data),
    deleteProject: (id) => api.delete(`/portfolio/${id}`),
};
// Upload API
export const uploadAPI = {
    uploadFile: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

// Payment API (Razorpay)
export const paymentAPI = {
    /** Create a Razorpay order for a given SkillSphere order — returns razorpay_order_id, amount, key_id */
    createOrder: (data) => api.post('/payments/create-order', data),
    /** Verify Razorpay payment signature and mark order paid + completed */
    verifyPayment: (data) => api.post('/payments/verify', data),
    /** Get latest PaymentTransaction for an order */
    getStatus: (orderId) => api.get(`/payments/status/${orderId}`),
    /** Initiate a refund for a paid order */
    refund: (orderId) => api.post(`/payments/refund/${orderId}`),
};

// Notifications API
export const notificationsAPI = {
    getAll: () => api.get('/notifications'),
    markAllRead: () => api.put('/notifications/read-all'),
    markOneRead: (id) => api.put(`/notifications/${id}/read`),
};
