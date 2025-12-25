import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { customerApi } from '../../services/api'
import toast from 'react-hot-toast'
import {
    LocationIcon,
    ArrowLeftIcon,
    PlusIcon,
    EditIcon,
    TrashIcon,
    CheckCircleIcon,
    CloseIcon
} from '../../components/icons'

export default function SavedAddressesPage() {
    const [addresses, setAddresses] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingAddress, setEditingAddress] = useState(null)
    const [formData, setFormData] = useState({
        label: '',
        address: '',
        barangay: '',
        landmarks: '',
        isDefault: false,
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadAddresses()
    }, [])

    const loadAddresses = async () => {
        setLoading(true)
        try {
            const response = await customerApi.getAddresses()
            setAddresses(response.data.data)
        } catch (error) {
            console.error('Failed to load addresses:', error)
            toast.error('Failed to load addresses')
        } finally {
            setLoading(false)
        }
    }

    const openAddModal = () => {
        setEditingAddress(null)
        setFormData({
            label: '',
            address: '',
            barangay: '',
            landmarks: '',
            isDefault: false,
        })
        setShowModal(true)
    }

    const openEditModal = (address) => {
        setEditingAddress(address)
        setFormData({
            label: address.label,
            address: address.address,
            barangay: address.barangay,
            landmarks: address.landmarks || '',
            isDefault: address.isDefault,
        })
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!formData.label || !formData.address || !formData.barangay) {
            toast.error('Please fill in all required fields')
            return
        }

        setSaving(true)
        try {
            if (editingAddress) {
                await customerApi.updateAddress(editingAddress.id, formData)
                toast.success('Address updated')
            } else {
                await customerApi.createAddress(formData)
                toast.success('Address added')
            }
            setShowModal(false)
            loadAddresses()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save address')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this address?')) return

        try {
            await customerApi.deleteAddress(id)
            toast.success('Address deleted')
            loadAddresses()
        } catch (error) {
            toast.error('Failed to delete address')
        }
    }

    const handleSetDefault = async (id) => {
        try {
            await customerApi.setDefaultAddress(id)
            toast.success('Default address updated')
            loadAddresses()
        } catch (error) {
            toast.error('Failed to update default address')
        }
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
                    {[1, 2].map(i => (
                        <div key={i} className="h-32 bg-neutral-100 rounded-xl"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link to="/account" className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                        <ArrowLeftIcon className="w-5 h-5 text-neutral-600" />
                    </Link>
                    <h1 className="text-3xl font-bold text-primary-900">Saved Addresses</h1>
                </div>
                <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
                    <PlusIcon className="w-5 h-5" />
                    Add Address
                </button>
            </div>

            {addresses.length === 0 ? (
                <div className="card p-12 text-center">
                    <LocationIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-primary-900 mb-2">No saved addresses</h2>
                    <p className="text-neutral-600 mb-6">Add addresses for quicker checkout</p>
                    <button onClick={openAddModal} className="btn-primary">
                        Add Your First Address
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {addresses.map((address) => (
                        <div key={address.id} className="card p-5">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-bold text-primary-900">{address.label}</span>
                                        {address.isDefault && (
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-neutral-700">{address.address}</p>
                                    <p className="text-neutral-600 text-sm">Barangay {address.barangay}</p>
                                    {address.landmarks && (
                                        <p className="text-neutral-500 text-sm mt-1">Near: {address.landmarks}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {!address.isDefault && (
                                        <button
                                            onClick={() => handleSetDefault(address.id)}
                                            className="p-2 text-neutral-500 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors"
                                            title="Set as default"
                                        >
                                            <CheckCircleIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => openEditModal(address)}
                                        className="p-2 text-neutral-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                                    >
                                        <EditIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(address.id)}
                                        className="p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-primary-900">
                                {editingAddress ? 'Edit Address' : 'Add New Address'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="label">Label <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.label}
                                    onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                                    className="input"
                                    placeholder="e.g., Home, Office"
                                />
                            </div>

                            <div>
                                <label className="label">Complete Address <span className="text-red-500">*</span></label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    className="input"
                                    rows={3}
                                    placeholder="House/Unit No., Street, Subdivision"
                                />
                            </div>

                            <div>
                                <label className="label">Barangay <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.barangay}
                                    onChange={(e) => setFormData(prev => ({ ...prev, barangay: e.target.value }))}
                                    className="input"
                                    placeholder="Enter barangay"
                                />
                            </div>

                            <div>
                                <label className="label">Landmarks (optional)</label>
                                <input
                                    type="text"
                                    value={formData.landmarks}
                                    onChange={(e) => setFormData(prev => ({ ...prev, landmarks: e.target.value }))}
                                    className="input"
                                    placeholder="Near school, beside store"
                                />
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isDefault}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                                    className="w-4 h-4 rounded border-neutral-300 text-accent-600 focus:ring-accent-500"
                                />
                                <span className="text-neutral-700">Set as default address</span>
                            </label>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="btn-outline flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn-primary flex-1"
                            >
                                {saving ? 'Saving...' : 'Save Address'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
