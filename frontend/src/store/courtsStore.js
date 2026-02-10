import { create } from 'zustand'
import api from '../utils/api'

export const useCourtsStore = create((set) => ({
  courts: [],
  loading: false,
  error: null,
  
  fetchCourts: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const response = await api.get('/courts/', { params })
      set({ courts: response.data.results || response.data, loading: false })
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Error al cargar canchas',
        loading: false,
      })
    }
  },
  
  createCourt: async (data) => {
    set({ loading: true, error: null })
    try {
      const response = await api.post('/courts/', data)
      set((state) => ({
        courts: [...state.courts, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Error al crear cancha',
        loading: false,
      })
      throw error
    }
  },
  
  updateCourt: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const response = await api.put(`/courts/${id}/`, data)
      set((state) => ({
        courts: state.courts.map((c) => (c.id === id ? response.data : c)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Error al actualizar cancha',
        loading: false,
      })
      throw error
    }
  },
  
  toggleCourtActive: async (id) => {
    set({ loading: true, error: null })
    try {
      const response = await api.patch(`/courts/${id}/toggle_active/`)
      set((state) => ({
        courts: state.courts.map((c) => (c.id === id ? response.data : c)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Error al cambiar estado de cancha',
        loading: false,
      })
      throw error
    }
  },
  
  clearError: () => {
    set({ error: null })
  },
}))
