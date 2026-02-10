import { create } from 'zustand'
import api from '../utils/api'

export const useNotificationsStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  pollingInterval: null,

  fetchNotifications: async () => {
    try {
      const response = await api.get('/notifications/')
      set({ notifications: response.data })
    } catch (error) {
      // Silently fail
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count/')
      set({ unreadCount: response.data.unread_count })
    } catch (error) {
      // Silently fail
    }
  },

  markAsRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read/`)
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }))
    } catch (error) {
      // Silently fail
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post('/notifications/mark-all-read/')
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }))
    } catch (error) {
      // Silently fail
    }
  },

  startPolling: () => {
    const { fetchUnreadCount, fetchNotifications } = get()
    // Fetch immediately
    fetchUnreadCount()
    fetchNotifications()
    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 30000)
    set({ pollingInterval: interval })
  },

  stopPolling: () => {
    const { pollingInterval } = get()
    if (pollingInterval) {
      clearInterval(pollingInterval)
      set({ pollingInterval: null })
    }
  },
}))
