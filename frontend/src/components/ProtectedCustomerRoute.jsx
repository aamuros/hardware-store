import { Navigate, useLocation } from 'react-router-dom'
import { useCustomerAuth } from '../context/CustomerAuthContext'

export default function ProtectedCustomerRoute({ children }) {
    const { isAuthenticated, loading } = useCustomerAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
            </div>
        )
    }

    if (!isAuthenticated()) {
        // Redirect to login, but save the location they were trying to access
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return children
}
