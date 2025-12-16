import api from './api'

// ===================================
// Booking Service
// Based on BookingController.cs
// ===================================

export const bookingService = {
  // POST /api/bookings
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData)
    return response.data
  },

  // GET /api/bookings/{id}
  getBookingById: async (id) => {
    const response = await api.get(`/bookings/${id}`)
    return response.data
  },

  // GET /api/bookings
  getAllBookings: async () => {
    const response = await api.get('/bookings')
    return response.data
  },

  // GET /api/bookings/status/{status}
  getBookingsByStatus: async (status) => {
    const response = await api.get(`/bookings/status/${status}`)
    return response.data
  },

  // GET /api/bookings/today
  getTodaysBookings: async () => {
    const response = await api.get('/bookings/today')
    return response.data
  },

  // GET /api/bookings/user/{userId}
  getUserBookings: async (userId) => {
    const response = await api.get(`/bookings/user/${userId}`)
    return response.data
  },

  // GET /api/bookings/coach/{coachId}
  getCoachBookings: async (coachId, startDate, endDate) => {
    const params = {}
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    const response = await api.get(`/bookings/coach/${coachId}`, { params })
    return response.data
  },

  // PUT /api/bookings/{id}/confirm
  confirmBooking: async (id) => {
    const response = await api.put(`/bookings/${id}/confirm`)
    return response.data
  },

  // PUT /api/bookings/{id}/cancel
  cancelBooking: async (id, reason) => {
    const response = await api.put(`/bookings/${id}/cancel`, JSON.stringify(reason), {
      headers: { 'Content-Type': 'application/json' }
    })
    return response.data
  },

  // PUT /api/bookings/{id}/checkin
  checkIn: async (id) => {
    const response = await api.put(`/bookings/${id}/checkin`)
    return response.data
  },

  // PUT /api/bookings/{id}/checkout
  checkOut: async (id) => {
    const response = await api.put(`/bookings/${id}/checkout`)
    return response.data
  }
}

export default bookingService
