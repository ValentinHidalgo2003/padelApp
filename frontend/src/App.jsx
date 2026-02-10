import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import CalendarView from './pages/CalendarView'
import DailySummary from './pages/DailySummary'
import HistoryView from './pages/HistoryView'
import CourtsManagement from './pages/CourtsManagement'
import ProductsManagement from './pages/ProductsManagement'
import ConfigurationView from './pages/ConfigurationView'

// Public pages
import PublicBooking from './pages/PublicBooking'
import AvailabilityView from './pages/AvailabilityView'
import CancelBooking from './pages/CancelBooking'

// Protected Route Component
function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }
  
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/admin" replace />
  }
  
  return children
}

function App() {
  const { checkAuth } = useAuthStore()
  
  useEffect(() => {
    checkAuth()
  }, [checkAuth])
  
  return (
    <Routes>
      {/* Public Routes (sin autenticación) */}
      <Route path="/" element={<PublicBooking />} />
      <Route path="/reservar" element={<AvailabilityView />} />
      <Route path="/cancelar" element={<CancelBooking />} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" element={<Login />} />
      
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CalendarView />} />
        <Route path="summary" element={<DailySummary />} />
        <Route path="history" element={<HistoryView />} />
        <Route
          path="courts"
          element={
            <ProtectedRoute adminOnly>
              <CourtsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="products"
          element={
            <ProtectedRoute adminOnly>
              <ProductsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="configuration"
          element={
            <ProtectedRoute adminOnly>
              <ConfigurationView />
            </ProtectedRoute>
          }
        />
      </Route>
      
      {/* Legacy routes redirect */}
      <Route path="/login" element={<Navigate to="/admin/login" replace />} />
      <Route path="/summary" element={<Navigate to="/admin/summary" replace />} />
      <Route path="/history" element={<Navigate to="/admin/history" replace />} />
      <Route path="/courts" element={<Navigate to="/admin/courts" replace />} />
      <Route path="/products" element={<Navigate to="/admin/products" replace />} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
