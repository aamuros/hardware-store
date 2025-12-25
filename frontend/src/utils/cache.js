/**
 * Simple API response cache with TTL support
 * Improves perceived performance by caching API responses
 */

const cache = new Map()
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

export function getCached(key) {
  const cached = cache.get(key)
  if (!cached) return null
  
  if (Date.now() > cached.expiry) {
    cache.delete(key)
    return null
  }
  
  return cached.data
}

export function setCache(key, data, ttl = DEFAULT_TTL) {
  cache.set(key, {
    data,
    expiry: Date.now() + ttl,
  })
}

export function clearCache(keyPrefix) {
  if (keyPrefix) {
    // Clear entries matching prefix
    for (const key of cache.keys()) {
      if (key.startsWith(keyPrefix)) {
        cache.delete(key)
      }
    }
  } else {
    cache.clear()
  }
}

/**
 * Generate a stable cache key from endpoint and params
 * Uses deep serialization to handle nested objects correctly
 */
export function getCacheKey(endpoint, params = {}) {
  // Deep serialize with sorted keys to ensure consistent cache keys
  const sortedStringify = (obj) => {
    if (obj === null || obj === undefined) return ''
    if (typeof obj !== 'object') return String(obj)
    if (Array.isArray(obj)) {
      return '[' + obj.map(sortedStringify).join(',') + ']'
    }
    return '{' + Object.keys(obj)
      .sort()
      .map(key => `"${key}":${sortedStringify(obj[key])}`)
      .join(',') + '}'
  }
  
  const paramKeys = Object.keys(params)
  if (paramKeys.length === 0) return endpoint
  
  const sortedParams = paramKeys
    .sort()
    .map(key => `${key}=${sortedStringify(params[key])}`)
    .join('&')
  return `${endpoint}?${sortedParams}`
}

/**
 * Debounce function for search inputs
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for scroll/resize handlers
 */
export function throttle(func, limit) {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export default { getCached, setCache, clearCache, getCacheKey, debounce, throttle }
