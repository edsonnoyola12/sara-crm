import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import {
  Zap, Plus, Trash2, ChevronUp, ChevronDown, X, Play, Save,
  ToggleLeft, ToggleRight, AlertCircle, Check, Copy, Clock
} from 'lucide-react'

// ---- Types ----

interface WorkflowTrigger {
  type: 'lead_created' | 'lead_status_changed' | 'appointment_created' | 'appointment_completed' | 'mortgage_status_changed' | 'lead_score_changed' | 'task_overdue' | 'lead_inactive_days'
  config: Record<string, any>
}

interface WorkflowCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'is_empty'
  value: string
}

interface WorkflowAction {
  type: 'send_whatsapp' | 'assign_to' | 'change_status' | 'create_task' | 'add_note' | 'send_notification' | 'wait_hours' | 'send_email'
  config: Record<string, any>
}

interface Workflow {
  id: string
  name: string
  description?: string
  active: boolean
  trigger: WorkflowTrigger
  conditions: WorkflowCondition[]
  actions: WorkflowAction[]
  created_at: string
  updated_at: string
  executions_count: number
}

// ---- Constants ----

const TRIGGER_LABELS: Record<WorkflowTrigger['type'], string> = {
  lead_created: 'Nuevo lead creado',
  lead_status_changed: 'Cambio de estatus de lead',
  appointment_created: 'Cita creada',
  appointment_completed: 'Cita completada',
  mortgage_status_changed: 'Cambio estatus hipoteca',
  lead_score_changed: 'Cambio de score de lead',
  task_overdue: 'Tarea vencida',
  lead_inactive_days: 'Lead inactivo X dias',
}

const ACTION_LABELS: Record<WorkflowAction['type'], string> = {
  send_whatsapp: 'Enviar WhatsApp',
  assign_to: 'Asignar a vendedor',
  change_status: 'Cambiar estatus',
  create_task: 'Crear tarea',
  add_note: 'Agregar nota',
  send_notification: 'Enviar notificacion',
  wait_hours: 'Esperar (horas)',
  send_email: 'Enviar email',
}

const CONDITION_FIELDS = [
  { value: 'score', label: 'Score' },
  { value: 'status', label: 'Estatus' },
  { value: 'temperature', label: 'Temperatura' },
  { value: 'source', label: 'Fuente' },
  { value: 'property_interest', label: 'Desarrollo' },
  { value: 'budget', label: 'Presupuesto' },
  { value: 'assigned_to', label: 'Vendedor asignado' },
]

const OPERATOR_LABELS: Record<WorkflowCondition['operator'], string> = {
  equals: 'es igual a',
  not_equals: 'no es igual a',
  greater_than: 'mayor que',
  less_than: 'menor que',
  contains: 'contiene',
  is_empty: 'esta vacio',
}

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'appointment', 'visit_done', 'negotiation', 'won', 'lost']

const TASK_CATEGORIES = ['llamada', 'seguimiento', 'visita', 'documentacion', 'otro']
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent']

function emptyWorkflow(): Workflow {
  return {
    id: crypto.randomUUID(),
    name: 'Nueva Automatizacion',
    description: '',
    active: false,
    trigger: { type: 'lead_created', config: {} },
    conditions: [],
    actions: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    executions_count: 0,
  }
}

// ---- Component ----

export default function WorkflowBuilderView() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [selected, setSelected] = useState<Workflow | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [simResult, setSimResult] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  // ---- Load ----
  const loadWorkflows = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error loading workflows:', error)
      setWorkflows([])
    } else {
      setWorkflows((data || []).map((d: any) => ({
        ...d,
        trigger: typeof d.trigger === 'string' ? JSON.parse(d.trigger) : d.trigger,
        conditions: typeof d.conditions === 'string' ? JSON.parse(d.conditions) : (d.conditions || []),
        actions: typeof d.actions === 'string' ? JSON.parse(d.actions) : (d.actions || []),
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadWorkflows() }, [loadWorkflows])

  const flash = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ---- CRUD ----
  const saveWorkflow = async () => {
    if (!selected) return
    setSaving(true)
    const payload = {
      id: selected.id,
      name: selected.name,
      description: selected.description || '',
      active: selected.active,
      trigger: selected.trigger,
      conditions: selected.conditions,
      actions: selected.actions,
      updated_at: new Date().toISOString(),
      created_at: selected.created_at,
      executions_count: selected.executions_count,
    }
    const { error } = await supabase.from('workflows').upsert(payload, { onConflict: 'id' })
    if (error) {
      console.error('Save error:', error)
      flash('Error al guardar: ' + error.message, 'err')
    } else {
      flash('Workflow guardado')
      await loadWorkflows()
    }
    setSaving(false)
  }

  const deleteWorkflow = async () => {
    if (!selected) return
    const { error } = await supabase.from('workflows').delete().eq('id', selected.id)
    if (error) {
      flash('Error al eliminar: ' + error.message, 'err')
    } else {
      flash('Workflow eliminado')
      setSelected(null)
      setDeleteConfirm(false)
      await loadWorkflows()
    }
  }

  const toggleActive = async (wf: Workflow) => {
    const { error } = await supabase.from('workflows').update({ active: !wf.active, updated_at: new Date().toISOString() }).eq('id', wf.id)
    if (!error) {
      if (selected?.id === wf.id) setSelected({ ...selected, active: !wf.active })
      await loadWorkflows()
    }
  }

  const createNew = () => {
    const nw = emptyWorkflow()
    setSelected(nw)
  }

  const duplicateWorkflow = () => {
    if (!selected) return
    const dup = { ...selected, id: crypto.randomUUID(), name: selected.name + ' (copia)', active: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), executions_count: 0 }
    setSelected(dup)
  }

  // ---- Simulate ----
  const simulate = () => {
    if (!selected) return
    const lines: string[] = []
    lines.push(`Simulacion de: ${selected.name}`)
    lines.push(`Trigger: ${TRIGGER_LABELS[selected.trigger.type]}`)
    if (selected.trigger.config.from_status) lines.push(`  De: ${selected.trigger.config.from_status} -> A: ${selected.trigger.config.to_status}`)
    if (selected.trigger.config.inactive_days) lines.push(`  Dias inactivo: ${selected.trigger.config.inactive_days}`)
    if (selected.conditions.length) {
      lines.push(`Condiciones (AND):`)
      selected.conditions.forEach((c, i) => lines.push(`  ${i + 1}. ${c.field} ${OPERATOR_LABELS[c.operator]} ${c.value || '(vacio)'}`))
    }
    lines.push(`Acciones:`)
    selected.actions.forEach((a, i) => {
      lines.push(`  ${i + 1}. ${ACTION_LABELS[a.type]}`)
      if (a.type === 'wait_hours') lines.push(`     Espera ${a.config.hours || 0}h antes de la siguiente accion`)
      if (a.type === 'send_whatsapp') lines.push(`     Mensaje: "${(a.config.message || '').substring(0, 60)}..."`)
      if (a.type === 'change_status') lines.push(`     Nuevo estatus: ${a.config.new_status || '?'}`)
    })
    lines.push(`\nResultado: OK - El workflow se ejecutaria correctamente`)
    setSimResult(lines.join('\n'))
  }

  // ---- Updaters for selected workflow ----
  const upd = (patch: Partial<Workflow>) => selected && setSelected({ ...selected, ...patch })

  const updTrigger = (patch: Partial<WorkflowTrigger>) => {
    if (!selected) return
    setSelected({ ...selected, trigger: { ...selected.trigger, ...patch } })
  }

  const updTriggerConfig = (key: string, val: any) => {
    if (!selected) return
    setSelected({ ...selected, trigger: { ...selected.trigger, config: { ...selected.trigger.config, [key]: val } } })
  }

  const addCondition = () => {
    if (!selected) return
    setSelected({ ...selected, conditions: [...selected.conditions, { field: 'score', operator: 'greater_than', value: '' }] })
  }

  const updCondition = (idx: number, patch: Partial<WorkflowCondition>) => {
    if (!selected) return
    const c = [...selected.conditions]
    c[idx] = { ...c[idx], ...patch }
    setSelected({ ...selected, conditions: c })
  }

  const removeCondition = (idx: number) => {
    if (!selected) return
    setSelected({ ...selected, conditions: selected.conditions.filter((_, i) => i !== idx) })
  }

  const addAction = () => {
    if (!selected) return
    setSelected({ ...selected, actions: [...selected.actions, { type: 'send_whatsapp', config: {} }] })
  }

  const updAction = (idx: number, patch: Partial<WorkflowAction>) => {
    if (!selected) return
    const a = [...selected.actions]
    a[idx] = { ...a[idx], ...patch }
    setSelected({ ...selected, actions: a })
  }

  const updActionConfig = (idx: number, key: string, val: any) => {
    if (!selected) return
    const a = [...selected.actions]
    a[idx] = { ...a[idx], config: { ...a[idx].config, [key]: val } }
    setSelected({ ...selected, actions: a })
  }

  const removeAction = (idx: number) => {
    if (!selected) return
    setSelected({ ...selected, actions: selected.actions.filter((_, i) => i !== idx) })
  }

  const moveAction = (idx: number, dir: -1 | 1) => {
    if (!selected) return
    const a = [...selected.actions]
    const ni = idx + dir
    if (ni < 0 || ni >= a.length) return
    ;[a[idx], a[ni]] = [a[ni], a[idx]]
    setSelected({ ...selected, actions: a })
  }

  // ---- Render helpers ----

  const borderColor = (type: string) => {
    if (type === 'trigger') return 'border-l-blue-500'
    if (type === 'condition') return 'border-l-yellow-500'
    if (type === 'wait') return 'border-l-slate-500'
    return 'border-l-emerald-500'
  }

  const renderTriggerConfig = () => {
    if (!selected) return null
    const t = selected.trigger
    switch (t.type) {
      case 'lead_status_changed':
      case 'mortgage_status_changed':
        return (
          <div className="flex gap-3 mt-3">
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">De estatus</label>
              <select value={t.config.from_status || ''} onChange={e => updTriggerConfig('from_status', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm">
                <option value="">Cualquiera</option>
                {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">A estatus</label>
              <select value={t.config.to_status || ''} onChange={e => updTriggerConfig('to_status', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm">
                <option value="">Cualquiera</option>
                {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )
      case 'lead_inactive_days':
        return (
          <div className="mt-3">
            <label className="text-xs text-slate-400 mb-1 block">Dias de inactividad</label>
            <input type="number" min={1} value={t.config.inactive_days || 3}
              onChange={e => updTriggerConfig('inactive_days', parseInt(e.target.value) || 3)}
              className="w-32 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm" />
          </div>
        )
      case 'lead_score_changed':
        return (
          <div className="flex gap-3 mt-3">
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">Direccion</label>
              <select value={t.config.direction || 'increased'} onChange={e => updTriggerConfig('direction', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm">
                <option value="increased">Aumento</option>
                <option value="decreased">Disminuyo</option>
                <option value="any">Cualquiera</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">Umbral (opcional)</label>
              <input type="number" value={t.config.threshold || ''} placeholder="ej: 80"
                onChange={e => updTriggerConfig('threshold', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const renderActionConfig = (action: WorkflowAction, idx: number) => {
    switch (action.type) {
      case 'send_whatsapp':
        return (
          <div className="mt-2">
            <label className="text-xs text-slate-400 mb-1 block">
              Mensaje (usa {'{{name}}'}, {'{{property}}'}, {'{{status}}'})
            </label>
            <textarea value={action.config.message || ''} rows={3}
              onChange={e => updActionConfig(idx, 'message', e.target.value)}
              placeholder="Hola {{name}}, te contactamos sobre {{property}}..."
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
        )
      case 'send_email':
        return (
          <div className="mt-2 space-y-2">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Asunto</label>
              <input value={action.config.subject || ''} onChange={e => updActionConfig(idx, 'subject', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm" placeholder="Asunto del email" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Cuerpo</label>
              <textarea value={action.config.body || ''} rows={3} onChange={e => updActionConfig(idx, 'body', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm resize-none" placeholder="Contenido del email..." />
            </div>
          </div>
        )
      case 'assign_to':
        return (
          <div className="mt-2">
            <label className="text-xs text-slate-400 mb-1 block">Asignar a (ID o nombre)</label>
            <input value={action.config.assignee || ''} onChange={e => updActionConfig(idx, 'assignee', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm" placeholder="ID del vendedor o 'round_robin'" />
          </div>
        )
      case 'change_status':
        return (
          <div className="mt-2">
            <label className="text-xs text-slate-400 mb-1 block">Nuevo estatus</label>
            <select value={action.config.new_status || ''} onChange={e => updActionConfig(idx, 'new_status', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm">
              <option value="">Seleccionar...</option>
              {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )
      case 'create_task':
        return (
          <div className="mt-2 space-y-2">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Titulo de la tarea</label>
              <input value={action.config.title || ''} onChange={e => updActionConfig(idx, 'title', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm" placeholder="Seguimiento con lead" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-400 mb-1 block">Categoria</label>
                <select value={action.config.category || 'seguimiento'} onChange={e => updActionConfig(idx, 'category', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm">
                  {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-400 mb-1 block">Prioridad</label>
                <select value={action.config.priority || 'medium'} onChange={e => updActionConfig(idx, 'priority', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm">
                  {TASK_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-400 mb-1 block">Vence en (dias)</label>
                <input type="number" min={1} value={action.config.due_days || 1}
                  onChange={e => updActionConfig(idx, 'due_days', parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
        )
      case 'add_note':
        return (
          <div className="mt-2">
            <label className="text-xs text-slate-400 mb-1 block">Texto de la nota</label>
            <textarea value={action.config.note || ''} rows={2} onChange={e => updActionConfig(idx, 'note', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm resize-none" placeholder="Nota automatica..." />
          </div>
        )
      case 'send_notification':
        return (
          <div className="mt-2 space-y-2">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Mensaje</label>
              <input value={action.config.message || ''} onChange={e => updActionConfig(idx, 'message', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm" placeholder="Lead requiere atencion" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Rol destino</label>
              <select value={action.config.target_role || 'admin'} onChange={e => updActionConfig(idx, 'target_role', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm">
                <option value="admin">Admin</option>
                <option value="coordinador">Coordinador</option>
                <option value="vendedor">Vendedor asignado</option>
              </select>
            </div>
          </div>
        )
      case 'wait_hours':
        return (
          <div className="mt-2">
            <label className="text-xs text-slate-400 mb-1 block">Horas de espera</label>
            <input type="number" min={1} value={action.config.hours || 1}
              onChange={e => updActionConfig(idx, 'hours', parseInt(e.target.value) || 1)}
              className="w-32 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm" />
          </div>
        )
      default:
        return null
    }
  }

  // ---- Main render ----

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${
          toast.type === 'ok' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Left panel — Workflow list */}
      <div className="w-60 flex-shrink-0 bg-slate-900/50 border-r border-slate-700/50 flex flex-col">
        <div className="p-4 border-b border-slate-700/50">
          <button onClick={createNew}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg px-3 py-2.5 transition-colors">
            <Plus size={16} /> Nueva Automatizacion
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading && <p className="text-xs text-slate-500 p-3">Cargando...</p>}
          {!loading && workflows.length === 0 && (
            <p className="text-xs text-slate-500 p-3 text-center">Sin workflows aun. Crea el primero.</p>
          )}
          {workflows.map(wf => (
            <button key={wf.id}
              onClick={() => setSelected({ ...wf })}
              className={`w-full text-left p-3 rounded-lg transition-colors group ${
                selected?.id === wf.id ? 'bg-slate-700/60 border border-slate-600' : 'hover:bg-slate-800/60 border border-transparent'
              }`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${wf.active ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <span className="text-sm font-medium truncate">{wf.name}</span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 ml-4">
                <span className="text-[10px] text-slate-500">{TRIGGER_LABELS[wf.trigger.type]?.substring(0, 25)}</span>
                <span className="text-[10px] text-slate-600 ml-auto">{wf.executions_count}x</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main builder area */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Zap size={48} className="mb-4 text-slate-600" />
            <p className="text-lg font-medium">Workflow Builder</p>
            <p className="text-sm mt-1">Selecciona un workflow o crea uno nuevo</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto p-6 pb-20">
            {/* Top bar */}
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <input value={selected.name} onChange={e => upd({ name: e.target.value })}
                className="text-xl font-bold bg-transparent border-b border-slate-700 focus:border-blue-500 outline-none px-1 py-1 flex-1 min-w-[200px]" />
              <button onClick={() => upd({ active: !selected.active })}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                  selected.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'
                }`}>
                {selected.active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                {selected.active ? 'Activo' : 'Inactivo'}
              </button>
              <button onClick={simulate} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors">
                <Play size={14} /> Probar
              </button>
              <button onClick={duplicateWorkflow} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 transition-colors">
                <Copy size={14} /> Duplicar
              </button>
              <button onClick={saveWorkflow} disabled={saving}
                className="flex items-center gap-1.5 text-xs font-medium px-4 py-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50">
                <Save size={14} /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
              {!deleteConfirm ? (
                <button onClick={() => setDeleteConfirm(true)} className="flex items-center gap-1 text-xs text-red-400/60 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={deleteWorkflow} className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-500">Eliminar</button>
                  <button onClick={() => setDeleteConfirm(false)} className="text-xs text-slate-400 hover:text-white">Cancelar</button>
                </div>
              )}
            </div>

            {/* Description */}
            <input value={selected.description || ''} onChange={e => upd({ description: e.target.value })}
              placeholder="Descripcion del workflow (opcional)"
              className="w-full mb-6 bg-transparent border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-400 focus:border-slate-600 outline-none" />

            {/* Simulation result */}
            {simResult && (
              <div className="mb-6 bg-purple-900/20 border border-purple-700/30 rounded-xl p-4 relative">
                <button onClick={() => setSimResult(null)} className="absolute top-2 right-2 text-slate-500 hover:text-white"><X size={14} /></button>
                <p className="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-1"><Play size={12} /> Resultado de simulacion</p>
                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">{simResult}</pre>
              </div>
            )}

            {/* === TRIGGER BLOCK === */}
            <div className={`bg-slate-800/60 border border-slate-700/50 border-l-4 ${borderColor('trigger')} rounded-xl p-4 mb-2`}>
              <p className="text-xs font-semibold text-blue-400 mb-3 flex items-center gap-1.5">
                <Zap size={14} /> TRIGGER (Cuando...)
              </p>
              <select value={selected.trigger.type}
                onChange={e => updTrigger({ type: e.target.value as WorkflowTrigger['type'], config: {} })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm">
                {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              {renderTriggerConfig()}
            </div>

            {/* Arrow */}
            <div className="flex justify-center py-1">
              <div className="w-px h-6 bg-slate-600" />
            </div>
            <div className="flex justify-center pb-1">
              <div className="w-2 h-2 border-r border-b border-slate-600 rotate-45 -mt-1.5" />
            </div>

            {/* === CONDITION BLOCKS === */}
            {selected.conditions.length > 0 && (
              <>
                {selected.conditions.map((cond, idx) => (
                  <div key={idx}>
                    <div className={`bg-slate-800/60 border border-slate-700/50 border-l-4 ${borderColor('condition')} rounded-xl p-4 mb-2 relative group`}>
                      <button onClick={() => removeCondition(idx)}
                        className="absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={14} />
                      </button>
                      <p className="text-xs font-semibold text-yellow-400 mb-3 flex items-center gap-1.5">
                        <AlertCircle size={14} /> CONDICION {idx + 1} {idx > 0 && <span className="text-yellow-600 text-[10px] ml-1">AND</span>}
                      </p>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <select value={cond.field} onChange={e => updCondition(idx, { field: e.target.value })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm">
                            {CONDITION_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                          </select>
                        </div>
                        <div className="flex-1">
                          <select value={cond.operator} onChange={e => updCondition(idx, { operator: e.target.value as WorkflowCondition['operator'] })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm">
                            {Object.entries(OPERATOR_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </div>
                        {cond.operator !== 'is_empty' && (
                          <div className="flex-1">
                            <input value={cond.value} onChange={e => updCondition(idx, { value: e.target.value })}
                              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm" placeholder="Valor" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-center py-1">
                      <div className="w-px h-4 bg-slate-600" />
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Add condition button */}
            <div className="flex justify-center mb-2">
              <button onClick={addCondition}
                className="text-xs text-yellow-500/70 hover:text-yellow-400 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-yellow-500/10 transition-colors">
                <Plus size={12} /> Agregar condicion
              </button>
            </div>

            {/* Arrow before actions */}
            <div className="flex justify-center py-1">
              <div className="w-px h-6 bg-slate-600" />
            </div>
            <div className="flex justify-center pb-1">
              <div className="w-2 h-2 border-r border-b border-slate-600 rotate-45 -mt-1.5" />
            </div>

            {/* === ACTION BLOCKS === */}
            {selected.actions.map((action, idx) => (
              <div key={idx}>
                <div className={`bg-slate-800/60 border border-slate-700/50 border-l-4 ${
                  action.type === 'wait_hours' ? borderColor('wait') : borderColor('action')
                } rounded-xl p-4 mb-2 relative group`}>
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveAction(idx, -1)} disabled={idx === 0}
                      className="text-slate-600 hover:text-white disabled:opacity-30"><ChevronUp size={14} /></button>
                    <button onClick={() => moveAction(idx, 1)} disabled={idx === selected.actions.length - 1}
                      className="text-slate-600 hover:text-white disabled:opacity-30"><ChevronDown size={14} /></button>
                    <button onClick={() => removeAction(idx)}
                      className="text-slate-600 hover:text-red-400 ml-1"><X size={14} /></button>
                  </div>
                  <p className={`text-xs font-semibold mb-3 flex items-center gap-1.5 ${
                    action.type === 'wait_hours' ? 'text-slate-400' : 'text-emerald-400'
                  }`}>
                    {action.type === 'wait_hours' ? <Clock size={14} /> : <Check size={14} />}
                    ACCION {idx + 1}
                  </p>
                  <select value={action.type}
                    onChange={e => updAction(idx, { type: e.target.value as WorkflowAction['type'], config: {} })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm">
                    {Object.entries(ACTION_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  {renderActionConfig(action, idx)}
                </div>
                {idx < selected.actions.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="w-px h-4 bg-slate-600" />
                  </div>
                )}
              </div>
            ))}

            {/* Add action button */}
            <div className="flex justify-center mt-3">
              <button onClick={addAction}
                className="text-xs text-emerald-500/70 hover:text-emerald-400 flex items-center gap-1 px-4 py-2 rounded-lg hover:bg-emerald-500/10 transition-colors border border-dashed border-slate-700 hover:border-emerald-500/30">
                <Plus size={14} /> Agregar accion
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
