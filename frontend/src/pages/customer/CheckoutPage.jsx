import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { orderApi, customerApi } from '../../services/api'
import toast from 'react-hot-toast'
import { CloseIcon, CashIcon, PhoneIcon, CartIcon, CheckIcon } from '../../components/icons'

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

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, totalAmount, clearCart } = useCart()
  const { customer, isAuthenticated } = useCustomerAuth()
  const [loading, setLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedSavedAddress, setSelectedSavedAddress] = useState(null)
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
    barangay: '',
    landmarks: '',
    notes: '',
  })
  const [errors, setErrors] = useState({})

  // Load saved addresses if customer is authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      loadSavedAddresses()
      // Pre-fill customer name and phone if available
      if (customer) {
        setFormData(prev => ({
          ...prev,
          customerName: customer.name || '',
          phone: customer.phone || ''
        }))
      }
    }
  }, [customer, isAuthenticated])

  const loadSavedAddresses = async () => {
    try {
      const response = await customerApi.getAddresses()
      const addresses = response.data.data
      setSavedAddresses(addresses)
      
      // Auto-select default address if available
      const defaultAddress = addresses.find(addr => addr.isDefault)
      if (defaultAddress) {
        handleSelectAddress(defaultAddress)
      }
    } catch (error) {
      console.error('Failed to load saved addresses:', error)
    }
  }

  const handleSelectAddress = (address) => {
    setSelectedSavedAddress(address)
    setFormData(prev => ({
      ...prev,
      address: address.address,
      barangay: address.barangay,
      landmarks: address.landmarks || '',
    }))
    // Clear address-related errors
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.address
      delete newErrors.barangay
      delete newErrors.landmarks
      return newErrors
    })
    setShowAddressModal(false)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Name is required'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^(09|\+639)\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone format (e.g., 09171234567)'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    } else if (formData.address.trim().length < 5) {
      newErrors.address = 'Address must be at least 5 characters'
    }

    if (!formData.barangay.trim()) {
      newErrors.barangay = 'Barangay is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly')
      return
    }

    if (items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    // Check if any item has 0 quantity
    const itemsWithZeroQuantity = items.filter(item => !item.quantity || item.quantity <= 0)
    if (itemsWithZeroQuantity.length > 0) {
      toast.error('Cannot checkout with items that have 0 quantity. Please update your cart.')
      return
    }

    // Show confirmation modal
    setShowConfirmModal(true)
  }

  const confirmOrder = async () => {
    setShowConfirmModal(false)
    setLoading(true)
    try {
      // First, validate cart items to ensure they're still available
      const cartItems = items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        variantId: item.variantId || null,
        variantName: item.variantName || null,
        unitPrice: item.price,
      }))

      const validationResponse = await orderApi.validateCart(cartItems)
      const validation = validationResponse.data

      if (!validation.valid) {
        // Show detailed errors for each problematic item
        const errorMessages = validation.errors.map(err => err.message)
        toast.error(
          <div>
            <strong>Some items have issues:</strong>
            <ul className="mt-2 text-sm">
              {errorMessages.slice(0, 3).map((msg, i) => (
                <li key={i}>• {msg}</li>
              ))}
              {errorMessages.length > 3 && (
                <li>• ...and {errorMessages.length - 3} more</li>
              )}
            </ul>
          </div>,
          { duration: 5000 }
        )
        setLoading(false)
        return
      }

      // Cart is valid, proceed with order
      const orderData = {
        ...formData,
        items: cartItems,
      }

      // Include savedAddressId if a saved address was selected
      if (selectedSavedAddress) {
        orderData.savedAddressId = selectedSavedAddress.id
      }

      const response = await orderApi.create(orderData)
      const { orderNumber } = response.data.data

      clearCart()
      toast.success('Order placed successfully!')
      navigate(`/order-confirmation/${orderNumber}`)
    } catch (error) {
      console.error('Order error:', error)
      const responseData = error.response?.data

      // Handle specific validation errors from backend
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        // Map backend field errors to frontend form fields
        const fieldMapping = {
          customerName: 'customerName',
          phone: 'phone',
          address: 'address',
          barangay: 'barangay',
          landmarks: 'landmarks',
          notes: 'notes',
        }

        const newErrors = {}
        const unmappedErrors = []

        responseData.errors.forEach(err => {
          const fieldPath = err.path || err.param
          const mappedField = fieldMapping[fieldPath]

          if (mappedField) {
            newErrors[mappedField] = err.msg || err.message
          } else {
            unmappedErrors.push(err.msg || err.message)
          }
        })

        // Set field-specific errors
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors)
        }

        // Show toast for unmapped errors or a summary
        if (unmappedErrors.length > 0) {
          toast.error(unmappedErrors.join('. '))
        } else if (Object.keys(newErrors).length > 0) {
          toast.error('Please correct the errors in the form')
        }
      } else {
        const message = responseData?.message || 'Failed to place order'
        toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center animate-fade-in">
        <h1 className="text-2xl font-bold text-primary-900 mb-2">Your Cart is Empty</h1>
        <p className="text-neutral-600 mb-8">Add some products before checkout!</p>
        <Link to="/products" className="btn-primary">
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-primary-900 mb-4">Checkout</h1>

      {/* Progress Indicator */}
      <CheckoutProgress currentStep={2} />

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        {/* Delivery Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-primary-900 mb-4">Delivery Information</h2>

            {/* Saved Addresses - Button to open modal */}
            {isAuthenticated() && savedAddresses.length > 0 && (
              <div className="mb-6">
                {selectedSavedAddress ? (
                  <div className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-neutral-600">Delivering to:</span>
                          <span className="font-semibold text-primary-900">{selectedSavedAddress.label}</span>
                          {selectedSavedAddress.isDefault && (
                            <span className="text-xs text-neutral-500">(Default)</span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-700">{selectedSavedAddress.address}</p>
                        <p className="text-sm text-neutral-600">Barangay {selectedSavedAddress.barangay}</p>
                        {selectedSavedAddress.landmarks && (
                          <p className="text-xs text-neutral-500 mt-1">Near: {selectedSavedAddress.landmarks}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddressModal(true)}
                        className="text-sm text-primary-600 hover:text-primary-800 font-medium ml-4"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="w-full border-2 border-dashed border-neutral-300 rounded-lg p-4 text-primary-600 hover:border-primary-400 hover:bg-primary-50 transition-colors text-left"
                  >
                    <span className="font-medium">Choose Address</span>
                    <span className="text-sm text-neutral-600 block mt-1">
                      Select from your saved addresses
                    </span>
                  </button>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="customerName" className="label">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  className={`input ${errors.customerName ? 'input-error' : ''}`}
                  placeholder="Juan Dela Cruz"
                />
                {errors.customerName && (
                  <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="label">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    // Allow: backspace, delete, tab, escape, enter, +
                    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', '+'].includes(e.key)) {
                      return;
                    }
                    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
                      return;
                    }
                    // Prevent if not a number
                    if (!/^[0-9]$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  className={`input ${errors.phone ? 'input-error' : ''}`}
                  placeholder="09171234567"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="address" className="label">
                Complete Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className={`input ${errors.address ? 'input-error' : ''}`}
                placeholder="House/Unit No., Street, Subdivision/Village"
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="barangay" className="label">
                  Barangay <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="barangay"
                  name="barangay"
                  value={formData.barangay}
                  onChange={handleChange}
                  className={`input ${errors.barangay ? 'input-error' : ''}`}
                  placeholder="Enter your barangay"
                />
                {errors.barangay && (
                  <p className="text-red-500 text-sm mt-1">{errors.barangay}</p>
                )}
              </div>

              <div>
                <label htmlFor="landmarks" className="label">
                  Landmarks (optional)
                </label>
                <input
                  type="text"
                  id="landmarks"
                  name="landmarks"
                  value={formData.landmarks}
                  onChange={handleChange}
                  className="input"
                  placeholder="Near school, beside sari-sari store"
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="notes" className="label">
                Order Notes (optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                className="input"
                placeholder="Special instructions for your order"
              />
            </div>
          </div>

          {/* Order Items */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-primary-900 mb-4">Order Items</h2>
            <div className="space-y-3">
              {items.map((item) => {
                const itemKey = item.variantId ? `${item.id}-${item.variantId}` : `${item.id}`
                return (
                  <div key={itemKey} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
                    <div>
                      <p className="font-medium text-primary-900">{item.name}</p>
                      {item.variantName && (
                        <p className="text-xs text-primary-600 font-medium">{item.variantName}</p>
                      )}
                      <p className="text-sm text-neutral-500">
                        {item.quantity} {item.unit} × {formatPrice(item.price)}
                      </p>
                    </div>
                    <p className="font-bold text-primary-800">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-bold text-primary-900 mb-4">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Delivery Fee</span>
                <span className="text-emerald-600">To be confirmed</span>
              </div>
              <div className="border-t border-neutral-200 pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary-800">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Placing Order...
                </>
              ) : (
                'Place Order'
              )}
            </button>

            <Link
              to="/cart"
              className="block text-center mt-4 text-neutral-600 hover:text-accent-600 text-sm transition-colors"
            >
              ← Back to Cart
            </Link>

            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-sm text-amber-800 flex items-center gap-2">
                <CashIcon className="h-5 w-5 text-amber-600" />
                <span><strong>Cash on Delivery</strong><br />Pay when you receive your order</span>
              </p>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <PhoneIcon className="h-5 w-5 text-blue-600" />
                <span><strong>SMS Updates</strong><br />You'll receive order updates via SMS</span>
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-primary-900/50 backdrop-blur-sm"
              onClick={() => setShowConfirmModal(false)}
            />

            <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-2xl shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 animate-scale-in">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label="Close confirmation modal"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-accent-100 rounded-xl sm:mx-0 sm:h-10 sm:w-10">
                  <CartIcon className="h-5 w-5 text-accent-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                  <h3 className="text-lg font-semibold leading-6 text-primary-900">
                    Confirm Your Order
                  </h3>
                  <div className="mt-4">
                    <div className="bg-neutral-100 rounded-xl p-4 space-y-2">
                      <p className="text-sm text-neutral-700">
                        <span className="font-medium">Name:</span> {formData.customerName}
                      </p>
                      <p className="text-sm text-neutral-700">
                        <span className="font-medium">Phone:</span> {formData.phone}
                      </p>
                      <p className="text-sm text-neutral-700">
                        <span className="font-medium">Address:</span> {formData.address}, {formData.barangay}
                      </p>
                      <p className="text-sm text-neutral-700">
                        <span className="font-medium">Items:</span> {items.length} item(s)
                      </p>
                      <p className="text-lg font-bold text-primary-800 pt-2 border-t border-neutral-200">
                        Total: {formatPrice(totalAmount)}
                      </p>
                    </div>
                    <p className="mt-3 text-sm text-neutral-500">
                      By confirming, you agree to our terms of service. Payment is Cash on Delivery.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                <button
                  type="button"
                  onClick={confirmOrder}
                  className="btn-primary w-full sm:w-auto"
                >
                  Confirm Order
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="btn-outline w-full sm:w-auto mt-3 sm:mt-0"
                >
                  Review Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-primary-900/50 backdrop-blur-sm"
              onClick={() => setShowAddressModal(false)}
            />

            <div className="relative inline-block w-full max-w-2xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-2xl shadow-xl sm:my-8 sm:align-middle sm:p-6 animate-scale-in">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label="Close address modal"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-primary-900 mb-2">
                  Choose Delivery Address
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-600">
                    Select an address or enter a new one
                  </p>
                  <Link
                    to="/account/addresses"
                    className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                    onClick={() => setShowAddressModal(false)}
                  >
                    Manage Addresses
                  </Link>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {savedAddresses.map((address) => (
                  <label
                    key={address.id}
                    className="flex items-start gap-3 p-4 border border-neutral-200 rounded-lg cursor-pointer hover:border-primary-300 hover:bg-primary-50/50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="savedAddress"
                      checked={selectedSavedAddress?.id === address.id}
                      onChange={() => handleSelectAddress(address)}
                      className="mt-1 w-4 h-4 text-primary-600 border-neutral-300 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-primary-900">{address.label}</span>
                        {address.isDefault && (
                          <span className="text-xs text-neutral-500">(Default)</span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-700">{address.address}</p>
                      <p className="text-sm text-neutral-600">Barangay {address.barangay}</p>
                      {address.landmarks && (
                        <p className="text-xs text-neutral-500 mt-1">Near: {address.landmarks}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="btn-primary"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
