import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  CreditCard, ArrowUpCircle, BarChart3, Clock, Check, AlertTriangle,
  ExternalLink, Bot, ArrowLeft, Loader2, Receipt
} from 'lucide-react'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/authStore'

interface UsageSummary {
  messages: { used: number; limit: number; percentage: number }
  leads: { used: number; limit: number; percentage: number }
  team_members: { used: number; limit: number; percentage: number }
}

interface BillingEvent {
  id: string
  event_type: string
  amount?: number
  currency?: string
  status?: string
  created_at: string
  description?: string
}

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

export function BillingPage() {
  const navigate = useNavigate()
  const tenant = useAuthStore(s => s.tenant)
  const [usage, setUsage] = useState<UsageSummary | null>(null)
  const [history, setHistory] = useState<BillingEvent[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/api/usage/summary').catch(() => ({ data: null })),
      api.get('/api/billing/history').catch(() => ({ data: [] })),
      api.getPlans().catch(() => ({ data: [] })),
    ]).then(([usageRes, historyRes, plansRes]) => {
      setUsage(usageRes.data)
      setHistory(historyRes.data || [])
      setPlans(plansRes.data || [])
    }).finally(() => setLoading(false))
  }, [])

  async function handleUpgrade(priceId: string, planId: string) {
    setUpgrading(planId)
    try {
      const res = await api.post('/api/billing/checkout', {
        price_id: priceId,
        success_url: `${window.location.origin}/billing?success=1`,
        cancel_url: `${window.location.origin}/billing?cancel=1`,
      })
      if (res.data?.url) {
        window.location.href = res.data.url
      }
    } catch (err: any) {
      alert(err.message || 'Error creando sesion de pago')
    } finally {
      setUpgrading(null)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const res = await api.post('/api/billing/portal')
      if (res.data?.url) {
        window.location.href = res.data.url
      }
    } catch (err: any) {
      alert(err.message || 'Error abriendo portal de pagos')
    } finally {
      setPortalLoading(false)
    }
  }

  const currentPlan = plans.find(p => p.id === tenant?.plan) || null
  const isFreePlan = !tenant?.plan || tenant.plan === 'free'
  const trialEnds = tenant?.trial_ends_at ? new Date(tenant.trial_ends_at) : null
  const trialActive = trialEnds && trialEnds > new Date()
  const daysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / 86400000)) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-green-500" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Bot size={14} className="text-white" />
              </div>
              <span className="font-bold text-gray-900">SARA</span>
            </div>
          </div>
          <h2 className="text-sm font-medium text-gray-600">Facturacion y planes</h2>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Trial banner */}
        {isFreePlan && trialActive && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <Clock className="text-amber-500 flex-shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                Tu periodo de prueba termina en {daysLeft} dia{daysLeft !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">Elige un plan para no perder acceso a las funciones Pro.</p>
            </div>
            <a href="#plans" className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors flex-shrink-0">
              Elegir plan
            </a>
          </div>
        )}

        {/* Success/cancel banners */}
        {new URLSearchParams(window.location.search).get('success') === '1' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <Check className="text-green-500" size={20} />
            <p className="text-sm text-green-800 font-medium">Pago exitoso. Tu plan se ha actualizado.</p>
          </div>
        )}

        {/* Current Plan + Usage */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Current Plan */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="text-green-600" size={22} />
              <h3 className="text-lg font-semibold text-gray-900">Plan actual</h3>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-bold text-gray-900">{currentPlan?.name || 'Free'}</span>
              {!isFreePlan && (
                <span className="text-sm text-gray-500">
                  ${(currentPlan?.price_mxn || 0).toLocaleString()} MXN/mes
                </span>
              )}
            </div>
            {isFreePlan && (
              <p className="text-sm text-gray-500 mb-4">Plan gratuito con funciones basicas</p>
            )}
            {!isFreePlan && (
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="mt-4 inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium"
              >
                {portalLoading ? <Loader2 className="animate-spin" size={14} /> : <ExternalLink size={14} />}
                Gestionar suscripcion
              </button>
            )}
          </div>

          {/* Usage */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="text-green-600" size={22} />
              <h3 className="text-lg font-semibold text-gray-900">Uso este mes</h3>
            </div>
            {usage ? (
              <div className="space-y-4">
                {[
                  { label: 'Mensajes', data: usage.messages },
                  { label: 'Leads', data: usage.leads },
                  { label: 'Equipo', data: usage.team_members },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="text-gray-900 font-medium">
                        {item.data.limit === -1
                          ? `${item.data.used.toLocaleString()} (ilimitado)`
                          : `${item.data.used.toLocaleString()} / ${item.data.limit.toLocaleString()}`
                        }
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.data.percentage > 90 ? 'bg-red-500' :
                          item.data.percentage > 70 ? 'bg-amber-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, item.data.percentage || 0)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No hay datos de uso disponibles</p>
            )}
          </div>
        </div>

        {/* Plans */}
        <div id="plans">
          <div className="flex items-center gap-3 mb-6">
            <ArrowUpCircle className="text-green-600" size={22} />
            <h3 className="text-lg font-semibold text-gray-900">
              {isFreePlan ? 'Elige un plan' : 'Cambiar plan'}
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map(plan => {
              const isCurrent = plan.id === tenant?.plan
              const canUpgrade = plan.stripe_price_id && !isCurrent
              return (
                <div key={plan.id} className={`rounded-xl border p-6 bg-white ${
                  isCurrent ? 'border-green-500 ring-2 ring-green-100' :
                  plan.id === 'pro' ? 'border-green-200' : 'border-gray-200'
                }`}>
                  {isCurrent && (
                    <span className="inline-block text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full mb-3">
                      Plan actual
                    </span>
                  )}
                  <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                  <div className="mt-2 mb-4">
                    {!plan.price_mxn || plan.price_mxn === 0 ? (
                      <span className="text-2xl font-bold text-gray-900">$0</span>
                    ) : plan.price_mxn === null || plan.price_mxn < 0 ? (
                      <span className="text-2xl font-bold text-gray-900">Custom</span>
                    ) : (
                      <>
                        <span className="text-2xl font-bold text-gray-900">${plan.price_mxn.toLocaleString()}</span>
                        <span className="text-gray-500 text-xs">/mes</span>
                      </>
                    )}
                  </div>
                  <ul className="space-y-2 mb-6 text-xs text-gray-600">
                    <li className="flex items-center gap-1.5">
                      <Check size={12} className="text-green-500" />
                      {plan.max_leads === -1 ? 'Leads ilimitados' : `${plan.max_leads} leads`}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check size={12} className="text-green-500" />
                      {plan.max_team_members === -1 ? 'Equipo ilimitado' : `${plan.max_team_members} miembros`}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check size={12} className="text-green-500" />
                      {plan.max_messages_per_day === -1 ? 'Msgs ilimitados' : `${plan.max_messages_per_day} msgs/dia`}
                    </li>
                  </ul>
                  {isCurrent ? (
                    <button disabled className="w-full py-2 text-sm text-gray-400 border border-gray-200 rounded-lg">
                      Plan actual
                    </button>
                  ) : canUpgrade ? (
                    <button
                      onClick={() => handleUpgrade(plan.stripe_price_id!, plan.id)}
                      disabled={upgrading === plan.id}
                      className="w-full py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {upgrading === plan.id ? <Loader2 className="animate-spin" size={14} /> : null}
                      {upgrading === plan.id ? 'Procesando...' : 'Upgrade'}
                    </button>
                  ) : plan.id === 'enterprise' ? (
                    <button className="w-full py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                      Contactar ventas
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        {/* Billing History */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Receipt className="text-green-600" size={22} />
            <h3 className="text-lg font-semibold text-gray-900">Historial de pagos</h3>
          </div>
          {history.length > 0 ? (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Evento</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Monto</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(event => (
                    <tr key={event.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(event.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {event.event_type === 'payment_received' ? 'Pago recibido' :
                         event.event_type === 'subscription_created' ? 'Suscripcion creada' :
                         event.event_type === 'subscription_cancelled' ? 'Suscripcion cancelada' :
                         event.event_type === 'payment_failed' ? 'Pago fallido' :
                         event.event_type}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                        {event.amount ? `$${(event.amount / 100).toLocaleString()} ${event.currency?.toUpperCase() || 'MXN'}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                          event.status === 'succeeded' || event.status === 'paid' ? 'bg-green-50 text-green-700' :
                          event.status === 'failed' ? 'bg-red-50 text-red-700' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {event.status === 'succeeded' || event.status === 'paid' ? 'Pagado' :
                           event.status === 'failed' ? 'Fallido' :
                           event.status || 'Procesado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-xl border p-8 text-center">
              <Receipt className="mx-auto text-gray-300 mb-3" size={32} />
              <p className="text-gray-500 text-sm">No hay historial de pagos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
