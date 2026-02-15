import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { categoryApi, productApi, statsApi } from '../../services/api'
import ProductCard from '../../components/ProductCard'
import {
  TruckIcon,
  ShieldIcon,
  CashIcon,
  PhoneIcon,
  SearchIcon,
  CartIcon,
  CheckIcon,
  CategoryIcon,
  BoxIcon
} from '../../components/icons'

export default function HomePage() {
  const [categories, setCategories] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalProducts: 0, deliveredOrders: 0, totalCustomers: 0 })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, productsRes, statsRes] = await Promise.all([
          categoryApi.getAll(),
          productApi.getAll({ limit: 24, available: true }),
          statsApi.getPublicStats().catch(() => ({ data: { data: {} } })),
        ])

        if (statsRes.data?.data) {
          setStats(statsRes.data.data)
        }
        setCategories(categoriesRes.data.data)

        const allProducts = productsRes.data.data
        const inStock = allProducts.filter(p => p.hasVariants || (p.stockQuantity ?? 0) > 0)
        const featured = []
        const usedCategories = new Set()

        for (const product of inStock) {
          if (featured.length >= 8) break
          const catId = product.categoryId || product.category?.id
          if (!usedCategories.has(catId)) {
            featured.push(product)
            usedCategories.add(catId)
          }
        }

        const remaining = inStock
          .filter(p => !featured.includes(p))
          .sort((a, b) => (b.stockQuantity ?? 0) - (a.stockQuantity ?? 0))
        for (const product of remaining) {
          if (featured.length >= 8) break
          featured.push(product)
        }

        setFeaturedProducts(featured.length > 0 ? featured : allProducts.slice(0, 8))
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
      <div>
        {/* Hero Skeleton */}
        <section className="bg-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto text-center lg:text-left lg:mx-0">
              <div className="h-4 bg-neutral-100 rounded w-40 mb-6 mx-auto lg:mx-0 animate-pulse"></div>
              <div className="h-12 bg-neutral-100 rounded-lg w-full mb-3 animate-pulse"></div>
              <div className="h-12 bg-neutral-100 rounded-lg w-3/4 mb-6 mx-auto lg:mx-0 animate-pulse"></div>
              <div className="h-5 bg-neutral-50 rounded w-full mb-2 animate-pulse"></div>
              <div className="h-5 bg-neutral-50 rounded w-2/3 mb-8 mx-auto lg:mx-0 animate-pulse"></div>
              <div className="flex gap-3 justify-center lg:justify-start">
                <div className="h-12 w-44 bg-neutral-100 rounded-xl animate-pulse"></div>
                <div className="h-12 w-40 bg-neutral-50 rounded-xl animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>
        {/* Products Skeleton */}
        <section className="py-14 md:py-20 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-7 bg-neutral-200 rounded w-44 mb-2 animate-pulse"></div>
            <div className="h-4 bg-neutral-100 rounded w-56 mb-10 animate-pulse"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-neutral-100">
                  <div className="aspect-square bg-neutral-100 animate-pulse"></div>
                  <div className="p-4">
                    <div className="h-3 bg-neutral-100 rounded w-16 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-neutral-100 rounded w-full mb-3 animate-pulse"></div>
                    <div className="h-5 bg-neutral-200 rounded w-20 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div>
      {/* ─── Hero Section ─── */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-16 md:py-24 lg:py-28 max-w-3xl mx-auto text-center lg:text-left lg:mx-0 lg:max-w-2xl">
              <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-extrabold tracking-tight leading-[1.1] text-primary-900 mb-5">
                Quality Hardware{' '}
                <span className="text-accent-500">&amp;</span>
                <br className="hidden sm:block" />
                {' '}Building Materials
              </h1>

              <p className="text-neutral-500 text-base md:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8">
                From construction materials to plumbing supplies and professional tools —
                get everything you need delivered to your doorstep.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  to="/products"
                  className="btn btn-lg bg-primary-900 hover:bg-primary-800 text-white transition-colors"
                >
                  Browse Products
                  <span className="ml-2">→</span>
                </Link>
                <Link
                  to="/track-order"
                  className="btn btn-lg border border-neutral-300 text-primary-800 hover:bg-neutral-50 transition-colors"
                >
                  Track Your Order
                </Link>
              </div>

              {/* Inline stats */}
              <div className="flex items-center gap-8 mt-10 justify-center lg:justify-start text-sm">
                <div>
                  <span className="text-2xl font-bold text-primary-900">{stats.totalProducts.toLocaleString()}+</span>
                  <span className="text-neutral-400 ml-1.5">Products</span>
                </div>
                <div className="w-px h-6 bg-neutral-200"></div>
                <div>
                  <span className="text-2xl font-bold text-primary-900">{stats.deliveredOrders.toLocaleString()}+</span>
                  <span className="text-neutral-400 ml-1.5">Delivered</span>
                </div>
                <div className="w-px h-6 bg-neutral-200"></div>
                <div>
                  <span className="text-2xl font-bold text-primary-900">{stats.totalCustomers.toLocaleString()}+</span>
                  <span className="text-neutral-400 ml-1.5">Customers</span>
                </div>
              </div>
          </div>
        </div>
      </section>

      {/* ─── Value Props ─── */}
      <section className="bg-neutral-50 border-y border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-neutral-200">
            {[
              { icon: TruckIcon, title: 'Free Delivery', desc: 'On orders over ₱2,000' },
              { icon: ShieldIcon, title: '100% Authentic', desc: 'Quality guaranteed' },
              { icon: CashIcon, title: 'Cash on Delivery', desc: 'Pay when you receive' },
              { icon: PhoneIcon, title: 'SMS Updates', desc: 'Real-time order tracking' },
            ].map((badge, idx) => (
              <div key={idx} className="flex items-center gap-3 py-5 md:px-6 first:pl-0 last:pr-0">
                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-neutral-200">
                  <badge.icon className="h-5 w-5 text-primary-700" />
                </div>
                <div>
                  <div className="font-semibold text-primary-900 text-sm leading-tight">{badge.title}</div>
                  <div className="text-neutral-500 text-xs mt-0.5">{badge.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Shop by Category ─── */}
      <section className="py-14 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-primary-900">Shop by Category</h2>
              <p className="text-neutral-500 text-sm mt-1">Find exactly what you need for your project</p>
            </div>
            <Link
              to="/products"
              className="hidden sm:flex text-sm text-primary-600 hover:text-primary-900 font-medium items-center gap-1.5 transition-colors"
            >
              All Categories <span>→</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="group relative bg-neutral-50 hover:bg-white border border-neutral-100 hover:border-neutral-200 rounded-2xl p-5 transition-colors duration-200 hover:shadow-soft"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-primary-700 border border-neutral-200 group-hover:border-accent-300 group-hover:text-accent-600 transition-colors flex-shrink-0">
                    <CategoryIcon category={category} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="font-semibold text-primary-800 text-sm leading-tight truncate group-hover:text-primary-900">{category.name}</h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      {category._count?.products || 0} items
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Products ─── */}
      <section className="py-14 md:py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-primary-900">Featured Products</h2>
              <p className="text-neutral-500 text-sm mt-1">Our most popular items</p>
            </div>
            <Link
              to="/products"
              className="text-sm text-primary-600 hover:text-primary-900 font-medium flex items-center gap-1.5 transition-colors"
            >
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

      {/* ─── How to Order ─── */}
      <section className="py-14 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-2">How It Works</h2>
            <p className="text-neutral-500 text-sm max-w-md mx-auto">Order your building materials in four simple steps</p>
          </div>
          <div className="relative max-w-4xl mx-auto">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-neutral-200"></div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
              {[
                { step: 1, title: 'Browse', desc: 'Explore our full catalog of hardware & materials', Icon: SearchIcon },
                { step: 2, title: 'Add to Cart', desc: 'Select items and quantities you need', Icon: CartIcon },
                { step: 3, title: 'Checkout', desc: 'Enter your delivery address & details', Icon: BoxIcon },
                { step: 4, title: 'Receive', desc: 'Get it delivered — pay on arrival', Icon: CheckIcon },
              ].map((item) => (
                <div key={item.step} className="text-center relative">
                  <div className="relative inline-flex mb-4">
                    <div className="w-16 h-16 bg-neutral-50 border-2 border-neutral-200 rounded-2xl flex items-center justify-center relative z-10 bg-white">
                      <item.Icon className="h-7 w-7 text-primary-700" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-accent-500 text-white rounded-full flex items-center justify-center text-xs font-bold z-20">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-semibold text-primary-900 mb-1">{item.title}</h3>
                  <p className="text-neutral-500 text-xs leading-relaxed max-w-[180px] mx-auto">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
