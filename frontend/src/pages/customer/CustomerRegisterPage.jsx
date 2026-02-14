import { useState } from 'react'
import { useNavigate, Link, useLocation, Navigate } from 'react-router-dom'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import toast from 'react-hot-toast'
import { UserIcon, EmailIcon, LockIcon, PhoneIcon, EyeIcon, EyeSlashIcon } from '../../components/icons'

export default function CustomerRegisterPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { register, isAuthenticated } = useCustomerAuth()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [serverErrors, setServerErrors] = useState([])
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
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

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required'
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters long'
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address (e.g., name@example.com)'
        }

        if (formData.phone && !/^(09|\+639)\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Please enter a valid Philippine mobile number (e.g., 09171234567)'
        }

        if (!formData.password) {
            newErrors.password = 'Password is required'
        } else {
            // Check each requirement
            const unmet = passwordRequirements.filter(r => !r.met)
            if (unmet.length > 0) {
                newErrors.password = 'Password does not meet all requirements'
            }
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password'
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Password requirements check
    const passwordRequirements = [
        { label: 'At least 8 characters', met: formData.password.length >= 8 },
        { label: 'At least one uppercase letter (A-Z)', met: /[A-Z]/.test(formData.password) },
        { label: 'At least one lowercase letter (a-z)', met: /[a-z]/.test(formData.password) },
        { label: 'At least one number (0-9)', met: /[0-9]/.test(formData.password) },
        { label: 'At least one special character (!@#$%^&*)', met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) },
    ]

    const allRequirementsMet = passwordRequirements.every(r => r.met)

    // Password strength calculation
    const getPasswordStrength = () => {
        if (!formData.password) return { level: 0, label: '', color: '' }
        let score = passwordRequirements.filter(r => r.met).length
        if (score <= 2) return { level: score, label: 'Weak', color: 'bg-red-500' }
        if (score <= 3) return { level: score, label: 'Fair', color: 'bg-yellow-500' }
        if (score <= 4) return { level: score, label: 'Good', color: 'bg-blue-500' }
        return { level: score, label: 'Strong', color: 'bg-green-500' }
    }

    const strength = getPasswordStrength()

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setLoading(true)
        const result = await register(formData.name, formData.email, formData.password, formData.phone)
        setLoading(false)

        if (result.success) {
            toast.success('Account created successfully!')
            const from = location.state?.from?.pathname || '/account'
            navigate(from, { replace: true })
        } else {
            // Handle detailed server errors
            const data = result.data || {}
            setServerErrors([])

            if (data.errors && Array.isArray(data.errors)) {
                // Map server field errors to form errors
                const fieldErrors = {}
                data.errors.forEach(err => {
                    if (err.field) {
                        fieldErrors[err.field] = err.message
                    }
                })
                if (Object.keys(fieldErrors).length > 0) {
                    setErrors(prev => ({ ...prev, ...fieldErrors }))
                }
            }

            if (data.requirements) {
                setServerErrors(data.requirements)
            }

            // If suggestion is 'login', show a special message
            if (data.suggestion === 'login') {
                toast.error(
                    <span>
                        {data.message}{' '}
                        <a href="/login" className="font-bold underline">Sign in here</a>
                    </span>,
                    { duration: 6000 }
                )
            } else {
                toast.error(result.message)
            }
        }
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary-900">Create Account</h1>
                    <p className="text-neutral-600 mt-2">Join us for a better shopping experience</p>
                </div>

                <div className="card p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="name" className="label">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`input pl-10 ${errors.name ? 'input-error' : ''}`}
                                    placeholder="Juan Dela Cruz"
                                    autoComplete="name"
                                />
                            </div>
                            {errors.name && (
                                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="email" className="label">
                                Email Address <span className="text-red-500">*</span>
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
                            <label htmlFor="phone" className="label">
                                Phone Number <span className="text-neutral-400 text-sm">(optional)</span>
                            </label>
                            <div className="relative">
                                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`input pl-10 ${errors.phone ? 'input-error' : ''}`}
                                    placeholder="09171234567"
                                    autoComplete="tel"
                                />
                            </div>
                            {errors.phone && (
                                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="label">
                                Password <span className="text-red-500">*</span>
                            </label>
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
                                    autoComplete="new-password"
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

                            {/* Password strength bar */}
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                                                style={{ width: `${(strength.level / 5) * 100}%` }}
                                            />
                                        </div>
                                        <span className={`text-xs font-medium ${
                                            strength.level <= 2 ? 'text-red-600' :
                                            strength.level <= 3 ? 'text-yellow-600' :
                                            strength.level <= 4 ? 'text-blue-600' :
                                            'text-green-600'
                                        }`}>
                                            {strength.label}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Password requirements checklist */}
                            {formData.password && (
                                <ul className="mt-3 space-y-1.5">
                                    {passwordRequirements.map((req, i) => (
                                        <li key={i} className={`flex items-center gap-2 text-sm ${req.met ? 'text-green-600' : 'text-neutral-500'}`}>
                                            {req.met ? (
                                                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                                </svg>
                                            )}
                                            <span>{req.label}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* Server-side requirement errors */}
                            {serverErrors.length > 0 && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-700 text-sm font-medium mb-1">Password requirements not met:</p>
                                    <ul className="space-y-1">
                                        {serverErrors.filter(r => !r.met).map((req, i) => (
                                            <li key={i} className="text-red-600 text-sm flex items-start gap-2">
                                                <span className="text-red-400 mt-0.5">•</span>
                                                <span>{req.label}{req.tip ? ` — ${req.tip}` : ''}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="label">
                                Confirm Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`input pl-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                />
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
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
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-neutral-600">
                            Already have an account?{' '}
                            <Link to="/login" className="text-accent-600 hover:text-accent-700 font-medium">
                                Sign in
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
