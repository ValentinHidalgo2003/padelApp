import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Clock, DollarSign, Save, Loader2, AlertCircle, Check, RefreshCw } from 'lucide-react'
import api from '../utils/api'

function ConfigurationView() {
  const [config, setConfig] = useState(null)
  const [courts, setCourts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [editedPrices, setEditedPrices] = useState({})

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [configRes, courtsRes] = await Promise.all([
        api.get('/config/'),
        api.get('/config/courts/'),
      ])
      setConfig(configRes.data)
      setCourts(courtsRes.data)
      // Initialize edited prices
      const prices = {}
      courtsRes.data.forEach((c) => { prices[c.id] = c.price })
      setEditedPrices(prices)
    } catch (err) {
      setError('Error al cargar la configuración')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleConfigSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await api.patch('/config/update/', config)
      setConfig(res.data)
      setSuccess('Configuración de horarios actualizada correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const errData = err.response?.data
      if (errData) {
        const messages = Object.values(errData).flat().join('. ')
        setError(messages || 'Error al guardar configuración')
      } else {
        setError('Error al guardar configuración')
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePriceSave = async (courtId) => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await api.patch(`/config/courts/${courtId}/price/`, {
        price: editedPrices[courtId],
      })
      setCourts((prev) => prev.map((c) => (c.id === courtId ? res.data : c)))
      setSuccess(`Precio de ${res.data.name} actualizado correctamente`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Error al actualizar precio')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="ml-3 text-gray-500">Cargando configuración...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-indigo-500" />
            Configuración del Sistema
          </h1>
          <p className="text-gray-500 mt-1">Configurá horarios, duración de turnos y precios</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Recargar
        </motion.button>
      </div>

      {/* Notifications */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"
        >
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </motion.div>
      )}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl"
        >
          <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <p className="text-green-700 text-sm">{success}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Schedule Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Configuración de Horarios
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Horarios globales aplicados a todas las canchas
            </p>
          </div>

          {config && (
            <form onSubmit={handleConfigSave} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Hora de apertura
                  </label>
                  <input
                    type="time"
                    value={config.opening_time || ''}
                    onChange={(e) => setConfig({ ...config, opening_time: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Hora de cierre
                  </label>
                  <input
                    type="time"
                    value={config.closing_time || ''}
                    onChange={(e) => setConfig({ ...config, closing_time: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Duración de cada turno (minutos)
                </label>
                <select
                  value={config.slot_duration_minutes || 90}
                  onChange={(e) => setConfig({ ...config, slot_duration_minutes: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={60}>60 minutos (1 hora)</option>
                  <option value={90}>90 minutos (1.5 horas)</option>
                  <option value={120}>120 minutos (2 horas)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Anticipación mínima para cancelar (horas)
                </label>
                <input
                  type="number"
                  min={0}
                  max={48}
                  value={config.min_cancellation_hours || 0}
                  onChange={(e) => setConfig({ ...config, min_cancellation_hours: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Los clientes no podrán cancelar con menos de esta cantidad de horas de anticipación
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 text-white font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Guardar Horarios
              </motion.button>
            </form>
          )}
        </motion.div>

        {/* Court Prices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Precios por Cancha
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Precio que se muestra a los clientes al reservar
            </p>
          </div>

          <div className="p-6 space-y-4">
            {courts.map((court) => {
              const typeLabels = {
                indoor: 'Interior',
                outdoor: 'Exterior',
                glass: 'Cristal',
              }
              const hasChanged = editedPrices[court.id] !== court.price
              
              return (
                <div
                  key={court.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    hasChanged
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{court.name}</p>
                    <p className="text-sm text-gray-500">
                      {typeLabels[court.court_type] || court.court_type}
                      {!court.is_active && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                          Inactiva
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={editedPrices[court.id] || ''}
                        onChange={(e) => setEditedPrices({
                          ...editedPrices,
                          [court.id]: e.target.value,
                        })}
                        className="w-32 pl-7 pr-3 py-2.5 border border-gray-300 rounded-xl text-right font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePriceSave(court.id)}
                      disabled={saving || !hasChanged}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        hasChanged
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </motion.button>
                  </div>
                </div>
              )
            })}
            {courts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay canchas registradas
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6"
      >
        <h3 className="font-semibold text-indigo-900 mb-3">Información</h3>
        <ul className="text-sm text-indigo-700 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">&#x2022;</span>
            Los cambios en horarios aplican a la generación de slots para <strong>nuevas reservas</strong>. Las reservas existentes no se ven afectadas.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">&#x2022;</span>
            Los precios se muestran a los clientes al momento de reservar. El cobro se realiza en el lugar.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">&#x2022;</span>
            La anticipación mínima para cancelar determina cuántas horas antes del turno el cliente puede cancelar online. Si se pone en 0, los clientes pueden cancelar en cualquier momento.
          </li>
        </ul>
      </motion.div>
    </div>
  )
}

export default ConfigurationView
