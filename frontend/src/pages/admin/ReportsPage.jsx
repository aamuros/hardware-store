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
  XCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import api, { getImageUrl } from '../../services/api'
import toast from 'react-hot-toast'

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-neutral-200 rounded-xl ${className}`} />
}

/** Left-accent section heading — matches the rest of the admin panel */
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1 h-4 bg-accent-500 rounded-full shrink-0" />
      <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">{children}</h2>
    </div>
  )
}

/** White card shell */
function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-2xl shadow-soft border border-neutral-100 overflow-hidden ${className}`}>{children}</div>
}

/** Standardised card header row */
function CardHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-neutral-100">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-primary-900 leading-tight">{title}</p>
        {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}

/**
 * KPI stat card — clean two-row layout:
 *   Row 1: coloured icon  ·  trend badge (right-aligned)
 *   Row 2: big number
 *   Row 3: label
 */
function StatCard({ icon: Icon, label, value, sub, subUp, topAccent, iconBg, iconColor }) {
  return (
    <div className={`bg-white rounded-2xl shadow-soft border border-neutral-100 ${topAccent} p-5 hover:shadow-soft-lg transition-shadow duration-200`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`${iconBg} rounded-xl p-2.5`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        {sub != null && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
            subUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
          }`}>
            {subUp ? <ArrowTrendingUpIcon className="h-3 w-3 shrink-0" /> : <ArrowTrendingDownIcon className="h-3 w-3 shrink-0" />}
            {sub}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-primary-900 tabular-nums leading-none">{value}</p>
      <p className="text-xs text-neutral-500 mt-1.5">{label}</p>
    </div>
  )
}

/** Thin progress bar */
function Bar2({ pct, color }) {
  return (
    <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

/** Generic empty-state */
function EmptyState({ message = 'No data available for this period' }) {
  return (
    <div className="py-12 flex flex-col items-center gap-2 text-neutral-400">
      <ChartBarIcon className="h-7 w-7 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  pending:          '#f59e0b',
  accepted:         '#3b82f6',
  preparing:        '#6366f1',
  out_for_delivery: '#ec4899',
  delivered:        '#10b981',
  completed:        '#22c55e',
  cancelled:        '#ef4444',
  rejected:         '#dc2626',
}

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#14b8a6']

const DATE_OPTS = [
  { value: '7',   label: '7D',  long: 'Last 7 Days' },
  { value: '30',  label: '30D', long: 'Last 30 Days' },
  { value: '90',  label: '3M',  long: 'Last 3 Months' },
  { value: '365', label: '1Y',  long: 'Last Year' },
  { value: '545', label: 'All', long: 'All Time' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [salesReport, setSalesReport]     = useState(null)
  const [productReport, setProductReport] = useState(null)
  const [loading, setLoading]             = useState(true)
  const [exporting, setExporting]         = useState(false)
  const [dateRange, setDateRange]         = useState('30')
  const [activeChart, setActiveChart]     = useState('revenue')
  const printRef = useRef()

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const [salesRes, productRes] = await Promise.all([
        api.get(`/admin/reports/sales?days=${dateRange}`),
        api.get(`/admin/reports/products?days=${dateRange}`),
      ])
      setSalesReport(salesRes.data.data)
      setProductReport(productRes.data.data)
    } catch {
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => { fetchReports() }, [fetchReports])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await api.get(`/admin/reports/export?days=${dateRange}`, { responseType: 'blob' })
      const url  = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `sales_report_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Report exported successfully')
    } catch {
      toast.error('Failed to export report')
    } finally {
      setExporting(false)
    }
  }

  // Formatters
  const fmt = (amount) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0)

  const fmtK = (amount) => {
    if (amount >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(1)}M`
    if (amount >= 1_000)     return `₱${(amount / 1_000).toFixed(1)}K`
    return `₱${(amount || 0).toFixed(0)}`
  }

  const fmtDate = (s) => {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
  }

  const titleCase = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const rangeLong = DATE_OPTS.find(o => o.value === dateRange)?.long ?? `Last ${dateRange} Days`

  // Tooltips
  const RevenueTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-neutral-100 shadow-soft-lg rounded-xl p-3.5" style={{ minWidth: 176 }}>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide pb-2 mb-2 border-b border-neutral-100">
          {fmtDate(label)}
        </p>
        {payload.map((e, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
              <span className="text-xs text-neutral-500 capitalize">{e.name}</span>
            </div>
            <span className="text-xs font-bold text-primary-900">
              {e.name === 'revenue' ? fmt(e.value) : e.value}
            </span>
          </div>
        ))}
      </div>
    )
  }

  const PieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-neutral-100 shadow-soft-lg rounded-xl px-3 py-2.5">
        <p className="text-xs font-semibold text-primary-900 leading-tight">{titleCase(payload[0].name)}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{payload[0].value} orders</p>
      </div>
    )
  }

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-7 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="space-y-2"><Skeleton className="h-7 w-52" /><Skeleton className="h-4 w-64" /></div>
          <div className="flex gap-2"><Skeleton className="h-9 w-48 rounded-xl" /><Skeleton className="h-9 w-24 rounded-xl" /><Skeleton className="h-9 w-28 rounded-xl" /><Skeleton className="h-9 w-20 rounded-xl" /></div>
        </div>
        <Skeleton className="h-12 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-5 space-y-3">
              <div className="flex items-center justify-between"><Skeleton className="h-9 w-9 rounded-xl" /><Skeleton className="h-5 w-16 rounded-full" /></div>
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-neutral-100 flex items-start justify-between">
            <div className="space-y-1.5"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56" /></div>
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
          <div className="p-6"><Skeleton className="h-64 w-full" /></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-soft border border-neutral-100 overflow-hidden">
              <div className="px-6 pt-5 pb-4 border-b border-neutral-100 space-y-1"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-48" /></div>
              <div className="p-6 space-y-3">{[...Array(4)].map((_, j) => <Skeleton key={j} className="h-12 w-full" />)}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const total        = salesReport?.totalOrders || 0
  const completed    = salesReport?.completedOrders || 0
  const cancelled    = salesReport?.cancelledOrders || 0
  const compRate     = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0'
  const cancelRate   = total > 0 ? ((cancelled / total) * 100).toFixed(1) : '0.0'
  const revGrowth    = salesReport?.growth?.revenue
  const ordGrowth    = salesReport?.growth?.orders
  const dailyAvg     = (salesReport?.period?.days ?? 0) > 0 ? salesReport.totalRevenue / salesReport.period.days : 0

  const pieData = (salesReport?.ordersByStatus ?? []).map(s => ({
    name:  s.status,
    value: s._count,
    fill:  STATUS_COLORS[s.status] ?? '#94a3b8',
  }))

  const axisProps = { axisLine: false, tickLine: false, tick: { fontSize: 11, fill: '#a3a3a3' } }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 print:space-y-4 animate-fade-in" ref={printRef}>

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="page-title">Analytics &amp; Reports</h1>
          <p className="page-subtitle">{rangeLong} · {total} orders processed</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {/* Date switcher */}
          <div className="flex items-center bg-neutral-100 rounded-xl p-1 gap-0.5">
            {DATE_OPTS.map(o => (
              <button
                key={o.value}
                onClick={() => setDateRange(o.value)}
                className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 ${
                  dateRange === o.value ? 'bg-white text-primary-800 shadow-sm' : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <button onClick={fetchReports} className="btn btn-outline btn-sm gap-1.5">
            <ArrowPathIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={handleExport} disabled={exporting} className="btn btn-primary btn-sm gap-1.5">
            <ArrowDownTrayIcon className="h-4 w-4" />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <button onClick={() => window.print()} className="btn btn-outline btn-sm gap-1.5">
            <PrinterIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* ── Insights strip ────────────────────────────────────────────────── */}
      {(revGrowth != null || ordGrowth != null) && (
        <div className="bg-white border border-neutral-100 rounded-2xl shadow-soft px-5 py-3.5 print:hidden">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-neutral-400 shrink-0">
              <SparklesIcon className="h-3.5 w-3.5 text-accent-500" />
              <span className="text-xs font-semibold uppercase tracking-widest">Highlights</span>
            </div>
            <span className="text-neutral-200 hidden sm:block">|</span>
            {revGrowth != null && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-neutral-400">Revenue</span>
                <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${revGrowth >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                  {revGrowth >= 0 ? <ArrowTrendingUpIcon className="h-3 w-3" /> : <ArrowTrendingDownIcon className="h-3 w-3" />}
                  {Math.abs(revGrowth)}%
                </span>
              </div>
            )}
            {ordGrowth != null && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-neutral-400">Orders</span>
                <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${ordGrowth >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                  {ordGrowth >= 0 ? <ArrowTrendingUpIcon className="h-3 w-3" /> : <ArrowTrendingDownIcon className="h-3 w-3" />}
                  {Math.abs(ordGrowth)}%
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-400">Completion</span>
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                parseFloat(compRate) >= 70 ? 'bg-emerald-50 text-emerald-700'
                : parseFloat(compRate) >= 50 ? 'bg-amber-50 text-amber-700'
                : 'bg-rose-50 text-rose-600'
              }`}>{compRate}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-400">Daily avg</span>
              <span className="text-xs font-semibold text-primary-800">{fmtK(dailyAvg)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Overview</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={CurrencyDollarIcon} label="Total Revenue"
            value={fmtK(salesReport?.totalRevenue || 0)}
            sub={revGrowth != null ? `${Math.abs(revGrowth)}% vs prev` : null}
            subUp={revGrowth >= 0}
            topAccent="border-t-[3px] border-t-blue-500"
            iconBg="bg-blue-50" iconColor="text-blue-600"
          />
          <StatCard
            icon={ShoppingCartIcon} label="Total Orders"
            value={total}
            sub={ordGrowth != null ? `${Math.abs(ordGrowth)}% vs prev` : null}
            subUp={ordGrowth >= 0}
            topAccent="border-t-[3px] border-t-violet-500"
            iconBg="bg-violet-50" iconColor="text-violet-600"
          />
          <StatCard
            icon={CheckCircleIcon} label="Completed"
            value={completed}
            sub={`${compRate}% rate`}
            subUp={parseFloat(compRate) >= 50}
            topAccent="border-t-[3px] border-t-emerald-500"
            iconBg="bg-emerald-50" iconColor="text-emerald-600"
          />
          <StatCard
            icon={XCircleIcon} label="Cancelled"
            value={cancelled}
            sub={`${cancelRate}% rate`}
            subUp={false}
            topAccent="border-t-[3px] border-t-rose-500"
            iconBg="bg-rose-50" iconColor="text-rose-600"
          />
        </div>
      </div>

      {/* ── Revenue / Orders chart ─────────────────────────────────────────── */}
      {salesReport?.dailyData?.length > 0 && (
        <div>
          <SectionLabel>Performance Trend</SectionLabel>
          <Card>
            <CardHeader
              title="Daily Performance"
              subtitle={`Revenue and order volume · ${rangeLong}`}
              right={
                <div className="flex items-center bg-neutral-100 rounded-lg p-1 gap-0.5">
                  {['revenue', 'orders'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveChart(tab)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        activeChart === tab ? 'bg-white text-primary-800 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'
                      }`}
                    >
                      {tab === 'revenue' ? 'Revenue' : 'Orders'}
                    </button>
                  ))}
                </div>
              }
            />
            <div className="h-64 px-5 pt-5 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                {activeChart === 'revenue' ? (
                  <AreaChart data={salesReport.dailyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={fmtDate} {...axisProps} interval={Math.max(0, Math.floor(salesReport.dailyData.length / 7))} />
                    <YAxis tickFormatter={fmtK} {...axisProps} width={52} />
                    <Tooltip content={<RevenueTooltip />} cursor={{ stroke: '#e5e5e5', strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="revenue" name="revenue" stroke="#3b82f6" strokeWidth={1.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                ) : (
                  <BarChart data={salesReport.dailyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={fmtDate} {...axisProps} interval={Math.max(0, Math.floor(salesReport.dailyData.length / 7))} />
                    <YAxis {...axisProps} allowDecimals={false} width={36} />
                    <Tooltip content={<RevenueTooltip />} cursor={{ fill: '#f5f5f5' }} />
                    <Bar dataKey="orders" name="orders" fill="#8b5cf6" radius={[3, 3, 0, 0]} maxBarSize={28} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* ── Order status + Revenue breakdown ──────────────────────────────── */}
      <div>
        <SectionLabel>Breakdown</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Donut + legend */}
          <Card>
            <CardHeader title="Orders by Status" subtitle={`${total} total orders · ${rangeLong}`} />
            <div className="p-6">
              {pieData.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Donut */}
                  <div className="w-40 h-40 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={44} outerRadius={66} paddingAngle={3} dataKey="value" stroke="none">
                          {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="flex-1 w-full min-w-0 space-y-2">
                    {(salesReport?.ordersByStatus ?? [])
                      .slice().sort((a, b) => b._count - a._count)
                      .map(item => {
                        const color = STATUS_COLORS[item.status] ?? '#94a3b8'
                        const pct   = total > 0 ? ((item._count / total) * 100).toFixed(0) : 0
                        return (
                          <div key={item.status}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                <span className="text-xs font-medium text-neutral-700 truncate">{titleCase(item.status)}</span>
                              </div>
                              <span className="text-xs text-neutral-400 tabular-nums ml-2 shrink-0">
                                {item._count} <span className="opacity-60">({pct}%)</span>
                              </span>
                            </div>
                            <Bar2 pct={pct} color={color} />
                          </div>
                        )
                      })}
                  </div>
                </div>
              ) : <EmptyState />}
            </div>
          </Card>

          {/* Revenue metrics */}
          <Card>
            <CardHeader title="Revenue Summary" subtitle="Key revenue metrics for the selected period" />
            <div className="p-6 space-y-3">
              {[
                { label: 'Avg Order Value',      value: fmt(salesReport?.averageOrderValue),  color: '#3b82f6', Icon: ChartBarIcon },
                { label: 'Completed Revenue',    value: fmt(salesReport?.completedRevenue),   color: '#10b981', Icon: CheckCircleIcon },
                { label: 'Pending Revenue',      value: fmt(salesReport?.pendingRevenue),     color: '#f59e0b', Icon: CalendarDaysIcon },
                { label: 'Revenue per Day (avg)', value: fmtK(dailyAvg),                      color: '#8b5cf6', Icon: ArrowTrendingUpIcon },
              ].map(({ label, value, color, Icon }) => (
                <div key={label} className="flex items-center gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                  <div className="rounded-xl p-2.5 shrink-0" style={{ backgroundColor: `${color}18` }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-500 leading-tight">{label}</p>
                    <p className="text-base font-bold text-primary-900 tabular-nums leading-tight mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Top products table ─────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Top Selling Products</SectionLabel>
        <Card>
          <CardHeader
            title="Best Performers"
            subtitle={`Top ${productReport?.topProducts?.length || 0} products by revenue · ${rangeLong}`}
          />
          <div className="overflow-x-auto">
            <table className="admin-table w-full">
              <thead>
                <tr>
                  <th className="w-12 text-center">Rank</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="text-right">Units</th>
                  <th className="text-right">Revenue</th>
                  <th className="text-right pr-6">Share</th>
                </tr>
              </thead>
              <tbody>
                {productReport?.topProducts?.map((p, i) => {
                  const maxRev  = productReport.topProducts[0]?.totalRevenue || 1
                  const share   = ((p.totalRevenue / maxRev) * 100).toFixed(0)
                  const rankCls = i === 0 ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                                : i === 1 ? 'bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200'
                                : i === 2 ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200'
                                :           'bg-neutral-50 text-neutral-400'
                  return (
                    <tr key={p.id} className="table-row-hover">
                      <td className="text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${rankCls}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          {p.imageUrl
                            ? <img src={getImageUrl(p.imageUrl)} alt={p.name} className="w-9 h-9 rounded-lg object-cover border border-neutral-200 shrink-0" />
                            : <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 text-xs font-bold shrink-0">{(p.name || '?')[0].toUpperCase()}</div>
                          }
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">{p.name}</p>
                            <p className="text-xs text-neutral-400 font-mono leading-tight">{p.sku || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-neutral-100 text-neutral-600 border-0 text-xs">
                          {p.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="text-right tabular-nums">
                        <span className="text-sm font-semibold text-neutral-900">{p.totalSold || 0}</span>
                        <span className="text-xs text-neutral-400 ml-1">units</span>
                      </td>
                      <td className="text-right tabular-nums">
                        <span className="text-sm font-semibold text-emerald-600">{fmt(p.totalRevenue)}</span>
                      </td>
                      <td className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${share}%` }} />
                          </div>
                          <span className="text-xs text-neutral-400 w-8 text-right tabular-nums">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {(!productReport?.topProducts?.length) && (
                  <tr><td colSpan={6}><EmptyState message="No product data available for this period" /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ── Category performance ───────────────────────────────────────────── */}
      <div>
        <SectionLabel>Category Performance</SectionLabel>
        {(() => {
          const cats = (productReport?.categoryStats ?? [])
            .filter(c => c.totalRevenue > 0 || c.totalSold > 0)
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
          const maxRev = Math.max(...cats.map(c => c.totalRevenue), 1)

          if (!cats.length) return <Card><EmptyState message="No category data available for this period" /></Card>

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cats.map((cat, i) => {
                const pct   = (cat.totalRevenue / maxRev) * 100
                const color = CHART_COLORS[i % CHART_COLORS.length]
                return (
                  <div
                    key={cat.id}
                    className={`bg-white rounded-2xl shadow-soft border border-neutral-100 p-5 hover:shadow-soft-lg transition-shadow duration-200 stagger-${Math.min(i + 1, 8)}`}
                    style={{ borderTop: `3px solid ${color}` }}
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className="text-lg leading-none shrink-0">{cat.icon || '📦'}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate leading-tight">{cat.name}</p>
                        <p className="text-xs text-neutral-400 leading-tight">{cat.productCount} product{cat.productCount !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-neutral-400">Revenue share</span>
                        <span className="text-xs font-semibold tabular-nums" style={{ color }}>{pct.toFixed(0)}%</span>
                      </div>
                      <Bar2 pct={pct} color={color} />
                    </div>
                    <div className="flex items-end justify-between pt-3 border-t border-neutral-100">
                      <div>
                        <p className="text-xs text-neutral-400 leading-tight">Units Sold</p>
                        <p className="text-sm font-bold text-neutral-800 tabular-nums">{cat.totalSold}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-neutral-400 leading-tight">Revenue</p>
                        <p className="text-sm font-bold text-emerald-600 tabular-nums">{fmtK(cat.totalRevenue)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>

    </div>
  )
}
