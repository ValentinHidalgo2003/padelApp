import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export const formatDate = (date) => {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'dd/MM/yyyy', { locale: es })
}

export const formatTime = (time) => {
  if (!time) return ''
  return time.substring(0, 5) // HH:MM
}

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '$0.00'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount)
}

export const formatDateTime = (datetime) => {
  if (!datetime) return ''
  const dateObj = typeof datetime === 'string' ? parseISO(datetime) : datetime
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: es })
}

export const getStatusColor = (status) => {
  const colors = {
    available: 'bg-green-500',
    reserved: 'bg-blue-500',
    cancelled: 'bg-red-500',
    completed: 'bg-gray-500',
  }
  return colors[status] || 'bg-gray-400'
}

export const getStatusLabel = (status) => {
  const labels = {
    available: 'Libre',
    reserved: 'Reservado',
    cancelled: 'Cancelado',
    completed: 'Jugado',
  }
  return labels[status] || status
}

export const getPaymentMethodLabel = (method) => {
  const labels = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    mp: 'Mercado Pago',
    other: 'Otro',
  }
  return labels[method] || method
}
