import { Outlet, Link } from 'react-router-dom'
import { ShoppingCartIcon } from '@heroicons/react/24/outline'
import { useCart } from '../../context/CartContext'

export default function CustomerLayout() {
  const { totalItems } = useCart()
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">🔧 Hardware Store</span>
            </Link>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-600 hover:text-primary-600 transition-colors">
                Home
              </Link>
              <Link to="/products" className="text-gray-600 hover:text-primary-600 transition-colors">
                Products
              </Link>
              <Link to="/track-order" className="text-gray-600 hover:text-primary-600 transition-colors">
                Track Order
              </Link>
            </nav>
            
            {/* Cart */}
            <div className="flex items-center space-x-4">
              <Link to="/cart" className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors">
                <ShoppingCartIcon className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
        
        {/* Mobile navigation */}
        <div className="md:hidden border-t border-gray-100">
          <div className="flex justify-around py-2">
            <Link to="/" className="text-gray-600 hover:text-primary-600 text-sm">Home</Link>
            <Link to="/products" className="text-gray-600 hover:text-primary-600 text-sm">Products</Link>
            <Link to="/track-order" className="text-gray-600 hover:text-primary-600 text-sm">Track Order</Link>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">🔧 Hardware Store</h3>
              <p className="text-gray-400 text-sm">
                Your trusted partner for quality hardware, tools, and construction materials.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <p className="text-gray-400 text-sm">📞 0917-123-4567</p>
              <p className="text-gray-400 text-sm">📍 123 Main St, Your City</p>
              <p className="text-gray-400 text-sm">🕐 Mon-Sat: 7AM - 7PM</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/products" className="text-gray-400 hover:text-white text-sm">Products</Link></li>
                <li><Link to="/track-order" className="text-gray-400 hover:text-white text-sm">Track Order</Link></li>
                <li><Link to="/admin/login" className="text-gray-400 hover:text-white text-sm">Admin Login</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} Hardware Store. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
