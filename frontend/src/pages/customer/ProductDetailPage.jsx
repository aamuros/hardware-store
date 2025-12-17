import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MinusIcon, PlusIcon, ShoppingCartIcon, HeartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { productApi } from '../../services/api'
import { useCart } from '../../context/CartContext'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import toast from 'react-hot-toast'

export default function ProductDetailPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const { addToCart, getItemQuantity } = useCart()
  const { isAuthenticated, isInWishlist, toggleWishlist } = useCustomerAuth()
  const [wishlistLoading, setWishlistLoading] = useState(false)

  // Get cart quantity considering variant
  const cartQuantity = product
    ? getItemQuantity(product.id, selectedVariant?.id || null)
    : 0

  // Get effective price and stock based on selected variant
  const effectivePrice = selectedVariant?.price ?? product?.price ?? 0
  const effectiveStock = selectedVariant?.stockQuantity ?? product?.stockQuantity ?? 0
  const isInStock = product?.isAvailable && effectiveStock > 0

  useEffect(() => {
    fetchProduct()
  }, [id])

  // Auto-select first variant if product has variants
  useEffect(() => {
    if (product?.hasVariants && product?.variants?.length > 0) {
      setSelectedVariant(product.variants[0])
    } else {
      setSelectedVariant(null)
    }
  }, [product])

  const fetchProduct = async () => {
    try {
      const response = await productApi.getById(id)
      setProduct(response.data.data)
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (product.hasVariants && !selectedVariant) {
      toast.error('Please select an option')
      return
    }
    addToCart(product, quantity, selectedVariant)
    const variantInfo = selectedVariant ? ` (${selectedVariant.name})` : ''
    toast.success(`${quantity} ${product.unit}(s) of ${product.name}${variantInfo} added to cart!`)
    setQuantity(1)
  }

  const handleWishlistToggle = async () => {
    if (!isAuthenticated()) {
      toast('Please log in to save items', { icon: '🔐' })
      return
    }
    setWishlistLoading(true)
    const result = await toggleWishlist(product.id)
    setWishlistLoading(false)
    if (result.success) {
      toast.success(isInWishlist(product.id) ? 'Removed from wishlist' : 'Added to wishlist')
    } else {
      toast.error(result.message)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-primary-900 mb-4">Product Not Found</h1>
        <Link to="/products" className="text-accent-600 hover:text-accent-700 font-medium">
          ← Back to Products
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center space-x-2 text-sm">
          <li><Link to="/" className="text-neutral-500 hover:text-primary-700">Home</Link></li>
          <li className="text-neutral-300">/</li>
          <li><Link to="/products" className="text-neutral-500 hover:text-primary-700">Products</Link></li>
          <li className="text-neutral-300">/</li>
          <li className="text-primary-800 font-medium truncate">{product.name}</li>
        </ol>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image */}
        <div className="aspect-square bg-neutral-100 rounded-2xl overflow-hidden shadow-soft">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-300">
              <svg className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <div className="mb-4">
            <span className="inline-block bg-neutral-100 text-neutral-600 text-sm px-3 py-1.5 rounded-lg font-medium">
              {product.category?.name}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-primary-900 mb-2">{product.name}</h1>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            disabled={wishlistLoading}
            className={`flex items-center gap-2 mb-4 px-4 py-2 rounded-lg transition-all ${isInWishlist(product.id)
              ? 'bg-pink-50 text-pink-600 hover:bg-pink-100'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
          >
            {isInWishlist(product.id) ? (
              <HeartSolidIcon className="h-5 w-5" />
            ) : (
              <HeartIcon className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">
              {isInWishlist(product.id) ? 'Saved to Wishlist' : 'Add to Wishlist'}
            </span>
          </button>

          {product.sku && !product.hasVariants && (
            <p className="text-sm text-neutral-500 mb-4">SKU: {product.sku}</p>
          )}
          {selectedVariant?.sku && (
            <p className="text-sm text-neutral-500 mb-4">SKU: {selectedVariant.sku}</p>
          )}

          {/* Variant Selector */}
          {product.hasVariants && product.variants?.length > 0 && (
            <div className="mb-6">
              <label className="label">Options</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.filter(v => v.isAvailable && !v.isDeleted).map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-4 py-2.5 rounded-xl border-2 transition-all font-medium ${selectedVariant?.id === variant.id
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 hover:border-primary-300 text-neutral-700'
                      } ${variant.stockQuantity <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={variant.stockQuantity <= 0}
                  >
                    <span>{variant.name}</span>
                    {variant.price !== product.price && (
                      <span className="ml-2 text-sm text-primary-600">
                        {formatPrice(variant.price)}
                      </span>
                    )}
                    {variant.stockQuantity <= 0 && (
                      <span className="ml-2 text-xs text-red-500">(Out of stock)</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-3xl font-bold text-primary-800">
              {formatPrice(effectivePrice)}
            </span>
            <span className="text-neutral-500">per {product.unit}</span>
          </div>

          {product.description && (
            <p className="text-neutral-600 mb-6 leading-relaxed">{product.description}</p>
          )}

          {/* Availability */}
          <div className="mb-6">
            {(() => {
              const stockQty = effectiveStock
              const isLowStock = isInStock && stockQty <= (product.lowStockThreshold ?? 10)

              if (!isInStock) {
                return (
                  <span className="inline-flex items-center text-red-600">
                    <span className="h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                    Out of Stock
                  </span>
                )
              }

              if (isLowStock) {
                return (
                  <span className="inline-flex items-center text-amber-600">
                    <span className="h-2 w-2 bg-amber-500 rounded-full mr-2"></span>
                    Only {stockQty} left in stock
                  </span>
                )
              }

              return (
                <span className="inline-flex items-center text-emerald-600">
                  <span className="h-2 w-2 bg-emerald-500 rounded-full mr-2"></span>
                  In Stock ({stockQty} available)
                </span>
              )
            })()}
          </div>

          {isInStock && (
            <>
              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="label">Quantity</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-neutral-100 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={effectiveStock}
                      value={quantity}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1)
                        setQuantity(Math.min(val, effectiveStock))
                      }}
                      className="w-16 text-center border-0 focus:ring-0"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(quantity + 1, effectiveStock))}
                      className="p-3 hover:bg-neutral-100 transition-colors"
                      disabled={quantity >= effectiveStock}
                      aria-label="Increase quantity"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-neutral-600">
                    = {formatPrice(effectivePrice * quantity)}
                  </span>
                </div>
                {quantity >= effectiveStock && (
                  <p className="text-xs text-amber-600 mt-1">Maximum available quantity selected</p>
                )}
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                className="btn-primary btn-lg w-full flex items-center justify-center gap-2"
              >
                <ShoppingCartIcon className="h-5 w-5" />
                Add to Cart
              </button>

              {cartQuantity > 0 && (
                <p className="text-center text-sm text-neutral-500 mt-3">
                  You have {cartQuantity} {product.unit}(s) in your cart
                </p>
              )}
            </>
          )}

          {/* Back Link */}
          <Link
            to="/products"
            className="block text-center mt-6 text-neutral-600 hover:text-accent-600 transition-colors"
          >
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
