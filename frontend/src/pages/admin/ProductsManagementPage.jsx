import { useState, useEffect } from 'react'
import { adminApi, categoryApi, productApi } from '../../services/api'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

export default function ProductsManagementPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    unit: 'piece',
    categoryId: '',
    sku: '',
    stockQuantity: '0',
    lowStockThreshold: '10',
    isAvailable: true,
    hasVariants: false,
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  // Variant management state
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [managingProductVariants, setManagingProductVariants] = useState(null)
  const [variants, setVariants] = useState([])
  const [editingVariant, setEditingVariant] = useState(null)
  const [variantFormData, setVariantFormData] = useState({
    name: '',
    sku: '',
    price: '',
    stockQuantity: '0',
    isAvailable: true,
  })
  const [savingVariant, setSavingVariant] = useState(false)
  const [deletingVariant, setDeletingVariant] = useState(null)

  // Bulk pricing management state
  const [showBulkPricingModal, setShowBulkPricingModal] = useState(false)
  const [managingProductBulkPricing, setManagingProductBulkPricing] = useState(null)
  const [bulkPricingTiers, setBulkPricingTiers] = useState([])
  const [editingTier, setEditingTier] = useState(null)
  const [tierFormData, setTierFormData] = useState({
    minQuantity: '',
    discountType: 'percentage',
    discountValue: '',
  })
  const [savingTier, setSavingTier] = useState(false)
  const [deletingTier, setDeletingTier] = useState(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [categoryFilter, searchQuery, pagination.page])

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAll()
      setCategories(response.data.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.page,
        limit: 10,
      }
      if (categoryFilter) params.category = categoryFilter
      if (searchQuery) params.search = searchQuery

      const response = await productApi.getAll(params)
      setProducts(response.data.data)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        unit: product.unit,
        categoryId: product.categoryId?.toString() || '',
        sku: product.sku || '',
        stockQuantity: (product.stockQuantity || 0).toString(),
        lowStockThreshold: (product.lowStockThreshold || 10).toString(),
        isAvailable: product.isAvailable,
        hasVariants: product.hasVariants || false,
      })
      setImagePreview(product.imageUrl)
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        description: '',
        price: '',
        unit: 'piece',
        categoryId: categories[0]?.id?.toString() || '',
        sku: '',
        stockQuantity: '0',
        lowStockThreshold: '10',
        isAvailable: true,
        hasVariants: false,
      })
      setImagePreview(null)
    }
    setImageFile(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingProduct(null)
    setImageFile(null)
    setImagePreview(null)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const form = new FormData()
      form.append('name', formData.name)
      form.append('description', formData.description)
      form.append('price', parseFloat(formData.price))
      form.append('unit', formData.unit)
      form.append('categoryId', parseInt(formData.categoryId))
      form.append('sku', formData.sku)
      form.append('stockQuantity', parseInt(formData.stockQuantity) || 0)
      form.append('lowStockThreshold', parseInt(formData.lowStockThreshold) || 10)
      form.append('isAvailable', formData.isAvailable)
      form.append('hasVariants', formData.hasVariants)
      if (imageFile) {
        form.append('image', imageFile)
      }

      if (editingProduct) {
        await adminApi.updateProduct(editingProduct.id, form)
      } else {
        await adminApi.createProduct(form)
      }

      closeModal()
      fetchProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Failed to save product. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return

    setDeleting(product.id)
    try {
      await adminApi.deleteProduct(product.id)
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product. It may be referenced by existing orders.')
    } finally {
      setDeleting(null)
    }
  }

  const toggleAvailability = async (product) => {
    try {
      await adminApi.toggleAvailability(product.id, !product.isAvailable)
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, isAvailable: !p.isAvailable } : p
        )
      )
    } catch (error) {
      console.error('Error toggling availability:', error)
    }
  }

  // Variant Management Functions
  const openVariantModal = async (product) => {
    setManagingProductVariants(product)
    setShowVariantModal(true)
    await fetchVariants(product.id)
  }

  const closeVariantModal = () => {
    setShowVariantModal(false)
    setManagingProductVariants(null)
    setVariants([])
    setEditingVariant(null)
    resetVariantForm()
  }

  const fetchVariants = async (productId) => {
    try {
      const response = await productApi.getVariants(productId)
      setVariants(response.data.data || [])
    } catch (error) {
      console.error('Error fetching variants:', error)
      setVariants([])
    }
  }

  const resetVariantForm = () => {
    setVariantFormData({
      name: '',
      sku: '',
      price: '',
      stockQuantity: '0',
      isAvailable: true,
    })
    setEditingVariant(null)
  }

  const handleVariantInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setVariantFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleEditVariant = (variant) => {
    setEditingVariant(variant)
    setVariantFormData({
      name: variant.name,
      sku: variant.sku || '',
      price: variant.price.toString(),
      stockQuantity: variant.stockQuantity.toString(),
      isAvailable: variant.isAvailable,
    })
  }

  const handleVariantSubmit = async (e) => {
    e.preventDefault()
    setSavingVariant(true)

    try {
      const variantData = {
        name: variantFormData.name,
        sku: variantFormData.sku || null,
        price: parseFloat(variantFormData.price),
        stockQuantity: parseInt(variantFormData.stockQuantity) || 0,
        isAvailable: variantFormData.isAvailable,
      }

      if (editingVariant) {
        await adminApi.updateVariant(editingVariant.id, variantData)
      } else {
        await adminApi.createVariant(managingProductVariants.id, variantData)
      }

      await fetchVariants(managingProductVariants.id)
      resetVariantForm()
    } catch (error) {
      console.error('Error saving variant:', error)
      alert('Failed to save variant. Please try again.')
    } finally {
      setSavingVariant(false)
    }
  }

  const handleDeleteVariant = async (variant) => {
    if (!confirm(`Are you sure you want to delete variant "${variant.name}"?`)) return

    setDeletingVariant(variant.id)
    try {
      await adminApi.deleteVariant(variant.id)
      await fetchVariants(managingProductVariants.id)
    } catch (error) {
      console.error('Error deleting variant:', error)
      alert('Failed to delete variant.')
    } finally {
      setDeletingVariant(null)
    }
  }

  // Bulk Pricing Management Functions
  const openBulkPricingModal = async (product) => {
    setManagingProductBulkPricing(product)
    setShowBulkPricingModal(true)
    await fetchBulkPricingTiers(product.id)
  }

  const closeBulkPricingModal = () => {
    setShowBulkPricingModal(false)
    setManagingProductBulkPricing(null)
    setBulkPricingTiers([])
    setEditingTier(null)
    resetTierForm()
  }

  const fetchBulkPricingTiers = async (productId) => {
    try {
      const response = await productApi.getBulkPricing(productId)
      setBulkPricingTiers(response.data.data || [])
    } catch (error) {
      console.error('Error fetching bulk pricing tiers:', error)
      setBulkPricingTiers([])
    }
  }

  const resetTierForm = () => {
    setTierFormData({
      minQuantity: '',
      discountType: 'percentage',
      discountValue: '',
    })
    setEditingTier(null)
  }

  const handleTierInputChange = (e) => {
    const { name, value } = e.target
    setTierFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleEditTier = (tier) => {
    setEditingTier(tier)
    setTierFormData({
      minQuantity: tier.minQuantity.toString(),
      discountType: tier.discountType,
      discountValue: tier.discountValue.toString(),
    })
  }

  const handleTierSubmit = async (e) => {
    e.preventDefault()
    setSavingTier(true)

    try {
      const tierData = {
        minQuantity: parseInt(tierFormData.minQuantity),
        discountType: tierFormData.discountType,
        discountValue: parseFloat(tierFormData.discountValue),
      }

      if (editingTier) {
        await adminApi.updateBulkPricingTier(editingTier.id, tierData)
      } else {
        await adminApi.createBulkPricingTier(managingProductBulkPricing.id, tierData)
      }

      await fetchBulkPricingTiers(managingProductBulkPricing.id)
      resetTierForm()
      fetchProducts()
    } catch (error) {
      console.error('Error saving tier:', error)
      alert('Failed to save pricing tier. Please try again.')
    } finally {
      setSavingTier(false)
    }
  }

  const handleDeleteTier = async (tier) => {
    if (!confirm(`Are you sure you want to delete this pricing tier (${tier.minQuantity}+ units)?`)) return

    setDeletingTier(tier.id)
    try {
      await adminApi.deleteBulkPricingTier(tier.id)
      await fetchBulkPricingTiers(managingProductBulkPricing.id)
      fetchProducts()
    } catch (error) {
      console.error('Error deleting tier:', error)
      alert('Failed to delete pricing tier.')
    } finally {
      setDeletingTier(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Products</h1>
          <p className="text-neutral-600">Manage your product catalog</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-soft p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input py-2"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="input pl-10 w-full"
            />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-800"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-500">No products found</p>
            <button onClick={() => openModal()} className="mt-4 text-accent-600 hover:text-accent-700">
              Add your first product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {products.map((product) => (
                  <tr key={product.id} className="table-row-hover">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-neutral-200 rounded flex items-center justify-center">
                            <PhotoIcon className="h-6 w-6 text-neutral-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-primary-900">{product.name}</p>
                          {product.sku && (
                            <p className="text-sm text-neutral-500">SKU: {product.sku}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {product.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-primary-900">
                        ₱{product.price.toLocaleString()}
                      </span>
                      <span className="text-neutral-500">/{product.unit}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${product.stockQuantity <= product.lowStockThreshold ? 'text-red-600' : 'text-primary-900'}`}>
                          {product.stockQuantity || 0}
                        </span>
                        {product.stockQuantity <= product.lowStockThreshold && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                            Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleAvailability(product)}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${product.isAvailable
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {product.isAvailable ? 'Available' : 'Unavailable'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {product.hasVariants && (
                        <button
                          onClick={() => openVariantModal(product)}
                          className="text-blue-600 hover:text-blue-700 mr-3"
                          title="Manage Variants"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => openBulkPricingModal(product)}
                        className="text-emerald-600 hover:text-emerald-700 mr-3"
                        title="Manage Bulk Pricing"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openModal(product)}
                        className="text-accent-600 hover:text-accent-700 mr-3"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        disabled={deleting === product.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-neutral-200">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
              className="btn bg-neutral-100 text-neutral-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-neutral-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="btn bg-neutral-100 text-neutral-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div className="fixed inset-0 bg-primary-900/30 backdrop-blur-sm" onClick={closeModal} />
            <div className="relative bg-white rounded-2xl shadow-soft-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                <h3 className="text-lg font-semibold text-primary-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Product Image
                  </label>
                  <div className="flex items-center gap-4">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-neutral-200 rounded flex items-center justify-center">
                        <PhotoIcon className="h-8 w-8 text-neutral-400" />
                      </div>
                    )}
                    <label className="btn bg-neutral-100 text-neutral-700 hover:bg-neutral-200 cursor-pointer">
                      Choose Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="input w-full"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="input w-full resize-none"
                  />
                </div>

                {/* Price and Unit */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Price (₱) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Unit *
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      className="input w-full"
                    >
                      <option value="piece">piece</option>
                      <option value="kg">kg</option>
                      <option value="meter">meter</option>
                      <option value="liter">liter</option>
                      <option value="box">box</option>
                      <option value="pack">pack</option>
                      <option value="set">set</option>
                      <option value="bag">bag</option>
                    </select>
                  </div>
                </div>

                {/* Category and SKU */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Category *
                    </label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      required
                      className="input w-full"
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      className="input w-full"
                    />
                  </div>
                </div>

                {/* Stock Quantity and Low Stock Threshold */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      name="stockQuantity"
                      value={formData.stockQuantity}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">
                      Low Stock Alert
                    </label>
                    <input
                      type="number"
                      name="lowStockThreshold"
                      value={formData.lowStockThreshold}
                      onChange={handleInputChange}
                      min="0"
                      className="input w-full"
                      placeholder="Alert when stock ≤ this"
                    />
                  </div>
                </div>

                {/* Has Variants Toggle */}
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <input
                    type="checkbox"
                    name="hasVariants"
                    id="hasVariants"
                    checked={formData.hasVariants}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-accent-600 rounded"
                  />
                  <label htmlFor="hasVariants" className="text-sm text-neutral-700">
                    This product has variants (sizes, colors, etc.)
                  </label>
                </div>

                {/* Availability */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-accent-600 rounded"
                  />
                  <label htmlFor="isAvailable" className="text-sm text-neutral-700">
                    Available for ordering
                  </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn btn-primary">
                    {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Variant Management Modal */}
      {showVariantModal && managingProductVariants && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div className="fixed inset-0 bg-primary-900/30 backdrop-blur-sm" onClick={closeVariantModal} />
            <div className="relative bg-white rounded-2xl shadow-soft-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 sticky top-0 bg-white z-10">
                <div>
                  <h3 className="text-lg font-semibold text-primary-900">
                    Manage Variants - {managingProductVariants.name}
                  </h3>
                  <p className="text-sm text-neutral-600">Add different options like sizes, colors, or configurations</p>
                </div>
                <button onClick={closeVariantModal} className="text-neutral-400 hover:text-neutral-600">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Variant Form */}
                <form onSubmit={handleVariantSubmit} className="mb-6 p-4 bg-neutral-50 rounded-xl">
                  <h4 className="text-sm font-semibold text-primary-900 mb-3">
                    {editingVariant ? 'Edit Variant' : 'Add New Variant'}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">
                        Variant Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={variantFormData.name}
                        onChange={handleVariantInputChange}
                        required
                        className="input w-full"
                        placeholder="e.g., Large, Red, 500ml"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">
                        SKU
                      </label>
                      <input
                        type="text"
                        name="sku"
                        value={variantFormData.sku}
                        onChange={handleVariantInputChange}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">
                        Price (₱) *
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={variantFormData.price}
                        onChange={handleVariantInputChange}
                        required
                        min="0"
                        step="0.01"
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        name="stockQuantity"
                        value={variantFormData.stockQuantity}
                        onChange={handleVariantInputChange}
                        required
                        min="0"
                        className="input w-full"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <input
                      type="checkbox"
                      name="isAvailable"
                      id="variantIsAvailable"
                      checked={variantFormData.isAvailable}
                      onChange={handleVariantInputChange}
                      className="h-4 w-4 text-accent-600 rounded"
                    />
                    <label htmlFor="variantIsAvailable" className="text-sm text-neutral-700">
                      Available for ordering
                    </label>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    {editingVariant && (
                      <button
                        type="button"
                        onClick={resetVariantForm}
                        className="btn bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button type="submit" disabled={savingVariant} className="btn btn-primary">
                      {savingVariant ? 'Saving...' : editingVariant ? 'Update Variant' : 'Add Variant'}
                    </button>
                  </div>
                </form>

                {/* Variants List */}
                <div>
                  <h4 className="text-sm font-semibold text-primary-900 mb-3">Existing Variants</h4>
                  {variants.length === 0 ? (
                    <p className="text-sm text-neutral-500 text-center py-4">No variants yet. Add one above.</p>
                  ) : (
                    <div className="space-y-2">
                      {variants.map((variant) => (
                        <div
                          key={variant.id}
                          className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-lg hover:border-primary-300 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-primary-900">{variant.name}</p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-neutral-600">
                              <span>₱{variant.price.toLocaleString()}</span>
                              <span>Stock: {variant.stockQuantity}</span>
                              {variant.sku && <span>SKU: {variant.sku}</span>}
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${variant.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {variant.isAvailable ? 'Available' : 'Unavailable'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditVariant(variant)}
                              className="text-accent-600 hover:text-accent-700"
                              title="Edit"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteVariant(variant)}
                              disabled={deletingVariant === variant.id}
                              className="text-red-600 hover:text-red-700"
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-6 pt-4 border-t border-neutral-200">
                  <button
                    onClick={closeVariantModal}
                    className="btn bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Pricing Management Modal */}
      {showBulkPricingModal && managingProductBulkPricing && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div className="fixed inset-0 bg-primary-900/30 backdrop-blur-sm" onClick={closeBulkPricingModal} />
            <div className="relative bg-white rounded-2xl shadow-soft-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 sticky top-0 bg-white z-10">
                <div>
                  <h3 className="text-lg font-semibold text-primary-900">
                    Bulk Pricing - {managingProductBulkPricing.name}
                  </h3>
                  <p className="text-sm text-neutral-600">Set volume discount tiers (e.g., "10+ units: 5% off")</p>
                </div>
                <button onClick={closeBulkPricingModal} className="text-neutral-400 hover:text-neutral-600">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Tier Form */}
                <form onSubmit={handleTierSubmit} className="mb-6 p-4 bg-emerald-50 rounded-xl">
                  <h4 className="text-sm font-semibold text-primary-900 mb-3">
                    {editingTier ? 'Edit Pricing Tier' : 'Add New Pricing Tier'}
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">
                        Min Quantity *
                      </label>
                      <input
                        type="number"
                        name="minQuantity"
                        value={tierFormData.minQuantity}
                        onChange={handleTierInputChange}
                        required
                        min="2"
                        className="input w-full"
                        placeholder="e.g., 10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">
                        Discount Type *
                      </label>
                      <select
                        name="discountType"
                        value={tierFormData.discountType}
                        onChange={handleTierInputChange}
                        className="input w-full"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (₱)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-700 mb-1">
                        {tierFormData.discountType === 'percentage' ? 'Discount (%)' : 'Discount (₱)'} *
                      </label>
                      <input
                        type="number"
                        name="discountValue"
                        value={tierFormData.discountValue}
                        onChange={handleTierInputChange}
                        required
                        min="0"
                        max={tierFormData.discountType === 'percentage' ? '100' : undefined}
                        step="0.01"
                        className="input w-full"
                        placeholder={tierFormData.discountType === 'percentage' ? 'e.g., 5' : 'e.g., 50'}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    {editingTier && (
                      <button
                        type="button"
                        onClick={resetTierForm}
                        className="btn bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button type="submit" disabled={savingTier} className="btn btn-primary">
                      {savingTier ? 'Saving...' : editingTier ? 'Update Tier' : 'Add Tier'}
                    </button>
                  </div>
                </form>

                {/* Tiers List */}
                <div>
                  <h4 className="text-sm font-semibold text-primary-900 mb-3">Current Pricing Tiers</h4>
                  {bulkPricingTiers.length === 0 ? (
                    <p className="text-sm text-neutral-500 text-center py-4">No pricing tiers yet. Add one above.</p>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-neutral-200">
                      <table className="w-full text-sm">
                        <thead className="bg-neutral-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-neutral-700 font-medium">Min Quantity</th>
                            <th className="px-4 py-2 text-left text-neutral-700 font-medium">Discount</th>
                            <th className="px-4 py-2 text-right text-neutral-700 font-medium">Unit Price</th>
                            <th className="px-4 py-2 text-right text-neutral-700 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-100">
                          {bulkPricingTiers.map((tier) => {
                            const basePrice = managingProductBulkPricing.price
                            const unitPrice = tier.discountType === 'percentage'
                              ? basePrice * (1 - tier.discountValue / 100)
                              : basePrice - tier.discountValue
                            return (
                              <tr key={tier.id} className="hover:bg-neutral-50">
                                <td className="px-4 py-3 text-neutral-700">{tier.minQuantity}+ units</td>
                                <td className="px-4 py-3 text-emerald-600 font-medium">
                                  {tier.discountType === 'percentage'
                                    ? `${tier.discountValue}% off`
                                    : `₱${tier.discountValue.toLocaleString()} off`}
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-primary-700">
                                  ₱{Math.max(0, unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => handleEditTier(tier)}
                                    className="text-accent-600 hover:text-accent-700 mr-2"
                                    title="Edit"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTier(tier)}
                                    disabled={deletingTier === tier.id}
                                    className="text-red-600 hover:text-red-700"
                                    title="Delete"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-6 pt-4 border-t border-neutral-200">
                  <button
                    onClick={closeBulkPricingModal}
                    className="btn bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
