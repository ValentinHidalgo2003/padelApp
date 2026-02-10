import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useProductsStore } from '../store/productsStore'
import { formatCurrency } from '../utils/formatters'

function ConsumptionModal({ isOpen, onClose, booking, products, onSuccess }) {
  const { createConsumption, loading, error, clearError } = useProductsStore()
  
  const [formData, setFormData] = useState({
    product: '',
    quantity: 1,
    unit_price: '',
  })
  
  const selectedProduct = products.find((p) => p.id === parseInt(formData.product))
  const calculatedPrice = selectedProduct ? selectedProduct.price : 0
  const totalPrice = (parseFloat(formData.unit_price) || calculatedPrice) * formData.quantity
  
  useEffect(() => {
    if (isOpen) {
      clearError()
    }
  }, [isOpen, clearError])
  
  useEffect(() => {
    if (selectedProduct) {
      setFormData((prev) => ({
        ...prev,
        unit_price: selectedProduct.price,
      }))
    }
  }, [selectedProduct])
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createConsumption({
        booking: booking.id,
        product: formData.product,
        quantity: formData.quantity,
        unit_price: formData.unit_price || calculatedPrice,
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
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-bold">Agregar Consumo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Producto *
            </label>
            <select
              name="product"
              value={formData.product}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Seleccionar producto</option>
              {products.filter((p) => p.is_active).map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - {formatCurrency(product.price)}
                  {product.stock !== null && ` (Stock: ${product.stock})`}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio Unitario
            </label>
            <input
              type="number"
              name="unit_price"
              value={formData.unit_price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={calculatedPrice.toString()}
            />
            <p className="text-xs text-gray-500 mt-1">
              Dejar en blanco para usar el precio del producto
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total:</span>
              <span className="text-xl font-bold text-primary-600">
                {formatCurrency(totalPrice)}
              </span>
            </div>
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
              {loading ? 'Agregando...' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ConsumptionModal
