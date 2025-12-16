import api from './api'

// ===================================
// Stats Service
// Based on StatsController.cs
// ===================================

export const statsService = {
  // GET /api/stats/member/{memberId}
  getMemberStats: async (memberId) => {
    const response = await api.get(`/stats/member/${memberId}`)
    return response.data
  },

  // GET /api/stats/coach/{coachId}
  getCoachStats: async (coachId) => {
    const response = await api.get(`/stats/coach/${coachId}`)
    return response.data
  },

  // GET /api/stats/reception
  getReceptionStats: async () => {
    const response = await api.get('/stats/reception')
    return response.data
  }
}

export default statsService
