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

import { useCountUp } from '../../hooks/useCountUp'

export default function HomePage() {
  const [categories, setCategories] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalProducts: 0, deliveredOrders: 0, totalCustomers: 0 })

  // Animation values
  const animatedProducts = useCountUp(stats.totalProducts, 2000, !loading && stats.totalProducts > 0)
  const animatedDelivered = useCountUp(stats.deliveredOrders, 2000, !loading && stats.deliveredOrders > 0)
  const animatedCustomers = useCountUp(stats.totalCustomers, 2000, !loading && stats.totalCustomers > 0)

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
        {/* Hero Skeleton - Updated layout hint */}
        <section className="bg-white py-16 md:py-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              <div className="flex-1 text-center lg:text-left">
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
              <div className="w-full lg:w-1/3">
                <div className="aspect-[4/3] bg-neutral-50 rounded-3xl animate-pulse"></div>
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
      <section className="bg-white relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-accent-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="py-16 md:py-24 lg:py-28 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            {/* Left Column: Text Content */}
            <div className="flex-1 text-center lg:text-left z-10">
              <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-extrabold tracking-tight leading-[1.1] text-primary-900 mb-6">
                Quality Hardware{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-500 to-accent-600">&amp;</span>
                <br className="hidden sm:block" />
                {' '}Building Materials
              </h1>

              <p className="text-neutral-600 text-lg md:text-xl leading-relaxed max-w-lg mx-auto lg:mx-0 mb-10">
                From construction materials to plumbing supplies and professional tools —
                get everything you need delivered to your doorstep.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/products"
                  className="btn btn-lg bg-primary-900 hover:bg-primary-800 text-white shadow-lg shadow-primary-900/20 hover:shadow-xl hover:shadow-primary-900/30 hover:-translate-y-1 transition-all duration-300"
                >
                  Browse Products
                  <span className="ml-2">→</span>
                </Link>
                <Link
                  to="/track-order"
                  className="btn btn-lg bg-white border border-neutral-200 text-primary-800 hover:bg-neutral-50 hover:border-neutral-300 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  Track Your Order
                </Link>
              </div>
            </div>

            {/* Right Column: Stats & Visuals */}
            <div className="w-full lg:w-[420px] xl:w-[480px] z-10">
              <div className="relative">
                {/* Stats Card */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8 sm:p-10 relative overflow-hidden group hover:shadow-soft-lg transition-shadow duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-white via-white/50 to-neutral-100/50 opacity-100"></div>

                  {/* Decorative glass reflection */}
                  <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-40 group-hover:animate-shine" />

                  <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 shadow-inner">
                        <CategoryIcon category={{ name: 'Products' }} className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="text-4xl font-extrabold text-primary-900 tracking-tight">
                          {animatedProducts.toLocaleString()}+
                        </div>
                        <div className="text-neutral-500 font-medium">Quality Products</div>
                      </div>
                    </div>

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent"></div>

                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-accent-50 flex items-center justify-center text-accent-600 shadow-inner">
                        <CheckIcon className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="text-4xl font-extrabold text-primary-900 tracking-tight">
                          {animatedDelivered.toLocaleString()}+
                        </div>
                        <div className="text-neutral-500 font-medium">Orders Delivered</div>
                      </div>
                    </div>

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent"></div>

                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                        <ShieldIcon className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="text-4xl font-extrabold text-primary-900 tracking-tight">
                          {animatedCustomers.toLocaleString()}+
                        </div>
                        <div className="text-neutral-500 font-medium">Happy Customers</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating elements behind card */}
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent-400/10 rounded-full blur-2xl -z-10 animate-pulse"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary-400/10 rounded-full blur-2xl -z-10 animate-pulse delay-700"></div>
              </div>
            </div>

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
