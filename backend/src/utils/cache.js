const NodeCache = require('node-cache');

// Cache configuration
// stdTTL: default time-to-live in seconds (5 minutes)
// checkperiod: delete check interval in seconds (2 minutes)
const cache = new NodeCache({
  stdTTL: 300,
  checkperiod: 120,
  useClones: true // Return cloned objects to prevent mutation
});

// Cache keys
const CACHE_KEYS = {
  ALL_CATEGORIES: 'categories:all',
  CATEGORY: (id) => `categories:${id}`,
  ALL_PRODUCTS: 'products:all',
  PRODUCT: (id) => `products:${id}`,
  PRODUCTS_BY_CATEGORY: (categoryId) => `products:category:${categoryId}`,
  FEATURED_PRODUCTS: 'products:featured',
  DASHBOARD_STATS: 'admin:dashboard:stats'
};

// Cache TTL in seconds
const CACHE_TTL = {
  CATEGORIES: 600,      // 10 minutes
  PRODUCTS: 300,        // 5 minutes
  PRODUCT_DETAIL: 300,  // 5 minutes
  DASHBOARD: 60         // 1 minute
};

/**
 * Get cached value or fetch from source
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch data if not cached
 * @param {number} ttl - Time-to-live in seconds (optional)
 * @returns {Promise<any>} Cached or fetched data
 */
const getOrSet = async (key, fetchFn, ttl = null) => {
  const cached = cache.get(key);

  if (cached !== undefined) {
    return cached;
  }

  const data = await fetchFn();

  if (ttl) {
    cache.set(key, data, ttl);
  } else {
    cache.set(key, data);
  }

  return data;
};

/**
 * Invalidate cache entries by pattern
 * @param {string} pattern - Pattern to match (prefix)
 */
const invalidateByPattern = (pattern) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.startsWith(pattern));
  cache.del(matchingKeys);
};

/**
 * Invalidate category-related caches
 */
const invalidateCategories = () => {
  invalidateByPattern('categories:');
};

/**
 * Invalidate product-related caches
 * Also invalidates response cache for product endpoints to ensure
 * admin dashboard updates are immediately reflected
 */
const invalidateProducts = () => {
  invalidateByPattern('products:');
  // Also invalidate response cache for product-related endpoints
  invalidateByPattern('response:/api/products');
};

/**
 * Invalidate all caches
 */
const invalidateAll = () => {
  cache.flushAll();
};

/**
 * Get cache statistics
 */
const getStats = () => {
  return cache.getStats();
};

/**
 * Express middleware for caching responses
 * @param {number} duration - Cache duration in seconds
 */
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `response:${req.originalUrl}`;
    const cached = cache.get(key);

    if (cached) {
      return res.json(cached);
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // Only cache successful responses
      if (res.statusCode === 200) {
        cache.set(key, data, duration);
      }
      return originalJson(data);
    };

    next();
  };
};

module.exports = {
  cache,
  CACHE_KEYS,
  CACHE_TTL,
  getOrSet,
  invalidateByPattern,
  invalidateCategories,
  invalidateProducts,
  invalidateAll,
  getStats,
  cacheMiddleware
};
