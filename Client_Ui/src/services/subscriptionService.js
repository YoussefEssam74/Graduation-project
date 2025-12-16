import api from './api'

// ===================================
// Subscription Service
// Based on SubscriptionController.cs
// ===================================

export const subscriptionService = {
  // GET /api/subscription/plans
  getAllPlans: async () => {
    const response = await api.get('/subscription/plans')
    return response.data
  },

  // GET /api/subscription/plans/active
  getActivePlans: async () => {
    const response = await api.get('/subscription/plans/active')
    return response.data
  },

  // GET /api/subscription/plans/{id}
  getPlanById: async (id) => {
    const response = await api.get(`/subscription/plans/${id}`)
    return response.data
  },

  // POST /api/subscription
  createSubscription: async (subscriptionData) => {
    const response = await api.post('/subscription', subscriptionData)
    return response.data
  },

  // GET /api/subscription/user/{userId}/active
  hasActiveSubscription: async (userId) => {
    const response = await api.get(`/subscription/user/${userId}/active`)
    return response.data
  }
}

export default subscriptionService
