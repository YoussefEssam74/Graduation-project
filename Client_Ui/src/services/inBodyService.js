import api from './api'

// ===================================
// InBody Service
// Based on InBodyController.cs
// ===================================

export const inBodyService = {
  // GET /api/inbody/user/{userId}
  getUserMeasurements: async (userId) => {
    const response = await api.get(`/inbody/user/${userId}`)
    return response.data
  },

  // GET /api/inbody/{measurementId}
  getMeasurementById: async (measurementId) => {
    const response = await api.get(`/inbody/${measurementId}`)
    return response.data
  },

  // GET /api/inbody/user/{userId}/latest
  getLatestMeasurement: async (userId) => {
    const response = await api.get(`/inbody/user/${userId}/latest`)
    return response.data
  },

  // POST /api/inbody
  createMeasurement: async (measurementData) => {
    const response = await api.post('/inbody', measurementData)
    return response.data
  }
}

export default inBodyService
