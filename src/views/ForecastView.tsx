import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, DollarSign, Users, Target, Clock, BarChart3, RefreshCw } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, CartesianGrid, Area, AreaChart
} from 'recharts'
import { useCrm } from '../context/CrmContext'
import { STATUS_LABELS } from '../types/crm'

// Stage probabilities for weighted forecast
const STAGE_PROBABILITY: Record<string, number> = {
  new: 0.05,
  contacted: 0.10,
  qualified: 0.20,
  scheduled: 0.30,
  visited: 0.45,
  negotiation: 0.60,
  reserved: 0.75,
  closed: 0.90,
  delivered: 0.95,
  sold: 1.00,
}

// Ordered pipeline stages (excluding terminal negative statuses)
const PIPELINE_STAGES = [
  'new', 'contacted', 'qualified', 'scheduled', 'visited',
  'negotiation', 'reserved', 'closed', 'delivered', 'sold'
]

// Average days to close from each stage (fallback when no historical data)
const DEFAULT_DAYS_TO_CLOSE: Record<string, number> = {
  new: 120,
  contacted: 100,
  qualified: 80,
  scheduled: 60,
  visited: 45,
  negotiation: 30,
  reserved: 20,
  closed: 10,
  delivered: 5,
  sold: 0,
}

function parseBudget(budget: string | undefined): number {
  if (!budget) return 0
  const cleaned = String(budget).replace(/[^0-9.]/g, '')
  const val = parseFloat(cleaned)
  return isNaN(val) ? 0 : val
}

function formatMoney(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

function formatMoneyFull(value: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value)
}

function daysBetween(d1: string, d2: string): number {
  return Math.abs(new Date(d2).getTime() - new Date(d1).getTime()) / (1000 * 60 * 60 * 24)
}

export default function ForecastView() {
  const { leads, team, properties, supabase, showToast } = useCrm()

  const [monthlyGoal, setMonthlyGoal] = useState<number>(0)

  // Load monthly goal
  useEffect(() => {
    const loadGoal = async () => {
      try {
        const currentMonth = new Date().toISOString().slice(0, 7)
        const { data } = await supabase
          .from('monthly_goals')
          .select('company_goal')
          .eq('month', currentMonth)
          .single()
        if (data?.company_goal) setMonthlyGoal(data.company_goal)
      } catch { /* no goal set */ }
    }
    loadGoal()
  }, [])

  // =============== COMPUTED DATA ===============

  // Active pipeline leads (exclude lost, fallen, inactive, paused)
  const pipelineLeads = useMemo(() =>
    leads.filter(l => PIPELINE_STAGES.includes(l.status)),
    [leads]
  )

  // === KPI: Total Pipeline Value ===
  const totalPipelineValue = useMemo(() =>
    pipelineLeads.reduce((sum, l) => sum + parseBudget(l.budget), 0),
    [pipelineLeads]
  )

  // === KPI: Weighted Forecast ===
  const weightedForecast = useMemo(() =>
    pipelineLeads.reduce((sum, l) => {
      const prob = STAGE_PROBABILITY[l.status] || 0
      return sum + parseBudget(l.budget) * prob
    }, 0),
    [pipelineLeads]
  )

  // === KPI: Avg Deal Size ===
  const soldLeads = useMemo(() => leads.filter(l => l.status === 'sold'), [leads])
  const avgDealSize = useMemo(() => {
    if (soldLeads.length === 0) return 0
    return soldLeads.reduce((sum, l) => sum + parseBudget(l.budget), 0) / soldLeads.length
  }, [soldLeads])

  // === KPI: Win Rate ===
  const winRate = useMemo(() => {
    const closed = leads.filter(l => ['sold', 'lost', 'fallen'].includes(l.status))
    if (closed.length === 0) return 0
    return (soldLeads.length / closed.length) * 100
  }, [leads, soldLeads])

  // === KPI: Avg Sales Cycle ===
  const avgSalesCycle = useMemo(() => {
    const completedDeals = soldLeads.filter(l => l.created_at && l.status_changed_at)
    if (completedDeals.length === 0) return 0
    const totalDays = completedDeals.reduce((sum, l) =>
      sum + daysBetween(l.created_at, l.status_changed_at!), 0
    )
    return Math.round(totalDays / completedDeals.length)
  }, [soldLeads])

  // === Revenue Forecast by Stage ===
  const stageData = useMemo(() => {
    let cumulative = 0
    return PIPELINE_STAGES.map(stage => {
      const stageLeads = pipelineLeads.filter(l => l.status === stage)
      const totalBudget = stageLeads.reduce((sum, l) => sum + parseBudget(l.budget), 0)
      const probability = STAGE_PROBABILITY[stage] || 0
      const weighted = totalBudget * probability
      cumulative += weighted
      return {
        stage: STATUS_LABELS[stage] || stage,
        stageKey: stage,
        count: stageLeads.length,
        totalBudget,
        probability: Math.round(probability * 100),
        weighted,
        cumulative,
        unweighted: totalBudget - weighted,
      }
    })
  }, [pipelineLeads])

  // === Historical stage velocity (avg days per stage) ===
  const stageVelocity = useMemo(() => {
    const velocity: Record<string, number> = {}
    // Use leads with status_changed_at to estimate velocity
    const leadsWithChanges = leads.filter(l => l.status_changed_at && l.created_at)

    PIPELINE_STAGES.forEach(stage => {
      const stageLeads = leadsWithChanges.filter(l => l.status === stage)
      if (stageLeads.length > 3) {
        const avgDays = stageLeads.reduce((sum, l) => {
          return sum + daysBetween(l.created_at, l.status_changed_at!)
        }, 0) / stageLeads.length
        velocity[stage] = Math.round(avgDays)
      } else {
        velocity[stage] = DEFAULT_DAYS_TO_CLOSE[stage]
      }
    })

    return velocity
  }, [leads])

  // === Monthly Forecast (next 6 months) ===
  const monthlyForecast = useMemo(() => {
    const now = new Date()
    const months: { month: string; label: string; optimistic: number; projected: number; pessimistic: number }[] = []

    for (let i = 0; i < 6; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const monthKey = targetDate.toISOString().slice(0, 7)
      const label = targetDate.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
      months.push({ month: monthKey, label, optimistic: 0, projected: 0, pessimistic: 0 })
    }

    // Project each pipeline lead's close date based on stage velocity
    pipelineLeads.forEach(lead => {
      const budget = parseBudget(lead.budget)
      if (budget === 0) return

      const daysToClose = stageVelocity[lead.status] || DEFAULT_DAYS_TO_CLOSE[lead.status] || 90
      const probability = STAGE_PROBABILITY[lead.status] || 0
      const projectedCloseDate = new Date(Date.now() + daysToClose * 24 * 60 * 60 * 1000)
      const closeMonth = projectedCloseDate.toISOString().slice(0, 7)

      const monthEntry = months.find(m => m.month === closeMonth)
      if (monthEntry) {
        const weightedValue = budget * probability
        monthEntry.projected += weightedValue
        monthEntry.optimistic += weightedValue * 1.20
        monthEntry.pessimistic += weightedValue * 0.70
      }
    })

    return months
  }, [pipelineLeads, stageVelocity])

  // === Vendor Breakdown ===
  const vendorBreakdown = useMemo(() => {
    const vendedores = team.filter(t => t.role === 'vendedor' && t.active)

    return vendedores.map(v => {
      const vLeads = pipelineLeads.filter(l => l.assigned_to === v.id)
      const pipelineValue = vLeads.reduce((sum, l) => sum + parseBudget(l.budget), 0)
      const weighted = vLeads.reduce((sum, l) => sum + parseBudget(l.budget) * (STAGE_PROBABILITY[l.status] || 0), 0)
      const soldCount = leads.filter(l => l.assigned_to === v.id && l.status === 'sold').length
      const totalClosed = leads.filter(l => l.assigned_to === v.id && ['sold', 'lost', 'fallen'].includes(l.status)).length
      const vendorWinRate = totalClosed > 0 ? (soldCount / totalClosed) * 100 : 0

      return {
        id: v.id,
        name: v.name,
        photo: v.photo_url,
        leadsCount: vLeads.length,
        pipelineValue,
        weightedForecast: weighted,
        soldCount,
        winRate: vendorWinRate,
      }
    }).sort((a, b) => b.weightedForecast - a.weightedForecast)
  }, [team, pipelineLeads, leads])

  // === Chart data for stacked bar ===
  const barChartData = useMemo(() =>
    stageData.map(s => ({
      name: s.stage,
      'Ponderado': Math.round(s.weighted),
      'No ponderado': Math.round(s.unweighted),
    })),
    [stageData]
  )

  // =============== RENDER ===============

  const kpis = [
    { label: 'Pipeline Total', value: formatMoney(totalPipelineValue), icon: DollarSign, color: 'from-blue-500 to-cyan-500' },
    { label: 'Forecast Ponderado', value: formatMoney(weightedForecast), icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
    { label: 'Ticket Promedio', value: formatMoney(avgDealSize), icon: BarChart3, color: 'from-purple-500 to-violet-500' },
    { label: 'Win Rate', value: `${winRate.toFixed(1)}%`, icon: Target, color: 'from-amber-500 to-orange-500' },
    { label: 'Ciclo Promedio', value: `${avgSalesCycle}d`, icon: Clock, color: 'from-rose-500 to-pink-500' },
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
        <p className="text-slate-300 font-semibold text-sm mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm" style={{ color: p.color }}>
            {p.name}: {formatMoneyFull(p.value)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 section-enter">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
          Pipeline Forecast
        </h2>
        <div className="text-sm text-slate-400">
          {pipelineLeads.length} leads activos en pipeline
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${kpi.color}`}>
                <kpi.icon size={16} className="text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-xs text-slate-400 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Forecast vs Goal */}
      {monthlyGoal > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-3">Forecast vs Meta Mensual</h3>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Progreso forecast ponderado</span>
                <span className="text-white font-semibold">
                  {formatMoney(weightedForecast)} / {formatMoney(monthlyGoal)}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    weightedForecast >= monthlyGoal
                      ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                      : weightedForecast >= monthlyGoal * 0.7
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                        : 'bg-gradient-to-r from-red-500 to-rose-400'
                  }`}
                  style={{ width: `${Math.min((weightedForecast / monthlyGoal) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-slate-500">{((weightedForecast / monthlyGoal) * 100).toFixed(0)}% de meta</span>
                <span className="text-slate-500">
                  {weightedForecast >= monthlyGoal
                    ? 'Meta superada'
                    : `Faltan ${formatMoney(monthlyGoal - weightedForecast)}`
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Forecast by Stage */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Stage Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Forecast por Etapa</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-2 px-2">Etapa</th>
                  <th className="text-right py-2 px-2">#</th>
                  <th className="text-right py-2 px-2">Valor</th>
                  <th className="text-right py-2 px-2">Prob</th>
                  <th className="text-right py-2 px-2">Ponderado</th>
                  <th className="text-right py-2 px-2">Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {stageData.map((s) => (
                  <tr key={s.stageKey} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-2 px-2 text-white font-medium">{s.stage}</td>
                    <td className="py-2 px-2 text-right text-slate-300">{s.count}</td>
                    <td className="py-2 px-2 text-right text-slate-300">{formatMoney(s.totalBudget)}</td>
                    <td className="py-2 px-2 text-right">
                      <span className="text-blue-400 font-semibold">{s.probability}%</span>
                    </td>
                    <td className="py-2 px-2 text-right text-green-400 font-semibold">{formatMoney(s.weighted)}</td>
                    <td className="py-2 px-2 text-right text-cyan-400">{formatMoney(s.cumulative)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-600">
                  <td className="py-2 px-2 text-white font-bold">Total</td>
                  <td className="py-2 px-2 text-right text-white font-bold">{pipelineLeads.length}</td>
                  <td className="py-2 px-2 text-right text-white font-bold">{formatMoney(totalPipelineValue)}</td>
                  <td className="py-2 px-2"></td>
                  <td className="py-2 px-2 text-right text-green-400 font-bold">{formatMoney(weightedForecast)}</td>
                  <td className="py-2 px-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Stacked Bar Chart */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Valor Ponderado vs No Ponderado</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={barChartData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" tickFormatter={(v) => formatMoney(v)} stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={80} stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Bar dataKey="Ponderado" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="No ponderado" stackId="a" fill="#1e3a5f" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Forecast */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white mb-1">Proyeccion Mensual (6 meses)</h3>
        <p className="text-xs text-slate-500 mb-4">Basado en velocidad de pipeline y probabilidad por etapa. Bandas: optimista (+20%), pesimista (-30%)</p>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={monthlyForecast} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => formatMoney(v)} stroke="#94a3b8" tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            <Area
              type="monotone"
              dataKey="optimistic"
              name="Optimista"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.08}
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="projected"
              name="Proyectado"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.15}
              strokeWidth={2.5}
            />
            <Area
              type="monotone"
              dataKey="pessimistic"
              name="Pesimista"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.06}
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Vendor Breakdown Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Forecast por Vendedor</h3>
        {vendorBreakdown.length === 0 ? (
          <p className="text-slate-500 text-sm">No hay vendedores activos</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-3 px-3">Vendedor</th>
                  <th className="text-right py-3 px-2">Leads</th>
                  <th className="text-right py-3 px-2">Pipeline</th>
                  <th className="text-right py-3 px-2">Forecast</th>
                  <th className="text-right py-3 px-2">Ventas</th>
                  <th className="text-right py-3 px-2">Win Rate</th>
                  <th className="text-left py-3 px-2">Contribucion</th>
                </tr>
              </thead>
              <tbody>
                {vendorBreakdown.map((v) => {
                  const contribution = weightedForecast > 0 ? (v.weightedForecast / weightedForecast) * 100 : 0
                  return (
                    <tr key={v.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          {v.photo ? (
                            <img src={v.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white">
                              {v.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-white font-medium">{v.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right text-slate-300">{v.leadsCount}</td>
                      <td className="py-3 px-2 text-right text-slate-300">{formatMoney(v.pipelineValue)}</td>
                      <td className="py-3 px-2 text-right text-green-400 font-semibold">{formatMoney(v.weightedForecast)}</td>
                      <td className="py-3 px-2 text-right text-blue-400">{v.soldCount}</td>
                      <td className="py-3 px-2 text-right">
                        <span className={`font-semibold ${v.winRate >= 30 ? 'text-green-400' : v.winRate >= 15 ? 'text-amber-400' : 'text-red-400'}`}>
                          {v.winRate.toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${Math.min(contribution, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">{contribution.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
