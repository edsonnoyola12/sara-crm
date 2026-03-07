import { useState, useEffect, useMemo } from 'react'
import { useCrm } from '../context/CrmContext'
import type { ApprovalRequest, ApprovalRule } from '../types/crm'
import { Shield, Check, X, Clock, AlertTriangle, Filter, Search, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  discount: 'Descuento',
  reservation: 'Reservacion',
  cancellation: 'Cancelacion',
  price_change: 'Cambio de precio',
  commission_change: 'Cambio comision',
  lead_delete: 'Eliminar lead',
  refund: 'Reembolso',
}

const TYPE_COLORS: Record<string, string> = {
  discount: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  reservation: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cancellation: 'bg-red-500/20 text-red-400 border-red-500/30',
  price_change: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  commission_change: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  lead_delete: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  refund: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

const STATUS_BADGES: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
}

const DEFAULT_RULES: Omit<ApprovalRule, 'id'>[] = [
  { type: 'discount', description: 'Descuentos sobre precio de propiedad', requires_role: 'admin', auto_approve_threshold: 5, active: true },
  { type: 'reservation', description: 'Reservaciones de propiedades', requires_role: 'coordinador', active: true },
  { type: 'cancellation', description: 'Cancelaciones de operaciones', requires_role: 'admin', active: true },
  { type: 'price_change', description: 'Cambios de precio en propiedades', requires_role: 'admin', auto_approve_threshold: 3, active: true },
  { type: 'commission_change', description: 'Cambios en comisiones de agentes', requires_role: 'admin', active: true },
  { type: 'lead_delete', description: 'Eliminacion permanente de leads', requires_role: 'admin', active: false },
  { type: 'refund', description: 'Reembolsos a clientes', requires_role: 'admin', active: true },
]

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

function avgResolutionTime(requests: ApprovalRequest[]): string {
  const resolved = requests.filter(r => r.resolved_at && r.status !== 'pending')
  if (resolved.length === 0) return '--'
  const totalMs = resolved.reduce((sum, r) => {
    return sum + (new Date(r.resolved_at!).getTime() - new Date(r.created_at).getTime())
  }, 0)
  const avgMs = totalMs / resolved.length
  const avgHrs = avgMs / 3600000
  if (avgHrs < 1) return `${Math.round(avgMs / 60000)}m`
  if (avgHrs < 24) return `${avgHrs.toFixed(1)}h`
  return `${(avgHrs / 24).toFixed(1)}d`
}

export default function ApprovalsView() {
  const { supabase, showToast, currentUser } = useCrm()
  const [requests, setRequests] = useState<ApprovalRequest[]>([])
  const [rules, setRules] = useState<ApprovalRule[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'history' | 'rules'>('pending')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)

  // History filters
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all')
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all')
  const [historySearch, setHistorySearch] = useState('')
  const [historyDateFrom, setHistoryDateFrom] = useState('')
  const [historyDateTo, setHistoryDateTo] = useState('')
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [reqRes, ruleRes] = await Promise.all([
        supabase.from('approval_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('approval_rules').select('*').order('type'),
      ])
      if (reqRes.data) setRequests(reqRes.data)
      if (ruleRes.data) {
        setRules(ruleRes.data)
      } else {
        // Seed default rules if none exist
        const toInsert = DEFAULT_RULES.map(r => ({ ...r, id: crypto.randomUUID() }))
        const { data, error } = await supabase.from('approval_rules').insert(toInsert).select()
        if (data) setRules(data)
        if (error) console.error('Error seeding rules:', error)
      }
    } catch (err) {
      console.error('Error loading approvals:', err)
    } finally {
      setLoading(false)
    }
  }

  const pendingRequests = useMemo(() => requests.filter(r => r.status === 'pending'), [requests])
  const todayStr = new Date().toISOString().slice(0, 10)
  const approvedToday = useMemo(() => requests.filter(r => r.status === 'approved' && r.resolved_at?.startsWith(todayStr)), [requests, todayStr])
  const rejectedToday = useMemo(() => requests.filter(r => r.status === 'rejected' && r.resolved_at?.startsWith(todayStr)), [requests, todayStr])

  const historyRequests = useMemo(() => {
    return requests.filter(r => {
      if (r.status === 'pending') return false
      if (historyTypeFilter !== 'all' && r.type !== historyTypeFilter) return false
      if (historyStatusFilter !== 'all' && r.status !== historyStatusFilter) return false
      if (historySearch && !r.entity_name.toLowerCase().includes(historySearch.toLowerCase()) && !r.requested_by_name.toLowerCase().includes(historySearch.toLowerCase())) return false
      if (historyDateFrom && r.created_at < historyDateFrom) return false
      if (historyDateTo && r.created_at > historyDateTo + 'T23:59:59') return false
      return true
    })
  }, [requests, historyTypeFilter, historyStatusFilter, historySearch, historyDateFrom, historyDateTo])

  async function handleApprove(req: ApprovalRequest) {
    if (!currentUser) return
    setProcessing(req.id)
    try {
      const { error } = await supabase.from('approval_requests').update({
        status: 'approved',
        approved_by: currentUser.id,
        approved_by_name: currentUser.name,
        resolved_at: new Date().toISOString(),
      }).eq('id', req.id)
      if (error) throw error
      setRequests(prev => prev.map(r => r.id === req.id ? {
        ...r, status: 'approved' as const,
        approved_by: currentUser.id, approved_by_name: currentUser.name,
        resolved_at: new Date().toISOString(),
      } : r))
      showToast('Solicitud aprobada', 'success')
    } catch (err) {
      showToast('Error al aprobar solicitud', 'error')
      console.error(err)
    } finally {
      setProcessing(null)
    }
  }

  async function handleReject(req: ApprovalRequest) {
    if (!currentUser || !rejectionReason.trim()) {
      showToast('Debes indicar un motivo de rechazo', 'error')
      return
    }
    setProcessing(req.id)
    try {
      const { error } = await supabase.from('approval_requests').update({
        status: 'rejected',
        approved_by: currentUser.id,
        approved_by_name: currentUser.name,
        rejection_reason: rejectionReason.trim(),
        resolved_at: new Date().toISOString(),
      }).eq('id', req.id)
      if (error) throw error
      setRequests(prev => prev.map(r => r.id === req.id ? {
        ...r, status: 'rejected' as const,
        approved_by: currentUser.id, approved_by_name: currentUser.name,
        rejection_reason: rejectionReason.trim(),
        resolved_at: new Date().toISOString(),
      } : r))
      setRejectingId(null)
      setRejectionReason('')
      showToast('Solicitud rechazada', 'success')
    } catch (err) {
      showToast('Error al rechazar solicitud', 'error')
      console.error(err)
    } finally {
      setProcessing(null)
    }
  }

  async function toggleRule(rule: ApprovalRule) {
    const { error } = await supabase.from('approval_rules').update({ active: !rule.active }).eq('id', rule.id)
    if (error) {
      showToast('Error al actualizar regla', 'error')
      return
    }
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: !r.active } : r))
    showToast(`Regla ${!rule.active ? 'activada' : 'desactivada'}`, 'success')
  }

  async function updateRuleThreshold(rule: ApprovalRule, value: number | undefined) {
    const { error } = await supabase.from('approval_rules').update({ auto_approve_threshold: value ?? null }).eq('id', rule.id)
    if (error) {
      showToast('Error al actualizar umbral', 'error')
      return
    }
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, auto_approve_threshold: value } : r))
  }

  async function updateRuleRole(rule: ApprovalRule, role: string) {
    const { error } = await supabase.from('approval_rules').update({ requires_role: role }).eq('id', rule.id)
    if (error) {
      showToast('Error al actualizar rol requerido', 'error')
      return
    }
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, requires_role: role } : r))
    showToast('Rol actualizado', 'success')
  }

  function renderDetails(details: Record<string, any>) {
    const entries = Object.entries(details)
    if (entries.length === 0) return null
    return (
      <div className="mt-2 space-y-1">
        {entries.map(([key, value]) => {
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
          const isChange = key.startsWith('original_') || key.startsWith('requested_') || key.startsWith('new_') || key.startsWith('old_')
          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 min-w-[100px]">{label}:</span>
              <span className={isChange ? 'text-amber-400 font-medium' : 'text-slate-300'}>
                {typeof value === 'number' ? value.toLocaleString('es-MX') : String(value)}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Aprobaciones</h1>
            <p className="text-xs text-slate-400">Gestiona solicitudes que requieren autorizacion</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`bg-slate-800/50 border rounded-xl p-4 ${pendingRequests.length > 0 ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/10' : 'border-slate-700/50'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Clock className={`w-4 h-4 text-yellow-400 ${pendingRequests.length > 0 ? 'animate-pulse' : ''}`} />
            <span className="text-xs text-slate-400">Pendientes</span>
          </div>
          <p className={`text-2xl font-bold ${pendingRequests.length > 0 ? 'text-yellow-400' : 'text-white'}`}>{pendingRequests.length}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Aprobadas hoy</span>
          </div>
          <p className="text-2xl font-bold text-white">{approvedToday.length}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <X className="w-4 h-4 text-red-400" />
            <span className="text-xs text-slate-400">Rechazadas hoy</span>
          </div>
          <p className="text-2xl font-bold text-white">{rejectedToday.length}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400">Tiempo promedio</span>
          </div>
          <p className="text-2xl font-bold text-white">{avgResolutionTime(requests)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 w-fit">
        {([
          { key: 'pending' as const, label: 'Pendientes', count: pendingRequests.length },
          { key: 'history' as const, label: 'Historial', count: undefined },
          { key: 'rules' as const, label: 'Reglas', count: undefined },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              tab === t.key
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="bg-yellow-500/20 text-yellow-400 text-xs px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'pending' && (
        <div className="space-y-3">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-16 bg-slate-800/30 border border-slate-700/50 rounded-xl">
              <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No hay solicitudes pendientes</p>
              <p className="text-slate-500 text-xs mt-1">Las solicitudes apareceran aqui cuando se necesiten aprobaciones</p>
            </div>
          ) : (
            pendingRequests.map(req => (
              <div key={req.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[req.type] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                        {TYPE_LABELS[req.type] || req.type}
                      </span>
                      <span className="text-xs text-slate-500">{req.entity_type}</span>
                    </div>
                    <p className="text-sm font-medium text-white truncate">{req.entity_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Solicitado por <span className="text-slate-300">{req.requested_by_name}</span> - {timeAgo(req.created_at)}
                    </p>
                    {req.reason && (
                      <p className="text-xs text-slate-400 mt-2 italic bg-slate-900/50 rounded px-2 py-1">
                        &ldquo;{req.reason}&rdquo;
                      </p>
                    )}
                    {renderDetails(req.details)}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {rejectingId === req.id ? (
                      <div className="space-y-2 w-56">
                        <textarea
                          value={rejectionReason}
                          onChange={e => setRejectionReason(e.target.value)}
                          placeholder="Motivo de rechazo..."
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(req)}
                            disabled={processing === req.id}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => { setRejectingId(null); setRejectionReason('') }}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApprove(req)}
                          disabled={processing === req.id}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => { setRejectingId(req.id); setRejectionReason('') }}
                          disabled={processing === req.id}
                          className="flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs px-4 py-2 rounded-lg font-medium transition-colors border border-red-500/30 disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          Rechazar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-800/30 border border-slate-700/50 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
            </div>
            <select
              value={historyTypeFilter}
              onChange={e => setHistoryTypeFilter(e.target.value)}
              className="bg-slate-800 border border-slate-600 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="all">Todos los tipos</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select
              value={historyStatusFilter}
              onChange={e => setHistoryStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-600 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="approved">Aprobadas</option>
              <option value="rejected">Rechazadas</option>
            </select>
            <input
              type="date"
              value={historyDateFrom}
              onChange={e => setHistoryDateFrom(e.target.value)}
              className="bg-slate-800 border border-slate-600 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
            />
            <input
              type="date"
              value={historyDateTo}
              onChange={e => setHistoryDateTo(e.target.value)}
              className="bg-slate-800 border border-slate-600 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
            />
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                placeholder="Buscar por entidad o solicitante..."
                className="w-full bg-slate-800 border border-slate-600 text-white text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Tipo</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Entidad</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Solicitante</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Resuelto por</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Estado</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Tiempo</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Fecha</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {historyRequests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-500">Sin resultados</td>
                    </tr>
                  ) : (
                    historyRequests.map(req => {
                      const resMs = req.resolved_at ? new Date(req.resolved_at).getTime() - new Date(req.created_at).getTime() : 0
                      const resHrs = resMs / 3600000
                      const resLabel = resHrs < 1 ? `${Math.round(resMs / 60000)}m` : resHrs < 24 ? `${resHrs.toFixed(1)}h` : `${(resHrs / 24).toFixed(1)}d`
                      const isExpanded = expandedCard === req.id
                      return (
                        <>
                          <tr key={req.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[req.type] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                                {TYPE_LABELS[req.type] || req.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-white">{req.entity_name}</td>
                            <td className="px-4 py-3 text-slate-300">{req.requested_by_name}</td>
                            <td className="px-4 py-3 text-slate-300">{req.approved_by_name || '--'}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_BADGES[req.status]}`}>
                                {STATUS_LABELS[req.status]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-400">{resLabel}</td>
                            <td className="px-4 py-3 text-slate-400">{new Date(req.created_at).toLocaleDateString('es-MX')}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => setExpandedCard(isExpanded ? null : req.id)} className="text-slate-400 hover:text-white">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${req.id}-detail`} className="border-b border-slate-700/30">
                              <td colSpan={8} className="px-6 py-3 bg-slate-900/50">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs text-slate-500 mb-1">Razon de solicitud:</p>
                                    <p className="text-xs text-slate-300 italic">{req.reason || 'Sin razon indicada'}</p>
                                  </div>
                                  {req.rejection_reason && (
                                    <div>
                                      <p className="text-xs text-slate-500 mb-1">Motivo de rechazo:</p>
                                      <p className="text-xs text-red-400 italic">{req.rejection_reason}</p>
                                    </div>
                                  )}
                                  {req.details && Object.keys(req.details).length > 0 && (
                                    <div className="col-span-2">
                                      <p className="text-xs text-slate-500 mb-1">Detalles:</p>
                                      {renderDetails(req.details)}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'rules' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">Configura que acciones requieren aprobacion y quien puede aprobarlas.</p>
          {rules.map(rule => (
            <div key={rule.id} className={`bg-slate-800/50 border rounded-xl p-4 transition-colors ${rule.active ? 'border-slate-700/50' : 'border-slate-700/30 opacity-60'}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[rule.type] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                      {TYPE_LABELS[rule.type] || rule.type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{rule.description}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Auto-approve threshold */}
                  {(rule.type === 'discount' || rule.type === 'price_change') && (
                    <div className="flex flex-col items-end gap-1">
                      <label className="text-xs text-slate-500">Auto-aprobar hasta %</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={rule.auto_approve_threshold ?? ''}
                        onChange={e => {
                          const val = e.target.value ? Number(e.target.value) : undefined
                          updateRuleThreshold(rule, val)
                        }}
                        className="w-20 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-blue-500"
                        placeholder="--"
                      />
                    </div>
                  )}

                  {/* Required role */}
                  <div className="flex flex-col items-end gap-1">
                    <label className="text-xs text-slate-500">Rol requerido</label>
                    <select
                      value={rule.requires_role}
                      onChange={e => updateRuleRole(rule, e.target.value)}
                      className="bg-slate-900 border border-slate-600 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500"
                    >
                      <option value="admin">Admin</option>
                      <option value="coordinador">Coordinador</option>
                    </select>
                  </div>

                  {/* Toggle */}
                  <button onClick={() => toggleRule(rule)} className="p-1" title={rule.active ? 'Desactivar' : 'Activar'}>
                    {rule.active ? (
                      <ToggleRight className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
