import api from './api'

// ===================================
// AI Service
// Based on AIController.cs
// ===================================

export const aiService = {
  // POST /api/ai/chat
  sendChatMessage: async (request) => {
    const response = await api.post('/ai/chat', request)
    return response.data
  },

  // GET /api/ai/history/{userId}
  getChatHistory: async (userId, limit = 50) => {
    const response = await api.get(`/ai/history/${userId}`, { params: { limit } })
    return response.data
  },

  // POST /api/ai/generate-workout-plan (Cost: 50 tokens)
  generateWorkoutPlan: async (request) => {
    const response = await api.post('/ai/generate-workout-plan', request)
    return response.data
  },

  // POST /api/ai/generate-nutrition-plan (Cost: 50 tokens)
  generateNutritionPlan: async (request) => {
    const response = await api.post('/ai/generate-nutrition-plan', request)
    return response.data
  },

  // POST /api/ai/gemini-chat (Cost: 1 token per message)
  geminiChat: async (request) => {
    const response = await api.post('/ai/gemini-chat', request)
    return response.data
  }
}

export default aiService
