import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { categoryApi, productApi } from '../../services/api'
import ProductCard from '../../components/ProductCard'

export default function HomePage() {
  const [categories, setCategories] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          categoryApi.getAll(),
          productApi.getAll({ limit: 8 }),
        ])
        setCategories(categoriesRes.data.data)
        setFeaturedProducts(productsRes.data.data)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="animate-fade-in">
        {/* Hero Skeleton */}
        <section className="bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="h-12 bg-white/20 rounded-lg w-3/4 mx-auto mb-6 animate-pulse"></div>
            <div className="h-6 bg-white/10 rounded w-2/3 mx-auto mb-10 animate-pulse"></div>
            <div className="flex justify-center gap-4">
              <div className="h-12 w-40 bg-white/20 rounded-lg animate-pulse"></div>
              <div className="h-12 w-40 bg-white/10 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </section>
        {/* Categories Skeleton */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-8 bg-neutral-200 rounded w-48 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-neutral-100 rounded w-64 mx-auto mb-10 animate-pulse"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-soft animate-pulse">
                  <div className="h-10 w-10 bg-neutral-200 rounded-full mx-auto mb-3"></div>
                  <div className="h-4 bg-neutral-200 rounded w-3/4 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 text-white py-20 md:py-32 relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Quality Hardware & Tools
          </h1>
          <p className="text-lg md:text-xl text-primary-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            Order construction materials, plumbing supplies, and tools online.
            Fast delivery to your doorstep!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products" className="btn btn-lg bg-white text-primary-800 hover:bg-neutral-100 shadow-lg hover:shadow-xl transition-all">
              Browse Products
            </Link>
            <Link to="/track-order" className="btn btn-lg border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm">
              Track Your Order
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3 text-primary-900">
            Shop by Category
          </h2>
          <p className="text-neutral-500 text-center mb-10">Find exactly what you need for your project</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="card-hover p-6 text-center group"
              >
                <span className="text-4xl mb-3 block group-hover:scale-110 transition-transform duration-300">{category.icon || '📦'}</span>
                <h3 className="font-semibold text-primary-800">{category.name}</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  {category._count?.products || 0} products
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24 bg-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-primary-900">Featured Products</h2>
              <p className="text-neutral-500 mt-1">Our most popular items</p>
            </div>
            <Link to="/products" className="text-accent-600 hover:text-accent-700 font-medium flex items-center gap-1 transition-colors">
              View All <span>→</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3 text-primary-900">
            How to Order
          </h2>
          <p className="text-neutral-500 text-center mb-12">Simple steps to get your materials</p>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Browse Products', desc: 'Find what you need from our catalog', icon: '🔍' },
              { step: 2, title: 'Add to Cart', desc: 'Select quantities and add to cart', icon: '🛒' },
              { step: 3, title: 'Checkout', desc: 'Enter your delivery details', icon: '📝' },
              { step: 4, title: 'Receive Order', desc: 'We deliver to your doorstep', icon: '🚚' },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className="w-16 h-16 bg-accent-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 group-hover:bg-accent-200 transition-colors duration-300">
                  {item.icon}
                </div>
                <div className="text-xs text-accent-600 font-semibold mb-1 uppercase tracking-wider">Step {item.step}</div>
                <h3 className="font-semibold text-lg mb-2 text-primary-800">{item.title}</h3>
                <p className="text-neutral-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-800 to-primary-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Order?
          </h2>
          <p className="text-primary-200 mb-8">
            We deliver to your area! Cash on delivery available.
          </p>
          <Link to="/products" className="btn-accent btn-lg shadow-lg hover:shadow-xl transition-all">
            Start Shopping
          </Link>
        </div>
      </section>
    </div>
  )
}
