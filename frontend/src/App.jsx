import { Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'

// Layouts
import CustomerLayout from './components/layouts/CustomerLayout'
import AdminLayout from './components/layouts/AdminLayout'

// Customer Pages
import HomePage from './pages/customer/HomePage'
import ProductsPage from './pages/customer/ProductsPage'
import ProductDetailPage from './pages/customer/ProductDetailPage'
import CartPage from './pages/customer/CartPage'
import CheckoutPage from './pages/customer/CheckoutPage'
import OrderConfirmationPage from './pages/customer/OrderConfirmationPage'
import TrackOrderPage from './pages/customer/TrackOrderPage'
import NotFoundPage from './pages/customer/NotFoundPage'

// Customer Account Pages
import CustomerLoginPage from './pages/customer/CustomerLoginPage'
import CustomerRegisterPage from './pages/customer/CustomerRegisterPage'
import AccountPage from './pages/customer/AccountPage'
import OrderHistoryPage from './pages/customer/OrderHistoryPage'
import SavedAddressesPage from './pages/customer/SavedAddressesPage'
import WishlistPage from './pages/customer/WishlistPage'

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import OrdersPage from './pages/admin/OrdersPage'
import OrderDetailPage from './pages/admin/OrderDetailPage'
import ProductsManagementPage from './pages/admin/ProductsManagementPage'
import CategoriesPage from './pages/admin/CategoriesPage'
import ReportsPage from './pages/admin/ReportsPage'

// Auth
import ProtectedRoute from './components/ProtectedRoute'
import ProtectedCustomerRoute from './components/ProtectedCustomerRoute'

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Customer Routes */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
          <Route path="track-order" element={<TrackOrderPage />} />

          {/* Customer Auth Routes */}
          <Route path="login" element={<CustomerLoginPage />} />
          <Route path="register" element={<CustomerRegisterPage />} />

          {/* Customer Account Routes (Protected) */}
          <Route path="account" element={<ProtectedCustomerRoute><AccountPage /></ProtectedCustomerRoute>} />
          <Route path="account/orders" element={<ProtectedCustomerRoute><OrderHistoryPage /></ProtectedCustomerRoute>} />
          <Route path="account/addresses" element={<ProtectedCustomerRoute><SavedAddressesPage /></ProtectedCustomerRoute>} />
          <Route path="account/wishlist" element={<ProtectedCustomerRoute><WishlistPage /></ProtectedCustomerRoute>} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="products" element={<ProductsManagementPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>

        {/* 404 Catch-all */}
        <Route path="*" element={<CustomerLayout />}>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}

export default App
