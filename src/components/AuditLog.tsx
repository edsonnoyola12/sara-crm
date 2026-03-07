import { useState, useEffect, useMemo } from 'react'
import { History, User, Edit, Plus, Trash2, ArrowRight, Search, Filter, ChevronDown, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { AuditEntry } from '../types/crm'

interface AuditLogProps {
  entityType?: AuditEntry['entity_type']
  entityId?: string
}

const ACTION_LABELS: Record<string, string> = {
  create: 'creo',
  update: 'actualizo',
  delete: 'elimino',
  status_change: 'cambio el estado de',
}

const ACTION_ICONS: Record<string, typeof Edit> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  status_change: ArrowRight,
}

const ACTION_COLORS: Record<string, string> = {
  create: 'text-green-400 bg-green-500/20',
  update: 'text-blue-400 bg-blue-500/20',
  delete: 'text-red-400 bg-red-500/20',
  status_change: 'text-amber-400 bg-amber-500/20',
}

const ENTITY_LABELS: Record<string, string> = {
  lead: 'Lead',
  property: 'Propiedad',
  mortgage: 'Hipoteca',
  appointment: 'Cita',
  team_member: 'Miembro',
  campaign: 'Campana',
  promotion: 'Promocion',
  event: 'Evento',
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `hace ${days}d`
  const months = Math.floor(days / 30)
  return `hace ${months} mes${months > 1 ? 'es' : ''}`
}

function formatValue(val: any): string {
  if (val === null || val === undefined) return '(vacio)'
  if (typeof val === 'boolean') return val ? 'Si' : 'No'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

const PAGE_SIZE = 50

export default function AuditLog({ entityType, entityId }: AuditLogProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEntityType, setFilterEntityType] = useState<string>(entityType || 'all')
  const [filterAction, setFilterAction] = useState<string>('all')
  const [filterUser, setFilterUser] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function loadEntries(reset = false) {
    setLoading(true)
    const currentPage = reset ? 0 : page
    if (reset) setPage(0)

    let query = supabase
      .from('audit_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1)

    if (entityType && entityId) {
      query = query.eq('entity_type', entityType).eq('entity_id', entityId)
    } else if (entityType) {
      query = query.eq('entity_type', entityType)
    }

    const { data, error } = await query
    if (error) {
      console.error('Error loading audit log:', error)
      setLoading(false)
      return
    }

    const newEntries = (data || []) as AuditEntry[]
    if (reset) {
      setEntries(newEntries)
    } else {
      setEntries(prev => currentPage === 0 ? newEntries : [...prev, ...newEntries])
    }
    setHasMore(newEntries.length === PAGE_SIZE)
    setLoading(false)
  }

  useEffect(() => {
    loadEntries(true)
  }, [entityType, entityId])

  const uniqueUsers = useMemo(() => {
    const users = new Map<string, string>()
    entries.forEach(e => users.set(e.user_id, e.user_name))
    return Array.from(users.entries()).map(([id, name]) => ({ id, name }))
  }, [entries])

  const filtered = useMemo(() => {
    let result = entries
    if (filterEntityType !== 'all' && !entityType) {
      result = result.filter(e => e.entity_type === filterEntityType)
    }
    if (filterAction !== 'all') {
      result = result.filter(e => e.action === filterAction)
    }
    if (filterUser !== 'all') {
      result = result.filter(e => e.user_id === filterUser)
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(e =>
        e.entity_name.toLowerCase().includes(term) ||
        e.user_name.toLowerCase().includes(term) ||
        Object.keys(e.changes || {}).some(k => k.toLowerCase().includes(term))
      )
    }
    return result
  }, [entries, filterEntityType, filterAction, filterUser, searchTerm, entityType])

  function loadMore() {
    setPage(prev => prev + 1)
  }

  useEffect(() => {
    if (page > 0) loadEntries()
  }, [page])

  const isCompact = !!entityId

  return (
    <div className="space-y-4">
      {/* Header */}
      {!isCompact && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <History size={20} className="text-blue-400" />
            Historial de Cambios
          </h3>
          <button onClick={() => loadEntries(true)} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-sm transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>
      )}

      {/* Search + Filter toggle */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre de entidad..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        {!isCompact && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-all ${showFilters ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-slate-700/50 border-slate-600/50 text-slate-400 hover:text-white'}`}
          >
            <Filter size={14} /> Filtros <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && !isCompact && (
        <div className="flex flex-wrap gap-3 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
          <select
            value={filterEntityType}
            onChange={e => setFilterEntityType(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Tipo: Todos</option>
            {Object.entries(ENTITY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Accion: Todas</option>
            <option value="create">Crear</option>
            <option value="update">Actualizar</option>
            <option value="delete">Eliminar</option>
            <option value="status_change">Cambio de Estado</option>
          </select>
          <select
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Usuario: Todos</option>
            {uniqueUsers.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Results count */}
      <div className="text-xs text-slate-500">
        {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Timeline */}
      {loading && entries.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <History size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-semibold">Sin registros</p>
          <p className="text-sm text-slate-500">No hay cambios registrados{entityId ? ' para esta entidad' : ''}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((entry) => {
            const Icon = ACTION_ICONS[entry.action] || Edit
            const colorClass = ACTION_COLORS[entry.action] || 'text-slate-400 bg-slate-500/20'
            const changeKeys = Object.keys(entry.changes || {})
            const isExpanded = expandedId === entry.id

            return (
              <div
                key={entry.id}
                className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden transition-all hover:border-slate-600/50"
              >
                {/* Main row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                >
                  {/* Action icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon size={14} />
                  </div>

                  {/* User initial */}
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {(entry.user_name || '?')[0].toUpperCase()}
                  </div>

                  {/* Description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      <span className="font-medium text-white">{entry.user_name}</span>
                      {' '}
                      <span className="text-slate-400">{ACTION_LABELS[entry.action] || entry.action}</span>
                      {' '}
                      <span className="text-slate-300">{ENTITY_LABELS[entry.entity_type] || entry.entity_type}</span>
                      {' '}
                      <span className="font-medium text-white">'{entry.entity_name}'</span>
                    </p>
                    {changeKeys.length > 0 && !isExpanded && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {changeKeys.length} campo{changeKeys.length > 1 ? 's' : ''}: {changeKeys.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">{timeAgo(entry.timestamp)}</span>

                  {/* Expand indicator */}
                  {changeKeys.length > 0 && (
                    <ChevronDown size={14} className={`text-slate-500 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                  )}
                </div>

                {/* Expanded changes */}
                {isExpanded && changeKeys.length > 0 && (
                  <div className="px-4 pb-3 border-t border-slate-700/30 pt-2">
                    <div className="space-y-1.5">
                      {changeKeys.map(field => {
                        const change = entry.changes[field]
                        return (
                          <div key={field} className="flex items-start gap-2 text-sm">
                            <span className="text-slate-400 font-mono text-xs min-w-[120px] pt-0.5 shrink-0">{field}</span>
                            <div className="flex items-center gap-2 min-w-0 flex-wrap">
                              {entry.action !== 'create' && (
                                <span className="bg-red-500/15 text-red-400 px-2 py-0.5 rounded text-xs font-mono line-through max-w-[200px] truncate">
                                  {formatValue(change.old)}
                                </span>
                              )}
                              <ArrowRight size={12} className="text-slate-600 shrink-0" />
                              <span className="bg-green-500/15 text-green-400 px-2 py-0.5 rounded text-xs font-mono max-w-[200px] truncate">
                                {formatValue(change.new)}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      {new Date(entry.timestamp).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                )}
              </div>
            )
          })}

          {/* Load more */}
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full py-3 text-sm text-blue-400 hover:text-blue-300 bg-slate-800/30 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : null}
              {loading ? 'Cargando...' : 'Cargar mas'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
