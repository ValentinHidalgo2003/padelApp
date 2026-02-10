import { useEffect, useState } from 'react'
import { useCourtsStore } from '../store/courtsStore'
import { Plus, Edit2, Power, PowerOff } from 'lucide-react'

function CourtsManagement() {
  const { courts, fetchCourts, createCourt, updateCourt, toggleCourtActive, loading } = useCourtsStore()
  const [showModal, setShowModal] = useState(false)
  const [editingCourt, setEditingCourt] = useState(null)
  
  useEffect(() => {
    fetchCourts({ show_all: true })
  }, [fetchCourts])
  
  const handleCreate = () => {
    setEditingCourt(null)
    setShowModal(true)
  }
  
  const handleEdit = (court) => {
    setEditingCourt(court)
    setShowModal(true)
  }
  
  const handleToggleActive = async (court) => {
    try {
      await toggleCourtActive(court.id)
    } catch (error) {
      alert('Error al cambiar estado')
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Canchas</h1>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cancha
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courts.map((court) => (
              <tr key={court.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {court.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {court.court_type_display}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  ${Number(court.price).toLocaleString('es-AR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    court.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {court.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(court)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Edit2 className="w-4 h-4 inline" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(court)}
                    className={court.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                  >
                    {court.is_active ? <PowerOff className="w-4 h-4 inline" /> : <Power className="w-4 h-4 inline" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      
      {showModal && (
        <CourtModal
          court={editingCourt}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            fetchCourts({ show_all: true })
          }}
        />
      )}
    </div>
  )
}

function CourtModal({ court, onClose, onSuccess }) {
  const { createCourt, updateCourt, loading, error, clearError } = useCourtsStore()
  const [formData, setFormData] = useState({
    name: court?.name || '',
    court_type: court?.court_type || 'outdoor',
    price: court?.price || 0,
    is_active: court?.is_active ?? true,
  })
  
  useEffect(() => {
    clearError()
  }, [clearError])
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (court) {
        await updateCourt(court.id, formData)
      } else {
        await createCourt(formData)
      }
      onSuccess()
    } catch (err) {
      // Error handled by store
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">
            {court ? 'Editar Cancha' : 'Nueva Cancha'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo *
            </label>
            <select
              value={formData.court_type}
              onChange={(e) => setFormData({ ...formData, court_type: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="indoor">Interior</option>
              <option value="outdoor">Exterior</option>
              <option value="glass">Cristal</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio por turno ($)
            </label>
            <input
              type="number"
              min={0}
              step={100}
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Activa
            </label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : court ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CourtsManagement
