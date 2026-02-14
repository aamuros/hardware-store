import { createContext, useContext, useReducer, useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { useCustomerAuth } from './CustomerAuthContext'
import { orderApi } from '../services/api'

const CartContext = createContext()

// Maximum quantity per item
const MAX_QUANTITY = 999

// Initial state
const initialState = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
}

// Build a per-customer localStorage key (guest gets its own key)
const getStorageKey = (customerId) => {
  return customerId ? `hardware-store-cart-${customerId}` : 'hardware-store-cart-guest'
}

// Load cart from localStorage for a given key
const loadCartFromStorage = (key) => {
  try {
    const savedCart = localStorage.getItem(key)
    if (savedCart) {
      const parsed = JSON.parse(savedCart)
      if (parsed && Array.isArray(parsed.items)) {
        return parsed
      }
    }
    return initialState
  } catch (error) {
    console.error('Error loading cart from storage:', error)
    return initialState
  }
}

// One-time migration: move the old shared key into the current customer's key
const migrateOldCart = (currentKey) => {
  try {
    const oldCart = localStorage.getItem('hardware-store-cart')
    if (oldCart) {
      const parsed = JSON.parse(oldCart)
      if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
        // Only migrate if the destination is still empty
        const existing = localStorage.getItem(currentKey)
        if (!existing || existing === JSON.stringify(initialState)) {
          localStorage.setItem(currentKey, oldCart)
        }
      }
      // Remove the old shared key so migration only happens once
      localStorage.removeItem('hardware-store-cart')
    }
  } catch {
    // Ignore migration errors
  }
}

// Cart reducer — pure state transitions, no side effects
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Use composite key: productId + variantId for unique identification
      const itemKey = action.payload.variantId
        ? `${action.payload.id}-${action.payload.variantId}`
        : `${action.payload.id}`

      const existingIndex = state.items.findIndex(
        item => {
          const existingKey = item.variantId
            ? `${item.id}-${item.variantId}`
            : `${item.id}`
          return existingKey === itemKey
        }
      )

      let updatedItems

      if (existingIndex >= 0) {
        // Item exists, update quantity with stock and max limit
        updatedItems = state.items.map((item, index) => {
          if (index === existingIndex) {
            const maxAllowed = Math.min(item.stockQuantity || MAX_QUANTITY, MAX_QUANTITY)
            return {
              ...item,
              quantity: Math.min(item.quantity + action.payload.quantity, maxAllowed),
              stockQuantity: action.payload.stockQuantity // Update stock in case it changed
            }
          }
          return item
        })
      } else {
        // New item with stock and quantity limit
        const maxAllowed = Math.min(action.payload.stockQuantity || MAX_QUANTITY, MAX_QUANTITY)
        updatedItems = [...state.items, { ...action.payload, quantity: Math.min(action.payload.quantity, maxAllowed) }]
      }

      return {
        ...state,
        items: updatedItems,
        ...calculateTotals(updatedItems),
      }
    }

    case 'REMOVE_ITEM': {
      const removeKey = action.payload.variantId
        ? `${action.payload.id}-${action.payload.variantId}`
        : `${action.payload.id}`

      const updatedItems = state.items.filter(item => {
        const itemKey = item.variantId
          ? `${item.id}-${item.variantId}`
          : `${item.id}`
        return itemKey !== removeKey
      })
      return {
        ...state,
        items: updatedItems,
        ...calculateTotals(updatedItems),
      }
    }

    case 'UPDATE_QUANTITY': {
      const updateKey = action.payload.variantId
        ? `${action.payload.id}-${action.payload.variantId}`
        : `${action.payload.id}`

      const updatedItems = state.items.map(item => {
        const itemKey = item.variantId
          ? `${item.id}-${item.variantId}`
          : `${item.id}`

        if (itemKey === updateKey) {
          // Enforce minimum of 1, maximum of either stock or MAX_QUANTITY
          const maxAllowed = Math.min(item.stockQuantity || MAX_QUANTITY, MAX_QUANTITY)
          const newQuantity = Math.min(Math.max(1, action.payload.quantity), maxAllowed)
          return { ...item, quantity: newQuantity }
        }
        return item
      })
      return {
        ...state,
        items: updatedItems,
        ...calculateTotals(updatedItems),
      }
    }

    case 'UPDATE_STOCK_LEVELS': {
      // action.payload = { stockMap: Map<string, number> }
      // stockMap keys are composite keys like "productId" or "productId-variantId"
      const { stockMap } = action.payload
      const updatedItems = state.items.map(item => {
        const itemKey = item.variantId
          ? `${item.id}-${item.variantId}`
          : `${item.id}`
        if (stockMap.has(itemKey)) {
          const newStock = stockMap.get(itemKey)
          const clampedQty = Math.min(item.quantity, Math.max(1, newStock))
          return { ...item, stockQuantity: newStock, quantity: clampedQty }
        }
        return item
      })
      return {
        ...state,
        items: updatedItems,
        ...calculateTotals(updatedItems),
      }
    }

    case 'CLEAR_CART':
      return initialState

    case 'LOAD_CART':
      return action.payload

    default:
      return state
  }
}

// Calculate totals
const calculateTotals = (items) => {
  return {
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  }
}

// Build a composite key for an item
const getItemKey = (item) =>
  item.variantId ? `${item.id}-${item.variantId}` : `${item.id}`

// Provider component
export function CartProvider({ children }) {
  const { customer } = useCustomerAuth()
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Selection state — Set of composite item keys (not persisted)
  const [selectedKeys, setSelectedKeys] = useState(new Set())

  // Track which item keys existed in the cart on the previous render,
  // so we can distinguish genuinely-new items from quantity/stock updates.
  const prevItemKeysRef = useRef(new Set())

  // Refs to track customer switches and avoid stale closures
  const storageKeyRef = useRef(null)
  const prevCustomerIdRef = useRef(undefined) // undefined = not yet initialised
  const stateRef = useRef(state)

  // Keep stateRef in sync so the customer-switch effect can read the latest cart
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // --- Handle customer changes (login / logout / switch) ---
  useEffect(() => {
    const currentCustomerId = customer?.id ?? null
    const newKey = getStorageKey(currentCustomerId)

    // First render — migrate old shared cart key if present, then load
    if (prevCustomerIdRef.current === undefined) {
      migrateOldCart(newKey)
      const savedCart = loadCartFromStorage(newKey)
      dispatch({ type: 'LOAD_CART', payload: savedCart })
      storageKeyRef.current = newKey
      prevCustomerIdRef.current = currentCustomerId
      return
    }

    // Customer actually changed (login, logout, or account switch)
    if (prevCustomerIdRef.current !== currentCustomerId) {
      // Persist current cart under the OLD customer's key before switching
      const oldKey = getStorageKey(prevCustomerIdRef.current)
      localStorage.setItem(oldKey, JSON.stringify(stateRef.current))

      // Load the NEW customer's cart
      const savedCart = loadCartFromStorage(newKey)
      dispatch({ type: 'LOAD_CART', payload: savedCart })

      storageKeyRef.current = newKey
      prevCustomerIdRef.current = currentCustomerId
    }
  }, [customer?.id])

  // --- Persist cart to localStorage whenever it changes ---
  useEffect(() => {
    if (storageKeyRef.current) {
      localStorage.setItem(storageKeyRef.current, JSON.stringify(state))
    }
  }, [state])

  // Keep selectedKeys in sync with cart items.
  // Only auto-select genuinely NEW items (not previously in the cart).
  // Quantity / stock updates do NOT change the set of keys, so they won't re-select.
  useEffect(() => {
    const currentKeys = new Set(state.items.map(getItemKey))
    const prevItemKeys = prevItemKeysRef.current

    setSelectedKeys((prev) => {
      // Keep only keys that still exist in the cart
      const next = new Set([...prev].filter((k) => currentKeys.has(k)))

      // Auto-select genuinely new items (present in cart now but not before)
      for (const k of currentKeys) {
        if (!prevItemKeys.has(k)) {
          next.add(k)
        }
      }

      return next
    })

    // Remember current keys for next comparison
    prevItemKeysRef.current = currentKeys
  }, [state.items])

  // Selection helpers
  const toggleSelectItem = useCallback((productId, variantId = null) => {
    const key = variantId ? `${productId}-${variantId}` : `${productId}`
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedKeys(new Set(state.items.map(getItemKey)))
  }, [state.items])

  const deselectAll = useCallback(() => {
    setSelectedKeys(new Set())
  }, [])

  const isItemSelected = useCallback(
    (productId, variantId = null) => {
      const key = variantId ? `${productId}-${variantId}` : `${productId}`
      return selectedKeys.has(key)
    },
    [selectedKeys]
  )

  // Derived: selected items list & totals
  const selectedItems = useMemo(
    () => state.items.filter((item) => selectedKeys.has(getItemKey(item))),
    [state.items, selectedKeys]
  )

  const selectedTotalItems = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.quantity, 0),
    [selectedItems]
  )

  const selectedTotalAmount = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [selectedItems]
  )

  // Actions
  const addToCart = (product, quantity = 1, variant = null) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        name: product.name,
        price: variant ? variant.price : product.price,
        unit: product.unit,
        imageUrl: product.imageUrl,
        quantity,
        variantId: variant?.id || null,
        variantName: variant?.name || null,
        stockQuantity: variant ? variant.stockQuantity : product.stockQuantity,
      },
    })
  }

  const removeFromCart = (productId, variantId = null) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id: productId, variantId } })
  }

  const updateQuantity = (productId, quantity, variantId = null) => {
    const clampedQuantity = Math.max(1, quantity)
    dispatch({
      type: 'UPDATE_QUANTITY',
      payload: { id: productId, quantity: clampedQuantity, variantId },
    })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
    setSelectedKeys(new Set())
  }

  // Remove only the given items (used after partial checkout)
  const removeItems = useCallback((itemKeys) => {
    for (const key of itemKeys) {
      const parts = key.split('-')
      const productId = parseInt(parts[0], 10)
      const variantId = parts.length > 1 ? parseInt(parts[1], 10) : null
      dispatch({ type: 'REMOVE_ITEM', payload: { id: productId, variantId } })
    }
  }, [])

  const getItemQuantity = (productId, variantId = null) => {
    const searchKey = variantId ? `${productId}-${variantId}` : `${productId}`
    const item = state.items.find(item => {
      const itemKey = item.variantId
        ? `${item.id}-${item.variantId}`
        : `${item.id}`
      return itemKey === searchKey
    })
    return item ? item.quantity : 0
  }

  // Fetch live stock data from the server and update cart items
  const refreshStockLevels = useCallback(async () => {
    if (state.items.length === 0) return { clampedItems: [] }

    try {
      const cartItems = state.items.map(item => ({
        productId: item.id,
        variantId: item.variantId || undefined,
        quantity: item.quantity,
      }))

      const response = await orderApi.validateCart(cartItems)
      const { validatedItems = [], errors = [] } = response.data

      // Build a stock map from both validated items and error responses
      const stockMap = new Map()
      for (const vi of validatedItems) {
        const key = vi.variantId ? `${vi.productId}-${vi.variantId}` : `${vi.productId}`
        stockMap.set(key, vi.stockQuantity)
      }
      for (const err of errors) {
        if (err.availableQuantity !== undefined) {
          const key = err.variantId ? `${err.productId}-${err.variantId}` : `${err.productId}`
          stockMap.set(key, err.availableQuantity)
        }
      }

      // Determine which items will be clamped
      const clampedItems = state.items.filter(item => {
        const key = item.variantId ? `${item.id}-${item.variantId}` : `${item.id}`
        const newStock = stockMap.get(key)
        return newStock !== undefined && item.quantity > newStock
      }).map(item => ({
        name: item.name,
        variantName: item.variantName,
        oldQuantity: item.quantity,
        newQuantity: Math.max(1, stockMap.get(item.variantId ? `${item.id}-${item.variantId}` : `${item.id}`)),
      }))

      dispatch({ type: 'UPDATE_STOCK_LEVELS', payload: { stockMap } })

      return { clampedItems }
    } catch (error) {
      console.error('Error refreshing stock levels:', error)
      return { clampedItems: [] }
    }
  }, [state.items])

  const value = {
    items: state.items,
    totalItems: state.totalItems,
    totalAmount: state.totalAmount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    removeItems,
    getItemQuantity,
    refreshStockLevels,
    // Selection
    selectedKeys,
    selectedItems,
    selectedTotalItems,
    selectedTotalAmount,
    toggleSelectItem,
    selectAll,
    deselectAll,
    isItemSelected,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
