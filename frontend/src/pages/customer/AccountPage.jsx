import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCustomerAuth } from '../../context/CustomerAuthContext'
import { customerApi } from '../../services/api'
import toast from 'react-hot-toast'
import {
    UserIcon,
    LocationIcon,
    HeartIcon,
    OrdersIcon,
    LogoutIcon,
    EditIcon,
    CheckIcon,
    CloseIcon
} from '../../components/icons'

export default function AccountPage() {
    const navigate = useNavigate()
    const { customer, logout, updateCustomer, isAuthenticated } = useCustomerAuth()
    const [stats, setStats] = useState({ orders: 0, addresses: 0, wishlist: 0 })
    const [editing, setEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
    })

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name || '',
                phone: customer.phone || '',
            })
        }
        loadStats()
    }, [customer])

    const loadStats = async () => {
        try {
            const response = await customerApi.getProfile()
            const data = response.data.data
            setStats({
                orders: data._count?.orders || 0,
                addresses: data._count?.savedAddresses || 0,
                wishlist: data._count?.wishlistItems || 0,
            })
        } catch (error) {
            console.error('Failed to load stats:', error)
        }
    }

    const handleLogout = () => {
        logout()
        toast.success('Logged out successfully')
        navigate('/')
    }

    const handleSave = async () => {
        setLoading(true)
        const result = await updateCustomer(formData)
        setLoading(false)

        if (result.success) {
            toast.success('Profile updated')
            setEditing(false)
            // Re-fetch stats to ensure the page reflects current data
            loadStats()
        } else {
            toast.error(result.message)
        }
    }

    if (!isAuthenticated()) {
        navigate('/login')
        return null
    }

    const menuItems = [
        {
            icon: OrdersIcon,
            label: 'Order History',
            description: 'View your past orders',
            count: stats.orders,
            link: '/account/orders',
            color: 'bg-blue-500',
        },
        {
            icon: LocationIcon,
            label: 'Saved Addresses',
            description: 'Manage delivery addresses',
            count: stats.addresses,
            link: '/account/addresses',
            color: 'bg-emerald-500',
        },
        {
            icon: HeartIcon,
            label: 'Wishlist',
            description: 'Products you want',
            count: stats.wishlist,
            link: '/account/wishlist',
            color: 'bg-pink-500',
        },
    ]

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-primary-900 mb-8">My Account</h1>

            {/* Profile Card */}
            <div className="card p-6 mb-8">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center">
                            <UserIcon className="w-10 h-10 text-accent-600" />
                        </div>
                        <div>
                            {editing ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="input text-lg font-bold"
                                        placeholder="Your name"
                                    />
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="input"
                                        placeholder="Phone number"
                                    />
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-xl font-bold text-primary-900">{customer?.name}</h2>
                                    <p className="text-neutral-600">{customer?.email}</p>
                                    {customer?.phone && (
                                        <p className="text-neutral-500 text-sm">{customer.phone}</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {editing ? (
                            <>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                                >
                                    <CheckIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => {
                                        setEditing(false)
                                        setFormData({
                                            name: customer?.name || '',
                                            phone: customer?.phone || '',
                                        })
                                    }}
                                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                >
                                    <CloseIcon className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setEditing(true)}
                                className="p-2 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 transition-colors"
                            >
                                <EditIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Menu Grid */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
                {menuItems.map((item) => (
                    <Link
                        key={item.label}
                        to={item.link}
                        className="card p-5 hover:shadow-lg transition-all group"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className={`p-3 rounded-xl ${item.color} text-white`}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            {item.count > 0 && (
                                <span className="px-2 py-1 bg-neutral-100 text-neutral-700 text-sm font-medium rounded-full">
                                    {item.count}
                                </span>
                            )}
                        </div>
                        <h3 className="font-bold text-primary-900 group-hover:text-accent-600 transition-colors">
                            {item.label}
                        </h3>
                        <p className="text-sm text-neutral-500">{item.description}</p>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="card p-4">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full p-3 text-left text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                    <LogoutIcon className="w-5 h-5" />
                    <span className="font-medium">Log Out</span>
                </button>
            </div>

            {/* Continue Shopping */}
            <div className="mt-8 text-center">
                <Link
                    to="/products"
                    className="text-accent-600 hover:text-accent-700 font-medium"
                >
                    ← Continue Shopping
                </Link>
            </div>
        </div>
    )
}
