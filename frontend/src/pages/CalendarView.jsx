import { useEffect, useState } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addDays, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { useBookingsStore } from '../store/bookingsStore'
import { useCourtsStore } from '../store/courtsStore'
import { Plus, RefreshCw } from 'lucide-react'
import BookingModal from '../components/BookingModal'
import BookingDetailModal from '../components/BookingDetailModal'
import { motion } from 'framer-motion'

const locales = {
  es: es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

function CalendarView() {
  const { bookings, fetchCalendar, loading } = useBookingsStore()
  const { courts, fetchCourts } = useCourtsStore()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [newBookingSlot, setNewBookingSlot] = useState(null)
  
  useEffect(() => {
    fetchCourts()
  }, [fetchCourts])
  
  useEffect(() => {
    loadWeekBookings()
  }, [selectedDate])
  
  const loadWeekBookings = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const weekEnd = addDays(weekStart, 6)
    
    fetchCalendar(
      format(weekStart, 'yyyy-MM-dd'),
      format(weekEnd, 'yyyy-MM-dd')
    )
  }
  
  // Transform bookings to calendar events (exclude cancelled)
  const events = bookings.filter((b) => b.status !== 'cancelled').map((booking) => {
    const dateStr = booking.date
    const startTimeStr = booking.start_time
    const endTimeStr = booking.end_time
    
    // Parse date and time
    const [year, month, day] = dateStr.split('-')
    const [startHour, startMin] = startTimeStr.split(':')
    const [endHour, endMin] = endTimeStr.split(':')
    
    return {
      id: booking.id,
      title: booking.customer_name || `${booking.court_name} - ${booking.status}`,
      start: new Date(year, month - 1, day, startHour, startMin),
      end: new Date(year, month - 1, day, endHour, endMin),
      resource: booking,
    }
  })
  
  const handleSelectSlot = ({ start, end }) => {
    setNewBookingSlot({ start, end })
    setShowCreateModal(true)
  }
  
  const handleSelectEvent = (event) => {
    setSelectedBooking(event.resource)
    setShowDetailModal(true)
  }
  
  const eventStyleGetter = (event) => {
    const booking = event.resource
    let backgroundColor = '#3b82f6' // default blue
    
    switch (booking.status) {
      case 'available':
        backgroundColor = '#10b981' // green
        break
      case 'reserved':
        backgroundColor = '#3b82f6' // blue
        break
      case 'cancelled':
        backgroundColor = '#ef4444' // red
        break
      case 'completed':
        backgroundColor = '#6b7280' // gray
        break
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    }
  }
  
  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Calendario de Turnos
          </h1>
          <p className="text-gray-600 mt-1">Gestiona las reservas de canchas</p>
        </div>
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadWeekBookings}
            disabled={loading}
            className="flex items-center px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-indigo-300 hover:shadow-md disabled:opacity-50 transition-all font-medium"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setNewBookingSlot(null)
              setShowCreateModal(true)
            }}
            className="flex items-center px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Turno
          </motion.button>
        </div>
      </motion.div>
      
      {/* Legend */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-4 shadow-lg"
      >
        <div className="flex flex-wrap gap-6 text-sm font-medium">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2"
          >
            <div className="w-5 h-5 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg shadow-sm"></div>
            <span className="text-gray-700">Libre</span>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2"
          >
            <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-sm"></div>
            <span className="text-gray-700">Reservado</span>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2"
          >
            <div className="w-5 h-5 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg shadow-sm"></div>
            <span className="text-gray-700">Jugado</span>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Calendar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl shadow-2xl p-3 sm:p-6 border border-white/30 overflow-hidden min-h-[320px] h-[50vh] sm:h-[450px] md:h-[550px] lg:h-[650px]"
      >
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          culture="es"
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          eventPropGetter={eventStyleGetter}
          defaultView="week"
          views={['week', 'day']}
          min={new Date(2024, 0, 1, 8, 0)} // 8 AM
          max={new Date(2024, 0, 1, 23, 0)} // 11 PM
          step={30}
          timeslots={2}
          messages={{
            next: 'Siguiente',
            previous: 'Anterior',
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            agenda: 'Agenda',
            date: 'Fecha',
            time: 'Hora',
            event: 'Turno',
            noEventsInRange: 'No hay turnos en este rango',
          }}
        />
      </motion.div>
      
      {/* Modals */}
      {showCreateModal && (
        <BookingModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setNewBookingSlot(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setNewBookingSlot(null)
            loadWeekBookings()
          }}
          initialSlot={newBookingSlot}
          courts={courts}
        />
      )}
      
      {showDetailModal && selectedBooking && (
        <BookingDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedBooking(null)
          }}
          booking={selectedBooking}
          onUpdate={loadWeekBookings}
        />
      )}
    </div>
  )
}

export default CalendarView
