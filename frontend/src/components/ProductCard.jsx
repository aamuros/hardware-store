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

  // Memoize stock calculations — distinguish "unavailable" vs "out of stock"
  const { isInStock, isLowStock, isUnavailable, isOutOfStock } = useMemo(() => {
    if (hasVariants) {
      return {
        isInStock: product.isAvailable,
        isLowStock: false,
        isUnavailable: !product.isAvailable,
        isOutOfStock: false,
      }
    }
    const stockQty = product.stockQuantity ?? 0
    const unavailable = !product.isAvailable
    const outOfStock = product.isAvailable && stockQty <= 0
    const inStock = product.isAvailable && stockQty > 0
    const lowStock = inStock && stockQty <= (product.lowStockThreshold ?? 10)
    return { isInStock: inStock, isLowStock: lowStock, isUnavailable: unavailable, isOutOfStock: outOfStock }
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

    // Check if already at max stock
    const currentQty = getItemQuantity(product.id)
    const maxStock = product.stockQuantity ?? 999
    if (currentQty >= maxStock) {
      toast.error(`Maximum stock reached (${maxStock} in cart)`)
      return
    }

    addToCart(product, 1)

    if (currentQty > 0) {
      const newQty = Math.min(currentQty + 1, maxStock)
      toast.success(`${product.name} — quantity updated to ${newQty}`)
    } else {
      toast.success(`${product.name} added to cart!`)
    }
  }, [isInStock, addToCart, product, hasVariants, navigate, getItemQuantity])

  return (
    <Link to={`/products/${product.id}`} className="card-hover group">
      {/* Product Image */}
      <div className="relative overflow-hidden">
        <OptimizedImage
          src={product.imageUrl}
          alt={product.name}
          className="transition-transform duration-300 ease-out group-hover:scale-[1.02]"
          fallback={<BoxIcon className="h-16 w-16 text-neutral-300" />}
        />

        {/* Unavailable overlay — admin disabled the product */}
        {isUnavailable && !hasVariants && (
          <div className="absolute inset-0 bg-neutral-900/50 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-white text-neutral-700 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm">
              Currently Unavailable
            </span>
          </div>
        )}

        {/* Out of Stock overlay — has stock = 0 but is available */}
        {isOutOfStock && !hasVariants && (
          <div className="absolute inset-0 bg-red-900/30 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-white text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm border border-red-200">
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
          <div className={`absolute top-3 right-3 bg-accent-500 text-white rounded-lg h-6 flex items-center justify-center text-xs font-bold shadow-sm ${quantity > 99 ? 'min-w-6 px-1' : 'w-6'}`}>
            {quantity > 99 ? '99+' : quantity}
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

          {isInStock ? (
            <button
              onClick={handleAddToCart}
              className="p-2.5 bg-primary-800 text-white rounded-xl hover:bg-primary-900 transition-all duration-200 hover:shadow-md active:scale-95"
              aria-label={hasVariants ? 'View options' : 'Add to cart'}
              title={hasVariants ? 'View options' : 'Add to cart'}
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          ) : isUnavailable ? (
            <span className="px-2 py-1 text-[10px] font-semibold text-neutral-500 bg-neutral-100 border border-neutral-200 rounded-lg uppercase tracking-wide">
              Unavailable
            </span>
          ) : isOutOfStock ? (
            <span className="px-2 py-1 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg uppercase tracking-wide">
              No Stock
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
})

export default ProductCard
