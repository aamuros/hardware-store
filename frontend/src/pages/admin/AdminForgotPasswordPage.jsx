import { useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../services/api'
import { WrenchIcon, UserIcon } from '../../components/icons'

export default function AdminForgotPasswordPage() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [resetLink, setResetLink] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('Username is required')
      return
    }

    setLoading(true)
    try {
      const response = await adminApi.forgotPassword({ username: username.trim() })
      setSubmitted(true)
      if (response.data?.resetLink) {
        setResetLink(response.data.resetLink)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 py-12 px-4">
        <div className="max-w-md w-full animate-fade-in">
          <div className="bg-white rounded-2xl shadow-soft p-8 text-center">
            {/* Success icon */}
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-primary-900 mb-3">Reset Link Generated</h2>
            <p className="text-neutral-600 mb-2">
              If an account exists with that username, a password reset link has been generated.
            </p>
            <p className="text-neutral-500 text-sm mb-6">The link expires in 30 minutes.</p>

            {resetLink && (
              <div className="mb-5">
                <a
                  href={resetLink}
                  className="btn btn-primary w-full inline-block text-center"
                >
                  Reset Password Now
                </a>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => { setSubmitted(false); setUsername(''); setResetLink(null) }}
                className="btn btn-outline w-full"
              >
                Try a different username
              </button>
              <Link
                to="/admin/login"
                className="block text-accent-600 hover:text-accent-700 font-medium text-sm"
              >
                ← Back to Admin Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 py-12 px-4">
      <div className="max-w-md w-full animate-fade-in">
        <div className="bg-white rounded-2xl shadow-soft p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🔧</div>
            <h2 className="text-2xl font-bold text-primary-900">Forgot Password?</h2>
            <p className="text-neutral-600 mt-1 text-sm">
              Enter your admin username and we'll generate a reset link.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-neutral-700 mb-1">
                Username
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError('') }}
                  className="input w-full pl-10"
                  placeholder="Enter your username"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating reset link...
                </>
              ) : (
                'Generate Reset Link'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/admin/login"
              className="text-sm text-accent-600 hover:text-accent-700 font-medium"
            >
              ← Back to Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
