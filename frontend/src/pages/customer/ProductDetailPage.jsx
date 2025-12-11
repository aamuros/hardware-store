import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MinusIcon, PlusIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { productApi } from '../../services/api'
import { useCart } from '../../context/CartContext'
import toast from 'react-hot-toast'

export default function ProductDetailPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const { addToCart, getItemQuantity } = useCart()

  const cartQuantity = product ? getItemQuantity(product.id) : 0

  useEffect(() => {
    fetchProduct()
  }, [id])

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
    addToCart(product, quantity)
    toast.success(`${quantity} ${product.unit}(s) of ${product.name} added to cart!`)
    setQuantity(1)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
        <Link to="/products" className="text-primary-600 hover:text-primary-700">
          ← Back to Products
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center space-x-2 text-sm">
          <li><Link to="/" className="text-gray-500 hover:text-gray-700">Home</Link></li>
          <li className="text-gray-400">/</li>
          <li><Link to="/products" className="text-gray-500 hover:text-gray-700">Products</Link></li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium truncate">{product.name}</li>
        </ol>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <div className="mb-4">
            <span className="inline-block bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
              {product.category?.name}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          
          {product.sku && (
            <p className="text-sm text-gray-500 mb-4">SKU: {product.sku}</p>
          )}

          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-3xl font-bold text-primary-600">
              {formatPrice(product.price)}
            </span>
            <span className="text-gray-500">per {product.unit}</span>
          </div>

          {product.description && (
            <p className="text-gray-600 mb-6">{product.description}</p>
          )}

          {/* Availability */}
          <div className="mb-6">
            {product.isAvailable ? (
              <span className="inline-flex items-center text-green-600">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                In Stock
              </span>
            ) : (
              <span className="inline-flex items-center text-red-600">
                <span className="h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                Out of Stock
              </span>
            )}
          </div>

          {product.isAvailable && (
            <>
              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="label">Quantity</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-gray-100 transition-colors"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center border-0 focus:ring-0"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-3 hover:bg-gray-100 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-gray-600">
                    = {formatPrice(product.price * quantity)}
                  </span>
                </div>
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
                <p className="text-center text-sm text-gray-500 mt-3">
                  You have {cartQuantity} {product.unit}(s) in your cart
                </p>
              )}
            </>
          )}

          {/* Back Link */}
          <Link
            to="/products"
            className="block text-center mt-6 text-gray-600 hover:text-primary-600"
          >
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
