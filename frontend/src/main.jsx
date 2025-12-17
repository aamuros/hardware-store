import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CustomerAuthProvider } from './context/CustomerAuthContext.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CustomerAuthProvider>
          <CartProvider>
            <App />
            <Toaster
              position="bottom-center"
              containerStyle={{
                bottom: 80,
              }}
              toastOptions={{
                duration: 2000,
                style: {
                  background: '#1e293b',
                  color: '#fff',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  maxWidth: '280px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                },
                success: {
                  duration: 1500,
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </CartProvider>
        </CustomerAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
