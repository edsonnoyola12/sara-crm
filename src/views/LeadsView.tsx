import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Plus, X, Phone, FileSpreadsheet, ChevronDown, ChevronRight, CheckSquare, Save, LayoutList, Columns3, Upload, Download, Users } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ImportExportModal from '../components/ImportExportModal'
import EmptyState from '../components/EmptyState'
import { useCrm } from '../context/CrmContext'
import type { Lead } from '../types/crm'
import { STATUS_LABELS, getScoreColor, getScoreLabel } from '../types/crm'

// ---- Lightweight virtual scroll hook ----
function useVirtualScroll<T>({
  items,
  rowHeight,
  containerRef,
  overscan = 5,
}: {
  items: T[]
  rowHeight: number
  containerRef: React.RefObject<HTMLDivElement | null>
  overscan?: number
}) {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })
    ro.observe(el)
    setContainerHeight(el.clientHeight)
    return () => ro.disconnect()
  }, [containerRef])

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop((e.target as HTMLDivElement).scrollTop)
  }, [])

  const totalHeight = items.length * rowHeight

  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const visibleCount = Math.ceil(containerHeight / rowHeight) + 2 * overscan
  const endIndex = Math.min(items.length, startIndex + visibleCount)

  const virtualItems = useMemo(() => {
    const result: { index: number; offsetTop: number; item: T }[] = []
    for (let i = startIndex; i < endIndex; i++) {
      result.push({ index: i, offsetTop: i * rowHeight, item: items[i] })
    }
    return result
  }, [items, startIndex, endIndex, rowHeight])

  return { virtualItems, totalHeight, onScroll }
}

// ---- Kanban column definitions ----
const KANBAN_MAIN_COLUMNS = [
  { key: 'new', headerBg: 'bg-slate-600' },
  { key: 'contacted', headerBg: 'bg-blue-600' },
  { key: 'qualified', headerBg: 'bg-indigo-600' },
  { key: 'scheduled', headerBg: 'bg-cyan-600' },
  { key: 'visited', headerBg: 'bg-purple-600' },
  { key: 'negotiation', headerBg: 'bg-yellow-600' },
  { key: 'reserved', headerBg: 'bg-orange-600' },
  { key: 'closed', headerBg: 'bg-green-600' },
  { key: 'delivered', headerBg: 'bg-emerald-600' },
  { key: 'sold', headerBg: 'bg-teal-600' },
]

const KANBAN_DIMMED_COLUMNS = [
  { key: 'lost', colorHeader: 'bg-red-800/60', colorBorder: 'border-red-700/40', colorText: 'text-red-300', colorBadge: 'bg-red-600/30 text-red-300' },
  { key: 'fallen', colorHeader: 'bg-red-800/50', colorBorder: 'border-red-700/30', colorText: 'text-red-400', colorBadge: 'bg-red-600/30 text-red-400' },
]

type SavedFilter = {
  id: string
  name: string
  filters: {
    status?: string[]
    scoreRange?: 'all' | 'hot' | 'warm' | 'cold'
    vendedor?: string
    desarrollo?: string
    dateRange?: 'all' | 'today' | 'week' | 'month'
  }
}

interface LeadsViewProps {
  onSelectLead: (lead: Lead) => void
}

export default function LeadsView({ onSelectLead }: LeadsViewProps) {
  const {
    leads, setLeads, team, currentUser, permisos, showToast, supabase, filteredLeads, loading, saveLead,
  } = useCrm()

  // ---- Local UI state ----
  const [leadViewMode, setLeadViewMode] = useState<'list' | 'kanban'>('list')
  const [leadFilters, setLeadFilters] = useState<{
    status: string[]
    scoreRange: 'all' | 'hot' | 'warm' | 'cold'
    vendedor: string
    desarrollo: string
    dateRange: 'all' | 'today' | 'week' | 'month'
  }>({ status: [], scoreRange: 'all', vendedor: '', desarrollo: '', dateRange: 'all' })
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    try {
      const saved = localStorage.getItem('sara-saved-filters')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [showBulkAssign, setShowBulkAssign] = useState(false)
  const [showBulkStatus, setShowBulkStatus] = useState(false)
  const [leadSort, setLeadSort] = useState<{ col: string; asc: boolean }>({ col: 'created_at', asc: false })
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [showOtherStages, setShowOtherStages] = useState(false)
  const [statusChange, setStatusChange] = useState<{ lead: Lead; newStatus: string } | null>(null)
  const [statusNote, setStatusNote] = useState('')
  const [showNewLead, setShowNewLead] = useState(false)
  const [newLead, setNewLead] = useState({ name: '', phone: '', property_interest: '', budget: '', status: 'new' })
  const [saving, setSaving] = useState(false)
  const [showImportExport, setShowImportExport] = useState(false)
  const [importExportTab, setImportExportTab] = useState<'import' | 'export'>('export')

  // Persist saved filters to localStorage
  useEffect(() => {
    localStorage.setItem('sara-saved-filters', JSON.stringify(savedFilters))
  }, [savedFilters])

  // ---- Computed ----
  const isAnyFilterActive = leadFilters.status.length > 0 || leadFilters.scoreRange !== 'all' || leadFilters.vendedor !== '' || leadFilters.desarrollo !== '' || leadFilters.dateRange !== 'all'

  const hotLeads = filteredLeads.filter(l => l.score >= 70).length
  const warmLeads = filteredLeads.filter(l => l.score >= 40 && l.score < 70).length
  const coldLeads = filteredLeads.filter(l => l.score < 40).length

  const displayLeads = useMemo(() => {
    let result = filteredLeads
    if (leadFilters.status.length > 0) result = result.filter(l => leadFilters.status.includes(l.status))
    if (leadFilters.scoreRange === 'hot') result = result.filter(l => l.score >= 70)
    else if (leadFilters.scoreRange === 'warm') result = result.filter(l => l.score >= 40 && l.score < 70)
    else if (leadFilters.scoreRange === 'cold') result = result.filter(l => l.score < 40)
    if (leadFilters.vendedor) result = result.filter(l => l.assigned_to === leadFilters.vendedor)
    if (leadFilters.desarrollo) result = result.filter(l => l.property_interest?.toLowerCase().includes(leadFilters.desarrollo.toLowerCase()))
    if (leadFilters.dateRange !== 'all') {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      if (leadFilters.dateRange === 'today') result = result.filter(l => new Date(l.created_at) >= startOfDay)
      else if (leadFilters.dateRange === 'week') {
        const weekAgo = new Date(startOfDay); weekAgo.setDate(weekAgo.getDate() - 7)
        result = result.filter(l => new Date(l.created_at) >= weekAgo)
      } else if (leadFilters.dateRange === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        result = result.filter(l => new Date(l.created_at) >= monthStart)
      }
    }
    return result
  }, [filteredLeads, leadFilters])

  // ---- CSV export ----
  const exportLeadsCSV = () => {
    const headers = ['Nombre', 'Telefono', 'Interes', 'Score', 'Estado', 'Vendedor', 'Fecha']
    const rows = displayLeads.map(l => [
      l.name || 'Sin nombre',
      l.phone || '',
      l.property_interest || '',
      String(l.score || 0),
      STATUS_LABELS[l.status] || l.status,
      team.find(t => t.id === l.assigned_to)?.name || '',
      l.created_at ? new Date(l.created_at).toLocaleDateString('es-MX') : ''
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
    showToast(`${displayLeads.length} leads exportados`, 'success')
  }

  // ---- Sorted leads for table (memoized) ----
  const sortedLeads = useMemo(() => {
    return [...displayLeads].sort((a: any, b: any) => {
      const va = a[leadSort.col] ?? ''
      const vb = b[leadSort.col] ?? ''
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb))
      return leadSort.asc ? cmp : -cmp
    })
  }, [displayLeads, leadSort])

  // ---- Virtual scroll for table ----
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const ROW_HEIGHT = 56
  const { virtualItems, totalHeight, onScroll: onTableScroll } = useVirtualScroll({
    items: sortedLeads,
    rowHeight: ROW_HEIGHT,
    containerRef: tableContainerRef,
    overscan: 5,
  })

  // ---- Kanban drag-and-drop handler ----
  const handleKanbanDrop = async (targetStatus: string, targetLabel: string) => {
    if (draggedLead && draggedLead.status !== targetStatus && permisos.puedeCambiarStatusLead(draggedLead)) {
      const timestamp = new Date().toISOString()
      const historyEntry = { date: timestamp, from: draggedLead.status, to: targetStatus, note: 'Movido desde Kanban' }
      const existingHistory = draggedLead.notes?.status_history || []
      const newNotes = { ...(draggedLead.notes || {}), status_history: [...existingHistory, historyEntry] }
      await supabase.from('leads').update({ status: targetStatus, status_changed_at: timestamp, notes: newNotes }).eq('id', draggedLead.id)
      setLeads(leads.map(l => l.id === draggedLead.id ? { ...l, status: targetStatus, status_changed_at: timestamp, notes: newNotes } : l))
      showToast(`${draggedLead.name || 'Lead'} movido a ${targetLabel}`, 'success')
    }
    setDraggedLead(null)
  }

  // ---- Kanban time-since helper ----
  const getTimeSince = (lead: Lead) => {
    const refDate = lead.last_message_at || lead.status_changed_at || lead.created_at
    if (!refDate) return { label: '-', daysSince: 0 }
    const msSince = Date.now() - new Date(refDate).getTime()
    const minsSince = Math.floor(msSince / 60000)
    const hrsSince = Math.floor(minsSince / 60)
    const daysSince = Math.floor(hrsSince / 24)
    const label = minsSince < 60 ? (minsSince < 2 ? 'Ahora' : `${minsSince}m`) : hrsSince < 24 ? `${hrsSince}h` : daysSince === 1 ? 'Ayer' : `${daysSince}d`
    return { label, daysSince }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        title="Leads"
        subtitle="Gestion de prospectos"
        badge={displayLeads.length}
        actions={
          <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
            <div className="flex gap-0.5 bg-slate-700/50 rounded-lg p-0.5">
              <button onClick={() => setLeadViewMode('list')} className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors ${leadViewMode === 'list' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}>
                <LayoutList size={14} /> Lista
              </button>
              <button onClick={() => setLeadViewMode('kanban')} className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors ${leadViewMode === 'kanban' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}>
                <Columns3 size={14} /> Kanban
              </button>
            </div>
            <button onClick={() => { setImportExportTab('import'); setShowImportExport(true) }} className="bg-slate-700 px-3 py-2 rounded-xl hover:bg-slate-600 flex items-center gap-2 text-sm" title="Importar CSV">
              <Upload size={16} /> <span className="hidden sm:inline">Importar</span>
            </button>
            <button onClick={() => { setImportExportTab('export'); setShowImportExport(true) }} className="bg-slate-700 px-3 py-2 rounded-xl hover:bg-slate-600 flex items-center gap-2 text-sm" title="Exportar CSV">
              <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
            </button>
            {permisos.puedeCrearLead() && (
              <button onClick={() => setShowNewLead(true)} className="bg-green-600 px-4 py-2 rounded-xl hover:bg-green-700 flex items-center gap-2">
                <Plus size={20} /> Agregar Lead
              </button>
            )}
            {permisos.puedeVerLeadsReadOnly() && (
              <span className="text-xs text-slate-400 bg-slate-700 px-3 py-2 rounded-lg">Solo lectura</span>
            )}
            <div className="hidden sm:flex gap-2">
              <span className="bg-red-500 px-3 py-1 rounded-full text-sm">HOT ({hotLeads})</span>
              <span className="bg-orange-500 px-3 py-1 rounded-full text-sm">WARM ({warmLeads})</span>
              <span className="bg-blue-500 px-3 py-1 rounded-full text-sm">COLD ({coldLeads})</span>
            </div>
          </div>
        }
      />

      {/* Advanced Filter Bar */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status chips */}
          <div className="flex flex-wrap gap-1">
            {['new', 'contacted', 'scheduled', 'visited', 'negotiation', 'reserved', 'closed'].map(s => {
              const count = leads.filter(l => l.status === s).length
              return (
                <button key={s} onClick={() => setLeadFilters(prev => ({
                  ...prev, status: prev.status.includes(s) ? prev.status.filter(x => x !== s) : [...prev.status, s]
                }))} className={`filter-chip px-2.5 py-1 rounded-full text-xs font-medium ${
                  leadFilters.status.includes(s) ? 'bg-blue-600 text-white filter-chip-active' : 'bg-slate-700 text-slate-300'
                }`}>
                  {STATUS_LABELS[s] || s}{count > 0 ? ` (${count})` : ''}
                </button>
              )
            })}
          </div>

          <div className="w-px h-6 bg-slate-600 mx-1" />

          {/* Score range */}
          <div className="flex gap-1">
            {[
              { key: 'all' as const, label: 'Todos', color: 'bg-slate-600' },
              { key: 'hot' as const, label: 'HOT', color: 'bg-red-600' },
              { key: 'warm' as const, label: 'WARM', color: 'bg-orange-600' },
              { key: 'cold' as const, label: 'COLD', color: 'bg-blue-600' }
            ].map(r => (
              <button key={r.key} onClick={() => setLeadFilters(prev => ({ ...prev, scoreRange: r.key }))}
                className={`filter-chip px-2.5 py-1 rounded-full text-xs font-medium ${
                  leadFilters.scoreRange === r.key ? `${r.color} text-white filter-chip-active` : 'bg-slate-700 text-slate-300'
                }`}>
                {r.label}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-slate-600 mx-1" />

          {/* Vendedor dropdown */}
          <select value={leadFilters.vendedor} onChange={e => setLeadFilters(prev => ({ ...prev, vendedor: e.target.value }))}
            className="bg-slate-700 text-sm rounded-lg px-2.5 py-1.5 border border-slate-600 text-slate-200 max-w-[140px]">
            <option value="">Vendedor...</option>
            {team.filter(t => t.role === 'vendedor' && t.active).map(t => (
              <option key={t.id} value={t.id}>{t.name?.split(' ')[0]}</option>
            ))}
          </select>

          {/* Date range */}
          <select value={leadFilters.dateRange} onChange={e => setLeadFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
            className="bg-slate-700 text-sm rounded-lg px-2.5 py-1.5 border border-slate-600 text-slate-200 max-w-[130px]">
            <option value="all">Todo el tiempo</option>
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
          </select>

          {/* Clear filters */}
          {(leadFilters.status.length > 0 || leadFilters.scoreRange !== 'all' || leadFilters.vendedor || leadFilters.dateRange !== 'all') && (
            <button onClick={() => setLeadFilters({ status: [], scoreRange: 'all', vendedor: '', desarrollo: '', dateRange: 'all' })}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-700">
              <X size={14} className="inline mr-1" />Limpiar
            </button>
          )}

          {/* Saved filter presets */}
          <div className="sm:ml-auto flex flex-wrap gap-1.5 items-center">
            {savedFilters.map(sf => (
              <span key={sf.id} className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700/50 rounded-full px-3 py-1 text-xs text-slate-300 hover:border-slate-500 transition-colors group">
                <button onClick={() => setLeadFilters({
                  status: sf.filters.status || [],
                  scoreRange: sf.filters.scoreRange || 'all',
                  vendedor: sf.filters.vendedor || '',
                  desarrollo: sf.filters.desarrollo || '',
                  dateRange: sf.filters.dateRange || 'all',
                })} className="hover:text-white">
                  {sf.name}
                </button>
                <button onClick={(e) => {
                  e.stopPropagation()
                  setSavedFilters(prev => prev.filter(f => f.id !== sf.id))
                }} className="text-slate-500 hover:text-red-400 transition-colors ml-0.5" title="Eliminar filtro">
                  <X size={12} />
                </button>
              </span>
            ))}
            {isAnyFilterActive && (
              <button onClick={() => {
                const name = prompt('Nombre para este filtro:')
                if (name?.trim()) {
                  const newFilter: SavedFilter = {
                    id: crypto.randomUUID(),
                    name: name.trim(),
                    filters: {
                      status: leadFilters.status.length > 0 ? [...leadFilters.status] : undefined,
                      scoreRange: leadFilters.scoreRange !== 'all' ? leadFilters.scoreRange : undefined,
                      vendedor: leadFilters.vendedor || undefined,
                      desarrollo: leadFilters.desarrollo || undefined,
                      dateRange: leadFilters.dateRange !== 'all' ? leadFilters.dateRange : undefined,
                    },
                  }
                  setSavedFilters(prev => [...prev, newFilter])
                  showToast(`Filtro "${name.trim()}" guardado`, 'success')
                }
              }} className="bg-slate-800 border border-slate-700/50 rounded-full px-3 py-1 text-xs text-slate-300 hover:border-blue-500/50 hover:text-blue-300 transition-colors flex items-center gap-1">
                <Save size={12} />Guardar filtro
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedLeads.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl px-3 sm:px-6 py-3 flex flex-wrap items-center gap-2 sm:gap-4 max-w-[calc(100%-2rem)] w-auto">
          <span className="text-sm font-semibold text-blue-400">
            <CheckSquare size={16} className="inline mr-1" />{selectedLeads.size} seleccionados
          </span>
          <div className="w-px h-6 bg-slate-600" />
          <div className="relative">
            <button onClick={() => { setShowBulkAssign(!showBulkAssign); setShowBulkStatus(false) }} className="text-sm bg-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-600">
              Asignar vendedor <ChevronDown size={14} className="inline ml-1" />
            </button>
            {showBulkAssign && (
              <div className="absolute bottom-full mb-2 left-0 bg-slate-700 border border-slate-600 rounded-xl shadow-xl p-2 min-w-[180px]">
                {team.filter(t => t.role === 'vendedor' && t.active).map(t => (
                  <button key={t.id} onClick={async () => {
                    const ids = Array.from(selectedLeads)
                    for (const id of ids) {
                      await saveLead({ id, assigned_to: t.id })
                    }
                    setSelectedLeads(new Set())
                    setShowBulkAssign(false)
                    showToast(`${ids.length} leads asignados a ${t.name}`, 'success')
                  }} className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-slate-600 truncate">
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button onClick={() => { setShowBulkStatus(!showBulkStatus); setShowBulkAssign(false) }} className="text-sm bg-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-600">
              Cambiar status <ChevronDown size={14} className="inline ml-1" />
            </button>
            {showBulkStatus && (
              <div className="absolute bottom-full mb-2 left-0 bg-slate-700 border border-slate-600 rounded-xl shadow-xl p-2 min-w-[180px]">
                {['new', 'contacted', 'scheduled', 'visited', 'negotiation', 'reserved', 'closed'].map(s => (
                  <button key={s} onClick={async () => {
                    const ids = Array.from(selectedLeads)
                    for (const id of ids) {
                      await saveLead({ id, status: s })
                    }
                    setSelectedLeads(new Set())
                    setShowBulkStatus(false)
                    showToast(`${ids.length} leads movidos a ${STATUS_LABELS[s]}`, 'success')
                  }} className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-slate-600">
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => {
            const selected = displayLeads.filter(l => selectedLeads.has(l.id))
            const headers = ['Nombre', 'Telefono', 'Interes', 'Score', 'Estado', 'Vendedor', 'Fecha']
            const rows = selected.map(l => [
              l.name || '', l.phone || '', l.property_interest || '', l.score, STATUS_LABELS[l.status] || l.status,
              team.find(t => t.id === l.assigned_to)?.name || '', l.created_at ? new Date(l.created_at).toLocaleDateString('es-MX') : ''
            ])
            const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = `leads_seleccionados_${new Date().toISOString().split('T')[0]}.csv`
            a.click(); URL.revokeObjectURL(url)
            showToast(`${selected.length} leads exportados`, 'success')
          }} className="text-sm bg-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-600">
            <FileSpreadsheet size={14} className="inline mr-1" />Exportar seleccion
          </button>
          <button onClick={() => setSelectedLeads(new Set())} className="text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-700">
            <X size={14} className="inline mr-1" />Deseleccionar
          </button>
        </div>
      )}

      {!loading && leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay leads"
          description="Agrega tu primer lead para comenzar a gestionar tu pipeline de ventas."
          actionLabel="Agregar Lead"
          onAction={() => setShowNewLead(true)}
        />
      ) : leadViewMode === 'kanban' ? (
        <div className="space-y-3">
          {/* Kanban Pipeline Board */}
          <div className="overflow-x-auto kanban-scroll pb-4" style={{ scrollbarGutter: 'stable' }}>
            <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
              {/* Main pipeline columns */}
              {KANBAN_MAIN_COLUMNS.map(stage => {
                const stageLabel = STATUS_LABELS[stage.key] || stage.key
                const stageLeads = displayLeads.filter(l => l.status === stage.key)
                const isOver = dragOverColumn === stage.key
                return (
                  <div
                    key={stage.key}
                    className={`w-[250px] flex-shrink-0 bg-slate-800/70 rounded-xl border-2 transition-all duration-200 ${
                      isOver ? 'border-blue-400 bg-slate-800/90 shadow-lg shadow-blue-500/10' : 'border-slate-700/50'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverColumn(stage.key) }}
                    onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverColumn(null) }}
                    onDrop={async (e) => {
                      e.preventDefault()
                      setDragOverColumn(null)
                      await handleKanbanDrop(stage.key, stageLabel)
                    }}
                  >
                    {/* Column Header */}
                    <div className={`${stage.headerBg} px-3 py-2.5 rounded-t-[10px] flex items-center justify-between`}>
                      <span className="font-semibold text-sm text-white">{stageLabel}</span>
                      <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-xs font-bold min-w-[24px] text-center">{stageLeads.length}</span>
                    </div>
                    {/* Cards */}
                    <div className="p-2 space-y-2 min-h-[100px] max-h-[65vh] overflow-y-auto">
                      {stageLeads.map(lead => {
                        const { label: timeLabel, daysSince } = getTimeSince(lead)
                        const scoreColorClass = lead.score >= 70 ? 'bg-red-500 text-white' : lead.score >= 40 ? 'bg-amber-500 text-white' : 'bg-slate-600 text-slate-300'
                        const scoreTemp = lead.score >= 70 ? 'HOT' : lead.score >= 40 ? 'WARM' : 'COLD'
                        return (
                          <div
                            key={lead.id}
                            draggable={permisos.puedeCambiarStatusLead(lead)}
                            onDragStart={(e) => { setDraggedLead(lead); e.dataTransfer.effectAllowed = 'move' }}
                            onDragEnd={() => { setDraggedLead(null); setDragOverColumn(null) }}
                            className={`bg-slate-900/60 rounded-lg p-3 cursor-pointer border border-slate-700/60 hover:border-slate-500/80 hover:bg-slate-800/80 transition-all duration-150 ${
                              draggedLead?.id === lead.id ? 'opacity-40 scale-95' : ''
                            } ${permisos.puedeCambiarStatusLead(lead) ? 'cursor-grab active:cursor-grabbing' : ''}`}
                            onClick={() => onSelectLead(lead)}
                          >
                            {/* Name + Score badge */}
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <p className="font-semibold text-sm text-white truncate flex-1" title={lead.name || 'Sin nombre'}>{lead.name || 'Sin nombre'}</p>
                              <span className={`${scoreColorClass} px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 leading-tight`} title={`Score: ${lead.score}`}>
                                {scoreTemp} {lead.score}
                              </span>
                            </div>
                            {/* Phone */}
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <Phone size={10} className="flex-shrink-0" />
                              {lead.phone ? `...${lead.phone.slice(-4)}` : 'Sin tel'}
                            </p>
                            {/* Property interest */}
                            {lead.property_interest && (
                              <p className="text-xs text-slate-500 mt-1 truncate" title={lead.property_interest}>{lead.property_interest}</p>
                            )}
                            {/* Time since update + assigned vendedor */}
                            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-700/40">
                              <span className={`text-[10px] ${daysSince > 7 ? 'text-red-400' : daysSince > 2 ? 'text-yellow-400' : 'text-slate-500'}`}>
                                {timeLabel}
                              </span>
                              {lead.assigned_to && (
                                <span className="text-[10px] text-slate-500 truncate max-w-[80px]" title={team.find(t => t.id === lead.assigned_to)?.name}>
                                  {team.find(t => t.id === lead.assigned_to)?.name?.split(' ')[0] || ''}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      {stageLeads.length === 0 && (
                        <div className={`text-center text-xs py-8 rounded-lg border-2 border-dashed transition-colors ${
                          isOver ? 'border-blue-400/50 text-blue-300/70 bg-blue-500/5' : 'border-slate-700/30 text-slate-600'
                        }`}>
                          {isOver ? 'Soltar aqui' : 'Sin leads'}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Collapsed/dimmed: Lost & Fallen columns */}
              {KANBAN_DIMMED_COLUMNS.map(col => {
                const colLabel = STATUS_LABELS[col.key] || col.key
                const colLeads = displayLeads.filter(l => l.status === col.key)
                const isOver = dragOverColumn === col.key
                return (
                  <div
                    key={col.key}
                    className={`w-[180px] flex-shrink-0 rounded-xl border-2 transition-all duration-200 opacity-50 hover:opacity-85 bg-slate-900/40 ${
                      isOver ? 'border-red-400 opacity-85' : col.colorBorder
                    }`}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverColumn(col.key) }}
                    onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverColumn(null) }}
                    onDrop={async (e) => {
                      e.preventDefault()
                      setDragOverColumn(null)
                      await handleKanbanDrop(col.key, colLabel)
                    }}
                  >
                    {/* Collapsed Column Header */}
                    <div className={`${col.colorHeader} px-3 py-2.5 rounded-t-[10px] flex items-center justify-between`}>
                      <span className={`font-semibold text-sm ${col.colorText}`}>{colLabel}</span>
                      <span className={`${col.colorBadge} px-2 py-0.5 rounded-full text-xs font-bold min-w-[24px] text-center`}>{colLeads.length}</span>
                    </div>
                    {/* Collapsed Cards - compact with expand toggle */}
                    <div className="p-1.5 space-y-1 max-h-[65vh] overflow-y-auto">
                      {showOtherStages ? (
                        <>
                          {colLeads.map(lead => (
                            <div
                              key={lead.id}
                              onClick={() => onSelectLead(lead)}
                              className="bg-slate-900/40 rounded-md px-2 py-1.5 cursor-pointer hover:bg-slate-800/60 transition-colors border border-slate-700/30"
                            >
                              <p className="text-xs font-medium text-slate-300 truncate">{lead.name || 'Sin nombre'}</p>
                              <span className="text-[10px] text-slate-500">...{lead.phone?.slice(-4)}</span>
                            </div>
                          ))}
                          {colLeads.length > 0 && (
                            <button
                              onClick={() => setShowOtherStages(false)}
                              className="w-full text-center text-[10px] text-slate-500 hover:text-slate-300 py-1"
                            >
                              Colapsar
                            </button>
                          )}
                        </>
                      ) : colLeads.length > 0 ? (
                        <button
                          onClick={() => setShowOtherStages(true)}
                          className={`w-full text-center text-xs py-3 ${col.colorText} hover:underline`}
                        >
                          Ver {colLeads.length} lead{colLeads.length !== 1 ? 's' : ''}
                        </button>
                      ) : (
                        <div className={`text-center text-xs py-4 ${isOver ? 'text-red-300/70' : 'text-slate-600'}`}>
                          {isOver ? 'Soltar aqui' : '-'}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {/* Sticky table header */}
        <div className="flex-shrink-0 bg-slate-700">
          <div className="flex items-center">
            <div className="p-4 w-10 flex-shrink-0">
              <input type="checkbox" className="accent-blue-500 w-4 h-4 cursor-pointer"
                checked={displayLeads.length > 0 && displayLeads.every(l => selectedLeads.has(l.id))}
                onChange={(e) => {
                  if (e.target.checked) setSelectedLeads(new Set(displayLeads.map(l => l.id)))
                  else setSelectedLeads(new Set())
                }}
              />
            </div>
            {[
              { col: 'name', label: 'Nombre', hide: '', flex: 'flex-1 min-w-0' },
              { col: 'phone', label: 'Telefono', hide: 'hidden sm:block', flex: 'flex-1 min-w-0' },
              { col: 'property_interest', label: 'Interes', hide: 'hidden md:block', flex: 'flex-1 min-w-0' },
              { col: 'score', label: 'Score', hide: '', flex: 'w-[100px] flex-shrink-0' },
              { col: 'status', label: 'Estado', hide: '', flex: 'w-[130px] flex-shrink-0' },
              { col: 'assigned_to', label: 'Vendedor', hide: 'hidden lg:block', flex: 'w-[130px] flex-shrink-0' },
              { col: 'last_message_at', label: 'Contacto', hide: 'hidden md:block', flex: 'w-[80px] flex-shrink-0' },
              { col: 'created_at', label: 'Fecha', hide: 'hidden lg:block', flex: 'w-[90px] flex-shrink-0' },
            ].map(h => (
              <div key={h.col} className={`p-4 cursor-pointer select-none hover:text-blue-400 font-semibold text-sm ${h.hide} ${h.flex}`} onClick={() => setLeadSort(prev => ({ col: h.col, asc: prev.col === h.col ? !prev.asc : true }))}>
                {h.label} {leadSort.col === h.col ? (leadSort.asc ? '\u2191' : '\u2193') : ''}
              </div>
            ))}
          </div>
        </div>
        {/* Virtualized scrollable body */}
        <div ref={tableContainerRef} onScroll={onTableScroll} className="flex-1 overflow-y-auto">
          {displayLeads.length === 0 ? (
            <div className="p-12 text-center empty-state">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700/50 mb-3">
                <span className="text-4xl">&#128269;</span>
              </div>
              <p className="text-slate-400">No se encontraron leads con los filtros actuales</p>
              <p className="text-slate-500 text-sm mt-1">Intenta cambiar los filtros de busqueda</p>
            </div>
          ) : (
            <div style={{ height: totalHeight, position: 'relative' }}>
              {virtualItems.map(({ index, offsetTop, item: lead }) => (
                <div key={lead.id} onClick={() => onSelectLead(lead)} className="lead-row border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/30 flex items-center" style={{ position: 'absolute', top: offsetTop, left: 0, right: 0, height: ROW_HEIGHT }}>
                  <div className="p-4 w-10 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="accent-blue-500 w-4 h-4 cursor-pointer"
                      checked={selectedLeads.has(lead.id)}
                      onChange={() => setSelectedLeads(prev => {
                        const next = new Set(prev)
                        if (next.has(lead.id)) next.delete(lead.id)
                        else next.add(lead.id)
                        return next
                      })}
                    />
                  </div>
                  <div className="p-4 flex-1 min-w-0 truncate">{lead.name || 'Sin nombre'}</div>
                  <div className="p-4 flex-1 min-w-0 truncate hidden sm:block"><Phone size={16} className="inline mr-1" />{lead.phone}</div>
                  <div className="p-4 flex-1 min-w-0 truncate hidden md:block">{lead.property_interest || 'Sin definir'}</div>
                  <div className="p-4 w-[100px] flex-shrink-0">
                    <span className={`${getScoreColor(lead.score)} px-2 py-1 rounded text-sm`}>
                      {getScoreLabel(lead.score)} ({lead.score})
                    </span>
                  </div>
                  <div className="p-4 w-[130px] flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={lead.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value
                        if (newStatus === lead.status) return
                        const timestamp = new Date().toISOString()
                        const historyEntry = { date: timestamp, from: lead.status, to: newStatus, note: 'Cambio rapido desde tabla' }
                        const existingHistory = lead.notes?.status_history || []
                        const newNotes = { ...(lead.notes || {}), status_history: [...existingHistory, historyEntry] }
                        await supabase.from('leads').update({ status: newStatus, status_changed_at: timestamp, notes: newNotes }).eq('id', lead.id)
                        setLeads(leads.map(l => l.id === lead.id ? { ...l, status: newStatus, notes: newNotes, status_changed_at: timestamp } : l))
                        showToast(`${lead.name || 'Lead'} \u2192 ${STATUS_LABELS[newStatus] || newStatus}`, 'success')
                      }}
                      className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-xs cursor-pointer hover:border-blue-500 focus:border-blue-500 focus:outline-none w-full"
                    >
                      {Object.entries(STATUS_LABELS).filter(([k]) => !['sold','paused'].includes(k)).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="p-4 w-[130px] flex-shrink-0 hidden lg:block" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={lead.assigned_to || ''}
                      onChange={async (e) => {
                        const newVendor = e.target.value || null
                        if (newVendor === (lead.assigned_to || '')) return
                        await supabase.from('leads').update({ assigned_to: newVendor }).eq('id', lead.id)
                        setLeads(leads.map(l => l.id === lead.id ? { ...l, assigned_to: newVendor } : l))
                        const vendorName = team.find(t => t.id === newVendor)?.name || 'Sin asignar'
                        showToast(`${lead.name || 'Lead'} \u2192 ${vendorName}`, 'success')
                      }}
                      className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-xs cursor-pointer hover:border-blue-500 focus:border-blue-500 focus:outline-none w-full"
                    >
                      <option value="">Sin asignar</option>
                      {team.filter(t => t.role === 'vendedor' || t.role === 'admin' || t.role === 'coordinador').map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="p-4 w-[80px] flex-shrink-0 hidden md:block">{(() => {
                    const ref = lead.last_message_at || lead.created_at
                    if (!ref) return <span className="text-slate-500">-</span>
                    const mins = Math.floor((Date.now() - new Date(ref).getTime()) / 60000)
                    if (mins < 60) return <span className="text-green-400">{mins < 2 ? 'Ahora' : `${mins}m`}</span>
                    const hrs = Math.floor(mins / 60)
                    if (hrs < 24) return <span className="text-blue-400">{hrs}h</span>
                    const days = Math.floor(hrs / 24)
                    if (days <= 2) return <span className="text-yellow-400">{days === 1 ? 'Ayer' : '2d'}</span>
                    return <span className={days > 7 ? 'text-red-400' : 'text-slate-400'}>{days}d</span>
                  })()}</div>
                  <div className="p-4 w-[90px] flex-shrink-0 hidden lg:block">{lead.created_at ? new Date(lead.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '-'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {statusChange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-[400px]">
            <h3 className="text-xl font-bold mb-4">Cambiar a: {statusChange.newStatus}</h3>
            <p className="text-sm text-slate-400 mb-2">Lead: {statusChange.lead.name}</p>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Agrega una nota (opcional)..."
              className="w-full p-3 bg-slate-700 rounded-xl h-24 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setStatusChange(null)}
                className="flex-1 py-2 bg-slate-600 rounded-xl"
              >Cancelar</button>
              <button
                onClick={async () => {
                  const lead = statusChange.lead
                  const newStatus = statusChange.newStatus
                  const note = statusNote.trim()
                  const timestamp = new Date().toISOString()
                  const historyEntry = {date: timestamp, from: lead.status, to: newStatus, note: note}
                  const existingHistory = lead.notes?.status_history || []
                  const newNotes = {...(lead.notes || {}), status_history: [...existingHistory, historyEntry], last_note: note}
                  await supabase.from('leads').update({ status: newStatus, status_changed_at: timestamp, notes: newNotes }).eq('id', lead.id)
                  setLeads(leads.map(l => l.id === lead.id ? {...l, status: newStatus, notes: newNotes} : l))
                  setStatusChange(null)
                  setStatusNote('')
                }}
                className="flex-1 py-2 bg-green-600 rounded-xl font-semibold"
              >Guardar</button>
            </div>
          </div>
        </div>
      )}

      <ImportExportModal
        isOpen={showImportExport}
        onClose={() => setShowImportExport(false)}
        initialTab={importExportTab}
        displayLeads={displayLeads}
      />

      {showNewLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Nuevo Lead</h3>
              <button onClick={() => setShowNewLead(false)} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nombre *</label>
                <input type="text" value={newLead.name} onChange={(e) => setNewLead({...newLead, name: e.target.value})} className="w-full p-3 bg-slate-700 rounded-xl" placeholder="Juan Perez" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Telefono *</label>
                <input type="tel" value={newLead.phone} onChange={(e) => setNewLead({...newLead, phone: e.target.value})} className="w-full p-3 bg-slate-700 rounded-xl" placeholder="5512345678" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Interes</label>
                <input type="text" value={newLead.property_interest} onChange={(e) => setNewLead({...newLead, property_interest: e.target.value})} className="w-full p-3 bg-slate-700 rounded-xl" placeholder="Casa 3 recamaras" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Presupuesto</label>
                <input type="text" value={newLead.budget} onChange={(e) => setNewLead({...newLead, budget: e.target.value})} className="w-full p-3 bg-slate-700 rounded-xl" placeholder="2,000,000" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Estado</label>
                <select value={newLead.status} onChange={(e) => setNewLead({...newLead, status: e.target.value})} className="w-full p-3 bg-slate-700 rounded-xl">
                  <option value="new">Nuevo</option>
                  <option value="contacted">Contactado</option>
                  <option value="scheduled">Cita Agendada</option>
                  <option value="visited">Visito</option>
                  <option value="negotiation">Negociacion</option>
                </select>
              </div>
              <button disabled={saving} onClick={async () => {
                if (!newLead.name || !newLead.phone) { showToast('Nombre y telefono requeridos', 'error'); return }
                setSaving(true)
                try {
                  const { error } = await supabase.from('leads').insert({
                    name: newLead.name,
                    phone: newLead.phone,
                    property_interest: newLead.property_interest,
                    budget: newLead.budget,
                    status: newLead.status,
                    score: 0,
                    assigned_to: currentUser?.id,
                    created_at: new Date().toISOString()
                  })
                  if (error) { showToast('Error: ' + error.message, 'error'); return }
                  setShowNewLead(false)
                  setNewLead({ name: '', phone: '', property_interest: '', budget: '', status: 'new' })
                  const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
                  if (data) setLeads(data)
                } finally { setSaving(false) }
              }} className="w-full py-3 bg-green-600 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Guardando...' : 'Guardar Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
