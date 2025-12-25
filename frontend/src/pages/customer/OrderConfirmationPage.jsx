import { useParams, Link } from 'react-router-dom'
import { CheckCircleIcon } from '../../components/icons'

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams()

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="animate-fade-in">
        <CheckCircleIcon className="h-20 w-20 text-emerald-500 mx-auto mb-6" />
        
        <h1 className="text-3xl font-bold text-primary-900 mb-4">
          Order Placed Successfully!
        </h1>
        
        <p className="text-neutral-600 mb-2">Thank you for your order.</p>
        <p className="text-neutral-600 mb-8">
          We'll send you SMS updates on your order status.
        </p>

        <div className="bg-neutral-100 rounded-2xl p-6 mb-8">
          <p className="text-sm text-neutral-500 mb-2">Your Order Number</p>
          <p className="text-2xl font-bold text-primary-800">{orderNumber}</p>
          <p className="text-sm text-neutral-500 mt-2">
            Save this number to track your order
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-primary-900">What's Next?</h2>
          <div className="text-left space-y-3 max-w-md mx-auto">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-accent-100 text-accent-700 flex items-center justify-center text-sm font-bold">1</span>
              <p className="text-neutral-600">We'll review your order and confirm availability</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-accent-100 text-accent-700 flex items-center justify-center text-sm font-bold">2</span>
              <p className="text-neutral-600">You'll receive an SMS when your order is accepted</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-accent-100 text-accent-700 flex items-center justify-center text-sm font-bold">3</span>
              <p className="text-neutral-600">We'll notify you when it's out for delivery</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-accent-100 text-accent-700 flex items-center justify-center text-sm font-bold">4</span>
              <p className="text-neutral-600">Prepare cash payment upon delivery</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link to={`/track-order?order=${orderNumber}`} className="btn-primary">
            Track Your Order
          </Link>
          <Link to="/products" className="btn-outline">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
