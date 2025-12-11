import { Link } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'

export default function ProductCard({ product }) {
  const { addToCart, getItemQuantity } = useCart()
  const quantity = getItemQuantity(product.id)

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product, 1)
    toast.success(`${product.name} added to cart!`)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price)
  }

  return (
    <Link to={`/products/${product.id}`} className="card group">
      {/* Product Image */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <CubeIcon className="h-16 w-16" />
          </div>
        )}
        
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Out of Stock
            </span>
          </div>
        )}
        
        {quantity > 0 && (
          <div className="absolute top-2 right-2 bg-primary-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
            {quantity}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="text-xs text-gray-500 mb-1">{product.category?.name}</div>
        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-lg font-bold text-primary-600">
              {formatPrice(product.price)}
            </span>
            <span className="text-xs text-gray-500 ml-1">/ {product.unit}</span>
          </div>
          
          {product.isAvailable && (
            <button
              onClick={handleAddToCart}
              className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              aria-label="Add to cart"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}

// Cube icon for missing images
function CubeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}
