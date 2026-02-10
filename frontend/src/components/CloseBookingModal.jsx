import { useState, useEffect } from 'react'
import { X, Plus, Trash2, AlertCircle } from 'lucide-react'
import { useBookingsStore } from '../store/bookingsStore'
import { useProductsStore } from '../store/productsStore'
import { formatCurrency } from '../utils/formatters'
import ConsumptionModal from './ConsumptionModal'

function CloseBookingModal({ isOpen, onClose, booking, onSuccess }) {
  const { closeBooking, loading, error, clearError } = useBookingsStore()
  const { products, fetchProducts, consumptions, fetchConsumptions, deleteConsumption } = useProductsStore()
  const [showConsumptionModal, setShowConsumptionModal] = useState(false)
  
  // Auto-fill booking_amount from court price
  const courtPrice = booking.court_info?.price || booking.court_price || 0
  
  const [formData, setFormData] = useState({
    booking_amount: courtPrice ? String(courtPrice) : '',
    cash_amount: '',
    transfer_amount: '',
    notes: '',
  })
  
  useEffect(() => {
    if (isOpen) {
      clearError()
      fetchProducts()
      fetchConsumptions(booking.id)
      // Reset form with court price
      const price = booking.court_info?.price || booking.court_price || 0
      setFormData({
        booking_amount: price ? String(price) : '',
        cash_amount: '',
        transfer_amount: '',
        notes: '',
      })
    }
  }, [isOpen, booking.id, clearError, fetchProducts, fetchConsumptions])
  
  const consumptionsTotal = consumptions.reduce((sum, c) => sum + parseFloat(c.total_price), 0)
  const bookingAmount = parseFloat(formData.booking_amount) || 0
  const cashAmount = parseFloat(formData.cash_amount) || 0
  const transferAmount = parseFloat(formData.transfer_amount) || 0
  const totalAmount = bookingAmount + consumptionsTotal
  const paymentSum = cashAmount + transferAmount
  const paymentMismatch = formData.booking_amount && (cashAmount > 0 || transferAmount > 0) && paymentSum !== bookingAmount
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (paymentSum !== bookingAmount) return
    try {
      await closeBooking(booking.id, {
        booking_amount: formData.booking_amount,
        cash_amount: formData.cash_amount || '0',
        transfer_amount: formData.transfer_amount || '0',
        notes: formData.notes,
      })
      onSuccess()
    } catch (err) {
      // Error is handled by store
    }
  }
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Auto-fill: when booking_amount changes and no split yet, default all to cash
  const handleBookingAmountChange = (e) => {
    const value = e.target.value
    const newAmount = parseFloat(value) || 0
    setFormData((prev) => ({
      ...prev,
      booking_amount: value,
      cash_amount: String(newAmount),
      transfer_amount: '0',
    }))
  }
  
  const handleDeleteConsumption = async (id) => {
    if (!confirm('¿Eliminar este consumo?')) return
    try {
      await deleteConsumption(id)
      fetchConsumptions(booking.id)
    } catch (err) {
      alert('Error al eliminar consumo')
    }
  }
  
  if (!isOpen) return null
  
  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-4 sm:p-6 border-b">
            <h2 className="text-lg sm:text-xl font-bold">Cerrar Turno</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {/* Booking Info */}
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="font-medium">{booking.court_name}</p>
              <p className="text-sm text-gray-600">
                {booking.date} | {booking.start_time} - {booking.end_time}
              </p>
              <p className="text-sm text-gray-600">{booking.customer_name}</p>
            </div>
            
            {/* Booking Amount (auto-filled) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto del Turno *
              </label>
              <input
                type="number"
                name="booking_amount"
                value={formData.booking_amount}
                onChange={handleBookingAmountChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
              />
              {courtPrice > 0 && (
                <p className="text-xs text-gray-400 mt-1">Precio configurado: {formatCurrency(courtPrice)}</p>
              )}
            </div>

            {/* Split Payment */}
            <div className="border rounded-md p-4 space-y-3">
              <h3 className="font-medium text-sm text-gray-700">Forma de Pago</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Efectivo
                  </label>
                  <input
                    type="number"
                    name="cash_amount"
                    value={formData.cash_amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Transferencia
                  </label>
                  <input
                    type="number"
                    name="transfer_amount"
                    value={formData.transfer_amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0"
                  />
                </div>
              </div>
              {paymentMismatch && (
                <div className="flex items-center gap-2 text-amber-600 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Efectivo ({formatCurrency(cashAmount)}) + Transferencia ({formatCurrency(transferAmount)}) = {formatCurrency(paymentSum)} 
                    {' '}-- debe sumar {formatCurrency(bookingAmount)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Consumptions */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Consumos</h3>
                <button
                  type="button"
                  onClick={() => setShowConsumptionModal(true)}
                  className="flex items-center text-sm text-indigo-600 hover:text-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </button>
              </div>
              
              {consumptions.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No hay consumos registrados</p>
              ) : (
                <div className="space-y-2">
                  {consumptions.map((consumption) => (
                    <div
                      key={consumption.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                    >
                      <div>
                        <p className="font-medium">{consumption.product_info?.name || 'Producto'}</p>
                        <p className="text-sm text-gray-600">
                          {consumption.quantity} x {formatCurrency(consumption.unit_price)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{formatCurrency(consumption.total_price)}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteConsumption(consumption.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Total */}
            <div className="border-t pt-4 bg-gray-50 p-4 rounded-md space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Monto turno:</span>
                <span className="font-medium">{formatCurrency(bookingAmount)}</span>
              </div>
              {cashAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 pl-4">Efectivo:</span>
                  <span>{formatCurrency(cashAmount)}</span>
                </div>
              )}
              {transferAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 pl-4">Transferencia:</span>
                  <span>{formatCurrency(transferAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Consumos:</span>
                <span className="font-medium">{formatCurrency(consumptionsTotal)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-bold text-lg">Total:</span>
                <span className="font-bold text-lg text-indigo-600">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Información adicional..."
              />
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || paymentMismatch}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Cerrando...' : 'Cerrar Turno'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {showConsumptionModal && (
        <ConsumptionModal
          isOpen={showConsumptionModal}
          onClose={() => setShowConsumptionModal(false)}
          booking={booking}
          products={products}
          onSuccess={() => {
            setShowConsumptionModal(false)
            fetchConsumptions(booking.id)
          }}
        />
      )}
    </>
  )
}

export default CloseBookingModal
