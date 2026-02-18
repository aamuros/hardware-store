import { useState } from 'react'
import { Link } from 'react-router-dom'
import { customerApi } from '../../services/api'
import toast from 'react-hot-toast'
import { LockIcon, EyeIcon, EyeSlashIcon, ArrowLeftIcon } from '../../components/icons'

const PASSWORD_RULES = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
    { label: 'One number', test: (p) => /[0-9]/.test(p) },
    { label: 'One special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
]

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

export default function CustomerChangePasswordPage() {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const [show, setShow] = useState({ current: false, newPwd: false, confirm: false })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
        setError('')
        setSuccess(false)
    }

    const toggleShow = (field) => setShow((prev) => ({ ...prev, [field]: !prev[field] }))

    const allRulesMet = PASSWORD_RULES.every((r) => r.test(formData.newPassword))
    const passwordsMatch =
        formData.confirmPassword !== '' && formData.newPassword === formData.confirmPassword

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess(false)

        if (!formData.currentPassword) {
            setError('Please enter your current password.')
            return
        }
        if (!allRulesMet) {
            setError('New password does not meet the requirements.')
            return
        }
        if (!passwordsMatch) {
            setError('New passwords do not match.')
            return
        }

        setLoading(true)
        try {
            await customerApi.changePassword({
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
            })
            setSuccess(true)
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
            toast.success('Password changed successfully!')
        } catch (err) {
            const message =
                err.response?.data?.message || 'Failed to change password. Please try again.'
            setError(message)
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            {/* Back link */}
            <Link
                to="/account"
                className="inline-flex items-center gap-2 text-sm text-accent-600 hover:text-accent-700 font-medium mb-6"
            >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Account
            </Link>

            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <LockIcon className="w-6 h-6 text-accent-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-primary-900">Change Password</h1>
                    <p className="text-neutral-500 text-sm">Update your account password. You'll stay logged in.</p>
                </div>
            </div>

            <div className="card p-6 sm:p-8">
                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Password changed successfully!
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Current password */}
                    <div>
                        <label className="label">Current Password</label>
                        <div className="relative">
                            <input
                                type={show.current ? 'text' : 'password'}
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                className="input w-full pr-10"
                                placeholder="Enter your current password"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => toggleShow('current')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                                tabIndex={-1}
                            >
                                {show.current ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>
                        <p className="mt-1.5 text-xs text-neutral-500">
                            <Link to="/forgot-password" className="text-accent-600 hover:text-accent-700 font-medium">
                                Forgot your password?
                            </Link>
                        </p>
                    </div>

                    {/* New password */}
                    <div>
                        <label className="label">New Password</label>
                        <div className="relative">
                            <input
                                type={show.newPwd ? 'text' : 'password'}
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                className="input w-full pr-10"
                                placeholder="Enter new password"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => toggleShow('newPwd')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                                tabIndex={-1}
                            >
                                {show.newPwd ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Password requirements */}
                        {formData.newPassword && (
                            <ul className="mt-3 space-y-1.5 pl-1">
                                {PASSWORD_RULES.map((rule) => (
                                    <PasswordRequirement
                                        key={rule.label}
                                        label={rule.label}
                                        met={rule.test(formData.newPassword)}
                                    />
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Confirm password */}
                    <div>
                        <label className="label">Confirm New Password</label>
                        <div className="relative">
                            <input
                                type={show.confirm ? 'text' : 'password'}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`input w-full pr-10 ${
                                    formData.confirmPassword && !passwordsMatch
                                        ? 'input-error'
                                        : formData.confirmPassword && passwordsMatch
                                        ? 'border-green-400 focus:ring-green-400'
                                        : ''
                                }`}
                                placeholder="Confirm new password"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => toggleShow('confirm')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                                tabIndex={-1}
                            >
                                {show.confirm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>
                        {formData.confirmPassword && !passwordsMatch && (
                            <p className="mt-1 text-xs text-red-500">Passwords do not match.</p>
                        )}
                        {formData.confirmPassword && passwordsMatch && (
                            <p className="mt-1 text-xs text-green-600">Passwords match.</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !allRulesMet || !passwordsMatch}
                        className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Changing password…
                            </span>
                        ) : (
                            'Change Password'
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
