import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { orderApi, customerApi } from '../../services/api'
import { 
  SearchIcon,
  StatusPendingIcon,
  StatusAcceptedIcon,
  StatusRejectedIcon,
  StatusPreparingIcon,
  StatusDeliveryIcon,
  StatusDeliveredIcon,
  StatusCompletedIcon,
  StatusCancelledIcon
} from '../../components/icons'

const STATUS_INFO = {
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border border-amber-200', Icon: StatusPendingIcon },
  accepted: { label: 'Accepted', color: 'bg-blue-50 text-blue-700 border border-blue-200', Icon: StatusAcceptedIcon },
  rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 border border-red-200', Icon: StatusRejectedIcon },
  preparing: { label: 'Preparing', color: 'bg-violet-50 text-violet-700 border border-violet-200', Icon: StatusPreparingIcon },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-accent-50 text-accent-700 border border-accent-200', Icon: StatusDeliveryIcon },
  delivered: { label: 'Delivered', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', Icon: StatusDeliveredIcon },
  completed: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', Icon: StatusCompletedIcon },
  cancelled: { label: 'Cancelled', color: 'bg-neutral-100 text-neutral-700 border border-neutral-200', Icon: StatusCancelledIcon },
}

export default function TrackOrderPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

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

  const getRejectionReason = () => {
    if (!order?.statusHistory) return null
    const rejectionEntry = order.statusHistory.find(
      (h) => h.toStatus === 'rejected' || h.toStatus === 'cancelled'
    )
    return rejectionEntry?.notes || null
  }

  const isCustomerLoggedIn = !!localStorage.getItem('customer-token')

  const handleCancelOrder = async () => {
    setCancelling(true)
    try {
      await customerApi.cancelOrder(order.orderNumber)
      setShowCancelConfirm(false)
      // Refresh order data
      const response = await orderApi.track(order.orderNumber)
      setOrder(response.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-primary-900 mb-8 text-center">Track Your Order</h1>

      {/* Search Form */}
      <form onSubmit={handleTrack} className="mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="h-5 w-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter your order number (e.g., ORD-260212-52418)"
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
                <p className="text-sm text-neutral-500">Order Number</p>
                <p className="text-xl font-bold text-primary-900">{order.orderNumber}</p>
              </div>
              <span className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${statusInfo.color}`}>
                <statusInfo.Icon className="w-4 h-4" />
                {statusInfo.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-neutral-500">Order Date</p>
                <p className="font-medium text-primary-900">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-neutral-500">Last Updated</p>
                <p className="font-medium text-primary-900">{formatDate(order.updatedAt)}</p>
              </div>
            </div>

            {/* Rejection / Cancellation Reason */}
            {(order.status === 'rejected' || order.status === 'cancelled') && getRejectionReason() && (
              <div className={`mt-4 p-4 rounded-xl ${order.status === 'rejected' ? 'bg-red-50 border border-red-200' : 'bg-neutral-50 border border-neutral-200'}`}>
                <p className={`text-sm font-medium ${order.status === 'rejected' ? 'text-red-800' : 'text-neutral-800'}`}>
                  {order.status === 'rejected' ? 'Reason for Rejection' : 'Cancellation Note'}
                </p>
                <p className={`text-sm mt-1 ${order.status === 'rejected' ? 'text-red-700' : 'text-neutral-700'}`}>
                  {getRejectionReason()}
                </p>
              </div>
            )}

            {/* Cancel Order Button */}
            {order.status === 'pending' && isCustomerLoggedIn && (
              <div className="mt-4">
                {showCancelConfirm ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-800 font-medium mb-3">Are you sure you want to cancel this order?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelOrder}
                        disabled={cancelling}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                      >
                        {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        disabled={cancelling}
                        className="px-4 py-2 bg-white border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-50"
                      >
                        No, Keep Order
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Status Timeline */}
          <div className="card p-6 mb-6">
            <h2 className="font-bold text-primary-900 mb-4">Order Status</h2>
            <div className="space-y-4">
              {['pending', 'accepted', 'preparing', 'out_for_delivery', 'completed'].map((status, index) => {
                const info = STATUS_INFO[status]
                const StatusIcon = info.Icon
                const statusOrder = ['pending', 'accepted', 'preparing', 'out_for_delivery', 'completed']
                const currentIndex = statusOrder.indexOf(order.status)
                const isActive = index <= currentIndex && !['rejected', 'cancelled'].includes(order.status)
                const isCurrent = status === order.status
                
                return (
                  <div key={status} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      isActive ? 'bg-primary-800 text-white' : 'bg-neutral-200 text-neutral-400'
                    } ${isCurrent ? 'ring-4 ring-primary-100' : ''}`}>
                      {isActive ? <StatusIcon className="w-4 h-4" /> : (index + 1)}
                    </div>
                    <div className={isActive ? 'text-primary-900' : 'text-neutral-400'}>
                      <p className="font-medium">{info.label}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Order Items */}
          <div className="card p-6">
            <h2 className="font-bold text-primary-900 mb-4">Order Items</h2>
            <div className="space-y-3">
              {order.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
                  <div>
                    <p className="font-medium text-primary-900">{item.product?.name || 'Product'}</p>
                    <p className="text-sm text-neutral-500">
                      {item.quantity} {item.product?.unit || 'unit'} × {formatPrice(item.unitPrice)}
                    </p>
                  </div>
                  <p className="font-bold text-primary-800">{formatPrice(item.subtotal)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-200 flex justify-between">
              <span className="font-bold text-primary-900">Total</span>
              <span className="text-xl font-bold text-primary-800">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      {!order && !loading && (
        <div className="text-center text-neutral-500 mt-8">
          <p className="mb-2">Your order number was sent via SMS when you placed your order.</p>
          <p>Example format: ORD-260212-52418</p>
        </div>
      )}
    </div>
  )
}
