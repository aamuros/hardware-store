import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { useCart } from '../../context/CartContext'
import { customerApi } from '../../services/api'
import toast from 'react-hot-toast'
import {
    HeartIcon,
    ArrowLeftIcon,
    ShoppingCartIcon,
    TrashIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

export default function WishlistPage() {
    const { removeFromWishlist } = useCustomerAuth()
    const { addToCart } = useCart()
    const [wishlistItems, setWishlistItems] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadWishlist()
    }, [])

    const loadWishlist = async () => {
        setLoading(true)
        try {
            const response = await customerApi.getWishlist()
            setWishlistItems(response.data.data)
        } catch (error) {
            console.error('Failed to load wishlist:', error)
            toast.error('Failed to load wishlist')
        } finally {
            setLoading(false)
        }
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(price)
    }

    const handleRemove = async (productId) => {
        const result = await removeFromWishlist(productId)
        if (result.success) {
            setWishlistItems(prev => prev.filter(item => item.productId !== productId))
            toast.success('Removed from wishlist')
        } else {
            toast.error(result.message)
        }
    }

    const handleAddToCart = (product) => {
        addToCart(product)
        toast.success('Added to cart')
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-neutral-100 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/account" className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                    <ArrowLeftIcon className="w-5 h-5 text-neutral-600" />
                </Link>
                <h1 className="text-3xl font-bold text-primary-900">My Wishlist</h1>
            </div>

            {wishlistItems.length === 0 ? (
                <div className="card p-12 text-center">
                    <HeartIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-primary-900 mb-2">Your wishlist is empty</h2>
                    <p className="text-neutral-600 mb-6">Save items you love for later</p>
                    <Link to="/products" className="btn-primary">
                        Browse Products
                    </Link>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlistItems.map((item) => (
                        <div key={item.id} className="card overflow-hidden group">
                            {/* Product Image */}
                            <Link to={`/products/${item.product.id}`} className="block relative aspect-square bg-neutral-100">
                                {item.product.imageUrl ? (
                                    <img
                                        src={item.product.imageUrl}
                                        alt={item.product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                        No Image
                                    </div>
                                )}

                                {/* Remove Button */}
                                <button
                                    onClick={() => handleRemove(item.productId)}
                                    className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-red-50 rounded-full shadow-md transition-colors"
                                >
                                    <HeartSolidIcon className="w-5 h-5 text-pink-500" />
                                </button>

                                {/* Availability Badge */}
                                {!item.product.isAvailable && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <span className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
                                            Unavailable
                                        </span>
                                    </div>
                                )}
                            </Link>

                            {/* Product Info */}
                            <div className="p-4">
                                <Link to={`/products/${item.product.id}`}>
                                    <h3 className="font-bold text-primary-900 group-hover:text-accent-600 transition-colors line-clamp-2">
                                        {item.product.name}
                                    </h3>
                                </Link>
                                <p className="text-sm text-neutral-500 mt-1">
                                    {item.product.category?.name}
                                </p>
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-lg font-bold text-primary-800">
                                        {formatPrice(item.product.price)}
                                    </span>
                                    <span className="text-sm text-neutral-500">
                                        per {item.product.unit}
                                    </span>
                                </div>

                                {/* Add to Cart Button */}
                                <button
                                    onClick={() => handleAddToCart(item.product)}
                                    disabled={!item.product.isAvailable}
                                    className="btn-primary w-full mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ShoppingCartIcon className="w-5 h-5" />
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
