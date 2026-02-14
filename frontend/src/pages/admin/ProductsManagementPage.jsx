import { useState, useEffect, useCallback, useRef } from 'react'
import { adminApi, categoryApi, productApi } from '../../services/api'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  XMarkIcon,
  FunnelIcon,
  TagIcon,
  CubeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline'

export default function ProductsManagementPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const debounceRef = useRef(null)
  const searchInputRef = useRef(null)

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ESC — close the topmost open modal
      if (e.key === 'Escape') {
        if (showBulkPricingModal) { closeBulkPricingModal(); return }
        if (showVariantModal) { closeVariantModal(); return }
        if (showModal) { closeModal(); return }
      }
      // "/" — focus search (only when no modal open and not already in an input)
      if (e.key === '/' && !showModal && !showVariantModal && !showBulkPricingModal) {
        const tag = document.activeElement?.tagName?.toLowerCase()
        if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
          e.preventDefault()
          searchInputRef.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showModal, showVariantModal, showBulkPricingModal])

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    const doFetch = async () => {
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
    doFetch()
  }, [categoryFilter, searchQuery, pagination.page])

  // Debounced search — waits 400ms after user stops typing
  const handleSearchInput = useCallback((value) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPagination((p) => ({ ...p, page: 1 }))
      setSearchQuery(value.trim())
    }, 400)
  }, [])

  // Reset page when category filter changes
  const handleCategoryChange = (value) => {
    setCategoryFilter(value)
    setPagination((p) => ({ ...p, page: 1 }))
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
    setPagination((p) => ({ ...p, page: 1 }))
    if (searchInputRef.current) searchInputRef.current.focus()
  }

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
      const message = error.response?.data?.message || 'Failed to delete product. Please try again.'
      alert(message)
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Products</h1>
          <p className="text-neutral-500 mt-1">Manage your product catalog &middot; {pagination.total || 0} total products</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary flex items-center gap-2 shrink-0">
          <PlusIcon className="h-5 w-5" />
          Add Product
        </button>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 p-5">
        {/* Search Input — Full Width */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search products by name, description, or SKU..."
            className="block w-full pl-12 pr-12 py-3 text-base bg-neutral-50 border border-neutral-200 rounded-xl placeholder-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
              title="Clear search"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Filter Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <FunnelIcon className="h-4 w-4" />
            <span className="font-medium">Filter:</span>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all min-w-[180px]"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {/* Active filter chips */}
          {(searchQuery || categoryFilter) && (
            <div className="flex items-center gap-2 flex-wrap">
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200 rounded-full">
                  <MagnifyingGlassIcon className="h-3.5 w-3.5" />
                  &ldquo;{searchQuery}&rdquo;
                  <button onClick={clearSearch} className="ml-0.5 hover:text-primary-900">
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              {categoryFilter && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-accent-50 text-accent-700 border border-accent-200 rounded-full">
                  <TagIcon className="h-3.5 w-3.5" />
                  {categories.find(c => c.id.toString() === categoryFilter)?.name || 'Category'}
                  <button onClick={() => setCategoryFilter('')} className="ml-0.5 hover:text-accent-900">
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              <button
                onClick={() => { clearSearch(); setCategoryFilter('') }}
                className="text-xs text-neutral-500 hover:text-neutral-700 underline underline-offset-2 ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results count */}
        {(searchQuery || categoryFilter) && (
          <p className="text-sm text-neutral-500 mt-3 pt-3 border-t border-neutral-100">
            Showing <span className="font-semibold text-primary-700">{products.length}</span> of{' '}
            <span className="font-semibold text-primary-700">{pagination.total || 0}</span> products
          </p>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-neutral-200 border-t-primary-600"></div>
            <p className="text-sm text-neutral-500">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 px-4">
            <CubeIcon className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-700 mb-1">No products found</h3>
            <p className="text-neutral-500 text-sm mb-6">
              {searchQuery || categoryFilter
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Get started by adding your first product to the catalog.'}
            </p>
            {searchQuery || categoryFilter ? (
              <button
                onClick={() => { clearSearch(); setCategoryFilter('') }}
                className="btn btn-secondary text-sm"
              >
                Clear Filters
              </button>
            ) : (
              <button onClick={() => openModal()} className="btn btn-primary text-sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Your First Product
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg ring-1 ring-neutral-200"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center ring-1 ring-neutral-200">
                            <PhotoIcon className="h-6 w-6 text-neutral-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-primary-900 truncate">{product.name}</p>
                          {product.sku && (
                            <p className="text-xs text-neutral-400 mt-0.5 font-mono">SKU: {product.sku}</p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1">
                            {product.hasVariants && (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100 rounded">
                                Variants
                              </span>
                            )}
                            {product.bulkPricingTiers && product.bulkPricingTiers.length > 0 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100 rounded">
                                Bulk
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.category?.name ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-neutral-100 text-neutral-600 rounded-lg">
                          <TagIcon className="h-3 w-3" />
                          {product.category.name}
                        </span>
                      ) : (
                        <span className="text-sm text-neutral-400">&mdash;</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-primary-900">
                        ₱{product.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-neutral-400 ml-0.5">/{product.unit}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${
                          product.stockQuantity <= 0
                            ? 'text-red-600'
                            : product.stockQuantity <= product.lowStockThreshold
                              ? 'text-amber-600'
                              : 'text-primary-900'
                        }`}>
                          {product.stockQuantity || 0}
                        </span>
                        {product.stockQuantity <= 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 rounded">
                            Out
                          </span>
                        )}
                        {product.stockQuantity > 0 && product.stockQuantity <= product.lowStockThreshold && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded">
                            Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleAvailability(product)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${
                          product.isAvailable
                            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${product.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                        {product.isAvailable ? 'Available' : 'Unavailable'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        {product.hasVariants && (
                          <button
                            onClick={() => openVariantModal(product)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors"
                            title="Manage Variants"
                          >
                            <AdjustmentsHorizontalIcon className="h-3.5 w-3.5" />
                            <span className="hidden lg:inline">Variants</span>
                          </button>
                        )}
                        <button
                          onClick={() => openBulkPricingModal(product)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 transition-colors"
                          title="Bulk Pricing"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="hidden lg:inline">Pricing</span>
                        </button>
                        <button
                          onClick={() => openModal(product)}
                          className="p-1.5 rounded-lg text-accent-600 hover:bg-accent-50 transition-colors"
                          title="Edit Product"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          disabled={deleting === product.id}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Delete Product"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-neutral-50/50 px-6 py-4 flex items-center justify-between border-t border-neutral-200">
            <p className="text-sm text-neutral-500">
              Page <span className="font-medium text-primary-700">{pagination.page}</span> of{' '}
              <span className="font-medium text-primary-700">{pagination.totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Previous
              </button>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div className="fixed inset-0 bg-primary-900/30 backdrop-blur-sm" onClick={closeModal} />
            <div className="relative bg-white rounded-2xl shadow-soft-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 sticky top-0 bg-white z-10 rounded-t-2xl">
                <div>
                  <h3 className="text-lg font-semibold text-primary-900">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {editingProduct ? 'Update product details below' : 'Fill in the details to create a new product'}
                  </p>
                </div>
                <button onClick={closeModal} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Image Upload */}
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                  <label className="block text-sm font-semibold text-primary-700 mb-3">
                    Product Image
                  </label>
                  <div className="flex items-center gap-4">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-lg ring-1 ring-neutral-200"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center ring-1 ring-neutral-200">
                        <PhotoIcon className="h-8 w-8 text-neutral-300" />
                      </div>
                    )}
                    <div>
                      <label className="btn btn-secondary btn-sm cursor-pointer">
                        Choose Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-neutral-400 mt-2">JPG, PNG or WebP. Max 5MB.</p>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1.5">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="input w-full"
                    placeholder="e.g., Steel Hammer 16oz"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="input w-full resize-none"
                    placeholder="Describe the product..."
                  />
                </div>

                {/* Price and Unit */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1.5">
                      Price (₱) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="1"
                      className="input w-full"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1.5">
                      Unit <span className="text-red-500">*</span>
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
                    <label className="block text-sm font-medium text-primary-700 mb-1.5">
                      Category <span className="text-red-500">*</span>
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
                    <label className="block text-sm font-medium text-primary-700 mb-1.5">
                      SKU
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      className="input w-full"
                      placeholder="e.g., HMR-STL-16"
                    />
                  </div>
                </div>

                {/* Stock Quantity and Low Stock Threshold */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1.5">
                      Stock Quantity <span className="text-red-500">*</span>
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
                    <label className="block text-sm font-medium text-primary-700 mb-1.5">
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

                {/* Toggles section */}
                <div className="space-y-3 pt-1">
                  {/* Has Variants Toggle */}
                  <label
                    htmlFor="hasVariants"
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
                      formData.hasVariants
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${formData.hasVariants ? 'bg-blue-100 text-blue-600' : 'bg-neutral-200 text-neutral-500'}`}>
                        <AdjustmentsHorizontalIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${formData.hasVariants ? 'text-blue-800' : 'text-neutral-700'}`}>Product Variants</p>
                        <p className={`text-xs mt-0.5 ${formData.hasVariants ? 'text-blue-600' : 'text-neutral-500'}`}>Enable sizes, colors, or other options</p>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="hasVariants"
                        id="hasVariants"
                        checked={formData.hasVariants}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors ${
                        formData.hasVariants ? 'bg-blue-500' : 'bg-neutral-300'
                      }`}></div>
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        formData.hasVariants ? 'translate-x-5' : 'translate-x-0'
                      }`}></div>
                    </div>
                  </label>

                  {/* Availability Toggle */}
                  <label
                    htmlFor="isAvailable"
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
                      formData.isAvailable
                        ? 'bg-green-50 border-green-200'
                        : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${formData.isAvailable ? 'bg-green-100 text-green-600' : 'bg-neutral-200 text-neutral-500'}`}>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${formData.isAvailable ? 'text-green-800' : 'text-neutral-700'}`}>Available for Ordering</p>
                        <p className={`text-xs mt-0.5 ${formData.isAvailable ? 'text-green-600' : 'text-neutral-500'}`}>{formData.isAvailable ? 'Customers can order this product' : 'Product is hidden from customers'}</p>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="isAvailable"
                        id="isAvailable"
                        checked={formData.isAvailable}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors ${
                        formData.isAvailable ? 'bg-green-500' : 'bg-neutral-300'
                      }`}></div>
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        formData.isAvailable ? 'translate-x-5' : 'translate-x-0'
                      }`}></div>
                    </div>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn btn-secondary"
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
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 sticky top-0 bg-white z-10 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-600">
                    <AdjustmentsHorizontalIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary-900">
                      Manage Variants
                    </h3>
                    <p className="text-sm text-neutral-500">{managingProductVariants.name} &middot; {variants.length} variant{variants.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-xs text-neutral-400 bg-neutral-100 px-2 py-1 rounded-md">ESC</span>
                  <button onClick={closeVariantModal} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Variant Form */}
                <form onSubmit={handleVariantSubmit} className={`mb-6 p-5 rounded-xl border transition-colors ${
                  editingVariant
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-blue-50/50 border-blue-100'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`text-sm font-semibold ${
                      editingVariant ? 'text-amber-800' : 'text-blue-800'
                    }`}>
                      {editingVariant ? `Editing: ${editingVariant.name}` : 'Add New Variant'}
                    </h4>
                    {editingVariant && (
                      <button
                        type="button"
                        onClick={resetVariantForm}
                        className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1"
                      >
                        <XMarkIcon className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={variantFormData.name}
                        onChange={handleVariantInputChange}
                        required
                        className="input w-full py-2 text-sm"
                        placeholder="e.g., Large, Red"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                        Price (₱) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={variantFormData.price}
                        onChange={handleVariantInputChange}
                        required
                        min="0"
                        step="1"
                        className="input w-full py-2 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                        Stock <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="stockQuantity"
                        value={variantFormData.stockQuantity}
                        onChange={handleVariantInputChange}
                        required
                        min="0"
                        className="input w-full py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                        SKU
                      </label>
                      <input
                        type="text"
                        name="sku"
                        value={variantFormData.sku}
                        onChange={handleVariantInputChange}
                        className="input w-full py-2 text-sm"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-200/60">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div className="relative">
                        <input
                          type="checkbox"
                          name="isAvailable"
                          checked={variantFormData.isAvailable}
                          onChange={handleVariantInputChange}
                          className="sr-only peer"
                        />
                        <div className={`w-9 h-5 rounded-full transition-colors ${
                          variantFormData.isAvailable ? 'bg-green-500' : 'bg-neutral-300'
                        }`}></div>
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                          variantFormData.isAvailable ? 'translate-x-4' : 'translate-x-0'
                        }`}></div>
                      </div>
                      <span className="text-xs font-medium text-neutral-600">Available</span>
                    </label>
                    <button
                      type="submit"
                      disabled={savingVariant}
                      className={`btn btn-sm ${
                        editingVariant
                          ? 'bg-amber-600 text-white hover:bg-amber-700'
                          : 'btn-primary'
                      }`}
                    >
                      {savingVariant ? 'Saving...' : editingVariant ? 'Update' : 'Add Variant'}
                    </button>
                  </div>
                </form>

                {/* Variants List */}
                <div>
                  <h4 className="text-sm font-semibold text-primary-900 mb-3 flex items-center justify-between">
                    <span>Variants ({variants.length})</span>
                  </h4>
                  {variants.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-neutral-200 rounded-xl">
                      <AdjustmentsHorizontalIcon className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                      <p className="text-sm text-neutral-500">No variants yet</p>
                      <p className="text-xs text-neutral-400 mt-1">Add sizes, colors, or other options above</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-neutral-200">
                      <table className="w-full text-sm">
                        <thead className="bg-neutral-50">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase">Name</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase">Price</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase">Stock</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase">SKU</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase">Status</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-neutral-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {variants.map((variant) => (
                            <tr
                              key={variant.id}
                              className={`hover:bg-neutral-50 transition-colors ${
                                editingVariant?.id === variant.id ? 'bg-amber-50/50 ring-1 ring-inset ring-amber-200' : ''
                              }`}
                            >
                              <td className="px-4 py-3 font-medium text-primary-900">{variant.name}</td>
                              <td className="px-4 py-3 text-neutral-700">₱{variant.price.toLocaleString()}</td>
                              <td className="px-4 py-3">
                                <span className={`font-medium ${
                                  variant.stockQuantity <= 0 ? 'text-red-600' : 'text-neutral-700'
                                }`}>
                                  {variant.stockQuantity}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-neutral-400 font-mono text-xs">{variant.sku || '—'}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                                  variant.isAvailable
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${variant.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                                  {variant.isAvailable ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleEditVariant(variant)}
                                    className="p-1.5 rounded-lg text-accent-600 hover:bg-accent-50 transition-colors"
                                    title="Edit variant"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteVariant(variant)}
                                    disabled={deletingVariant === variant.id}
                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                                    title="Delete variant"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-200">
                  <p className="text-xs text-neutral-400">Press ESC to close</p>
                  <button
                    onClick={closeVariantModal}
                    className="btn btn-secondary"
                  >
                    Done
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
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 sticky top-0 bg-white z-10 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary-900">Bulk Pricing</h3>
                    <p className="text-sm text-neutral-500">{managingProductBulkPricing.name} &middot; Base: ₱{managingProductBulkPricing.price.toLocaleString()}/{managingProductBulkPricing.unit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-xs text-neutral-400 bg-neutral-100 px-2 py-1 rounded-md">ESC</span>
                  <button onClick={closeBulkPricingModal} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Tier Form */}
                <form onSubmit={handleTierSubmit} className={`mb-6 p-5 rounded-xl border transition-colors ${
                  editingTier
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-emerald-50/50 border-emerald-100'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`text-sm font-semibold ${
                      editingTier ? 'text-amber-800' : 'text-emerald-800'
                    }`}>
                      {editingTier ? `Editing: ${editingTier.minQuantity}+ units tier` : 'Add Pricing Tier'}
                    </h4>
                    {editingTier && (
                      <button
                        type="button"
                        onClick={resetTierForm}
                        className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1"
                      >
                        <XMarkIcon className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                        Min Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="minQuantity"
                        value={tierFormData.minQuantity}
                        onChange={handleTierInputChange}
                        required
                        min="2"
                        className="input w-full py-2 text-sm"
                        placeholder="e.g., 10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                        Discount Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="discountType"
                        value={tierFormData.discountType}
                        onChange={handleTierInputChange}
                        className="input w-full py-2 text-sm"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (₱)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                        {tierFormData.discountType === 'percentage' ? 'Discount (%)' : 'Discount (₱)'} <span className="text-red-500">*</span>
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
                        className="input w-full py-2 text-sm"
                        placeholder={tierFormData.discountType === 'percentage' ? 'e.g., 5' : 'e.g., 50'}
                      />
                    </div>
                  </div>
                  {/* Preview */}
                  {tierFormData.minQuantity && tierFormData.discountValue && (
                    <div className="mt-3 px-3 py-2 bg-white/70 rounded-lg border border-emerald-100 text-xs text-neutral-600">
                      Preview: Buy <span className="font-semibold text-emerald-700">{tierFormData.minQuantity}+</span> units &rarr;
                      {' '}<span className="font-semibold text-emerald-700">
                        {tierFormData.discountType === 'percentage'
                          ? `${tierFormData.discountValue}% off`
                          : `₱${parseFloat(tierFormData.discountValue || 0).toLocaleString()} off`
                        }
                      </span>
                      {' = '}₱{Math.max(0, tierFormData.discountType === 'percentage'
                        ? managingProductBulkPricing.price * (1 - (parseFloat(tierFormData.discountValue) || 0) / 100)
                        : managingProductBulkPricing.price - (parseFloat(tierFormData.discountValue) || 0)
                      ).toLocaleString(undefined, { minimumFractionDigits: 2 })}/unit
                    </div>
                  )}
                  <div className="flex justify-end mt-4">
                    <button
                      type="submit"
                      disabled={savingTier}
                      className={`btn btn-sm ${
                        editingTier
                          ? 'bg-amber-600 text-white hover:bg-amber-700'
                          : 'btn-primary'
                      }`}
                    >
                      {savingTier ? 'Saving...' : editingTier ? 'Update Tier' : 'Add Tier'}
                    </button>
                  </div>
                </form>

                {/* Tiers List */}
                <div>
                  <h4 className="text-sm font-semibold text-primary-900 mb-3">Pricing Tiers ({bulkPricingTiers.length})</h4>
                  {bulkPricingTiers.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-neutral-200 rounded-xl">
                      <svg className="h-8 w-8 text-neutral-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-neutral-500">No pricing tiers yet</p>
                      <p className="text-xs text-neutral-400 mt-1">Create volume discount tiers above</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-neutral-200">
                      <table className="w-full text-sm">
                        <thead className="bg-neutral-50">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase">Quantity</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase">Discount</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-neutral-500 uppercase">Savings</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-neutral-500 uppercase">Unit Price</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-neutral-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {bulkPricingTiers.map((tier) => {
                            const basePrice = managingProductBulkPricing.price
                            const unitPrice = tier.discountType === 'percentage'
                              ? basePrice * (1 - tier.discountValue / 100)
                              : basePrice - tier.discountValue
                            const savingsPerUnit = basePrice - Math.max(0, unitPrice)
                            return (
                              <tr
                                key={tier.id}
                                className={`hover:bg-neutral-50 transition-colors ${
                                  editingTier?.id === tier.id ? 'bg-amber-50/50 ring-1 ring-inset ring-amber-200' : ''
                                }`}
                              >
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                                    {tier.minQuantity}+ units
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-emerald-600 font-medium">
                                  {tier.discountType === 'percentage'
                                    ? `${tier.discountValue}%`
                                    : `₱${tier.discountValue.toLocaleString()}`}
                                </td>
                                <td className="px-4 py-3 text-neutral-500 text-xs">
                                  ₱{savingsPerUnit.toLocaleString(undefined, { minimumFractionDigits: 2 })}/unit
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-primary-700">
                                  ₱{Math.max(0, unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => handleEditTier(tier)}
                                      className="p-1.5 rounded-lg text-accent-600 hover:bg-accent-50 transition-colors"
                                      title="Edit tier"
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTier(tier)}
                                      disabled={deletingTier === tier.id}
                                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                                      title="Delete tier"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-200">
                  <p className="text-xs text-neutral-400">Press ESC to close</p>
                  <button
                    onClick={closeBulkPricingModal}
                    className="btn btn-secondary"
                  >
                    Done
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
