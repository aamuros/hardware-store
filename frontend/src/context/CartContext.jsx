import { createContext, useContext, useReducer, useEffect } from 'react'

const CartContext = createContext()

// Maximum quantity per item
const MAX_QUANTITY = 999

// Initial state
const initialState = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
}

// Load cart from localStorage
const loadCartFromStorage = () => {
  try {
    const savedCart = localStorage.getItem('hardware-store-cart')
    return savedCart ? JSON.parse(savedCart) : initialState
  } catch (error) {
    console.error('Error loading cart from storage:', error)
    return initialState
  }
}

// Cart reducer
const cartReducer = (state, action) => {
  let newState

  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        item => item.id === action.payload.id
      )

      let updatedItems

      if (existingIndex >= 0) {
        // Item exists, update quantity with max limit
        updatedItems = state.items.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: Math.min(item.quantity + action.payload.quantity, MAX_QUANTITY) }
            : item
        )
      } else {
        // New item with quantity limit
        updatedItems = [...state.items, { ...action.payload, quantity: Math.min(action.payload.quantity, MAX_QUANTITY) }]
      }

      newState = {
        ...state,
        items: updatedItems,
        ...calculateTotals(updatedItems),
      }
      break
    }

    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id !== action.payload)
      newState = {
        ...state,
        items: updatedItems,
        ...calculateTotals(updatedItems),
      }
      break
    }

    case 'UPDATE_QUANTITY': {
      const newQuantity = Math.min(Math.max(1, action.payload.quantity), MAX_QUANTITY)
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: newQuantity }
          : item
      )
      newState = {
        ...state,
        items: updatedItems,
        ...calculateTotals(updatedItems),
      }
      break
    }

    case 'CLEAR_CART':
      newState = initialState
      break

    case 'LOAD_CART':
      newState = action.payload
      break

    default:
      return state
  }

  // Save to localStorage
  localStorage.setItem('hardware-store-cart', JSON.stringify(newState))
  return newState
}

// Calculate totals
const calculateTotals = (items) => {
  return {
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  }
}

// Provider component
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = loadCartFromStorage()
    if (savedCart.items.length > 0) {
      dispatch({ type: 'LOAD_CART', payload: savedCart })
    }
  }, [])

  // Actions
  const addToCart = (product, quantity = 1) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        imageUrl: product.imageUrl,
        quantity,
      },
    })
  }

  const removeFromCart = (productId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId })
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId)
    } else {
      dispatch({
        type: 'UPDATE_QUANTITY',
        payload: { id: productId, quantity },
      })
    }
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  const getItemQuantity = (productId) => {
    const item = state.items.find(item => item.id === productId)
    return item ? item.quantity : 0
  }

  const value = {
    items: state.items,
    totalItems: state.totalItems,
    totalAmount: state.totalAmount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
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
