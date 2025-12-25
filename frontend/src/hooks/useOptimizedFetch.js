import { useState, useEffect, useRef, useCallback } from 'react'
import { getCached, setCache, getCacheKey } from '../utils/cache'

/**
 * useCachedFetch - Hook for fetching data with caching support
 * 
 * @param {Function} fetchFn - Async function that performs the fetch
 * @param {Object} params - Parameters to pass to fetch function
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether to enable the fetch (default: true)
 * @param {number} options.ttl - Cache TTL in ms (default: 5 minutes)
 * @param {string} options.cacheKey - Custom cache key (auto-generated if not provided)
 */
export function useCachedFetch(fetchFn, params = {}, options = {}) {
  const { enabled = true, ttl = 5 * 60 * 1000, cacheKey: customCacheKey } = options
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Use refs to handle unstable function references and params
  const fetchFnRef = useRef(fetchFn)
  const paramsRef = useRef(params)

  useEffect(() => {
    fetchFnRef.current = fetchFn
    paramsRef.current = params
  }, [fetchFn, params])

  const cacheKey = customCacheKey || getCacheKey(fetchFn.name || 'fetch', params)

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }

    // Check cache first
    const cached = getCached(cacheKey)
    if (cached) {
      setData(cached)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    const abortController = new AbortController()

    try {
      const result = await fetchFnRef.current(paramsRef.current)
      if (!abortController.signal.aborted) {
        setData(result)
        setCache(cacheKey, result, ttl)
      }
    } catch (err) {
      if (!abortController.signal.aborted) {
        setError(err)
        console.error('Fetch error:', err)
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false)
      }
    }
    return () => abortController.abort()
  }, [enabled, cacheKey, ttl])

  useEffect(() => {
    const cleanupPromise = fetchData()
    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup())
    }
  }, [fetchData])

  const refetch = useCallback(() => {
    setCache(cacheKey, null, 0) // Invalidate cache
    fetchData()
  }, [cacheKey, fetchData])

  return { data, loading, error, refetch }
}

/**
 * useInfiniteScroll - Hook for infinite scrolling with performance optimization
 */
export function useInfiniteScroll(callback, options = {}) {
  const { threshold = 100, enabled = true } = options
  const observerRef = useRef(null)
  const targetRef = useRef(null)
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callbackRef.current?.()
        }
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0,
      }
    )

    observerRef.current = observer

    if (targetRef.current) {
      observer.observe(targetRef.current)
    }

    return () => observer.disconnect()
  }, [threshold, enabled])

  return targetRef
}

/**
 * useScrollPosition - Hook for optimized scroll position tracking
 */
export function useScrollPosition(throttleMs = 100) {
  const [scrollY, setScrollY] = useState(0)
  const [scrollDirection, setScrollDirection] = useState('none')
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          setScrollY(currentScrollY)
          setScrollDirection(
            currentScrollY > lastScrollY.current ? 'down' : 
            currentScrollY < lastScrollY.current ? 'up' : 'none'
          )
          lastScrollY.current = currentScrollY
          ticking.current = false
        })
        ticking.current = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return { scrollY, scrollDirection }
}

export default { useCachedFetch, useInfiniteScroll, useScrollPosition }
