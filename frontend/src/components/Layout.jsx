import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useNotificationsStore } from '../store/notificationsStore'
import { Calendar, DollarSign, History, MapPin, Package, LogOut, Menu, X, Sparkles, Settings, Bell } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const {
    notifications, unreadCount,
    fetchNotifications, markAsRead, markAllAsRead,
    startPolling, stopPolling,
  } = useNotificationsStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const notifRef = useRef(null)

  useEffect(() => {
    startPolling()
    return () => stopPolling()
  }, [startPolling, stopPolling])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpenNotifications = () => {
    if (!showNotifications) {
      fetchNotifications()
    }
    setShowNotifications(!showNotifications)
  }
  
  const handleLogout = () => {
    stopPolling()
    logout()
    navigate('/admin/login')
  }
  
  const navItems = [
    { path: '/admin', label: 'Calendario', icon: Calendar },
    { path: '/admin/summary', label: 'Caja Diaria', icon: DollarSign },
    { path: '/admin/history', label: 'Historial', icon: History },
  ]
  
  const adminItems = user?.role === 'admin' ? [
    { path: '/admin/courts', label: 'Canchas', icon: MapPin },
    { path: '/admin/products', label: 'Productos', icon: Package },
    { path: '/admin/configuration', label: 'Config', icon: Settings },
  ] : []
  
  const allItems = [...navItems, ...adminItems]
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass sticky top-0 z-50 shadow-lg border-b border-white/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                PadelApp
              </h1>
            </motion.div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-2">
              {allItems.map((item, index) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={item.path}
                      className="relative group"
                    >
                      <motion.div
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                            : 'text-gray-700 hover:bg-white/60 hover:shadow-md'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {item.label}
                      </motion.div>
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl -z-10"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </Link>
                  </motion.div>
                )
              })}
            </nav>
            
            {/* User Menu */}
            <div className="flex items-center space-x-3">
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpenNotifications}
                  className="relative p-2 rounded-xl text-gray-700 bg-white/60 hover:bg-white shadow-sm transition-all"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </motion.button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] max-w-[90vw] bg-white rounded-xl shadow-2xl border border-gray-200 z-[60] overflow-hidden"
                    >
                      <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-50">
                        <h3 className="font-semibold text-gray-800 text-sm">Notificaciones</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Marcar todas como leídas
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-gray-400 text-sm">
                            No hay notificaciones
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => { if (!notif.is_read) markAsRead(notif.id) }}
                              className={`px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                                !notif.is_read ? 'bg-indigo-50/60' : ''
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                  !notif.is_read ? 'bg-indigo-500' : 'bg-transparent'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                    {notif.title}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                                    {notif.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(notif.created_at).toLocaleString('es-AR', {
                                      day: '2-digit', month: '2-digit',
                                      hour: '2-digit', minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-white/60 backdrop-blur-sm shadow-sm"
              >
                <div className="text-sm text-right">
                  <p className="font-semibold text-gray-900">{user?.username}</p>
                  <p className="text-xs text-gray-500">
                    {user?.role === 'admin' ? 'Administrador' : 'Recepción'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
              </motion.div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 rounded-xl shadow-lg shadow-rose-500/30 transition-all"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Salir</span>
              </motion.button>
              
              {/* Mobile menu button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-gray-700 bg-white/60 hover:bg-white shadow-sm"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-white/20 overflow-hidden"
            >
              <nav className="px-4 py-3 space-y-2 bg-white/40 backdrop-blur-sm">
                {allItems.map((item, index) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  return (
                    <motion.div
                      key={item.path}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <motion.div
                          whileTap={{ scale: 0.95 }}
                          className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                              : 'text-gray-700 hover:bg-white/80'
                          }`}
                        >
                          <Icon className="w-5 h-5 mr-3" />
                          {item.label}
                        </motion.div>
                      </Link>
                    </motion.div>
                  )
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
      
      {/* Main Content */}
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0"
      >
        <Outlet />
      </motion.main>
    </div>
  )
}

export default Layout
