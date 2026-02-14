import { useState } from 'react'
import { useNavigate, Link, useLocation, Navigate } from 'react-router-dom'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import toast from 'react-hot-toast'
import { EmailIcon, LockIcon, EyeIcon, EyeSlashIcon } from '../../components/icons'

export default function CustomerLoginPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { login, isAuthenticated } = useCustomerAuth()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })
    const [errors, setErrors] = useState({})

    // Redirect if already logged in
    if (isAuthenticated()) {
        const from = location.state?.from?.pathname || '/account'
        return <Navigate to={from} replace />
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

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format'
        }

        if (!formData.password) {
            newErrors.password = 'Password is required'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setLoading(true)
        const result = await login(formData.email, formData.password)
        setLoading(false)

        if (result.success) {
            toast.success('Welcome back!')
            const from = location.state?.from?.pathname || '/account'
            navigate(from, { replace: true })
        } else {
            toast.error(result.message)
        }
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary-900">Welcome Back</h1>
                    <p className="text-neutral-600 mt-2">Sign in to your account</p>
                </div>

                <div className="card p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="label">
                                Email Address
                            </label>
                            <div className="relative">
                                <EmailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="label">
                                    Password
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-accent-600 hover:text-accent-700 text-sm font-medium"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="w-5 h-5" />
                                    ) : (
                                        <EyeIcon className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
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
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-neutral-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-accent-600 hover:text-accent-700 font-medium">
                                Create one
                            </Link>
                        </p>
                    </div>

                    <div className="mt-6 pt-6 border-t border-neutral-200">
                        <Link
                            to="/"
                            className="block text-center text-neutral-600 hover:text-accent-600 text-sm transition-colors"
                        >
                            ← Continue shopping as guest
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
