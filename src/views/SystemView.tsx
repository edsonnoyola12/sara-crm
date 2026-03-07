import { useState, useEffect } from 'react'
import { AlertTriangle, RefreshCw, XCircle, Clock, BarChart3, CheckCircle, ChevronRight, History } from 'lucide-react'
import { useCrm } from '../context/CrmContext'
import { API_BASE } from '../types/crm'
import AuditLog from '../components/AuditLog'

export default function SystemView() {
  const { showToast } = useCrm()

  const [activeTab, setActiveTab] = useState<'errors' | 'audit'>('errors')
  const [errorLogs, setErrorLogs] = useState<any>(null)
  const [errorLogsLoading, setErrorLogsLoading] = useState(false)
  const [errorFilters, setErrorFilters] = useState({ severity: 'all', type: 'all', resolved: 'all', days: 7 })
  const [healthData, setHealthData] = useState<any>(null)
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null)

  useEffect(() => {
    setErrorLogsLoading(true)
    const params = new URLSearchParams()
    if (errorFilters.days) params.set('days', String(errorFilters.days))
    if (errorFilters.severity !== 'all') params.set('severity', errorFilters.severity)
    if (errorFilters.type !== 'all') params.set('type', errorFilters.type)
    if (errorFilters.resolved !== 'all') params.set('resolved', errorFilters.resolved)
    Promise.all([
      fetch(`${API_BASE}/api/error-logs?${params}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_BASE}/health`).then(r => r.ok ? r.json() : null).catch(() => null)
    ]).then(([logs, health]) => {
      setErrorLogs(logs)
      setHealthData(health)
      setErrorLogsLoading(false)
    }).catch(() => setErrorLogsLoading(false))
  }, [errorFilters])

  const stats = errorLogs?.stats || { total: 0, critical: 0, unresolved: 0, by_type: {} }
  const errors = errorLogs?.errors || []

  const resolveError = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/error-logs/${id}/resolve`, { method: 'POST' })
      showToast('Error marcado como resuelto', 'success')
      setErrorFilters({ ...errorFilters })
    } catch { showToast('Error al resolver', 'error') }
  }

  const refreshData = () => setErrorFilters({ ...errorFilters })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold flex items-center gap-3"><AlertTriangle className="text-amber-400" size={28} /> Sistema</h2>
        <button onClick={refreshData} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl text-sm transition-all">
          <RefreshCw size={16} className={errorLogsLoading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700/50 pb-0">
        <button onClick={() => setActiveTab('errors')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'errors' ? 'text-amber-400 bg-slate-700/50 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-200'}`}>
          <AlertTriangle size={16} /> Errores
        </button>
        <button onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'audit' ? 'text-blue-400 bg-slate-700/50 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'}`}>
          <History size={16} /> Historial de Cambios
        </button>
      </div>

      {activeTab === 'audit' && (
        <AuditLog />
      )}

      {activeTab === 'errors' && (<>
      {/* Health Status */}
      <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${healthData?.status === 'healthy' || healthData?.allPassed ? 'bg-green-500 health-pulse' : 'bg-red-500 health-pulse'}`} />
          Estado del Sistema
        </h3>
        {healthData ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Status', value: healthData.allPassed ? 'Saludable' : 'Con problemas', color: healthData.allPassed ? 'text-green-400' : 'text-red-400' },
              { label: 'Supabase', value: (() => { const c = healthData.checks?.find((x: any) => x.name === 'supabase_connectivity'); return c?.passed ? `OK (${c.details})` : 'Error'; })(), color: healthData.checks?.find((x: any) => x.name === 'supabase_connectivity')?.passed ? 'text-green-400' : 'text-red-400' },
              { label: 'Meta API', value: (() => { const c = healthData.checks?.find((x: any) => x.name === 'meta_whatsapp_api'); return c?.passed ? `OK (${c.latency_ms}ms)` : 'Error'; })(), color: healthData.checks?.find((x: any) => x.name === 'meta_whatsapp_api')?.passed ? 'text-green-400' : 'text-red-400' },
              { label: 'Team', value: (() => { const c = healthData.checks?.find((x: any) => x.name === 'team_members'); const m = c?.details?.match(/(\d+)/); return `${m?.[1] || 0} activos`; })(), color: 'text-blue-400' }
            ].map((item, i) => (
              <div key={i} className="bg-slate-700/50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400"><RefreshCw size={16} className="animate-spin" /> Cargando...</div>
        )}
      </div>

      {/* Error Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card rounded-2xl p-4 border bg-amber-500/10 border-amber-500/30">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle size={20} className="text-amber-400" /><span className="text-xs text-slate-400">Errores ({errorFilters.days}d)</span></div>
          <p className="text-2xl font-bold text-amber-400">{stats.total}</p>
        </div>
        <div className="kpi-card rounded-2xl p-4 border bg-red-500/10 border-red-500/30">
          <div className="flex items-center gap-2 mb-2"><XCircle size={20} className="text-red-400" /><span className="text-xs text-slate-400">Criticos</span></div>
          <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
        </div>
        <div className="kpi-card rounded-2xl p-4 border bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-center gap-2 mb-2"><Clock size={20} className="text-yellow-400" /><span className="text-xs text-slate-400">Sin Resolver</span></div>
          <p className="text-2xl font-bold text-yellow-400">{stats.unresolved}</p>
        </div>
        <div className="kpi-card rounded-2xl p-4 border bg-blue-500/10 border-blue-500/30">
          <div className="flex items-center gap-2 mb-2"><BarChart3 size={20} className="text-blue-400" /><span className="text-xs text-slate-400">Tipos</span></div>
          <p className="text-2xl font-bold text-blue-400">{Object.keys(stats.by_type || {}).length}</p>
        </div>
      </div>

      {/* Error Type Breakdown */}
      {stats.by_type && Object.keys(stats.by_type).length > 0 && (
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
          <h3 className="text-sm font-semibold mb-3 text-slate-300">Errores por Tipo</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.by_type).map(([type, count]) => (
              <span key={type} className="px-3 py-1 bg-slate-700/50 rounded-lg text-sm">
                <span className="text-slate-400">{type}:</span> <span className="text-white font-bold">{count as number}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={errorFilters.severity} onChange={e => setErrorFilters({ ...errorFilters, severity: e.target.value })}
          className="bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="all">Severidad: Todas</option>
          <option value="critical">Critical</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
        </select>
        <select value={errorFilters.type} onChange={e => setErrorFilters({ ...errorFilters, type: e.target.value })}
          className="bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="all">Tipo: Todos</option>
          <option value="fetch_error">Fetch Error</option>
          <option value="cron_error">CRON Error</option>
          <option value="webhook_error">Webhook Error</option>
        </select>
        <select value={errorFilters.resolved} onChange={e => setErrorFilters({ ...errorFilters, resolved: e.target.value })}
          className="bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="all">Estado: Todos</option>
          <option value="no">Sin Resolver</option>
          <option value="yes">Resueltos</option>
        </select>
        <select value={errorFilters.days} onChange={e => setErrorFilters({ ...errorFilters, days: Number(e.target.value) })}
          className="bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value={1}>1 dia</option>
          <option value={3}>3 dias</option>
          <option value={7}>7 dias</option>
          <option value={30}>30 dias</option>
        </select>
      </div>

      {/* Error List */}
      {errorLogsLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      ) : errors.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
          <p className="text-lg font-semibold">Sin errores</p>
          <p className="text-sm">No hay errores en los ultimos {errorFilters.days} dias</p>
        </div>
      ) : (
        <div className="space-y-2">
          {errors.map((err: any) => {
            const isExpanded = expandedErrorId === err.id
            const severityClass = err.severity === 'critical' ? 'severity-critical' : err.severity === 'error' ? 'severity-error' : 'severity-warning'
            const timeAgo = (() => {
              const mins = Math.floor((Date.now() - new Date(err.created_at).getTime()) / 60000)
              if (mins < 60) return `${mins}m`
              const hrs = Math.floor(mins / 60)
              if (hrs < 24) return `${hrs}h`
              return `${Math.floor(hrs / 24)}d`
            })()

            return (
              <div key={err.id} className={`bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden transition-all ${err.resolved ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-700/30 transition-all" onClick={() => setExpandedErrorId(isExpanded ? null : err.id)}>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${severityClass}`}>{err.severity}</span>
                  <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-300">{err.error_type}</span>
                  <span className="flex-1 text-sm text-slate-200 truncate">{err.message?.substring(0, 100)}</span>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{timeAgo}</span>
                  {err.resolved && <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">Resuelto</span>}
                  <ChevronRight size={16} className={`text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-700/50 pt-3 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><span className="text-slate-400">Tipo:</span> <span className="text-white">{err.error_type}</span></div>
                      <div><span className="text-slate-400">Fuente:</span> <span className="text-white">{err.source || 'N/A'}</span></div>
                      <div><span className="text-slate-400">Fecha:</span> <span className="text-white">{new Date(err.created_at).toLocaleString('es-MX')}</span></div>
                      <div><span className="text-slate-400">ID:</span> <span className="text-white font-mono text-xs">{err.id?.substring(0, 8)}</span></div>
                    </div>
                    {err.message && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Mensaje completo:</p>
                        <pre className="bg-slate-900 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-32">{err.message}</pre>
                      </div>
                    )}
                    {err.stack && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Stack trace:</p>
                        <pre className="bg-slate-900 rounded-lg p-3 text-xs text-red-300 overflow-x-auto whitespace-pre-wrap max-h-40">{err.stack}</pre>
                      </div>
                    )}
                    {err.context && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Contexto:</p>
                        <pre className="bg-slate-900 rounded-lg p-3 text-xs text-blue-300 overflow-x-auto whitespace-pre-wrap max-h-32">{JSON.stringify(err.context, null, 2)}</pre>
                      </div>
                    )}
                    {!err.resolved && (
                      <button onClick={(e) => { e.stopPropagation(); resolveError(err.id) }}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                        <CheckCircle size={16} /> Marcar como Resuelto
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      </>)}
    </div>
  )
}
