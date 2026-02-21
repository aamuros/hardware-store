import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { adminApi, getImageUrl } from '../../services/api'
import {
  ShoppingBagIcon,
  CubeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const statusColors = {
  pending: 'badge-pending',
  accepted: 'badge-accepted',
  preparing: 'badge-preparing',
  out_for_delivery: 'badge-delivery',
  delivered: 'badge-completed',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
  rejected: 'badge-cancelled',
}

// --- UI helpers ---

// Skeleton shimmer block
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-neutral-200 rounded-xl ${className}`} />
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  )
}

// Mini stock progress bar — colors relative to each product's threshold
function StockBar({ current, threshold }) {
  const ratio = threshold > 0 ? current / threshold : 0
  const pct = Math.min(ratio * 100, 100)
  const color =
    ratio <= 0.25 ? 'bg-red-500' : ratio <= 0.5 ? 'bg-amber-500' : 'bg-amber-400'
  return (
    <div className="mt-1.5 h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// Section label with left accent bar
function SectionLabel({ children, noMargin = false }) {
  return (
    <div className={`flex items-center gap-2 ${noMargin ? '' : 'mb-3'}`}>
      <div className="w-1 h-4 bg-accent-500 rounded-full shrink-0" />
      <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">{children}</h2>
    </div>
  )
}

// Chart colors for order status
const CHART_COLORS = {
  pending: '#F59E0B',
  accepted: '#3B82F6',
  preparing: '#8B5CF6',
  out_for_delivery: '#6366F1',
  delivered: '#10B981',
  completed: '#10B981',
  cancelled: '#EF4444',
  rejected: '#EF4444',
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [salesReport, setSalesReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      setError(null)
      const [dashboardRes, lowStockRes, salesRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getLowStockProducts(),
        adminApi.getSalesReport({ days: 7 }),
      ])
      const { stats: dashStats, recentOrders: orders } = dashboardRes.data.data
      setStats(dashStats)
      setRecentOrders(orders)
      setLowStockProducts(lowStockRes.data.data || [])
      setSalesReport(salesRes.data.data || null)
      setLastUpdated(new Date())
    } catch (err) {
      // On refresh, keep existing data visible and only log the error
      if (!isRefresh) {
        setError('Failed to load dashboard data')
      }
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Get order status data from server-side report
  const getOrderStatusData = () => {
    if (!salesReport?.ordersByStatus?.length) return []
    return salesReport.ordersByStatus.map((item) => ({
      name: item.status.replace(/_/g, ' '),
      value: item._count,
      color: CHART_COLORS[item.status] || '#94A3B8',
    }))
  }

  // Get revenue data from server-side daily breakdown
  const getRevenueData = () => {
    if (!salesReport?.dailyData?.length) return []
    return salesReport.dailyData.map((day) => {
      const [y, m, d] = day.date.split('-').map(Number)
      const localDate = new Date(y, m - 1, d)
      const formattedDate = localDate.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
      return {
        date: formattedDate,
        fullDate: formattedDate,
        rawDate: day.date,
        revenue: day.completedRevenue ?? day.revenue,
        totalRevenue: day.revenue,
        orders: day.orders,
      }
    })
  }

  // --- Skeleton loading state ---
  if (loading) {
    return (
      <div className="space-y-7 animate-fade-in">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="animate-pulse bg-neutral-200 rounded-xl h-7 w-40" />
            <div className="animate-pulse bg-neutral-200 rounded-xl h-4 w-56" />
          </div>
          <div className="animate-pulse bg-neutral-200 rounded-xl h-9 w-24" />
        </div>
        {[0, 1].map((section) => (
          <div key={section}>
            <div className="animate-pulse bg-neutral-200 rounded-xl h-4 w-32 mb-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
            </div>
          </div>
        ))}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
            <div className="animate-pulse bg-neutral-200 rounded-xl h-5 w-40 mb-2" />
            <div className="animate-pulse bg-neutral-200 rounded-xl h-3 w-56 mb-6" />
            <div className="animate-pulse bg-neutral-200 rounded-xl h-64 w-full" />
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
            <div className="animate-pulse bg-neutral-200 rounded-xl h-5 w-32 mb-2" />
            <div className="animate-pulse bg-neutral-200 rounded-xl h-3 w-44 mb-6" />
            <div className="animate-pulse bg-neutral-200 h-44 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
        {error}
      </div>
    )
  }

  const todayStatCards = [
    {
      name: "Today's Orders",
      value: stats?.todayOrders || 0,
      icon: ShoppingBagIcon,
      color: 'bg-blue-500',
      accentBorder: 'border-t-blue-500',
      trend: stats?.todayOrders > 0 ? 'Active today' : 'No orders yet',
      trendUp: stats?.todayOrders > 0,
    },
    {
      name: 'Pending Orders',
      value: stats?.pendingOrders || 0,
      icon: ClockIcon,
      color: 'bg-amber-500',
      accentBorder: 'border-t-amber-500',
      trend: stats?.pendingOrders > 5 ? 'Needs attention' : 'On track',
      trendUp: stats?.pendingOrders <= 5,
    },
    {
      name: "Today's Revenue",
      value: `₱${(stats?.todayRevenue || 0).toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'bg-emerald-500',
      accentBorder: 'border-t-emerald-500',
      trend: 'Completed orders only',
      trendUp: (stats?.todayRevenue || 0) > 0,
    },
    {
      name: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: CubeIcon,
      color: 'bg-violet-500',
      accentBorder: 'border-t-violet-500',
      trend: `${lowStockProducts.length} low stock`,
      trendUp: lowStockProducts.length === 0,
    },
  ]

  const weeklyGrowth = salesReport?.growth
  const weeklySummaryCards = [
    {
      name: 'Weekly Revenue',
      value: `₱${(salesReport?.completedRevenue || 0).toLocaleString()}`,
      icon: CurrencyDollarIcon,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trend: weeklyGrowth ? `${weeklyGrowth.revenue >= 0 ? '+' : ''}${weeklyGrowth.revenue}% vs prev week` : 'No data',
      trendUp: weeklyGrowth ? weeklyGrowth.revenue >= 0 : true,
    },
    {
      name: 'Weekly Orders',
      value: salesReport?.totalOrders || 0,
      icon: ShoppingBagIcon,
      bgColor: 'bg-violet-50',
      iconColor: 'text-violet-600',
      trend: weeklyGrowth ? `${weeklyGrowth.orders >= 0 ? '+' : ''}${weeklyGrowth.orders}% vs prev week` : 'No data',
      trendUp: weeklyGrowth ? weeklyGrowth.orders >= 0 : true,
    },
    {
      name: 'Completed',
      value: salesReport?.completedOrders || 0,
      icon: ArrowTrendingUpIcon,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      trend: salesReport?.totalOrders > 0
        ? `${((salesReport.completedOrders / salesReport.totalOrders) * 100).toFixed(0)}% completion`
        : 'No data',
      trendUp: true,
    },
    {
      name: 'Avg Order Value',
      value: `₱${(salesReport?.averageOrderValue || 0).toLocaleString()}`,
      icon: CurrencyDollarIcon,
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      trend: salesReport?.totalOrders > 0 ? `${salesReport.totalOrders} orders` : 'No data',
      trendUp: true,
    },
  ]

  const orderStatusData = getOrderStatusData()
  const revenueData = getRevenueData()

  const formattedDate = new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle mt-0.5">{formattedDate}</p>
        </div>
        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Today's Snapshot */}
      <div>
        <SectionLabel>Today&apos;s Snapshot</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {todayStatCards.map((stat, i) => (
            <div
              key={stat.name}
              className={`bg-white rounded-2xl shadow-soft border border-neutral-100 border-t-4 ${stat.accentBorder} p-6 hover:shadow-soft-lg transition-shadow stagger-${i + 1} animate-fade-in-up`}
            >
              <div className="flex items-center gap-4">
                <div className={`${stat.color} rounded-xl p-3 shrink-0`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-primary-900 leading-tight">{stat.value}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1">
                {stat.trendUp ? (
                  <ArrowTrendingUpIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <ArrowTrendingDownIcon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                )}
                <span className={`text-xs font-medium ${stat.trendUp ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {stat.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Sales Overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel noMargin>Last 7 Days</SectionLabel>
          <Link to="/admin/reports" className="text-xs font-medium text-accent-600 hover:text-accent-700 flex items-center gap-1">
            View Full Report
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {weeklySummaryCards.map((stat, i) => (
            <div
              key={stat.name}
              className={`bg-white rounded-2xl shadow-soft p-5 hover:shadow-soft-lg transition-shadow border border-neutral-100 stagger-${i + 1} animate-fade-in-up`}
            >
              <div className="flex items-center gap-3">
                <div className={`${stat.bgColor} rounded-xl p-2.5 shrink-0`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500">{stat.name}</p>
                  <p className="text-xl font-bold text-primary-900 leading-tight">{stat.value}</p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-1">
                {stat.trendUp ? (
                  <ArrowTrendingUpIcon className="h-3 w-3 text-emerald-500 shrink-0" />
                ) : (
                  <ArrowTrendingDownIcon className="h-3 w-3 text-amber-500 shrink-0" />
                )}
                <span className={`text-xs font-medium ${stat.trendUp ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {stat.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-base font-semibold text-primary-900">Revenue Trend</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Last 7 days &mdash; completed revenue&nbsp;
                <span className="font-semibold text-emerald-600">
                  ₱{(salesReport?.completedRevenue || 0).toLocaleString()}
                </span>
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="date" stroke="#D1D5DB" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#D1D5DB" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}
                  cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '4 4' }}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload
                    return item?.fullDate || label
                  }}
                  formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Pie Chart */}
        <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100 flex flex-col">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-primary-900">Order Status</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Last 7 days &mdash; <span className="font-semibold text-primary-800">{salesReport?.totalOrders || 0}</span> total orders
            </p>
          </div>
          {orderStatusData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">
              No order data yet
            </div>
          ) : (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                        padding: '6px 10px',
                      }}
                      formatter={(value, name) => [value, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Full legend */}
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                {orderStatusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-neutral-500 capitalize truncate">{item.name}</span>
                    <span className="text-xs font-semibold text-primary-800 ml-auto shrink-0">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Low Stock & Recent Orders Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 flex flex-col">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
              <h2 className="text-base font-semibold text-primary-900">Low Stock Alerts</h2>
            </div>
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
              {lowStockProducts.length} items
            </span>
          </div>
          <div className="p-4 flex-1 max-h-80 overflow-y-auto">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-10">
                <CubeIcon className="h-10 w-10 text-neutral-200 mx-auto mb-2" />
                <p className="text-neutral-400 text-sm">All products well stocked</p>
              </div>
            ) : (
              <div className="space-y-1">
                {lowStockProducts.slice(0, 6).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      {product.imageUrl ? (
                        <img src={getImageUrl(product.imageUrl)} alt={product.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 bg-neutral-100 rounded-lg flex items-center justify-center shrink-0">
                          <CubeIcon className="h-4 w-4 text-neutral-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-primary-800 truncate">{product.name}</p>
                        <p className="text-xs text-neutral-400">{product.category?.name}</p>
                        <StockBar current={product.effectiveStock ?? product.stockQuantity} threshold={product.lowStockThreshold} />
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      {(() => {
                        const stock = product.effectiveStock ?? product.stockQuantity
                        const ratio = product.lowStockThreshold > 0 ? stock / product.lowStockThreshold : 0
                        const textColor = ratio <= 0.25 ? 'text-red-600' : 'text-amber-600'
                        return (
                          <p className={`text-sm font-bold ${textColor}`}>
                            {stock} left
                          </p>
                        )
                      })()}
                      <p className="text-xs text-neutral-400">min {product.lowStockThreshold}</p>
                    </div>
                  </div>
                ))}
                {lowStockProducts.length > 6 && (
                  <Link
                    to="/admin/products"
                    className="block text-center text-xs text-accent-600 hover:text-accent-700 font-medium py-2 mt-1 rounded-lg hover:bg-accent-50 transition-colors"
                  >
                    View all {lowStockProducts.length} items →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-soft border border-neutral-100 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center">
            <h2 className="text-base font-semibold text-primary-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-accent-600 hover:text-accent-700 font-medium flex items-center gap-1">
              View All
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right pr-5">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-neutral-400 text-sm">
                      No recent orders
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                      <td>
                        <span className="font-semibold text-primary-900 text-sm">{order.orderNumber}</span>
                      </td>
                      <td>
                        <span className="text-sm font-medium text-primary-900">{order.customerName}</span>
                      </td>
                      <td>
                        <span className="text-sm font-medium text-primary-900">₱{order.totalAmount.toLocaleString()}</span>
                      </td>
                      <td>
                        <span className={statusColors[order.status] || 'badge bg-neutral-50 text-neutral-600 border border-neutral-200'}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-neutral-500">
                          {new Date(order.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                          <span className="ml-1 text-neutral-400">
                            {new Date(order.createdAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </span>
                      </td>
                      <td className="text-right pr-5">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="text-xs text-accent-600 hover:text-accent-700 font-semibold"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <SectionLabel>Quick Actions</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/admin/orders?status=pending"
            className="group bg-white rounded-2xl shadow-soft border border-neutral-100 p-5 hover:shadow-soft-lg hover:border-amber-200 transition-all flex items-center gap-4"
          >
            <div className="bg-amber-50 rounded-xl p-3 shrink-0 group-hover:bg-amber-100 transition-colors">
              <ClockIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-primary-900 text-sm">Process Pending Orders</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {stats?.pendingOrders || 0} {stats?.pendingOrders === 1 ? 'order' : 'orders'} waiting for processing
              </p>
            </div>
            <svg className="h-4 w-4 text-neutral-300 group-hover:text-amber-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            to="/admin/products"
            className="group bg-white rounded-2xl shadow-soft border border-neutral-100 p-5 hover:shadow-soft-lg hover:border-violet-200 transition-all flex items-center gap-4"
          >
            <div className="bg-violet-50 rounded-xl p-3 shrink-0 group-hover:bg-violet-100 transition-colors">
              <CubeIcon className="h-6 w-6 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-primary-900 text-sm">Manage Products</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Add, edit, or update product availability</p>
            </div>
            <svg className="h-4 w-4 text-neutral-300 group-hover:text-violet-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Last updated */}
      {lastUpdated && (
        <p className="text-center text-xs text-neutral-300 pb-2">
          Last updated {lastUpdated.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      )}
    </div>
  )
}
