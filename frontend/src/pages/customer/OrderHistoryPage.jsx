import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { customerApi } from '../../services/api'
import { ClipboardDocumentListIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function OrderHistoryPage() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })

    useEffect(() => {
        loadOrders()
    }, [pagination.page])

    const loadOrders = async () => {
        setLoading(true)
        try {
            const response = await customerApi.getOrders({ page: pagination.page, limit: 10 })
            setOrders(response.data.data.orders)
            setPagination(prev => ({
                ...prev,
                totalPages: response.data.data.pagination.totalPages,
            }))
        } catch (error) {
            console.error('Failed to load orders:', error)
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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            accepted: 'bg-blue-100 text-blue-800',
            preparing: 'bg-purple-100 text-purple-800',
            out_for_delivery: 'bg-indigo-100 text-indigo-800',
            delivered: 'bg-emerald-100 text-emerald-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            rejected: 'bg-red-100 text-red-800',
        }

        const labels = {
            pending: 'Pending',
            accepted: 'Accepted',
            preparing: 'Preparing',
            out_for_delivery: 'Out for Delivery',
            delivered: 'Delivered',
            completed: 'Completed',
            cancelled: 'Cancelled',
            rejected: 'Rejected',
        }

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-neutral-100 text-neutral-800'}`}>
                {labels[status] || status}
            </span>
        )
    }

    if (loading && orders.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-neutral-100 rounded-xl"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/account" className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                    <ArrowLeftIcon className="w-5 h-5 text-neutral-600" />
                </Link>
                <h1 className="text-3xl font-bold text-primary-900">Order History</h1>
            </div>

            {orders.length === 0 ? (
                <div className="card p-12 text-center">
                    <ClipboardDocumentListIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-primary-900 mb-2">No orders yet</h2>
                    <p className="text-neutral-600 mb-6">Start shopping to see your orders here</p>
                    <Link to="/products" className="btn-primary">
                        Browse Products
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <Link
                            key={order.id}
                            to={`/track-order?order=${order.orderNumber}`}
                            className="card p-5 hover:shadow-lg transition-all block"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <span className="font-bold text-primary-900">#{order.orderNumber}</span>
                                    <span className="text-neutral-500 text-sm ml-3">
                                        {formatDate(order.createdAt)}
                                    </span>
                                </div>
                                {getStatusBadge(order.status)}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-neutral-600">
                                    {order._count?.items || 0} item(s)
                                </span>
                                <span className="font-bold text-lg text-primary-800">
                                    {formatPrice(order.totalAmount)}
                                </span>
                            </div>
                        </Link>
                    ))}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center gap-2 pt-4">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 bg-neutral-100 rounded-lg disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-neutral-600">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page === pagination.totalPages}
                                className="px-4 py-2 bg-neutral-100 rounded-lg disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
