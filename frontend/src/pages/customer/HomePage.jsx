import { useState, useEffect, useCallback } from 'react'
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

// Animated counter hook
function useCountUp(end, duration = 2000, started = false) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!started || end === 0) return

    let startTime
    let animationId
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) {
        animationId = requestAnimationFrame(animate)
      }
    }
    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [end, duration, started])

  return count
}

// Hook to detect when an element is visible in viewport
function useInView() {
  const [isInView, setIsInView] = useState(false)
  const [node, setNode] = useState(null)
  const ref = useCallback((el) => setNode(el), [])

  useEffect(() => {
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [node])

  return { ref, isInView }
}

export default function HomePage() {
  const [categories, setCategories] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalProducts: 0, deliveredOrders: 0, totalCustomers: 0 })

  const statsInView = useInView()
  const statsReady = statsInView.isInView && stats.totalProducts > 0

  const productsCount = useCountUp(stats.totalProducts, 2000, statsReady)
  const ordersCount = useCountUp(stats.deliveredOrders, 2000, statsReady)
  const customersCount = useCountUp(stats.totalCustomers, 2000, statsReady)

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
      <section className="relative overflow-hidden bg-white">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center py-16 md:py-24 lg:py-28">
            {/* Left — Copy (3 cols) */}
            <div className="lg:col-span-3 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-accent-50 border border-accent-200 rounded-full px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 bg-accent-500 rounded-full"></span>
                <span className="text-accent-700 text-xs font-semibold tracking-wide uppercase">Your Trusted Hardware Partner</span>
              </div>

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
                  className="btn btn-lg bg-primary-900 hover:bg-primary-800 text-white transition-colors duration-200"
                >
                  Browse Products
                  <span className="ml-2">→</span>
                </Link>
                <Link
                  to="/track-order"
                  className="btn btn-lg border border-neutral-300 text-primary-800 hover:bg-neutral-50 transition-colors duration-200"
                >
                  Track Your Order
                </Link>
              </div>
            </div>

            {/* Right — Stats card (2 cols, desktop) */}
            <div className="lg:col-span-2 hidden lg:block" ref={statsInView.ref}>
              <div className="bg-primary-900 rounded-2xl p-8 text-white relative overflow-hidden">
                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent-500/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative">
                  <div className="grid grid-cols-3 gap-4 text-center mb-8">
                    <div>
                      <div className="text-3xl font-bold text-white leading-none mb-1">{productsCount}+</div>
                      <div className="text-primary-400 text-xs font-medium uppercase tracking-wider">Products</div>
                    </div>
                    <div className="border-x border-white/10">
                      <div className="text-3xl font-bold text-white leading-none mb-1">{ordersCount}+</div>
                      <div className="text-primary-400 text-xs font-medium uppercase tracking-wider">Delivered</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-white leading-none mb-1">{customersCount}+</div>
                      <div className="text-primary-400 text-xs font-medium uppercase tracking-wider">Customers</div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-accent-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TruckIcon className="h-4 w-4 text-accent-400" />
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">Fast Delivery</div>
                        <div className="text-primary-400 text-xs">Free on orders over ₱2,000</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-accent-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ShieldIcon className="h-4 w-4 text-accent-400" />
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">Quality Guaranteed</div>
                        <div className="text-primary-400 text-xs">100% authentic products</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile stats strip */}
        <div className="lg:hidden bg-primary-900">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-3 divide-x divide-white/10 py-5 text-center">
              <div>
                <div className="text-xl font-bold text-white">{stats.totalProducts.toLocaleString()}+</div>
                <div className="text-primary-400 text-[11px] font-medium uppercase tracking-wider">Products</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{stats.deliveredOrders.toLocaleString()}+</div>
                <div className="text-primary-400 text-[11px] font-medium uppercase tracking-wider">Delivered</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{stats.totalCustomers.toLocaleString()}+</div>
                <div className="text-primary-400 text-[11px] font-medium uppercase tracking-wider">Customers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Bar ─── */}
      <section className="bg-neutral-50 border-y border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-neutral-200">
            {[
              { icon: TruckIcon, title: 'Free Delivery', desc: 'On orders over ₱2,000' },
              { icon: ShieldIcon, title: 'Quality Guaranteed', desc: '100% authentic products' },
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
                className="group relative bg-neutral-50 hover:bg-white border border-neutral-100 hover:border-neutral-200 rounded-2xl p-5 transition-all duration-200 hover:shadow-soft"
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
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-accent-500 text-white rounded-full flex items-center justify-center text-xs font-bold z-20 shadow-sm">
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

      {/* ─── CTA ─── */}
      <section className="bg-primary-900 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-accent-500/5 rounded-full -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-accent-500/5 rounded-full translate-y-1/2"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="py-16 md:py-20 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Ready to Start Your Project?</h2>
            <p className="text-primary-300 mb-8 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
              Browse our complete catalog of construction materials, plumbing supplies, and professional tools.
              Cash on delivery available.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/products"
                className="btn btn-lg bg-accent-500 hover:bg-accent-600 text-white transition-colors duration-200 inline-flex items-center gap-2"
              >
                Start Shopping <span>→</span>
              </Link>
              <Link
                to="/track-order"
                className="btn btn-lg border border-white/20 text-white hover:bg-white/10 transition-colors duration-200"
              >
                Track an Order
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
