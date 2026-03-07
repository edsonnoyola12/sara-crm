import { useState, useEffect } from 'react'
import { Bell, RefreshCw, AlertTriangle, CheckCircle, TrendingDown, Flame, Clock, XCircle, UserX, Target, Calendar } from 'lucide-react'
import { API_BASE } from '../types/crm'

export default function AlertasView() {
  const [smartAlerts, setSmartAlerts] = useState<any>(null)
  const [smartAlertsLoading, setSmartAlertsLoading] = useState(false)
  const [alertTypeFilter, setAlertTypeFilter] = useState<string>('all')

  useEffect(() => {
    setSmartAlertsLoading(true)
    fetch(`${API_BASE}/api/alerts`).then(r => r.ok ? r.json() : null).then(data => {
      if (data) setSmartAlerts(data)
      setSmartAlertsLoading(false)
    }).catch(() => setSmartAlertsLoading(false))
  }, [])

  const scan = () => {
    setSmartAlertsLoading(true)
    fetch(`${API_BASE}/api/alerts/scan`).then(r => r.ok ? r.json() : Promise.reject('scan failed')).then(data => {
      setSmartAlerts({ success: true, generated_at: new Date().toISOString(), total_alerts: data.count || 0, by_priority: { critical: 0, high: 0, medium: 0, low: 0 }, by_type: {}, unacknowledged: data.count || 0, alerts: data.alerts || [] })
      setSmartAlertsLoading(false)
    }).catch(() => setSmartAlertsLoading(false))
  }

  const priorityColors: Record<string, string> = { critical: 'bg-red-500/20 text-red-400 border-red-500/30', high: 'bg-orange-500/20 text-orange-400 border-orange-500/30', medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', low: 'bg-slate-500/20 text-slate-400 border-slate-500/30' }
  const typeLabels: Record<string, string> = { lead_going_cold: 'Lead Enfriando', lead_hot_signal: 'Senal Caliente', lead_stalled: 'Lead Estancado', lead_reactivation: 'Reactivacion', lead_birthday: 'Cumpleanos', offer_expiring: 'Oferta por Vencer', offer_no_response: 'Sin Respuesta Oferta', offer_counter: 'Contraoferta', visit_upcoming: 'Visita Proxima', visit_no_show: 'No Show', visit_followup_due: 'Seguimiento Visita', vendor_inactive: 'Vendedor Inactivo', vendor_low_conversion: 'Baja Conversion', vendor_high_load: 'Carga Alta', goal_at_risk: 'Meta en Riesgo', pipeline_drop: 'Caida Pipeline', competitor_mention: 'Competencia' }
  const typeIcons: Record<string, any> = { lead_going_cold: TrendingDown, lead_hot_signal: Flame, lead_stalled: Clock, offer_expiring: AlertTriangle, visit_upcoming: Calendar, visit_no_show: XCircle, vendor_inactive: UserX, goal_at_risk: Target }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold flex items-center gap-3"><Bell size={28} /> Alertas Inteligentes</h2>
        <button onClick={scan} className="bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2 text-sm">
          <RefreshCw size={16} className={smartAlertsLoading ? 'animate-spin' : ''} /> Escanear
        </button>
      </div>

      {smartAlertsLoading && !smartAlerts ? (
        <div className="flex items-center justify-center py-20"><RefreshCw size={32} className="animate-spin text-blue-400" /></div>
      ) : smartAlerts ? (() => {
        const alerts = smartAlerts.alerts || []
        const byPriority = smartAlerts.by_priority || { critical: 0, high: 0, medium: 0, low: 0 }
        const filteredAlerts = alertTypeFilter === 'all' ? alerts : alerts.filter((a: any) => a.type === alertTypeFilter)
        const uniqueTypes = [...new Set(alerts.map((a: any) => a.type))] as string[]

        return (<>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-800/50 rounded-2xl p-4 text-center border border-slate-700/50">
              <div className="text-3xl font-bold text-white">{smartAlerts.total_alerts || 0}</div>
              <div className="text-xs text-slate-400 mt-1">Total Alertas</div>
            </div>
            <div className="bg-red-500/10 rounded-2xl p-4 text-center border border-red-500/20">
              <div className="text-3xl font-bold text-red-400">{byPriority.critical}</div>
              <div className="text-xs text-red-400/70 mt-1">Criticas</div>
            </div>
            <div className="bg-orange-500/10 rounded-2xl p-4 text-center border border-orange-500/20">
              <div className="text-3xl font-bold text-orange-400">{byPriority.high}</div>
              <div className="text-xs text-orange-400/70 mt-1">Alta Prioridad</div>
            </div>
            <div className="bg-yellow-500/10 rounded-2xl p-4 text-center border border-yellow-500/20">
              <div className="text-3xl font-bold text-yellow-400">{byPriority.medium}</div>
              <div className="text-xs text-yellow-400/70 mt-1">Media</div>
            </div>
            <div className="bg-slate-700/30 rounded-2xl p-4 text-center border border-slate-600/30">
              <div className="text-3xl font-bold text-slate-300">{byPriority.low}</div>
              <div className="text-xs text-slate-400 mt-1">Baja</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setAlertTypeFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${alertTypeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
              Todas ({alerts.length})
            </button>
            {uniqueTypes.map(type => (
              <button key={type} onClick={() => setAlertTypeFilter(type)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${alertTypeFilter === type ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                {typeLabels[type] || type} ({alerts.filter((a: any) => a.type === type).length})
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <CheckCircle size={28} className="mx-auto mb-2 text-green-400" />
                <p className="text-sm font-medium text-slate-400">Sin alertas activas — todo bajo control</p>
              </div>
            ) : filteredAlerts.map((alert: any, idx: number) => {
              const IconComp = typeIcons[alert.type] || AlertTriangle
              return (
                <div key={alert.id || idx} className={`rounded-xl p-4 border ${priorityColors[alert.priority] || priorityColors.low} transition-all hover:scale-[1.01]`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5"><IconComp size={20} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{alert.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${alert.priority === 'critical' ? 'bg-red-500/30 text-red-300' : alert.priority === 'high' ? 'bg-orange-500/30 text-orange-300' : alert.priority === 'medium' ? 'bg-yellow-500/30 text-yellow-300' : 'bg-slate-500/30 text-slate-300'}`}>
                          {alert.priority}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-600/50 text-slate-300">{typeLabels[alert.type] || alert.type}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
                        {alert.lead_name && <span>Lead: <span className="text-slate-300">{alert.lead_name}</span></span>}
                        {alert.vendor_name && <span>Vendedor: <span className="text-slate-300">{alert.vendor_name}</span></span>}
                        {alert.action_required && <span className="text-blue-400">{alert.action_required}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {Object.keys(smartAlerts.by_type || {}).length > 0 && (
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-bold mb-4">Resumen por Tipo</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(smartAlerts.by_type || {}).sort((a: any, b: any) => b[1] - a[1]).map(([type, count]: [string, any]) => (
                  <div key={type} className="bg-slate-700/30 rounded-xl p-3 text-center cursor-pointer hover:bg-slate-700/50 transition-colors" onClick={() => setAlertTypeFilter(type)}>
                    <div className="text-xl font-bold text-white">{count}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{typeLabels[type] || type}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>)
      })() : (
        <div className="text-center py-12 text-slate-500">
          <AlertTriangle size={40} className="mx-auto mb-3" />
          <p>No se pudieron cargar las alertas</p>
        </div>
      )}
    </div>
  )
}
