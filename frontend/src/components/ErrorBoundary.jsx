import { Component } from 'react'
import { Link } from 'react-router-dom'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    // Log error to console in development
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-soft p-8 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-primary-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-neutral-600 mb-6">
              We're sorry, but something unexpected happened. Please try again.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="btn btn-primary w-full"
              >
                Try Again
              </button>
              <Link
                to="/"
                onClick={this.handleReset}
                className="btn bg-neutral-200 text-neutral-700 hover:bg-neutral-300 w-full block"
              >
                Go to Home
              </Link>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-neutral-500 hover:text-neutral-700">
                  Technical Details
                </summary>
                <pre className="mt-2 p-3 bg-neutral-100 rounded text-xs overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
