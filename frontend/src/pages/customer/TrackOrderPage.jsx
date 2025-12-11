import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { orderApi } from '../../services/api'

const STATUS_INFO = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  accepted: { label: 'Accepted', color: 'bg-blue-100 text-blue-800', icon: '✅' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: '❌' },
  preparing: { label: 'Preparing', color: 'bg-purple-100 text-purple-800', icon: '🔧' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-800', icon: '🚚' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: '📦' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: '✨' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: '🚫' },
}

export default function TrackOrderPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (searchParams.get('order')) {
      handleTrack()
    }
  }, [])

  const handleTrack = async (e) => {
    if (e) e.preventDefault()
    
    if (!orderNumber.trim()) {
      setError('Please enter an order number')
      return
    }

    setLoading(true)
    setError('')
    setOrder(null)

    try {
      const response = await orderApi.track(orderNumber.trim())
      setOrder(response.data.data)
      setSearchParams({ order: orderNumber.trim() })
    } catch (err) {
      console.error('Track order error:', err)
      setError(err.response?.data?.message || 'Order not found. Please check the order number.')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const statusInfo = order ? STATUS_INFO[order.status] || STATUS_INFO.pending : null

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Track Your Order</h1>

      {/* Search Form */}
      <form onSubmit={handleTrack} className="mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter your order number (e.g., HW-20241211-0001)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="input pl-10"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Searching...' : 'Track'}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </form>

      {/* Order Details */}
      {order && (
        <div className="animate-fade-in">
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="text-xl font-bold text-gray-900">{order.orderNumber}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.icon} {statusInfo.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Order Date</p>
                <p className="font-medium">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p className="font-medium">{formatDate(order.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="card p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-4">Order Status</h2>
            <div className="space-y-4">
              {['pending', 'accepted', 'preparing', 'out_for_delivery', 'completed'].map((status, index) => {
                const info = STATUS_INFO[status]
                const statusOrder = ['pending', 'accepted', 'preparing', 'out_for_delivery', 'completed']
                const currentIndex = statusOrder.indexOf(order.status)
                const isActive = index <= currentIndex && !['rejected', 'cancelled'].includes(order.status)
                const isCurrent = status === order.status
                
                return (
                  <div key={status} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      isActive ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'
                    } ${isCurrent ? 'ring-4 ring-primary-100' : ''}`}>
                      {isActive ? info.icon : (index + 1)}
                    </div>
                    <div className={isActive ? 'text-gray-900' : 'text-gray-400'}>
                      <p className="font-medium">{info.label}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Order Items */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-3">
              {order.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.product?.name || 'Product'}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} {item.product?.unit || 'unit'} × {formatPrice(item.unitPrice)}
                    </p>
                  </div>
                  <p className="font-bold text-gray-900">{formatPrice(item.subtotal)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-primary-600">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      {!order && !loading && (
        <div className="text-center text-gray-500 mt-8">
          <p className="mb-2">Your order number was sent via SMS when you placed your order.</p>
          <p>Example format: HW-20241211-0001</p>
        </div>
      )}
    </div>
  )
}
