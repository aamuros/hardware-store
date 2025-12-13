import { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ShoppingCartIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const [salesReport, setSalesReport] = useState(null)
  const [productReport, setProductReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30') // days

  useEffect(() => {
    fetchReports()
  }, [dateRange])

  const fetchReports = async () => {
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
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount || 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-800"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Reports & Analytics</h1>
          <p className="text-neutral-500">View sales and product performance data</p>
        </div>
        
        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-neutral-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input py-2"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Sales Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Total Revenue</p>
              <p className="text-2xl font-bold text-primary-900">
                {formatCurrency(salesReport?.totalRevenue)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Total Orders</p>
              <p className="text-2xl font-bold text-primary-900">
                {salesReport?.totalOrders || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingCartIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Completed Orders</p>
              <p className="text-2xl font-bold text-primary-900">
                {salesReport?.completedOrders || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Cancelled Orders</p>
              <p className="text-2xl font-bold text-primary-900">
                {salesReport?.cancelledOrders || 0}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Orders by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Orders by Status</h2>
          <div className="space-y-3">
            {salesReport?.ordersByStatus?.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`badge-${item.status?.toLowerCase() || 'pending'}`}>
                    {item.status || 'Unknown'}
                  </span>
                </div>
                <span className="font-medium text-primary-900">{item._count || 0}</span>
              </div>
            ))}
            {(!salesReport?.ordersByStatus || salesReport.ordersByStatus.length === 0) && (
              <p className="text-neutral-500 text-center py-4">No order data available</p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-primary-900 mb-4">Revenue Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-neutral-600">Average Order Value</span>
              <span className="font-medium text-primary-900">
                {formatCurrency(salesReport?.averageOrderValue)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-neutral-600">Completed Revenue</span>
              <span className="font-medium text-green-600">
                {formatCurrency(salesReport?.completedRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-neutral-600">Pending Revenue</span>
              <span className="font-medium text-yellow-600">
                {formatCurrency(salesReport?.pendingRevenue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">
          <ChartBarIcon className="h-5 w-5 inline-block mr-2" />
          Top Selling Products
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Units Sold
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {productReport?.topProducts?.map((product, index) => (
                <tr key={product.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-neutral-100 text-neutral-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-neutral-50 text-neutral-600'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.imageUrl && (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-primary-900">{product.name}</p>
                        <p className="text-sm text-neutral-500">{product.sku || 'No SKU'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-500">
                    {product.category?.name || 'Uncategorized'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right font-medium">
                    {product.totalSold || 0}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right font-medium text-green-600">
                    {formatCurrency(product.totalRevenue)}
                  </td>
                </tr>
              ))}
              {(!productReport?.topProducts || productReport.topProducts.length === 0) && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-neutral-500">
                    No product data available for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Performance */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">Category Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {productReport?.categoryStats?.map((category) => (
            <div key={category.id} className="p-4 bg-neutral-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{category.icon || '📦'}</span>
                <h3 className="font-medium text-primary-900">{category.name}</h3>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-neutral-600">
                  Products: <span className="font-medium">{category.productCount || 0}</span>
                </p>
                <p className="text-neutral-600">
                  Units Sold: <span className="font-medium">{category.totalSold || 0}</span>
                </p>
                <p className="text-green-600 font-medium">
                  {formatCurrency(category.totalRevenue)}
                </p>
              </div>
            </div>
          ))}
          {(!productReport?.categoryStats || productReport.categoryStats.length === 0) && (
            <div className="col-span-full text-center text-neutral-500 py-4">
              No category data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
