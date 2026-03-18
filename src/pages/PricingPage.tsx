import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, Bot, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '../lib/api'

interface Plan {
  id: string
  name: string
  price_mxn: number
  max_leads: number
  max_team_members: number
  max_messages_per_day: number
  features: string[]
  stripe_price_id?: string
}

const COMPARISON_FEATURES = [
  { name: 'Leads', key: 'leads' },
  { name: 'Miembros de equipo', key: 'team' },
  { name: 'Mensajes WhatsApp / dia', key: 'messages' },
  { name: 'IA Conversacional (Claude)', key: 'ai', free: false, starter: true, pro: true, enterprise: true },
  { name: 'Carruseles WhatsApp', key: 'carousels', free: true, starter: true, pro: true, enterprise: true },
  { name: 'Scoring de leads', key: 'scoring', free: 'Basico', starter: true, pro: true, enterprise: true },
  { name: 'Pipeline Kanban', key: 'kanban', free: true, starter: true, pro: true, enterprise: true },
  { name: 'Reportes y analytics', key: 'reports', free: false, starter: true, pro: true, enterprise: true },
  { name: 'Llamadas IA (Retell)', key: 'retell', free: false, starter: false, pro: true, enterprise: true },
  { name: 'Google Calendar sync', key: 'calendar', free: false, starter: true, pro: true, enterprise: true },
  { name: 'Cadencia inteligente', key: 'cadence', free: false, starter: false, pro: true, enterprise: true },
  { name: 'Videos personalizados', key: 'videos', free: false, starter: false, pro: true, enterprise: true },
  { name: 'Credito hipotecario', key: 'mortgage', free: false, starter: true, pro: true, enterprise: true },
  { name: 'Multi-linea WhatsApp', key: 'multiline', free: false, starter: false, pro: false, enterprise: true },
  { name: 'API dedicada', key: 'api', free: false, starter: false, pro: false, enterprise: true },
  { name: 'Soporte prioritario', key: 'support', free: false, starter: false, pro: false, enterprise: true },
  { name: 'White-label', key: 'whitelabel', free: false, starter: false, pro: false, enterprise: true },
  { name: 'SLA monitoring', key: 'sla', free: false, starter: true, pro: true, enterprise: true },
  { name: 'Audit trail', key: 'audit', free: false, starter: true, pro: true, enterprise: true },
  { name: 'Desarrollos ilimitados', key: 'devs', free: false, starter: false, pro: true, enterprise: true },
]

const FAQ = [
  { q: 'Puedo cambiar de plan en cualquier momento?', a: 'Si. Puedes upgrade o downgrade cuando quieras desde tu panel de billing. Los cambios se aplican inmediatamente y se proratea el cobro.' },
  { q: 'Que metodos de pago aceptan?', a: 'Aceptamos tarjetas de credito y debito (Visa, Mastercard, Amex) via Stripe. Para Enterprise, tambien ofrecemos transferencia bancaria.' },
  { q: 'Hay descuento por pago anual?', a: 'Si, ofrecemos 2 meses gratis en planes anuales. Contactanos para mas detalles.' },
  { q: 'Que pasa si excedo los limites de mi plan?', a: 'Te notificamos cuando estes al 80% de tu limite. Si llegas al 100%, los mensajes automaticos se pausan pero tu equipo puede seguir respondiendo manualmente.' },
  { q: 'Ofrecen reembolsos?', a: 'Si, ofrecemos reembolso completo dentro de los primeros 30 dias si no estas satisfecho.' },
]

export function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    api.getPlans()
      .then(res => setPlans(res.data || []))
      .catch(() => {})
  }, [])

  const getPrice = (plan: Plan) => {
    if (!plan.price_mxn || plan.price_mxn === 0) return { display: '$0', suffix: '/mes' }
    if (plan.price_mxn === null || plan.price_mxn < 0) return { display: 'Custom', suffix: '' }
    const price = annual ? Math.round(plan.price_mxn * 10 / 12) : plan.price_mxn
    return { display: `$${price.toLocaleString()}`, suffix: '/mes MXN' }
  }

  const getPlanLimit = (plan: Plan, key: string) => {
    if (key === 'leads') return plan.max_leads === -1 ? 'Ilimitados' : plan.max_leads.toLocaleString()
    if (key === 'team') return plan.max_team_members === -1 ? 'Ilimitado' : plan.max_team_members.toString()
    if (key === 'messages') return plan.max_messages_per_day === -1 ? 'Ilimitados' : plan.max_messages_per_day.toLocaleString()
    return null
  }

  const renderCell = (value: boolean | string | undefined) => {
    if (value === true) return <Check size={18} className="text-green-500 mx-auto" />
    if (value === false || value === undefined) return <X size={18} className="text-gray-300 mx-auto" />
    return <span className="text-sm text-gray-600">{value}</span>
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">SARA</h1>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Iniciar sesion
            </Link>
            <Link to="/signup" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
              Prueba gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-20 pb-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Precios transparentes
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Empieza gratis. Escala cuando crezcas. Sin sorpresas.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!annual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Mensual
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${annual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Anual <span className="text-green-600 font-semibold">-17%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Plan Cards */}
      <section className="px-4 sm:px-6 pb-24">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map(plan => {
            const price = getPrice(plan)
            return (
              <div key={plan.id} className={`rounded-2xl border p-8 bg-white transition-all hover:shadow-lg ${
                plan.id === 'pro' ? 'border-green-500 ring-2 ring-green-100 relative scale-[1.02]' : 'border-gray-200'
              }`}>
                {plan.id === 'pro' && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Mas popular
                  </span>
                )}
                <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                <div className="mt-4 mb-2">
                  <span className="text-4xl font-bold text-gray-900">{price.display}</span>
                  {price.suffix && <span className="text-gray-500 text-sm">{price.suffix}</span>}
                </div>
                {annual && plan.price_mxn > 0 && (
                  <p className="text-xs text-green-600 mb-4">Ahorras ${(plan.price_mxn * 2).toLocaleString()} MXN/año</p>
                )}
                <ul className="space-y-3 mb-8 mt-6">
                  <li className="text-sm text-gray-600 flex items-start gap-2">
                    <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    {plan.max_leads === -1 ? 'Leads ilimitados' : `Hasta ${plan.max_leads.toLocaleString()} leads`}
                  </li>
                  <li className="text-sm text-gray-600 flex items-start gap-2">
                    <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    {plan.max_team_members === -1 ? 'Equipo ilimitado' : `${plan.max_team_members} miembros`}
                  </li>
                  <li className="text-sm text-gray-600 flex items-start gap-2">
                    <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    {plan.max_messages_per_day === -1 ? 'Mensajes ilimitados' : `${plan.max_messages_per_day.toLocaleString()} msgs/dia`}
                  </li>
                  {(plan.features || []).map(f => (
                    <li key={f} className="text-sm text-gray-600 flex items-start gap-2">
                      <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={plan.id === 'enterprise' ? '/contact' : '/signup'}
                  className={`block text-center py-3 rounded-xl font-medium text-sm transition-all ${
                    plan.id === 'pro'
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}>
                  {plan.price_mxn === null || (plan.price_mxn && plan.price_mxn < 0) ? 'Contactar ventas' : 'Comenzar gratis'}
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Comparacion detallada de planes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-500 w-1/3">Funcion</th>
                  {plans.map(p => (
                    <th key={p.id} className={`text-center py-4 px-4 text-sm font-semibold ${p.id === 'pro' ? 'text-green-700' : 'text-gray-900'}`}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map(feat => (
                  <tr key={feat.key} className="border-b border-gray-100 hover:bg-white transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-700">{feat.name}</td>
                    {plans.map(p => {
                      const limit = getPlanLimit(p, feat.key)
                      if (limit) {
                        return <td key={p.id} className="text-center py-3 px-4 text-sm text-gray-600">{limit}</td>
                      }
                      const val = feat[p.id as keyof typeof feat]
                      return <td key={p.id} className="text-center py-3 px-4">{renderCell(val as boolean | string)}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Preguntas sobre precios
          </h3>
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 pr-4">{item.q}</span>
                  {openFaq === i ? <ChevronUp size={20} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 bg-gray-950">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Listo para vender mas?
          </h3>
          <p className="text-lg text-gray-400 mb-10">
            14 dias gratis con todas las funciones Pro. Sin tarjeta.
          </p>
          <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-all text-lg">
            Comenzar ahora <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} SARA CRM</p>
          <div className="flex gap-6 mt-4 sm:mt-0">
            <Link to="/" className="hover:text-gray-700">Inicio</Link>
            <Link to="/login" className="hover:text-gray-700">Login</Link>
            <Link to="/signup" className="hover:text-gray-700">Signup</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
