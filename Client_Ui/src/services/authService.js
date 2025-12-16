import api from './api'

// ===================================
// Auth Service
// Based on AuthController.cs
// ===================================

export const authService = {
  // POST /api/auth/login
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  // POST /api/auth/register
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  // POST /api/auth/create-with-role (Admin only)
  createUserWithRole: async (userData, role) => {
    const response = await api.post(`/auth/create-with-role?role=${role}`, userData)
    return response.data
  },

  // POST /api/auth/change-password
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword
    })
    return response.data
  },

  // POST /api/auth/complete-setup
  completeSetup: async () => {
    const response = await api.post('/auth/complete-setup')
    return response.data
  },

  // Helper: Store user data
  setUserData: (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
  },

  // Helper: Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  // Helper: Check if logged in
  isAuthenticated: () => {
    return !!localStorage.getItem('token')
  },

  // Helper: Logout
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

export default authService
