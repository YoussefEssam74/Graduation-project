import api from './api'

// ===================================
// Other Services Index
// Combining remaining controllers
// ===================================

// Nutrition Plan Service (NutritionPlanController.cs)
export const nutritionPlanService = {
  getMemberPlans: async (memberId) => {
    const response = await api.get(`/nutrition-plans/member/${memberId}`)
    return response.data
  },
  getPlanDetails: async (planId) => {
    const response = await api.get(`/nutrition-plans/${planId}`)
    return response.data
  },
  generatePlan: async (generateData) => {
    const response = await api.post('/nutrition-plans/generate', generateData)
    return response.data
  },
  updatePlan: async (planId, updateData) => {
    const response = await api.put(`/nutrition-plans/${planId}`, updateData)
    return response.data
  },
  deactivatePlan: async (planId) => {
    const response = await api.put(`/nutrition-plans/${planId}/deactivate`)
    return response.data
  }
}

// Coach Review Service (CoachReviewController.cs)
export const coachReviewService = {
  createReview: async (reviewData) => {
    const response = await api.post('/coach-reviews', reviewData)
    return response.data
  },
  getReviewById: async (id) => {
    const response = await api.get(`/coach-reviews/${id}`)
    return response.data
  },
  getCoachReviews: async (coachId) => {
    const response = await api.get(`/coach-reviews/coach/${coachId}`)
    return response.data
  },
  getCoachAverageRating: async (coachId) => {
    const response = await api.get(`/coach-reviews/coach/${coachId}/rating`)
    return response.data
  },
  updateReview: async (id, reviewData) => {
    const response = await api.put(`/coach-reviews/${id}`, reviewData)
    return response.data
  },
  deleteReview: async (id) => {
    const response = await api.delete(`/coach-reviews/${id}`)
    return response.data
  }
}

// Payment Service (PaymentController.cs)
export const paymentService = {
  createPayment: async (paymentData) => {
    const response = await api.post('/payment', paymentData)
    return response.data
  },
  getPaymentById: async (id) => {
    const response = await api.get(`/payment/${id}`)
    return response.data
  },
  getUserPayments: async (userId) => {
    const response = await api.get(`/payment/user/${userId}`)
    return response.data
  },
  updatePaymentStatus: async (id, status, transactionId = null) => {
    const params = transactionId ? { transactionId } : {}
    const response = await api.put(`/payment/${id}/status`, status, { params })
    return response.data
  }
}

// Workout Log Service (WorkoutLogController.cs)
export const workoutLogService = {
  createWorkoutLog: async (logData) => {
    const response = await api.post('/workout-logs', logData)
    return response.data
  },
  getWorkoutLogById: async (id) => {
    const response = await api.get(`/workout-logs/${id}`)
    return response.data
  },
  getUserWorkoutLogs: async (userId) => {
    const response = await api.get(`/workout-logs/user/${userId}`)
    return response.data
  },
  getWorkoutLogsByPlan: async (planId) => {
    const response = await api.get(`/workout-logs/plan/${planId}`)
    return response.data
  },
  updateWorkoutLog: async (id, logData) => {
    const response = await api.put(`/workout-logs/${id}`, logData)
    return response.data
  },
  deleteWorkoutLog: async (id) => {
    const response = await api.delete(`/workout-logs/${id}`)
    return response.data
  }
}

// Exercise Service (ExerciseController.cs)
export const exerciseService = {
  getAllExercises: async () => {
    const response = await api.get('/exercise')
    return response.data
  },
  getActiveExercises: async () => {
    const response = await api.get('/exercise/active')
    return response.data
  },
  getExerciseById: async (id) => {
    const response = await api.get(`/exercise/${id}`)
    return response.data
  },
  getExercisesByMuscleGroup: async (muscleGroup) => {
    const response = await api.get(`/exercise/muscle-group/${muscleGroup}`)
    return response.data
  },
  getExercisesByDifficulty: async (level) => {
    const response = await api.get(`/exercise/difficulty/${level}`)
    return response.data
  }
}
