import { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = authService.getCurrentUser()
    if (storedUser) {
      setUser(storedUser)
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      setError(null)
      const response = await authService.login(email, password)
      authService.setUserData(response.token, response.user)
      setUser(response.user)
      return response
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed'
      setError(message)
      throw new Error(message)
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      const response = await authService.register(userData)
      authService.setUserData(response.token, response.user)
      setUser(response.user)
      return response
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed'
      setError(message)
      throw new Error(message)
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
