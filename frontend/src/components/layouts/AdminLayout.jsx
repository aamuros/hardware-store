import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  HomeIcon,
  ShoppingBagIcon,
  BoxIcon,
  TagIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
  ChartIcon,
  WrenchIcon,
  UsersIcon,
  LockIcon,
  ChevronDownIcon,
} from '../icons'
import { useState, useMemo, useRef, useEffect } from 'react'

const baseNavigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBagIcon },
  { name: 'Products', href: '/admin/products', icon: BoxIcon },
  { name: 'Categories', href: '/admin/categories', icon: TagIcon },
  { name: 'Reports', href: '/admin/reports', icon: ChartIcon },
]

const adminOnlyNavigation = [
  { name: 'Staff', href: '/admin/users', icon: UsersIcon },
]

export default function AdminLayout() {
  const { user, logout, isAdminRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  const navigation = useMemo(
    () => (user?.role === 'admin' ? [...baseNavigation, ...adminOnlyNavigation] : baseNavigation),
    [user?.role]
  )

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const isActive = (href) => {
    if (href === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(href)
  }

  const SidebarContent = ({ onLinkClick }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-neutral-100">
        <Link to="/admin" onClick={onLinkClick} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-primary-800 rounded-lg flex items-center justify-center group-hover:bg-primary-900 transition-colors">
            <WrenchIcon className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-base font-semibold text-primary-900 tracking-tight">Wena's Hardware</span>
            <p className="text-xs text-neutral-400 -mt-0.5">Admin Panel</p>
          </div>
        </Link>
        {onLinkClick && (
          <button onClick={onLinkClick} className="lg:hidden p-1.5 text-neutral-400 hover:text-neutral-600 transition-colors rounded-lg hover:bg-neutral-100">
            <CloseIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            onClick={onLinkClick}
            className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
              isActive(item.href)
                ? 'bg-primary-50 text-primary-800'
                : 'text-neutral-600 hover:text-primary-800 hover:bg-neutral-50'
            }`}
          >
            <item.icon className={`h-5 w-5 mr-3 flex-shrink-0 ${isActive(item.href) ? 'text-primary-700' : 'text-neutral-400'}`} />
            {item.name}
            {isActive(item.href) && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600" />
            )}
          </Link>
        ))}
      </nav>

      {/* Back to store */}
      <div className="px-3 py-4 border-t border-neutral-100">
        <Link
          to="/"
          onClick={onLinkClick}
          className="flex items-center px-3 py-2 text-sm font-medium text-neutral-500 hover:text-primary-800 hover:bg-neutral-50 rounded-xl transition-colors"
        >
          <span className="mr-1.5">←</span>
          Back to Store
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-primary-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-soft-lg transform transition-transform duration-200 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onLinkClick={() => setSidebarOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col bg-white border-r border-neutral-100">
        <SidebarContent />
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            {/* Breadcrumb / page title space */}
            <div className="hidden lg:block" />

            {/* Right section */}
            <div className="flex items-center gap-3" ref={userMenuRef}>
              {/* Role badge */}
              <span className={`hidden sm:inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-lg ${
                user?.role === 'admin'
                  ? 'bg-violet-50 text-violet-700 border border-violet-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {user?.role === 'admin' ? 'Admin' : 'Staff'}
              </span>

              {/* User dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary-700">
                      {(user?.name || 'A').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:inline">{user?.name || 'Admin'}</span>
                  <ChevronDownIcon className={`h-4 w-4 text-neutral-400 transition-transform duration-150 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-soft-lg border border-neutral-100 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-neutral-100">
                      <p className="text-xs text-neutral-400">Signed in as</p>
                      <p className="text-sm font-semibold text-primary-900 truncate">{user?.name || 'Admin'}</p>
                    </div>
                    <Link
                      to="/admin/change-password"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-primary-800 transition-colors"
                    >
                      <LockIcon className="h-4 w-4 text-neutral-400" />
                      Change Password
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-neutral-100"
                    >
                      <LogoutIcon className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

