import { useState, useEffect } from 'react'
import { X, Calendar, Clock, User, Phone, FileText } from 'lucide-react'
import { useBookingsStore } from '../store/bookingsStore'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

function BookingModal({ isOpen, onClose, onSuccess, initialSlot, courts }) {
  const { createBooking, loading, error, clearError } = useBookingsStore()
  
  const [formData, setFormData] = useState({
    court: '',
    date: '',
    start_time: '',
    end_time: '',
    customer_name: '',
    customer_phone: '',
    notes: '',
  })
  
  useEffect(() => {
    if (initialSlot && initialSlot.start) {
      setFormData((prev) => ({
        ...prev,
        date: format(initialSlot.start, 'yyyy-MM-dd'),
        start_time: format(initialSlot.start, 'HH:mm'),
        end_time: format(initialSlot.end, 'HH:mm'),
      }))
    }
  }, [initialSlot])
  
  useEffect(() => {
    if (isOpen) {
      clearError()
    }
  }, [isOpen, clearError])
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createBooking(formData)
      onSuccess()
    } catch (err) {
      // Error is handled by store
    }
  }
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="glass rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-white/20 bg-gradient-to-r from-indigo-500 to-purple-600">
              <h2 className="text-2xl font-bold text-white">Crear Turno</h2>
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose} 
                className="text-white hover:bg-white/20 p-2 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 bg-white/80">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm backdrop-blur-sm"
            >
              {error}
            </motion.div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Cancha *
            </label>
            <select
              name="court"
              value={formData.court}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm hover:border-indigo-300"
            >
              <option value="">Seleccionar cancha</option>
              {courts.filter((c) => c.is_active).map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name} - {court.court_type_display}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Fecha *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm hover:border-indigo-300"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Hora Inicio *
              </label>
              <input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm hover:border-indigo-300"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Hora Fin *
              </label>
              <input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm hover:border-indigo-300"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              Nombre del Cliente *
            </label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm hover:border-indigo-300"
              placeholder="Juan Pérez"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4 text-indigo-600" />
              Teléfono
            </label>
            <input
              type="tel"
              name="customer_phone"
              value={formData.customer_phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm hover:border-indigo-300"
              placeholder="11 1234-5678"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Notas
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm hover:border-indigo-300 resize-none"
              placeholder="Información adicional..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-6">
            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-all"
            >
              Cancelar
            </motion.button>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 font-medium transition-all"
            >
              {loading ? 'Creando...' : 'Crear Turno'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  )
}

export default BookingModal
