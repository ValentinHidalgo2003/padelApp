import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { reportService } from '../services/reportService'
import { formatCurrency, formatTime, getPaymentMethodLabel } from '../utils/formatters'
import { DollarSign, TrendingUp, Package, RefreshCw, Calendar } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { motion } from 'framer-motion'

function DailySummary() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    loadSummary()
  }, [selectedDate])
  
  const loadSummary = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await reportService.getDailySummary(selectedDate)
      setSummary(data)
    } catch (err) {
      setError('Error al cargar el resumen')
    } finally {
      setLoading(false)
    }
  }
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
  
  const paymentMethodData = summary?.by_payment_method.map((item) => ({
    name: item.method_display,
    value: item.total,
  })) || []
  
  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Caja Diaria
          </h1>
          <p className="text-gray-600 mt-1">Resumen de ingresos y pagos</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial min-w-0">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-600 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-auto pl-11 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white hover:border-indigo-300 font-medium"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadSummary}
            disabled={loading}
            className="flex items-center px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-indigo-300 hover:shadow-md disabled:opacity-50 transition-all font-medium"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </motion.button>
        </div>
      </motion.div>
      
      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border border-red-300 text-red-700 px-4 py-3 rounded-xl backdrop-blur-sm"
        >
          {error}
        </motion.div>
      )}
      
      {loading && !summary ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"
          />
          <p className="mt-4 text-gray-600 font-medium">Cargando datos...</p>
        </motion.div>
      ) : summary ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="glass rounded-2xl shadow-xl p-6 border border-white/30 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full blur-2xl"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Facturado</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {formatCurrency(summary.total_amount)}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="glass rounded-2xl shadow-xl p-6 border border-white/30 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-600/20 rounded-full blur-2xl"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Turnos Cerrados</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {summary.total_bookings}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="glass rounded-2xl shadow-xl p-6 border border-white/30 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-full blur-2xl"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Ingresos Turnos</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {formatCurrency(summary.total_booking_amount)}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="glass rounded-2xl shadow-xl p-6 border border-white/30 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-amber-600/20 rounded-full blur-2xl"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Ingresos Consumos</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    {formatCurrency(summary.total_consumptions_amount)}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg">
                  <Package className="w-7 h-7 text-white" />
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Charts */}
          {summary.by_payment_method.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="glass rounded-2xl shadow-xl p-6 border border-white/30"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
                  Por Método de Pago
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
              
              {/* Payment Method List */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="glass rounded-2xl shadow-xl p-6 border border-white/30"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
                  Detalle por Método
                </h2>
                <div className="space-y-3">
                  {summary.by_payment_method.map((item, index) => (
                    <motion.div
                      key={item.method}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      className="flex justify-between items-center p-4 bg-white/60 rounded-xl border border-white/40 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <div>
                          <p className="font-semibold text-gray-800">{item.method_display}</p>
                          <p className="text-sm text-gray-600">{item.count} turnos</p>
                        </div>
                      </div>
                      <p className="font-bold text-lg text-gray-800">{formatCurrency(item.total)}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
          
          {/* Bookings Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 sm:p-6 border-b">
              <h2 className="text-lg font-semibold">Turnos Cerrados del Día</h2>
            </div>
            {summary.bookings.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No hay turnos cerrados para esta fecha
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cancha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Horario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Efectivo
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transferencia
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Turno
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Consumos
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {summary.bookings.map((booking) => (
                      <tr key={booking.booking_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {booking.court_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.customer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {booking.cash_amount > 0 ? formatCurrency(booking.cash_amount) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {booking.transfer_amount > 0 ? formatCurrency(booking.transfer_amount) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(booking.booking_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(booking.consumptions_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                          {formatCurrency(booking.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}

export default DailySummary
