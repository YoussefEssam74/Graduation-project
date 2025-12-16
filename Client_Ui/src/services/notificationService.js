import api from './api'

// ===================================
// Notification Service
// Based on NotificationController.cs
// ===================================

export const notificationService = {
  // POST /api/notifications
  createNotification: async (notificationData) => {
    const response = await api.post('/notifications', notificationData)
    return response.data
  },

  // GET /api/notifications/{id}
  getNotificationById: async (id) => {
    const response = await api.get(`/notifications/${id}`)
    return response.data
  },

  // GET /api/notifications/user/{userId}
  getUserNotifications: async (userId, unreadOnly = false) => {
    const response = await api.get(`/notifications/user/${userId}`, {
      params: { unreadOnly }
    })
    return response.data
  },

  // GET /api/notifications/user/{userId}/unread-count
  getUnreadCount: async (userId) => {
    const response = await api.get(`/notifications/user/${userId}/unread-count`)
    return response.data
  },

  // PUT /api/notifications/{id}/read
  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`)
    return response.data
  },

  // PUT /api/notifications/user/{userId}/read-all
  markAllAsRead: async (userId) => {
    const response = await api.put(`/notifications/user/${userId}/read-all`)
    return response.data
  },

  // DELETE /api/notifications/{id}
  deleteNotification: async (id) => {
    const response = await api.delete(`/notifications/${id}`)
    return response.data
  }
}

export default notificationService
