import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { adminApi } from '../../services/api'
import { LockIcon, EyeIcon, EyeSlashIcon } from '../../components/icons'

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

export default function AdminResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [verifying, setVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [tokenError, setTokenError] = useState('')
  const [adminName, setAdminName] = useState('')

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setTokenError('No reset token provided. Please request a new password reset link.')
        setVerifying(false)
        return
      }
      try {
        const response = await adminApi.verifyResetToken({ token })
        setTokenValid(true)
        setAdminName(response.data.data?.name || '')
      } catch (err) {
        setTokenError(err.response?.data?.message || 'Invalid or expired reset link.')
      } finally {
        setVerifying(false)
      }
    }
    verify()
  }, [token])

  const allRulesMet = PASSWORD_RULES.every((r) => r.test(formData.password))
  const passwordsMatch = formData.confirmPassword !== '' && formData.password === formData.confirmPassword

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!allRulesMet) {
      setError('Password does not meet the requirements.')
      return
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await adminApi.resetPassword({ token, newPassword: formData.password })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ----- Loading state -----
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-neutral-500 text-sm">Verifying reset link…</p>
        </div>
      </div>
    )
  }

  // ----- Invalid token -----
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 py-12 px-4">
        <div className="max-w-md w-full animate-fade-in">
          <div className="bg-white rounded-2xl shadow-soft p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-primary-900 mb-3">Invalid Reset Link</h2>
            <p className="text-neutral-600 mb-6">{tokenError}</p>
            <Link to="/admin/forgot-password" className="btn btn-primary w-full inline-block text-center mb-3">
              Request a New Link
            </Link>
            <Link to="/admin/login" className="block text-sm text-accent-600 hover:text-accent-700 font-medium">
              ← Back to Admin Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ----- Success state -----
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 py-12 px-4">
        <div className="max-w-md w-full animate-fade-in">
          <div className="bg-white rounded-2xl shadow-soft p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-primary-900 mb-3">Password Reset!</h2>
            <p className="text-neutral-600 mb-6">
              Your password has been updated. You can now sign in with your new password.
            </p>
            <button
              onClick={() => navigate('/admin/login')}
              className="btn btn-primary w-full"
            >
              Go to Admin Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ----- Reset form -----
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 py-12 px-4">
      <div className="max-w-md w-full animate-fade-in">
        <div className="bg-white rounded-2xl shadow-soft p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🔧</div>
            <h2 className="text-2xl font-bold text-primary-900">Set New Password</h2>
            {adminName && (
              <p className="text-neutral-500 mt-1 text-sm">for <strong>{adminName}</strong></p>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                  className="input w-full pl-10 pr-10"
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>

              {/* Password rules */}
              {formData.password && (
                <ul className="mt-3 space-y-1.5 pl-1">
                  {PASSWORD_RULES.map((rule) => (
                    <PasswordRequirement
                      key={rule.label}
                      label={rule.label}
                      met={rule.test(formData.password)}
                    />
                  ))}
                </ul>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData((p) => ({ ...p, confirmPassword: e.target.value }))}
                  className={`input w-full pl-10 pr-10 ${
                    formData.confirmPassword && !passwordsMatch
                      ? 'border-red-300 bg-red-50'
                      : formData.confirmPassword && passwordsMatch
                      ? 'border-green-300 bg-green-50'
                      : ''
                  }`}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
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
              className="btn btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Resetting password…
                </span>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/admin/login" className="text-sm text-accent-600 hover:text-accent-700 font-medium">
              ← Back to Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
