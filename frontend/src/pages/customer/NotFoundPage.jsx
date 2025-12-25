import { Link } from 'react-router-dom'
import { HomeIcon, ArrowLeftIcon, SearchIcon, WrenchIcon } from '../../components/icons'

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        {/* Animated 404 Illustration */}
        <div className="relative mb-8">
          <div className="text-[150px] font-bold text-neutral-200 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <WrenchIcon className="w-16 h-16 text-primary-600 animate-bounce" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl font-bold text-primary-900 mb-3">
          Page Not Found
        </h1>
        <p className="text-neutral-600 mb-8 text-lg">
          Sorry, we couldn't find the page you're looking for. 
          It might have been moved or doesn't exist.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="btn btn-primary inline-flex items-center justify-center gap-2"
          >
            <HomeIcon className="w-5 h-5" />
            Go to Home
          </Link>
          <Link
            to="/products"
            className="btn bg-neutral-200 text-neutral-700 hover:bg-neutral-300 inline-flex items-center justify-center gap-2"
          >
            <SearchIcon className="w-5 h-5" />
            Browse Products
          </Link>
        </div>

        {/* Back Navigation */}
        <button
          onClick={() => window.history.back()}
          className="mt-6 text-sm text-neutral-500 hover:text-primary-600 inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Go back to previous page
        </button>
      </div>
    </div>
  )
}
