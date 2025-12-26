import { useState, useRef, useEffect, useCallback } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import {
  CartIcon,
  UserIcon,
  HeartIcon,
  ChevronDownIcon,
  LogoutIcon,
  OrdersIcon,
  LocationIcon,
  SettingsIcon,
  WrenchIcon,
  PhoneIcon,
  ClockIcon,
  SearchIcon,
  HomeIcon,
  CloseIcon,
} from '../icons'
import { useCart } from '../../context/CartContext'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { productApi } from '../../services/api'
import { useDebounce } from '../../hooks/useDebounce'

export default function CustomerLayout() {
  const { totalItems } = useCart()
  const { customer, isAuthenticated, logout, wishlistIds } = useCustomerAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [cartPulse, setCartPulse] = useState(false)
  const [prevTotalItems, setPrevTotalItems] = useState(totalItems)
  const dropdownRef = useRef(null)
  const searchRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Cart pulse animation when items change
  useEffect(() => {
    if (totalItems > prevTotalItems) {
      setCartPulse(true)
      const timer = setTimeout(() => setCartPulse(false), 400)
      return () => clearTimeout(timer)
    }
    setPrevTotalItems(totalItems)
  }, [totalItems, prevTotalItems])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false)
        setSearchResults([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search products
  useEffect(() => {
    const searchProducts = async () => {
      if (debouncedSearch.trim().length < 2) {
        setSearchResults([])
        return
      }
      setSearchLoading(true)
      try {
        const response = await productApi.search(debouncedSearch)
        setSearchResults(response.data.data.slice(0, 5))
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setSearchLoading(false)
      }
    }
    searchProducts()
  }, [debouncedSearch])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
      setShowSearch(false)
      setSearchQuery('')
      setSearchResults([])
    }
  }

  const handleSearchResultClick = (productId) => {
    navigate(`/products/${productId}`)
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleLogout = () => {
    logout()
    setShowDropdown(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Skip to main content - Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary-800 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-primary-800 rounded-lg flex items-center justify-center group-hover:bg-primary-900 transition-colors">
                <WrenchIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-primary-800 tracking-tight">Wena's Hardware</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link 
                to="/" 
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  location.pathname === '/' 
                    ? 'text-primary-800 bg-primary-50' 
                    : 'text-neutral-600 hover:text-primary-800 hover:bg-neutral-50'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/products" 
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  location.pathname.startsWith('/products') 
                    ? 'text-primary-800 bg-primary-50' 
                    : 'text-neutral-600 hover:text-primary-800 hover:bg-neutral-50'
                }`}
              >
                Products
              </Link>
              <Link 
                to="/track-order" 
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  location.pathname === '/track-order' 
                    ? 'text-primary-800 bg-primary-50' 
                    : 'text-neutral-600 hover:text-primary-800 hover:bg-neutral-50'
                }`}
              >
                Track Order
              </Link>
            </nav>

            {/* Search Bar - Desktop */}
            <div className="hidden md:block flex-1 max-w-md mx-8" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative">
                <SearchIcon className="h-5 w-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearch(true)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-100 border-0 rounded-xl text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSearchResults([]) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                )}

                {/* Search Results Dropdown */}
                {showSearch && (searchResults.length > 0 || searchLoading) && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden z-50 search-dropdown-enter">
                    {searchLoading ? (
                      <div className="p-4 text-center text-neutral-500 text-sm">
                        Searching...
                      </div>
                    ) : (
                      <>
                        {searchResults.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => handleSearchResultClick(product.id)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors text-left"
                          >
                            <div className="w-10 h-10 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                  <WrenchIcon className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-primary-900 truncate">{product.name}</p>
                              <p className="text-xs text-accent-600">₱{product.price.toLocaleString()}</p>
                            </div>
                          </button>
                        ))}
                        <button
                          onClick={handleSearchSubmit}
                          className="w-full p-3 text-sm text-primary-600 hover:bg-primary-50 font-medium border-t border-neutral-100"
                        >
                          View all results for "{searchQuery}"
                        </button>
                      </>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {/* Wishlist */}
              {isAuthenticated() && (
                <Link to="/account/wishlist" className="relative p-2 text-neutral-600 hover:text-pink-500 transition-all hover:scale-110">
                  <HeartIcon className="h-6 w-6" />
                  {wishlistIds.size > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {wishlistIds.size > 99 ? '99+' : wishlistIds.size}
                    </span>
                  )}
                </Link>
              )}

              {/* Cart */}
              <Link to="/cart" className="relative p-2 text-neutral-600 hover:text-primary-800 transition-all hover:scale-110">
                <CartIcon className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className={`absolute -top-1 -right-1 bg-accent-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium ${cartPulse ? 'cart-badge-pulse' : ''}`}>
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
                    <UserIcon className="h-6 w-6" />
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
                        <SettingsIcon className="h-4 w-4" />
                        My Account
                      </Link>
                      <Link
                        to="/account/orders"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2 text-neutral-700 hover:bg-neutral-50"
                      >
                        <OrdersIcon className="h-4 w-4" />
                        Order History
                      </Link>
                      <Link
                        to="/account/addresses"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2 text-neutral-700 hover:bg-neutral-50"
                      >
                        <LocationIcon className="h-4 w-4" />
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
                          <LogoutIcon className="h-4 w-4" />
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
                  <UserIcon className="h-4 w-4" />
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile navigation - Simplified header */}
        <div className="md:hidden border-t border-neutral-100">
          <div className="flex items-center justify-center py-2 px-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <SearchIcon className="h-4 w-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-neutral-100 border-0 rounded-lg text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white"
              />
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-primary-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
                  <WrenchIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-semibold">Wena's Hardware</span>
              </div>
              <p className="text-primary-300 text-sm leading-relaxed">
                Your trusted partner for quality hardware, tools, and construction materials.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-400 mb-4">Contact Us</h3>
              <div className="space-y-3 text-primary-200 text-sm">
                <p className="flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4 text-accent-400" />
                  +63 948 195 7862
                </p>
                <p className="flex items-center gap-2">
                  <LocationIcon className="h-4 w-4 text-accent-400" />
                  Brgy. Caybunga, Balayan, Batangas
                </p>
                <p className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-accent-400" />
                  Mon-Sat: 7AM-5PM | Sun: 7AM-12PM
                </p>
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
            © {new Date().getFullYear()} Wena's Hardware. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50 mobile-nav-enter pb-safe">
        <div className="flex items-center justify-around py-2">
          <Link 
            to="/" 
            className={`flex flex-col items-center px-3 py-1 ${location.pathname === '/' ? 'text-primary-800' : 'text-neutral-500'}`}
          >
            <HomeIcon className="h-6 w-6" />
            <span className="text-xs mt-0.5 font-medium">Home</span>
          </Link>
          <Link 
            to="/products" 
            className={`flex flex-col items-center px-3 py-1 ${location.pathname.startsWith('/products') ? 'text-primary-800' : 'text-neutral-500'}`}
          >
            <WrenchIcon className="h-6 w-6" />
            <span className="text-xs mt-0.5 font-medium">Products</span>
          </Link>
          <Link 
            to="/cart" 
            className={`flex flex-col items-center px-3 py-1 relative ${location.pathname === '/cart' ? 'text-primary-800' : 'text-neutral-500'}`}
          >
            <div className="relative">
              <CartIcon className="h-6 w-6" />
              {totalItems > 0 && (
                <span className={`absolute -top-2 -right-2 bg-accent-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium ${cartPulse ? 'cart-badge-pulse' : ''}`}>
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </div>
            <span className="text-xs mt-0.5 font-medium">Cart</span>
          </Link>
          {isAuthenticated() ? (
            <Link 
              to="/account" 
              className={`flex flex-col items-center px-3 py-1 ${location.pathname.startsWith('/account') ? 'text-primary-800' : 'text-neutral-500'}`}
            >
              <UserIcon className="h-6 w-6" />
              <span className="text-xs mt-0.5 font-medium">Account</span>
            </Link>
          ) : (
            <Link 
              to="/login" 
              className={`flex flex-col items-center px-3 py-1 ${location.pathname === '/login' ? 'text-primary-800' : 'text-neutral-500'}`}
            >
              <UserIcon className="h-6 w-6" />
              <span className="text-xs mt-0.5 font-medium">Login</span>
            </Link>
          )}
        </div>
      </nav>
      {/* Spacer for mobile bottom nav */}
      <div className="md:hidden h-16"></div>
    </div>
  )
}
