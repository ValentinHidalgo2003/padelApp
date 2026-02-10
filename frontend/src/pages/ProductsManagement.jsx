import { useEffect, useState } from 'react'
import { useProductsStore } from '../store/productsStore'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { formatCurrency } from '../utils/formatters'

function ProductsManagement() {
  const { products, fetchProducts, deleteProduct, loading } = useProductsStore()
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  
  useEffect(() => {
    fetchProducts({ show_all: true })
  }, [fetchProducts])
  
  const handleCreate = () => {
    setEditingProduct(null)
    setShowModal(true)
  }
  
  const handleEdit = (product) => {
    setEditingProduct(product)
    setShowModal(true)
  }
  
  const handleDelete = async (product) => {
    if (!confirm(`¿Eliminar el producto "${product.name}"?`)) return
    try {
      await deleteProduct(product.id)
    } catch (error) {
      alert('Error al eliminar producto')
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Productos</h1>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
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
                Categoría
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {product.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.category_display}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(product.price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                  {product.stock !== null ? product.stock : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(product)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Edit2 className="w-4 h-4 inline" />
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      
      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            fetchProducts({ show_all: true })
          }}
        />
      )}
    </div>
  )
}

function ProductModal({ product, onClose, onSuccess }) {
  const { createProduct, updateProduct, loading, error, clearError } = useProductsStore()
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || 'beverage',
    price: product?.price || '',
    stock: product?.stock !== null ? product.stock : '',
    is_active: product?.is_active ?? true,
  })
  
  useEffect(() => {
    clearError()
  }, [clearError])
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        stock: formData.stock === '' ? null : formData.stock,
      }
      if (product) {
        await updateProduct(product.id, data)
      } else {
        await createProduct(data)
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
            {product ? 'Editar Producto' : 'Nuevo Producto'}
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
              Categoría *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="beverage">Bebida</option>
              <option value="snack">Snack</option>
              <option value="equipment">Equipamiento</option>
              <option value="other">Otro</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio *
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock
            </label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Dejar vacío para no controlar stock"
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
              Activo
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
              {loading ? 'Guardando...' : product ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductsManagement
