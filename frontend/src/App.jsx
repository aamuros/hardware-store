import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'

// Layouts - Load immediately as they're needed for structure
import CustomerLayout from './components/layouts/CustomerLayout'
import AdminLayout from './components/layouts/AdminLayout'

// Customer Pages - Lazy loaded for better performance
const HomePage = lazy(() => import('./pages/customer/HomePage'))
const ProductsPage = lazy(() => import('./pages/customer/ProductsPage'))
const ProductDetailPage = lazy(() => import('./pages/customer/ProductDetailPage'))
const CartPage = lazy(() => import('./pages/customer/CartPage'))
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage'))
const OrderConfirmationPage = lazy(() => import('./pages/customer/OrderConfirmationPage'))
const TrackOrderPage = lazy(() => import('./pages/customer/TrackOrderPage'))
const NotFoundPage = lazy(() => import('./pages/customer/NotFoundPage'))

// Customer Account Pages - Lazy loaded
const CustomerLoginPage = lazy(() => import('./pages/customer/CustomerLoginPage'))
const CustomerRegisterPage = lazy(() => import('./pages/customer/CustomerRegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/customer/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/customer/ResetPasswordPage'))
const AccountPage = lazy(() => import('./pages/customer/AccountPage'))
const OrderHistoryPage = lazy(() => import('./pages/customer/OrderHistoryPage'))
const SavedAddressesPage = lazy(() => import('./pages/customer/SavedAddressesPage'))
const WishlistPage = lazy(() => import('./pages/customer/WishlistPage'))
const CustomerChangePasswordPage = lazy(() => import('./pages/customer/CustomerChangePasswordPage'))

// Admin Pages - Lazy loaded
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const OrdersPage = lazy(() => import('./pages/admin/OrdersPage'))
const OrderDetailPage = lazy(() => import('./pages/admin/OrderDetailPage'))
const ProductsManagementPage = lazy(() => import('./pages/admin/ProductsManagementPage'))
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'))
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'))
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'))
const ChangePasswordPage = lazy(() => import('./pages/admin/ChangePasswordPage'))
const AdminForgotPasswordPage = lazy(() => import('./pages/admin/AdminForgotPasswordPage'))
const AdminResetPasswordPage = lazy(() => import('./pages/admin/AdminResetPasswordPage'))

// Auth
import ProtectedRoute from './components/ProtectedRoute'
import ProtectedCustomerRoute from './components/ProtectedCustomerRoute'

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="text-neutral-500 text-sm">Loading...</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
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
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />

            {/* Customer Account Routes (Protected) */}
            <Route path="account" element={<ProtectedCustomerRoute><AccountPage /></ProtectedCustomerRoute>} />
            <Route path="account/orders" element={<ProtectedCustomerRoute><OrderHistoryPage /></ProtectedCustomerRoute>} />
            <Route path="account/addresses" element={<ProtectedCustomerRoute><SavedAddressesPage /></ProtectedCustomerRoute>} />
            <Route path="account/wishlist" element={<ProtectedCustomerRoute><WishlistPage /></ProtectedCustomerRoute>} />
            <Route path="account/change-password" element={<ProtectedCustomerRoute><CustomerChangePasswordPage /></ProtectedCustomerRoute>} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
          <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="products" element={<ProductsManagementPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="change-password" element={<ChangePasswordPage />} />
          </Route>

          {/* 404 Catch-all */}
          <Route path="*" element={<CustomerLayout />}>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
