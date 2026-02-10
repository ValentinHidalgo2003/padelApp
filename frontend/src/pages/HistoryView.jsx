import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { reportService } from '../services/reportService'
import { useCourtsStore } from '../store/courtsStore'
import { formatDate, formatTime, formatCurrency, getStatusLabel } from '../utils/formatters'
import { Search, RefreshCw } from 'lucide-react'

function HistoryView() {
  const { courts, fetchCourts } = useCourtsStore()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [filters, setFilters] = useState({
    date_from: format(new Date(), 'yyyy-MM-dd'),
    date_to: format(new Date(), 'yyyy-MM-dd'),
    court: '',
    status: '',
  })
  
  useEffect(() => {
    fetchCourts()
  }, [fetchCourts])
  
  useEffect(() => {
    loadHistory()
  }, [])
  
  const loadHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to
      if (filters.court) params.court = filters.court
      if (filters.status) params.status = filters.status
      
      const data = await reportService.getHistory(params)
      setHistory(data)
    } catch (err) {
      setError('Error al cargar el historial')
    } finally {
      setLoading(false)
    }
  }
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }
  
  const handleSearch = () => {
    loadHistory()
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Historial de Turnos</h1>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Desde
            </label>
            <input
              type="date"
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Hasta
            </label>
            <input
              type="date"
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cancha
            </label>
            <select
              name="court"
              value={filters.court}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Todas</option>
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Todos</option>
              <option value="reserved">Reservado</option>
              <option value="completed">Jugado</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </>
            )}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      {/* Results */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 sm:p-6 border-b">
          <h2 className="text-lg font-semibold">
            Resultados ({history.length})
          </h2>
        </div>
        
        {history.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {loading ? 'Cargando...' : 'No se encontraron turnos'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cancha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(booking.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {booking.court_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.start_time} - {booking.end_time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        booking.status === 'reserved' ? 'bg-blue-100 text-blue-800' :
                        booking.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {booking.status_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {booking.closure ? formatCurrency(booking.closure.total_amount) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default HistoryView
