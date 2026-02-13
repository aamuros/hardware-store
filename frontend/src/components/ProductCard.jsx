import { memo, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PlusIcon, BoxIcon } from './icons'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'
import OptimizedImage from './OptimizedImage'

// Memoized price formatter
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(price)
}

const ProductCard = memo(function ProductCard({ product }) {
  const { addToCart, getItemQuantity } = useCart()
  const navigate = useNavigate()
  const quantity = getItemQuantity(product.id)

  // Products with variants manage stock at the variant level, not the product level
  const hasVariants = product.hasVariants

  // Memoize stock calculations
  const { isInStock, isLowStock } = useMemo(() => {
    if (hasVariants) {
      // For variant products, consider in-stock if the product is available
      // (actual variant stock is checked on the detail page)
      return { isInStock: product.isAvailable, isLowStock: false }
    }
    const inStock = product.isAvailable && (product.stockQuantity ?? 0) > 0
    const lowStock = inStock && (product.stockQuantity ?? 0) <= (product.lowStockThreshold ?? 10)
    return { isInStock: inStock, isLowStock: lowStock }
  }, [product.isAvailable, product.stockQuantity, product.lowStockThreshold, hasVariants])

  // Memoize formatted price
  const formattedPrice = useMemo(() => formatPrice(product.price), [product.price])

  const handleAddToCart = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()

    // Products with variants must be configured on the detail page
    if (hasVariants) {
      navigate(`/products/${product.id}`)
      return
    }

    if (!isInStock) {
      toast.error('This product is out of stock')
      return
    }

    addToCart(product, 1)
    toast.success(`${product.name} added to cart!`)
  }, [isInStock, addToCart, product, hasVariants, navigate])

  return (
    <Link to={`/products/${product.id}`} className="card-hover group">
      {/* Product Image */}
      <div className="relative overflow-hidden">
        <OptimizedImage
          src={product.imageUrl}
          alt={product.name}
          className="group-hover:scale-[1.03] transition-transform duration-500 ease-out"
          fallback={<BoxIcon className="h-16 w-16 text-neutral-300" />}
        />

        {/* Out of Stock overlay - only for non-variant products */}
        {!isInStock && !hasVariants && (
          <div className="absolute inset-0 bg-primary-900/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-white text-primary-800 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm">
              Out of Stock
            </span>
          </div>
        )}

        {/* Variants badge */}
        {hasVariants && (
          <div className="absolute top-3 left-3 bg-primary-700 text-white px-2 py-0.5 rounded text-xs font-medium">
            Multiple Options
          </div>
        )}

        {/* Low Stock badge - only for non-variant products */}
        {isLowStock && !hasVariants && (
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
            {hasVariants && (
              <span className="text-xs text-neutral-500 mr-0.5">From </span>
            )}
            <span className="text-lg font-bold text-primary-800">
              {formattedPrice}
            </span>
            <span className="text-xs text-neutral-500 ml-1">/ {product.unit}</span>
          </div>

          {isInStock && (
            <button
              onClick={handleAddToCart}
              className="p-2.5 bg-primary-800 text-white rounded-xl hover:bg-primary-900 transition-all duration-200 hover:shadow-md active:scale-95"
              aria-label={hasVariants ? 'View options' : 'Add to cart'}
              title={hasVariants ? 'View options' : 'Add to cart'}
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </Link>
  )
})

export default ProductCard
