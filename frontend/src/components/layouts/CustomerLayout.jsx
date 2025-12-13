import { Outlet, Link } from 'react-router-dom'
import { ShoppingCartIcon } from '@heroicons/react/24/outline'
import { useCart } from '../../context/CartContext'

export default function CustomerLayout() {
  const { totalItems } = useCart()
  
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
            
            {/* Cart */}
            <div className="flex items-center space-x-4">
              <Link to="/cart" className="relative p-2 text-neutral-600 hover:text-primary-800 transition-colors">
                <ShoppingCartIcon className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
        
        {/* Mobile navigation */}
        <div className="md:hidden border-t border-neutral-100">
          <div className="flex justify-around py-2">
            <Link to="/" className="text-neutral-600 hover:text-primary-800 text-sm font-medium">Home</Link>
            <Link to="/products" className="text-neutral-600 hover:text-primary-800 text-sm font-medium">Products</Link>
            <Link to="/track-order" className="text-neutral-600 hover:text-primary-800 text-sm font-medium">Track Order</Link>
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
