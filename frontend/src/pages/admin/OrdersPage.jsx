import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { adminApi } from '../../services/api'
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  XMarkIcon,
  ChevronDownIcon,
  ShoppingBagIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'


// ─── Constants ───────────────────────────────────────────────────────────────

const ORDER_STATUSES = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected', label: 'Rejected' },
]

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toLocalDateString = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const DATE_PRESETS = [
  {
    label: 'Today',
    getRange: () => {
      const today = toLocalDateString(new Date())
      return { start: today, end: today }
    },
  },
  {
    label: 'Yesterday',
    getRange: () => {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      const s = toLocalDateString(d)
      return { start: s, end: s }
    },
  },
  {
    label: 'Last 7 Days',
    getRange: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 6)
      return { start: toLocalDateString(start), end: toLocalDateString(end) }
    },
  },
  {
    label: 'Last 30 Days',
    getRange: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 29)
      return { start: toLocalDateString(start), end: toLocalDateString(end) }
    },
  },
  {
    label: 'This Month',
    getRange: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: toLocalDateString(start), end: toLocalDateString(now) }
    },
  },
  {
    label: 'Last Month',
    getRange: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return { start: toLocalDateString(start), end: toLocalDateString(end) }
    },
  },
]

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTableDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getPageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  pages.push(1)
  if (current > 3) pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i)
  }
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

// ─── DateRangePicker ─────────────────────────────────────────────────────────

function DateRangePicker({ startDate, endDate, onApply, onClear }) {
  const [open, setOpen] = useState(false)
  const [localStart, setLocalStart] = useState(startDate)
  const [localEnd, setLocalEnd] = useState(endDate)
  const [activePreset, setActivePreset] = useState(null)
  const panelRef = useRef(null)
  const triggerRef = useRef(null)

  // Sync local state when external values change (e.g. on clear via chip)
  useEffect(() => {
    setLocalStart(startDate)
    setLocalEnd(endDate)
  }, [startDate, endDate])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handlePreset = (preset) => {
    const { start, end } = preset.getRange()
    setLocalStart(start)
    setLocalEnd(end)
    setActivePreset(preset.label)
  }

  const handleApply = () => {
    onApply(localStart, localEnd)
    setOpen(false)
  }

  const handleClear = () => {
    setLocalStart('')
    setLocalEnd('')
    setActivePreset(null)
    onClear()
    setOpen(false)
  }

  const handleOpen = () => {
    setLocalStart(startDate)
    setLocalEnd(endDate)
    setActivePreset(null)
    setOpen(true)
  }

  const hasValue = startDate || endDate
  const displayLabel = hasValue
    ? startDate === endDate && startDate
      ? formatDisplayDate(startDate)
      : `${startDate ? formatDisplayDate(startDate) : 'Start'} → ${endDate ? formatDisplayDate(endDate) : 'End'}`
    : 'Date Range'

  const today = toLocalDateString(new Date())

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={`
          inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium
          transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30
          ${hasValue
            ? 'bg-accent-50 border-accent-300 text-accent-800 hover:bg-accent-100'
            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300'
          }
        `}
      >
        <CalendarDaysIcon className={`h-4 w-4 ${hasValue ? 'text-accent-600' : 'text-neutral-400'}`} />
        <span className="max-w-[220px] truncate">{displayLabel}</span>
        {hasValue ? (
          <XMarkIcon
            className="h-3.5 w-3.5 text-accent-500 hover:text-accent-700 ml-0.5 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              handleClear()
            }}
          />
        ) : (
          <ChevronDownIcon className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
        )}
      </button>

      {/* Dropdown Panel — right-aligned so it doesn't clip the viewport */}
      {open && (
        <div
          ref={panelRef}
          className="absolute top-full mt-2 right-0 z-50 bg-white rounded-2xl shadow-soft-lg border border-neutral-200 w-[340px] animate-scale-in origin-top-right"
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="h-4 w-4 text-accent-500" />
              <h3 className="text-sm font-semibold text-primary-900">Filter by Date</h3>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-neutral-400 hover:text-neutral-600 transition-colors rounded-lg p-0.5"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Presets — 3 columns so all 6 are visible */}
          <div className="p-3 border-b border-neutral-100">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-2 px-0.5">
              Quick Select
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePreset(preset)}
                  className={`
                    px-2 py-2 rounded-xl text-xs font-medium text-center leading-tight transition-all duration-100
                    ${activePreset === preset.label
                      ? 'bg-primary-800 text-white shadow-sm ring-1 ring-primary-700'
                      : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
                    }
                  `}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom date inputs — side-by-side */}
          <div className="p-3 space-y-2.5">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest px-0.5">
              Custom Range
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5 font-medium">From</label>
                <input
                  type="date"
                  value={localStart}
                  max={localEnd || today}
                  onChange={(e) => {
                    setLocalStart(e.target.value)
                    setActivePreset(null)
                  }}
                  className="input py-2 text-sm w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5 font-medium">To</label>
                <input
                  type="date"
                  value={localEnd}
                  min={localStart || undefined}
                  max={today}
                  onChange={(e) => {
                    setLocalEnd(e.target.value)
                    setActivePreset(null)
                  }}
                  className="input py-2 text-sm w-full"
                />
              </div>
            </div>

            {/* Live range summary */}
            {(localStart || localEnd) && (
              <div className="flex items-center gap-2 bg-accent-50 border border-accent-200 rounded-xl px-3 py-2">
                <CalendarDaysIcon className="h-3.5 w-3.5 text-accent-600 flex-shrink-0" />
                <span className="text-xs font-medium text-accent-800 truncate">
                  {localStart && localEnd
                    ? localStart === localEnd
                      ? formatDisplayDate(localStart)
                      : `${formatDisplayDate(localStart)} – ${formatDisplayDate(localEnd)}`
                    : localStart
                      ? `From ${formatDisplayDate(localStart)}`
                      : `Until ${formatDisplayDate(localEnd)}`}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="px-3 pb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={!localStart && !localEnd}
              className="btn btn-primary btn-sm flex-1 disabled:opacity-40"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="btn btn-secondary btn-sm px-4"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [searchInput, setSearchInput] = useState('')

  const statusFilter = searchParams.get('status') || ''
  const searchQuery = searchParams.get('search') || ''
  const currentPage = parseInt(searchParams.get('page')) || 1
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''

  // Sync search input with URL
  useEffect(() => {
    setSearchInput(searchQuery)
  }, [searchQuery])

  useEffect(() => {
    fetchOrders()
  }, [statusFilter, searchQuery, currentPage, startDate, endDate])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = { page: currentPage, limit: 10 }
      if (statusFilter) params.status = statusFilter
      if (searchQuery) params.search = searchQuery
      if (startDate) params.startDate = startDate
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        params.endDate = end.toISOString()
      }
      const response = await adminApi.getOrders(params)
      setOrders(response.data.data)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateParams = useCallback((updates, resetPage = true) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    if (resetPage) params.delete('page')
    setSearchParams(params)
  }, [searchParams, setSearchParams])

  const handleStatusFilter = (status) => updateParams({ status })
  const handlePageChange = (newPage) => updateParams({ page: newPage.toString() }, false)
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    updateParams({ search: searchInput })
  }
  const handleDateApply = (start, end) => updateParams({ startDate: start, endDate: end })
  const handleDateClear = () => updateParams({ startDate: '', endDate: '' })

  const hasDateFilter = startDate || endDate
  const hasAnyFilter = statusFilter || searchQuery || hasDateFilter
  const clearAllFilters = () => {
    setSearchInput('')
    setSearchParams(new URLSearchParams())
  }

  const pageNumbers = getPageNumbers(currentPage, pagination.totalPages)

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Manage and process customer orders</p>
        </div>
        {!loading && (
          <div className="hidden sm:flex items-center gap-2 bg-white rounded-xl border border-neutral-200 shadow-soft px-4 py-2.5">
            <ShoppingBagIcon className="h-4 w-4 text-neutral-400" />
            <span className="text-sm text-neutral-600">
              <span className="font-semibold text-primary-900">{pagination.total}</span> order{pagination.total !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* ── Filters Card ── */}
      <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-4 space-y-4">

        {/* Row 1: Search + Date Range */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-0">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search orders or customer name…"
                className="input pl-9 pr-4 py-2.5 text-sm w-full"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('')
                    updateParams({ search: '' })
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>

          {/* Date Range Picker */}
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onApply={handleDateApply}
            onClear={handleDateClear}
          />
        </div>

        {/* Row 2: Status tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {ORDER_STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => handleStatusFilter(s.value)}
              className={`
                flex-shrink-0 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30
                ${statusFilter === s.value
                  ? 'bg-primary-800 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }
              `}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Active filter chips */}
        {hasAnyFilter && (
          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            <span className="text-xs text-neutral-400 font-medium">Active filters:</span>
            {statusFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-xs font-medium">
                Status: {ORDER_STATUSES.find((s) => s.value === statusFilter)?.label}
                <button onClick={() => updateParams({ status: '' })}>
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-xs font-medium">
                Search: "{searchQuery}"
                <button onClick={() => { setSearchInput(''); updateParams({ search: '' }) }}>
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {hasDateFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent-50 text-accent-700 border border-accent-200 rounded-lg text-xs font-medium">
                <CalendarDaysIcon className="h-3 w-3" />
                {startDate && endDate
                  ? startDate === endDate
                    ? formatDisplayDate(startDate)
                    : `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`
                  : startDate
                    ? `From ${formatDisplayDate(startDate)}`
                    : `Until ${formatDisplayDate(endDate)}`}
                <button onClick={handleDateClear}>
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs text-neutral-400 hover:text-red-500 transition-colors ml-1 underline underline-offset-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Orders Table ── */}
      <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="spinner" />
              <p className="text-sm text-neutral-400">Loading orders…</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4">
              <ShoppingBagIcon className="h-7 w-7 text-neutral-400" />
            </div>
            <h3 className="text-base font-semibold text-neutral-700 mb-1">No orders found</h3>
            <p className="text-sm text-neutral-400 max-w-sm">
              {hasAnyFilter
                ? 'Try adjusting your filters or date range to find what you\'re looking for.'
                : 'Orders will appear here once customers start placing them.'}
            </p>
            {hasAnyFilter && (
              <button
                onClick={clearAllFilters}
                className="mt-4 btn btn-secondary btn-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/60">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Order</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Customer</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Items</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="group hover:bg-neutral-50/60 transition-colors duration-100"
                    >
                      {/* Order # */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-primary-900 font-mono">
                          #{order.orderNumber}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 uppercase">
                            {(order.customerName || '?')[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-primary-900 truncate max-w-[160px]">
                              {order.customerName}
                            </div>
                            <div className="text-xs text-neutral-400 truncate max-w-[160px]">
                              {order.phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-sm text-neutral-500">
                          {order._count?.items || order.items?.length || 0}
                          <span className="text-neutral-400">item{(order._count?.items || order.items?.length || 0) !== 1 ? 's' : ''}</span>
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-primary-900">
                          ₱{Number(order.totalAmount).toLocaleString()}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`${statusColors[order.status] || 'badge bg-neutral-50 text-neutral-600 border border-neutral-200'} capitalize`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                          <ClockIcon className="h-3.5 w-3.5 text-neutral-300 flex-shrink-0" />
                          {formatTableDate(order.createdAt)}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:text-accent-700 group-hover:underline underline-offset-2 transition-colors"
                        >
                          View
                          <ChevronRightIcon className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            {pagination.totalPages > 1 && (
              <div className="px-5 py-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-neutral-500 order-2 sm:order-1">
                  Page <span className="font-medium text-primary-900">{pagination.page}</span> of{' '}
                  <span className="font-medium text-primary-900">{pagination.totalPages}</span>
                  {' '}·{' '}
                  <span className="font-medium text-primary-900">{pagination.total}</span> total orders
                </p>
                <nav className="flex items-center gap-1 order-1 sm:order-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  {pageNumbers.map((p, idx) =>
                    p === '...'
                      ? (
                        <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-neutral-400 text-sm">
                          …
                        </span>
                      )
                      : (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={`
                            inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-colors
                            ${currentPage === p
                              ? 'bg-primary-800 text-white border border-primary-800 shadow-sm'
                              : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                            }
                          `}
                        >
                          {p}
                        </button>
                      )
                  )}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
