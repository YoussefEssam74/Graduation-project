import api from './api'

// ===================================
// User Service
// Based on UserController.cs
// ===================================

export const userService = {
  // GET /api/users/{id}
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  // PUT /api/users/{id}
  updateProfile: async (id, profileData) => {
    const response = await api.put(`/users/${id}`, profileData)
    return response.data
  },

  // GET /api/users/{id}/tokens
  getTokenBalance: async (id) => {
    const response = await api.get(`/users/${id}/tokens`)
    return response.data
  },

  // GET /api/users/coaches
  getCoaches: async () => {
    const response = await api.get('/users/coaches')
    return response.data
  },

  // DELETE /api/users/{id}
  deactivateUser: async (id) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },

  // GET /api/users/{id}/metrics
  getUserMetrics: async (id) => {
    const response = await api.get(`/users/${id}/metrics`)
    return response.data
  },

  // GET /api/users/{id}/workout-summary
  getWorkoutSummary: async (id, startDate, endDate) => {
    const params = {}
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    const response = await api.get(`/users/${id}/workout-summary`, { params })
    return response.data
  },

  // GET /api/users/{id}/ai-context
  getUserAIContext: async (id) => {
    const response = await api.get(`/users/${id}/ai-context`)
    return response.data
  }
}

export default userService
