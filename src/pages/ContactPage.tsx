import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Send, Building2, Users, Globe, Loader2, Check } from 'lucide-react'

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', employees: '', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    // For now, just simulate — in production this would POST to backend
    await new Promise(r => setTimeout(r, 1000))
    setSent(true)
    setSending(false)
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">SARA</h1>
          </Link>
          <Link to="/signup" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
            Prueba gratis
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left: Info */}
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Plan Enterprise
            </h2>
            <p className="text-lg text-gray-600 mb-10 leading-relaxed">
              Para inmobiliarias con necesidades avanzadas. Obten acceso a todas las funciones,
              sin limites, con soporte dedicado y personalizacion completa.
            </p>

            <div className="space-y-6">
              {[
                { icon: Building2, title: 'Multi-linea WhatsApp', desc: 'Conecta multiples numeros de WhatsApp para diferentes equipos o desarrollos.' },
                { icon: Globe, title: 'API dedicada', desc: 'Acceso completo a la API REST para integrar con tus sistemas existentes (ERP, BI, etc.).' },
                { icon: Users, title: 'Soporte prioritario', desc: 'Equipo de soporte dedicado, onboarding personalizado y SLA garantizado.' },
              ].map(item => (
                <div key={item.title} className="flex gap-4">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon size={20} className="text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
                    <p className="text-gray-500 text-sm mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-6 bg-gray-50 rounded-xl border">
              <h4 className="font-semibold text-gray-900 mb-3">Incluye todo en Pro, mas:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                {['Leads ilimitados', 'Equipo ilimitado', 'Mensajes ilimitados', 'White-label (tu marca)',
                  'Custom domain', 'Llamadas IA ilimitadas', 'API access completo', 'Soporte prioritario 24/7',
                  'Onboarding personalizado', 'SLA 99.9%'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <Check size={14} className="text-green-500" />{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Form */}
          <div>
            {sent ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="text-green-600" size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Mensaje enviado</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Nuestro equipo de ventas te contactara en menos de 24 horas.
                </p>
                <Link to="/" className="text-green-600 hover:text-green-700 font-medium text-sm">
                  Volver al inicio
                </Link>
              </div>
            ) : (
              <div className="bg-white border rounded-2xl p-8 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Contactar ventas</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input type="text" value={form.name} onChange={set('name')} required
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Tu nombre" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" value={form.email} onChange={set('email')} required
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="tu@empresa.com" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                    <input type="text" value={form.company} onChange={set('company')} required
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Nombre de tu inmobiliaria" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tamano del equipo</label>
                    <select value={form.employees} onChange={set('employees')} required
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="">Selecciona</option>
                      <option value="1-10">1-10 personas</option>
                      <option value="11-50">11-50 personas</option>
                      <option value="51-200">51-200 personas</option>
                      <option value="200+">200+ personas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje (opcional)</label>
                    <textarea value={form.message} onChange={set('message')} rows={4}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Cuentanos sobre tu negocio y necesidades..." />
                  </div>

                  <button type="submit" disabled={sending}
                    className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2">
                    {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                    {sending ? 'Enviando...' : 'Enviar mensaje'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="border-t py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} SARA CRM
        </div>
      </footer>
    </div>
  )
}
