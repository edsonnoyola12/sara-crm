import { useState, useEffect } from 'react'
import { RefreshCw, AlertTriangle, Lightbulb, Clock } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { Lead, Property, TeamMember, Appointment, API_BASE, safeFetch } from '../types/crm'

export default function BusinessIntelligenceView({ leads, team, appointments, properties, showToast }: {
  leads: Lead[]
  team: TeamMember[]
  appointments: Appointment[]
  properties: Property[]
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
}) {
  const [activeSection, setActiveSection] = useState<'pipeline' | 'alerts' | 'market' | 'clv' | 'offers' | 'reports'>('pipeline')
  const [loading, setLoading] = useState(false)
  const [sectionError, setSectionError] = useState<string | null>(null)
  const [pipelineData, setPipelineData] = useState<any>(null)
  const [alertsData, setAlertsData] = useState<any>(null)
  const [marketData, setMarketData] = useState<any>(null)
  const [clvData, setClvData] = useState<any>(null)
  const [offersData, setOffersData] = useState<any>(null)

  const STAGE_LABELS: Record<string, string> = {
    'new': 'Nuevos', 'contacted': 'Contactados', 'qualified': 'Calificados',
    'visit_scheduled': 'Cita Agendada', 'scheduled': 'Cita Agendada',
    'visited': 'Visitaron', 'negotiating': 'Negociación', 'negotiation': 'Negociación',
    'reserved': 'Apartados', 'sold': 'Vendidos', 'closed': 'Cerrados',
    'delivered': 'Entregados', 'lost': 'Perdidos', 'inactive': 'Inactivos',
  }

  const ALERT_TYPE_LABELS: Record<string, string> = {
    'cold_lead': 'Lead Frío', 'vendor_inactive': 'Vendedor Inactivo',
    'visit_upcoming': 'Visita Próxima', 'offer_expiring': 'Oferta por Vencer',
    'stalled_deal': 'Negociación Estancada', 'hot_lead': 'Lead Caliente',
    'no_follow_up': 'Sin Seguimiento', 'mortgage_stalled': 'Hipoteca Estancada',
  }

  const STAGE_COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316']

  // Cargar datos según la sección activa
  const loadSectionData = async () => {
    setLoading(true)
    setSectionError(null)
    try {
      switch (activeSection) {
        case 'pipeline': {
          const res = await fetch(`${API_BASE}/api/pipeline?timeframe=90`)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          if (data.success) setPipelineData(data)
          else throw new Error('El servidor no retornó datos')
          break
        }
        case 'alerts': {
          const res = await fetch(`${API_BASE}/api/alerts`)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          if (data.success) setAlertsData(data)
          else throw new Error('El servidor no retornó datos')
          break
        }
        case 'market': {
          const res = await fetch(`${API_BASE}/api/market?days=30`)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          if (data.success) setMarketData(data.analysis)
          else throw new Error('El servidor no retornó datos')
          break
        }
        case 'clv': {
          const res = await fetch(`${API_BASE}/api/clv`)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          if (data.success) setClvData(data.analysis)
          else throw new Error('El servidor no retornó datos')
          break
        }
        case 'offers': {
          const res = await fetch(`${API_BASE}/api/offers?days=30`)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          if (data.success) setOffersData(data)
          else setOffersData({ total_offers: 0, by_status: {} })
          break
        }
      }
    } catch (err: any) {
      console.error('Error loading BI data:', err)
      setSectionError(`Error cargando datos: ${err.message || 'Conexión fallida'}`)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSectionData()
  }, [activeSection])

  // Tabs de navegación
  const tabs = [
    { id: 'pipeline', label: 'Pipeline', icon: '📊' },
    { id: 'alerts', label: 'Alertas', icon: '🚨' },
    { id: 'market', label: 'Mercado', icon: '📈' },
    { id: 'clv', label: 'CLV', icon: '👥' },
    { id: 'offers', label: 'Ofertas', icon: '💰' },
    { id: 'reports', label: 'Reportes', icon: '📋' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Inteligencia Comercial
        </h2>
        <button
          onClick={() => loadSectionData()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600"
        >
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeSection === tab.id
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
        </div>
      )}

      {/* Error con retry */}
      {sectionError && !loading && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
          <AlertTriangle className="mx-auto mb-3 text-red-400" size={32} />
          <p className="text-red-400 mb-4">{sectionError}</p>
          <button
            onClick={() => loadSectionData()}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500"
          >
            <RefreshCw size={16} /> Reintentar
          </button>
        </div>
      )}

      {/* Pipeline Section */}
      {activeSection === 'pipeline' && !loading && pipelineData && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">LEADS ACTIVOS</p>
              <p className="text-3xl font-bold text-cyan-400">{pipelineData.total_leads || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">VALOR PIPELINE</p>
              <p className="text-3xl font-bold text-green-400">${((pipelineData.total_pipeline_value || 0) / 1000000).toFixed(1)}M</p>
            </div>
            <div className="bg-gradient-to-br from-purple-600/20 to-violet-600/20 border border-purple-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">INGRESO ESPERADO</p>
              <p className="text-3xl font-bold text-purple-400">${((pipelineData.expected_revenue || 0) / 1000000).toFixed(1)}M</p>
            </div>
            <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">CONVERSION</p>
              <p className="text-3xl font-bold text-amber-400">{pipelineData.overall_conversion_rate || '0%'}</p>
            </div>
          </div>

          {/* Funnel por etapa */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Funnel de Ventas</h3>
            <div className="space-y-3">
              {pipelineData.by_stage && Object.entries(pipelineData.by_stage).map(([stageName, count]: [string, any], idx: number) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-slate-400">{STAGE_LABELS[stageName] || stageName.replace('_', ' ')}</div>
                  <div className="flex-1 h-8 bg-slate-700 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(Math.min((count / (pipelineData.total_leads || 1)) * 100, 100), count > 0 ? 8 : 0)}%` }}
                    >
                      <span className="text-xs font-bold">{count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfica de distribución */}
          {pipelineData.by_stage && (() => {
            const chartData = Object.entries(pipelineData.by_stage)
              .filter(([_, count]) => (count as number) > 0)
              .map(([stage, count]) => ({ name: STAGE_LABELS[stage] || stage, value: count as number }))
            return chartData.length > 0 ? (
              <div className="bg-slate-800/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Distribución por Etapa</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                      {chartData.map((_, idx) => (
                        <Cell key={idx} fill={STAGE_COLORS[idx % STAGE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : null
          })()}

          {/* Leads en riesgo */}
          {pipelineData.at_risk_leads?.length > 0 && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-400" /> Leads en Riesgo ({pipelineData.at_risk_leads.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pipelineData.at_risk_leads.slice(0, 6).map((lead: any, idx: number) => (
                  <div key={idx} className="bg-slate-800/50 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-xs text-slate-400">{lead.days_in_stage} días en etapa • {lead.assigned_to_name}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-red-500/30 text-red-300 rounded">{lead.risk_reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alerts Section */}
      {activeSection === 'alerts' && !loading && alertsData && (
        <div className="space-y-6">
          {/* Resumen de alertas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">CRITICAS</p>
              <p className="text-3xl font-bold text-red-400">{alertsData.by_priority?.critical || 0}</p>
            </div>
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">ALTAS</p>
              <p className="text-3xl font-bold text-orange-400">{alertsData.by_priority?.high || 0}</p>
            </div>
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">MEDIAS</p>
              <p className="text-3xl font-bold text-yellow-400">{alertsData.by_priority?.medium || 0}</p>
            </div>
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">BAJAS</p>
              <p className="text-3xl font-bold text-blue-400">{alertsData.by_priority?.low || 0}</p>
            </div>
          </div>

          {/* Lista de alertas */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Alertas Activas</h3>
            <div className="space-y-3">
              {alertsData.alerts?.slice(0, 10).map((alert: any, idx: number) => (
                <div key={idx} className={`p-4 rounded-lg border ${
                  alert.priority === 'critical' ? 'bg-red-900/30 border-red-500/50' :
                  alert.priority === 'high' ? 'bg-orange-900/30 border-orange-500/50' :
                  alert.priority === 'medium' ? 'bg-yellow-900/30 border-yellow-500/50' :
                  'bg-slate-700/50 border-slate-600/50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-slate-400">{alert.message}</p>
                      {alert.action_required && (
                        <p className="text-xs text-cyan-400 mt-1">→ {alert.action_required}</p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      alert.priority === 'critical' ? 'bg-red-500/30 text-red-300' :
                      alert.priority === 'high' ? 'bg-orange-500/30 text-orange-300' :
                      'bg-yellow-500/30 text-yellow-300'
                    }`}>{ALERT_TYPE_LABELS[alert.type] || alert.type?.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Market Intelligence Section */}
      {activeSection === 'market' && !loading && marketData && (
        <div className="space-y-6">
          {/* KPIs de mercado */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">CONSULTAS TOTALES</p>
              <p className="text-3xl font-bold text-cyan-400">{marketData.demand?.total_inquiries || 0}</p>
            </div>
            <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">PRESUPUESTO PROM</p>
              <p className="text-3xl font-bold text-green-400">${((marketData.pricing?.avg_budget || 0) / 1000000).toFixed(1)}M</p>
            </div>
            <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">SENSIBILIDAD PRECIO</p>
              <p className="text-3xl font-bold text-amber-400">{marketData.pricing?.price_sensitivity || 'N/A'}</p>
            </div>
            <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">DIAS A DECISION</p>
              <p className="text-3xl font-bold text-purple-400">{marketData.timing?.avg_decision_days || 0}</p>
            </div>
          </div>

          {/* Demanda por desarrollo */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Demanda por Desarrollo</h3>
            <div className="space-y-3">
              {marketData.demand?.by_development?.slice(0, 8).map((dev: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-40 truncate">{dev.development}</div>
                  <div className="flex-1 h-6 bg-slate-700 rounded-lg overflow-hidden">
                    <div
                      className={`h-full ${dev.trend === 'up' ? 'bg-green-500' : dev.trend === 'down' ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min((dev.inquiries / (marketData.demand?.total_inquiries || 1)) * 100 * 3, 100)}%` }}
                    />
                  </div>
                  <div className="w-16 text-right">{dev.inquiries}</div>
                  <div className={`w-16 text-right text-sm ${dev.trend === 'up' ? 'text-green-400' : dev.trend === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
                    {dev.trend === 'up' ? '↑' : dev.trend === 'down' ? '↓' : '→'} {Math.abs(dev.trend_percent || 0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recomendaciones */}
          {marketData.recommendations?.length > 0 && (
            <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Lightbulb className="text-yellow-400" /> Recomendaciones
              </h3>
              <div className="space-y-2">
                {marketData.recommendations.map((rec: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400">•</span>
                    <p className="text-slate-300">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CLV Section */}
      {activeSection === 'clv' && !loading && clvData && (
        <div className="space-y-6">
          {/* KPIs CLV */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">TOTAL CLIENTES</p>
              <p className="text-3xl font-bold text-purple-400">{clvData.total_customers || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">CLV TOTAL</p>
              <p className="text-3xl font-bold text-green-400">${((clvData.total_clv || 0) / 1000000).toFixed(1)}M</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">CLV PROMEDIO</p>
              <p className="text-3xl font-bold text-cyan-400">${((clvData.avg_clv || 0) / 1000000).toFixed(2)}M</p>
            </div>
            <div className="bg-gradient-to-br from-pink-600/20 to-rose-600/20 border border-pink-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">REFERIDOS CONV</p>
              <p className="text-3xl font-bold text-pink-400">{clvData.referrals?.conversion_rate || '0%'}</p>
            </div>
          </div>

          {/* Segmentación */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Segmentación de Clientes</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-yellow-400">👑 {clvData.by_segment?.vip || 0}</p>
                <p className="text-sm text-slate-400">VIP</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-500/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-purple-400">💎 {clvData.by_segment?.high_value || 0}</p>
                <p className="text-sm text-slate-400">Alto Valor</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">💰 {clvData.by_segment?.medium_value || 0}</p>
                <p className="text-sm text-slate-400">Medio Valor</p>
              </div>
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-400">🆕 {clvData.by_segment?.new || 0}</p>
                <p className="text-sm text-slate-400">Nuevos</p>
              </div>
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-orange-400">⚠️ {clvData.by_segment?.at_risk || 0}</p>
                <p className="text-sm text-slate-400">En Riesgo</p>
              </div>
              <div className="bg-gradient-to-r from-slate-500/20 to-gray-500/20 border border-slate-500/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-slate-400">❌ {clvData.by_segment?.churned || 0}</p>
                <p className="text-sm text-slate-400">Perdidos</p>
              </div>
            </div>
          </div>

          {/* Top referidores */}
          {clvData.referrals?.top_referrers?.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">🏆 Top Referidores</h3>
              <div className="space-y-3">
                {clvData.referrals.top_referrers.map((ref: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '•'}</span>
                      <div>
                        <p className="font-medium">{ref.name}</p>
                        <p className="text-sm text-slate-400">{ref.referrals} referidos, {ref.conversions} ventas</p>
                      </div>
                    </div>
                    <p className="text-green-400 font-bold">${(ref.value_generated / 1000000).toFixed(2)}M</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Offers Section */}
      {activeSection === 'offers' && !loading && (
        <div className="space-y-6">
          {!offersData ? (
            <div className="text-center text-slate-400 py-12">
              <p>Cargando datos de ofertas...</p>
            </div>
          ) : (
            <>
              {/* KPIs ofertas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
                  <p className="text-[11px] font-medium text-slate-400 mb-1">OFERTAS TOTALES</p>
                  <p className="text-3xl font-bold text-cyan-400">{offersData.total_offers || 0}</p>
                </div>
                <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
                  <p className="text-[11px] font-medium text-slate-400 mb-1">VALOR OFERTADO</p>
                  <p className="text-3xl font-bold text-green-400">${((offersData.total_offered_value || 0) / 1000000).toFixed(1)}M</p>
                </div>
                <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
                  <p className="text-[11px] font-medium text-slate-400 mb-1">TASA ACEPTACION</p>
                  <p className="text-3xl font-bold text-purple-400">{offersData.acceptance_rate || '0%'}</p>
                </div>
                <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-4">
                  <p className="text-[11px] font-medium text-slate-400 mb-1">POR VENCER</p>
                  <p className="text-3xl font-bold text-orange-400">{offersData.expiring_soon?.length || 0}</p>
                </div>
              </div>

              {/* Ofertas por estado */}
              <div className="bg-slate-800/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Ofertas por Estado</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {offersData.by_status && Object.entries(offersData.by_status)
                    .filter(([_, count]) => (count as number) > 0)
                    .map(([status, count]: [string, any], idx: number) => (
                    <div key={idx} className="bg-slate-700/50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-white">{count}</p>
                      <p className="text-sm text-slate-400 capitalize">{status.replace('_', ' ')}</p>
                    </div>
                  ))}
                  {(!offersData.by_status || Object.values(offersData.by_status).every((v: any) => v === 0)) && (
                    <div className="col-span-4 text-center text-slate-400 py-8">
                      No hay ofertas registradas en este período
                    </div>
                  )}
                </div>
              </div>

              {/* Ofertas por vencer */}
              {offersData.expiring_soon?.length > 0 && (
                <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Clock className="text-orange-400" /> Ofertas por Vencer
                  </h3>
                  <div className="space-y-2">
                    {offersData.expiring_soon.map((offer: any, idx: number) => (
                      <div key={idx} className="bg-slate-800/50 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{offer.lead_name}</p>
                          <p className="text-sm text-slate-400">{offer.property_name}</p>
                        </div>
                        <span className="text-orange-400">${((offer.amount || 0) / 1000000).toFixed(1)}M</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Reports Section */}
      {activeSection === 'reports' && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reporte Semanal */}
            <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                📊 Reporte Semanal
              </h3>
              <p className="text-slate-400 mb-4">Resumen ejecutivo de la última semana con KPIs, pipeline y rendimiento del equipo.</p>
              <div className="flex gap-2">
                <a
                  href={`${API_BASE}/api/reports/weekly/html`}
                  target="_blank"
                  className="flex-1 text-center px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500"
                >
                  Ver HTML
                </a>
                <button
                  onClick={async () => {
                    const data = await safeFetch(`${API_BASE}/api/reports/weekly/whatsapp`)
                    if (data.success) {
                      navigator.clipboard.writeText(data.message)
                      showToast('Reporte copiado al portapapeles', 'success')
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600"
                >
                  Copiar WhatsApp
                </button>
              </div>
            </div>

            {/* Reporte Mensual */}
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                📋 Reporte Mensual
              </h3>
              <p className="text-slate-400 mb-4">Análisis completo del mes con tendencias, comparativas y proyecciones.</p>
              <div className="flex gap-2">
                <a
                  href={`${API_BASE}/api/reports/monthly/html`}
                  target="_blank"
                  className="flex-1 text-center px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500"
                >
                  Ver HTML
                </a>
                <button
                  onClick={async () => {
                    const data = await safeFetch(`${API_BASE}/api/reports/monthly/whatsapp`)
                    if (data.success) {
                      navigator.clipboard.writeText(data.message)
                      showToast('Reporte copiado al portapapeles', 'success')
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600"
                >
                  Copiar WhatsApp
                </button>
              </div>
            </div>
          </div>

          {/* Info adicional */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">📡 Endpoints API Disponibles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-cyan-400">GET /api/pipeline/summary</p>
                <p className="text-slate-400">Pipeline de ventas y forecast</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-cyan-400">GET /api/alerts</p>
                <p className="text-slate-400">Alertas inteligentes</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-cyan-400">GET /api/market</p>
                <p className="text-slate-400">Inteligencia de mercado</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-cyan-400">GET /api/clv</p>
                <p className="text-slate-400">Valor del cliente (CLV)</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-cyan-400">GET /api/offers/summary</p>
                <p className="text-slate-400">Tracking de ofertas</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-cyan-400">GET /api/reports/*</p>
                <p className="text-slate-400">Reportes PDF/HTML</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state (only show if no error already shown) */}
      {!loading && !sectionError && !pipelineData && !alertsData && !marketData && !clvData && !offersData && activeSection !== 'reports' && (
        <div className="text-center py-12 text-slate-400">
          <p>Cargando datos del backend...</p>
          <button
            onClick={() => loadSectionData()}
            className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600"
          >
            <RefreshCw size={16} /> Cargar datos
          </button>
        </div>
      )}
    </div>
  )
}
