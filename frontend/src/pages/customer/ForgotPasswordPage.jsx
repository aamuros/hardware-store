import { useState } from 'react'
import { Link } from 'react-router-dom'
import { customerApi } from '../../services/api'
import toast from 'react-hot-toast'
import { UserIcon } from '../../components/icons'

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false)
    const [username, setUsername] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')
    const [resetLink, setResetLink] = useState(null)

    const validateUsername = () => {
        if (!username.trim()) {
            setError('Username is required')
            return false
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
            setError('Please enter a valid username')
            return false
        }
        setError('')
        return true
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateUsername()) return

        setLoading(true)
        try {
            const response = await customerApi.forgotPassword({ username: username.trim() })
            setSubmitted(true)
            if (response.data?.resetLink) {
                setResetLink(response.data.resetLink)
            }
            toast.success('Reset link generated!')
        } catch (err) {
            const message = err.response?.data?.message || 'Something went wrong. Please try again.'
            toast.error(message)
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
                <div className="w-full max-w-md">
                    <div className="card p-8 text-center">
                        {/* Success Icon */}
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-bold text-primary-900 mb-3">Password Reset Requested</h1>
                        <p className="text-neutral-600 mb-2">
                            If an account exists with that username, we've sent a password reset link.
                        </p>
                        <p className="text-neutral-500 text-sm mb-6">
                            The link will expire in 30 minutes.
                        </p>

                        {resetLink && (
                            <div className="mb-4">
                                <a
                                    href={resetLink}
                                    className="btn-primary inline-block w-full text-center"
                                >
                                    Reset Password Now
                                </a>
                            </div>
                        )}

                        <div className="space-y-3">
                            <button
                                onClick={() => { setSubmitted(false); setUsername(''); }}
                                className="btn-outline w-full"
                            >
                                Try a different username
                            </button>
                            <Link
                                to="/login"
                                className="block text-accent-600 hover:text-accent-700 font-medium text-sm"
                            >
                                ← Back to Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary-900">Forgot Password?</h1>
                    <p className="text-neutral-600 mt-2">
                        Enter your username and we'll send you a link to reset your password.
                    </p>
                </div>

                <div className="card p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="label">
                                Username
                            </label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value)
                                        if (error) setError('')
                                    }}
                                    className={`input pl-10 ${error ? 'input-error' : ''}`}
                                    placeholder="Enter your username"
                                    autoComplete="username"
                                    autoFocus
                                />
                            </div>
                            {error && (
                                <p className="text-red-500 text-sm mt-1">{error}</p>
                            )}
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
                                    Sending reset link...
                                </>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="text-accent-600 hover:text-accent-700 font-medium text-sm"
                        >
                            ← Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
