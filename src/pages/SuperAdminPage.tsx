import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Bot, Building2, Users, BarChart3, Loader2, Search,
  Shield, TrendingUp, DollarSign, Clock, ChevronRight, Ban, CheckCircle2
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'https://sara-backend.edson-633.workers.dev'

interface Tenant {
  id: string
  name: string
  slug: string
  plan: string
  active: boolean
  timezone: string
  created_at: string
  trial_ends_at?: string
  stripe_customer_id?: string
  onboarding_step?: number
  onboarding_completed_at?: string
  leads_count: number
  team_count: number
  users_count: number
  trial_active: boolean
}

interface Analytics {
  total_tenants: number
  active_tenants: number
  total_leads: number
  total_team_members: number
  plan_distribution: Record<string, number>
  recent_signups_30d: number
  mrr_mxn: number
}

export function SuperAdminPage() {
  const navigate = useNavigate()
  const [apiKey, setApiKey] = useState(localStorage.getItem('sara_admin_key') || '')
  const [authenticated, setAuthenticated] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null)
  const [tenantDetail, setTenantDetail] = useState<any>(null)

  async function fetchData(key: string) {
    setLoading(true)
    try {
      const headers = { 'Authorization': `Bearer ${key}` }
      const [tenantsRes, analyticsRes] = await Promise.all([
        fetch(`${API_BASE}/api/super-admin/tenants`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/api/super-admin/analytics`, { headers }).then(r => r.json()),
      ])
      setTenants(tenantsRes.data || [])
      setAnalytics(analyticsRes.data || null)
      setAuthenticated(true)
      localStorage.setItem('sara_admin_key', key)
    } catch {
      setAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  async function loadTenantDetail(id: string) {
    const headers = { 'Authorization': `Bearer ${apiKey}` }
    const res = await fetch(`${API_BASE}/api/super-admin/tenants/${id}`, { headers }).then(r => r.json())
    setTenantDetail(res.data)
    setSelectedTenant(id)
  }

  async function toggleTenant(id: string, active: boolean) {
    const action = active ? 'activate' : 'suspend'
    const headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
    await fetch(`${API_BASE}/api/super-admin/tenants/${id}/${action}`, { method: 'POST', headers })
    fetchData(apiKey)
  }

  async function changePlan(id: string, plan: string) {
    const headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
    await fetch(`${API_BASE}/api/super-admin/tenants/${id}`, {
      method: 'PUT', headers, body: JSON.stringify({ plan })
    })
    fetchData(apiKey)
  }

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  )

  const planColors: Record<string, string> = {
    free: 'bg-gray-100 text-gray-600',
    starter: 'bg-blue-50 text-blue-700',
    pro: 'bg-green-50 text-green-700',
    enterprise: 'bg-purple-50 text-purple-700',
  }

  // Auth gate
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <Shield className="mx-auto text-gray-900 mb-3" size={32} />
              <h1 className="text-xl font-bold text-gray-900">Super Admin</h1>
              <p className="text-sm text-gray-500 mt-1">API Secret requerido</p>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 mb-4 font-mono text-sm"
              placeholder="API_SECRET"
              onKeyDown={e => e.key === 'Enter' && fetchData(apiKey)}
            />
            <button
              onClick={() => fetchData(apiKey)}
              disabled={loading || !apiKey}
              className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : null}
              Acceder
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-gray-950 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white">
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-green-400" />
              <span className="font-bold text-sm">SARA Super Admin</span>
            </div>
          </div>
          <button onClick={() => { setAuthenticated(false); localStorage.removeItem('sara_admin_key') }}
            className="text-xs text-gray-400 hover:text-white">Salir</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Analytics cards */}
        {analytics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { label: 'Tenants', value: analytics.total_tenants, icon: Building2 },
              { label: 'Activos', value: analytics.active_tenants, icon: CheckCircle2 },
              { label: 'Leads', value: analytics.total_leads.toLocaleString(), icon: Users },
              { label: 'Equipo', value: analytics.total_team_members, icon: Users },
              { label: 'Signups 30d', value: analytics.recent_signups_30d, icon: TrendingUp },
              { label: 'MRR', value: `$${(analytics.mrr_mxn / 1000).toFixed(1)}K`, icon: DollarSign },
              { label: 'Free', value: analytics.plan_distribution.free || 0, icon: Clock },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-xl border p-4">
                <div className="flex items-center gap-2 mb-1">
                  <card.icon size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{card.label}</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{card.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tenant list */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b flex items-center gap-3">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 outline-none text-sm"
              placeholder="Buscar tenant..."
            />
            <span className="text-xs text-gray-400">{filteredTenants.length} tenants</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                <th className="text-left px-4 py-2">Tenant</th>
                <th className="text-center px-4 py-2">Plan</th>
                <th className="text-center px-4 py-2">Status</th>
                <th className="text-center px-4 py-2">Leads</th>
                <th className="text-center px-4 py-2">Team</th>
                <th className="text-center px-4 py-2">Onboard</th>
                <th className="text-center px-4 py-2">Creado</th>
                <th className="text-right px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map(t => (
                <tr key={t.id} className="border-t hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={t.plan}
                      onChange={e => changePlan(t.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${planColors[t.plan] || 'bg-gray-100'}`}
                    >
                      <option value="free">Free</option>
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${t.active ? 'bg-green-500' : 'bg-red-400'}`} />
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{t.leads_count}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{t.team_count}</td>
                  <td className="px-4 py-3 text-center">
                    {t.onboarding_completed_at ? (
                      <span className="text-xs text-green-600">Done</span>
                    ) : (
                      <span className="text-xs text-amber-600">Step {(t.onboarding_step || 0) + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-400">
                    {new Date(t.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => toggleTenant(t.id, !t.active)}
                      className={`text-xs px-2 py-1 rounded ${t.active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                      title={t.active ? 'Suspender' : 'Activar'}
                    >
                      {t.active ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                    </button>
                    <button
                      onClick={() => loadTenantDetail(t.id)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tenant detail modal */}
        {selectedTenant && tenantDetail && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTenant(null)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">{tenantDetail.tenant?.name}</h3>
                <button onClick={() => setSelectedTenant(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Plan</div>
                  <div className="font-medium text-gray-900 capitalize">{tenantDetail.tenant?.plan}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Timezone</div>
                  <div className="font-medium text-gray-900 text-sm">{tenantDetail.tenant?.timezone}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">WhatsApp</div>
                  <div className="font-medium text-gray-900 text-sm">{tenantDetail.tenant?.whatsapp_phone_number_id ? 'Conectado' : 'No configurado'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Stripe</div>
                  <div className="font-medium text-gray-900 text-sm">{tenantDetail.tenant?.stripe_customer_id || 'Sin suscripcion'}</div>
                </div>
              </div>

              {/* Usage */}
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Uso este mes</h4>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {Object.entries(tenantDetail.usage || {}).map(([key, val]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="text-xs text-gray-500">{key}</div>
                    <div className="font-bold text-gray-900">{(val as number).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              {/* Team */}
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">Equipo ({tenantDetail.team?.length || 0})</h4>
              <div className="space-y-1 mb-6">
                {(tenantDetail.team || []).slice(0, 10).map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between py-1 text-sm">
                    <span className="text-gray-700">{m.name}</span>
                    <span className="text-xs text-gray-400">{m.role} {m.active ? '' : '(inactivo)'}</span>
                  </div>
                ))}
              </div>

              {/* Billing */}
              {tenantDetail.billing?.length > 0 && (
                <>
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Billing reciente</h4>
                  <div className="space-y-1">
                    {tenantDetail.billing.slice(0, 5).map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between py-1 text-sm">
                        <span className="text-gray-600">{b.event_type}</span>
                        <span className="text-xs text-gray-400">{new Date(b.created_at).toLocaleDateString('es-MX')}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
