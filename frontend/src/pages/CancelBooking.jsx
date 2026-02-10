import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePublicBookingsStore } from '../store/publicBookingsStore'
import {
  XCircle, Search, AlertCircle, Check, ChevronLeft,
  Sparkles, Loader2, Calendar, Clock, MapPin, AlertTriangle
} from 'lucide-react'

function CancelBooking() {
  const {
    searchResults, cancellationResult,
    loading, error,
    searchBookings, cancelBookingById,
    reset, clearError,
  } = usePublicBookingsStore()

  const [query, setQuery] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    return () => reset()
  }, [reset])

  const handleSearch = async (e) => {
    e.preventDefault()
    clearError()
    setSelectedBooking(null)
    setShowConfirm(false)
    const trimmed = query.trim()
    if (!trimmed) return

    // Detectar si es teléfono (solo números/+) o nombre
    const isPhone = /^[\d+\s-]+$/.test(trimmed)

    try {
      if (isPhone) {
        await searchBookings({ phone: trimmed })
      } else {
        await searchBookings({ name: trimmed })
      }
      setHasSearched(true)
    } catch (err) {
      setHasSearched(true)
    }
  }

  const handleCancel = async () => {
    clearError()
    try {
      await cancelBookingById(selectedBooking.id)
      setShowConfirm(false)
      setSelectedBooking(null)
    } catch (err) {
      // Error handled in store
    }
  }

  const handleReset = () => {
    setQuery('')
    setHasSearched(false)
    setSelectedBooking(null)
    setShowConfirm(false)
    reset()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="glass sticky top-0 z-50 shadow-lg border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Volver</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-700">Cancelar Reserva</span>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Cancellation Success */}
        {cancellationResult ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <Check className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Reserva cancelada</h2>
            <p className="text-gray-500 mb-8">Tu reserva fue cancelada correctamente</p>

            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8 shadow-sm text-left">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Cancha</span>
                  <p className="font-medium">{cancellationResult.booking.court_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Fecha</span>
                  <p className="font-medium">{cancellationResult.booking.date}</p>
                </div>
                <div>
                  <span className="text-gray-500">Horario</span>
                  <p className="font-medium">
                    {cancellationResult.booking.start_time} - {cancellationResult.booking.end_time}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Estado</span>
                  <p className="font-medium text-red-600">Cancelado</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link to="/">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-3 font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg"
                >
                  Volver al inicio
                </motion.button>
              </Link>
              <Link to="/reservar">
                <button className="w-full px-6 py-3 font-medium text-indigo-600 bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors">
                  Hacer nueva reserva
                </button>
              </Link>
            </div>
          </motion.div>
        ) : selectedBooking ? (
          /* Selected Booking Detail */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Detalle de tu reserva</h2>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-indigo-500" />
                  <div>
                    <span className="text-sm text-gray-500">Cancha</span>
                    <p className="font-semibold">{selectedBooking.court_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  <div>
                    <span className="text-sm text-gray-500">Fecha</span>
                    <p className="font-semibold">{selectedBooking.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  <div>
                    <span className="text-sm text-gray-500">Horario</span>
                    <p className="font-semibold">
                      {selectedBooking.start_time} - {selectedBooking.end_time}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {selectedBooking.can_cancel ? (
              <div>
                {!showConfirm ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 text-white font-semibold bg-gradient-to-r from-rose-500 to-pink-600 rounded-xl shadow-lg"
                  >
                    <XCircle className="w-5 h-5" />
                    Cancelar esta reserva
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-rose-50 border border-rose-200 rounded-xl p-5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                      <p className="font-semibold text-rose-800">Confirmar cancelación</p>
                    </div>
                    <p className="text-sm text-rose-700 mb-4">
                      Esta acción no se puede deshacer. El horario quedará disponible para otros jugadores.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setShowConfirm(false)}
                        className="flex-1 w-full sm:w-auto px-4 py-2.5 font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                      >
                        No, volver
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="flex-1 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 font-medium text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Sí, cancelar'
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-800">No se puede cancelar</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Se requieren al menos {selectedBooking.min_cancellation_hours} horas de anticipación para cancelar. Contactá al club directamente.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => { setSelectedBooking(null); clearError() }}
              className="w-full mt-4 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Volver a resultados
            </button>
          </motion.div>
        ) : hasSearched && searchResults.length > 0 ? (
          /* Search Results */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reservas encontradas</h2>
            <p className="text-gray-500 mb-6">Seleccioná la reserva que querés cancelar</p>

            <div className="space-y-3">
              {searchResults.map((booking) => (
                <motion.button
                  key={booking.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => { setSelectedBooking(booking); clearError() }}
                  className="w-full text-left bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900">{booking.court_name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {booking.date} &middot; {booking.start_time} - {booking.end_time}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{booking.customer_name}</p>
                    </div>
                    {booking.can_cancel ? (
                      <span className="text-xs px-2 py-1 bg-rose-100 text-rose-700 rounded-full font-medium">
                        Cancelable
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full font-medium">
                        No cancelable
                      </span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            <button
              onClick={handleReset}
              className="w-full mt-6 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Nueva búsqueda
            </button>
          </motion.div>
        ) : hasSearched && searchResults.length === 0 ? (
          /* No Results */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No se encontraron reservas</h2>
            <p className="text-gray-500 mb-6">
              No hay reservas activas con ese nombre o teléfono
            </p>
            <button
              onClick={handleReset}
              className="px-6 py-3 font-medium text-indigo-600 bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Intentar de nuevo
            </button>
          </motion.div>
        ) : (
          /* Search Form */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <XCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Cancelar reserva</h2>
              <p className="text-gray-500">
                Ingresá tu nombre o número de teléfono para buscar tu reserva
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre o teléfono
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      clearError()
                    }}
                    placeholder="Ej: Juan Pérez o 1155667788"
                    className="w-full pl-11 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                  />
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || !query.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 text-white font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Buscar Reserva
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default CancelBooking
