import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MinusIcon, PlusIcon, CartIcon, HeartIcon, HeartSolidIcon, CloseIcon, ChevronLeftIcon, ChevronRightIcon, BoxIcon } from '../../components/icons'
import { productApi } from '../../services/api'
import { useCart } from '../../context/CartContext'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import toast from 'react-hot-toast'

export default function ProductDetailPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [editingQuantity, setEditingQuantity] = useState(null) // null = not editing
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showLightbox, setShowLightbox] = useState(false)
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
  const isUnavailable = product && !product.isAvailable
  const isOutOfStock = product?.isAvailable && effectiveStock <= 0

  useEffect(() => {
    fetchProduct()
  }, [id])

  // Don't auto-select variant - let user choose
  useEffect(() => {
    if (!product?.hasVariants) {
      setSelectedVariant(null)
    }
  }, [product])

  // Reset quantity when variant changes to avoid exceeding new variant's stock
  useEffect(() => {
    if (selectedVariant) {
      setQuantity(prev => Math.min(prev, selectedVariant.stockQuantity || 1) || 1)
    } else if (product) {
      setQuantity(prev => Math.min(prev, product.stockQuantity || 1) || 1)
    }
  }, [selectedVariant])

  // Calculate bulk discount for current quantity
  const currentBulkTier = product?.hasBulkPricing && product?.bulkPricingTiers?.length > 0
    ? [...product.bulkPricingTiers]
      .sort((a, b) => b.minQuantity - a.minQuantity)
      .find(tier => quantity >= tier.minQuantity)
    : null

  const bulkUnitPrice = currentBulkTier
    ? currentBulkTier.discountType === 'percentage'
      ? effectivePrice * (1 - currentBulkTier.discountValue / 100)
      : effectivePrice - currentBulkTier.discountValue
    : null

  const displayUnitPrice = bulkUnitPrice !== null ? Math.max(0, bulkUnitPrice) : effectivePrice

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

    // Check current state BEFORE toggling
    const wasInWishlist = isInWishlist(product.id)

    setWishlistLoading(true)
    const result = await toggleWishlist(product.id)
    setWishlistLoading(false)
    if (result.success) {
      // Show message based on what the action was (opposite of previous state)
      toast.success(wasInWishlist ? 'Removed from wishlist' : 'Added to wishlist')
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
        {/* Product Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div
            className="aspect-square bg-neutral-100 rounded-2xl overflow-hidden shadow-soft cursor-zoom-in relative group"
            onClick={() => setShowLightbox(true)}
          >
            {(() => {
              const images = product.images || []
              const currentImage = images.length > 0
                ? images[selectedImageIndex]?.imageUrl
                : product.imageUrl

              if (currentImage) {
                return (
                  <>
                    <img
                      src={currentImage}
                      alt={images[selectedImageIndex]?.altText || product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-white bg-black/50 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity">
                        Click to zoom
                      </span>
                    </div>
                  </>
                )
              }

              return (
                <div className="w-full h-full flex items-center justify-center text-neutral-300">
                  <BoxIcon className="h-32 w-32" />
                </div>
              )
            })()}
          </div>

          {/* Thumbnail Navigation */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImageIndex === index
                    ? 'border-primary-600 ring-2 ring-primary-200'
                    : 'border-neutral-200 hover:border-primary-300'
                    }`}
                >
                  <img
                    src={image.imageUrl}
                    alt={image.altText || `${product.name} - Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
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
              <label className="label">
                Options {!selectedVariant && <span className="text-red-500">*</span>}
              </label>
              {!selectedVariant && (
                <p className="text-sm text-neutral-500 mb-2">Please select an option to see price and availability</p>
              )}
              <div className="flex flex-wrap gap-2">
                {product.variants.filter(v => v.isAvailable && !v.isDeleted).map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-4 py-2.5 rounded-xl border-2 transition-all font-medium ${selectedVariant?.id === variant.id
                      ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-md'
                      : 'border-neutral-200 hover:border-primary-400 hover:bg-primary-50/30 text-neutral-700'
                      } ${variant.stockQuantity <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={variant.stockQuantity <= 0}
                  >
                    <span>{variant.name}</span>
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

          {/* Bulk Pricing Table */}
          {product.hasBulkPricing && product.bulkPricingTiers?.length > 0 && (
            <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <h3 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                💰 Volume Discounts Available
              </h3>
              <div className="overflow-hidden rounded-lg border border-emerald-200">
                <table className="w-full text-sm">
                  <thead className="bg-emerald-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-emerald-800 font-medium">Quantity</th>
                      <th className="px-3 py-2 text-left text-emerald-800 font-medium">Discount</th>
                      <th className="px-3 py-2 text-right text-emerald-800 font-medium">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {product.bulkPricingTiers.map((tier) => {
                      const discountedPrice = tier.discountType === 'percentage'
                        ? effectivePrice * (1 - tier.discountValue / 100)
                        : effectivePrice - tier.discountValue
                      return (
                        <tr key={tier.id} className="border-t border-emerald-100">
                          <td className="px-3 py-2 text-neutral-700">{tier.minQuantity}+ {product.unit}s</td>
                          <td className="px-3 py-2 text-emerald-600 font-medium">
                            {tier.discountType === 'percentage'
                              ? `${tier.discountValue}% off`
                              : `${formatPrice(tier.discountValue)} off`}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-primary-700">
                            {formatPrice(Math.max(0, discountedPrice))}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Availability */}
          <div className="mb-6">
            {product.hasVariants && !selectedVariant ? (
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
                <span className="inline-flex items-center text-neutral-600 font-medium">
                  <span className="h-2 w-2 bg-neutral-400 rounded-full mr-2"></span>
                  Select an option to check availability
                </span>
              </div>
            ) : (
              (() => {
                const stockQty = effectiveStock
                const isLowStock = isInStock && stockQty <= (product.lowStockThreshold ?? 10)

                if (isUnavailable) {
                  return (
                    <div className="p-3 bg-neutral-100 border border-neutral-200 rounded-xl">
                      <span className="inline-flex items-center text-neutral-600 font-medium">
                        <span className="h-2 w-2 bg-neutral-400 rounded-full mr-2"></span>
                        Currently Unavailable
                      </span>
                      <p className="text-xs text-neutral-500 mt-1 ml-4">This product is not available for ordering at this time. Please check back later.</p>
                    </div>
                  )
                }

                if (isOutOfStock) {
                  return (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                      <span className="inline-flex items-center text-red-600 font-medium">
                        <span className="h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                        Out of Stock
                      </span>
                      <p className="text-xs text-red-500 mt-1 ml-4">This product is currently out of stock. It may be restocked soon.</p>
                    </div>
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
              })()
            )}
          </div>

          {isInStock && (!product.hasVariants || selectedVariant) && (
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
                      type="text"
                      inputMode="numeric"
                      value={editingQuantity !== null ? editingQuantity : quantity}
                      onChange={(e) => {
                        const val = e.target.value
                        // Allow only digits or empty string
                        if (val === '' || /^\d+$/.test(val)) {
                          setEditingQuantity(val)
                        }
                      }}
                      onFocus={(e) => {
                        setEditingQuantity(String(quantity))
                        setTimeout(() => e.target.select(), 0)
                      }}
                      onBlur={() => {
                        if (!editingQuantity || editingQuantity === '') {
                          setEditingQuantity(null)
                          return
                        }
                        const parsed = parseInt(editingQuantity, 10)
                        if (isNaN(parsed) || parsed < 1) {
                          setEditingQuantity(null)
                          return
                        }
                        setQuantity(Math.min(parsed, effectiveStock))
                        setEditingQuantity(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.target.blur()
                        } else if (e.key === 'Escape') {
                          setEditingQuantity(null)
                          e.target.blur()
                        }
                      }}
                      className="w-16 text-center border-0 focus:ring-0"
                      aria-label="Quantity"
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
                    = {formatPrice(displayUnitPrice * quantity)}
                    {bulkUnitPrice !== null && (
                      <span className="ml-2 text-emerald-600 text-sm font-medium">
                        (Bulk discount applied!)
                      </span>
                    )}
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
                <CartIcon className="h-5 w-5" />
                Add to Cart
              </button>

              {cartQuantity > 0 && (
                <p className="text-center text-sm text-neutral-500 mt-3">
                  You have {cartQuantity} {product.unit}(s) in your cart
                </p>
              )}
            </>
          )}

          {/* Message when variant not selected */}
          {product.hasVariants && !selectedVariant && (
            <div className="p-4 bg-primary-50 border-2 border-primary-200 rounded-xl text-center">
              <p className="text-primary-700 font-medium">
                Please select an option above to continue
              </p>
            </div>
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

      {/* Lightbox Modal */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setShowLightbox(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 text-white hover:text-neutral-300 transition-colors z-10"
            aria-label="Close lightbox"
          >
            <CloseIcon className="h-8 w-8" />
          </button>

          {/* Navigation Arrows (if multiple images) */}
          {product.images && product.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImageIndex(prev =>
                    prev === 0 ? product.images.length - 1 : prev - 1
                  )
                }}
                className="absolute left-4 text-white hover:text-neutral-300 transition-colors p-2 bg-black/30 rounded-full"
                aria-label="Previous image"
              >
                <ChevronLeftIcon className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImageIndex(prev =>
                    prev === product.images.length - 1 ? 0 : prev + 1
                  )
                }}
                className="absolute right-4 text-white hover:text-neutral-300 transition-colors p-2 bg-black/30 rounded-full"
                aria-label="Next image"
              >
                <ChevronRightIcon className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Main Image */}
          <div
            className="max-w-4xl max-h-[80vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={
                product.images?.length > 0
                  ? product.images[selectedImageIndex]?.imageUrl
                  : product.imageUrl
              }
              alt={product.images?.[selectedImageIndex]?.altText || product.name}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {/* Image Counter */}
            {product.images?.length > 1 && (
              <p className="text-center text-white/70 mt-4 text-sm">
                {selectedImageIndex + 1} / {product.images.length}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
