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
    <Link to={`/products/${product.id}`} className="group block bg-white rounded-2xl border border-neutral-100 overflow-hidden hover:border-neutral-200 hover:shadow-soft transition-all duration-200">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-neutral-50">
        <OptimizedImage
          src={product.imageUrl}
          alt={product.name}
          className="group-hover:scale-[1.04] transition-transform duration-500"
          fallback={<BoxIcon className="h-16 w-16 text-neutral-300" />}
        />

        {/* Unavailable overlay — admin disabled the product */}
        {isUnavailable && !hasVariants && (
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-white/95 text-neutral-600 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm tracking-wide">
              Unavailable
            </span>
          </div>
        )}

        {/* Out of Stock overlay — has stock = 0 but is available */}
        {isOutOfStock && !hasVariants && (
          <div className="absolute inset-0 bg-neutral-900/30 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-white/95 text-red-600 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border border-red-100 tracking-wide">
              Out of Stock
            </span>
          </div>
        )}

        {/* Top-left badge */}
        {hasVariants && isInStock && (
          <div className="absolute top-2.5 left-2.5 bg-primary-800/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide">
            Options
          </div>
        )}
        {isLowStock && !hasVariants && (
          <div className="absolute top-2.5 left-2.5 bg-amber-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide">
            Only {product.stockQuantity} left
          </div>
        )}

        {/* Cart quantity badge */}
        {quantity > 0 && (
          <div className={`absolute top-2.5 right-2.5 bg-primary-800 text-white rounded-full h-5 flex items-center justify-center text-[10px] font-bold shadow ${quantity > 99 ? 'min-w-[20px] px-1.5' : 'w-5'}`}>
            {quantity > 99 ? '99+' : quantity}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3.5">
        {product.category?.name && (
          <div className="text-[10px] text-neutral-400 mb-1 font-semibold uppercase tracking-widest leading-none">{product.category.name}</div>
        )}
        <h3 className="font-semibold text-primary-900 mb-3 line-clamp-2 text-sm leading-snug">
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            {hasVariants && (
              <span className="text-[10px] text-neutral-400 font-medium block leading-none mb-0.5">From</span>
            )}
            <div className="flex items-baseline gap-0.5">
              <span className="text-sm font-bold text-primary-900">
                {formattedPrice}
              </span>
              <span className="text-[10px] text-neutral-400 ml-0.5">/{product.unit}</span>
            </div>
          </div>

          {isInStock ? (
            <button
              onClick={handleAddToCart}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary-900 text-white rounded-lg hover:bg-primary-800 active:scale-95 transition-all duration-150 shadow-sm"
              aria-label={hasVariants ? 'View options' : 'Add to cart'}
              title={hasVariants ? 'View options' : 'Add to cart'}
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          ) : isUnavailable ? (
            <span className="text-[10px] font-semibold text-neutral-400 tracking-wide">N/A</span>
          ) : isOutOfStock ? (
            <span className="text-[10px] font-semibold text-red-500 tracking-wide">Sold Out</span>
          ) : null}
        </div>
      </div>
    </Link>
  )
})

export default ProductCard
