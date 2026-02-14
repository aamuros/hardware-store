import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TrashIcon, MinusIcon, PlusIcon, CartIcon, BoxIcon, CashIcon, CheckIcon } from '../../components/icons'
import { useCart } from '../../context/CartContext'

// Checkout Progress Steps Component
function CheckoutProgress({ currentStep }) {
  const steps = [
    { id: 1, name: 'Cart', shortName: '1' },
    { id: 2, name: 'Details', shortName: '2' },
    { id: 3, name: 'Confirm', shortName: '3' },
  ]

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`checkout-step ${currentStep === step.id ? 'active' : currentStep > step.id ? 'completed' : ''}`}>
            <span className={`checkout-step-dot ${currentStep === step.id ? 'active' :
                currentStep > step.id ? 'completed' : 'inactive'
              }`}>
              {currentStep > step.id ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                step.shortName
              )}
            </span>
            <span className="ml-2 hidden sm:inline">{step.name}</span>
          </div>
          {index < steps.length - 1 && (
            <div className={`checkout-step-line w-8 sm:w-16 ${currentStep > step.id ? 'completed' : ''}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// Confirmation Modal Component
function RemoveItemModal({ item, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-fade-in">
        <h3 className="text-lg font-bold text-primary-900 mb-2">Remove Item?</h3>
        <p className="text-neutral-600 mb-1">
          Are you sure you want to remove <strong>{item.name}</strong>{item.variantName ? ` (${item.variantName})` : ''} from your cart?
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-xl font-medium hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

// Editable Quantity Input Component
function QuantityInput({ item, updateQuantity, onRequestRemove }) {
  const [editValue, setEditValue] = useState(null) // null = not editing
  const isEditing = editValue !== null

  const handleFocus = (e) => {
    setEditValue(String(item.quantity))
    // Select all text on focus so user can immediately type a replacement
    setTimeout(() => e.target.select(), 0)
  }

  const commitValue = () => {
    const parsed = parseInt(editValue, 10)
    if (!editValue || isNaN(parsed) || parsed < 0) {
      // Invalid or empty → revert
      setEditValue(null)
      return
    }
    if (parsed === 0) {
      // User typed 0 → ask for removal confirmation
      setEditValue(null)
      onRequestRemove()
      return
    }
    updateQuantity(item.id, parsed, item.variantId)
    setEditValue(null)
  }

  const handleBlur = () => {
    commitValue()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur()
    } else if (e.key === 'Escape') {
      setEditValue(null)
      e.target.blur()
    }
  }

  const handleChange = (e) => {
    // Allow only digits (and empty string for clearing)
    const val = e.target.value
    if (val === '' || /^\d+$/.test(val)) {
      setEditValue(val)
    }
  }

  const handleDecrement = () => {
    if (item.quantity <= 1) {
      // Would go to 0 → ask confirmation
      onRequestRemove()
    } else {
      updateQuantity(item.id, item.quantity - 1, item.variantId)
    }
  }

  const handleIncrement = () => {
    updateQuantity(item.id, item.quantity + 1, item.variantId)
  }

  return (
    <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden">
      <button
        onClick={handleDecrement}
        className="p-2 hover:bg-neutral-100 transition-colors"
        aria-label={`Decrease quantity of ${item.name}`}
      >
        <MinusIcon className="h-4 w-4" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={isEditing ? editValue : item.quantity}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-12 text-center text-sm font-medium bg-transparent outline-none border-none"
        aria-label={`Quantity of ${item.name}`}
      />
      <button
        onClick={handleIncrement}
        className="p-2 hover:bg-neutral-100 transition-colors"
        aria-label={`Increase quantity of ${item.name}`}
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function CartPage() {
  const { items, totalAmount, updateQuantity, removeFromCart, clearCart } = useCart()
  const [itemToRemove, setItemToRemove] = useState(null)

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price)
  }

  const handleConfirmRemove = () => {
    if (itemToRemove) {
      removeFromCart(itemToRemove.id, itemToRemove.variantId)
      setItemToRemove(null)
    }
  }

  const handleCancelRemove = () => {
    setItemToRemove(null)
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center animate-fade-in">
        <div className="w-20 h-20 bg-neutral-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <CartIcon className="h-10 w-10 text-neutral-400" />
        </div>
        <h1 className="text-2xl font-bold text-primary-900 mb-2">Your Cart is Empty</h1>
        <p className="text-neutral-600 mb-8">Start adding products to your cart!</p>
        <Link to="/products" className="btn-primary">
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-primary-900 mb-4">Shopping Cart</h1>

      {/* Progress Indicator */}
      <CheckoutProgress currentStep={1} />

      <div className="flex items-center justify-end mb-4">
        <button
          onClick={clearCart}
          className="text-red-600 hover:text-red-700 text-sm font-medium"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            // Use composite key for items with variants
            const itemKey = item.variantId ? `${item.id}-${item.variantId}` : `${item.id}`
            return (
              <div key={itemKey} className="card p-4 flex gap-4">
                {/* Image */}
                <div className="w-20 h-20 bg-neutral-100 rounded-xl flex-shrink-0 overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                      <BoxIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/products/${item.id}`}
                    className="font-medium text-primary-900 hover:text-accent-600 line-clamp-1 transition-colors"
                  >
                    {item.name}
                  </Link>
                  {item.variantName && (
                    <p className="text-sm text-primary-600 font-medium">
                      {item.variantName}
                    </p>
                  )}
                  <p className="text-sm text-neutral-500">
                    {formatPrice(item.price)} / {item.unit}
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 mt-2">
                    <QuantityInput
                      item={item}
                      updateQuantity={updateQuantity}
                      onRequestRemove={() => setItemToRemove(item)}
                    />
                    <button
                      onClick={() => setItemToRemove(item)}
                      className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="text-right">
                  <p className="font-bold text-primary-800">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            )
          })
          }
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-bold text-primary-900 mb-4">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal ({items.length} items)</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Delivery Fee</span>
                <span className="text-emerald-600">To be calculated</span>
              </div>
              <div className="border-t border-neutral-200 pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary-800">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <Link to="/checkout" className="btn-primary w-full text-center block">
              Proceed to Checkout
            </Link>

            <Link
              to="/products"
              className="block text-center mt-4 text-neutral-600 hover:text-accent-600 text-sm transition-colors"
            >
              ← Continue Shopping
            </Link>

            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-sm text-amber-800 flex items-center gap-2">
                <CashIcon className="h-5 w-5 text-amber-600" />
                <span><strong>Cash on Delivery</strong> - Payment upon delivery</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Remove Item Confirmation Modal */}
      {itemToRemove && (
        <RemoveItemModal
          item={itemToRemove}
          onConfirm={handleConfirmRemove}
          onCancel={handleCancelRemove}
        />
      )}
    </div>
  )
}
