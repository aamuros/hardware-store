import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import { categoryApi, productApi } from '../../services/api'
import ProductCard from '../../components/ProductCard'
import {
  TruckIcon,
  ShieldIcon,
  CashIcon,
  PhoneIcon,
  SparklesIcon,
  SearchIcon,
  CartIcon,
  CheckIcon,
  CategoryIcon,
  QualityIcon,
  FastDeliveryIcon,
  SelectionIcon,
  EasyOrderIcon,
  BoxIcon
} from '../../components/icons'

// Animated counter hook
function useCountUp(end, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(!startOnView)
  const ref = useRef(null)

  useEffect(() => {
    if (!startOnView) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [startOnView, hasStarted])

  useEffect(() => {
    if (!hasStarted) return

    let startTime
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }, [end, duration, hasStarted])

  return { count, ref }
}

export default function HomePage() {
  const [categories, setCategories] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Animated stats
  const productsCount = useCountUp(500, 2000)
  const ordersCount = useCountUp(1200, 2000)
  const customersCount = useCountUp(850, 2000)

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
      {/* Hero Section - Enhanced */}
      <section className="bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 text-white py-20 md:py-28 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-accent-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6">
                <SparklesIcon className="h-4 w-4 text-accent-400" />
                <span className="text-primary-200">Your Trusted Hardware Partner</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-tight">
                Quality Hardware
                <span className="block text-accent-400">&amp; Building Materials</span>
              </h1>

              <p className="text-lg md:text-xl text-primary-200 mb-8 max-w-xl leading-relaxed">
                From construction materials to plumbing supplies and professional tools.
                Get everything you need delivered to your doorstep.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/products"
                  className="btn btn-lg bg-accent-500 hover:bg-accent-600 text-white shadow-lg hover:shadow-xl transition-all group"
                >
                  Browse Products
                  <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
                <Link
                  to="/track-order"
                  className="btn btn-lg border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                >
                  Track Your Order
                </Link>
              </div>
            </div>

            {/* Right Content - Stats */}
            <div className="hidden lg:block">
              <div
                ref={productsCount.ref}
                className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20"
              >
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-4xl font-bold text-white mb-1">{productsCount.count}+</div>
                    <div className="text-primary-300 text-sm">Products</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-white mb-1">{ordersCount.count}+</div>
                    <div className="text-primary-300 text-sm">Orders Delivered</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-white mb-1">{customersCount.count}+</div>
                    <div className="text-primary-300 text-sm">Happy Customers</div>
                  </div>
                </div>

                {/* Mini Feature Icons */}
                <div className="flex justify-center gap-8 mt-8 pt-6 border-t border-white/20">
                  <div className="flex items-center gap-2 text-primary-200 text-sm">
                    <TruckIcon className="h-5 w-5 text-accent-400" />
                    Fast Delivery
                  </div>
                  <div className="flex items-center gap-2 text-primary-200 text-sm">
                    <ShieldIcon className="h-5 w-5 text-accent-400" />
                    Quality Guaranteed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges - Mobile Stats */}
      <section className="bg-white border-b border-neutral-200 py-6 lg:hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-800">500+</div>
              <div className="text-neutral-500 text-xs">Products</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-800">1200+</div>
              <div className="text-neutral-500 text-xs">Orders</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-800">850+</div>
              <div className="text-neutral-500 text-xs">Customers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-neutral-50 py-8 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: TruckIcon, title: 'Free Delivery', desc: 'On orders over ₱2,000' },
              { icon: ShieldIcon, title: 'Quality Guaranteed', desc: '100% authentic products' },
              { icon: CashIcon, title: 'Cash on Delivery', desc: 'Pay when you receive' },
              { icon: PhoneIcon, title: 'SMS Updates', desc: 'Real-time order tracking' },
            ].map((badge, idx) => (
              <div key={idx} className="flex items-center gap-3 group">
                <div className="flex-shrink-0 w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center group-hover:bg-accent-200 transition-colors">
                  <badge.icon className="h-6 w-6 text-accent-600" />
                </div>
                <div>
                  <div className="font-semibold text-primary-800 text-sm">{badge.title}</div>
                  <div className="text-neutral-500 text-xs">{badge.desc}</div>
                </div>
              </div>
            ))}
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
                <div className="w-14 h-14 bg-gradient-to-br from-accent-100 to-accent-200 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 text-accent-600">
                  <CategoryIcon category={category} className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-primary-800">{category.name}</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  {category._count?.products || 0} products
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-neutral-100 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-3">
              Why Choose Us?
            </h2>
            <p className="text-neutral-500 max-w-2xl mx-auto">
              We&apos;re committed to providing the best hardware shopping experience in the Philippines
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: QualityIcon,
                title: 'Professional Quality',
                desc: 'We stock only trusted brands and professional-grade tools that contractors and DIY enthusiasts rely on.',
                color: 'bg-gradient-to-br from-blue-500 to-blue-600',
                iconBg: 'bg-blue-400/20'
              },
              {
                icon: FastDeliveryIcon,
                title: 'Fast & Reliable Delivery',
                desc: 'Same-day delivery available in Metro Manila. Track your order in real-time via SMS notifications.',
                color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
                iconBg: 'bg-emerald-400/20'
              },
              {
                icon: SelectionIcon,
                title: 'Wide Selection',
                desc: 'From small screws to large construction materials — find everything you need in one place.',
                color: 'bg-gradient-to-br from-violet-500 to-violet-600',
                iconBg: 'bg-violet-400/20'
              },
              {
                icon: EasyOrderIcon,
                title: 'Hassle-Free Ordering',
                desc: "No account needed! Just add to cart, checkout, and pay on delivery. It's that simple.",
                color: 'bg-gradient-to-br from-amber-500 to-amber-600',
                iconBg: 'bg-amber-400/20'
              },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-soft-lg transition-all hover:-translate-y-1 group">
                <div className={`${feature.color} w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-semibold text-lg text-primary-800 mb-2">{feature.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24">
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
      <section className="py-16 md:py-24 bg-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3 text-primary-900">
            How to Order
          </h2>
          <p className="text-neutral-500 text-center mb-12">Simple steps to get your materials</p>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Browse Products', desc: 'Find what you need from our catalog', Icon: SearchIcon },
              { step: 2, title: 'Add to Cart', desc: 'Select quantities and add to cart', Icon: CartIcon },
              { step: 3, title: 'Checkout', desc: 'Enter your delivery details', Icon: BoxIcon },
              { step: 4, title: 'Receive Order', desc: 'We deliver to your doorstep', Icon: CheckIcon },
            ].map((item, idx) => (
              <div key={item.step} className="text-center group relative">
                {/* Connector Line */}
                {idx < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-accent-200"></div>
                )}
                <div className="relative">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-soft group-hover:shadow-soft-lg transition-all duration-300 group-hover:-translate-y-1">
                    <item.Icon className="h-7 w-7 text-primary-700" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-2 text-primary-800">{item.title}</h3>
                <p className="text-neutral-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-accent-500 to-accent-600 text-white py-16 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-2xl md:text-4xl font-bold mb-4">
            Ready to Start Your Project?
          </h2>
          <p className="text-accent-100 mb-8 text-lg max-w-xl mx-auto">
            Browse our complete catalog and get your materials delivered today.
            Cash on delivery available!
          </p>
          <Link
            to="/products"
            className="btn btn-lg bg-white text-accent-600 hover:bg-neutral-100 shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
          >
            Start Shopping
            <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
