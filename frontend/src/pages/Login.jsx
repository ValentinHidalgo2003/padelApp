import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { LogIn, Sparkles, User, Lock } from 'lucide-react'
import { motion } from 'framer-motion'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error } = useAuthStore()
  const navigate = useNavigate()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = await login(username, password)
    if (success) {
      navigate('/admin')
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"
        />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full relative z-10"
      >
        <motion.div 
          className="glass rounded-3xl shadow-2xl p-8 backdrop-blur-xl border border-white/30"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="text-center mb-8"
          >
            <div className="flex justify-center mb-4">
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/50"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">PadelApp</h1>
            <p className="text-indigo-100">Sistema de Gestión de Turnos</p>
          </motion.div>
          
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-white mb-2">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/90 border border-white/50 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent backdrop-blur-sm transition-all font-medium shadow-lg"
                  placeholder="Ingrese su usuario"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-indigo-600" />
                </div>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/90 border border-white/50 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent backdrop-blur-sm transition-all font-medium shadow-lg"
                  placeholder="Ingrese su contraseña"
                  required
                />
              </div>
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-300/50 text-white px-4 py-3 rounded-xl text-sm backdrop-blur-sm"
              >
                {error}
              </motion.div>
            )}
            
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white text-indigo-600 py-3 px-4 rounded-xl font-semibold hover:shadow-2xl hover:shadow-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Iniciar Sesión
                </>
              )}
            </motion.button>
          </motion.form>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 text-center text-sm text-indigo-100"
          >
            <p>¿Olvidaste tu contraseña? Contacta al administrador.</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Login
