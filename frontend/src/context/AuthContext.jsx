import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load auth state from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('admin-token')
    const savedUser = localStorage.getItem('admin-user')

    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
    }

    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      const response = await api.post('/admin/login', { username, password })
      const { token: newToken, user: userData } = response.data.data

      // Save to state and localStorage
      setToken(newToken)
      setUser(userData)
      localStorage.setItem('admin-token', newToken)
      localStorage.setItem('admin-user', JSON.stringify(userData))

      // Set authorization header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      return { success: false, message }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('admin-token')
    localStorage.removeItem('admin-user')
    delete api.defaults.headers.common['Authorization']
  }

  const isAuthenticated = () => {
    return !!token
  }

  const isAdminRole = () => {
    return user?.role === 'admin'
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdminRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
