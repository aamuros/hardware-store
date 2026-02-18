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
    // Check for customer token first (for customer routes)
    const customerToken = localStorage.getItem('customer-token')
    const adminToken = localStorage.getItem('admin-token')

    // Use customer token for customer routes, admin token for admin routes
    if (config.url?.startsWith('/customers') && customerToken) {
      config.headers.Authorization = `Bearer ${customerToken}`
    } else if (config.url?.startsWith('/admin') && adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`
    } else if (customerToken) {
      // For other routes (like orders), prefer customer token if available
      config.headers.Authorization = `Bearer ${customerToken}`
    } else if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`
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
      // Token expired or invalid - clear based on route
      const requestUrl = error.config?.url || ''

      if (requestUrl.startsWith('/customers')) {
        // Clear customer tokens for customer routes
        localStorage.removeItem('customer-token')
        localStorage.removeItem('customer-user')

        // Redirect to customer login if on customer-protected page
        const protectedPaths = ['/account', '/wishlist', '/orders']
        if (protectedPaths.some(path => window.location.pathname.startsWith(path))) {
          window.location.href = '/login'
        }
      } else if (requestUrl.startsWith('/admin')) {
        // Clear admin tokens for admin routes
        localStorage.removeItem('admin-token')
        localStorage.removeItem('admin-user')

        // Redirect to login if on admin page
        if (window.location.pathname.startsWith('/admin') &&
          window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login'
        }
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
  search: (query, category) => api.get('/products/search', { params: { q: query, ...(category && { category }) } }),
  getByCategory: (categoryId) => api.get(`/products/category/${categoryId}`),
  getVariants: (productId) => api.get(`/products/${productId}/variants`),
  getImages: (productId) => api.get(`/products/${productId}/images`),
  getBulkPricing: (productId) => api.get(`/products/${productId}/bulk-pricing`),
  calculateBulkPrice: (productId, quantity) =>
    api.get(`/products/${productId}/calculate-price`, { params: { quantity } }),
}

export const categoryApi = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
}

export const orderApi = {
  create: (orderData) => api.post('/orders', orderData),
  track: (orderNumber) => api.get(`/orders/track/${orderNumber}`),
  validateCart: (items) => api.post('/orders/validate-cart', { items }),
}

export const statsApi = {
  getPublicStats: () => api.get('/stats'),
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

  // Product Variants
  createVariant: (productId, data) => api.post(`/admin/products/${productId}/variants`, data),
  updateVariant: (id, data) => api.patch(`/admin/variants/${id}`, data),
  deleteVariant: (id) => api.delete(`/admin/variants/${id}`),
  updateVariantStock: (id, stockQuantity) => api.patch(`/admin/variants/${id}/stock`, { stockQuantity }),

  // Bulk Pricing
  createBulkPricingTier: (productId, data) => api.post(`/admin/products/${productId}/bulk-pricing`, data),
  updateBulkPricingTier: (id, data) => api.patch(`/admin/bulk-pricing/${id}`, data),
  deleteBulkPricingTier: (id) => api.delete(`/admin/bulk-pricing/${id}`),

  // Reports
  getSalesReport: (params) => api.get('/admin/reports/sales', { params }),
  getProductReport: () => api.get('/admin/reports/products'),
  exportReport: (params) => api.get('/admin/reports/export', { params, responseType: 'blob' }),

  // User Management (admin only)
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  changePassword: (data) => api.patch('/admin/change-password', data),

  // Admin password reset (unauthenticated)
  forgotPassword: (data) => api.post('/admin/forgot-password', data),
  verifyResetToken: (data) => api.post('/admin/verify-reset-token', data),
  resetPassword: (data) => api.post('/admin/reset-password', data),
}

// Customer API (account features)
export const customerApi = {
  // Authentication
  register: (data) => api.post('/customers/register', data),
  login: (data) => api.post('/customers/login', data),

  // Password Reset
  forgotPassword: (data) => api.post('/customers/forgot-password', data),
  verifyResetToken: (data) => api.post('/customers/verify-reset-token', data),
  resetPassword: (data) => api.post('/customers/reset-password', data),

  // Profile
  getProfile: () => api.get('/customers/profile'),
  updateProfile: (data) => api.patch('/customers/profile', data),
  changePassword: (data) => api.patch('/customers/change-password', data),

  // Addresses
  getAddresses: () => api.get('/customers/addresses'),
  createAddress: (data) => api.post('/customers/addresses', data),
  updateAddress: (id, data) => api.patch(`/customers/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/customers/addresses/${id}`),
  setDefaultAddress: (id) => api.patch(`/customers/addresses/${id}/default`),

  // Wishlist
  getWishlist: () => api.get('/customers/wishlist'),
  getWishlistIds: () => api.get('/customers/wishlist/ids'),
  addToWishlist: (productId) => api.post('/customers/wishlist', { productId }),
  removeFromWishlist: (productId) => api.delete(`/customers/wishlist/${productId}`),
  checkWishlist: (productId) => api.get(`/customers/wishlist/check/${productId}`),

  // Order history
  getOrders: (params) => api.get('/customers/orders', { params }),
  getOrder: (orderNumber) => api.get(`/customers/orders/${orderNumber}`),
  cancelOrder: (orderNumber) => api.patch(`/customers/orders/${orderNumber}/cancel`),
}
