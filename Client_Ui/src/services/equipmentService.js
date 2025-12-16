import api from './api'

// ===================================
// Equipment Service
// Based on EquipmentController.cs
// ===================================

export const equipmentService = {
  // GET /api/equipment
  getAllEquipment: async () => {
    const response = await api.get('/equipment')
    return response.data
  },

  // GET /api/equipment/available
  getAvailableEquipment: async () => {
    const response = await api.get('/equipment/available')
    return response.data
  },

  // GET /api/equipment/{id}
  getEquipmentById: async (id) => {
    const response = await api.get(`/equipment/${id}`)
    return response.data
  },

  // PUT /api/equipment/{id}/status
  updateEquipmentStatus: async (id, status) => {
    const response = await api.put(`/equipment/${id}/status`, status)
    return response.data
  }
}

export default equipmentService
