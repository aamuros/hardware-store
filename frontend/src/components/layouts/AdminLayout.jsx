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
  LockIcon
} from '../icons'
import { useState, useMemo } from 'react'

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

  const navigation = useMemo(
    () => (user?.role === 'admin' ? [...baseNavigation, ...adminOnlyNavigation] : baseNavigation),
    [user?.role]
  )

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

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-primary-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-900 transform transition-transform duration-300 ease-in-out lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-primary-950">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-accent-500 rounded-lg flex items-center justify-center">
              <WrenchIcon className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-semibold text-white">Admin</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-primary-400 hover:text-white transition-colors">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${isActive(item.href)
                ? 'bg-primary-800 text-white'
                : 'text-primary-300 hover:bg-primary-800 hover:text-white'
                }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-primary-900">
          <div className="flex items-center h-16 px-4 bg-primary-950">
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
                <WrenchIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-white">Admin Panel</span>
            </Link>
          </div>
          <nav className="flex-1 mt-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium transition-all ${isActive(item.href)
                  ? 'bg-primary-800 text-white border-l-4 border-accent-500'
                  : 'text-primary-300 hover:bg-primary-800 hover:text-white hover:translate-x-1'
                  }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-primary-800">
            <Link to="/" className="block text-primary-400 hover:text-white text-sm font-medium transition-colors">
              ← Back to Store
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white shadow-sm z-30">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              <MenuIcon className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-neutral-600">
                Welcome, <strong>{user?.name || 'Admin'}</strong>
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user?.role === 'admin'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
                }`}>
                {user?.role === 'admin' ? 'Admin' : 'Staff'}
              </span>
              <Link
                to="/admin/change-password"
                className="flex items-center text-sm text-neutral-600 hover:text-primary-600 transition-colors"
                title="Change Password"
              >
                <LockIcon className="h-5 w-5 mr-1" />
                <span className="hidden sm:inline">Change Password</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center text-sm text-neutral-600 hover:text-red-600 transition-colors"
              >
                <LogoutIcon className="h-5 w-5 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

