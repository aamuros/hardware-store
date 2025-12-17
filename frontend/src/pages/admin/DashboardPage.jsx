import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../services/api'
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
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
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
  const [allOrders, setAllOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, lowStockRes, ordersRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getLowStockProducts(),
        adminApi.getOrders({ limit: 100 }), // Get more orders for charts
      ])

      const { stats: dashStats, recentOrders: orders } = dashboardRes.data.data
      setStats(dashStats)
      setRecentOrders(orders)
      setLowStockProducts(lowStockRes.data.data || [])
      setAllOrders(ordersRes.data.data || [])
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Generate chart data from orders
  const getOrderStatusData = () => {
    if (!allOrders.length) return []

    const statusCounts = allOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {})

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace('_', ' '),
      value: count,
      color: CHART_COLORS[status] || '#94A3B8',
    }))
  }

  // Generate last 7 days revenue data
  const getRevenueData = () => {
    const days = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayOrders = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0]
        return orderDate === dateStr && ['delivered', 'completed'].includes(order.status)
      })

      const revenue = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0)
      const orderCount = dayOrders.length

      days.push({
        date: date.toLocaleDateString('en-PH', { weekday: 'short' }),
        revenue,
        orders: orderCount,
      })
    }

    return days
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
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

  // Calculate real trends by comparing today vs yesterday
  const calculateTrends = () => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    // Today's orders
    const todayOrders = allOrders.filter(order => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0]
      return orderDate === todayStr
    })

    // Yesterday's orders
    const yesterdayOrders = allOrders.filter(order => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0]
      return orderDate === yesterdayStr
    })

    // Calculate order count trend
    const todayOrderCount = todayOrders.length
    const yesterdayOrderCount = yesterdayOrders.length
    let orderTrend = '0%'
    let orderTrendUp = true

    if (yesterdayOrderCount > 0) {
      const orderChange = ((todayOrderCount - yesterdayOrderCount) / yesterdayOrderCount * 100).toFixed(0)
      orderTrend = `${orderChange >= 0 ? '+' : ''}${orderChange}% vs yesterday`
      orderTrendUp = todayOrderCount >= yesterdayOrderCount
    } else if (todayOrderCount > 0) {
      orderTrend = '+100% vs yesterday'
      orderTrendUp = true
    } else {
      orderTrend = 'No orders yesterday'
      orderTrendUp = true
    }

    // Calculate revenue trend
    const todayRevenue = todayOrders
      .filter(o => ['delivered', 'completed'].includes(o.status))
      .reduce((sum, o) => sum + o.totalAmount, 0)

    const yesterdayRevenue = yesterdayOrders
      .filter(o => ['delivered', 'completed'].includes(o.status))
      .reduce((sum, o) => sum + o.totalAmount, 0)

    let revenueTrend = '0%'
    let revenueTrendUp = true

    if (yesterdayRevenue > 0) {
      const revenueChange = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(0)
      revenueTrend = `${revenueChange >= 0 ? '+' : ''}${revenueChange}% vs yesterday`
      revenueTrendUp = todayRevenue >= yesterdayRevenue
    } else if (todayRevenue > 0) {
      revenueTrend = 'First revenue today!'
      revenueTrendUp = true
    } else {
      revenueTrend = 'No revenue yet'
      revenueTrendUp = true
    }

    return { orderTrend, orderTrendUp, revenueTrend, revenueTrendUp }
  }

  const trends = calculateTrends()

  const statCards = [
    {
      name: "Today's Orders",
      value: stats?.todayOrders || 0,
      icon: ShoppingBagIcon,
      color: 'bg-blue-500',
      trend: trends.orderTrend,
      trendUp: trends.orderTrendUp,
    },
    {
      name: 'Pending Orders',
      value: stats?.pendingOrders || 0,
      icon: ClockIcon,
      color: 'bg-amber-500',
      trend: stats?.pendingOrders > 5 ? 'Needs attention' : 'On track',
      trendUp: stats?.pendingOrders <= 5,
    },
    {
      name: "Today's Revenue",
      value: `₱${(stats?.todayRevenue || 0).toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'bg-emerald-500',
      trend: trends.revenueTrend,
      trendUp: trends.revenueTrendUp,
    },
    {
      name: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: CubeIcon,
      color: 'bg-violet-500',
      trend: `${lowStockProducts.length} low stock`,
      trendUp: lowStockProducts.length === 0,
    },
  ]

  const orderStatusData = getOrderStatusData()
  const revenueData = getRevenueData()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-900">Dashboard</h1>
        <p className="text-neutral-600">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-soft-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className={`${stat.color} rounded-xl p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-primary-900">{stat.value}</p>
                </div>
              </div>
            </div>
            {/* Trend indicator */}
            <div className="mt-3 flex items-center">
              {stat.trendUp ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-amber-500 mr-1" />
              )}
              <span className={`text-xs font-medium ${stat.trendUp ? 'text-emerald-600' : 'text-amber-600'}`}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-soft p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-primary-900">Revenue Overview</h2>
              <p className="text-sm text-neutral-500">Last 7 days performance</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => `₱${value.toLocaleString()}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Pie Chart */}
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-primary-900">Order Status</h2>
            <p className="text-sm text-neutral-500">Distribution of all orders</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
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
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {orderStatusData.slice(0, 4).map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs text-neutral-600 capitalize">{item.name}</span>
                <span className="text-xs font-medium text-primary-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock & Recent Orders Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl shadow-soft">
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-primary-900">Low Stock Alerts</h2>
            </div>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
              {lowStockProducts.length} items
            </span>
          </div>
          <div className="p-4 max-h-80 overflow-y-auto">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8">
                <CubeIcon className="h-12 w-12 text-neutral-300 mx-auto mb-2" />
                <p className="text-neutral-500 text-sm">All products are well stocked!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-neutral-200 rounded-lg flex items-center justify-center">
                          <CubeIcon className="h-5 w-5 text-neutral-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-primary-800 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-neutral-500">{product.category?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${product.stockQuantity <= 5 ? 'text-red-600' : 'text-amber-600'}`}>
                        {product.stockQuantity} left
                      </p>
                      <p className="text-xs text-neutral-400">of {product.lowStockThreshold}</p>
                    </div>
                  </div>
                ))}
                {lowStockProducts.length > 5 && (
                  <Link
                    to="/admin/products"
                    className="block text-center text-sm text-accent-600 hover:text-accent-700 font-medium py-2"
                  >
                    View all {lowStockProducts.length} items →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-soft">
          <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-primary-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-accent-600 hover:text-accent-700 text-sm font-medium">
              View All →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-neutral-500">
                      No recent orders
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-primary-900">#{order.orderNumber}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-primary-900">{order.customerName}</div>
                          <div className="text-sm text-neutral-500">{order.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                        ₱{order.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status] || 'bg-neutral-100 text-neutral-800'}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {new Date(order.createdAt).toLocaleTimeString('en-PH', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="text-accent-600 hover:text-accent-700 font-medium"
                        >
                          View
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/admin/orders?status=pending"
          className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-soft-lg transition-all flex items-center"
        >
          <div className="bg-amber-100 rounded-xl p-3">
            <ClockIcon className="h-6 w-6 text-amber-600" />
          </div>
          <div className="ml-4">
            <h3 className="font-semibold text-primary-900">Process Pending Orders</h3>
            <p className="text-sm text-neutral-500">
              {stats?.pendingOrders || 0} orders waiting for processing
            </p>
          </div>
        </Link>

        <Link
          to="/admin/products"
          className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-soft-lg transition-all flex items-center"
        >
          <div className="bg-violet-100 rounded-xl p-3">
            <CubeIcon className="h-6 w-6 text-violet-600" />
          </div>
          <div className="ml-4">
            <h3 className="font-semibold text-primary-900">Manage Products</h3>
            <p className="text-sm text-neutral-500">Add, edit, or update product availability</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
