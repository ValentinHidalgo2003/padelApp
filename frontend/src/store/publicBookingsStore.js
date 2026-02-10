import { create } from 'zustand'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// API pública sin autenticación
const publicApi = axios.create({
  baseURL: `${API_URL}/api/public`,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const usePublicBookingsStore = create((set, get) => ({
  courts: [],
  availableSlots: [],
  slotConfig: null,
  currentBooking: null,
  cancellationResult: null,
  verifyResult: null,
  searchResults: [],
  loading: false,
  error: null,
  
  fetchCourts: async () => {
    set({ loading: true, error: null })
    try {
      const response = await publicApi.get('/courts/')
      set({ courts: response.data, loading: false })
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Error al cargar canchas',
        loading: false,
      })
    }
  },
  
  fetchAvailableSlots: async (date, courtId = null) => {
    set({ loading: true, error: null })
    try {
      const params = { date }
      if (courtId) params.court_id = courtId
      
      const response = await publicApi.get('/available-slots/', { params })
      set({
        availableSlots: response.data.slots,
        slotConfig: response.data.config,
        loading: false,
      })
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Error al cargar horarios',
        loading: false,
      })
    }
  },
  
  createBooking: async (bookingData) => {
    set({ loading: true, error: null })
    try {
      const response = await publicApi.post('/bookings/', bookingData)
      set({ currentBooking: response.data, loading: false })
      return response.data
    } catch (error) {
      const errorMsg = error.response?.data?.error ||
                       error.response?.data?.customer_name?.[0] ||
                       error.response?.data?.customer_phone?.[0] ||
                       'Error al crear reserva'
      set({ error: errorMsg, loading: false })
      throw error
    }
  },
  
  cancelBooking: async (token) => {
    set({ loading: true, error: null, cancellationResult: null })
    try {
      const response = await publicApi.post('/bookings/cancel/', { token })
      set({ cancellationResult: response.data, loading: false })
      return response.data
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Error al cancelar reserva',
        loading: false,
      })
      throw error
    }
  },
  
  verifyBooking: async (token) => {
    set({ loading: true, error: null, verifyResult: null })
    try {
      const response = await publicApi.get('/bookings/verify/', { params: { token } })
      set({ verifyResult: response.data, loading: false })
      return response.data
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Código no válido',
        loading: false,
      })
      throw error
    }
  },

  searchBookings: async ({ name, phone } = {}) => {
    set({ loading: true, error: null, searchResults: [] })
    try {
      const params = {}
      if (name) params.name = name
      if (phone) params.phone = phone
      const response = await publicApi.get('/bookings/search/', { params })
      set({ searchResults: response.data.bookings, loading: false })
      return response.data.bookings
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Error al buscar reservas',
        loading: false,
      })
      throw error
    }
  },

  cancelBookingById: async (bookingId) => {
    set({ loading: true, error: null, cancellationResult: null })
    try {
      const response = await publicApi.post('/bookings/cancel-by-id/', {
        booking_id: bookingId,
      })
      set({ cancellationResult: response.data, loading: false })
      return response.data
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Error al cancelar reserva',
        loading: false,
      })
      throw error
    }
  },
  
  fetchConfiguration: async () => {
    try {
      const response = await publicApi.get('/configuration/')
      set({ slotConfig: response.data })
    } catch (error) {
      // Silently fail, use defaults
    }
  },
  
  reset: () => {
    set({
      availableSlots: [],
      currentBooking: null,
      cancellationResult: null,
      verifyResult: null,
      searchResults: [],
      error: null,
    })
  },
  
  clearError: () => {
    set({ error: null })
  },
}))
