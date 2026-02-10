import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePublicBookingsStore } from '../store/publicBookingsStore'
import {
  Calendar, MapPin, Clock, User, ArrowLeft, ArrowRight,
  Check, Sparkles, ChevronLeft, Loader2, AlertCircle
} from 'lucide-react'
import { format, addDays, startOfToday, isBefore } from 'date-fns'
import { es } from 'date-fns/locale'

const STEPS = [
  { id: 1, label: 'Fecha', icon: Calendar },
  { id: 2, label: 'Cancha', icon: MapPin },
  { id: 3, label: 'Horario', icon: Clock },
  { id: 4, label: 'Datos', icon: User },
  { id: 5, label: 'Confirmación', icon: Check },
]

function AvailabilityView() {
  const navigate = useNavigate()
  const {
    courts, availableSlots, currentBooking,
    loading, error,
    fetchCourts, fetchAvailableSlots, createBooking,
    reset, clearError,
  } = usePublicBookingsStore()

  const [step, setStep] = useState(1)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedCourt, setSelectedCourt] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
  })
  useEffect(() => {
    fetchCourts()
    return () => reset()
  }, [fetchCourts, reset])

  useEffect(() => {
    if (selectedDate && selectedCourt) {
      fetchAvailableSlots(format(selectedDate, 'yyyy-MM-dd'), selectedCourt.id)
    }
  }, [selectedDate, selectedCourt, fetchAvailableSlots])

  // Generate next 14 days
  const today = startOfToday()
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i))

  const courtSlots = availableSlots.filter(
    (s) => s.court_id === selectedCourt?.id
  )

  const handleSubmit = async () => {
    clearError()
    try {
      await createBooking({
        court: selectedCourt.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        ...formData,
      })
      setStep(5)
    } catch (err) {
      // Error handled in store
    }
  }

  const goBack = () => {
    clearError()
    if (step > 1 && step < 5) {
      setStep(step - 1)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="glass sticky top-0 z-50 shadow-lg border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Volver</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-700">Reservar Turno</span>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      {step < 5 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex items-center justify-between mb-8">
            {STEPS.filter(s => s.id < 5).map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center gap-2 ${
                  step >= s.id ? 'text-indigo-600' : 'text-gray-400'
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step > s.id
                      ? 'bg-indigo-600 text-white'
                      : step === s.id
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > s.id ? <Check className="w-5 h-5" /> : s.id}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">{s.label}</span>
                </div>
                {i < 3 && (
                  <div className={`w-8 sm:w-16 lg:w-24 h-0.5 mx-2 ${
                    step > s.id ? 'bg-indigo-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {error && step < 5 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          </motion.div>
        )}

        <div>
          {/* Step 1: Select Date */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Elegí una fecha</h2>
              <p className="text-gray-500 mb-6">Seleccioná el día que querés jugar</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {dates.map((date) => {
                  const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                  const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
                  return (
                    <motion.button
                      key={date.toISOString()}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setSelectedDate(date)
                        setSelectedSlot(null)
                        setStep(2)
                      }}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                      }`}
                    >
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        {format(date, 'EEE', { locale: es })}
                      </p>
                      <p className={`text-2xl font-bold ${isSelected ? 'text-indigo-600' : 'text-gray-900'}`}>
                        {format(date, 'd')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(date, 'MMM', { locale: es })}
                      </p>
                      {isToday && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
                          Hoy
                        </span>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Step 2: Select Court */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Elegí una cancha</h2>
              <p className="text-gray-500 mb-6">
                {selectedDate && format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courts.map((court) => {
                  const isSelected = selectedCourt?.id === court.id
                  const typeLabels = {
                    indoor: 'Interior',
                    outdoor: 'Exterior',
                    glass: 'Cristal',
                  }
                  const typeColors = {
                    indoor: 'from-blue-500 to-cyan-500',
                    outdoor: 'from-green-500 to-emerald-500',
                    glass: 'from-purple-500 to-pink-500',
                  }
                  return (
                    <motion.button
                      key={court.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedCourt(court)
                        setSelectedSlot(null)
                        setStep(3)
                      }}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${typeColors[court.court_type] || 'from-gray-500 to-gray-600'} flex items-center justify-center mb-3`}>
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg">{court.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {typeLabels[court.court_type] || court.court_type}
                      </p>
                      <p className="text-xl font-bold text-indigo-600">
                        ${Number(court.price).toLocaleString('es-AR')}
                        <span className="text-sm font-normal text-gray-400 ml-1">/ turno</span>
                      </p>
                    </motion.button>
                  )
                })}
              </div>
              {courts.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500">
                  No hay canchas disponibles en este momento
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Select Time Slot */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Elegí un horario</h2>
              <p className="text-gray-500 mb-6">
                {selectedCourt?.name} &middot;{' '}
                {selectedDate && format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
              </p>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <span className="ml-3 text-gray-500">Cargando horarios...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {courtSlots.map((slot, index) => {
                    const isSelected = selectedSlot?.start_time === slot.start_time && selectedSlot?.end_time === slot.end_time
                    return (
                      <button
                        key={`${slot.start_time}-${slot.end_time}`}
                        disabled={!slot.available}
                        onClick={() => {
                          setSelectedSlot(slot)
                          setStep(4)
                        }}
                        className={`p-4 rounded-xl border-2 transition-all text-center ${
                          !slot.available
                            ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                            : isSelected
                              ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                              : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md cursor-pointer'
                        }`}
                      >
                        <Clock className={`w-5 h-5 mx-auto mb-2 ${
                          !slot.available ? 'text-gray-300' : isSelected ? 'text-indigo-600' : 'text-gray-400'
                        }`} />
                        <p className={`font-bold text-lg ${
                          !slot.available ? 'text-gray-300' : isSelected ? 'text-indigo-600' : 'text-gray-900'
                        }`}>
                          {slot.start_time}
                        </p>
                        <p className={`text-xs ${!slot.available ? 'text-gray-300' : 'text-gray-500'}`}>
                          a {slot.end_time}
                        </p>
                        {!slot.available && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-full">
                            Ocupado
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
              {courtSlots.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500">
                  No hay horarios disponibles para esta cancha en esta fecha
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: Customer Data */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tus datos</h2>
              <p className="text-gray-500 mb-6">Ingresá tu información para confirmar la reserva</p>

              {/* Summary Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Resumen de tu reserva</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Cancha:</span>
                    <p className="font-medium text-gray-900">{selectedCourt?.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Fecha:</span>
                    <p className="font-medium text-gray-900">
                      {selectedDate && format(selectedDate, "EEE d 'de' MMM", { locale: es })}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Horario:</span>
                    <p className="font-medium text-gray-900">
                      {selectedSlot?.start_time} - {selectedSlot?.end_time}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Precio:</span>
                    <p className="font-bold text-indigo-600">
                      ${Number(selectedCourt?.price).toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="Ej: Juan Pérez"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    placeholder="Ej: 1155667788"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                  />
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                  <strong>Importante:</strong> El pago se realiza en el lugar al momento de jugar.
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !formData.customer_name.trim() || !formData.customer_phone.trim()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 text-white font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Reservando...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Confirmar Reserva
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Confirmation */}
          {step === 5 && currentBooking && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                  <Check className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Reserva confirmada</h2>
                <p className="text-gray-500">Tu turno fue reservado exitosamente</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Cancha</span>
                      <p className="font-semibold text-gray-900">{currentBooking.court_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Fecha</span>
                      <p className="font-semibold text-gray-900">{currentBooking.date}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Horario</span>
                      <p className="font-semibold text-gray-900">
                        {currentBooking.start_time} - {currentBooking.end_time}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Precio</span>
                      <p className="font-bold text-indigo-600">
                        ${Number(currentBooking.court_price).toLocaleString('es-AR')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-t border-gray-200 p-4">
                  <p className="text-sm text-gray-600 text-center">
                    Si necesitás cancelar, podés hacerlo desde la sección <Link to="/cancelar" className="text-indigo-600 font-medium hover:underline">Cancelar Reserva</Link> con tu nombre o teléfono.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-8">
                <Link to="/">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-6 py-3 text-center font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg"
                  >
                    Volver al inicio
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AvailabilityView
