import { useState, useMemo, useCallback } from 'react'
import {
  Database, Columns, Filter, BarChart3, Download, Save, Trash2,
  Plus, X, ChevronDown, ChevronRight, ArrowUpDown, FileText, Printer,
  FolderOpen, PieChart as PieChartIcon, TrendingUp, LayoutList
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, CartesianGrid, Legend
} from 'recharts'
import { useCrm } from '../context/CrmContext'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type DataSource = 'leads' | 'appointments' | 'mortgages' | 'campaigns' | 'properties'

type Operator = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'is_empty'

type ChartType = 'none' | 'bar' | 'line' | 'pie' | 'area'

interface FilterRule {
  id: string
  field: string
  operator: Operator
  value: string
  value2?: string // for "between"
}

interface ReportConfig {
  id: string
  name: string
  dataSource: DataSource
  columns: string[]
  filters: FilterRule[]
  groupBy: string
  sortField: string
  sortDir: 'asc' | 'desc'
  chartType: ChartType
  dateRange: string
  dateField: string
  customFrom?: string
  customTo?: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Field definitions per data source
// ---------------------------------------------------------------------------
interface FieldDef {
  key: string
  label: string
  type: 'string' | 'number' | 'date' | 'boolean'
  enumValues?: string[]
}

const LEAD_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Nombre', type: 'string' },
  { key: 'phone', label: 'Telefono', type: 'string' },
  { key: 'status', label: 'Status', type: 'string', enumValues: ['new','contacted','qualified','scheduled','visited','negotiation','reserved','closed','delivered','sold','lost','fallen','inactive','paused'] },
  { key: 'property_interest', label: 'Interes', type: 'string' },
  { key: 'budget', label: 'Presupuesto', type: 'string' },
  { key: 'score', label: 'Score', type: 'number' },
  { key: 'source', label: 'Fuente', type: 'string', enumValues: ['phone_inbound','facebook_ads','referral','agency_import','whatsapp','website','Directo'] },
  { key: 'assigned_to', label: 'Asignado a', type: 'string' },
  { key: 'temperature', label: 'Temperatura', type: 'string', enumValues: ['hot','warm','cold'] },
  { key: 'credit_status', label: 'Status Credito', type: 'string' },
  { key: 'needs_mortgage', label: 'Necesita Hipoteca', type: 'boolean' },
  { key: 'survey_completed', label: 'Encuesta Completada', type: 'boolean' },
  { key: 'survey_rating', label: 'Calificacion Encuesta', type: 'number' },
  { key: 'created_at', label: 'Fecha Creacion', type: 'date' },
  { key: 'updated_at', label: 'Fecha Actualizacion', type: 'date' },
  { key: 'campaign_id', label: 'Campana ID', type: 'string' },
]

const APPOINTMENT_FIELDS: FieldDef[] = [
  { key: 'lead_name', label: 'Lead', type: 'string' },
  { key: 'property_name', label: 'Propiedad', type: 'string' },
  { key: 'vendedor_name', label: 'Vendedor', type: 'string' },
  { key: 'asesor_name', label: 'Asesor', type: 'string' },
  { key: 'status', label: 'Status', type: 'string', enumValues: ['scheduled','cancelled','completed'] },
  { key: 'appointment_type', label: 'Tipo', type: 'string', enumValues: ['visita','visit','mortgage_consultation','asesoria_credito','follow_up','seguimiento','llamada','entrega','firma'] },
  { key: 'scheduled_date', label: 'Fecha', type: 'date' },
  { key: 'scheduled_time', label: 'Hora', type: 'string' },
  { key: 'duration_minutes', label: 'Duracion (min)', type: 'number' },
  { key: 'mode', label: 'Modo', type: 'string' },
  { key: 'created_at', label: 'Fecha Creacion', type: 'date' },
]

const MORTGAGE_FIELDS: FieldDef[] = [
  { key: 'lead_name', label: 'Lead', type: 'string' },
  { key: 'property_name', label: 'Propiedad', type: 'string' },
  { key: 'status', label: 'Status', type: 'string', enumValues: ['pending','in_review','sent_to_bank','approved','rejected'] },
  { key: 'bank', label: 'Banco', type: 'string' },
  { key: 'monthly_income', label: 'Ingreso Mensual', type: 'number' },
  { key: 'requested_amount', label: 'Monto Solicitado', type: 'number' },
  { key: 'max_approved_amount', label: 'Monto Aprobado', type: 'number' },
  { key: 'down_payment', label: 'Enganche', type: 'number' },
  { key: 'estimated_monthly_payment', label: 'Pago Mensual', type: 'number' },
  { key: 'prequalification_score', label: 'Score Precalificacion', type: 'number' },
  { key: 'credit_term_years', label: 'Plazo (anos)', type: 'number' },
  { key: 'assigned_advisor_name', label: 'Asesor', type: 'string' },
  { key: 'created_at', label: 'Fecha Creacion', type: 'date' },
  { key: 'updated_at', label: 'Fecha Actualizacion', type: 'date' },
]

const CAMPAIGN_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Nombre', type: 'string' },
  { key: 'channel', label: 'Canal', type: 'string', enumValues: ['Facebook','Google Ads','Instagram','TikTok','TV','Radio','Espectaculares','Referidos'] },
  { key: 'status', label: 'Status', type: 'string', enumValues: ['active','paused','completed'] },
  { key: 'budget', label: 'Presupuesto', type: 'number' },
  { key: 'spent', label: 'Gastado', type: 'number' },
  { key: 'impressions', label: 'Impresiones', type: 'number' },
  { key: 'clicks', label: 'Clicks', type: 'number' },
  { key: 'leads_generated', label: 'Leads Generados', type: 'number' },
  { key: 'sales_closed', label: 'Ventas Cerradas', type: 'number' },
  { key: 'revenue_generated', label: 'Revenue', type: 'number' },
  { key: 'start_date', label: 'Inicio', type: 'date' },
  { key: 'end_date', label: 'Fin', type: 'date' },
  { key: 'target_audience', label: 'Audiencia', type: 'string' },
  { key: 'created_at', label: 'Fecha Creacion', type: 'date' },
]

const PROPERTY_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Nombre', type: 'string' },
  { key: 'category', label: 'Categoria', type: 'string' },
  { key: 'price', label: 'Precio', type: 'number' },
  { key: 'price_equipped', label: 'Precio Equipado', type: 'number' },
  { key: 'land_size', label: 'Terreno (m2)', type: 'number' },
  { key: 'bedrooms', label: 'Recamaras', type: 'number' },
  { key: 'bathrooms', label: 'Banos', type: 'number' },
  { key: 'area_m2', label: 'Area (m2)', type: 'number' },
  { key: 'total_units', label: 'Unidades Totales', type: 'number' },
  { key: 'sold_units', label: 'Unidades Vendidas', type: 'number' },
  { key: 'neighborhood', label: 'Colonia', type: 'string' },
  { key: 'city', label: 'Ciudad', type: 'string' },
  { key: 'development', label: 'Desarrollo', type: 'string' },
  { key: 'floors', label: 'Pisos', type: 'number' },
]

const FIELDS_MAP: Record<DataSource, FieldDef[]> = {
  leads: LEAD_FIELDS,
  appointments: APPOINTMENT_FIELDS,
  mortgages: MORTGAGE_FIELDS,
  campaigns: CAMPAIGN_FIELDS,
  properties: PROPERTY_FIELDS,
}

const DATA_SOURCE_LABELS: Record<DataSource, string> = {
  leads: 'Leads',
  appointments: 'Citas',
  mortgages: 'Hipotecas',
  campaigns: 'Campanas',
  properties: 'Propiedades',
}

const OPERATOR_LABELS: Record<Operator, string> = {
  equals: 'Igual a',
  not_equals: 'Diferente de',
  contains: 'Contiene',
  greater_than: 'Mayor que',
  less_than: 'Menor que',
  between: 'Entre',
  is_empty: 'Esta vacio',
}

const CHART_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#6366f1','#14b8a6','#f97316','#a855f7','#22c55e']

const LS_KEY = 'sara-report-builder-saved'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function uid() { return Math.random().toString(36).slice(2, 10) }

function getDateRange(range: string, customFrom?: string, customTo?: string): [Date | null, Date | null] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (range) {
    case 'today': return [today, new Date(today.getTime() + 86400000)]
    case 'this_week': { const d = new Date(today); d.setDate(d.getDate() - d.getDay()); return [d, new Date(today.getTime() + 86400000)] }
    case 'this_month': return [new Date(now.getFullYear(), now.getMonth(), 1), new Date(today.getTime() + 86400000)]
    case 'this_quarter': { const q = Math.floor(now.getMonth() / 3) * 3; return [new Date(now.getFullYear(), q, 1), new Date(today.getTime() + 86400000)] }
    case 'this_year': return [new Date(now.getFullYear(), 0, 1), new Date(today.getTime() + 86400000)]
    case 'custom': return [customFrom ? new Date(customFrom) : null, customTo ? new Date(customTo + 'T23:59:59') : null]
    default: return [null, null]
  }
}

function applyFilter(value: any, rule: FilterRule, fieldDef?: FieldDef): boolean {
  const strVal = value == null ? '' : String(value).toLowerCase()
  const filterVal = (rule.value || '').toLowerCase()

  switch (rule.operator) {
    case 'equals': return strVal === filterVal
    case 'not_equals': return strVal !== filterVal
    case 'contains': return strVal.includes(filterVal)
    case 'greater_than': return Number(value || 0) > Number(rule.value || 0)
    case 'less_than': return Number(value || 0) < Number(rule.value || 0)
    case 'between': return Number(value || 0) >= Number(rule.value || 0) && Number(value || 0) <= Number(rule.value2 || 0)
    case 'is_empty': return !value || strVal === ''
    default: return true
  }
}

function formatCell(value: any, fieldDef?: FieldDef): string {
  if (value == null || value === '') return '-'
  if (fieldDef?.type === 'boolean') return value ? 'Si' : 'No'
  if (fieldDef?.type === 'number') return typeof value === 'number' ? value.toLocaleString() : String(value)
  if (fieldDef?.type === 'date') {
    try { return new Date(value).toLocaleDateString('es-MX') } catch { return String(value) }
  }
  return String(value)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ReportBuilderView() {
  const { leads, appointments, mortgages, campaigns, properties, team } = useCrm()

  // Config state
  const [dataSource, setDataSource] = useState<DataSource>('leads')
  const [selectedCols, setSelectedCols] = useState<string[]>(['name', 'status', 'score', 'source', 'created_at'])
  const [filters, setFilters] = useState<FilterRule[]>([])
  const [groupBy, setGroupBy] = useState('')
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [chartType, setChartType] = useState<ChartType>('none')
  const [dateRange, setDateRange] = useState('all')
  const [dateField, setDateField] = useState('created_at')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  // UI state
  const [sidebarSection, setSidebarSection] = useState<string>('source')
  const [savedReports, setSavedReports] = useState<ReportConfig[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
  })
  const [saveName, setSaveName] = useState('')
  const [showSaved, setShowSaved] = useState(false)

  const fields = FIELDS_MAP[dataSource]
  const dateFields = fields.filter(f => f.type === 'date')

  // Team member name lookup for assigned_to
  const teamMap = useMemo(() => {
    const m: Record<string, string> = {}
    team.forEach(t => { m[t.id] = t.name })
    return m
  }, [team])

  // ---------------------------------------------------------------------------
  // Data source selection
  // ---------------------------------------------------------------------------
  const rawData: Record<string, any>[] = useMemo(() => {
    switch (dataSource) {
      case 'leads': return leads as any[]
      case 'appointments': return appointments as any[]
      case 'mortgages': return mortgages as any[]
      case 'campaigns': return campaigns as any[]
      case 'properties': return properties as any[]
      default: return []
    }
  }, [dataSource, leads, appointments, mortgages, campaigns, properties])

  // ---------------------------------------------------------------------------
  // Apply filters, date range, sort
  // ---------------------------------------------------------------------------
  const filteredData = useMemo(() => {
    let data = [...rawData]

    // Date range
    const [from, to] = getDateRange(dateRange, customFrom, customTo)
    if (from || to) {
      data = data.filter(row => {
        const val = row[dateField]
        if (!val) return false
        const d = new Date(val)
        if (from && d < from) return false
        if (to && d > to) return false
        return true
      })
    }

    // Filters
    for (const rule of filters) {
      if (!rule.field) continue
      const fd = fields.find(f => f.key === rule.field)
      data = data.filter(row => applyFilter(row[rule.field], rule, fd))
    }

    // Sort
    if (sortField) {
      const fd = fields.find(f => f.key === sortField)
      data.sort((a, b) => {
        let va = a[sortField], vb = b[sortField]
        if (fd?.type === 'number') { va = Number(va || 0); vb = Number(vb || 0) }
        else if (fd?.type === 'date') { va = new Date(va || 0).getTime(); vb = new Date(vb || 0).getTime() }
        else { va = String(va || '').toLowerCase(); vb = String(vb || '').toLowerCase() }
        if (va < vb) return sortDir === 'asc' ? -1 : 1
        if (va > vb) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    }

    return data
  }, [rawData, filters, sortField, sortDir, dateRange, dateField, customFrom, customTo, fields])

  // ---------------------------------------------------------------------------
  // Grouped data for charts
  // ---------------------------------------------------------------------------
  const groupedData = useMemo(() => {
    if (!groupBy) return []
    const counts: Record<string, number> = {}
    filteredData.forEach(row => {
      let key = row[groupBy]
      // Resolve assigned_to to team member name
      if (groupBy === 'assigned_to' && key && teamMap[key]) key = teamMap[key]
      const label = key == null || key === '' ? '(vacio)' : String(key)
      counts[label] = (counts[label] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [filteredData, groupBy, teamMap])

  // ---------------------------------------------------------------------------
  // Change data source -> reset columns to first 5
  // ---------------------------------------------------------------------------
  const handleSourceChange = useCallback((src: DataSource) => {
    setDataSource(src)
    const newFields = FIELDS_MAP[src]
    setSelectedCols(newFields.slice(0, 5).map(f => f.key))
    setFilters([])
    setGroupBy('')
    setSortField('')
    setChartType('none')
    setDateRange('all')
    setDateField(newFields.find(f => f.type === 'date')?.key || '')
  }, [])

  // ---------------------------------------------------------------------------
  // Filter management
  // ---------------------------------------------------------------------------
  const addFilter = () => setFilters(prev => [...prev, { id: uid(), field: fields[0]?.key || '', operator: 'equals', value: '' }])
  const removeFilter = (id: string) => setFilters(prev => prev.filter(f => f.id !== id))
  const updateFilter = (id: string, patch: Partial<FilterRule>) => {
    setFilters(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
  }

  // ---------------------------------------------------------------------------
  // Column toggle
  // ---------------------------------------------------------------------------
  const toggleCol = (key: string) => {
    setSelectedCols(prev => prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key])
  }

  // ---------------------------------------------------------------------------
  // Export CSV
  // ---------------------------------------------------------------------------
  const exportCSV = () => {
    const colDefs = selectedCols.map(c => fields.find(f => f.key === c)).filter(Boolean) as FieldDef[]
    const header = colDefs.map(c => c.label).join(',')
    const rows = filteredData.map(row => colDefs.map(c => {
      let v = row[c.key]
      if (c.key === 'assigned_to' && v && teamMap[v]) v = teamMap[v]
      const formatted = formatCell(v, c)
      return `"${formatted.replace(/"/g, '""')}"`
    }).join(',')).join('\n')
    const csv = header + '\n' + rows
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `reporte-${dataSource}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  // ---------------------------------------------------------------------------
  // Export PDF (print)
  // ---------------------------------------------------------------------------
  const exportPDF = () => window.print()

  // ---------------------------------------------------------------------------
  // Save / Load / Delete reports
  // ---------------------------------------------------------------------------
  const saveReport = () => {
    if (!saveName.trim()) return
    const config: ReportConfig = {
      id: uid(), name: saveName.trim(), dataSource, columns: selectedCols, filters,
      groupBy, sortField, sortDir, chartType, dateRange, dateField, customFrom, customTo, createdAt: new Date().toISOString()
    }
    const updated = [...savedReports, config]
    setSavedReports(updated)
    localStorage.setItem(LS_KEY, JSON.stringify(updated))
    setSaveName('')
  }

  const loadReport = (config: ReportConfig) => {
    setDataSource(config.dataSource)
    setSelectedCols(config.columns)
    setFilters(config.filters)
    setGroupBy(config.groupBy)
    setSortField(config.sortField)
    setSortDir(config.sortDir)
    setChartType(config.chartType)
    setDateRange(config.dateRange)
    setDateField(config.dateField)
    setCustomFrom(config.customFrom || '')
    setCustomTo(config.customTo || '')
    setShowSaved(false)
  }

  const deleteReport = (id: string) => {
    const updated = savedReports.filter(r => r.id !== id)
    setSavedReports(updated)
    localStorage.setItem(LS_KEY, JSON.stringify(updated))
  }

  // ---------------------------------------------------------------------------
  // Sidebar section toggle helper
  // ---------------------------------------------------------------------------
  const SectionHeader = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <button
      onClick={() => setSidebarSection(sidebarSection === id ? '' : id)}
      className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors"
    >
      <span className="flex items-center gap-2"><Icon size={14} className="text-blue-400" />{label}</span>
      {sidebarSection === id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
    </button>
  )

  // ---------------------------------------------------------------------------
  // Custom tooltip for recharts
  // ---------------------------------------------------------------------------
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 shadow-xl text-xs">
        <p className="text-slate-300 font-medium mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex gap-0 h-[calc(100vh-80px)] section-enter print:block">
      {/* ====================== LEFT SIDEBAR ====================== */}
      <div className="w-[280px] min-w-[280px] bg-slate-800/60 border-r border-slate-700/50 overflow-y-auto flex flex-col print:hidden">
        <div className="p-4 border-b border-slate-700/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText size={18} className="text-blue-400" /> Report Builder
          </h2>
          <p className="text-xs text-slate-400 mt-1">Crea reportes personalizados</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* ---- DATA SOURCE ---- */}
          <SectionHeader id="source" icon={Database} label="Fuente de Datos" />
          {sidebarSection === 'source' && (
            <div className="px-3 pb-3 space-y-1">
              {(Object.keys(FIELDS_MAP) as DataSource[]).map(src => (
                <button key={src} onClick={() => handleSourceChange(src)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${dataSource === src ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-slate-300 hover:bg-slate-700/50'}`}>
                  {DATA_SOURCE_LABELS[src]}
                </button>
              ))}
            </div>
          )}

          {/* ---- COLUMNS ---- */}
          <SectionHeader id="columns" icon={Columns} label="Columnas" />
          {sidebarSection === 'columns' && (
            <div className="px-3 pb-3 space-y-1 max-h-60 overflow-y-auto">
              {fields.map(f => (
                <label key={f.key} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white py-0.5">
                  <input type="checkbox" checked={selectedCols.includes(f.key)} onChange={() => toggleCol(f.key)}
                    className="rounded border-slate-500 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 h-3.5 w-3.5" />
                  {f.label}
                </label>
              ))}
            </div>
          )}

          {/* ---- FILTERS ---- */}
          <SectionHeader id="filters" icon={Filter} label={`Filtros (${filters.length})`} />
          {sidebarSection === 'filters' && (
            <div className="px-3 pb-3 space-y-2">
              {filters.map(rule => {
                const fd = fields.find(f => f.key === rule.field)
                return (
                  <div key={rule.id} className="bg-slate-700/40 rounded-lg p-2 space-y-1.5 border border-slate-600/30">
                    <div className="flex items-center gap-1">
                      <select value={rule.field} onChange={e => updateFilter(rule.id, { field: e.target.value })}
                        className="flex-1 bg-slate-700 border border-slate-600 rounded text-xs px-2 py-1 text-slate-200">
                        {fields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                      </select>
                      <button onClick={() => removeFilter(rule.id)} className="text-slate-400 hover:text-red-400 p-0.5"><X size={12} /></button>
                    </div>
                    <select value={rule.operator} onChange={e => updateFilter(rule.id, { operator: e.target.value as Operator })}
                      className="w-full bg-slate-700 border border-slate-600 rounded text-xs px-2 py-1 text-slate-200">
                      {Object.entries(OPERATOR_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    {rule.operator !== 'is_empty' && (
                      fd?.enumValues ? (
                        <select value={rule.value} onChange={e => updateFilter(rule.id, { value: e.target.value })}
                          className="w-full bg-slate-700 border border-slate-600 rounded text-xs px-2 py-1 text-slate-200">
                          <option value="">-- Seleccionar --</option>
                          {fd.enumValues.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      ) : (
                        <div className="flex gap-1">
                          <input type={fd?.type === 'number' ? 'number' : fd?.type === 'date' ? 'date' : 'text'}
                            value={rule.value} onChange={e => updateFilter(rule.id, { value: e.target.value })}
                            placeholder="Valor" className="flex-1 bg-slate-700 border border-slate-600 rounded text-xs px-2 py-1 text-slate-200 placeholder-slate-500" />
                          {rule.operator === 'between' && (
                            <input type={fd?.type === 'number' ? 'number' : 'text'}
                              value={rule.value2 || ''} onChange={e => updateFilter(rule.id, { value2: e.target.value })}
                              placeholder="Hasta" className="flex-1 bg-slate-700 border border-slate-600 rounded text-xs px-2 py-1 text-slate-200 placeholder-slate-500" />
                          )}
                        </div>
                      )
                    )}
                  </div>
                )
              })}
              <button onClick={addFilter} className="w-full flex items-center justify-center gap-1 text-xs text-blue-400 hover:text-blue-300 py-1.5 border border-dashed border-slate-600 rounded-lg hover:border-blue-500/50 transition-colors">
                <Plus size={12} /> Agregar filtro
              </button>
            </div>
          )}

          {/* ---- GROUP BY ---- */}
          <SectionHeader id="groupby" icon={LayoutList} label="Agrupar por" />
          {sidebarSection === 'groupby' && (
            <div className="px-3 pb-3">
              <select value={groupBy} onChange={e => setGroupBy(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg text-xs px-3 py-2 text-slate-200">
                <option value="">Sin agrupacion</option>
                {fields.filter(f => f.type === 'string').map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            </div>
          )}

          {/* ---- SORT ---- */}
          <SectionHeader id="sort" icon={ArrowUpDown} label="Ordenar" />
          {sidebarSection === 'sort' && (
            <div className="px-3 pb-3 space-y-2">
              <select value={sortField} onChange={e => setSortField(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg text-xs px-3 py-2 text-slate-200">
                <option value="">Sin orden</option>
                {fields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
              {sortField && (
                <div className="flex gap-2">
                  <button onClick={() => setSortDir('asc')}
                    className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${sortDir === 'asc' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'bg-slate-700 text-slate-400 border border-slate-600'}`}>
                    Ascendente
                  </button>
                  <button onClick={() => setSortDir('desc')}
                    className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${sortDir === 'desc' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'bg-slate-700 text-slate-400 border border-slate-600'}`}>
                    Descendente
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ---- CHART TYPE ---- */}
          <SectionHeader id="chart" icon={BarChart3} label="Grafico" />
          {sidebarSection === 'chart' && (
            <div className="px-3 pb-3 grid grid-cols-3 gap-1.5">
              {([['none', LayoutList, 'Tabla'], ['bar', BarChart3, 'Barras'], ['line', TrendingUp, 'Linea'], ['pie', PieChartIcon, 'Pastel'], ['area', TrendingUp, 'Area']] as [ChartType, any, string][]).map(([type, Icon, label]) => (
                <button key={type} onClick={() => setChartType(type)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-colors ${chartType === type ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-transparent'}`}>
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* ---- DATE RANGE ---- */}
          <SectionHeader id="daterange" icon={Filter} label="Rango de Fechas" />
          {sidebarSection === 'daterange' && (
            <div className="px-3 pb-3 space-y-2">
              {dateFields.length > 0 && (
                <select value={dateField} onChange={e => setDateField(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg text-xs px-3 py-2 text-slate-200">
                  {dateFields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
              )}
              <select value={dateRange} onChange={e => setDateRange(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg text-xs px-3 py-2 text-slate-200">
                <option value="all">Todo el tiempo</option>
                <option value="today">Hoy</option>
                <option value="this_week">Esta semana</option>
                <option value="this_month">Este mes</option>
                <option value="this_quarter">Este trimestre</option>
                <option value="this_year">Este ano</option>
                <option value="custom">Personalizado</option>
              </select>
              {dateRange === 'custom' && (
                <div className="space-y-1">
                  <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded text-xs px-3 py-1.5 text-slate-200" />
                  <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded text-xs px-3 py-1.5 text-slate-200" />
                </div>
              )}
            </div>
          )}

          {/* ---- SAVED REPORTS ---- */}
          <SectionHeader id="saved" icon={FolderOpen} label={`Reportes Guardados (${savedReports.length})`} />
          {sidebarSection === 'saved' && (
            <div className="px-3 pb-3 space-y-2">
              <div className="flex gap-1">
                <input type="text" value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Nombre del reporte"
                  className="flex-1 bg-slate-700 border border-slate-600 rounded text-xs px-2 py-1.5 text-slate-200 placeholder-slate-500" />
                <button onClick={saveReport} disabled={!saveName.trim()}
                  className="px-2 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded text-xs text-white flex items-center gap-1 transition-colors">
                  <Save size={12} />
                </button>
              </div>
              {savedReports.length === 0 && <p className="text-xs text-slate-500 text-center py-2">Sin reportes guardados</p>}
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {savedReports.map(r => (
                  <div key={r.id} className="flex items-center gap-1 bg-slate-700/40 rounded-lg px-2 py-1.5 border border-slate-600/30">
                    <button onClick={() => loadReport(r)} className="flex-1 text-left text-xs text-slate-200 hover:text-blue-300 truncate" title={r.name}>
                      {r.name}
                    </button>
                    <span className="text-[10px] text-slate-500 shrink-0">{DATA_SOURCE_LABELS[r.dataSource]}</span>
                    <button onClick={() => deleteReport(r.id)} className="text-slate-500 hover:text-red-400 p-0.5 shrink-0"><Trash2 size={11} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ====================== MAIN AREA ====================== */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Top actions bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-xl font-bold text-white">
              Reporte: <span className="text-blue-400">{DATA_SOURCE_LABELS[dataSource]}</span>
            </h3>
            <p className="text-sm text-slate-400">
              Mostrando {filteredData.length} de {rawData.length} registros
              {groupBy && ` | Agrupado por: ${fields.find(f => f.key === groupBy)?.label || groupBy}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm text-slate-200 flex items-center gap-2 transition-colors">
              <Download size={14} /> CSV
            </button>
            <button onClick={exportPDF} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm text-slate-200 flex items-center gap-2 transition-colors">
              <Printer size={14} /> PDF
            </button>
          </div>
        </div>

        {/* Chart */}
        {chartType !== 'none' && groupBy && groupedData.length > 0 && (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
            <h4 className="text-sm font-semibold text-slate-300 mb-4">
              {fields.find(f => f.key === groupBy)?.label || groupBy} - Conteo
            </h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={groupedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : chartType === 'line' ? (
                  <LineChart data={groupedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="count" name="Cantidad" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                  </LineChart>
                ) : chartType === 'area' ? (
                  <AreaChart data={groupedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" name="Cantidad" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  </AreaChart>
                ) : (
                  <PieChart>
                    <Pie data={groupedData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                      {groupedData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {chartType !== 'none' && !groupBy && (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 text-center text-slate-400 text-sm">
            Selecciona un campo en "Agrupar por" para generar el grafico.
          </div>
        )}

        {/* Data Table */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 w-10">#</th>
                  {selectedCols.map(col => {
                    const fd = fields.find(f => f.key === col)
                    return (
                      <th key={col}
                        onClick={() => { setSortField(col); setSortDir(prev => sortField === col && prev === 'asc' ? 'desc' : 'asc') }}
                        className="px-3 py-3 text-left text-xs font-semibold text-slate-400 cursor-pointer hover:text-blue-400 transition-colors whitespace-nowrap select-none">
                        {fd?.label || col}
                        {sortField === col && <span className="ml-1">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan={selectedCols.length + 1} className="px-3 py-12 text-center text-slate-500">Sin datos que mostrar</td></tr>
                ) : (
                  filteredData.slice(0, 200).map((row, i) => (
                    <tr key={row.id || i} className="border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors">
                      <td className="px-3 py-2.5 text-xs text-slate-500">{i + 1}</td>
                      {selectedCols.map(col => {
                        const fd = fields.find(f => f.key === col)
                        let value = row[col]
                        // Resolve assigned_to ID to team name
                        if (col === 'assigned_to' && value && teamMap[value]) value = teamMap[value]
                        return (
                          <td key={col} className="px-3 py-2.5 text-xs text-slate-300 whitespace-nowrap max-w-[200px] truncate">
                            {col === 'status' ? (
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                value === 'new' || value === 'pending' ? 'bg-slate-600/50 text-slate-300' :
                                value === 'contacted' || value === 'in_review' || value === 'scheduled' ? 'bg-blue-600/30 text-blue-300' :
                                value === 'qualified' || value === 'sent_to_bank' ? 'bg-purple-600/30 text-purple-300' :
                                value === 'closed' || value === 'sold' || value === 'approved' || value === 'completed' || value === 'active' ? 'bg-green-600/30 text-green-300' :
                                value === 'lost' || value === 'fallen' || value === 'rejected' || value === 'cancelled' ? 'bg-red-600/30 text-red-300' :
                                'bg-slate-600/30 text-slate-300'
                              }`}>
                                {value || '-'}
                              </span>
                            ) : (
                              formatCell(value, fd)
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredData.length > 200 && (
            <div className="px-4 py-2 text-xs text-slate-500 border-t border-slate-700/30 text-center">
              Mostrando primeros 200 de {filteredData.length} registros. Exporta a CSV para ver todos.
            </div>
          )}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:hidden { display: none !important; }
          table { font-size: 10px; }
          th, td { padding: 4px 6px; border: 1px solid #ccc; }
        }
      `}</style>
    </div>
  )
}
