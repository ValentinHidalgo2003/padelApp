import api from '../utils/api'

export const reportService = {
  async getDailySummary(date) {
    try {
      const response = await api.get('/reports/daily-summary/', {
        params: { date },
      })
      return response.data
    } catch (error) {
      throw error
    }
  },
  
  async getHistory(params = {}) {
    try {
      const response = await api.get('/reports/history/', { params })
      return response.data
    } catch (error) {
      throw error
    }
  },
  
  async getMonthlySummary(year, month) {
    try {
      const response = await api.get('/reports/monthly-summary/', {
        params: { year, month },
      })
      return response.data
    } catch (error) {
      throw error
    }
  },
}
