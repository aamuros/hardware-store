import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchIcon, CategoryIcon, BoxIcon } from '../../components/icons'
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
    <div className="min-h-screen bg-neutral-50">
      {/* Page Header Bar */}
      <div className="bg-white border-b border-neutral-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Title + Count */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3">
                <h1 className="text-lg font-bold text-primary-900 tracking-tight">Products</h1>
                {!initialLoading && (
                  <span className="text-sm text-neutral-400">
                    {isSearchActive
                      ? `${products.length} result${products.length !== 1 ? 's' : ''} for "${searchQuery}"`
                      : `${products.length} available`}
                  </span>
                )}
              </div>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-72">
              <div className="relative flex-1">
                <SearchIcon className="h-4 w-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search products…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-all"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-primary-900 text-white text-sm font-medium rounded-xl hover:bg-primary-800 transition-colors shadow-sm">
                Go
              </button>
            </form>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <button
              onClick={() => handleCategoryChange('')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                !selectedCategory
                  ? 'bg-primary-900 text-white border-primary-900'
                  : 'bg-white text-neutral-500 border-neutral-200 hover:border-primary-300 hover:text-primary-800'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id.toString())}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  selectedCategory === category.id.toString()
                    ? 'bg-primary-900 text-white border-primary-900'
                    : 'bg-white text-neutral-500 border-neutral-200 hover:border-primary-300 hover:text-primary-800'
                }`}
              >
                <CategoryIcon category={category} className="h-3 w-3" />
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {initialLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-neutral-100 overflow-hidden animate-pulse">
                <div className="aspect-square bg-neutral-100"></div>
                <div className="p-3.5 space-y-2">
                  <div className="h-2.5 bg-neutral-100 rounded-full w-16"></div>
                  <div className="h-4 bg-neutral-100 rounded-lg w-full"></div>
                  <div className="h-3.5 bg-neutral-100 rounded-lg w-2/3"></div>
                  <div className="flex justify-between items-center pt-1">
                    <div className="h-4 bg-neutral-100 rounded-lg w-16"></div>
                    <div className="h-8 w-8 bg-neutral-100 rounded-xl"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 && outOfStockProducts.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 bg-neutral-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <SearchIcon className="h-6 w-6 text-neutral-400" />
            </div>
            <h3 className="text-base font-semibold text-primary-900 mb-1">No products found</h3>
            <p className="text-sm text-neutral-400 mb-6">Try a different keyword or remove the filter.</p>
            <button
              onClick={() => {
                setSearchQuery('')
                handleCategoryChange('')
              }}
              className="px-5 py-2.5 bg-primary-900 text-white text-sm font-medium rounded-xl hover:bg-primary-800 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className={`transition-opacity duration-150 ${isSearching ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              {/* In-Stock Products Grid */}
              {products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
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
                <div className="text-center py-16">
                  <div className="w-14 h-14 bg-neutral-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <BoxIcon className="h-6 w-6 text-neutral-400" />
                  </div>
                  <h3 className="text-base font-semibold text-primary-900 mb-1">All items are out of stock</h3>
                  <p className="text-neutral-400 text-sm">Check back soon or browse other categories</p>
                </div>
              ) : null}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-1.5 mt-10">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:border-primary-300 hover:text-primary-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Prev
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && p - arr[i - 1] > 1) acc.push('...')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-neutral-400 text-sm">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`w-9 h-9 text-sm font-medium rounded-xl transition-all ${
                          p === pagination.page
                            ? 'bg-primary-900 text-white shadow-sm'
                            : 'border border-neutral-200 bg-white text-neutral-600 hover:border-primary-300 hover:text-primary-800'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:border-primary-300 hover:text-primary-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )}

            {/* Out of Stock — collapsible section */}
            {!isSearchActive && outOfStockProducts.length > 0 && (
              <div className="mt-16">
                <button
                  onClick={() => setShowOutOfStock(!showOutOfStock)}
                  className="w-full group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-neutral-200"></div>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white border border-neutral-200 group-hover:border-neutral-300 rounded-full transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                      <span className="text-xs font-semibold text-neutral-500 tracking-wide">Out of Stock</span>
                      <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-full">
                        {outOfStockProducts.length}
                      </span>
                      <svg
                        className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${showOutOfStock ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <div className="h-px flex-1 bg-neutral-200"></div>
                  </div>
                </button>

                {showOutOfStock && (
                  <div className="mt-5 animate-fade-in">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 opacity-60">
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
    </div>
  )
}
