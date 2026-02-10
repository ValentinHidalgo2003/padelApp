import { useState } from 'react'
import { X, Ban, DollarSign } from 'lucide-react'
import { useBookingsStore } from '../store/bookingsStore'
import { formatDate, formatTime, formatCurrency, getStatusLabel } from '../utils/formatters'
import CloseBookingModal from './CloseBookingModal'

function BookingDetailModal({ isOpen, onClose, booking, onUpdate }) {
  const { cancelBooking } = useBookingsStore()
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const handleCancel = async () => {
    if (!confirm('¿Está seguro de cancelar este turno?')) return
    
    setLoading(true)
    try {
      await cancelBooking(booking.id)
      onUpdate()
      onClose()
    } catch (error) {
      alert('Error al cancelar el turno')
    } finally {
      setLoading(false)
    }
  }
  
  const handleCloseBooking = () => {
    setShowCloseModal(true)
  }
  
  if (!isOpen) return null
  
  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-4 sm:p-6 border-b">
            <h2 className="text-lg sm:text-xl font-bold">Detalle del Turno</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-4 sm:p-6 space-y-6">
            {/* Status Badge */}
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                booking.status === 'reserved' ? 'bg-blue-100 text-blue-800' :
                booking.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-green-100 text-green-800'
              }`}>
                {getStatusLabel(booking.status)}
              </span>
            </div>
            
            {/* Booking Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Cancha</p>
                <p className="font-medium">{booking.court_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha</p>
                <p className="font-medium">{formatDate(booking.date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hora Inicio</p>
                <p className="font-medium">{formatTime(booking.start_time)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hora Fin</p>
                <p className="font-medium">{formatTime(booking.end_time)}</p>
              </div>
            </div>
            
            {/* Customer Info */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Información del Cliente</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-medium">{booking.customer_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium">{booking.customer_phone || '-'}</p>
                </div>
              </div>
            </div>
            
            {/* Closure Info */}
            {booking.status === 'completed' && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Información de Cierre</h3>
                <div className="bg-gray-50 p-4 rounded-md space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monto turno:</span>
                    <span className="font-medium">
                      {booking.closure ? formatCurrency(booking.closure.booking_amount) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Consumos:</span>
                    <span className="font-medium">
                      {booking.closure ? formatCurrency(booking.closure.consumptions_amount) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold text-lg">
                      {booking.closure ? formatCurrency(booking.closure.total_amount) : '-'}
                    </span>
                  </div>
                  {booking.closure?.cash_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Efectivo:</span>
                      <span className="font-medium">
                        {formatCurrency(booking.closure.cash_amount)}
                      </span>
                    </div>
                  )}
                  {booking.closure?.transfer_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transferencia:</span>
                      <span className="font-medium">
                        {formatCurrency(booking.closure.transfer_amount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-3 border-t pt-4">
              {booking.status === 'reserved' && (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Cancelar Turno
                  </button>
                  <button
                    onClick={handleCloseBooking}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Cerrar Turno
                  </button>
                </>
              )}
              {booking.status !== 'reserved' && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {showCloseModal && (
        <CloseBookingModal
          isOpen={showCloseModal}
          onClose={() => setShowCloseModal(false)}
          booking={booking}
          onSuccess={() => {
            setShowCloseModal(false)
            onUpdate()
            onClose()
          }}
        />
      )}
    </>
  )
}

export default BookingDetailModal
