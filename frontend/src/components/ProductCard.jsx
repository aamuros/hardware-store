import { Link } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'

export default function ProductCard({ product }) {
  const { addToCart, getItemQuantity } = useCart()
  const quantity = getItemQuantity(product.id)

  // Check if product is in stock (stockQuantity > 0 and isAvailable)
  const isInStock = product.isAvailable && (product.stockQuantity ?? 0) > 0
  const isLowStock = isInStock && (product.stockQuantity ?? 0) <= (product.lowStockThreshold ?? 10)

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Prevent adding if no stock available
    if (!isInStock) {
      toast.error('This product is out of stock')
      return
    }

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
    <Link to={`/products/${product.id}`} className="card-hover group">
      {/* Product Image */}
      <div className="aspect-square bg-neutral-100 relative overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <CubeIcon className="h-16 w-16" />
          </div>
        )}

        {/* Out of Stock overlay */}
        {!isInStock && (
          <div className="absolute inset-0 bg-primary-900/60 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-white text-primary-800 px-3 py-1 rounded-lg text-sm font-medium">
              Out of Stock
            </span>
          </div>
        )}

        {/* Low Stock badge */}
        {isLowStock && (
          <div className="absolute top-3 left-3 bg-amber-500 text-white px-2 py-0.5 rounded text-xs font-medium">
            Only {product.stockQuantity} left
          </div>
        )}

        {/* Cart quantity badge */}
        {quantity > 0 && (
          <div className="absolute top-3 right-3 bg-accent-500 text-white rounded-lg h-6 w-6 flex items-center justify-center text-xs font-bold shadow-sm">
            {quantity}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="text-xs text-neutral-500 mb-1 font-medium">{product.category?.name}</div>
        <h3 className="font-medium text-primary-900 mb-1 line-clamp-2 group-hover:text-accent-600 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-lg font-bold text-primary-800">
              {formatPrice(product.price)}
            </span>
            <span className="text-xs text-neutral-500 ml-1">/ {product.unit}</span>
          </div>

          {isInStock && (
            <button
              onClick={handleAddToCart}
              className="p-2.5 bg-primary-800 text-white rounded-xl hover:bg-primary-900 transition-all duration-200 hover:shadow-md"
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
