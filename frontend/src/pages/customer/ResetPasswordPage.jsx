import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { customerApi } from '../../services/api'
import toast from 'react-hot-toast'
import { LockIcon, EyeIcon, EyeSlashIcon } from '../../components/icons'

// Password requirement check component
function PasswordRequirement({ label, met }) {
    return (
        <li className={`flex items-center gap-2 text-sm ${met ? 'text-green-600' : 'text-neutral-500'}`}>
            {met ? (
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <svg className="w-4 h-4 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                </svg>
            )}
            <span>{label}</span>
        </li>
    )
}

// Password strength indicator
function getPasswordStrength(password) {
    if (!password) return { level: 0, label: '', color: '' }
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++
    
    if (score <= 2) return { level: score, label: 'Weak', color: 'bg-red-500' }
    if (score <= 3) return { level: score, label: 'Fair', color: 'bg-yellow-500' }
    if (score <= 4) return { level: score, label: 'Good', color: 'bg-blue-500' }
    return { level: score, label: 'Strong', color: 'bg-green-500' }
}

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const token = searchParams.get('token')

    const [loading, setLoading] = useState(false)
    const [verifying, setVerifying] = useState(true)
    const [tokenValid, setTokenValid] = useState(false)
    const [tokenError, setTokenError] = useState('')
    const [email, setEmail] = useState('')
    const [success, setSuccess] = useState(false)

    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    })
    const [errors, setErrors] = useState({})

    // Verify token on mount
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setTokenError('No reset token provided. Please request a new password reset link.')
                setVerifying(false)
                return
            }
            try {
                const response = await customerApi.verifyResetToken({ token })
                setTokenValid(true)
                setEmail(response.data.data.email)
            } catch (err) {
                const message = err.response?.data?.message || 'Invalid or expired reset link.'
                setTokenError(message)
            } finally {
                setVerifying(false)
            }
        }
        verifyToken()
    }, [token])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    // Password requirements check
    const requirements = [
        { label: 'At least 8 characters', met: formData.password.length >= 8 },
        { label: 'At least one uppercase letter (A-Z)', met: /[A-Z]/.test(formData.password) },
        { label: 'At least one lowercase letter (a-z)', met: /[a-z]/.test(formData.password) },
        { label: 'At least one number (0-9)', met: /[0-9]/.test(formData.password) },
        { label: 'At least one special character (!@#$%^&*)', met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) },
    ]

    const allRequirementsMet = requirements.every(r => r.met)
    const strength = getPasswordStrength(formData.password)

    const validateForm = () => {
        const newErrors = {}
        if (!formData.password) {
            newErrors.password = 'New password is required'
        } else if (!allRequirementsMet) {
            newErrors.password = 'Password does not meet all requirements'
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return

        setLoading(true)
        try {
            await customerApi.resetPassword({
                token,
                newPassword: formData.password,
            })
            setSuccess(true)
            toast.success('Password reset successfully!')
        } catch (err) {
            const data = err.response?.data
            if (data?.requirements) {
                // Show detailed requirement feedback from server
                const unmet = data.requirements.filter(r => !r.met)
                const tips = unmet.map(r => r.tip).filter(Boolean).join('. ')
                toast.error(tips || data.message)
            } else {
                toast.error(data?.message || 'Failed to reset password. Please try again.')
            }
            // If token expired or invalid, show token error
            if (err.response?.status === 400 && data?.message?.includes('expired')) {
                setTokenValid(false)
                setTokenError(data.message)
            }
        } finally {
            setLoading(false)
        }
    }

    // Loading state
    if (verifying) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-neutral-600">Verifying your reset link...</p>
                </div>
            </div>
        )
    }

    // Invalid token
    if (!tokenValid && !success) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
                <div className="w-full max-w-md">
                    <div className="card p-8 text-center">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-primary-900 mb-3">Invalid Reset Link</h1>
                        <p className="text-neutral-600 mb-6">{tokenError}</p>
                        <div className="space-y-3">
                            <Link
                                to="/forgot-password"
                                className="btn-primary w-full block text-center"
                            >
                                Request New Reset Link
                            </Link>
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

    // Success state
    if (success) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
                <div className="w-full max-w-md">
                    <div className="card p-8 text-center">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-primary-900 mb-3">Password Reset Successful!</h1>
                        <p className="text-neutral-600 mb-6">
                            Your password has been updated. You can now sign in with your new password.
                        </p>
                        <Link
                            to="/login"
                            className="btn-primary w-full block text-center"
                        >
                            Sign In Now
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // Reset form
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary-900">Reset Your Password</h1>
                    <p className="text-neutral-600 mt-2">
                        Create a new password for <strong className="text-primary-700">{email}</strong>
                    </p>
                </div>

                <div className="card p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="password" className="label">
                                New Password
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
                                    autoFocus
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
                                    {requirements.map((req, i) => (
                                        <PasswordRequirement key={i} label={req.label} met={req.met} />
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="label">
                                Confirm New Password
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
                            {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Passwords match
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !allRequirementsMet}
                            className="btn-primary w-full flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Resetting password...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
