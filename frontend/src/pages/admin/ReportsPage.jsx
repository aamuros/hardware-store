import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import api, { getImageUrl } from '../../services/api'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  pending: { bg: '#fef3c7', text: '#92400e', fill: '#f59e0b' },
  accepted: { bg: '#dbeafe', text: '#1e40af', fill: '#3b82f6' },
  preparing: { bg: '#e0e7ff', text: '#3730a3', fill: '#6366f1' },
  out_for_delivery: { bg: '#fce7f3', text: '#9d174d', fill: '#ec4899' },
  delivered: { bg: '#d1fae5', text: '#065f46', fill: '#10b981' },
  completed: { bg: '#dcfce7', text: '#166534', fill: '#22c55e' },
  cancelled: { bg: '#fee2e2', text: '#991b1b', fill: '#ef4444' },
  rejected: { bg: '#fecaca', text: '#7f1d1d', fill: '#dc2626' },
}

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#14b8a6']

// Section label with left accent bar — matches Dashboard
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-4 bg-accent-500 rounded-full shrink-0" />
      <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">{children}</h2>
    </div>
  )
}

// Skeleton shimmer block
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-neutral-200 rounded-xl ${className}`} />
}

export default function ReportsPage() {
  const [salesReport, setSalesReport] = useState(null)
  const [productReport, setProductReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [dateRange, setDateRange] = useState('30')
  const [activeChart, setActiveChart] = useState('revenue')
  const printRef = useRef()

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const [salesRes, productRes] = await Promise.all([
        api.get(`/admin/reports/sales?days=${dateRange}`),
        api.get(`/admin/reports/products?days=${dateRange}`)
      ])
      setSalesReport(salesRes.data.data)
      setProductReport(productRes.data.data)
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await api.get(`/admin/reports/export?days=${dateRange}`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `sales_report_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Report exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export report')
    } finally {
      setExporting(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  const formatCompact = (amount) => {
    if (amount >= 1000000) return `₱${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `₱${(amount / 1000).toFixed(1)}K`
    return `₱${(amount || 0).toFixed(0)}`
  }

  const formatChartDate = (dateStr) => {
    const parts = dateStr.split('-').map(Number)
    const d = new Date(parts[0], parts[1] - 1, parts[2])
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
  }

  const formatStatusLabel = (status) => {
    return (status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  const getDateRangeLabel = () => {
    const labels = { '7': 'Last 7 Days', '30': 'Last 30 Days', '90': 'Last 3 Months', '365': 'Last Year', '545': 'Last 18 Months' }
    return labels[dateRange] || `Last ${dateRange} Days`
  }

  // --- Loading skeleton ---
  if (loading) {
    return (
      <div className="space-y-7 animate-fade-in">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>
        <div>
          <Skeleton className="h-4 w-28 mb-3" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-soft border border-neutral-100 border-t-4 border-t-neutral-200 p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-7 w-24" />
                  </div>
                </div>
                <Skeleton className="h-3 w-32 mt-3" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="h-4 w-36 mb-3" />
          <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-3 w-56 mb-6" />
            <Skeleton className="h-72 w-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
            <Skeleton className="h-5 w-44 mb-2" />
            <Skeleton className="h-3 w-56 mb-6" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-100">
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-3 w-48 mb-6" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const completionRate = salesReport?.totalOrders > 0
    ? ((salesReport.completedOrders / salesReport.totalOrders) * 100).toFixed(1)
    : 0

  const pieData = salesReport?.ordersByStatus?.map(s => ({
    name: s.status,
    value: s._count,
    fill: STATUS_COLORS[s.status]?.fill || '#94a3b8'
  })) || []

  const kpiCards = [
    {
      name: 'Total Revenue',
      value: formatCompact(salesReport?.totalRevenue || 0),
      icon: CurrencyDollarIcon,
      color: 'bg-blue-500',
      accentBorder: 'border-t-blue-500',
      trend: salesReport?.growth
        ? `${salesReport.growth.revenue >= 0 ? '+' : ''}${salesReport.growth.revenue}% vs prev`
        : null,
      trendUp: salesReport?.growth ? salesReport.growth.revenue >= 0 : true,
    },
    {
      name: 'Total Orders',
      value: salesReport?.totalOrders || 0,
      icon: ShoppingCartIcon,
      color: 'bg-violet-500',
      accentBorder: 'border-t-violet-500',
      trend: salesReport?.growth
        ? `${salesReport.growth.orders >= 0 ? '+' : ''}${salesReport.growth.orders}% vs prev`
        : null,
      trendUp: salesReport?.growth ? salesReport.growth.orders >= 0 : true,
    },
    {
      name: 'Completed',
      value: salesReport?.completedOrders || 0,
      icon: CheckCircleIcon,
      color: 'bg-emerald-500',
      accentBorder: 'border-t-emerald-500',
      trend: `${completionRate}% completion rate`,
      trendUp: true,
    },
    {
      name: 'Cancelled',
      value: salesReport?.cancelledOrders || 0,
      icon: XCircleIcon,
      color: 'bg-rose-500',
      accentBorder: 'border-t-rose-500',
      trend: salesReport?.totalOrders > 0
        ? `${((salesReport.cancelledOrders / salesReport.totalOrders) * 100).toFixed(1)}% cancellation rate`
        : '0% cancellation rate',
      trendUp: (salesReport?.cancelledOrders || 0) === 0,
    },
  ]

  return (
    <div className="space-y-7 print:space-y-4 animate-fade-in" ref={printRef}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="page-title">Analytics & Reports</h1>
          <p className="page-subtitle">{getDateRangeLabel()} &bull; {salesReport?.totalOrders || 0} orders processed</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <div className="flex items-center bg-neutral-100 rounded-xl p-1">
            {[
              { value: '7', label: '7D' },
              { value: '30', label: '30D' },
              { value: '90', label: '3M' },
              { value: '365', label: '1Y' },
              { value: '545', label: 'All' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${dateRange === opt.value
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchReports}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm"
              title="Refresh"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-800 text-white text-sm font-medium hover:bg-primary-900 transition-colors disabled:opacity-50 shadow-sm"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm"
            >
              <PrinterIcon className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div>
        <SectionLabel>Key Metrics</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((stat, i) => (
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
              {stat.trend && (
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
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Chart */}
      {salesReport?.dailyData && salesReport.dailyData.length > 0 && (
        <div>
          <SectionLabel>Revenue Overview</SectionLabel>
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 pb-2">
              <div>
                <h2 className="text-base font-semibold text-primary-900">Revenue Trend</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Daily revenue and order volume</p>
              </div>
              <div className="flex items-center bg-neutral-100 rounded-lg p-1 mt-3 sm:mt-0">
                {['revenue', 'orders'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveChart(tab)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${activeChart === tab
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-72 px-4 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                {activeChart === 'revenue' ? (
                  <AreaChart data={salesReport.dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatChartDate}
                      stroke="#D1D5DB"
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      interval={Math.max(0, Math.floor(salesReport.dailyData.length / 8))}
                    />
                    <YAxis
                      tickFormatter={(v) => formatCompact(v)}
                      stroke="#D1D5DB"
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
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
                      labelFormatter={(label) => formatChartDate(label)}
                      formatter={(value) => [formatCurrency(value), 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#revenueGradient)"
                      name="revenue"
                      dot={salesReport.dailyData.length <= 31}
                      activeDot={{ r: 5, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={salesReport.dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatChartDate}
                      stroke="#D1D5DB"
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      interval={Math.max(0, Math.floor(salesReport.dailyData.length / 8))}
                    />
                    <YAxis
                      stroke="#D1D5DB"
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '12px',
                        padding: '8px 12px',
                      }}
                      cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                      labelFormatter={(label) => formatChartDate(label)}
                      formatter={(value) => [value, 'Orders']}
                    />
                    <Bar
                      dataKey="orders"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                      name="orders"
                      maxBarSize={40}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Status Breakdown + Revenue Stats */}
      <div>
        <SectionLabel>Order Insights</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Donut */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-6">
            <h2 className="text-base font-semibold text-primary-900 mb-0.5">Order Status Breakdown</h2>
            <p className="text-xs text-neutral-500 mb-4">Distribution of orders by current status</p>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-44 h-44 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
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
                      formatter={(value, name) => [value, formatStatusLabel(name)]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 w-full">
                {salesReport?.ordersByStatus?.sort((a, b) => b._count - a._count).map((item) => {
                  const colors = STATUS_COLORS[item.status] || { bg: '#f1f5f9', text: '#475569', fill: '#94a3b8' }
                  const pct = salesReport.totalOrders > 0 ? ((item._count / salesReport.totalOrders) * 100).toFixed(0) : 0
                  return (
                    <div key={item.status}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors.fill }}></span>
                          <span className="text-sm font-medium text-neutral-700">{formatStatusLabel(item.status)}</span>
                        </div>
                        <span className="text-sm text-neutral-500">{item._count} <span className="text-xs">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${pct}%`, backgroundColor: colors.fill }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
                {(!salesReport?.ordersByStatus || salesReport.ordersByStatus.length === 0) && (
                  <p className="text-neutral-400 text-center py-8 text-sm">No data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Revenue Stats */}
          <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-6">
            <h2 className="text-base font-semibold text-primary-900 mb-0.5">Revenue Breakdown</h2>
            <p className="text-xs text-neutral-500 mb-4">Financial summary for the selected period</p>
            <div className="space-y-3">
              {[
                {
                  label: 'Average Order Value',
                  value: formatCurrency(salesReport?.averageOrderValue),
                  icon: ChartBarIcon,
                  bgColor: 'bg-blue-50',
                  iconColor: 'text-blue-600',
                  valueColor: 'text-primary-900',
                },
                {
                  label: 'Completed Revenue',
                  value: formatCurrency(salesReport?.completedRevenue),
                  icon: CheckCircleIcon,
                  bgColor: 'bg-emerald-50',
                  iconColor: 'text-emerald-600',
                  valueColor: 'text-emerald-700',
                },
                {
                  label: 'Pending Revenue',
                  value: formatCurrency(salesReport?.pendingRevenue),
                  icon: CalendarDaysIcon,
                  bgColor: 'bg-amber-50',
                  iconColor: 'text-amber-600',
                  valueColor: 'text-amber-700',
                },
                {
                  label: 'Revenue per Day (avg)',
                  value: formatCurrency(salesReport?.period?.days > 0 ? salesReport.totalRevenue / salesReport.period.days : 0),
                  icon: ArrowTrendingUpIcon,
                  bgColor: 'bg-violet-50',
                  iconColor: 'text-violet-600',
                  valueColor: 'text-primary-900',
                },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center p-4 rounded-xl bg-neutral-50/70 hover:bg-neutral-50 transition-colors">
                  <div>
                    <p className="text-xs text-neutral-500">{item.label}</p>
                    <p className={`text-lg font-bold ${item.valueColor}`}>{item.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center shrink-0`}>
                    <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div>
        <SectionLabel>Top Products</SectionLabel>
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h2 className="text-base font-semibold text-primary-900">Top Selling Products</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Ranked by total revenue generated</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full admin-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="text-right">Units Sold</th>
                  <th className="text-right">Revenue</th>
                  <th className="text-right">Share</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {productReport?.topProducts?.map((product, index) => {
                  const maxRevenue = productReport.topProducts[0]?.totalRevenue || 1
                  const sharePct = ((product.totalRevenue / maxRevenue) * 100).toFixed(0)
                  return (
                    <tr key={product.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td>
                        {index < 3 ? (
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-300' :
                            index === 1 ? 'bg-neutral-100 text-neutral-600 ring-2 ring-neutral-300' :
                              'bg-orange-100 text-orange-700 ring-2 ring-orange-300'
                            }`}>
                            {index + 1}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-neutral-50 text-neutral-500 text-xs">
                            {index + 1}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-9 h-9 rounded-lg object-cover border border-neutral-200" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 text-xs font-bold">
                              {(product.name || '?')[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-primary-900 text-sm">{product.name}</p>
                            <p className="text-xs text-neutral-400 font-mono">{product.sku || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-neutral-50 text-neutral-600 border border-neutral-200">
                          {product.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className="font-semibold text-primary-900">{product.totalSold || 0}</span>
                        <span className="text-xs text-neutral-400 ml-1">units</span>
                      </td>
                      <td className="text-right font-bold text-emerald-600">
                        {formatCurrency(product.totalRevenue)}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-14 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${sharePct}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-neutral-500 w-8">{sharePct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {(!productReport?.topProducts || productReport.topProducts.length === 0) && (
                  <tr>
                    <td colSpan="6" className="text-center text-neutral-400 py-10 text-sm">
                      No product data available for this period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Category Performance */}
      <div>
        <SectionLabel>Category Performance</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {productReport?.categoryStats
            ?.filter(c => c.totalRevenue > 0 || c.totalSold > 0)
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .map((category, i) => {
              const maxCatRevenue = Math.max(...(productReport.categoryStats.map(c => c.totalRevenue) || [1]))
              const pct = maxCatRevenue > 0 ? ((category.totalRevenue / maxCatRevenue) * 100) : 0
              return (
                <div
                  key={category.id}
                  className={`bg-white rounded-2xl shadow-soft border border-neutral-100 p-5 hover:shadow-soft-lg hover:border-neutral-200 transition-all duration-200 stagger-${i + 1} animate-fade-in-up`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center ring-1 ring-neutral-200 overflow-hidden shrink-0">
                      {category.imageUrl ? (
                        <img
                          src={getImageUrl(category.imageUrl)}
                          alt={category.name}
                          className="w-5 h-5 object-contain"
                        />
                      ) : (
                        <span className="text-sm">{category.icon || '📦'}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary-900 text-sm">{category.name}</h3>
                      <p className="text-xs text-neutral-400">{category.productCount} products</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full mb-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length]
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-neutral-400">Units Sold</p>
                      <p className="text-sm font-bold text-primary-800">{category.totalSold}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-neutral-400">Revenue</p>
                      <p className="text-sm font-bold text-emerald-600">{formatCompact(category.totalRevenue)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          {(!productReport?.categoryStats || productReport.categoryStats.filter(c => c.totalRevenue > 0).length === 0) && (
            <div className="col-span-full py-8 text-center text-neutral-400 text-sm">
              No category performance data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
