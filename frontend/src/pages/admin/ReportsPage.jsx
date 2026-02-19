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
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts'
import api from '../../services/api'
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
    return `₱${amount.toFixed(0)}`
  }

  const formatChartDate = (dateStr) => {
    // Parse YYYY-MM-DD as local date to avoid UTC timezone shift
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

  // Custom tooltip for charts
  const RevenueTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm shadow-xl rounded-xl p-4 border border-neutral-100" style={{ minWidth: '180px' }}>
          <p className="font-semibold text-neutral-800 text-sm mb-2 border-b pb-2">{formatChartDate(label)}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 py-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                <span className="text-sm text-neutral-600 capitalize">{entry.name}</span>
              </div>
              <span className="text-sm font-semibold text-neutral-900">
                {entry.name === 'revenue' ? formatCurrency(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm shadow-xl rounded-xl p-3 border border-neutral-100">
          <p className="text-sm font-semibold text-neutral-800">{formatStatusLabel(payload[0].name)}</p>
          <p className="text-sm text-neutral-600">{payload[0].value} orders</p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-100 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
        </div>
        <p className="text-neutral-500 font-medium animate-pulse">Loading analytics...</p>
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

  return (
    <div className="space-y-8 print:space-y-4" ref={printRef}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary-900 to-primary-600 bg-clip-text text-transparent">
            Analytics & Reports
          </h1>
          <p className="text-neutral-500 mt-1">{getDateRangeLabel()} • {salesReport?.totalOrders || 0} orders processed</p>
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
              className="p-2.5 rounded-xl bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-100 text-neutral-700 text-sm font-medium hover:bg-neutral-200 transition-colors"
            >
              <PrinterIcon className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-5 text-white shadow-lg shadow-blue-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <CurrencyDollarIcon className="h-5 w-5 text-blue-200" />
              <span className="text-sm font-medium text-blue-100">Total Revenue</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold tracking-tight">
              {formatCompact(salesReport?.totalRevenue || 0)}
            </p>
            {salesReport?.growth && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${salesReport.growth.revenue >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {salesReport.growth.revenue >= 0
                  ? <ArrowTrendingUpIcon className="h-4 w-4" />
                  : <ArrowTrendingDownIcon className="h-4 w-4" />
                }
                <span className="font-medium">{Math.abs(salesReport.growth.revenue)}%</span>
                <span className="text-blue-200 text-xs">vs prev</span>
              </div>
            )}
          </div>
        </div>

        {/* Total Orders */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 p-5 text-white shadow-lg shadow-violet-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCartIcon className="h-5 w-5 text-violet-200" />
              <span className="text-sm font-medium text-violet-100">Total Orders</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold tracking-tight">
              {salesReport?.totalOrders || 0}
            </p>
            {salesReport?.growth && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${salesReport.growth.orders >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {salesReport.growth.orders >= 0
                  ? <ArrowTrendingUpIcon className="h-4 w-4" />
                  : <ArrowTrendingDownIcon className="h-4 w-4" />
                }
                <span className="font-medium">{Math.abs(salesReport.growth.orders)}%</span>
                <span className="text-violet-200 text-xs">vs prev</span>
              </div>
            )}
          </div>
        </div>

        {/* Completed */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircleIcon className="h-5 w-5 text-emerald-200" />
              <span className="text-sm font-medium text-emerald-100">Completed</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold tracking-tight">
              {salesReport?.completedOrders || 0}
            </p>
            <p className="text-sm text-emerald-200 mt-2">{completionRate}% completion rate</p>
          </div>
        </div>

        {/* Cancelled */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 p-5 text-white shadow-lg shadow-rose-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <XCircleIcon className="h-5 w-5 text-rose-200" />
              <span className="text-sm font-medium text-rose-100">Cancelled</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold tracking-tight">
              {salesReport?.cancelledOrders || 0}
            </p>
            <p className="text-sm text-rose-200 mt-2">
              {salesReport?.totalOrders > 0
                ? ((salesReport.cancelledOrders / salesReport.totalOrders) * 100).toFixed(1)
                : 0}% cancellation rate
            </p>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      {salesReport?.dailyData && salesReport.dailyData.length > 0 && (
        <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 pb-2">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Revenue Trend</h2>
              <p className="text-sm text-neutral-500">Daily revenue and order volume</p>
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
          <div className="h-80 px-4 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              {activeChart === 'revenue' ? (
                <AreaChart data={salesReport.dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatChartDate}
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    interval={Math.max(0, Math.floor(salesReport.dailyData.length / 8))}
                  />
                  <YAxis
                    tickFormatter={(v) => formatCompact(v)}
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)"
                    name="revenue"
                    dot={salesReport.dailyData.length <= 31}
                    activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              ) : (
                <BarChart data={salesReport.dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatChartDate}
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    interval={Math.max(0, Math.floor(salesReport.dailyData.length / 8))}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<RevenueTooltip />} />
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
      )}

      {/* Status Breakdown + Revenue Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Donut */}
        <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-neutral-900 mb-1">Order Status Breakdown</h2>
          <p className="text-sm text-neutral-500 mb-4">Distribution of orders by current status</p>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-48 h-48 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 w-full">
              {salesReport?.ordersByStatus?.sort((a, b) => b._count - a._count).map((item) => {
                const colors = STATUS_COLORS[item.status] || { bg: '#f1f5f9', text: '#475569', fill: '#94a3b8' }
                const pct = salesReport.totalOrders > 0 ? ((item._count / salesReport.totalOrders) * 100).toFixed(0) : 0
                return (
                  <div key={item.status} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.fill }}></span>
                        <span className="text-sm font-medium text-neutral-700">{formatStatusLabel(item.status)}</span>
                      </div>
                      <span className="text-sm text-neutral-500">{item._count} <span className="text-xs">({pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: colors.fill }}
                      ></div>
                    </div>
                  </div>
                )
              })}
              {(!salesReport?.ordersByStatus || salesReport.ordersByStatus.length === 0) && (
                <p className="text-neutral-400 text-center py-8">No data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-neutral-900 mb-1">Revenue Breakdown</h2>
          <p className="text-sm text-neutral-500 mb-4">Financial summary for the selected period</p>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-xl">
              <div>
                <p className="text-sm text-neutral-500">Average Order Value</p>
                <p className="text-xl font-bold text-neutral-900">{formatCurrency(salesReport?.averageOrderValue)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl">
              <div>
                <p className="text-sm text-neutral-500">Completed Revenue</p>
                <p className="text-xl font-bold text-emerald-700">{formatCurrency(salesReport?.completedRevenue)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-amber-50 rounded-xl">
              <div>
                <p className="text-sm text-neutral-500">Pending Revenue</p>
                <p className="text-xl font-bold text-amber-700">{formatCurrency(salesReport?.pendingRevenue)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <CalendarDaysIcon className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-xl">
              <div>
                <p className="text-sm text-neutral-500">Revenue per Day (avg)</p>
                <p className="text-xl font-bold text-neutral-900">
                  {formatCurrency(salesReport?.period?.days > 0 ? salesReport.totalRevenue / salesReport.period.days : 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                <ArrowTrendingUpIcon className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-6 pb-3">
          <h2 className="text-lg font-bold text-neutral-900">Top Selling Products</h2>
          <p className="text-sm text-neutral-500">Ranked by total revenue generated</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-b border-neutral-100 bg-neutral-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Units Sold</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {productReport?.topProducts?.map((product, index) => {
                const maxRevenue = productReport.topProducts[0]?.totalRevenue || 1
                const sharePct = ((product.totalRevenue / maxRevenue) * 100).toFixed(0)
                return (
                  <tr key={product.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {index < 3 ? (
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-300' :
                            index === 1 ? 'bg-neutral-100 text-neutral-600 ring-2 ring-neutral-300' :
                              'bg-orange-100 text-orange-700 ring-2 ring-orange-300'
                          }`}>
                          {index + 1}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-50 text-neutral-500 text-sm">
                          {index + 1}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover shadow-sm border border-neutral-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 text-sm font-bold">
                            {(product.name || '?')[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-neutral-900 text-sm">{product.name}</p>
                          <p className="text-xs text-neutral-400 font-mono">{product.sku || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                        {product.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="font-semibold text-neutral-900">{product.totalSold || 0}</span>
                      <span className="text-xs text-neutral-400 ml-1">units</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-emerald-600">
                      {formatCurrency(product.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-neutral-100 rounded-full overflow-hidden">
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
                  <td colSpan="6" className="px-6 py-12 text-center text-neutral-400">
                    No product data available for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Performance */}
      <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-neutral-900 mb-1">Category Performance</h2>
        <p className="text-sm text-neutral-500 mb-4">Sales distribution across product categories</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {productReport?.categoryStats
            ?.filter(c => c.totalRevenue > 0 || c.totalSold > 0)
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .map((category, i) => {
              const maxCatRevenue = Math.max(...(productReport.categoryStats.map(c => c.totalRevenue) || [1]))
              const pct = maxCatRevenue > 0 ? ((category.totalRevenue / maxCatRevenue) * 100) : 0
              return (
                <div key={category.id} className="group p-5 rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-100/50 border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center ring-1 ring-neutral-200 overflow-hidden flex-shrink-0">
                      {category.imageUrl ? (
                        <img
                          src={`${(import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api', '')}${category.imageUrl}`}
                          alt={category.name}
                          className="w-5 h-5 object-contain"
                        />
                      ) : (
                        <span className="text-sm">{category.icon || '📦'}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900 text-sm">{category.name}</h3>
                      <p className="text-xs text-neutral-400">{category.productCount} products</p>
                    </div>
                  </div>
                  <div className="h-2 bg-neutral-200 rounded-full mb-3 overflow-hidden">
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
                      <p className="text-sm font-bold text-neutral-800">{category.totalSold}</p>
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
            <div className="col-span-full py-8 text-center text-neutral-400">
              No category performance data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
