import { create } from 'zustand'
import api from '../utils/api'

export const useProductsStore = create((set) => ({
  products: [],
  consumptions: [],
  loading: false,
  error: null,
  
  fetchProducts: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const response = await api.get('/products/', { params })
      set({ products: response.data.results || response.data, loading: false })
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Error al cargar productos',
        loading: false,
      })
    }
  },
  
  createProduct: async (data) => {
    set({ loading: true, error: null })
    try {
      const response = await api.post('/products/', data)
      set((state) => ({
        products: [...state.products, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Error al crear producto',
        loading: false,
      })
      throw error
    }
  },
  
  updateProduct: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const response = await api.put(`/products/${id}/`, data)
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? response.data : p)),
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Error al actualizar producto',
        loading: false,
      })
      throw error
    }
  },
  
  deleteProduct: async (id) => {
    set({ loading: true, error: null })
    try {
      await api.delete(`/products/${id}/`)
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Error al eliminar producto',
        loading: false,
      })
      throw error
    }
  },
  
  // Consumptions
  fetchConsumptions: async (bookingId) => {
    set({ loading: true, error: null })
    try {
      const response = await api.get('/consumptions/', {
        params: { booking: bookingId },
      })
      set({ consumptions: response.data.results || response.data, loading: false })
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Error al cargar consumos',
        loading: false,
      })
    }
  },
  
  createConsumption: async (data) => {
    set({ loading: true, error: null })
    try {
      const response = await api.post('/consumptions/', data)
      set((state) => ({
        consumptions: [...state.consumptions, response.data],
        loading: false,
      }))
      return response.data
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Error al crear consumo',
        loading: false,
      })
      throw error
    }
  },
  
  deleteConsumption: async (id) => {
    set({ loading: true, error: null })
    try {
      await api.delete(`/consumptions/${id}/`)
      set((state) => ({
        consumptions: state.consumptions.filter((c) => c.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({
        error: error.response?.data?.detail || 'Error al eliminar consumo',
        loading: false,
      })
      throw error
    }
  },
  
  clearError: () => {
    set({ error: null })
  },
}))
