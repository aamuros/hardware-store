import { useState } from 'react'
import { adminApi } from '../../services/api'
import { EyeIcon, EyeSlashIcon, LockIcon } from '../../components/icons'

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
]

export default function ChangePasswordPage() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
    setSuccess(false)
  }

  const passwordRulesMet = PASSWORD_RULES.every((r) => r.test(formData.newPassword))
  const passwordsMatch =
    formData.confirmPassword !== '' &&
    formData.newPassword === formData.confirmPassword

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!formData.currentPassword) {
      setError('Please enter your current password.')
      return
    }
    if (!passwordRulesMet) {
      setError('New password does not meet the requirements.')
      return
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await adminApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      })
      setSuccess(true)
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to change password. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <LockIcon className="h-5 w-5 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Change Password</h1>
        </div>
        <p className="text-neutral-500 text-sm ml-13 pl-0.5">
          Update your account password. You will remain logged in after changing it.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
            Password changed successfully!
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className="w-full px-4 py-2.5 pr-10 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="Enter current password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                tabIndex={-1}
              >
                {showCurrent ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full px-4 py-2.5 pr-10 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                placeholder="Enter new password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                tabIndex={-1}
              >
                {showNew ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Password rules */}
            {formData.newPassword && (
              <ul className="mt-3 space-y-1.5">
                {PASSWORD_RULES.map((rule) => {
                  const met = rule.test(formData.newPassword)
                  return (
                    <li
                      key={rule.label}
                      className={`flex items-center gap-2 text-xs ${
                        met ? 'text-green-600' : 'text-neutral-400'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold ${
                          met ? 'bg-green-500' : 'bg-neutral-200'
                        }`}
                      >
                        {met ? '✓' : ''}
                      </span>
                      {rule.label}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 pr-10 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${
                  formData.confirmPassword && !passwordsMatch
                    ? 'border-red-300 bg-red-50'
                    : formData.confirmPassword && passwordsMatch
                    ? 'border-green-300 bg-green-50'
                    : 'border-neutral-300'
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
                {showConfirm ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {formData.confirmPassword && !passwordsMatch && (
              <p className="mt-1.5 text-xs text-red-500">Passwords do not match.</p>
            )}
            {formData.confirmPassword && passwordsMatch && (
              <p className="mt-1.5 text-xs text-green-600">Passwords match.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !passwordRulesMet || !passwordsMatch}
            className="w-full py-2.5 px-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm mt-2"
          >
            {loading ? 'Changing password…' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
