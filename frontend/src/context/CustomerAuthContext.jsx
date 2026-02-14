import { createContext, useContext, useState, useEffect } from 'react'
import api, { customerApi } from '../services/api'

const CustomerAuthContext = createContext()

export function CustomerAuthProvider({ children }) {
    const [customer, setCustomer] = useState(null)
    const [token, setToken] = useState(null)
    const [loading, setLoading] = useState(true)
    const [wishlistIds, setWishlistIds] = useState(new Set())

    // Load auth state from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('customer-token')
        const savedCustomer = localStorage.getItem('customer-user')

        if (savedToken && savedCustomer) {
            try {
                const parsed = JSON.parse(savedCustomer)
                setToken(savedToken)
                setCustomer(parsed)
                // Load wishlist IDs for quick checking
                loadWishlistIds()
            } catch (e) {
                console.error('Failed to parse saved customer data:', e)
                localStorage.removeItem('customer-token')
                localStorage.removeItem('customer-user')
            }
        }

        setLoading(false)
    }, [])

    const loadWishlistIds = async () => {
        try {
            const response = await customerApi.getWishlistIds()
            setWishlistIds(new Set(response.data.data))
        } catch (error) {
            console.error('Failed to load wishlist:', error)
        }
    }

    const register = async (name, email, password, phone = '') => {
        try {
            const response = await customerApi.register({ name, email, password, phone })
            const { token: newToken, customer: customerData } = response.data.data

            // Save to state and localStorage
            setToken(newToken)
            setCustomer(customerData)
            localStorage.setItem('customer-token', newToken)
            localStorage.setItem('customer-user', JSON.stringify(customerData))

            return { success: true }
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed'
            const data = error.response?.data || {}
            return { success: false, message, data }
        }
    }

    const login = async (email, password) => {
        try {
            const response = await customerApi.login({ email, password })
            const { token: newToken, customer: customerData } = response.data.data

            // Save to state and localStorage
            setToken(newToken)
            setCustomer(customerData)
            localStorage.setItem('customer-token', newToken)
            localStorage.setItem('customer-user', JSON.stringify(customerData))

            // Load wishlist IDs
            await loadWishlistIds()

            return { success: true }
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed'
            return { success: false, message }
        }
    }

    const logout = () => {
        setToken(null)
        setCustomer(null)
        setWishlistIds(new Set())
        localStorage.removeItem('customer-token')
        localStorage.removeItem('customer-user')
    }

    const updateCustomer = async (data) => {
        try {
            const response = await customerApi.updateProfile(data)
            const updatedCustomer = response.data.data
            setCustomer(updatedCustomer)
            localStorage.setItem('customer-user', JSON.stringify(updatedCustomer))
            return { success: true }
        } catch (error) {
            const message = error.response?.data?.message || 'Update failed'
            return { success: false, message }
        }
    }

    const changePassword = async (currentPassword, newPassword) => {
        try {
            await customerApi.changePassword({ currentPassword, newPassword })
            return { success: true }
        } catch (error) {
            const message = error.response?.data?.message || 'Password change failed'
            return { success: false, message }
        }
    }

    // Wishlist helpers
    const isInWishlist = (productId) => {
        return wishlistIds.has(productId)
    }

    const addToWishlist = async (productId) => {
        if (!token) return { success: false, message: 'Please log in to save items' }

        try {
            await customerApi.addToWishlist(productId)
            setWishlistIds(prev => new Set([...prev, productId]))
            return { success: true }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to add to wishlist'
            return { success: false, message }
        }
    }

    const removeFromWishlist = async (productId) => {
        if (!token) return { success: false, message: 'Please log in' }

        try {
            await customerApi.removeFromWishlist(productId)
            setWishlistIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(productId)
                return newSet
            })
            return { success: true }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to remove from wishlist'
            return { success: false, message }
        }
    }

    const toggleWishlist = async (productId) => {
        if (isInWishlist(productId)) {
            return removeFromWishlist(productId)
        } else {
            return addToWishlist(productId)
        }
    }

    const isAuthenticated = () => {
        return !!token
    }

    const value = {
        customer,
        token,
        loading,
        register,
        login,
        logout,
        updateCustomer,
        changePassword,
        isAuthenticated,
        // Wishlist
        wishlistIds,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        refreshWishlist: loadWishlistIds,
    }

    return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>
}

export function useCustomerAuth() {
    const context = useContext(CustomerAuthContext)
    if (!context) {
        throw new Error('useCustomerAuth must be used within a CustomerAuthProvider')
    }
    return context
}
