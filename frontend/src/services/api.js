import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('admin-token')
      localStorage.removeItem('admin-user')

      // Redirect to login if on admin page
      if (window.location.pathname.startsWith('/admin') &&
        window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// API helper functions
export const productApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  search: (query) => api.get('/products/search', { params: { q: query } }),
  getByCategory: (categoryId) => api.get(`/products/category/${categoryId}`),
}

export const categoryApi = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
}

export const orderApi = {
  create: (orderData) => api.post('/orders', orderData),
  track: (orderNumber) => api.get(`/orders/track/${orderNumber}`),
}

export const adminApi = {
  login: (credentials) => api.post('/admin/login', credentials),
  getDashboard: () => api.get('/admin/dashboard'),

  // Orders
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrder: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status, message) =>
    api.patch(`/admin/orders/${id}/status`, { status, message }),

  // Products
  createProduct: (formData) =>
    api.post('/admin/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateProduct: (id, formData) =>
    api.patch(`/admin/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  toggleAvailability: (id, isAvailable) =>
    api.patch(`/admin/products/${id}/availability`, { isAvailable }),

  // Categories
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.patch(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),

  // Inventory/Stock
  updateStock: (id, stockData) =>
    api.patch(`/admin/products/${id}/stock`, stockData),
  getLowStockProducts: () => api.get('/admin/inventory/low-stock'),

  // Reports
  getSalesReport: (params) => api.get('/admin/reports/sales', { params }),
  getProductReport: () => api.get('/admin/reports/products'),
}
