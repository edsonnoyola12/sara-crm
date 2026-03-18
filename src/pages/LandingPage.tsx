import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageSquare, Users, BarChart3, Phone, Bot, Calendar, Check, ArrowRight,
  Shield, Zap, Globe, Clock, TrendingUp, Star, ChevronDown, ChevronUp,
  Building2, Target, Bell, Workflow
} from 'lucide-react'
import { api } from '../lib/api'

interface Plan {
  id: string
  name: string
  price_mxn: number
  max_leads: number
  max_team_members: number
  max_messages_per_day: number
  features: string[]
}

const FEATURES = [
  { icon: Bot, title: 'IA Conversacional 24/7', desc: 'SARA responde leads por WhatsApp con inteligencia artificial, califica prospectos y agenda citas sin intervencion humana.' },
  { icon: MessageSquare, title: 'WhatsApp Business API', desc: 'Templates, carruseles, seguimientos automaticos, ventana 24h inteligente y rate limiting por lead.' },
  { icon: Users, title: 'CRM Inmobiliario', desc: 'Pipeline Kanban, scoring de leads con 15 factores, asignacion round-robin, custom fields y audit trail.' },
  { icon: Phone, title: 'Llamadas IA (Retell)', desc: 'Llamadas automaticas a leads que no responden, con cadencia inteligente multi-paso y retry automatico.' },
  { icon: Calendar, title: 'Agenda Inteligente', desc: 'Google Calendar sync, recordatorios 24h y 2h, post-visita automatizado con feedback del vendedor.' },
  { icon: BarChart3, title: 'Analytics & Forecasting', desc: 'Dashboards en tiempo real, forecast de ventas, buyer readiness, churn prediction y reportes CEO.' },
]

const FEATURES_EXTENDED = [
  { icon: Shield, title: 'Seguridad Enterprise', desc: 'JWT auth, 2FA, RLS por tenant, rate limiting, audit trail completo.' },
  { icon: Zap, title: 'Automatizaciones', desc: '40+ CRONs: briefings, follow-ups, encuestas NPS, alertas SLA, promociones.' },
  { icon: Globe, title: 'Multi-idioma', desc: 'Deteccion automatica ES/EN. Tu bot habla el idioma de tu cliente.' },
  { icon: Building2, title: 'Multi-desarrollo', desc: 'Maneja todos tus proyectos con precios dinamicos, brochures y GPS.' },
  { icon: Target, title: 'Scoring Inteligente', desc: '15 factores de scoring, buyer readiness 0-100, churn prediction automatico.' },
  { icon: Bell, title: 'Alertas en Tiempo Real', desc: 'Notificaciones al equipo cuando un lead responde, SLA monitoring, delivery verification.' },
  { icon: Workflow, title: 'Credito Hipotecario', desc: 'Flujo completo: simulacion, asignacion de asesor por banco, seguimiento automatico.' },
  { icon: TrendingUp, title: 'Pipeline Forecasting', desc: 'Proyeccion de ingresos por etapa, confianza por deal, breakdown por vendedor.' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Conecta WhatsApp', desc: 'Vincula tu WhatsApp Business API en 2 minutos. SARA empieza a recibir mensajes.', color: 'from-green-500 to-emerald-600' },
  { step: '02', title: 'Configura desarrollos', desc: 'Agrega tus proyectos, precios, brochures y ubicaciones. SARA aprende tu inventario.', color: 'from-emerald-600 to-teal-600' },
  { step: '03', title: 'Invita a tu equipo', desc: 'Vendedores, asesores y coordinadores. Cada uno con su rol y permisos.', color: 'from-teal-600 to-cyan-600' },
  { step: '04', title: 'SARA vende por ti', desc: 'Responde leads, agenda citas, califica prospectos y hace seguimiento 24/7.', color: 'from-cyan-600 to-blue-600' },
]

const STATS = [
  { value: '24/7', label: 'Disponibilidad' },
  { value: '<3s', label: 'Tiempo de respuesta' },
  { value: '40+', label: 'Automatizaciones' },
  { value: '342', label: 'Comandos WhatsApp' },
]

const TESTIMONIALS = [
  { name: 'Oscar R.', role: 'CEO, Grupo Santa Rita', text: 'SARA transformo nuestro proceso de ventas. Respondemos leads en segundos, no en horas. Las citas se agendan solas.', rating: 5 },
  { name: 'Maria G.', role: 'Directora Comercial', text: 'El scoring de leads nos permite enfocarnos en los prospectos calientes. Nuestro cierre subio 40% en 3 meses.', rating: 5 },
  { name: 'Carlos M.', role: 'Vendedor Senior', text: 'Los briefings diarios y las alertas me mantienen al dia. Nunca pierdo un follow-up importante.', rating: 5 },
]

const FAQ = [
  { q: 'Necesito conocimientos tecnicos para usar SARA?', a: 'No. El onboarding guiado te conecta en minutos. Solo necesitas una cuenta de WhatsApp Business API (Meta) y tu equipo puede empezar a vender el mismo dia.' },
  { q: 'Funciona con cualquier tipo de inmobiliaria?', a: 'Si. SARA se adapta a desarrollos residenciales, terrenos, comercial y mas. Configuras tus propiedades, precios y el bot aprende tu inventario.' },
  { q: 'Puedo conectar mi calendario existente?', a: 'Si. SARA se sincroniza con Google Calendar. Las citas se crean automaticamente con recordatorios al lead y al vendedor.' },
  { q: 'Que pasa cuando termina mi periodo de prueba?', a: 'Tienes 14 dias gratis con todas las funciones. Al terminar, puedes elegir un plan pagado o quedarte en el plan gratuito con limites.' },
  { q: 'Mis datos estan seguros?', a: 'Si. Usamos Cloudflare Workers (edge computing), Supabase con Row Level Security, JWT auth, y encriptacion en transito. Cada tenant esta aislado.' },
  { q: 'Puedo exportar mis datos?', a: 'Si. Exporta leads, conversaciones, reportes y mas en CSV. Tus datos son tuyos, siempre.' },
]

export function LandingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    api.getPlans()
      .then(res => setPlans(res.data || []))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">SARA</h1>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Funciones</a>
            <a href="#how" className="hover:text-gray-900 transition-colors">Como funciona</a>
            <a href="#precios" className="hover:text-gray-900 transition-colors">Precios</a>
            <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              Iniciar sesion
            </Link>
            <Link to="/signup" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
              Prueba gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-green-50/50 to-white" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-sm text-green-700 mb-6">
              <Zap size={14} />
              <span>IA que vende inmuebles por WhatsApp</span>
            </div>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight">
              Tu equipo de ventas
              <br />
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                nunca duerme
              </span>
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              SARA responde leads por WhatsApp 24/7, agenda citas, califica prospectos,
              hace llamadas con IA y genera reportes. Tu equipo cierra mas ventas.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="px-8 py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all hover:shadow-lg inline-flex items-center justify-center gap-2 text-lg">
                Comenzar gratis <ArrowRight size={20} />
              </Link>
              <a href="#how" className="px-8 py-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all inline-flex items-center justify-center text-lg">
                Ver como funciona
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-400">14 dias gratis. Sin tarjeta de credito. Setup en 5 minutos.</p>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900">{s.value}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="border-y bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm text-gray-500 mb-6">Usado por inmobiliarias líderes en Latinoamérica</p>
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-16 opacity-60">
            <span className="text-lg font-bold text-gray-400">Grupo Santa Rita</span>
            <span className="text-lg font-bold text-gray-400">Inmobiliaria Andes</span>
            <span className="text-lg font-bold text-gray-400">Citadella</span>
            <span className="text-lg font-bold text-gray-400">Distrito Falco</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Todo lo que tu inmobiliaria necesita
            </h3>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              De lead a cierre, SARA automatiza cada paso del proceso de ventas inmobiliarias.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map(f => (
              <div key={f.title} className="group bg-white rounded-2xl p-8 border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-green-100 transition-colors">
                  <f.icon className="text-green-600" size={24} />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">{f.title}</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-4 sm:px-6 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-white">
              Activa SARA en 4 pasos
            </h3>
            <p className="mt-4 text-lg text-gray-400">
              De cero a vendiendo en menos de una hora.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(s => (
              <div key={s.step} className="relative">
                <div className={`bg-gradient-to-br ${s.color} text-white rounded-2xl p-8 h-full`}>
                  <div className="text-5xl font-bold opacity-30 mb-4">{s.step}</div>
                  <h4 className="text-lg font-semibold mb-2">{s.title}</h4>
                  <p className="text-sm opacity-90 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Extended features */}
      <section className="py-24 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Funciones que marcan la diferencia
            </h3>
            <p className="mt-4 text-lg text-gray-500">
              No es solo un chatbot. Es un sistema completo de ventas inmobiliarias.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES_EXTENDED.map(f => (
              <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-100">
                <f.icon className="text-green-600 mb-3" size={22} />
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">{f.title}</h4>
                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Lo que dicen nuestros clientes
            </h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-gray-500 text-xs">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-24 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900">Precios simples, sin sorpresas</h3>
            <p className="mt-4 text-lg text-gray-500">Planes que crecen con tu negocio. Cambia o cancela cuando quieras.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map(plan => (
              <div key={plan.id} className={`rounded-2xl border p-8 bg-white transition-shadow hover:shadow-lg ${
                plan.id === 'pro' ? 'border-green-500 ring-2 ring-green-100 relative scale-[1.02]' : 'border-gray-200'
              }`}>
                {plan.id === 'pro' && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Mas popular
                  </span>
                )}
                <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                <div className="mt-4 mb-6">
                  {!plan.price_mxn || plan.price_mxn === 0 ? (
                    <div>
                      <span className="text-4xl font-bold text-gray-900">$0</span>
                      <span className="text-gray-500 text-sm">/mes</span>
                    </div>
                  ) : plan.price_mxn === null || plan.price_mxn < 0 ? (
                    <span className="text-3xl font-bold text-gray-900">Contacto</span>
                  ) : (
                    <div>
                      <span className="text-4xl font-bold text-gray-900">${(plan.price_mxn || 0).toLocaleString()}</span>
                      <span className="text-gray-500 text-sm">/mes MXN</span>
                    </div>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
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
                <Link to={plan.id === 'enterprise' ? '#contact' : '/signup'}
                  className={`block text-center py-3 rounded-xl font-medium text-sm transition-all ${
                    plan.id === 'pro'
                      ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}>
                  {plan.price_mxn === null || (plan.price_mxn && plan.price_mxn < 0) ? 'Contactar ventas' : 'Comenzar gratis'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-16">
            Preguntas frecuentes
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
                  <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">
                    {item.a}
                  </div>
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
            Empieza a vender mas hoy
          </h3>
          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
            14 dias gratis con todas las funciones. Sin tarjeta. Setup en minutos.
          </p>
          <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-all text-lg">
            Crear cuenta gratis <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Bot size={14} className="text-white" />
                </div>
                <span className="font-bold text-gray-900">SARA</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Sistema Automatizado de Respuesta y Asistencia para ventas inmobiliarias.
              </p>
            </div>
            <div>
              <h5 className="font-semibold text-gray-900 text-sm mb-3">Producto</h5>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#features" className="hover:text-gray-700">Funciones</a></li>
                <li><Link to="/pricing" className="hover:text-gray-700">Precios</Link></li>
                <li><a href="#how" className="hover:text-gray-700">Como funciona</a></li>
                <li><a href="#faq" className="hover:text-gray-700">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-gray-900 text-sm mb-3">Cuenta</h5>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to="/login" className="hover:text-gray-700">Iniciar sesion</Link></li>
                <li><Link to="/signup" className="hover:text-gray-700">Crear cuenta</Link></li>
                <li><Link to="/docs" className="hover:text-gray-700">API Docs</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-gray-900 text-sm mb-3">Legal</h5>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to="/privacy" className="hover:text-gray-700">Privacidad</Link></li>
                <li><Link to="/terms" className="hover:text-gray-700">Terminos</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} SARA CRM. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
