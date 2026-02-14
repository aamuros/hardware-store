import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchIcon, CategoryIcon } from '../../components/icons'
import { productApi, categoryApi } from '../../services/api'
import ProductCard from '../../components/ProductCard'
import { useDebounce } from '../../hooks/useDebounce'

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [outOfStockProducts, setOutOfStockProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [showOutOfStock, setShowOutOfStock] = useState(false)
  const prevSearchParam = useRef(searchParams.get('search') || '')

  useEffect(() => {
    fetchCategories()
  }, [])

  // Sync search from URL params (handles navbar search, including re-navigation while on /products)
  useEffect(() => {
    const searchFromUrl = searchParams.get('search') || ''
    if (searchFromUrl && searchFromUrl !== prevSearchParam.current) {
      prevSearchParam.current = searchFromUrl
      setSearchQuery(searchFromUrl)
      performSearch(searchFromUrl)
    } else if (!searchFromUrl && prevSearchParam.current) {
      // search param was removed (e.g., navigating to /products without ?search)
      prevSearchParam.current = ''
      if (!searchQuery.trim()) {
        fetchProducts()
      }
    }
  }, [searchParams])

  useEffect(() => {
    // Skip fetching all products if there's an active search query
    if (!searchQuery.trim() && !searchParams.get('search')) {
      fetchProducts()
    }
  }, [selectedCategory, searchParams])

  // Debounced search effect
  useEffect(() => {
    if (debouncedSearch.trim()) {
      performSearch(debouncedSearch)
    } else if (debouncedSearch === '' && searchQuery === '') {
      // Only fetch all products when search is cleared
      fetchProducts()
    }
  }, [debouncedSearch])

  // Fetch out-of-stock products whenever category changes
  useEffect(() => {
    fetchOutOfStockProducts()
  }, [selectedCategory])

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAll()
      setCategories(response.data.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchOutOfStockProducts = async () => {
    try {
      const params = {
        limit: 100,
        available: true,
        inStock: false,
      }
      if (selectedCategory) {
        params.category = selectedCategory
      }
      const response = await productApi.getAll(params)
      setOutOfStockProducts(response.data.data)
    } catch (error) {
      console.error('Error fetching out-of-stock products:', error)
    }
  }

  const fetchProducts = async () => {
    const isFirstLoad = products.length === 0
    if (isFirstLoad) {
      setInitialLoading(true)
    } else {
      setIsSearching(true)
    }
    try {
      const params = {
        page: searchParams.get('page') || 1,
        limit: 12,
        available: true,
        inStock: true,
      }

      if (selectedCategory) {
        params.category = selectedCategory
      }

      const response = await productApi.getAll(params)
      setProducts(response.data.data)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setInitialLoading(false)
      setIsSearching(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      fetchProducts()
      return
    }
    performSearch(searchQuery)
  }

  const performSearch = async (query) => {
    const isFirstLoad = products.length === 0
    if (isFirstLoad) {
      setInitialLoading(true)
    } else {
      setIsSearching(true)
    }
    try {
      const response = await productApi.search(query, selectedCategory || undefined)
      setProducts(response.data.data)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Error searching products:', error)
    } finally {
      setInitialLoading(false)
      setIsSearching(false)
    }
  }

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
    if (categoryId) {
      setSearchParams({ category: categoryId })
    } else {
      setSearchParams({})
    }
    setSearchQuery('')
    prevSearchParam.current = ''
    setShowOutOfStock(false)
  }

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage)
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isSearchActive = !!searchQuery.trim()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-900 mb-4">Products</h1>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <SearchIcon className="h-5 w-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>

        {/* Categories Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryChange('')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${!selectedCategory
              ? 'bg-primary-800 text-white shadow-sm'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
          >
            All Products
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id.toString())}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCategory === category.id.toString()
                ? 'bg-primary-800 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <CategoryIcon category={category} className="h-4 w-4" />
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {initialLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-soft overflow-hidden animate-pulse">
              <div className="h-48 bg-neutral-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                <div className="h-4 bg-neutral-100 rounded w-1/2"></div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-6 bg-neutral-200 rounded w-20"></div>
                  <div className="h-10 bg-neutral-200 rounded-xl w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 && outOfStockProducts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-primary-900 mb-2">No products found</h3>
          <p className="text-neutral-500 mb-6">Try adjusting your search or filter to find what you're looking for.</p>
          <button
            onClick={() => {
              setSearchQuery('')
              handleCategoryChange('')
            }}
            className="btn-primary"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          <div className={`relative transition-opacity duration-200 ${isSearching ? 'opacity-50' : 'opacity-100'}`}>
            {isSearching && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg">
                  <p className="text-sm text-primary-700 font-medium">Updating results...</p>
                </div>
              </div>
            )}

            {/* In-Stock Products Grid */}
            {products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    className={`animate-fade-in-up opacity-0 stagger-${Math.min(index + 1, 12)}`}
                    style={{ animationFillMode: 'forwards' }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : !isSearchActive && outOfStockProducts.length > 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📦</div>
                <h3 className="text-lg font-semibold text-primary-900 mb-1">All items in this category are out of stock</h3>
                <p className="text-neutral-500 text-sm">Check back soon or browse other categories</p>
              </div>
            ) : null}
          </div>

          {/* Pagination — only for in-stock products */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn-outline btn-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-neutral-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="btn-outline btn-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}

          {/* Out of Stock — collapsible section, always at bottom, independent of pagination */}
          {!isSearchActive && outOfStockProducts.length > 0 && (
            <div className="mt-14">
              <button
                onClick={() => setShowOutOfStock(!showOutOfStock)}
                className="w-full group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-neutral-200 group-hover:bg-neutral-300 transition-colors"></div>
                  <div className="flex items-center gap-2 px-5 py-2 bg-neutral-100 group-hover:bg-neutral-200 rounded-full transition-colors">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <span className="text-sm font-medium text-neutral-600">Out of Stock</span>
                    <span className="text-xs text-neutral-400 bg-neutral-200 group-hover:bg-neutral-300 px-1.5 py-0.5 rounded-full transition-colors">
                      {outOfStockProducts.length}
                    </span>
                    <svg
                      className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${showOutOfStock ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="h-px flex-1 bg-neutral-200 group-hover:bg-neutral-300 transition-colors"></div>
                </div>
              </button>

              {showOutOfStock && (
                <div className="mt-6 animate-fade-in">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 opacity-70">
                    {outOfStockProducts.map((product, index) => (
                      <div
                        key={product.id}
                        className={`animate-fade-in-up opacity-0 stagger-${Math.min(index + 1, 12)}`}
                        style={{ animationFillMode: 'forwards' }}
                      >
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
