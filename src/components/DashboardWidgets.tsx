import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
import {
  Settings, X, Plus, ChevronUp, ChevronDown, RotateCcw,
  TrendingUp, TrendingDown, Users, Calendar, Target,
  AlertTriangle, DollarSign, BarChart3, PieChart as PieChartIcon,
  Clock, Flame, ArrowUpRight, GripVertical, Eye, EyeOff,
  LayoutGrid
} from 'lucide-react'
import type { Lead, TeamMember, MortgageApplication, Appointment, Property, Campaign } from '../types/crm'

// ============ TYPES ============

export type WidgetType =
  | 'kpi_card'
  | 'pipeline_chart'
  | 'source_chart'
  | 'recent_leads'
  | 'upcoming_appointments'
  | 'team_ranking'
  | 'goals_progress'
  | 'conversion_funnel'
  | 'hot_leads'
  | 'stalled_alerts'
  | 'monthly_trend'
  | 'mortgage_pipeline'

export type WidgetSize = 'small' | 'medium' | 'large'

export interface DashboardWidget {
  id: string
  type: WidgetType
  title: string
  size: WidgetSize
  visible: boolean
  order: number
  config?: Record<string, any>
}

export interface WidgetDataContext {
  leads: Lead[]
  filteredLeads: Lead[]
  team: TeamMember[]
  mortgages: MortgageApplication[]
  appointments: Appointment[]
  properties: Property[]
  campaigns: Campaign[]
  monthlyGoals: { month: string; company_goal: number }
  vendorGoals: { vendor_id: string; goal: number; name: string }[]
  setView: (view: any) => void
}

// ============ DEFAULT LAYOUT ============

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'kpi_leads', type: 'kpi_card', title: 'Total Leads', size: 'small', visible: true, order: 0, config: { metric: 'leads_count' } },
  { id: 'kpi_appointments', type: 'kpi_card', title: 'Citas Hoy', size: 'small', visible: true, order: 1, config: { metric: 'appointments_today' } },
  { id: 'kpi_conversion', type: 'kpi_card', title: 'Conversion', size: 'small', visible: true, order: 2, config: { metric: 'conversion_rate' } },
  { id: 'kpi_pipeline', type: 'kpi_card', title: 'Pipeline', size: 'small', visible: true, order: 3, config: { metric: 'pipeline_value' } },
  { id: 'pipeline_chart', type: 'pipeline_chart', title: 'Leads por Etapa', size: 'medium', visible: true, order: 4 },
  { id: 'source_chart', type: 'source_chart', title: 'Leads por Fuente', size: 'medium', visible: true, order: 5 },
  { id: 'conversion_funnel', type: 'conversion_funnel', title: 'Embudo de Conversion', size: 'medium', visible: true, order: 6 },
  { id: 'monthly_trend', type: 'monthly_trend', title: 'Tendencia Mensual', size: 'medium', visible: true, order: 7 },
  { id: 'recent_leads', type: 'recent_leads', title: 'Leads Recientes', size: 'medium', visible: true, order: 8 },
  { id: 'upcoming_appointments', type: 'upcoming_appointments', title: 'Proximas Citas', size: 'medium', visible: true, order: 9 },
  { id: 'team_ranking', type: 'team_ranking', title: 'Ranking Vendedores', size: 'medium', visible: true, order: 10 },
  { id: 'hot_leads', type: 'hot_leads', title: 'Leads Calientes', size: 'medium', visible: true, order: 11 },
  { id: 'goals_progress', type: 'goals_progress', title: 'Progreso de Metas', size: 'medium', visible: true, order: 12 },
  { id: 'stalled_alerts', type: 'stalled_alerts', title: 'Alertas Estancados', size: 'medium', visible: true, order: 13 },
  { id: 'mortgage_pipeline', type: 'mortgage_pipeline', title: 'Pipeline Hipotecas', size: 'medium', visible: false, order: 14 },
]

const STORAGE_KEY = 'sara-dashboard-layout'
const VIEW_PREF_KEY = 'sara-dashboard-view-pref'

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#eab308', '#6b7280', '#ef4444']

const WIDGET_CATALOG: { type: WidgetType; label: string; icon: any; defaultSize: WidgetSize }[] = [
  { type: 'kpi_card', label: 'Tarjeta KPI', icon: BarChart3, defaultSize: 'small' },
  { type: 'pipeline_chart', label: 'Leads por Etapa', icon: BarChart3, defaultSize: 'medium' },
  { type: 'source_chart', label: 'Leads por Fuente', icon: PieChartIcon, defaultSize: 'medium' },
  { type: 'recent_leads', label: 'Leads Recientes', icon: Users, defaultSize: 'medium' },
  { type: 'upcoming_appointments', label: 'Proximas Citas', icon: Calendar, defaultSize: 'medium' },
  { type: 'team_ranking', label: 'Ranking Vendedores', icon: Target, defaultSize: 'medium' },
  { type: 'goals_progress', label: 'Progreso de Metas', icon: Target, defaultSize: 'medium' },
  { type: 'conversion_funnel', label: 'Embudo de Conversion', icon: TrendingUp, defaultSize: 'medium' },
  { type: 'hot_leads', label: 'Leads Calientes', icon: Flame, defaultSize: 'medium' },
  { type: 'stalled_alerts', label: 'Alertas Estancados', icon: AlertTriangle, defaultSize: 'medium' },
  { type: 'monthly_trend', label: 'Tendencia Mensual', icon: TrendingUp, defaultSize: 'medium' },
  { type: 'mortgage_pipeline', label: 'Pipeline Hipotecas', icon: DollarSign, defaultSize: 'medium' },
]

// ============ HELPERS ============

function loadLayout(): DashboardWidget[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as DashboardWidget[]
      // Merge with defaults to pick up any new widgets added in code
      const ids = new Set(parsed.map(w => w.id))
      const newDefaults = DEFAULT_WIDGETS.filter(w => !ids.has(w.id))
      return [...parsed, ...newDefaults.map(w => ({ ...w, order: parsed.length + w.order }))]
    }
  } catch { /* ignore */ }
  return DEFAULT_WIDGETS.map(w => ({ ...w }))
}

function saveLayout(widgets: DashboardWidget[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets))
}

export function loadViewPreference(): 'classic' | 'custom' {
  try {
    return (localStorage.getItem(VIEW_PREF_KEY) as 'classic' | 'custom') || 'classic'
  } catch { return 'classic' }
}

export function saveViewPreference(pref: 'classic' | 'custom') {
  localStorage.setItem(VIEW_PREF_KEY, pref)
}

function sizeToSpan(size: WidgetSize): string {
  switch (size) {
    case 'small': return 'col-span-1'
    case 'medium': return 'col-span-1 sm:col-span-2'
    case 'large': return 'col-span-1 sm:col-span-2 lg:col-span-4'
  }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo', contacted: 'Contactado', scheduled: 'Cita',
  visited: 'Visita', negotiation: 'Negociacion', reserved: 'Reservado',
  closed: 'Cerrado', delivered: 'Entregado', lost: 'Perdido', inactive: 'Inactivo'
}

const STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6', contacted: '#8b5cf6', scheduled: '#f59e0b',
  visited: '#14b8a6', negotiation: '#f97316', reserved: '#ec4899',
  closed: '#22c55e', delivered: '#10b981', lost: '#ef4444', inactive: '#6b7280'
}

// ============ WIDGET RENDERERS ============

function KpiCardWidget({ widget, data }: { widget: DashboardWidget; data: WidgetDataContext }) {
  const metric = widget.config?.metric || 'leads_count'

  const { value, label, trend, trendValue, icon: Icon, color } = useMemo(() => {
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    switch (metric) {
      case 'leads_count': {
        const total = data.filteredLeads.length
        const thisMonthCount = data.filteredLeads.filter(l => {
          const d = new Date(l.created_at)
          return d.getMonth() === thisMonth && d.getFullYear() === thisYear
        }).length
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
        const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear
        const lastMonthCount = data.filteredLeads.filter(l => {
          const d = new Date(l.created_at)
          return d.getMonth() === lastMonth && d.getFullYear() === lastYear
        }).length
        const pct = lastMonthCount > 0 ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100) : 0
        return { value: total, label: 'Total Leads', trend: pct >= 0 ? 'up' : 'down', trendValue: `${Math.abs(pct)}%`, icon: Users, color: 'text-blue-400' }
      }
      case 'appointments_today': {
        const today = now.toISOString().slice(0, 10)
        const count = data.appointments.filter(a => a.scheduled_date === today).length
        return { value: count, label: 'Citas Hoy', trend: 'neutral' as const, trendValue: '', icon: Calendar, color: 'text-purple-400' }
      }
      case 'conversion_rate': {
        const total = data.filteredLeads.length
        const closed = data.filteredLeads.filter(l => l.status === 'closed' || l.status === 'delivered').length
        const rate = total > 0 ? ((closed / total) * 100).toFixed(1) : '0'
        return { value: `${rate}%`, label: 'Tasa Conversion', trend: parseFloat(rate as string) >= 5 ? 'up' : 'down', trendValue: '', icon: TrendingUp, color: 'text-green-400' }
      }
      case 'avg_score': {
        const scores = data.filteredLeads.map(l => l.score).filter(s => s > 0)
        const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
        return { value: avg, label: 'Score Promedio', trend: avg >= 50 ? 'up' : 'down', trendValue: '', icon: Target, color: 'text-yellow-400' }
      }
      case 'pipeline_value': {
        const avgTicket = (() => {
          const closedLeads = data.leads.filter(l => ['closed', 'sold', 'delivered'].includes(l.status))
          if (closedLeads.length === 0) return 2000000
          const total = closedLeads.reduce((sum, l) => {
            const prop = data.properties.find(p => p.name === l.property_interest)
            return sum + (prop?.price_equipped || prop?.price || 2000000)
          }, 0)
          return Math.round(total / closedLeads.length)
        })()
        const stageValues: Record<string, number> = {
          negotiation: avgTicket * 0.6, reserved: avgTicket * 0.85, visited: avgTicket * 0.4
        }
        const val = data.leads.reduce((sum, l) => sum + (stageValues[l.status] || 0), 0)
        return { value: formatNumber(val), label: 'Pipeline', trend: 'up', trendValue: '', icon: DollarSign, color: 'text-emerald-400' }
      }
      default:
        return { value: 0, label: metric, trend: 'neutral', trendValue: '', icon: BarChart3, color: 'text-slate-400' }
    }
  }, [data, metric])

  return (
    <div className="flex items-center justify-between h-full">
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl lg:text-3xl font-bold mt-1">{value}</p>
        {trendValue && (
          <div className={`flex items-center gap-1 mt-1 text-xs ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trendValue} vs mes ant.</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl bg-slate-700/50 ${color}`}>
        <Icon size={24} />
      </div>
    </div>
  )
}

function PipelineChartWidget({ data }: { data: WidgetDataContext }) {
  const chartData = useMemo(() => {
    const stages = ['new', 'contacted', 'scheduled', 'visited', 'negotiation', 'reserved', 'closed']
    return stages.map(s => ({
      name: STATUS_LABELS[s] || s,
      value: data.filteredLeads.filter(l => l.status === s).length,
      fill: STATUS_COLORS[s] || '#6b7280'
    }))
  }, [data.filteredLeads])

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData}>
        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function SourceChartWidget({ data }: { data: WidgetDataContext }) {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {}
    data.filteredLeads.forEach(l => {
      const src = l.source || 'Directo'
      counts[src] = (counts[src] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
  }, [data.filteredLeads])

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="50%" height={180}>
        <PieChart>
          <Pie data={chartData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={2}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-1">
        {chartData.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="text-slate-300 truncate max-w-[100px]">{item.name}</span>
            </div>
            <span className="text-white font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentLeadsWidget({ data }: { data: WidgetDataContext }) {
  const recent = useMemo(() => {
    return [...data.filteredLeads]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  }, [data.filteredLeads])

  return (
    <div className="space-y-2">
      {recent.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Sin leads recientes</p>}
      {recent.map(lead => (
        <div key={lead.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => data.setView('leads')}>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{lead.name}</p>
            <p className="text-xs text-slate-400">{lead.property_interest || 'Sin interes'}</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${lead.score >= 70 ? 'bg-red-500/20 text-red-400' : lead.score >= 40 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {lead.score}
            </span>
            <span className="text-xs text-slate-500 px-1.5 py-0.5 rounded bg-slate-600/50">
              {STATUS_LABELS[lead.status] || lead.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function UpcomingAppointmentsWidget({ data }: { data: WidgetDataContext }) {
  const upcoming = useMemo(() => {
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)
    return data.appointments
      .filter(a => (a.scheduled_date || '') >= todayStr && a.status !== 'cancelled')
      .sort((a, b) => `${a.scheduled_date}${a.scheduled_time}`.localeCompare(`${b.scheduled_date}${b.scheduled_time}`))
      .slice(0, 5)
  }, [data.appointments])

  return (
    <div className="space-y-2">
      {upcoming.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Sin citas proximas</p>}
      {upcoming.map(apt => {
        const lead = data.leads.find(l => l.id === apt.lead_id)
        const aptDate = apt.scheduled_date || ''
        const aptTime = apt.scheduled_time || ''
        return (
          <div key={apt.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30">
            <div className="flex items-center gap-2">
              <div className="text-center bg-blue-500/10 rounded-lg px-2 py-1">
                <p className="text-xs text-blue-300 font-bold">{aptDate.slice(8, 10)}</p>
                <p className="text-[10px] text-blue-400">{aptDate ? new Date(aptDate + 'T00:00:00').toLocaleDateString('es-MX', { month: 'short' }) : ''}</p>
              </div>
              <div>
                <p className="text-sm text-white">{lead?.name || apt.lead_name || 'Lead'}</p>
                <p className="text-xs text-slate-400">{aptTime} - {apt.property_name || lead?.property_interest || ''}</p>
              </div>
            </div>
            <Clock size={14} className="text-slate-500" />
          </div>
        )
      })}
    </div>
  )
}

function TeamRankingWidget({ data }: { data: WidgetDataContext }) {
  const ranking = useMemo(() => {
    return data.team
      .filter(t => t.role === 'vendedor' && t.active)
      .map(v => {
        const vLeads = data.filteredLeads.filter(l => l.assigned_to === v.id)
        const closed = vLeads.filter(l => l.status === 'closed' || l.status === 'delivered').length
        return {
          name: v.name?.split(' ')[0] || 'N/A',
          sales: v.sales_count || closed,
          leads: vLeads.length,
          conversion: vLeads.length > 0 ? Math.round((closed / vLeads.length) * 100) : 0
        }
      })
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
  }, [data.team, data.filteredLeads])

  return (
    <div className="space-y-2">
      {ranking.map((v, i) => (
        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-600/20 text-slate-500'}`}>
              {i + 1}
            </span>
            <span className="text-sm text-white">{v.name}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">{v.leads} leads</span>
            <span className="text-green-400 font-bold">{v.sales} ventas</span>
            <span className="text-blue-400">{v.conversion}%</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function GoalsProgressWidget({ data }: { data: WidgetDataContext }) {
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  const currentSales = data.filteredLeads.filter(l => {
    const d = new Date(l.status_changed_at || l.created_at)
    return (l.status === 'closed' || l.status === 'delivered') &&
      d.getMonth() === thisMonth && d.getFullYear() === thisYear
  }).length

  const companyGoal = data.monthlyGoals.company_goal || 0
  const companyPct = companyGoal > 0 ? Math.min(100, Math.round((currentSales / companyGoal) * 100)) : 0

  return (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">Meta empresa</span>
          <span className="text-white font-medium">{currentSales}/{companyGoal}</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${companyPct}%`, background: companyPct >= 80 ? '#22c55e' : companyPct >= 50 ? '#f59e0b' : '#ef4444' }} />
        </div>
        <p className="text-xs text-right text-slate-500 mt-0.5">{companyPct}%</p>
      </div>
      {data.vendorGoals.slice(0, 4).map(vg => {
        const vendorSales = data.filteredLeads.filter(l => {
          const d = new Date(l.status_changed_at || l.created_at)
          return l.assigned_to === vg.vendor_id &&
            (l.status === 'closed' || l.status === 'delivered') &&
            d.getMonth() === thisMonth && d.getFullYear() === thisYear
        }).length
        const pct = vg.goal > 0 ? Math.min(100, Math.round((vendorSales / vg.goal) * 100)) : 0
        return (
          <div key={vg.vendor_id}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">{vg.name?.split(' ')[0]}</span>
              <span className="text-white">{vendorSales}/{vg.goal}</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ConversionFunnelWidget({ data }: { data: WidgetDataContext }) {
  const stages = ['new', 'contacted', 'scheduled', 'visited', 'negotiation', 'reserved', 'closed']
  const funnelData = useMemo(() => {
    const total = data.filteredLeads.length
    return stages.map(s => {
      const count = data.filteredLeads.filter(l => l.status === s || stages.indexOf(l.status) > stages.indexOf(s)).length
      return {
        stage: STATUS_LABELS[s] || s,
        count: data.filteredLeads.filter(l => l.status === s).length,
        cumulative: count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
        color: STATUS_COLORS[s]
      }
    })
  }, [data.filteredLeads])

  return (
    <div className="space-y-1.5">
      {funnelData.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-20 text-right truncate">{item.stage}</span>
          <div className="flex-1 h-5 bg-slate-700/50 rounded overflow-hidden relative">
            <div className="h-full rounded transition-all duration-500" style={{ width: `${item.pct}%`, background: item.color, opacity: 0.7 }} />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium">
              {item.count} ({item.pct}%)
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function HotLeadsWidget({ data }: { data: WidgetDataContext }) {
  const hotLeads = useMemo(() => {
    return data.filteredLeads
      .filter(l => l.score >= 70)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
  }, [data.filteredLeads])

  return (
    <div className="space-y-2">
      {hotLeads.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Sin leads calientes (score &gt; 70)</p>}
      {hotLeads.map(lead => (
        <div key={lead.id} className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors cursor-pointer" onClick={() => data.setView('leads')}>
          <div className="flex items-center gap-2">
            <Flame size={14} className="text-red-400" />
            <div>
              <p className="text-sm text-white">{lead.name}</p>
              <p className="text-xs text-slate-400">{STATUS_LABELS[lead.status] || lead.status}</p>
            </div>
          </div>
          <span className="text-sm font-bold text-red-400">{lead.score}</span>
        </div>
      ))}
    </div>
  )
}

function StalledAlertsWidget({ data }: { data: WidgetDataContext }) {
  const stalled = useMemo(() => {
    const now = Date.now()
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000
    return data.filteredLeads
      .filter(l => {
        if (['closed', 'delivered', 'lost', 'inactive'].includes(l.status)) return false
        const lastUpdate = new Date(l.status_changed_at || l.updated_at || l.created_at).getTime()
        return (now - lastUpdate) > THREE_DAYS_MS
      })
      .sort((a, b) => {
        const aTime = new Date(a.status_changed_at || a.updated_at || a.created_at).getTime()
        const bTime = new Date(b.status_changed_at || b.updated_at || b.created_at).getTime()
        return aTime - bTime
      })
      .slice(0, 6)
  }, [data.filteredLeads])

  return (
    <div className="space-y-2">
      {stalled.length === 0 && <p className="text-green-400 text-sm text-center py-4">Sin leads estancados</p>}
      {stalled.map(lead => {
        const daysStuck = Math.floor((Date.now() - new Date(lead.status_changed_at || lead.updated_at || lead.created_at).getTime()) / (1000 * 60 * 60 * 24))
        return (
          <div key={lead.id} className="flex items-center justify-between p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-yellow-400" />
              <div>
                <p className="text-sm text-white">{lead.name}</p>
                <p className="text-xs text-slate-400">{STATUS_LABELS[lead.status] || lead.status}</p>
              </div>
            </div>
            <span className="text-xs text-yellow-400 font-medium">{daysStuck}d</span>
          </div>
        )
      })}
    </div>
  )
}

function MonthlyTrendWidget({ data }: { data: WidgetDataContext }) {
  const trendData = useMemo(() => {
    const months: { month: string; leads: number; closed: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStr = date.toLocaleDateString('es-MX', { month: 'short' })
      const monthNum = date.getMonth()
      const yearNum = date.getFullYear()

      const monthLeads = data.leads.filter(l => {
        const d = new Date(l.created_at)
        return d.getMonth() === monthNum && d.getFullYear() === yearNum
      }).length

      const monthClosed = data.leads.filter(l => {
        const d = new Date(l.updated_at || l.created_at)
        return d.getMonth() === monthNum && d.getFullYear() === yearNum && (l.status === 'closed' || l.status === 'delivered')
      }).length

      months.push({ month: monthStr, leads: monthLeads, closed: monthClosed })
    }
    return months
  }, [data.leads])

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={trendData}>
        <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
        <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Leads" />
        <Line type="monotone" dataKey="closed" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Cerrados" />
      </LineChart>
    </ResponsiveContainer>
  )
}

function MortgagePipelineWidget({ data }: { data: WidgetDataContext }) {
  const stages = ['pending', 'in_review', 'sent_to_bank', 'approved', 'rejected']
  const stageLabels: Record<string, string> = {
    pending: 'Pendiente', in_review: 'En Revision', sent_to_bank: 'En Banco',
    approved: 'Aprobado', rejected: 'Rechazado'
  }
  const stageColors: Record<string, string> = {
    pending: '#f59e0b', in_review: '#3b82f6', sent_to_bank: '#8b5cf6',
    approved: '#22c55e', rejected: '#ef4444'
  }

  return (
    <div className="space-y-2">
      {stages.map(stage => {
        const count = data.mortgages.filter(m => m.status === stage).length
        return (
          <div key={stage} className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-20 text-right">{stageLabels[stage]}</span>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-4 bg-slate-700/50 rounded overflow-hidden">
                <div className="h-full rounded" style={{ width: `${data.mortgages.length > 0 ? (count / data.mortgages.length) * 100 : 0}%`, background: stageColors[stage] }} />
              </div>
              <span className="text-xs text-white font-medium w-6 text-right">{count}</span>
            </div>
          </div>
        )
      })}
      {data.mortgages.length === 0 && <p className="text-slate-500 text-sm text-center py-2">Sin hipotecas</p>}
    </div>
  )
}

// ============ WIDGET CARD WRAPPER ============

function WidgetCard({
  widget,
  data,
  isEditing,
  onRemove,
  onMoveUp,
  onMoveDown,
  onResize,
}: {
  widget: DashboardWidget
  data: WidgetDataContext
  isEditing: boolean
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onResize: (size: WidgetSize) => void
}) {
  const renderContent = () => {
    switch (widget.type) {
      case 'kpi_card': return <KpiCardWidget widget={widget} data={data} />
      case 'pipeline_chart': return <PipelineChartWidget data={data} />
      case 'source_chart': return <SourceChartWidget data={data} />
      case 'recent_leads': return <RecentLeadsWidget data={data} />
      case 'upcoming_appointments': return <UpcomingAppointmentsWidget data={data} />
      case 'team_ranking': return <TeamRankingWidget data={data} />
      case 'goals_progress': return <GoalsProgressWidget data={data} />
      case 'conversion_funnel': return <ConversionFunnelWidget data={data} />
      case 'hot_leads': return <HotLeadsWidget data={data} />
      case 'stalled_alerts': return <StalledAlertsWidget data={data} />
      case 'monthly_trend': return <MonthlyTrendWidget data={data} />
      case 'mortgage_pipeline': return <MortgagePipelineWidget data={data} />
      default: return <p className="text-slate-500">Widget desconocido</p>
    }
  }

  return (
    <div className={`${sizeToSpan(widget.size)} bg-slate-800/50 border rounded-xl overflow-hidden transition-all ${isEditing ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' : 'border-slate-700/50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          {isEditing && <GripVertical size={14} className="text-slate-500 cursor-grab" />}
          <h3 className="text-sm font-semibold text-slate-200">{widget.title}</h3>
        </div>
        <div className="flex items-center gap-1">
          {isEditing && (
            <>
              <button onClick={onMoveUp} className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Subir">
                <ChevronUp size={14} />
              </button>
              <button onClick={onMoveDown} className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Bajar">
                <ChevronDown size={14} />
              </button>
              <div className="flex items-center gap-0.5 ml-1 bg-slate-700/50 rounded p-0.5">
                {(['small', 'medium', 'large'] as WidgetSize[]).map(s => (
                  <button
                    key={s}
                    onClick={() => onResize(s)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${widget.size === s ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    {s === 'small' ? 'S' : s === 'medium' ? 'M' : 'L'}
                  </button>
                ))}
              </div>
              <button onClick={onRemove} className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors ml-1" title="Ocultar">
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>
      {/* Content */}
      <div className="p-4">
        {renderContent()}
      </div>
    </div>
  )
}

// ============ ADD WIDGET MODAL ============

function AddWidgetModal({
  existingIds,
  onAdd,
  onClose
}: {
  existingIds: Set<string>
  onAdd: (type: WidgetType, title: string, size: WidgetSize) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Agregar Widget</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
          {WIDGET_CATALOG.map(cat => {
            const alreadyHas = cat.type !== 'kpi_card' && existingIds.has(cat.type)
            const Icon = cat.icon
            return (
              <button
                key={cat.type}
                disabled={alreadyHas}
                onClick={() => {
                  const id = cat.type === 'kpi_card' ? `kpi_${Date.now()}` : cat.type
                  onAdd(cat.type, cat.label, cat.defaultSize)
                  if (cat.type !== 'kpi_card') onClose()
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${alreadyHas ? 'border-slate-700/30 bg-slate-700/20 opacity-40 cursor-not-allowed' : 'border-slate-600/50 bg-slate-700/30 hover:border-blue-500/50 hover:bg-blue-500/10 cursor-pointer'}`}
              >
                <div className="p-2 rounded-lg bg-slate-600/50">
                  <Icon size={16} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{cat.label}</p>
                  <p className="text-xs text-slate-400">{cat.defaultSize}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============ MAIN WIDGET GRID ============

export default function DashboardWidgetGrid({ data }: { data: WidgetDataContext }) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(loadLayout)
  const [isEditing, setIsEditing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const visibleWidgets = useMemo(() => {
    return widgets.filter(w => w.visible).sort((a, b) => a.order - b.order)
  }, [widgets])

  const updateWidgets = (updated: DashboardWidget[]) => {
    setWidgets(updated)
    saveLayout(updated)
  }

  const handleRemove = (id: string) => {
    updateWidgets(widgets.map(w => w.id === id ? { ...w, visible: false } : w))
  }

  const handleMoveUp = (id: string) => {
    const visible = widgets.filter(w => w.visible).sort((a, b) => a.order - b.order)
    const idx = visible.findIndex(w => w.id === id)
    if (idx <= 0) return
    const prev = visible[idx - 1]
    const curr = visible[idx]
    updateWidgets(widgets.map(w => {
      if (w.id === curr.id) return { ...w, order: prev.order }
      if (w.id === prev.id) return { ...w, order: curr.order }
      return w
    }))
  }

  const handleMoveDown = (id: string) => {
    const visible = widgets.filter(w => w.visible).sort((a, b) => a.order - b.order)
    const idx = visible.findIndex(w => w.id === id)
    if (idx < 0 || idx >= visible.length - 1) return
    const next = visible[idx + 1]
    const curr = visible[idx]
    updateWidgets(widgets.map(w => {
      if (w.id === curr.id) return { ...w, order: next.order }
      if (w.id === next.id) return { ...w, order: curr.order }
      return w
    }))
  }

  const handleResize = (id: string, size: WidgetSize) => {
    updateWidgets(widgets.map(w => w.id === id ? { ...w, size } : w))
  }

  const handleAdd = (type: WidgetType, title: string, size: WidgetSize) => {
    const maxOrder = Math.max(...widgets.map(w => w.order), -1)
    const id = type === 'kpi_card' ? `kpi_${Date.now()}` : type
    const newWidget: DashboardWidget = {
      id,
      type,
      title,
      size,
      visible: true,
      order: maxOrder + 1,
      config: type === 'kpi_card' ? { metric: 'leads_count' } : undefined
    }
    updateWidgets([...widgets, newWidget])
  }

  const handleReset = () => {
    const fresh = DEFAULT_WIDGETS.map(w => ({ ...w }))
    setWidgets(fresh)
    saveLayout(fresh)
    setIsEditing(false)
  }

  const handleRestoreWidget = (id: string) => {
    updateWidgets(widgets.map(w => w.id === id ? { ...w, visible: true } : w))
  }

  const hiddenWidgets = widgets.filter(w => !w.visible)
  const existingTypeIds = new Set(widgets.filter(w => w.visible).map(w => w.type === 'kpi_card' ? w.id : w.type))

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid size={18} className="text-blue-400" />
          <span className="text-sm text-slate-400">Vista personalizada</span>
          <span className="text-xs text-slate-600">({visibleWidgets.length} widgets)</span>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs font-medium transition-colors"
              >
                <Plus size={14} />
                Agregar widget
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white text-xs font-medium transition-colors"
              >
                <RotateCcw size={14} />
                Restablecer
              </button>
            </>
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isEditing ? 'bg-blue-500 text-white' : 'bg-slate-700/50 text-slate-400 hover:text-white'}`}
          >
            <Settings size={14} />
            {isEditing ? 'Listo' : 'Personalizar'}
          </button>
        </div>
      </div>

      {/* Hidden widgets restore bar */}
      {isEditing && hiddenWidgets.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <span className="text-xs text-slate-500 mr-1">Widgets ocultos:</span>
          {hiddenWidgets.map(w => (
            <button
              key={w.id}
              onClick={() => handleRestoreWidget(w.id)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700/40 text-slate-400 hover:text-white hover:bg-slate-700 text-xs transition-colors"
            >
              <Eye size={12} />
              {w.title}
            </button>
          ))}
        </div>
      )}

      {/* Widget Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleWidgets.map(widget => (
          <WidgetCard
            key={widget.id}
            widget={widget}
            data={data}
            isEditing={isEditing}
            onRemove={() => handleRemove(widget.id)}
            onMoveUp={() => handleMoveUp(widget.id)}
            onMoveDown={() => handleMoveDown(widget.id)}
            onResize={(size) => handleResize(widget.id, size)}
          />
        ))}
      </div>

      {visibleWidgets.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <LayoutGrid size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Sin widgets visibles</p>
          <p className="text-sm mt-1">Haz clic en "Personalizar" para agregar widgets a tu dashboard</p>
        </div>
      )}

      {/* Add Widget Modal */}
      {showAddModal && (
        <AddWidgetModal
          existingIds={existingTypeIds}
          onAdd={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
