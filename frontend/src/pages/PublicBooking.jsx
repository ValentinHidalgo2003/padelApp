import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Clock, MapPin, Phone, XCircle, Sparkles, ChevronRight } from 'lucide-react'

function PublicBooking() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="glass sticky top-0 z-50 shadow-lg border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                PadelApp
              </h1>
            </div>
            <Link
              to="/admin"
              className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
            >
              Panel Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
              Reservá tu cancha de{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                pádel
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              Elegí tu horario preferido, reservá online y llegá a jugar.
              Rápido, fácil y sin complicaciones.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/reservar">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-shadow"
                >
                  <Calendar className="w-5 h-5" />
                  Reservar Turno
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link to="/cancelar">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-gray-700 bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-lg border border-gray-200 transition-all"
                >
                  <XCircle className="w-5 h-5" />
                  Cancelar Reserva
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: 'Elegí tu horario',
                description: 'Consultá la disponibilidad en tiempo real y elegí el día y horario que más te convenga.',
                color: 'from-blue-500 to-cyan-500',
              },
              {
                icon: MapPin,
                title: 'Seleccioná tu cancha',
                description: 'Tenemos diferentes canchas disponibles. Elegí la que prefieras y reservá al instante.',
                color: 'from-indigo-500 to-purple-500',
              },
              {
                icon: Clock,
                title: 'Cancelación flexible',
                description: 'Si no podés asistir, cancelá con tu código de reserva. Sin complicaciones ni trámites.',
                color: 'from-purple-500 to-pink-500',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow border border-gray-100"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-12">Cómo funciona</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Elegí fecha', desc: 'Seleccioná el día que querés jugar' },
              { step: '2', title: 'Elegí cancha', desc: 'Mirá las opciones disponibles' },
              { step: '3', title: 'Elegí horario', desc: 'Seleccioná tu turno preferido' },
              { step: '4', title: 'Confirmá', desc: 'Ingresá tus datos y listo' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg mb-4 shadow-lg">
                  {item.step}
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/80 border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-700">PadelApp</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Phone className="w-4 h-4" />
              <span>Se paga en el lugar al momento de jugar</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicBooking
