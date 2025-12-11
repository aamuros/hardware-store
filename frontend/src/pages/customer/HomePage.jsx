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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Quality Hardware & Tools
          </h1>
          <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Order construction materials, plumbing supplies, and tools online. 
            Fast delivery to your doorstep!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products" className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100">
              Browse Products
            </Link>
            <Link to="/track-order" className="btn btn-lg border-2 border-white text-white hover:bg-white hover:text-primary-600">
              Track Your Order
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="card p-6 text-center hover:shadow-md transition-shadow"
              >
                <span className="text-4xl mb-3 block">{category.icon || '📦'}</span>
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {category._count?.products || 0} products
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 md:py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Featured Products</h2>
            <Link to="/products" className="text-primary-600 hover:text-primary-700 font-medium">
              View All →
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
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            How to Order
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Browse Products', desc: 'Find what you need from our catalog', icon: '🔍' },
              { step: 2, title: 'Add to Cart', desc: 'Select quantities and add to cart', icon: '🛒' },
              { step: 3, title: 'Checkout', desc: 'Enter your delivery details', icon: '📝' },
              { step: 4, title: 'Receive Order', desc: 'We deliver to your doorstep', icon: '🚚' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="text-sm text-primary-600 font-semibold mb-1">Step {item.step}</div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Order?
          </h2>
          <p className="text-gray-300 mb-8">
            We deliver to your area! Cash on delivery available.
          </p>
          <Link to="/products" className="btn-primary btn-lg">
            Start Shopping
          </Link>
        </div>
      </section>
    </div>
  )
}
