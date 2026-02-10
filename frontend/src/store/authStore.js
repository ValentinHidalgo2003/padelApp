import { create } from 'zustand'
import api from '../utils/api'

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  
  login: async (username, password) => {
    set({ loading: true, error: null })
    try {
      const response = await api.post('/auth/login/', { username, password })
      const { access, refresh } = response.data
      
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      
      // Get user info
      const userResponse = await api.get('/auth/me/')
      set({
        user: userResponse.data,
        isAuthenticated: true,
        loading: false,
      })
      
      return true
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Error al iniciar sesión',
        loading: false,
      })
      return false
    }
  },
  
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({
      user: null,
      isAuthenticated: false,
    })
  },
  
  checkAuth: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      set({ isAuthenticated: false, user: null })
      return
    }
    
    try {
      const response = await api.get('/auth/me/')
      set({
        user: response.data,
        isAuthenticated: true,
      })
    } catch (error) {
      set({ isAuthenticated: false, user: null })
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  },
  
  updateProfile: async (data) => {
    try {
      const response = await api.patch('/auth/me/', data)
      set({ user: response.data })
      return true
    } catch (error) {
      set({ error: error.response?.data?.detail || 'Error al actualizar perfil' })
      return false
    }
  },
}))
