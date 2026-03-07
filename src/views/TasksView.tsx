import { useState, useEffect, useMemo, useCallback } from 'react'
import { useCrm } from '../context/CrmContext'
import type { Task } from '../types/crm'
import { TASK_CATEGORIES, TASK_PRIORITIES } from '../types/crm'
import {
  CheckSquare, Square, Clock, AlertCircle, Calendar, Plus, Filter,
  Search, List, Columns3, LayoutGrid, ChevronDown, X, Trash2,
  GripVertical, ArrowUpDown, Phone, FileText, Users, Gavel, MapPin, MoreHorizontal, Edit3
} from 'lucide-react'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'

const CATEGORY_MAP = Object.fromEntries(TASK_CATEGORIES.map(c => [c.key, c]))
const PRIORITY_MAP = Object.fromEntries(TASK_PRIORITIES.map(p => [p.key, p]))

const TASK_STATUSES = [
  { key: 'pending', label: 'Pendiente', color: 'bg-yellow-500' },
  { key: 'in_progress', label: 'En Progreso', color: 'bg-blue-500' },
  { key: 'completed', label: 'Completada', color: 'bg-green-500' },
  { key: 'cancelled', label: 'Cancelada', color: 'bg-slate-500' },
]
const STATUS_MAP = Object.fromEntries(TASK_STATUSES.map(s => [s.key, s]))

function getCategoryIcon(cat: string) {
  switch (cat) {
    case 'llamada': return <Phone size={12} />
    case 'tramite': return <FileText size={12} />
    case 'documento': return <FileText size={12} />
    case 'seguimiento': return <Users size={12} />
    case 'notaria': return <Gavel size={12} />
    case 'avaluo': return <MapPin size={12} />
    default: return <MoreHorizontal size={12} />
  }
}

function isOverdue(task: Task): boolean {
  if (!task.due_date) return false
  if (task.status === 'completed' || task.status === 'cancelled') return false
  const today = new Date().toISOString().slice(0, 10)
  return task.due_date < today
}

function formatDate(d?: string) {
  if (!d) return '-'
  const date = new Date(d + 'T12:00:00')
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

function formatDateTime(d?: string, t?: string) {
  if (!d) return '-'
  const str = formatDate(d)
  if (t) return `${str} ${t.slice(0, 5)}`
  return str
}

type ViewMode = 'list' | 'board' | 'calendar'
type SortField = 'due_date' | 'priority' | 'created_at'

// ─── New/Edit Task Modal ─────────────────────────────────────────────────
function TaskModal({ task, onSave, onClose, team, leads, properties, currentUser }: {
  task: Partial<Task> | null
  onSave: (t: Partial<Task>) => void
  onClose: () => void
  team: any[]
  leads: any[]
  properties: any[]
  currentUser: any
}) {
  const isEdit = !!task?.id
  const [form, setForm] = useState<Partial<Task>>({
    title: '',
    description: '',
    category: 'otro',
    priority: 'medium',
    status: 'pending',
    assigned_to: currentUser?.id || '',
    assigned_to_name: currentUser?.name || '',
    lead_id: '',
    lead_name: '',
    property_id: '',
    property_name: '',
    due_date: '',
    due_time: '',
    ...task,
  })
  const [leadSearch, setLeadSearch] = useState(task?.lead_name || '')
  const [showLeadDropdown, setShowLeadDropdown] = useState(false)

  const filteredLeads = useMemo(() => {
    if (!leadSearch.trim()) return leads.slice(0, 20)
    const q = leadSearch.toLowerCase()
    return leads.filter((l: any) => l.name?.toLowerCase().includes(q) || l.phone?.includes(q)).slice(0, 20)
  }, [leadSearch, leads])

  function setField(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleAssignChange(memberId: string) {
    const member = team.find((t: any) => t.id === memberId)
    setField('assigned_to', memberId)
    setField('assigned_to_name', member?.name || '')
  }

  function handleLeadSelect(lead: any) {
    setField('lead_id', lead.id)
    setField('lead_name', lead.name)
    setLeadSearch(lead.name)
    setShowLeadDropdown(false)
  }

  function clearLead() {
    setField('lead_id', '')
    setField('lead_name', '')
    setLeadSearch('')
  }

  function handlePropertyChange(propId: string) {
    const prop = properties.find((p: any) => p.id === propId)
    setField('property_id', propId)
    setField('property_name', prop?.name || '')
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-700" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-bold">{isEdit ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Titulo *</label>
            <input
              value={form.title || ''}
              onChange={e => setField('title', e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Ej: Llamar a cliente para confirmar cita"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Descripcion</label>
            <textarea
              value={form.description || ''}
              onChange={e => setField('description', e.target.value)}
              rows={3}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Detalles adicionales..."
            />
          </div>

          {/* Category + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Categoria</label>
              <select
                value={form.category || 'otro'}
                onChange={e => setField('category', e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                {TASK_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Prioridad</label>
              <select
                value={form.priority || 'medium'}
                onChange={e => setField('priority', e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                {TASK_PRIORITIES.map(p => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigned to */}
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Asignado a</label>
            <select
              value={form.assigned_to || ''}
              onChange={e => handleAssignChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Seleccionar...</option>
              {team.filter((t: any) => t.active).map((t: any) => (
                <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
              ))}
            </select>
          </div>

          {/* Lead (searchable) */}
          <div className="relative">
            <label className="text-sm text-slate-400 mb-1 block">Lead (opcional)</label>
            <div className="relative">
              <input
                value={leadSearch}
                onChange={e => { setLeadSearch(e.target.value); setShowLeadDropdown(true); if (!e.target.value) clearLead() }}
                onFocus={() => setShowLeadDropdown(true)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="Buscar lead por nombre o telefono..."
              />
              {form.lead_id && (
                <button onClick={clearLead} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>
            {showLeadDropdown && filteredLeads.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-slate-900 border border-slate-600 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                {filteredLeads.map((l: any) => (
                  <button
                    key={l.id}
                    onClick={() => handleLeadSelect(l)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700 border-b border-slate-800 last:border-0"
                  >
                    <span className="font-medium">{l.name}</span>
                    <span className="text-slate-500 ml-2">{l.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Property */}
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Propiedad (opcional)</label>
            <select
              value={form.property_id || ''}
              onChange={e => handlePropertyChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Sin propiedad</option>
              {properties.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} - {p.development || p.neighborhood}</option>
              ))}
            </select>
          </div>

          {/* Due date + time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Fecha limite</label>
              <input
                type="date"
                value={form.due_date || ''}
                onChange={e => setField('due_date', e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Hora</label>
              <input
                type="time"
                value={form.due_time || ''}
                onChange={e => setField('due_time', e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status (only on edit) */}
          {isEdit && (
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Estado</label>
              <select
                value={form.status || 'pending'}
                onChange={e => setField('status', e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                {TASK_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg">Cancelar</button>
          <button
            onClick={() => { if (!form.title?.trim()) return; onSave(form) }}
            disabled={!form.title?.trim()}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isEdit ? 'Guardar Cambios' : 'Crear Tarea'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Board Card ──────────────────────────────────────────────────────────
function BoardCard({ task, onToggle, onEdit, onDelete }: {
  task: Task
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const priority = PRIORITY_MAP[task.priority]
  const category = CATEGORY_MAP[task.category]
  const overdue = isOverdue(task)

  return (
    <div className={`bg-slate-800/80 rounded-lg p-3 border ${overdue ? 'border-red-500/50' : 'border-slate-700/50'} hover:border-slate-600 transition-colors group`}>
      <div className="flex items-start gap-2">
        <button onClick={onToggle} className="mt-0.5 shrink-0">
          {task.status === 'completed'
            ? <CheckSquare size={16} className="text-green-400" />
            : <Square size={16} className="text-slate-500 hover:text-blue-400" />
          }
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>{task.title}</p>
          {task.lead_name && <p className="text-xs text-blue-400 mt-0.5 truncate">{task.lead_name}</p>}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`w-2 h-2 rounded-full ${priority?.dot || 'bg-slate-400'}`} />
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${category?.color || 'bg-slate-600'} text-white`}>
              {category?.label || task.category}
            </span>
            {task.due_date && (
              <span className={`text-[10px] flex items-center gap-1 ${overdue ? 'text-red-400' : 'text-slate-400'}`}>
                <Clock size={10} /> {formatDate(task.due_date)}
              </span>
            )}
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
          <button onClick={onEdit} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><Edit3 size={12} /></button>
          <button onClick={onDelete} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400"><Trash2 size={12} /></button>
        </div>
      </div>
    </div>
  )
}

// ─── Main View ───────────────────────────────────────────────────────────
export default function TasksView() {
  const { team, leads, properties, currentUser, showToast, supabase } = useCrm()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterAssigned, setFilterAssigned] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterDateFrom, setFilterDateFrom] = useState<string>('')
  const [filterDateTo, setFilterDateTo] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('due_date')
  const [sortAsc, setSortAsc] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [modalTask, setModalTask] = useState<Partial<Task> | null | 'new'>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  // ─── Load Tasks ──────────────────────────────────────────────────
  const loadTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setTasks(data || [])
    } catch (err) {
      console.error('Error loading tasks:', err)
      showToast('Error al cargar tareas', 'error')
    } finally {
      setLoading(false)
    }
  }, [supabase, showToast])

  useEffect(() => { loadTasks() }, [loadTasks])

  // ─── CRUD ────────────────────────────────────────────────────────
  async function saveTask(taskData: Partial<Task>) {
    try {
      const now = new Date().toISOString()
      if (taskData.id) {
        // Update
        const { error } = await supabase
          .from('tasks')
          .update({
            title: taskData.title,
            description: taskData.description || null,
            due_date: taskData.due_date || null,
            due_time: taskData.due_time || null,
            priority: taskData.priority,
            status: taskData.status,
            category: taskData.category,
            assigned_to: taskData.assigned_to,
            assigned_to_name: taskData.assigned_to_name,
            lead_id: taskData.lead_id || null,
            lead_name: taskData.lead_name || null,
            property_id: taskData.property_id || null,
            property_name: taskData.property_name || null,
            completed_at: taskData.status === 'completed' ? (taskData.completed_at || now) : null,
            updated_at: now,
          })
          .eq('id', taskData.id)
        if (error) throw error
        showToast('Tarea actualizada', 'success')
      } else {
        // Insert
        const { error } = await supabase
          .from('tasks')
          .insert({
            title: taskData.title,
            description: taskData.description || null,
            due_date: taskData.due_date || null,
            due_time: taskData.due_time || null,
            priority: taskData.priority || 'medium',
            status: 'pending',
            category: taskData.category || 'otro',
            assigned_to: taskData.assigned_to || currentUser?.id,
            assigned_to_name: taskData.assigned_to_name || currentUser?.name,
            lead_id: taskData.lead_id || null,
            lead_name: taskData.lead_name || null,
            property_id: taskData.property_id || null,
            property_name: taskData.property_name || null,
            created_by: currentUser?.id,
            created_by_name: currentUser?.name,
            created_at: now,
            updated_at: now,
          })
        if (error) throw error
        showToast('Tarea creada', 'success')
      }
      setModalTask(null)
      loadTasks()
    } catch (err) {
      showToast('Error al guardar tarea: ' + (err instanceof Error ? err.message : 'Intenta de nuevo'), 'error')
    }
  }

  async function toggleComplete(task: Task) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    const now = new Date().toISOString()
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? now : null,
          updated_at: now,
        })
        .eq('id', task.id)
      if (error) throw error
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus, completed_at: newStatus === 'completed' ? now : undefined, updated_at: now } as Task : t))
      showToast(newStatus === 'completed' ? 'Tarea completada' : 'Tarea reabierta', 'success')
    } catch {
      showToast('Error al actualizar tarea', 'error')
    }
  }

  async function updateTaskStatus(task: Task, newStatus: string) {
    const now = new Date().toISOString()
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? now : null,
          updated_at: now,
        })
        .eq('id', task.id)
      if (error) throw error
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus as Task['status'], completed_at: newStatus === 'completed' ? now : undefined, updated_at: now } as Task : t))
    } catch {
      showToast('Error al actualizar estado', 'error')
    }
  }

  async function updateTaskPriority(task: Task, newPriority: string) {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ priority: newPriority, updated_at: new Date().toISOString() })
        .eq('id', task.id)
      if (error) throw error
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, priority: newPriority as Task['priority'] } : t))
    } catch {
      showToast('Error al cambiar prioridad', 'error')
    }
  }

  async function updateTaskAssigned(task: Task, memberId: string) {
    const member = team.find(t => t.id === memberId)
    if (!member) return
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ assigned_to: memberId, assigned_to_name: member.name, updated_at: new Date().toISOString() })
        .eq('id', task.id)
      if (error) throw error
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, assigned_to: memberId, assigned_to_name: member.name } : t))
    } catch {
      showToast('Error al reasignar', 'error')
    }
  }

  async function deleteTask(task: Task) {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', task.id)
      if (error) throw error
      setTasks(prev => prev.filter(t => t.id !== task.id))
      setDeleteConfirm(null)
      showToast('Tarea eliminada', 'success')
    } catch {
      showToast('Error al eliminar tarea', 'error')
    }
  }

  // ─── Filtering & Sorting ────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    let result = [...tasks]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.lead_name?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      )
    }
    if (filterPriority) result = result.filter(t => t.priority === filterPriority)
    if (filterCategory) result = result.filter(t => t.category === filterCategory)
    if (filterAssigned) result = result.filter(t => t.assigned_to === filterAssigned)
    if (filterStatus) result = result.filter(t => t.status === filterStatus)
    if (filterDateFrom) result = result.filter(t => t.due_date && t.due_date >= filterDateFrom)
    if (filterDateTo) result = result.filter(t => t.due_date && t.due_date <= filterDateTo)

    // Sort
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    result.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'due_date':
          const da = a.due_date || '9999-12-31'
          const db = b.due_date || '9999-12-31'
          cmp = da.localeCompare(db)
          break
        case 'priority':
          cmp = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
          break
        case 'created_at':
          cmp = b.created_at.localeCompare(a.created_at)
          break
      }
      return sortAsc ? cmp : -cmp
    })

    return result
  }, [tasks, searchQuery, filterPriority, filterCategory, filterAssigned, filterStatus, filterDateFrom, filterDateTo, sortField, sortAsc])

  // ─── KPI Stats ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return {
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      overdue: tasks.filter(t => isOverdue(t)).length,
      completedToday: tasks.filter(t => t.status === 'completed' && t.completed_at?.slice(0, 10) === today).length,
    }
  }, [tasks])

  const activeFilterCount = [filterPriority, filterCategory, filterAssigned, filterStatus, filterDateFrom, filterDateTo].filter(Boolean).length

  function clearFilters() {
    setFilterPriority('')
    setFilterCategory('')
    setFilterAssigned('')
    setFilterStatus('')
    setFilterDateFrom('')
    setFilterDateTo('')
  }

  function handleSort(field: SortField) {
    if (sortField === field) { setSortAsc(!sortAsc) } else { setSortField(field); setSortAsc(true) }
  }

  // ─── Calendar helpers ───────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const { year, month } = calendarMonth
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPad = firstDay.getDay() // 0=Sun
    const days: { date: string; day: number; isCurrentMonth: boolean }[] = []

    // Pad start
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, month, -i)
      days.push({ date: d.toISOString().slice(0, 10), day: d.getDate(), isCurrentMonth: false })
    }
    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d)
      days.push({ date: date.toISOString().slice(0, 10), day: d, isCurrentMonth: true })
    }
    // Pad end to 42
    const remaining = 42 - days.length
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d)
      days.push({ date: date.toISOString().slice(0, 10), day: d, isCurrentMonth: false })
    }
    return days
  }, [calendarMonth])

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {}
    filteredTasks.forEach(t => {
      if (t.due_date) {
        if (!map[t.due_date]) map[t.due_date] = []
        map[t.due_date].push(t)
      }
    })
    return map
  }, [filteredTasks])

  // ─── Render ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-800 rounded-xl animate-pulse" />)}
        </div>
        <div className="h-96 bg-slate-800 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <PageHeader
        icon={CheckSquare}
        title="Tareas"
        badge={tasks.length}
        actions={
          <button
            onClick={() => setModalTask('new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors shrink-0"
          >
            <Plus size={16} /> Nueva Tarea
          </button>
        }
      />

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No hay tareas"
          description="Crea tu primera tarea para organizar el seguimiento de tus leads y propiedades."
          actionLabel="Nueva Tarea"
          onAction={() => setModalTask('new')}
        />
      ) : (<>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-yellow-400 mb-1">
            <Clock size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">Pendientes</span>
          </div>
          <p className="text-2xl font-bold">{stats.pending}</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <ArrowUpDown size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">En Progreso</span>
          </div>
          <p className="text-2xl font-bold">{stats.inProgress}</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-400 mb-1">
            <AlertCircle size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">Vencidas</span>
          </div>
          <p className="text-2xl font-bold">{stats.overdue}</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-400 mb-1">
            <CheckSquare size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">Completadas Hoy</span>
          </div>
          <p className="text-2xl font-bold">{stats.completedToday}</p>
        </div>
      </div>

      {/* Toolbar: search, view mode, filters */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="relative flex-1 w-full md:max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por titulo o lead..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            {([['list', List, 'Lista'], ['board', Columns3, 'Board'], ['calendar', Calendar, 'Calendario']] as [ViewMode, any, string][]).map(([mode, Icon, label]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${viewMode === mode ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title={label}
              >
                <Icon size={14} /> <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortField}
              onChange={e => handleSort(e.target.value as SortField)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none appearance-none pr-7"
            >
              <option value="due_date">Fecha limite</option>
              <option value="priority">Prioridad</option>
              <option value="created_at">Creacion</option>
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
              title={sortAsc ? 'Ascendente' : 'Descendente'}
            >
              <ArrowUpDown size={12} />
            </button>
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors ${showFilters || activeFilterCount > 0 ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
          >
            <Filter size={14} /> Filtros {activeFilterCount > 0 && <span className="bg-blue-500 text-white text-[10px] px-1.5 rounded-full">{activeFilterCount}</span>}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 grid grid-cols-2 md:grid-cols-6 gap-3">
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs">
            <option value="">Prioridad</option>
            {TASK_PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs">
            <option value="">Categoria</option>
            {TASK_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <select value={filterAssigned} onChange={e => setFilterAssigned(e.target.value)} className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs">
            <option value="">Asignado a</option>
            {team.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs">
            <option value="">Estado</option>
            {TASK_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs" placeholder="Desde" />
          <div className="flex gap-2">
            <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs flex-1" placeholder="Hasta" />
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 shrink-0 px-2">Limpiar</button>
            )}
          </div>
        </div>
      )}

      {/* ═══════ LIST VIEW ═══════ */}
      {viewMode === 'list' && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 text-slate-400 text-xs">
                  <th className="p-3 w-10" />
                  <th className="p-3 w-8">P</th>
                  <th className="p-3 text-left cursor-pointer hover:text-white" onClick={() => handleSort('due_date')}>
                    Titulo {sortField === 'due_date' && <span className="text-blue-400 ml-1">{sortAsc ? '↑' : '↓'}</span>}
                  </th>
                  <th className="p-3 text-left">Categoria</th>
                  <th className="p-3 text-left">Asignado</th>
                  <th className="p-3 text-left">Lead</th>
                  <th className="p-3 text-left cursor-pointer hover:text-white" onClick={() => handleSort('due_date')}>
                    Fecha Limite {sortField === 'due_date' && <span className="text-blue-400 ml-1">{sortAsc ? '↑' : '↓'}</span>}
                  </th>
                  <th className="p-3 text-left">Estado</th>
                  <th className="p-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-500">No hay tareas que coincidan con los filtros</td></tr>
                ) : (
                  filteredTasks.map(task => {
                    const overdue = isOverdue(task)
                    const priority = PRIORITY_MAP[task.priority]
                    const category = CATEGORY_MAP[task.category]
                    return (
                      <tr key={task.id} className={`border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors ${overdue ? 'bg-red-500/5' : ''}`}>
                        <td className="p-3 text-center">
                          <button onClick={() => toggleComplete(task)}>
                            {task.status === 'completed'
                              ? <CheckSquare size={16} className="text-green-400" />
                              : <Square size={16} className="text-slate-500 hover:text-blue-400 transition-colors" />
                            }
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          <select
                            value={task.priority}
                            onChange={e => updateTaskPriority(task, e.target.value)}
                            className="bg-transparent border-none text-xs p-0 w-6 cursor-pointer appearance-none"
                            title={priority?.label}
                            style={{ color: 'transparent', backgroundImage: 'none' }}
                          >
                            {TASK_PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                          </select>
                          <span className={`w-3 h-3 rounded-full inline-block ${priority?.dot || 'bg-slate-400'} pointer-events-none -ml-6`} title={priority?.label} />
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => setModalTask(task)}
                            className={`text-left hover:text-blue-400 transition-colors font-medium ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}
                          >
                            {task.title}
                          </button>
                          {task.description && <p className="text-xs text-slate-500 truncate max-w-xs mt-0.5">{task.description}</p>}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${category?.color || 'bg-slate-600'} text-white`}>
                            {getCategoryIcon(task.category)} {category?.label || task.category}
                          </span>
                        </td>
                        <td className="p-3">
                          <select
                            value={task.assigned_to}
                            onChange={e => updateTaskAssigned(task, e.target.value)}
                            className="bg-transparent border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-300 focus:outline-none max-w-[120px]"
                          >
                            {team.filter(t => t.active).map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          {task.lead_name ? (
                            <span className="text-blue-400 text-xs">{task.lead_name}</span>
                          ) : (
                            <span className="text-slate-600 text-xs">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`text-xs ${overdue ? 'text-red-400 font-medium' : 'text-slate-400'}`}>
                            {task.due_date ? formatDateTime(task.due_date, task.due_time) : '-'}
                            {overdue && <AlertCircle size={12} className="inline ml-1 mb-0.5" />}
                          </span>
                        </td>
                        <td className="p-3">
                          <select
                            value={task.status}
                            onChange={e => updateTaskStatus(task, e.target.value)}
                            className={`text-[11px] px-2 py-1 rounded-full font-medium border-none focus:outline-none cursor-pointer ${STATUS_MAP[task.status]?.color || 'bg-slate-600'} text-white`}
                          >
                            {TASK_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                          </select>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setModalTask(task)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Editar">
                              <Edit3 size={14} />
                            </button>
                            <button onClick={() => setDeleteConfirm(task)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400" title="Eliminar">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════ BOARD VIEW ═══════ */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {TASK_STATUSES.map(statusCol => {
            const colTasks = filteredTasks.filter(t => t.status === statusCol.key)
            return (
              <div key={statusCol.key} className="bg-slate-800/30 border border-slate-700/50 rounded-xl">
                <div className="p-3 border-b border-slate-700/50 flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${statusCol.color}`} />
                  <span className="font-medium text-sm">{statusCol.label}</span>
                  <span className="text-xs text-slate-500 ml-auto">{colTasks.length}</span>
                </div>
                <div className="p-2 space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <p className="text-xs text-slate-600 text-center py-4">Sin tareas</p>
                  ) : (
                    colTasks.map(task => (
                      <BoardCard
                        key={task.id}
                        task={task}
                        onToggle={() => toggleComplete(task)}
                        onEdit={() => setModalTask(task)}
                        onDelete={() => setDeleteConfirm(task)}
                      />
                    ))
                  )}
                </div>
                {/* Quick status change: drop zone */}
                <div className="p-2 border-t border-slate-800/50">
                  <button
                    onClick={() => setModalTask('new')}
                    className="w-full text-xs text-slate-500 hover:text-blue-400 py-1.5 rounded hover:bg-slate-800/50 transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus size={12} /> Agregar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ═══════ CALENDAR VIEW ═══════ */}
      {viewMode === 'calendar' && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <button
              onClick={() => setCalendarMonth(prev => {
                const d = new Date(prev.year, prev.month - 1, 1)
                return { year: d.getFullYear(), month: d.getMonth() }
              })}
              className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
            >
              &larr;
            </button>
            <h3 className="font-medium">
              {new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => setCalendarMonth(prev => {
                const d = new Date(prev.year, prev.month + 1, 1)
                return { year: d.getFullYear(), month: d.getMonth() }
              })}
              className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
            >
              &rarr;
            </button>
          </div>
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-700/50">
            {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(d => (
              <div key={d} className="p-2 text-center text-xs text-slate-500 font-medium">{d}</div>
            ))}
          </div>
          {/* Days grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const dayTasks = tasksByDate[day.date] || []
              const today = new Date().toISOString().slice(0, 10)
              const isToday = day.date === today
              return (
                <div
                  key={i}
                  className={`min-h-[100px] p-1.5 border-b border-r border-slate-800/50 ${!day.isCurrentMonth ? 'bg-slate-900/30' : ''} ${isToday ? 'bg-blue-500/5' : ''}`}
                >
                  <div className={`text-xs mb-1 ${isToday ? 'text-blue-400 font-bold' : day.isCurrentMonth ? 'text-slate-400' : 'text-slate-600'}`}>
                    {day.day}
                  </div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map(t => {
                      const priority = PRIORITY_MAP[t.priority]
                      return (
                        <button
                          key={t.id}
                          onClick={() => setModalTask(t)}
                          className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate flex items-center gap-1 ${t.status === 'completed' ? 'bg-green-500/20 text-green-400 line-through' : isOverdue(t) ? 'bg-red-500/20 text-red-300' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priority?.dot || 'bg-slate-400'}`} />
                          {t.title}
                        </button>
                      )
                    })}
                    {dayTasks.length > 3 && (
                      <span className="text-[10px] text-slate-500 px-1.5">+{dayTasks.length - 3} mas</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      </>)}

      {/* ═══════ MODALS ═══════ */}
      {modalTask && (
        <TaskModal
          task={modalTask === 'new' ? {} : modalTask}
          onSave={saveTask}
          onClose={() => setModalTask(null)}
          team={team}
          leads={leads}
          properties={properties}
          currentUser={currentUser}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full border border-slate-700" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2">Eliminar Tarea</h3>
            <p className="text-sm text-slate-400 mb-4">
              Estas seguro de que deseas eliminar "<span className="text-white">{deleteConfirm.title}</span>"? Esta accion no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg">Cancelar</button>
              <button onClick={() => deleteTask(deleteConfirm)} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 rounded-lg font-medium">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
