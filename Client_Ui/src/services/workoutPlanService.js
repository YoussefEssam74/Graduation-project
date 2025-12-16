import api from './api'

// ===================================
// Workout Plan Service
// Based on WorkoutPlanController.cs
// ===================================

export const workoutPlanService = {
  // GET /api/workout-plans/templates
  getAllTemplates: async () => {
    const response = await api.get('/workout-plans/templates')
    return response.data
  },

  // GET /api/workout-plans/templates/{id}
  getTemplateById: async (id) => {
    const response = await api.get(`/workout-plans/templates/${id}`)
    return response.data
  },

  // GET /api/workout-plans/member/{memberId}
  getMemberPlans: async (memberId) => {
    const response = await api.get(`/workout-plans/member/${memberId}`)
    return response.data
  },

  // GET /api/workout-plans/{memberPlanId}
  getMemberPlanDetails: async (memberPlanId) => {
    const response = await api.get(`/workout-plans/${memberPlanId}`)
    return response.data
  },

  // POST /api/workout-plans/assign
  assignPlanToMember: async (assignData) => {
    const response = await api.post('/workout-plans/assign', assignData)
    return response.data
  },

  // PUT /api/workout-plans/{memberPlanId}/progress
  updateProgress: async (memberPlanId, progressData) => {
    const response = await api.put(`/workout-plans/${memberPlanId}/progress`, progressData)
    return response.data
  },

  // PUT /api/workout-plans/{memberPlanId}/complete
  completePlan: async (memberPlanId) => {
    const response = await api.put(`/workout-plans/${memberPlanId}/complete`)
    return response.data
  }
}

export default workoutPlanService
