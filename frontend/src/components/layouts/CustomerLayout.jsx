import { useState, useRef, useEffect } from 'react'
import { Outlet, Link } from 'react-router-dom'
import {
  ShoppingCartIcon,
  UserCircleIcon,
  HeartIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon,
  MapPinIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { useCart } from '../../context/CartContext'
import { useCustomerAuth } from '../../context/CustomerAuthContext'

export default function CustomerLayout() {
  const { totalItems } = useCart()
  const { customer, isAuthenticated, logout, wishlistIds } = useCustomerAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setShowDropdown(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">🔧</span>
              <span className="text-xl font-semibold text-primary-800 tracking-tight">Hardware Store</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-neutral-600 hover:text-primary-800 transition-colors font-medium">
                Home
              </Link>
              <Link to="/products" className="text-neutral-600 hover:text-primary-800 transition-colors font-medium">
                Products
              </Link>
              <Link to="/track-order" className="text-neutral-600 hover:text-primary-800 transition-colors font-medium">
                Track Order
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {/* Wishlist */}
              {isAuthenticated() && (
                <Link to="/account/wishlist" className="relative p-2 text-neutral-600 hover:text-pink-500 transition-colors">
                  <HeartIcon className="h-6 w-6" />
                  {wishlistIds.size > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {wishlistIds.size > 99 ? '99+' : wishlistIds.size}
                    </span>
                  )}
                </Link>
              )}

              {/* Cart */}
              <Link to="/cart" className="relative p-2 text-neutral-600 hover:text-primary-800 transition-colors">
                <ShoppingCartIcon className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </Link>

              {/* User Account */}
              {isAuthenticated() ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-1 p-2 text-neutral-600 hover:text-primary-800 transition-colors"
                  >
                    <UserCircleIcon className="h-6 w-6" />
                    <span className="hidden sm:inline text-sm font-medium max-w-24 truncate">
                      {customer?.name?.split(' ')[0]}
                    </span>
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-neutral-100 py-2 animate-fade-in">
                      <div className="px-4 py-2 border-b border-neutral-100">
                        <p className="font-medium text-primary-900 truncate">{customer?.name}</p>
                        <p className="text-xs text-neutral-500 truncate">{customer?.email}</p>
                      </div>
                      <Link
                        to="/account"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2 text-neutral-700 hover:bg-neutral-50"
                      >
                        <Cog6ToothIcon className="h-4 w-4" />
                        My Account
                      </Link>
                      <Link
                        to="/account/orders"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2 text-neutral-700 hover:bg-neutral-50"
                      >
                        <ClipboardDocumentListIcon className="h-4 w-4" />
                        Order History
                      </Link>
                      <Link
                        to="/account/addresses"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2 text-neutral-700 hover:bg-neutral-50"
                      >
                        <MapPinIcon className="h-4 w-4" />
                        Addresses
                      </Link>
                      <Link
                        to="/account/wishlist"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2 text-neutral-700 hover:bg-neutral-50"
                      >
                        <HeartIcon className="h-4 w-4" />
                        Wishlist
                      </Link>
                      <div className="border-t border-neutral-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-50"
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-accent-600 hover:bg-accent-700 rounded-lg transition-colors"
                >
                  <UserCircleIcon className="h-4 w-4" />
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden border-t border-neutral-100">
          <div className="flex justify-around py-2">
            <Link to="/" className="text-neutral-600 hover:text-primary-800 text-sm font-medium">Home</Link>
            <Link to="/products" className="text-neutral-600 hover:text-primary-800 text-sm font-medium">Products</Link>
            <Link to="/track-order" className="text-neutral-600 hover:text-primary-800 text-sm font-medium">Track Order</Link>
            {isAuthenticated() ? (
              <Link to="/account" className="text-neutral-600 hover:text-primary-800 text-sm font-medium">Account</Link>
            ) : (
              <Link to="/login" className="text-accent-600 hover:text-accent-700 text-sm font-medium">Login</Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-primary-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🔧</span>
                <span className="text-lg font-semibold">Hardware Store</span>
              </div>
              <p className="text-primary-300 text-sm leading-relaxed">
                Your trusted partner for quality hardware, tools, and construction materials.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-400 mb-4">Contact Us</h3>
              <div className="space-y-2 text-primary-200 text-sm">
                <p>📞 0917-123-4567</p>
                <p>📍 123 Main St, Your City</p>
                <p>🕐 Mon-Sat: 7AM - 7PM</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-400 mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/products" className="text-primary-200 hover:text-white text-sm transition-colors">Products</Link></li>
                <li><Link to="/track-order" className="text-primary-200 hover:text-white text-sm transition-colors">Track Order</Link></li>
                <li><Link to="/account" className="text-primary-200 hover:text-white text-sm transition-colors">My Account</Link></li>
                <li><Link to="/admin/login" className="text-primary-200 hover:text-white text-sm transition-colors">Admin Login</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-primary-800 text-center text-primary-400 text-sm">
            © {new Date().getFullYear()} Hardware Store. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
