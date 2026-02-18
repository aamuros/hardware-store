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

    // Check if already at max stock before adding
    const currentQty = getItemQuantity(product.id, selectedVariant?.id)
    const maxStock = selectedVariant ? selectedVariant.stockQuantity : (product.stockQuantity ?? 999)
    if (currentQty >= maxStock) {
      toast.error(`Maximum stock reached (${maxStock} already in cart)`)
      return
    }

    // Clamp quantity to not exceed stock
    const addableQty = Math.min(quantity, maxStock - currentQty)
    if (addableQty < quantity) {
      toast.error(`Only ${addableQty} more can be added (${maxStock} total in stock)`)
    }

    addToCart(product, addableQty, selectedVariant)
    const variantInfo = selectedVariant ? ` (${selectedVariant.name})` : ''
    if (currentQty > 0) {
      const newQty = Math.min(currentQty + addableQty, maxStock)
      toast.success(`${product.name}${variantInfo} — quantity updated to ${newQty}`)
    } else {
      toast.success(`${addableQty} ${product.unit}(s) of ${product.name}${variantInfo} added to cart!`)
    }
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
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-3.5 bg-neutral-200 rounded-full w-52 mb-8 animate-pulse" />
          <div className="grid md:grid-cols-2 gap-8 lg:gap-14">
            <div className="space-y-3">
              <div className="aspect-square bg-neutral-200 rounded-2xl animate-pulse" />
              <div className="flex gap-2">
                {[1,2,3].map(i => <div key={i} className="w-20 h-20 bg-neutral-200 rounded-xl animate-pulse" />)}
              </div>
            </div>
            <div className="space-y-4 pt-2">
              <div className="h-2.5 bg-neutral-200 rounded-full w-20 animate-pulse" />
              <div className="h-8 bg-neutral-200 rounded-lg w-4/5 animate-pulse" />
              <div className="h-7 bg-neutral-200 rounded-lg w-1/3 animate-pulse" />
              <div className="h-3.5 bg-neutral-100 rounded-full w-full animate-pulse" />
              <div className="h-3.5 bg-neutral-100 rounded-full w-3/4 animate-pulse" />
              <div className="h-3.5 bg-neutral-100 rounded-full w-1/2 animate-pulse" />
              <div className="pt-4 space-y-3">
                <div className="h-12 bg-neutral-200 rounded-2xl w-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <BoxIcon className="h-8 w-8 text-neutral-300" />
          </div>
          <h1 className="text-lg font-bold text-primary-900 mb-2">Product Not Found</h1>
          <p className="text-sm text-neutral-400 mb-6">This product may have been removed or doesn't exist.</p>
          <Link to="/products" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-900 text-white text-sm font-medium rounded-xl hover:bg-primary-800 transition-colors">
            ← Back to Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center gap-2 text-xs text-neutral-400">
            <li><Link to="/" className="hover:text-primary-700 transition-colors">Home</Link></li>
            <li>/</li>
            <li><Link to="/products" className="hover:text-primary-700 transition-colors">Products</Link></li>
            <li>/</li>
            {product.category?.name && (
              <>
                <li>
                  <Link to={`/products?category=${product.categoryId}`} className="hover:text-primary-700 transition-colors">
                    {product.category.name}
                  </Link>
                </li>
                <li>/</li>
              </>
            )}
            <li className="text-primary-800 font-medium truncate max-w-[180px]">{product.name}</li>
          </ol>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-14 items-start">
          {/* ── Left: Image Gallery ── */}
          <div className="space-y-3">
            {/* Main Image */}
            <div
              className="aspect-square bg-white border border-neutral-100 rounded-2xl overflow-hidden cursor-zoom-in relative group shadow-sm"
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
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-400"
                      />
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-black/60 text-white text-[11px] font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
                          Zoom
                        </span>
                      </div>
                    </>
                  )
                }

                return (
                  <div className="w-full h-full flex items-center justify-center">
                    <BoxIcon className="h-24 w-24 text-neutral-200" />
                  </div>
                )
              })()}
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-primary-700 shadow-sm'
                        : 'border-transparent hover:border-neutral-300'
                    }`}
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.altText || `Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Product Info ── */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
            {/* Category + SKU row */}
            <div className="flex items-center justify-between mb-4">
              {product.category?.name && (
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                  {product.category.name}
                </span>
              )}
              {(product.sku && !product.hasVariants) && (
                <span className="text-[11px] text-neutral-400 font-mono">#{product.sku}</span>
              )}
              {selectedVariant?.sku && (
                <span className="text-[11px] text-neutral-400 font-mono">#{selectedVariant.sku}</span>
              )}
            </div>

            {/* Product Name */}
            <h1 className="text-2xl font-bold text-primary-900 leading-snug mb-1">{product.name}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-1.5 mt-3 mb-5">
              <span className="text-3xl font-extrabold text-primary-900 tracking-tight">
                {formatPrice(effectivePrice)}
              </span>
              <span className="text-sm text-neutral-400 font-medium">/ {product.unit}</span>
            </div>

            {/* Availability Badge */}
            <div className="mb-5">
              {product.hasVariants && !selectedVariant ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-300"></span>
                  Select an option to check stock
                </span>
              ) : (
                (() => {
                  const stockQty = effectiveStock
                  const isLowStock = isInStock && stockQty <= (product.lowStockThreshold ?? 10)

                  if (isUnavailable) return (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
                      Currently Unavailable
                    </span>
                  )
                  if (isOutOfStock) return (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                      Out of Stock
                    </span>
                  )
                  if (isLowStock) return (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Only {stockQty} left
                    </span>
                  )
                  return (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      In Stock — {stockQty} available
                    </span>
                  )
                })()
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-neutral-500 leading-relaxed mb-5 border-t border-neutral-100 pt-5">
                {product.description}
              </p>
            )}

            {/* Variant Selector */}
            {product.hasVariants && product.variants?.length > 0 && (
              <div className="mb-5">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-2.5">
                  Options
                  {!selectedVariant && <span className="ml-1.5 text-red-400 normal-case font-normal tracking-normal">— choose one</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.filter(v => v.isAvailable && !v.isDeleted).map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={variant.stockQuantity <= 0}
                      className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                        selectedVariant?.id === variant.id
                          ? 'border-primary-800 bg-primary-900 text-white shadow-sm'
                          : variant.stockQuantity <= 0
                            ? 'border-neutral-100 bg-neutral-50 text-neutral-300 cursor-not-allowed'
                            : 'border-neutral-200 text-neutral-700 hover:border-primary-300 bg-white'
                      }`}
                    >
                      {variant.name}
                      {variant.stockQuantity <= 0 && <span className="ml-1.5 text-[10px] text-red-400">✕</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bulk Pricing */}
            {product.hasBulkPricing && product.bulkPricingTiers?.length > 0 && (
              <div className="mb-5 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest mb-3">Volume Discounts</p>
                <div className="space-y-1.5">
                  {product.bulkPricingTiers.map((tier) => {
                    const discountedPrice = tier.discountType === 'percentage'
                      ? effectivePrice * (1 - tier.discountValue / 100)
                      : effectivePrice - tier.discountValue
                    const isActive = currentBulkTier?.id === tier.id
                    return (
                      <div key={tier.id} className={`flex justify-between items-center text-sm py-1 px-2 rounded-lg transition-colors ${isActive ? 'bg-emerald-100' : ''}`}>
                        <span className="text-neutral-700 font-medium">{tier.minQuantity}+ {product.unit}s</span>
                        <span className="text-neutral-400 text-xs">
                          {tier.discountType === 'percentage' ? `${tier.discountValue}% off` : `₱${tier.discountValue} off`}
                        </span>
                        <span className={`font-bold ${isActive ? 'text-emerald-700' : 'text-emerald-600'}`}>
                          {formatPrice(Math.max(0, discountedPrice))}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            {isInStock && (!product.hasVariants || selectedVariant) ? (
              <div className="border-t border-neutral-100 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Quantity</p>
                  <span className="text-sm font-semibold text-primary-900">
                    = {formatPrice(displayUnitPrice * quantity)}
                    {bulkUnitPrice !== null && (
                      <span className="ml-2 text-xs text-emerald-600 font-medium">bulk</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-neutral-200 bg-neutral-50 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center text-neutral-500 hover:text-primary-800 hover:bg-neutral-100 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <MinusIcon className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editingQuantity !== null ? editingQuantity : quantity}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === '' || /^\d+$/.test(val)) setEditingQuantity(val)
                      }}
                      onFocus={(e) => {
                        setEditingQuantity(String(quantity))
                        setTimeout(() => e.target.select(), 0)
                      }}
                      onBlur={() => {
                        if (!editingQuantity || editingQuantity === '') { setEditingQuantity(null); return }
                        const parsed = parseInt(editingQuantity, 10)
                        if (isNaN(parsed) || parsed < 1) { setEditingQuantity(null); return }
                        setQuantity(Math.min(parsed, effectiveStock))
                        setEditingQuantity(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.target.blur()
                        else if (e.key === 'Escape') { setEditingQuantity(null); e.target.blur() }
                      }}
                      className="w-12 text-center text-sm font-bold text-primary-900 bg-transparent border-0 outline-none"
                      aria-label="Quantity"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(quantity + 1, effectiveStock))}
                      disabled={quantity >= effectiveStock}
                      className={`w-10 h-10 flex items-center justify-center transition-colors ${
                        quantity >= effectiveStock
                          ? 'text-neutral-300 cursor-not-allowed'
                          : 'text-neutral-500 hover:text-primary-800 hover:bg-neutral-100'
                      }`}
                      aria-label="Increase quantity"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="flex-1 flex items-center justify-center gap-2 h-10 bg-primary-900 text-white text-sm font-semibold rounded-xl hover:bg-primary-800 active:scale-[0.98] transition-all shadow-sm"
                  >
                    <CartIcon className="h-4 w-4" />
                    Add to Cart
                  </button>
                </div>

                {quantity >= effectiveStock && (
                  <p className="text-xs text-amber-600">Maximum stock selected</p>
                )}

                {cartQuantity > 0 && (
                  <p className="text-xs text-neutral-400 text-center">
                    {cartQuantity} {product.unit}(s) already in your cart
                  </p>
                )}
              </div>
            ) : product.hasVariants && !selectedVariant ? (
              <div className="border-t border-neutral-100 pt-5">
                <div className="flex items-center justify-center gap-2 p-4 bg-neutral-50 border border-dashed border-neutral-200 rounded-xl">
                  <span className="text-sm text-neutral-400">Select an option above to continue</span>
                </div>
              </div>
            ) : null}

            {/* Wishlist */}
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <button
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  isInWishlist(product.id)
                    ? 'bg-pink-50 border-pink-200 text-pink-600 hover:bg-pink-100'
                    : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-primary-800'
                }`}
              >
                {isInWishlist(product.id) ? (
                  <HeartSolidIcon className="h-4 w-4" />
                ) : (
                  <HeartIcon className="h-4 w-4" />
                )}
                {isInWishlist(product.id) ? 'Saved to Wishlist' : 'Save to Wishlist'}
              </button>
            </div>

            {/* Back */}
            <div className="mt-4 text-center">
              <Link
                to="/products"
                className="text-xs text-neutral-400 hover:text-primary-700 transition-colors"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-10"
            aria-label="Close"
          >
            <CloseIcon className="h-5 w-5" />
          </button>

          {product.images && product.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImageIndex(prev => prev === 0 ? product.images.length - 1 : prev - 1)
                }}
                className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImageIndex(prev => prev === product.images.length - 1 ? 0 : prev + 1)
                }}
                className="absolute right-5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </>
          )}

          <div
            className="max-w-4xl max-h-[85vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={product.images?.length > 0 ? product.images[selectedImageIndex]?.imageUrl : product.imageUrl}
              alt={product.images?.[selectedImageIndex]?.altText || product.name}
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
            {product.images?.length > 1 && (
              <p className="text-center text-white/40 mt-3 text-xs">
                {selectedImageIndex + 1} / {product.images.length}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
