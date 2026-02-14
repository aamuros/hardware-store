import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
    PlusIcon,
    CloseIcon,
    EditIcon,
    CheckIcon,
    EyeIcon,
    EyeSlashIcon,
    UsersIcon,
} from '../../components/icons'

const PASSWORD_RULES = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
    { label: 'One number', test: (p) => /[0-9]/.test(p) },
    { label: 'One special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
]

const INITIAL_FORM = {
    username: '',
    name: '',
    password: '',
    role: 'staff',
}

export default function UserManagementPage() {
    const { user: currentUser, isAdminRole } = useAuth()
    const navigate = useNavigate()

    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [formData, setFormData] = useState(INITIAL_FORM)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [successMsg, setSuccessMsg] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [confirmAction, setConfirmAction] = useState(null)

    // Redirect non-admin users
    useEffect(() => {
        if (!isAdminRole()) {
            navigate('/admin', { replace: true })
        }
    }, [isAdminRole, navigate])

    useEffect(() => {
        fetchUsers()
    }, [])

    // Auto-dismiss success messages
    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(''), 4000)
            return () => clearTimeout(timer)
        }
    }, [successMsg])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const response = await adminApi.getUsers()
            setUsers(response.data.data)
        } catch (err) {
            console.error('Error fetching users:', err)
            setError('Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    const openCreateModal = () => {
        setEditingUser(null)
        setFormData(INITIAL_FORM)
        setError('')
        setShowPassword(false)
        setShowModal(true)
    }

    const openEditModal = (userToEdit) => {
        setEditingUser(userToEdit)
        setFormData({
            username: userToEdit.username,
            name: userToEdit.name,
            password: '',
            role: userToEdit.role,
        })
        setError('')
        setShowPassword(false)
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingUser(null)
        setError('')
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError('')

        try {
            if (editingUser) {
                // Build update payload (only send changed fields)
                const updatePayload = {}
                if (formData.name !== editingUser.name) updatePayload.name = formData.name
                if (formData.role !== editingUser.role) updatePayload.role = formData.role
                if (formData.password) updatePayload.password = formData.password

                if (Object.keys(updatePayload).length === 0) {
                    closeModal()
                    return
                }

                await adminApi.updateUser(editingUser.id, updatePayload)
                setSuccessMsg(`User "${formData.name}" updated successfully`)
            } else {
                // Create new user
                if (!formData.username.trim() || !formData.name.trim() || !formData.password) {
                    setError('All fields are required')
                    setSaving(false)
                    return
                }

                // Validate username format
                if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
                    setError('Username can only contain letters, numbers, and underscores')
                    setSaving(false)
                    return
                }

                // Validate password strength locally
                const failedRules = PASSWORD_RULES.filter((r) => !r.test(formData.password))
                if (failedRules.length > 0) {
                    setError('Password does not meet all requirements')
                    setSaving(false)
                    return
                }

                await adminApi.createUser(formData)
                setSuccessMsg(`User "${formData.name}" created successfully`)
            }

            closeModal()
            fetchUsers()
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.errors?.join(', ') || 'An error occurred'
            setError(msg)
        } finally {
            setSaving(false)
        }
    }

    const handleToggleActive = async (userToToggle) => {
        if (userToToggle.id === currentUser?.id) return

        setConfirmAction({
            type: userToToggle.isActive ? 'deactivate' : 'reactivate',
            user: userToToggle,
        })
    }

    const executeConfirmAction = async () => {
        if (!confirmAction) return

        const { type, user: targetUser } = confirmAction
        setConfirmAction(null)

        try {
            if (type === 'deactivate') {
                await adminApi.deleteUser(targetUser.id)
                setSuccessMsg(`User "${targetUser.name}" deactivated`)
            } else {
                await adminApi.updateUser(targetUser.id, { isActive: true })
                setSuccessMsg(`User "${targetUser.name}" reactivated`)
            }
            fetchUsers()
        } catch (err) {
            const msg = err.response?.data?.message || 'Action failed'
            setError(msg)
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Never'
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    if (!isAdminRole()) return null

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary-900">Staff Management</h1>
                    <p className="text-neutral-600">Manage admin and staff accounts</p>
                </div>
                <button onClick={openCreateModal} className="btn btn-primary flex items-center gap-2">
                    <PlusIcon className="h-5 w-5" />
                    Add User
                </button>
            </div>

            {/* Success message */}
            {successMsg && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm animate-fade-in">
                    <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                    {successMsg}
                </div>
            )}

            {/* Error message */}
            {error && !showModal && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* Users table */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-800"></div>
                </div>
            ) : users.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-soft p-12 text-center">
                    <UsersIcon className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                    <p className="text-neutral-500 mb-4">No users found</p>
                    <button onClick={openCreateModal} className="text-accent-600 hover:text-accent-700 font-medium">
                        Add your first staff member
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-neutral-50 border-b border-neutral-200">
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                        Last Login
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {users.map((u) => (
                                    <tr
                                        key={u.id}
                                        className={`hover:bg-neutral-50 transition-colors ${!u.isActive ? 'opacity-60' : ''
                                            }`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${u.role === 'admin'
                                                        ? 'bg-purple-100 text-purple-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-primary-900">{u.name}</p>
                                                    <p className="text-sm text-neutral-500">@{u.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${u.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {u.role === 'admin' ? 'Admin' : 'Staff'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${u.isActive ? 'text-green-600' : 'text-red-500'
                                                }`}>
                                                <span className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-400'
                                                    }`}></span>
                                                {u.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-600">
                                            {formatDate(u.lastLogin)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-600">
                                            {formatDate(u.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(u)}
                                                    className="p-1.5 text-neutral-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                                                    title="Edit user"
                                                >
                                                    <EditIcon className="h-4 w-4" />
                                                </button>
                                                {u.id !== currentUser?.id && (
                                                    <button
                                                        onClick={() => handleToggleActive(u)}
                                                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${u.isActive
                                                                ? 'text-red-600 hover:bg-red-50'
                                                                : 'text-green-600 hover:bg-green-50'
                                                            }`}
                                                    >
                                                        {u.isActive ? 'Deactivate' : 'Reactivate'}
                                                    </button>
                                                )}
                                                {u.id === currentUser?.id && (
                                                    <span className="text-xs text-neutral-400 italic">You</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create/Edit User Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-primary-900/30 backdrop-blur-sm" onClick={closeModal} />
                        <div className="relative bg-white rounded-2xl shadow-soft-lg max-w-md w-full">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                                <h3 className="text-lg font-semibold text-primary-900">
                                    {editingUser ? 'Edit User' : 'Add New User'}
                                </h3>
                                <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600">
                                    <CloseIcon className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Username */}
                                <div>
                                    <label className="block text-sm font-medium text-primary-700 mb-1">
                                        Username *
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        disabled={!!editingUser}
                                        required
                                        className={`input w-full ${editingUser ? 'bg-neutral-100 cursor-not-allowed' : ''}`}
                                        placeholder="e.g., john_doe"
                                        autoComplete="off"
                                    />
                                    {editingUser && (
                                        <p className="mt-1 text-xs text-neutral-500">Username cannot be changed</p>
                                    )}
                                </div>

                                {/* Full Name */}
                                <div>
                                    <label className="block text-sm font-medium text-primary-700 mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="input w-full"
                                        placeholder="e.g., John Doe"
                                    />
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-primary-700 mb-1">
                                        {editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            required={!editingUser}
                                            className="input w-full pr-10"
                                            placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                        >
                                            {showPassword ? (
                                                <EyeSlashIcon className="h-4 w-4" />
                                            ) : (
                                                <EyeIcon className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Password strength indicators */}
                                    {formData.password && (
                                        <div className="mt-2 space-y-1">
                                            {PASSWORD_RULES.map((rule, idx) => {
                                                const passed = rule.test(formData.password)
                                                return (
                                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${passed ? 'bg-green-100 text-green-600' : 'bg-neutral-100 text-neutral-400'
                                                            }`}>
                                                            {passed ? '✓' : '○'}
                                                        </span>
                                                        <span className={passed ? 'text-green-600' : 'text-neutral-500'}>
                                                            {rule.label}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Role */}
                                <div>
                                    <label className="block text-sm font-medium text-primary-700 mb-1">
                                        Role *
                                    </label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        className="input w-full"
                                        disabled={editingUser?.id === currentUser?.id}
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    {editingUser?.id === currentUser?.id && (
                                        <p className="mt-1 text-xs text-neutral-500">You cannot change your own role</p>
                                    )}
                                    <p className="mt-1 text-xs text-neutral-500">
                                        {formData.role === 'admin'
                                            ? 'Admins can manage staff accounts and access all features.'
                                            : 'Staff can manage orders, products, and categories but cannot manage users.'}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="btn bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={saving} className="btn btn-primary">
                                        {saving
                                            ? 'Saving...'
                                            : editingUser
                                                ? 'Update User'
                                                : 'Create User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            {confirmAction && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-primary-900/30 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
                        <div className="relative bg-white rounded-2xl shadow-soft-lg max-w-sm w-full p-6">
                            <h3 className="text-lg font-semibold text-primary-900 mb-2">
                                {confirmAction.type === 'deactivate' ? 'Deactivate User' : 'Reactivate User'}
                            </h3>
                            <p className="text-sm text-neutral-600 mb-6">
                                {confirmAction.type === 'deactivate'
                                    ? `Are you sure you want to deactivate "${confirmAction.user.name}"? They will no longer be able to log in to the admin panel.`
                                    : `Are you sure you want to reactivate "${confirmAction.user.name}"? They will be able to log in again.`}
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setConfirmAction(null)}
                                    className="btn bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeConfirmAction}
                                    className={`btn ${confirmAction.type === 'deactivate'
                                            ? 'bg-red-600 text-white hover:bg-red-700'
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                        }`}
                                >
                                    {confirmAction.type === 'deactivate' ? 'Deactivate' : 'Reactivate'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
