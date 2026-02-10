import { create } from 'zustand'
import api from '../utils/api'

export const useBookingsStore = create((set, get) => ({
  bookings: [],
  selectedBooking: null,
  loading: false,
  error: null,
  filters: {
    date: null,
    court: null,
    status: null,
  },
  
  fetchBookings: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const response = await api.get('/bookings/', { params })
      set({ bookings: response.data.results || response.data, loading: false })
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Error al cargar turnos',
        loading: false,
      })
    }
  },
  
  fetchCalendar: async (dateFrom, dateTo, courtId = null) => {
    set({ loading: true, error: null })
    try {
      const params = { date_from: dateFrom, date_to: dateTo }
      if (courtId) params.court = courtId
      
      const response = await api.get('/bookings/calendar/', { params })
      set({ bookings: response.data, loading: false })
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Error al cargar calendario',
        loading: false,
      })
    }
  },
  
  fetchBookingDetail: async (id) => {
    set({ loading: true, error: null })
    try {
      const response = await api.get(`/bookings/${id}/`)
      set({ selectedBooking: response.data, loading: false })
      return response.data
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Error al cargar turno',
        loading: false,
      })
      return null
    }
  },
  
  createBooking: async (data) => {
    set({ loading: true, error: null })
    try {
      const response = await api.post('/bookings/', data)
      set((state) => ({
        bookings: [...state.bookings, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      const errorMsg = error.response?.data?.non_field_errors?.[0] ||
                      error.response?.data?.detail ||
                      'Error al crear turno'
      set({ error: errorMsg, loading: false })
      throw error
    }
  },
  
  updateBooking: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const response = await api.patch(`/bookings/${id}/`, data)
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? response.data : b)),
        selectedBooking: response.data,
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Error al actualizar turno',
        loading: false,
      })
      throw error
    }
  },
  
  cancelBooking: async (id) => {
    set({ loading: true, error: null })
    try {
      const response = await api.patch(`/bookings/${id}/cancel/`)
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? response.data : b)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Error al cancelar turno',
        loading: false,
      })
      throw error
    }
  },
  
  closeBooking: async (id, closureData) => {
    set({ loading: true, error: null })
    try {
      const response = await api.post(`/bookings/${id}/close/`, closureData)
      // Refresh booking to get updated status
      const updatedBooking = await api.get(`/bookings/${id}/`)
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === id ? updatedBooking.data : b)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Error al cerrar turno',
        loading: false,
      })
      throw error
    }
  },
  
  setFilters: (filters) => {
    set({ filters })
  },
  
  clearError: () => {
    set({ error: null })
  },
}))
