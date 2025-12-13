import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { adminApi } from '../../services/api'
import {
  ArrowLeftIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
} from '@heroicons/react/24/outline'

const ORDER_STATUSES = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: 'Accepted', color: 'bg-blue-100 text-blue-800' },
  preparing: { label: 'Preparing', color: 'bg-purple-100 text-purple-800' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-800' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
}

const STATUS_TRANSITIONS = {
  pending: ['accepted', 'rejected'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: ['completed'],
  completed: [],
  cancelled: [],
  rejected: [],
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetchOrder()
  }, [id])

  const fetchOrder = async () => {
    try {
      const response = await adminApi.getOrder(id)
      setOrder(response.data.data)
    } catch (err) {
      setError('Failed to load order details')
      console.error('Error fetching order:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus, message = '') => {
    setUpdating(true)
    try {
      await adminApi.updateOrderStatus(id, newStatus, message)
      await fetchOrder() // Refresh order data
      setShowRejectModal(false)
      setRejectReason('')
    } catch (err) {
      setError('Failed to update order status')
      console.error('Error updating status:', err)
    } finally {
      setUpdating(false)
    }
  }

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }
    handleStatusUpdate('rejected', rejectReason)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-PH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-800"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error || 'Order not found'}
        <Link to="/admin/orders" className="ml-4 underline">
          Back to Orders
        </Link>
      </div>
    )
  }

  const availableTransitions = STATUS_TRANSITIONS[order.status] || []
  const statusInfo = ORDER_STATUSES[order.status] || { label: order.status, color: 'bg-neutral-100 text-neutral-800' }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/orders')}
            className="p-2 hover:bg-neutral-100 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5 text-neutral-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-primary-900">
              Order #{order.orderNumber}
            </h1>
            <p className="text-neutral-600">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Status Update Actions */}
      {availableTransitions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-soft p-4">
          <h3 className="text-sm font-medium text-primary-700 mb-3">Update Order Status</h3>
          <div className="flex flex-wrap gap-3">
            {availableTransitions.includes('accepted') && (
              <button
                onClick={() => handleStatusUpdate('accepted')}
                disabled={updating}
                className="btn btn-primary flex items-center gap-2"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Accept Order
              </button>
            )}
            {availableTransitions.includes('rejected') && (
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={updating}
                className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
              >
                <XCircleIcon className="h-5 w-5" />
                Reject Order
              </button>
            )}
            {availableTransitions.includes('preparing') && (
              <button
                onClick={() => handleStatusUpdate('preparing')}
                disabled={updating}
                className="btn btn-primary"
              >
                Start Preparing
              </button>
            )}
            {availableTransitions.includes('out_for_delivery') && (
              <button
                onClick={() => handleStatusUpdate('out_for_delivery')}
                disabled={updating}
                className="btn btn-primary flex items-center gap-2"
              >
                <TruckIcon className="h-5 w-5" />
                Out for Delivery
              </button>
            )}
            {availableTransitions.includes('delivered') && (
              <button
                onClick={() => handleStatusUpdate('delivered')}
                disabled={updating}
                className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Mark Delivered
              </button>
            )}
            {availableTransitions.includes('completed') && (
              <button
                onClick={() => handleStatusUpdate('completed')}
                disabled={updating}
                className="btn bg-green-600 text-white hover:bg-green-700"
              >
                Complete Order
              </button>
            )}
            {availableTransitions.includes('cancelled') && (
              <button
                onClick={() => handleStatusUpdate('cancelled')}
                disabled={updating}
                className="btn bg-neutral-600 text-white hover:bg-neutral-700"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-soft">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-primary-900">Order Items</h2>
            </div>
            <div className="divide-y divide-neutral-200">
              {order.items.map((item) => (
                <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                  {item.product?.imageUrl && (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-primary-900">
                      {item.product?.name || 'Product'}
                    </h4>
                    <p className="text-sm text-neutral-500">
                      {item.product?.unit || 'unit'} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary-900">
                      ₱{item.subtotal.toLocaleString()}
                    </p>
                    <p className="text-sm text-neutral-500">
                      @ ₱{item.unitPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 rounded-b-2xl">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span>₱{order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-2xl shadow-soft mt-6 p-6">
              <h3 className="font-semibold text-primary-900 mb-2">Customer Notes</h3>
              <p className="text-neutral-600">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Customer Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h3 className="font-semibold text-primary-900 mb-4">Customer Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-neutral-500">Name</p>
                <p className="font-medium text-primary-900">{order.customerName}</p>
              </div>
              <div className="flex items-start gap-2">
                <PhoneIcon className="h-5 w-5 text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-sm text-neutral-500">Phone</p>
                  <a href={`tel:${order.phone}`} className="font-medium text-accent-600">
                    {order.phone}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h3 className="font-semibold text-primary-900 mb-4">Delivery Address</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPinIcon className="h-5 w-5 text-neutral-400 mt-0.5" />
                <div>
                  <p className="text-primary-900">{order.address}</p>
                  <p className="text-neutral-600">{order.barangay}</p>
                  {order.landmarks && (
                    <p className="text-sm text-neutral-500 mt-1">
                      Landmarks: {order.landmarks}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h3 className="font-semibold text-primary-900 mb-4">Order Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-500">Order Placed</p>
                  <p className="text-primary-900">{formatDate(order.createdAt)}</p>
                </div>
              </div>
              {order.updatedAt !== order.createdAt && (
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-neutral-400" />
                  <div>
                    <p className="text-sm text-neutral-500">Last Updated</p>
                    <p className="text-primary-900">{formatDate(order.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-primary-900/30 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-soft-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">Reject Order</h3>
              <p className="text-neutral-600 mb-4">
                Please provide a reason for rejecting this order. The customer will be notified via SMS.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="input w-full h-24 resize-none"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="btn bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={updating}
                  className="btn bg-red-600 text-white hover:bg-red-700"
                >
                  {updating ? 'Rejecting...' : 'Reject Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
