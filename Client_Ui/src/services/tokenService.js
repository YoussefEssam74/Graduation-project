import api from './api'

// ===================================
// Token Transaction Service
// Based on TokenTransactionController.cs
// ===================================

export const tokenService = {
  // POST /api/token-transactions
  createTransaction: async (transactionData) => {
    const response = await api.post('/token-transactions', transactionData)
    return response.data
  },

  // GET /api/token-transactions/{id}
  getTransactionById: async (id) => {
    const response = await api.get(`/token-transactions/${id}`)
    return response.data
  },

  // GET /api/token-transactions/user/{userId}
  getUserTransactions: async (userId) => {
    const response = await api.get(`/token-transactions/user/${userId}`)
    return response.data
  },

  // GET /api/token-transactions/user/{userId}/balance
  getUserBalance: async (userId) => {
    const response = await api.get(`/token-transactions/user/${userId}/balance`)
    return response.data
  }
}

export default tokenService
