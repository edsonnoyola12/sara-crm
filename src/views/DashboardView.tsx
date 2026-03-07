import { useState, useEffect, useMemo } from 'react'
import { Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { useCrm } from '../context/CrmContext'
import { API_BASE, safeFetch, sourceLabel } from '../types/crm'
import type { MortgageApplication } from '../types/crm'
import { supabase } from '../lib/supabase'

export default function DashboardView() {
  const {
    leads, team, properties, mortgages, appointments, campaigns, promotions,
    filteredLeads, vendedoresRanking, insights,
    currentUser, setView, loadData, loadDataSilent, lastRefresh, showToast
  } = useCrm()

  // Dashboard AI question state
  const [dashboardPregunta, setDashboardPregunta] = useState('')
  const [dashboardRespuesta, setDashboardRespuesta] = useState('')
  const [dashboardCargando, setDashboardCargando] = useState(false)

  // Dashboard filters
  type DateRange = 'hoy' | 'semana' | 'mes' | 'trimestre' | 'ano' | 'todo'
  const [dateRange, setDateRange] = useState<DateRange>('mes')
  const [vendorFilter, setVendorFilter] = useState<string>('todos')
  const [developmentFilter, setDevelopmentFilter] = useState<string>('todos')

  // Compute date boundaries
  const dateRangeBounds = useMemo(() => {
    const now = new Date()
    let start: Date
    switch (dateRange) {
      case 'hoy':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'semana': {
        const day = now.getDay()
        const diff = day === 0 ? 6 : day - 1 // Monday as start
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff)
        break
      }
      case 'mes':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'trimestre':
        start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        break
      case 'ano':
        start = new Date(now.getFullYear(), 0, 1)
        break
      case 'todo':
      default:
        start = new Date(2000, 0, 1)
        break
    }
    return { start, end: now }
  }, [dateRange])

  // Filtered leads for dashboard
  const dashFilteredLeads = useMemo(() => {
    let result = leads
    // Date filter
    if (dateRange !== 'todo') {
      result = result.filter(l => {
        const d = new Date(l.created_at)
        return d >= dateRangeBounds.start && d <= dateRangeBounds.end
      })
    }
    // Vendor filter
    if (vendorFilter !== 'todos') {
      result = result.filter(l => l.assigned_to === vendorFilter)
    }
    // Development filter
    if (developmentFilter !== 'todos') {
      result = result.filter(l => l.property_interest === developmentFilter)
    }
    return result
  }, [leads, dateRange, dateRangeBounds, vendorFilter, developmentFilter])

  // Unique developments from leads
  const uniqueDevelopments = useMemo(() => {
    const devs = new Set<string>()
    leads.forEach(l => {
      if (l.property_interest) devs.add(l.property_interest)
    })
    return Array.from(devs).sort()
  }, [leads])

  // Vendedores for filter
  const vendedoresList = useMemo(() => {
    return team.filter(t => t.role === 'vendedor')
  }, [team])

  // Goals state (loaded locally)
  const [monthlyGoals, setMonthlyGoals] = useState<{month: string, company_goal: number}>({ month: '', company_goal: 0 })
  const [vendorGoals, setVendorGoals] = useState<{vendor_id: string, goal: number, name: string}[]>([])
  const [marketingGoals, setMarketingGoals] = useState<{month: string, leads_goal: number, budget: number}>({ month: '', leads_goal: 0, budget: 0 })

  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7)
    supabase.from('monthly_goals').select('*').eq('month', month).single().then(({ data }) => {
      if (data) setMonthlyGoals({ month: data.month, company_goal: data.company_goal })
    })
    supabase.from('vendor_monthly_goals').select('*').eq('month', month).then(({ data }) => {
      if (data) {
        const goals = team.filter(t => t.role === 'vendedor' && t.active).map(v => {
          const existing = data.find((vg: any) => vg.vendor_id === v.id)
          return { vendor_id: v.id, goal: existing?.goal || 0, name: v.name }
        })
        setVendorGoals(goals)
      }
    })
    supabase.from('marketing_goals').select('*').eq('month', month).single().then(({ data }) => {
      if (data) setMarketingGoals({ month: data.month, leads_goal: data.leads_goal || 0, budget: data.budget || 0 })
    })
  }, [team])

  // Placeholder functions for navigation to other views
  const setLeadFilters = (_filters: any) => { /* no-op, handled by LeadsView */ }
  const setShowNewLead = (_show: boolean) => { setView('leads') }
  const setShowNewMortgage = (_show: boolean) => { setView('mortgage') }

function getDaysInStatus(mortgage: MortgageApplication): number {
  let statusDate: string | null = null
  switch (mortgage.status) {
    case 'pending': statusDate = mortgage.pending_at; break
    case 'in_review': statusDate = mortgage.in_review_at; break
    case 'sent_to_bank': statusDate = mortgage.sent_to_bank_at; break
    default: statusDate = mortgage.updated_at
  }
  if (!statusDate) return 0
  return Math.floor((Date.now() - new Date(statusDate).getTime()) / (1000 * 60 * 60 * 24))
}

  // ============ MARKETING AGGREGATES ============
const totalBudget = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0)
const totalSpent = campaigns.reduce((acc, c) => acc + (c.spent || 0), 0)
const totalLeadsFromCampaigns = campaigns.reduce((acc, c) => acc + (c.leads_generated || 0), 0)
const totalSalesFromCampaigns = campaigns.reduce((acc, c) => acc + (c.sales_closed || 0), 0)
const totalRevenue = campaigns.reduce((acc, c) => acc + (c.revenue_generated || 0), 0)
const avgCPL = totalLeadsFromCampaigns > 0 ? totalSpent / totalLeadsFromCampaigns : 0
const avgCPA = totalSalesFromCampaigns > 0 ? totalSpent / totalSalesFromCampaigns : 0
const roi = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0

// NOTA: scoreData se define después de filteredLeads (línea ~1445)

const roiByChannel = campaigns.reduce((acc: any[], c) => {
  const existing = acc.find(x => x.channel === c.channel)
  if (existing) {
    existing.spent += c.spent || 0
    existing.leads += c.leads_generated || 0
    existing.sales += c.sales_closed || 0
    existing.revenue += c.revenue_generated || 0
  } else {
    acc.push({ 
      channel: c.channel, 
      spent: c.spent || 0, 
      leads: c.leads_generated || 0, 
      sales: c.sales_closed || 0,
      revenue: c.revenue_generated || 0
    })
  }
  return acc
}, [])

const asesores = team.filter(t => t.role === 'asesor')

// ============ NUEVAS MÉTRICAS DEL DASHBOARD ============

// 1. Tiempo promedio de respuesta (primera respuesta a lead nuevo)
const avgResponseTime = (() => {
  const leadsWithResponse = leads.filter(l => l.status !== 'new' && l.created_at && l.status_changed_at)
  if (leadsWithResponse.length === 0) return 0
  const totalMinutes = leadsWithResponse.reduce((sum, l) => {
    const created = new Date(l.created_at).getTime()
    const changed = new Date(l.status_changed_at || l.created_at).getTime()
    return sum + (changed - created) / (1000 * 60)
  }, 0)
  return Math.round(totalMinutes / leadsWithResponse.length)
})()

// 2. Tasa de conversión por etapa
const conversionByStage = (() => {
  const stages = ['new', 'contacted', 'scheduled', 'visited', 'negotiation', 'reserved', 'closed']
  const counts = stages.map(s => leads.filter(l => l.status === s || stages.indexOf(l.status) > stages.indexOf(s)).length)
  return stages.map((stage, i) => ({
    stage: stage === 'new' ? 'Nuevo' : stage === 'contacted' ? 'Contactado' : stage === 'scheduled' ? 'Cita' : stage === 'visited' ? 'Visitó' : stage === 'negotiation' ? 'Negociación' : stage === 'reserved' ? 'Reservado' : 'Cerrado',
    count: leads.filter(l => l.status === stage).length,
    conversion: i === 0 ? 100 : counts[0] > 0 ? Math.round((counts[i] / counts[0]) * 100) : 0
  }))
})()

// 3. Conversión por vendedor
const conversionByVendor = (() => {
  const vendedores = team.filter(t => t.role === 'vendedor')
  return vendedores.map(v => {
    const vendorLeads = leads.filter(l => l.assigned_to === v.id)
    const closed = vendorLeads.filter(l => l.status === 'closed' || l.status === 'Cerrado').length
    return {
      name: v.name?.split(' ')[0] || 'Sin nombre',
      total: vendorLeads.length,
      closed,
      conversion: vendorLeads.length > 0 ? Math.round((closed / vendorLeads.length) * 100) : 0
    }
  }).sort((a, b) => b.conversion - a.conversion)
})()

// 4. CPL por fuente/canal
const cplBySource = (() => {
  return roiByChannel.map(c => ({
    channel: c.channel,
    cpl: c.leads > 0 ? Math.round(c.spent / c.leads) : 0,
    leads: c.leads,
    spent: c.spent
  })).sort((a, b) => a.cpl - b.cpl)
})()

// 5. Tendencia mensual (últimos 6 meses)
const monthlyTrend = (() => {
  const months: {month: string, leads: number, closed: number, revenue: number}[] = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthStr = date.toLocaleDateString('es-MX', { month: 'short' })
    const monthNum = date.getMonth()
    const yearNum = date.getFullYear()
    
    const monthLeads = leads.filter(l => {
      const d = new Date(l.created_at)
      return d.getMonth() === monthNum && d.getFullYear() === yearNum
    }).length
    
    const monthClosed = leads.filter(l => {
      const d = new Date(l.updated_at || l.created_at)
      return d.getMonth() === monthNum && d.getFullYear() === yearNum && (l.status === 'closed' || l.status === 'Cerrado')
    }).length
    
    const monthRevenue = campaigns.filter(c => {
      const d = new Date(c.created_at)
      return d.getMonth() === monthNum && d.getFullYear() === yearNum
    }).reduce((sum, c) => sum + (c.revenue_generated || 0), 0)
    
    months.push({ month: monthStr, leads: monthLeads, closed: monthClosed, revenue: monthRevenue })
  }
  return months
})()

// 6. Comparativo mes actual vs anterior
const monthComparison = (() => {
  const now = new Date()
  const thisMonth = now.getMonth()
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
  const thisYear = now.getFullYear()
  const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear
  
  const thisMonthLeads = leads.filter(l => {
    const d = new Date(l.created_at)
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear
  }).length
  
  const lastMonthLeads = leads.filter(l => {
    const d = new Date(l.created_at)
    return d.getMonth() === lastMonth && d.getFullYear() === lastYear
  }).length
  
  const thisMonthClosed = leads.filter(l => {
    const d = new Date(l.updated_at || l.created_at)
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear && (l.status === 'closed' || l.status === 'Cerrado')
  }).length
  
  const lastMonthClosed = leads.filter(l => {
    const d = new Date(l.updated_at || l.created_at)
    return d.getMonth() === lastMonth && d.getFullYear() === lastYear && (l.status === 'closed' || l.status === 'Cerrado')
  }).length
  
  return {
    leadsChange: lastMonthLeads > 0 ? Math.round(((thisMonthLeads - lastMonthLeads) / lastMonthLeads) * 100) : 0,
    closedChange: lastMonthClosed > 0 ? Math.round(((thisMonthClosed - lastMonthClosed) / lastMonthClosed) * 100) : 0,
    thisMonthLeads,
    lastMonthLeads,
    thisMonthClosed,
    lastMonthClosed
  }
})()

// Ticket promedio dinámico (de ventas reales o fallback $2M)
const avgTicket = (() => {
  const closedLeads = leads.filter(l => ['closed', 'sold', 'delivered'].includes(l.status))
  if (closedLeads.length === 0) return 2000000
  const total = closedLeads.reduce((sum, l) => {
    const prop = properties.find(p => p.name === l.property_interest)
    return sum + (prop?.price_equipped || prop?.price || 2000000)
  }, 0)
  return Math.round(total / closedLeads.length)
})()

// 7. Proyección de cierre (basado en pipeline actual)
const closingProjection = (() => {
  const weights: Record<string, number> = {
    'new': 0.05, 'contacted': 0.10, 'scheduled': 0.20, 'visited': 0.40,
    'negotiation': 0.60, 'reserved': 0.85, 'closed': 1.0
  }
  const projectedDeals = leads.reduce((sum, l) => sum + (weights[l.status] || 0), 0)
  return {
    deals: Math.round(projectedDeals),
    revenue: Math.round(projectedDeals * avgTicket)
  }
})()

// 8. Valor del pipeline ($)
const pipelineValue = (() => {
  const stageValues: Record<string, number> = {
    'negotiation': avgTicket * 0.6,
    'reserved': avgTicket * 0.85,
    'visited': avgTicket * 0.4
  }
  return leads.reduce((sum, l) => sum + (stageValues[l.status] || 0), 0)
})()

// ============ KPIs DE CONVERSIÓN INMOBILIARIA ============
// NOTA: Estos cálculos usan 'leads' temporalmente.
// Se recalculan con filteredLeads más abajo (línea ~1510)
const _conversionLeadToSaleTmp = (() => {
  const totalLeads = leads.length
  const totalSales = leads.filter(l => l.status === 'closed' || l.status === 'delivered').length
  return totalLeads > 0 ? ((totalSales / totalLeads) * 100).toFixed(1) : '0'
})()

const _conversionLeadToCitaTmp = (() => {
  const totalLeads = leads.length
  const citasRealizadas = leads.filter(l => ['scheduled', 'visited', 'negotiation', 'reserved', 'closed', 'delivered'].includes(l.status)).length
  return totalLeads > 0 ? ((citasRealizadas / totalLeads) * 100).toFixed(1) : '0'
})()

const _conversionCitaToCloseTmp = (() => {
  const citasRealizadas = leads.filter(l => ['visited', 'negotiation', 'reserved', 'closed', 'delivered'].includes(l.status)).length
  const ventas = leads.filter(l => l.status === 'closed' || l.status === 'delivered').length
  return citasRealizadas > 0 ? ((ventas / citasRealizadas) * 100).toFixed(1) : '0'
})()

const _ratioLeadsPorVentaTmp = (() => {
  const ventas = leads.filter(l => l.status === 'closed' || l.status === 'delivered').length
  return ventas > 0 ? Math.round(leads.length / ventas) : leads.length
})()

// 13. Leads por fuente/canal
const leadsBySource = (() => {
  const sources: Record<string, {total: number, citas: number, ventas: number}> = {}
  leads.forEach(l => {
    const source = l.source || 'Directo'
    if (!sources[source]) sources[source] = { total: 0, citas: 0, ventas: 0 }
    sources[source].total++
    if (['scheduled', 'visited', 'negotiation', 'reserved', 'closed', 'delivered'].includes(l.status)) {
      sources[source].citas++
    }
    if (l.status === 'closed' || l.status === 'delivered') {
      sources[source].ventas++
    }
  })
  return Object.entries(sources)
    .map(([source, data]) => ({
      source,
      ...data,
      convToCita: data.total > 0 ? Math.round((data.citas / data.total) * 100) : 0,
      convToVenta: data.total > 0 ? Math.round((data.ventas / data.total) * 100) : 0
    }))
    .sort((a, b) => b.total - a.total)
})()

// 14. Rendimiento por Desarrollo/Propiedad
const developmentPerformance = (() => {
  // Agrupar propiedades por desarrollo
  const devData: Record<string, {
    name: string,
    totalUnits: number,
    soldUnits: number,
    avgPrice: number,
    revenue: number,
    leads: number,
    citas: number,
    ventas: number,
    disponibles: number
  }> = {}

  // Primero, datos de propiedades
  properties.forEach(p => {
    const devName = p.development || p.name || 'Sin desarrollo'
    if (!devData[devName]) {
      devData[devName] = {
        name: devName,
        totalUnits: 0,
        soldUnits: 0,
        avgPrice: 0,
        revenue: 0,
        leads: 0,
        citas: 0,
        ventas: 0,
        disponibles: 0
      }
    }
    devData[devName].totalUnits += p.total_units || 0
    devData[devName].soldUnits += p.sold_units || 0
    devData[devName].disponibles += (p.total_units || 0) - (p.sold_units || 0)
    devData[devName].revenue += (p.sold_units || 0) * (p.price || 0)
    devData[devName].avgPrice = p.price || devData[devName].avgPrice
  })

  // Luego, datos de leads por property_interest
  leads.forEach(l => {
    const interest = l.property_interest || 'Sin asignar'
    // Buscar si el interés coincide con algún desarrollo
    const matchingDev = Object.keys(devData).find(d => 
      interest.toLowerCase().includes(d.toLowerCase()) || 
      d.toLowerCase().includes(interest.toLowerCase())
    )
    const devName = matchingDev || interest
    
    if (!devData[devName]) {
      devData[devName] = {
        name: devName,
        totalUnits: 0,
        soldUnits: 0,
        avgPrice: 2000000, // Default
        revenue: 0,
        leads: 0,
        citas: 0,
        ventas: 0,
        disponibles: 0
      }
    }
    
    devData[devName].leads++
    if (['scheduled', 'visited', 'negotiation', 'reserved', 'closed', 'delivered'].includes(l.status)) {
      devData[devName].citas++
    }
    if (l.status === 'closed' || l.status === 'delivered') {
      devData[devName].ventas++
      // Si no teníamos revenue de properties, estimarlo
      if (devData[devName].revenue === 0) {
        devData[devName].revenue += devData[devName].avgPrice
      }
    }
  })

  return Object.values(devData)
    .filter(d => d.leads > 0 || d.soldUnits > 0)
    .sort((a, b) => b.revenue - a.revenue)
})()

// Top desarrollo por ventas vs por revenue
const topDevByUnits = [...developmentPerformance].sort((a, b) => (b.ventas + b.soldUnits) - (a.ventas + a.soldUnits))[0]
const topDevByRevenue = [...developmentPerformance].sort((a, b) => b.revenue - a.revenue)[0]

// HOT/WARM/COLD basados en filteredLeads
const hotLeads = filteredLeads.filter(l => l.score >= 70).length
const warmLeads = filteredLeads.filter(l => l.score >= 40 && l.score < 70).length
const coldLeads = filteredLeads.filter(l => l.score < 40).length

const scoreData = [
  { name: 'HOT', value: hotLeads, color: '#ef4444' },
  { name: 'WARM', value: warmLeads, color: '#f97316' },
  { name: 'COLD', value: coldLeads, color: '#3b82f6' }
]

// ============ CHART DATA (useMemos) ============
const weeklyLeadsData = useMemo(() => {
  const now = new Date()
  const data: {week: string, count: number}[] = []
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - i * 7)
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7)
    const count = filteredLeads.filter(l => {
      const d = new Date(l.created_at)
      return d >= weekStart && d < weekEnd
    }).length
    data.push({ week: i === 0 ? 'Esta' : i === 1 ? 'Ant' : `S-${i}`, count })
  }
  return data
}, [filteredLeads])

const sourceData = useMemo(() => {
  const counts: Record<string, number> = {}
  filteredLeads.forEach(l => {
    const src = l.source || 'Directo'
    counts[src] = (counts[src] || 0) + 1
  })
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const top6 = sorted.slice(0, 6)
  const others = sorted.slice(6).reduce((sum, [, v]) => sum + v, 0)
  const result = top6.map(([name, value]) => ({ name: name.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()), value }))
  if (others > 0) result.push({ name: 'Otros', value: others })
  return result
}, [filteredLeads])

const vendorPerformance = useMemo(() => {
  const activeVendors = team.filter(t => t.role === 'vendedor' && t.active)
  return activeVendors.map(v => {
    const vLeads = filteredLeads.filter(l => l.assigned_to === v.id).length
    const vCitas = appointments.filter(a => {
      const lead = filteredLeads.find(l => l.id === a.lead_id)
      return lead?.assigned_to === v.id
    }).length
    const vCerrados = filteredLeads.filter(l => l.assigned_to === v.id && (l.status === 'closed' || l.status === 'delivered')).length
    return { name: v.name?.split(' ')[0] || 'N/A', leads: vLeads, citas: vCitas, cerrados: vCerrados }
  }).sort((a, b) => b.leads - a.leads).slice(0, 8)
}, [filteredLeads, team, appointments])

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#eab308', '#6b7280']

// ============ KPIs DE CONVERSIÓN (con filteredLeads) ============
const conversionLeadToSale = (() => {
  const totalLeads = filteredLeads.length
  const totalSales = filteredLeads.filter(l => l.status === 'closed' || l.status === 'delivered').length
  return totalLeads > 0 ? ((totalSales / totalLeads) * 100).toFixed(1) : '0'
})()

const conversionLeadToCita = (() => {
  const totalLeads = filteredLeads.length
  const citasRealizadas = filteredLeads.filter(l => ['scheduled', 'visited', 'negotiation', 'reserved', 'closed', 'delivered'].includes(l.status)).length
  return totalLeads > 0 ? ((citasRealizadas / totalLeads) * 100).toFixed(1) : '0'
})()

const conversionCitaToClose = (() => {
  const citasRealizadas = filteredLeads.filter(l => ['visited', 'negotiation', 'reserved', 'closed', 'delivered'].includes(l.status)).length
  const ventas = filteredLeads.filter(l => l.status === 'closed' || l.status === 'delivered').length
  return citasRealizadas > 0 ? ((ventas / citasRealizadas) * 100).toFixed(1) : '0'
})()

const ratioLeadsPorVenta = (() => {
  const ventas = filteredLeads.filter(l => l.status === 'closed' || l.status === 'delivered').length
  return ventas > 0 ? Math.round(filteredLeads.length / ventas) : filteredLeads.length
})()

// ============ ANÁLISIS META vs REALIDAD ============
const metaAnalysis = (() => {
  const metaMensual = monthlyGoals.company_goal || 0
  const convRate = parseFloat(conversionLeadToSale) / 100 || 0.02
  const ventasActuales = filteredLeads.filter(l => {
    const d = new Date(l.status_changed_at || l.created_at)
    const now = new Date()
    return (l.status === 'closed' || l.status === 'delivered') &&
           d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const ventasFaltantes = Math.max(0, metaMensual - ventasActuales)
  const leadsNecesarios = convRate > 0 ? Math.ceil(ventasFaltantes / convRate) : 0
  const leadsActivosEnFunnel = filteredLeads.filter(l => !['closed', 'delivered', 'lost', 'inactive'].includes(l.status)).length
  const leadsNuevosMes = filteredLeads.filter(l => {
    const d = new Date(l.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const deficitLeads = Math.max(0, leadsNecesarios - leadsActivosEnFunnel)
  const leadsQueAvanzan = filteredLeads.filter(l => ['scheduled', 'visited', 'negotiation', 'reserved', 'closed', 'delivered'].includes(l.status)).length
  const calidadLeads = filteredLeads.length > 0 ? Math.round((leadsQueAvanzan / filteredLeads.length) * 100) : 0
  const now = new Date()
  const diasRestantes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()
  const leadsPorDiaNecesarios = diasRestantes > 0 ? Math.ceil(deficitLeads / diasRestantes) : deficitLeads

  return {
    metaMensual, ventasActuales, ventasFaltantes,
    conversionRate: convRate * 100, leadsNecesarios, leadsActivosEnFunnel,
    leadsNuevosMes, deficitLeads, calidadLeads, diasRestantes, leadsPorDiaNecesarios,
    cumplimientoMeta: metaMensual > 0 ? Math.round((ventasActuales / metaMensual) * 100) : 0,
    alertaRoja: deficitLeads > leadsNuevosMes * 2,
    alertaCalidad: calidadLeads < 30
  }
})()



  async function preguntarDashboardIA() {
    if (!dashboardPregunta.trim()) return
    setDashboardCargando(true)
    setDashboardRespuesta('')
    try {
      const contexto = {
        totalLeads: filteredLeads.length,
        pipelineValue: pipelineValue,
        cierresMes: monthComparison.thisMonthClosed,
        cambioVsMesAnterior: monthComparison.closedChange,
        leadsHot: filteredLeads.filter(l => ['negotiation', 'reserved'].includes(l.status)).length,
        tiempoRespuesta: avgResponseTime,
        funnel: {
          new: filteredLeads.filter(l => l.status === 'new').length,
          contacted: filteredLeads.filter(l => l.status === 'contacted').length,
          scheduled: filteredLeads.filter(l => l.status === 'scheduled').length,
          visited: filteredLeads.filter(l => l.status === 'visited').length,
          negotiation: filteredLeads.filter(l => l.status === 'negotiation').length,
          reserved: filteredLeads.filter(l => l.status === 'reserved').length,
          closed: filteredLeads.filter(l => l.status === 'closed').length,
        },
        conversiones: {
          leadToSale: conversionLeadToSale,
          leadToCita: conversionLeadToCita,
          visitaToClose: conversionCitaToClose,
          ratioLeadsPorVenta: ratioLeadsPorVenta
        },
        topVendedores: vendedoresRanking.slice(0, 5).map(v => {
          const vendorLeads = filteredLeads.filter(l => l.assigned_to === v.id)
          const closedCount = vendorLeads.filter(l => l.status === 'closed').length
          return {
            name: v.name,
            ventas: v.sales_count || 0,
            leads: vendorLeads.length,
            conversion: vendorLeads.length > 0 ? Math.round((closedCount / vendorLeads.length) * 100) : 0
          }
        }),
        topDesarrollos: developmentPerformance.slice(0, 5).map(d => ({
          name: d.name,
          ventas: d.ventas + d.soldUnits,
          revenue: d.revenue
        })),
        fuentesLeads: leadsBySource.slice(0, 5).map(s => ({
          source: s.source,
          count: s.total,
          closed: s.ventas
        }))
      }

      const data = await safeFetch(`${API_BASE}/api/dashboard/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: dashboardPregunta, contexto })
      })
      setDashboardRespuesta(data.respuesta || 'Sin respuesta')
    } catch (err) {
      setDashboardRespuesta('Error al procesar la pregunta. Intenta de nuevo.')
    }
    setDashboardCargando(false)
  }

  return (
<div className="space-y-4">
  {/* HEADER - Saludo y fecha */}
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
    <div>
      <h2 className="text-2xl lg:text-3xl font-bold">
        {(() => { const h = new Date().getHours(); return h < 12 ? 'Buenos dias' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; })()}{currentUser ? `, ${currentUser.name.split(' ')[0]}` : ''}
      </h2>
      <p className="text-sm text-slate-400 mt-0.5">
        {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
    <div className="flex items-center gap-2 sm:gap-4">
      <div className="text-xs sm:text-sm text-slate-400">
        {new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'})}
      </div>
      {/* Botón exportar resumen ejecutivo */}
      <button
        onClick={() => {
          const now = new Date()
          const currentMonth = now.toISOString().slice(0, 7)
          const [y, m] = currentMonth.split('-')
          const monthName = new Date(parseInt(y), parseInt(m) - 1, 15).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
          const prevMonth = new Date(parseInt(y), parseInt(m) - 2, 15)
          const prevMonthStr = prevMonth.toISOString().slice(0, 7)
          const diasRestantes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()
          const diasTranscurridos = now.getDate()

          // Métricas actuales
          const ventasDelMes = leads.filter(l => (l.status === 'closed' || l.status === 'delivered' || l.status === 'sold') && l.status_changed_at?.startsWith(currentMonth)).length
          const ventasMesAnterior = leads.filter(l => (l.status === 'closed' || l.status === 'delivered' || l.status === 'sold') && l.status_changed_at?.startsWith(prevMonthStr)).length
          const metaMes = monthlyGoals.company_goal || 0
          const porcentajeMeta = metaMes > 0 ? Math.round((ventasDelMes / metaMes) * 100) : 0
          const leadsNuevosMes = leads.filter(l => l.created_at?.startsWith(currentMonth)).length
          const leadsNuevosMesAnt = leads.filter(l => l.created_at?.startsWith(prevMonthStr)).length

          // Funnel
          const funnel = {
            new: leads.filter(l => l.status === 'new').length,
            contacted: leads.filter(l => l.status === 'contacted').length,
            scheduled: leads.filter(l => l.status === 'scheduled').length,
            visited: leads.filter(l => l.status === 'visited').length,
            negotiation: leads.filter(l => l.status === 'negotiation').length,
            reserved: leads.filter(l => l.status === 'reserved').length
          }
          const totalFunnel = funnel.new + funnel.contacted + funnel.scheduled + funnel.visited + funnel.negotiation + funnel.reserved

          // Top vendedores
          const vendedoresData = team.filter(t => t.role === 'vendedor' && t.active).map(v => {
            const ventas = leads.filter(l => l.assigned_to === v.id && (l.status === 'closed' || l.status === 'delivered' || l.status === 'sold') && l.status_changed_at?.startsWith(currentMonth)).length
            const leadsAsignados = leads.filter(l => l.assigned_to === v.id).length
            const conversion = leadsAsignados > 0 ? Math.round((ventas / leadsAsignados) * 100) : 0
            const meta = vendorGoals.find(vg => vg.vendor_id === v.id)?.goal ?? 0
            return { name: v.name, ventas, meta, conversion, cumplimiento: meta > 0 ? Math.round((ventas / meta) * 100) : 0 }
          }).sort((a, b) => b.ventas - a.ventas)

          // Fuentes de leads
          const fuentes: Record<string, {total: number, cerrados: number}> = {}
          leads.forEach(l => {
            const src = l.source || 'Directo'
            if (!fuentes[src]) fuentes[src] = { total: 0, cerrados: 0 }
            fuentes[src].total++
            if (l.status === 'closed' || l.status === 'delivered' || l.status === 'sold') fuentes[src].cerrados++
          })
          const fuentesArr = Object.entries(fuentes).map(([name, data]) => ({
            name, total: data.total, cerrados: data.cerrados, conversion: data.total > 0 ? Math.round((data.cerrados / data.total) * 100) : 0
          })).sort((a, b) => b.total - a.total).slice(0, 5)

          // Alertas
          const alertas: string[] = []
          if (metaMes > 0 && porcentajeMeta < 50 && diasRestantes < 15) alertas.push('CRITICO: Meta del mes en riesgo (' + porcentajeMeta + '% con ' + diasRestantes + ' dias restantes)')
          if (funnel.new > 10) alertas.push('Hay ' + funnel.new + ' leads nuevos sin contactar')
          const leadsEstancados = leads.filter(l => {
            const days = l.status_changed_at ? Math.floor((now.getTime() - new Date(l.status_changed_at).getTime()) / 86400000) : 999
            return !['closed', 'delivered', 'sold', 'lost'].includes(l.status) && days > 7
          }).length
          if (leadsEstancados > 5) alertas.push(leadsEstancados + ' leads llevan más de 7 días sin avance')
          const vendedorBajo = vendedoresData.find(v => v.meta > 0 && v.cumplimiento < 30)
          if (vendedorBajo) alertas.push(vendedorBajo.name + ' solo ha cumplido ' + vendedorBajo.cumplimiento + '% de su meta')

          // Recomendaciones
          const recomendaciones: string[] = []
          if (funnel.visited > 0 && funnel.negotiation < funnel.visited * 0.5) recomendaciones.push('Mejorar cierre post-visita: Solo ' + Math.round((funnel.negotiation / funnel.visited) * 100) + '% de visitas pasan a negociacion')
          if (leadsNuevosMes < metaMes * 10) recomendaciones.push('Aumentar generación de leads: Necesitas ~' + (metaMes * 10) + ' leads/mes para meta de ' + metaMes + ' ventas')
          const mejorFuente = fuentesArr.find(f => f.conversion > 10)
          if (mejorFuente) recomendaciones.push('Invertir más en ' + mejorFuente.name + ' (conversión ' + mejorFuente.conversion + '%)')
          const mejorVendedor = vendedoresData[0]
          if (mejorVendedor && mejorVendedor.conversion > 15) recomendaciones.push('Replicar estrategia de ' + mejorVendedor.name + ' (' + mejorVendedor.conversion + '% conversion)')

          const cambioVentas = ventasMesAnterior > 0 ? Math.round(((ventasDelMes - ventasMesAnterior) / ventasMesAnterior) * 100) : 0
          const cambioLeads = leadsNuevosMesAnt > 0 ? Math.round(((leadsNuevosMes - leadsNuevosMesAnt) / leadsNuevosMesAnt) * 100) : 0

          const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reporte Ejecutivo</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:40px;max-width:900px;margin:0 auto;color:#333;font-size:14px}h1{font-size:28px;color:#1e40af;border-bottom:3px solid #1e40af;padding-bottom:10px;margin-bottom:5px}h2{font-size:18px;color:#1e40af;margin:25px 0 15px;padding-bottom:5px;border-bottom:1px solid #ddd}h3{font-size:14px;color:#666;margin:15px 0 10px}.header-info{color:#666;font-size:12px;margin-bottom:30px}.kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin:20px 0}.kpi-box{padding:20px;border-radius:8px;text-align:center;border:2px solid}.kpi-box.green{background:#dcfce7;border-color:#22c55e}.kpi-box.yellow{background:#fef9c3;border-color:#eab308}.kpi-box.red{background:#fee2e2;border-color:#ef4444}.kpi-number{font-size:36px;font-weight:bold}.kpi-label{font-size:12px;color:#666;text-transform:uppercase;margin-bottom:5px}.kpi-change{font-size:11px;margin-top:5px}.kpi-change.up{color:#22c55e}.kpi-change.down{color:#ef4444}table{width:100%;border-collapse:collapse;margin:10px 0}th,td{padding:8px 10px;text-align:left;border-bottom:1px solid #eee}th{background:#f8fafc;font-weight:600;font-size:12px;text-transform:uppercase;color:#666}.alert-box{background:#fef2f2;border-left:4px solid #ef4444;padding:10px 15px;margin:8px 0;font-size:13px}.rec-box{background:#f0fdf4;border-left:4px solid #22c55e;padding:10px 15px;margin:8px 0;font-size:13px}.funnel{display:flex;flex-direction:column;gap:8px}.funnel-row{display:flex;align-items:center;gap:10px}.funnel-label{width:100px;font-size:12px}.funnel-bar{flex:1;height:24px;background:#e5e7eb;border-radius:4px;overflow:hidden}.funnel-fill{height:100%;background:#3b82f6;display:flex;align-items:center;justify-content:flex-end;padding-right:8px;color:white;font-size:11px;font-weight:bold}.footer{margin-top:40px;padding-top:15px;border-top:1px solid #ddd;text-align:center;font-size:11px;color:#999}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px}@media print{body{padding:20px}}</style></head><body>'
          + '<h1>REPORTE EJECUTIVO</h1><div class="header-info">Santa Rita Residencial | ' + monthName.toUpperCase() + ' | Generado: ' + now.toLocaleString('es-MX') + '</div>'

          + '<h2>INDICADORES CLAVE</h2><div class="kpi-grid">'
          + '<div class="kpi-box ' + (metaMes === 0 ? 'yellow' : porcentajeMeta >= 80 ? 'green' : porcentajeMeta >= 50 ? 'yellow' : 'red') + '"><div class="kpi-label">Meta del Mes</div><div class="kpi-number">' + ventasDelMes + '/' + (metaMes || '?') + '</div><div>' + porcentajeMeta + '% completado</div><div class="kpi-change ' + (cambioVentas >= 0 ? 'up' : 'down') + '">' + (cambioVentas >= 0 ? '+' : '') + cambioVentas + '% vs mes anterior</div></div>'
          + '<div class="kpi-box ' + (totalFunnel >= 30 ? 'green' : totalFunnel >= 15 ? 'yellow' : 'red') + '"><div class="kpi-label">Pipeline Activo</div><div class="kpi-number">' + totalFunnel + '</div><div>leads en proceso</div><div class="kpi-change ' + (cambioLeads >= 0 ? 'up' : 'down') + '">' + (cambioLeads >= 0 ? '+' : '') + cambioLeads + '% leads nuevos</div></div>'
          + '<div class="kpi-box green"><div class="kpi-label">Días Restantes</div><div class="kpi-number">' + diasRestantes + '</div><div>para cerrar el mes</div><div class="kpi-change">Ritmo necesario: ' + (metaMes > 0 ? Math.ceil((metaMes - ventasDelMes) / diasRestantes * 10) / 10 : 0) + ' ventas/día</div></div>'
          + '</div>'

          + '<div class="two-col"><div><h2>FUNNEL DE VENTAS</h2><div class="funnel">'
          + '<div class="funnel-row"><div class="funnel-label">Nuevos</div><div class="funnel-bar"><div class="funnel-fill" style="width:' + (totalFunnel > 0 ? Math.max(10, (funnel.new / totalFunnel) * 100) : 0) + '%">' + funnel.new + '</div></div></div>'
          + '<div class="funnel-row"><div class="funnel-label">Contactados</div><div class="funnel-bar"><div class="funnel-fill" style="width:' + (totalFunnel > 0 ? Math.max(10, (funnel.contacted / totalFunnel) * 100) : 0) + '%;background:#60a5fa">' + funnel.contacted + '</div></div></div>'
          + '<div class="funnel-row"><div class="funnel-label">Cita Agendada</div><div class="funnel-bar"><div class="funnel-fill" style="width:' + (totalFunnel > 0 ? Math.max(10, (funnel.scheduled / totalFunnel) * 100) : 0) + '%;background:#a78bfa">' + funnel.scheduled + '</div></div></div>'
          + '<div class="funnel-row"><div class="funnel-label">Visitaron</div><div class="funnel-bar"><div class="funnel-fill" style="width:' + (totalFunnel > 0 ? Math.max(10, (funnel.visited / totalFunnel) * 100) : 0) + '%;background:#f472b6">' + funnel.visited + '</div></div></div>'
          + '<div class="funnel-row"><div class="funnel-label">Negociación</div><div class="funnel-bar"><div class="funnel-fill" style="width:' + (totalFunnel > 0 ? Math.max(10, (funnel.negotiation / totalFunnel) * 100) : 0) + '%;background:#fb923c">' + funnel.negotiation + '</div></div></div>'
          + '<div class="funnel-row"><div class="funnel-label">Reservado</div><div class="funnel-bar"><div class="funnel-fill" style="width:' + (totalFunnel > 0 ? Math.max(10, (funnel.reserved / totalFunnel) * 100) : 0) + '%;background:#22c55e">' + funnel.reserved + '</div></div></div>'
          + '</div></div>'

          + '<div><h2>FUENTES DE LEADS</h2><table><tr><th>Fuente</th><th>Leads</th><th>Cerrados</th><th>Conv%</th></tr>'
          + fuentesArr.map(f => '<tr><td>' + sourceLabel(f.name) + '</td><td>' + f.total + '</td><td>' + f.cerrados + '</td><td>' + f.conversion + '%</td></tr>').join('')
          + '</table></div></div>'

          + '<h2>DESEMPENO POR VENDEDOR</h2><table><tr><th>Vendedor</th><th>Ventas</th><th>Meta</th><th>Cumpl.</th><th>Conv%</th></tr>'
          + vendedoresData.map(v => '<tr><td>' + v.name + '</td><td><strong>' + v.ventas + '</strong></td><td>' + v.meta + '</td><td style="color:' + (v.cumplimiento >= 80 ? '#22c55e' : v.cumplimiento >= 50 ? '#eab308' : '#ef4444') + '">' + v.cumplimiento + '%</td><td>' + v.conversion + '%</td></tr>').join('')
          + '</table>'

          + (alertas.length > 0 ? '<h2>ALERTAS</h2>' + alertas.map(a => '<div class="alert-box">' + a + '</div>').join('') : '')

          + (recomendaciones.length > 0 ? '<h2>RECOMENDACIONES</h2>' + recomendaciones.map(r => '<div class="rec-box">' + r + '</div>').join('') : '')

          + '<div class="footer">Reporte generado automaticamente por SARA CRM | Santa Rita Residencial</div></body></html>'

          const printWindow = window.open('', '_blank')
          if (printWindow) {
            printWindow.document.write(html)
            printWindow.document.close()
            printWindow.print()
          }
        }}
        className="px-2 py-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-xs sm:text-sm hover:from-green-700 hover:to-emerald-700 flex items-center gap-1"
        title="Reporte Ejecutivo CEO"
      >
        <Download size={14} /> PDF
      </button>
      <button
        onClick={() => loadData()}
        className="px-2 py-1 bg-slate-700 rounded-lg text-xs sm:text-sm hover:bg-slate-600 flex items-center gap-1"
      >
        🔄
      </button>
    </div>
  </div>

  {/* ═══════════════ FILTER BAR ═══════════════ */}
  {currentUser?.role === 'admin' && (
  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Date range pills */}
      <div className="flex flex-wrap gap-1.5">
        {([
          { key: 'hoy', label: 'Hoy' },
          { key: 'semana', label: 'Esta semana' },
          { key: 'mes', label: 'Este mes' },
          { key: 'trimestre', label: 'Ultimo trimestre' },
          { key: 'ano', label: 'Este año' },
          { key: 'todo', label: 'Todo' },
        ] as { key: DateRange; label: string }[]).map(opt => (
          <button
            key={opt.key}
            onClick={() => setDateRange(opt.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              dateRange === opt.key
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700/60 text-slate-400 hover:bg-slate-600/60 hover:text-slate-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Vendor dropdown */}
      <select
        value={vendorFilter}
        onChange={e => setVendorFilter(e.target.value)}
        className="bg-slate-700/60 border border-slate-600/50 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:border-blue-500 focus:outline-none"
      >
        <option value="todos">Todos los vendedores</option>
        {vendedoresList.map(v => (
          <option key={v.id} value={v.id}>{v.name}</option>
        ))}
      </select>

      {/* Development dropdown */}
      <select
        value={developmentFilter}
        onChange={e => setDevelopmentFilter(e.target.value)}
        className="bg-slate-700/60 border border-slate-600/50 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:border-blue-500 focus:outline-none"
      >
        <option value="todos">Todos los desarrollos</option>
        {uniqueDevelopments.map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* Active filter count */}
      {(dateRange !== 'mes' || vendorFilter !== 'todos' || developmentFilter !== 'todos') && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {dashFilteredLeads.length} leads
          </span>
          <button
            onClick={() => { setDateRange('mes'); setVendorFilter('todos'); setDevelopmentFilter('todos') }}
            className="text-xs text-red-400 hover:text-red-300 underline"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  </div>
  )}

  {/* ═══════════════════════════════════════════════════════════ */}
  {/* DASHBOARD PERSONALIZADO POR ROL */}
  {/* ═══════════════════════════════════════════════════════════ */}

  {/* ══════ DASHBOARD ADMIN ══════ */}
  {currentUser?.role === 'admin' && (() => {
    const dfl = dashFilteredLeads
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7)
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)
    const diasTranscurridos = now.getDate()
    const diasEnMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const diasRestantes = diasEnMes - diasTranscurridos

    // Ventas del mes
    const ventasDelMes = dfl.filter(l =>
      ['closed', 'delivered', 'sold'].includes(l.status) &&
      l.status_changed_at?.startsWith(currentMonth)
    )
    const ventasMesAnterior = dfl.filter(l =>
      ['closed', 'delivered', 'sold'].includes(l.status) &&
      l.status_changed_at?.startsWith(prevMonth)
    ).length
    const metaMes = monthlyGoals.company_goal || 0
    const porcentajeMeta = metaMes > 0 ? Math.round((ventasDelMes.length / metaMes) * 100) : 0
    const cambioVsMesAnterior = ventasMesAnterior > 0
      ? Math.round(((ventasDelMes.length - ventasMesAnterior) / ventasMesAnterior) * 100)
      : 0

    // Pipeline y revenue
    const leadsActivos = dfl.filter(l => !['closed', 'delivered', 'sold', 'lost', 'inactive'].includes(l.status))
    const pipelineValue = leadsActivos.reduce((sum, l) => sum + (Number(l.budget) || 0), 0)
    const revenueDelMes = ventasDelMes.reduce((sum, l) => sum + (Number(l.budget) || 0), 0)

    // Leads HOT (negociación + reservado)
    const leadsHot = dfl.filter(l => ['negotiation', 'reserved'].includes(l.status))
    const valorLeadsHot = leadsHot.reduce((sum, l) => sum + (Number(l.budget) || 0), 0)

    // Proyección
    const ventasProyectadas = diasTranscurridos > 0 ? Math.round((ventasDelMes.length / diasTranscurridos) * diasEnMes) : 0
    const revenueProyectado = diasTranscurridos > 0 ? Math.round((revenueDelMes / diasTranscurridos) * diasEnMes) : 0

    // Leads del mes
    const leadsDelMes = dfl.filter(l => l.created_at?.startsWith(currentMonth)).length
    const leadsNuevosSinContactar = dfl.filter(l => l.status === 'new').length

    // Leads estancados (+5 días)
    const leadsEstancados = dfl.filter(l => {
      if (['closed', 'delivered', 'sold', 'lost', 'inactive'].includes(l.status)) return false
      const dias = l.status_changed_at ? Math.floor((now.getTime() - new Date(l.status_changed_at).getTime()) / 86400000) : 999
      return dias > 5
    })

    // Conversión general
    const totalLeads = dfl.length
    const totalVentas = dfl.filter(l => ['closed', 'delivered', 'sold'].includes(l.status)).length
    const tasaConversion = totalLeads > 0 ? ((totalVentas / totalLeads) * 100).toFixed(1) : '0'

    // Ranking vendedores
    const vendedoresRanking = team
      .filter(t => t.role === 'vendedor')
      .map(v => {
        const ventasV = dfl.filter(l =>
          l.assigned_to === v.id &&
          ['closed', 'delivered', 'sold'].includes(l.status) &&
          l.status_changed_at?.startsWith(currentMonth)
        ).length
        const metaV = vendorGoals.find(g => g.vendor_id === v.id)?.goal || 0
        const leadsV = dfl.filter(l => l.assigned_to === v.id && !['closed', 'delivered', 'sold', 'lost', 'inactive'].includes(l.status)).length
        return { ...v, ventas: ventasV, meta: metaV, leads: leadsV, pct: metaV > 0 ? Math.round((ventasV / metaV) * 100) : 0 }
      })
      .sort((a, b) => b.ventas - a.ventas)

    // Por fuente
    const porFuente: Record<string, { leads: number, ventas: number }> = {}
    dfl.filter(l => l.created_at?.startsWith(currentMonth)).forEach(l => {
      const src = l.source || 'Directo'
      if (!porFuente[src]) porFuente[src] = { leads: 0, ventas: 0 }
      porFuente[src].leads++
      if (['closed', 'delivered', 'sold'].includes(l.status)) porFuente[src].ventas++
    })
    const fuentes = Object.entries(porFuente)
      .map(([name, data]) => ({ name, ...data, conv: data.leads > 0 ? Math.round((data.ventas / data.leads) * 100) : 0 }))
      .sort((a, b) => b.leads - a.leads)

    // Por desarrollo
    const porDesarrollo: Record<string, { leads: number, ventas: number, revenue: number }> = {}
    dfl.forEach(l => {
      const dev = l.property_interest || 'Sin especificar'
      if (!porDesarrollo[dev]) porDesarrollo[dev] = { leads: 0, ventas: 0, revenue: 0 }
      porDesarrollo[dev].leads++
      if (['closed', 'delivered', 'sold'].includes(l.status) && l.status_changed_at?.startsWith(currentMonth)) {
        porDesarrollo[dev].ventas++
        porDesarrollo[dev].revenue += Number(l.budget) || 0
      }
    })
    const desarrollos = Object.entries(porDesarrollo)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.ventas - a.ventas)

    // Hipotecas resumen
    const hipotecasPendientes = mortgages.filter(m => !['approved', 'rejected', 'cancelled'].includes(m.status)).length
    const hipotecasAprobadas = mortgages.filter(m => m.status === 'approved' && m.decision_at?.startsWith(currentMonth)).length

    // Funnel general
    const funnel = {
      new: dfl.filter(l => l.status === 'new').length,
      contacted: dfl.filter(l => l.status === 'contacted').length,
      scheduled: dfl.filter(l => l.status === 'scheduled').length,
      visited: dfl.filter(l => l.status === 'visited').length,
      negotiation: dfl.filter(l => l.status === 'negotiation').length,
      reserved: dfl.filter(l => l.status === 'reserved').length,
      closed: dfl.filter(l => ['closed', 'delivered', 'sold'].includes(l.status)).length
    }

    // Marketing CPL
    const presupuestoMkt = marketingGoals.budget || 50000
    const cpl = leadsDelMes > 0 ? Math.round(presupuestoMkt / leadsDelMes) : 0

    const estadoMeta = metaMes === 0 ? 'warning' : porcentajeMeta >= 80 ? 'good' : porcentajeMeta >= 50 ? 'warning' : 'critical'

    return (
      <div className="space-y-4">
        {/* Header Admin */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-600/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">🏢 Panel Ejecutivo</h2>
              <p className="text-sm text-slate-400">Vista general del negocio - {new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="flex gap-4 text-right">
              <div>
                <p className="text-xs text-slate-400">Pipeline</p>
                <p className="text-lg font-bold text-emerald-400">${(pipelineValue / 1000000).toFixed(1)}M</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Ingresos mes</p>
                <p className="text-lg font-bold text-green-400">${(revenueDelMes / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas críticas */}
        {(leadsNuevosSinContactar > 5 || leadsEstancados.length > 10) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {leadsNuevosSinContactar > 5 && (
              <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-3 flex items-center gap-3">
                <span className="text-2xl">🚨</span>
                <div className="flex-1">
                  <p className="font-semibold text-red-300">{leadsNuevosSinContactar} leads sin contactar</p>
                  <p className="text-xs text-slate-400">Requieren atención inmediata</p>
                </div>
              </div>
            )}
            {leadsEstancados.length > 10 && (
              <div className="bg-orange-900/30 border border-orange-500/40 rounded-xl p-3 flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <p className="font-semibold text-orange-300">{leadsEstancados.length} leads estancados</p>
                  <p className="text-xs text-slate-400">+5 días sin movimiento</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* KPIs principales */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Meta vs Real */}
          <div className={`kpi-card rounded-xl p-4 border ${estadoMeta === 'good' ? 'bg-green-900/30 border-green-500/40' : estadoMeta === 'warning' ? 'bg-yellow-900/30 border-yellow-500/40' : 'bg-red-900/30 border-red-500/40'}`}>
            <p className="text-[11px] font-medium text-slate-400 mb-1">META VS REAL</p>
            {metaMes ? (
              <p className={`text-3xl font-bold ${estadoMeta === 'good' ? 'text-green-400' : estadoMeta === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
                {ventasDelMes.length}/{metaMes}
              </p>
            ) : (
              <p className="text-lg font-bold text-slate-500 cursor-pointer hover:text-blue-400" onClick={() => setView('goals')}>
                Sin meta <span className="text-xs">→ Configurar</span>
              </p>
            )}
            <div className="h-1.5 bg-slate-700 rounded-full mt-2">
              <div className={`h-full rounded-full ${estadoMeta === 'good' ? 'bg-green-500' : estadoMeta === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(porcentajeMeta, 100)}%` }} />
            </div>
            <p className="text-xs mt-1 flex justify-between">
              <span>{porcentajeMeta}%</span>
              <span className={cambioVsMesAnterior >= 0 ? 'text-green-400' : 'text-red-400'}>
                {cambioVsMesAnterior >= 0 ? '↑' : '↓'}{Math.abs(cambioVsMesAnterior)}%
              </span>
            </p>
          </div>

          {/* Leads HOT */}
          <div className={`kpi-card rounded-xl p-4 border ${leadsHot.length > 0 ? 'bg-orange-900/30 border-orange-500/40' : 'bg-slate-800/50 border-slate-600/30'}`}>
            <p className="text-[11px] font-medium text-slate-400 mb-1">LEADS HOT 🔥</p>
            <p className="text-3xl font-bold text-orange-400">{leadsHot.length}</p>
            <p className="text-xs text-slate-400 mt-2">${(valorLeadsHot / 1000000).toFixed(1)}M valor</p>
          </div>

          {/* Conversión */}
          <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
            <p className="text-[11px] font-medium text-slate-400 mb-1">CONVERSIÓN</p>
            <p className={`text-3xl font-bold ${Number(tasaConversion) >= 10 ? 'text-green-400' : Number(tasaConversion) >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>{tasaConversion}%</p>
            <p className="text-xs text-slate-400 mt-2">{totalVentas} de {totalLeads}</p>
          </div>

          {/* CPL */}
          <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
            <p className="text-[11px] font-medium text-slate-400 mb-1">CPL</p>
            <p className={`text-3xl font-bold ${cpl <= 300 ? 'text-green-400' : cpl <= 500 ? 'text-yellow-400' : 'text-red-400'}`}>${cpl}</p>
            <p className="text-xs text-slate-400 mt-2">{leadsDelMes} leads/mes</p>
          </div>

          {/* Hipotecas */}
          <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
            <p className="text-[11px] font-medium text-slate-400 mb-1">HIPOTECAS</p>
            <p className="text-3xl font-bold text-cyan-400">{hipotecasPendientes}</p>
            <p className="text-xs text-slate-400 mt-2">{hipotecasAprobadas} aprobadas/mes</p>
          </div>

          {/* Llamadas Retell */}
          <div className={`kpi-card rounded-xl p-4 border ${dfl.filter(l => l.source === 'phone_inbound' && l.created_at?.startsWith(currentMonth)).length > 0 ? 'bg-orange-900/20 border-orange-500/40' : 'bg-slate-800/50 border-slate-600/30'}`}>
            <p className="text-[11px] font-medium text-slate-400 mb-1">LLAMADAS 📞</p>
            <p className="text-3xl font-bold text-orange-400">{dfl.filter(l => l.source === 'phone_inbound' && l.created_at?.startsWith(currentMonth)).length}</p>
            <p className="text-xs text-slate-400 mt-2">{dfl.filter(l => l.source === 'phone_inbound').length} total</p>
          </div>
        </div>

        {/* CHAT IA - Preguntas sobre el Dashboard */}
        <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-500/30 p-4 rounded-xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={dashboardPregunta}
              onChange={(e) => setDashboardPregunta(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && preguntarDashboardIA()}
              placeholder="🤖 Pregunta a la IA: ¿Quién es mi mejor vendedor? ¿Cómo mejorar conversión?"
              className="flex-1 bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
            />
            <button
              onClick={preguntarDashboardIA}
              disabled={dashboardCargando || !dashboardPregunta.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {dashboardCargando ? '...' : 'Preguntar'}
            </button>
          </div>
          {dashboardRespuesta && (
            <div className="mt-3 bg-slate-800/50 border border-slate-600/50 rounded-lg p-3">
              <p className="text-sm whitespace-pre-wrap">{dashboardRespuesta}</p>
            </div>
          )}
        </div>

        {/* Proyección + Revenue */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className={`border rounded-xl p-4 ${ventasProyectadas >= metaMes ? 'bg-green-900/20 border-green-500/30' : 'bg-yellow-900/20 border-yellow-500/30'}`}>
            <h3 className="font-semibold mb-2">🎯 Proyección del Mes</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{ventasProyectadas}</p>
                <p className="text-xs text-slate-400">ventas proyectadas</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-400">${(revenueProyectado / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-slate-400">revenue proyectado</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {diasRestantes} días restantes • Faltan {Math.max(0, metaMes - ventasDelMes.length)} ventas
            </p>
          </div>

          {/* Funnel resumen — Recharts Horizontal BarChart */}
          <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-4 chart-container">
            <h3 className="font-semibold mb-1">📊 Funnel de Conversión</h3>
            <p className="text-[10px] text-slate-500 mb-2">Click en una barra para ver esos leads</p>
            {(() => {
              const funnelData = [
                { name: 'Nuevos', count: funnel.new, fill: '#3b82f6', status: 'new' },
                { name: 'Contactado', count: funnel.contacted, fill: '#06b6d4', status: 'contacted' },
                { name: 'Cita', count: funnel.scheduled, fill: '#8b5cf6', status: 'scheduled' },
                { name: 'Visita', count: funnel.visited, fill: '#ec4899', status: 'visited' },
                { name: 'Negociación', count: funnel.negotiation, fill: '#f97316', status: 'negotiation' },
                { name: 'Reservado', count: funnel.reserved, fill: '#eab308', status: 'reserved' },
                { name: 'Cerrado', count: funnel.closed, fill: '#22c55e', status: 'closed' }
              ]
              return (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                onClick={(data: any) => {
                  if (data?.activePayload?.[0]?.payload?.status) {
                    const s = data.activePayload[0].payload.status
                    setLeadFilters(prev => ({ ...prev, status: s === 'closed' ? ['closed','delivered','sold'] : [s] }))
                    setView('leads')
                  }
                }}
                style={{ cursor: 'pointer' }}>
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} axisLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.5)', borderRadius: 8, color: '#e2e8f0' }}
                  formatter={(value: number) => [value, 'Leads']} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20} label={{ position: 'right', fill: '#94a3b8', fontSize: 11, formatter: (v: number) => v > 0 ? v : '' }}>
                  {funnelData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
              )
            })()}
          </div>
        </div>

        {/* Ranking vendedores */}
        <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-4">
          <h3 className="font-semibold mb-3">🏆 Ranking Vendedores</h3>
          {vendedoresRanking.length > 0 && vendedoresRanking.every(v => v.ventas === 0 && !v.meta) && (
            <p className="text-xs text-slate-500 -mt-1 mb-2">Configura metas individuales en <span className="text-blue-400 cursor-pointer hover:underline" onClick={() => setView('goals')}>Metas</span> para activar el ranking</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {vendedoresRanking.slice(0, 6).map((v, i) => (
              <div key={v.id} className={`flex items-center gap-3 p-3 rounded-lg ${
                i === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-l-2 border-yellow-400' :
                i === 1 ? 'bg-gradient-to-r from-slate-400/10 to-slate-300/5 border-l-2 border-slate-400' :
                i === 2 ? 'bg-gradient-to-r from-orange-600/10 to-orange-500/5 border-l-2 border-orange-400' :
                'bg-slate-700/50'
              }`}>
                <span className={i < 3 ? 'text-2xl' : 'text-xl text-slate-500'}>
                  {i === 0 ? <span className="medal-gold inline-block">🥇</span> : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{v.name}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${v.pct >= 100 ? 'text-green-400' : v.pct >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {v.ventas}/{v.meta || '?'}
                    </span>
                    <span className="text-xs text-slate-400">({v.pct}%)</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{v.leads} activos</p>
                </div>
              </div>
            ))}
          </div>
          {/* Vendor Performance — Grouped BarChart */}
          {vendorPerformance.length > 0 && (
            <div className="mt-3 chart-container">
              <h4 className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">Performance por Vendedor</h4>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={vendorPerformance} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} interval={0} angle={-15} textAnchor="end" height={40} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.5)', borderRadius: 8, color: '#e2e8f0' }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  <Bar dataKey="leads" name="Leads" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={14} />
                  <Bar dataKey="citas" name="Citas" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={14} />
                  <Bar dataKey="cerrados" name="Cerrados" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Charts Row: Leads por Semana + Fuentes de Leads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Leads por semana — LineChart */}
          <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-4 chart-container">
            <h3 className="font-semibold mb-3">📈 Leads por Semana</h3>
            {weeklyLeadsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklyLeadsData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.5)', borderRadius: 8, color: '#e2e8f0' }}
                    formatter={(value: number) => [value, 'Leads']} />
                  <Line type="monotone" dataKey="count" stroke="#60a5fa" strokeWidth={2.5} dot={{ fill: '#60a5fa', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-sm text-center py-8">Sin datos de leads recientes</p>
            )}
          </div>

          {/* Fuentes de leads — PieChart */}
          <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-4 chart-container">
            <h3 className="font-semibold mb-3">📣 Fuentes de Leads</h3>
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`} labelLine={false}
                    style={{ fontSize: 10, fill: '#cbd5e1' }}>
                    {sourceData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.5)', borderRadius: 8, color: '#e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-sm text-center py-8">Sin datos de fuentes</p>
            )}
          </div>
        </div>

        {/* Ventas por Desarrollo — BarChart */}
        {desarrollos.filter(d => d.name !== 'Sin especificar').length > 0 && (
          <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-4 chart-container">
            <h3 className="font-semibold mb-3">🏘️ Rendimiento por Desarrollo</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={desarrollos.filter(d => d.name !== 'Sin especificar').slice(0, 8)} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.5)', borderRadius: 8, color: '#e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <Bar dataKey="leads" name="Leads" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={18} />
                <Bar dataKey="ventas" name="Ventas" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Acciones rápidas */}
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setView('leads')} className="flex-1 min-w-[120px] py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium">
            📋 Leads
          </button>
          <button onClick={() => setView('team')} className="flex-1 min-w-[120px] py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium">
            👥 Equipo
          </button>
          <button onClick={() => setView('goals')} className="flex-1 min-w-[120px] py-3 bg-green-600 hover:bg-green-700 rounded-xl font-medium">
            🎯 Metas
          </button>
          <button onClick={() => setView('reportes')} className="flex-1 min-w-[120px] py-3 bg-orange-600 hover:bg-orange-700 rounded-xl font-medium">
            📊 Reportes
          </button>
          <button onClick={() => setView('config')} className="flex-1 min-w-[120px] py-3 bg-slate-600 hover:bg-slate-700 rounded-xl font-medium">
            ⚙️ Config
          </button>
        </div>
      </div>
    )
  })()}

  {/* ══════ DASHBOARD VENDEDOR ══════ */}
  {currentUser?.role === 'vendedor' && (() => {
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7)
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)
    const diasTranscurridos = now.getDate()
    const diasEnMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const diasRestantes = diasEnMes - diasTranscurridos

    // Mis leads
    const misLeads = leads.filter(l => l.assigned_to === currentUser.id)
    const misLeadsActivos = misLeads.filter(l => !['closed', 'delivered', 'sold', 'lost', 'inactive'].includes(l.status))
    const misVentasMes = misLeads.filter(l =>
      (l.status === 'closed' || l.status === 'delivered' || l.status === 'sold') &&
      l.status_changed_at?.startsWith(currentMonth)
    )
    const misVentasMesAnterior = misLeads.filter(l =>
      (l.status === 'closed' || l.status === 'delivered' || l.status === 'sold') &&
      l.status_changed_at?.startsWith(prevMonth)
    ).length
    const miMeta = vendorGoals.find(v => v.vendor_id === currentUser.id)?.goal || 0
    const miPorcentaje = miMeta > 0 ? Math.round((misVentasMes.length / miMeta) * 100) : 0
    const miConversion = misLeads.length > 0 ? Math.round((misLeads.filter(l => l.status === 'closed' || l.status === 'delivered' || l.status === 'sold').length / misLeads.length) * 100) : 0

    // Pipeline value (leads activos con presupuesto)
    const miPipeline = misLeadsActivos.reduce((sum, l) => sum + (Number(l.budget) || 0), 0)

    // Leads HOT (negociación + reservado)
    const misLeadsHot = misLeads.filter(l => ['negotiation', 'reserved'].includes(l.status))

    // Proyección
    const ventasProyectadas = diasTranscurridos > 0 ? Math.round((misVentasMes.length / diasTranscurridos) * diasEnMes) : 0
    const ventasFaltantes = Math.max(0, miMeta - misVentasMes.length)
    const ventasPorDiaNecesarias = diasRestantes > 0 ? (ventasFaltantes / diasRestantes).toFixed(1) : '0'

    // Mi funnel
    const miFunnel = {
      new: misLeads.filter(l => l.status === 'new').length,
      contacted: misLeads.filter(l => l.status === 'contacted').length,
      scheduled: misLeads.filter(l => l.status === 'scheduled').length,
      visited: misLeads.filter(l => l.status === 'visited').length,
      negotiation: misLeads.filter(l => l.status === 'negotiation').length,
      reserved: misLeads.filter(l => l.status === 'reserved').length
    }

    // Mis citas de hoy y mañana
    const hoy = now.toISOString().slice(0, 10)
    const mañana = new Date(now.getTime() + 86400000).toISOString().slice(0, 10)
    const misCitasHoy = appointments.filter(a => a.vendedor_id === currentUser.id && a.scheduled_date?.startsWith(hoy))
    const misCitasMañana = appointments.filter(a => a.vendedor_id === currentUser.id && a.scheduled_date?.startsWith(mañana))

    // Leads que necesitan atención (estancados)
    const leadsEstancados = misLeads.filter(l => {
      if (['closed', 'delivered', 'sold', 'lost'].includes(l.status)) return false
      const dias = l.status_changed_at ? Math.floor((now.getTime() - new Date(l.status_changed_at).getTime()) / 86400000) : 999
      return dias > 3
    })

    // Leads nuevos sin contactar
    const leadsNuevosSinContactar = misLeads.filter(l => l.status === 'new')

    // Mi ranking
    const vendedoresConVentas = team
      .filter(t => t.role === 'vendedor')
      .map(v => ({
        id: v.id,
        name: v.name,
        ventas: leads.filter(l =>
          l.assigned_to === v.id &&
          ['closed', 'delivered', 'sold'].includes(l.status) &&
          l.status_changed_at?.startsWith(currentMonth)
        ).length
      }))
      .sort((a, b) => b.ventas - a.ventas)
    const miPosicion = vendedoresConVentas.findIndex(v => v.id === currentUser.id) + 1
    const totalVendedores = vendedoresConVentas.length

    // Por desarrollo
    const porDesarrollo: Record<string, number> = {}
    misLeadsActivos.forEach(l => {
      const dev = l.property_interest || 'Sin especificar'
      porDesarrollo[dev] = (porDesarrollo[dev] || 0) + 1
    })
    const desarrollos = Object.entries(porDesarrollo)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const estadoMeta = miMeta === 0 ? 'warning' : miPorcentaje >= 80 ? 'good' : miPorcentaje >= 50 ? 'warning' : 'critical'

    return (
      <div className="space-y-4">
        {/* Header personal con ranking */}
        <div className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">👤 Mi Dashboard - {currentUser.name}</h2>
              <p className="text-sm text-slate-400">Tu rendimiento personal y leads asignados</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Mi posición</p>
              <p className={`text-2xl font-bold ${miPosicion <= 3 ? 'text-yellow-400' : 'text-slate-300'}`}>
                {miPosicion === 1 ? '🥇' : miPosicion === 2 ? '🥈' : miPosicion === 3 ? '🥉' : `#${miPosicion}`}
                <span className="text-sm text-slate-400">/{totalVendedores}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Alertas urgentes */}
        {leadsNuevosSinContactar.length > 0 && (
          <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-3 flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div className="flex-1">
              <p className="font-semibold text-red-300">{leadsNuevosSinContactar.length} leads nuevos sin contactar</p>
              <p className="text-sm text-slate-400">
                {leadsNuevosSinContactar.slice(0, 2).map(l => l.name).join(', ')}
                {leadsNuevosSinContactar.length > 2 && ` +${leadsNuevosSinContactar.length - 2} más`}
              </p>
            </div>
            <button onClick={() => setView('leads')} className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-sm">
              Contactar →
            </button>
          </div>
        )}

        {leadsEstancados.length > 0 && (
          <div className="bg-orange-900/30 border border-orange-500/40 rounded-xl p-3 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold text-orange-300">{leadsEstancados.length} leads estancados (+3 días)</p>
              <p className="text-sm text-slate-400">Necesitan seguimiento urgente</p>
            </div>
            <button onClick={() => setView('leads')} className="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm">
              Ver leads →
            </button>
          </div>
        )}

        {/* KPIs personales - Fila 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Mi meta */}
          <div className={`kpi-card rounded-xl p-4 border ${estadoMeta === 'good' ? 'bg-green-900/30 border-green-500/40' : estadoMeta === 'warning' ? 'bg-yellow-900/30 border-yellow-500/40' : 'bg-red-900/30 border-red-500/40'}`}>
            <p className="text-[11px] font-medium text-slate-400 mb-1">MI META</p>
            <p className={`text-3xl font-bold ${estadoMeta === 'good' ? 'text-green-400' : estadoMeta === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
              {misVentasMes.length}/{miMeta || '?'}
            </p>
            <div className="h-1.5 bg-slate-700 rounded-full mt-2">
              <div className={`h-full rounded-full ${estadoMeta === 'good' ? 'bg-green-500' : estadoMeta === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(miPorcentaje, 100)}%` }} />
            </div>
            <p className="text-xs mt-1 flex justify-between">
              <span>{miMeta === 0 ? 'Sin meta' : `${miPorcentaje}%`}</span>
              <span className={misVentasMes.length >= misVentasMesAnterior ? 'text-green-400' : 'text-red-400'}>
                {misVentasMes.length >= misVentasMesAnterior ? '↑' : '↓'} vs ant.
              </span>
            </p>
          </div>

          {/* Pipeline */}
          <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
            <p className="text-[11px] font-medium text-slate-400 mb-1">MI PIPELINE</p>
            <p className="text-3xl font-bold text-emerald-400">${(miPipeline / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-slate-400">{misLeadsActivos.length} leads activos</p>
          </div>

          {/* Conversión */}
          <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
            <p className="text-[11px] font-medium text-slate-400 mb-1">MI CONVERSIÓN</p>
            <p className={`text-3xl font-bold ${miConversion >= 10 ? 'text-green-400' : miConversion >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>{miConversion}%</p>
            <p className="text-xs text-slate-400">lead → venta</p>
          </div>

          {/* Leads HOT */}
          <div className={`kpi-card rounded-xl p-4 border ${misLeadsHot.length > 0 ? 'bg-orange-900/30 border-orange-500/40' : 'bg-slate-800/50 border-slate-600/30'}`}>
            <p className="text-[11px] font-medium text-slate-400 mb-1">LEADS HOT 🔥</p>
            <p className={`text-3xl font-bold ${misLeadsHot.length > 0 ? 'text-orange-400' : 'text-slate-400'}`}>{misLeadsHot.length}</p>
            <p className="text-xs text-slate-400">negociación + reservado</p>
          </div>
        </div>

        {/* CHAT IA - Preguntas para Vendedor */}
        <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/30 p-4 rounded-xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={dashboardPregunta}
              onChange={(e) => setDashboardPregunta(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && preguntarDashboardIA()}
              placeholder="🤖 Pregunta a la IA: ¿Cómo mejorar mi conversión? ¿Qué leads priorizar?"
              className="flex-1 bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={preguntarDashboardIA}
              disabled={dashboardCargando || !dashboardPregunta.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {dashboardCargando ? '...' : 'Preguntar'}
            </button>
          </div>
          {dashboardRespuesta && (
            <div className="mt-3 bg-slate-800/50 border border-slate-600/50 rounded-lg p-3">
              <p className="text-sm whitespace-pre-wrap">{dashboardRespuesta}</p>
            </div>
          )}
        </div>

        {/* Proyección + Citas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Proyección */}
          <div className={`border rounded-xl p-4 ${ventasProyectadas >= miMeta ? 'bg-green-900/20 border-green-500/30' : 'bg-yellow-900/20 border-yellow-500/30'}`}>
            <h3 className="font-semibold mb-2">🎯 Proyección del Mes</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{ventasProyectadas}</p>
                <p className="text-xs text-slate-400">ventas proyectadas</p>
              </div>
              <div className="text-right">
                {ventasProyectadas >= miMeta ? (
                  <p className="text-green-400 font-semibold">✅ En track</p>
                ) : (
                  <p className="text-yellow-400 font-semibold">⚠️ {ventasFaltantes} faltan</p>
                )}
                <p className="text-xs text-slate-400">Necesitas {ventasPorDiaNecesarias}/día</p>
              </div>
            </div>
          </div>

          {/* Citas */}
          <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-4">
            <h3 className="font-semibold mb-2">📅 Mis Citas</h3>
            <div className="flex gap-4">
              <div className="flex-1 text-center bg-slate-700/50 rounded-lg p-3">
                <p className="text-2xl font-bold text-purple-400">{misCitasHoy.length}</p>
                <p className="text-xs text-slate-400">Hoy</p>
              </div>
              <div className="flex-1 text-center bg-slate-700/50 rounded-lg p-3">
                <p className="text-2xl font-bold text-blue-400">{misCitasMañana.length}</p>
                <p className="text-xs text-slate-400">Mañana</p>
              </div>
              <div className="flex-1 text-center bg-slate-700/50 rounded-lg p-3">
                <p className="text-2xl font-bold text-slate-400">{diasRestantes}</p>
                <p className="text-xs text-slate-400">Días rest.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mi Funnel */}
        <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-4">
          <h3 className="font-semibold mb-3">📊 Mi Funnel de Ventas</h3>
          <div className="grid grid-cols-6 gap-2">
            {[
              { label: 'Nuevos', count: miFunnel.new, color: 'bg-blue-500' },
              { label: 'Contactados', count: miFunnel.contacted, color: 'bg-cyan-500' },
              { label: 'Cita', count: miFunnel.scheduled, color: 'bg-purple-500' },
              { label: 'Visitaron', count: miFunnel.visited, color: 'bg-pink-500' },
              { label: 'Negociación', count: miFunnel.negotiation, color: 'bg-orange-500' },
              { label: 'Reservado', count: miFunnel.reserved, color: 'bg-green-500' }
            ].map((stage, i) => (
              <div key={i} className="text-center">
                <div className={`${stage.color} funnel-bar-vertical rounded-lg py-3 text-xl font-bold`} style={{ animationDelay: `${i * 0.08}s` }}>{stage.count}</div>
                <p className="text-xs mt-1 text-slate-400">{stage.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Leads HOT detalle + Por desarrollo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Leads HOT */}
          <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-4">
            <h3 className="font-semibold mb-3">🔥 Leads en Cierre</h3>
            {misLeadsHot.length > 0 ? (
              <div className="space-y-2">
                {misLeadsHot.slice(0, 5).map((l, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{l.name}</p>
                      <p className="text-xs text-slate-400">{l.property_interest || 'Sin desarrollo'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${l.status === 'reserved' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                        {l.status === 'reserved' ? 'Reservado' : 'Negociación'}
                      </span>
                      {l.budget && <p className="text-xs text-slate-400 mt-1">${(Number(l.budget) / 1000000).toFixed(1)}M</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-4">Sin leads en cierre</p>
            )}
          </div>

          {/* Por desarrollo */}
          <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-4">
            <h3 className="font-semibold mb-3">🏘️ Mis Leads por Desarrollo</h3>
            {desarrollos.length > 0 ? (
              <div className="space-y-2">
                {desarrollos.slice(0, 5).map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1 h-6 bg-slate-700 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                        style={{ width: `${Math.max(15, (d.count / (desarrollos[0]?.count || 1)) * 100)}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-between px-2 text-xs">
                        <span className="truncate">{d.name}</span>
                        <span className="font-bold">{d.count}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-4">Sin leads activos</p>
            )}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="flex gap-3">
          <button onClick={() => setView('leads')} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium">
            📋 Mis leads
          </button>
          <button onClick={() => setView('calendar')} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium">
            📅 Mi agenda
          </button>
          <button onClick={() => setView('followups')} className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 rounded-xl font-medium">
            🔔 Seguimientos
          </button>
        </div>
      </div>
    )
  })()}

  {/* ══════ DASHBOARD MARKETING ══════ */}
  {currentUser?.role === 'agencia' && (() => {
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7)
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)
    const diasTranscurridos = now.getDate()
    const diasEnMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

    // Leads del mes actual y anterior
    const leadsDelMes = leads.filter(l => l.created_at?.startsWith(currentMonth))
    const leadsDelMesAnterior = leads.filter(l => l.created_at?.startsWith(prevMonth))
    const leadsAyer = leads.filter(l => {
      const ayer = new Date(now.getTime() - 86400000).toISOString().slice(0, 10)
      return l.created_at?.startsWith(ayer)
    }).length
    const leadsHoy = leads.filter(l => l.created_at?.startsWith(now.toISOString().slice(0, 10))).length

    // Cambio vs mes anterior
    const cambioVsMesAnterior = leadsDelMesAnterior.length > 0
      ? Math.round(((leadsDelMes.length - leadsDelMesAnterior.length) / leadsDelMesAnterior.length) * 100)
      : 0

    // Meta de leads
    const metaLeads = marketingGoals.leads_goal || (monthlyGoals.company_goal * 10)
    const porcentajeLeads = metaLeads > 0 ? Math.round((leadsDelMes.length / metaLeads) * 100) : 0
    const leadsProyectados = diasTranscurridos > 0 ? Math.round((leadsDelMes.length / diasTranscurridos) * diasEnMes) : 0

    // Por fuente con más datos
    const fuentesData: Record<string, { total: number, cerrados: number, revenue: number, calificados: number }> = {}
    leadsDelMes.forEach(l => {
      const src = l.source || 'Directo'
      if (!fuentesData[src]) fuentesData[src] = { total: 0, cerrados: 0, revenue: 0, calificados: 0 }
      fuentesData[src].total++
      if (!['new', 'lost', 'inactive'].includes(l.status)) fuentesData[src].calificados++
      if (['closed', 'delivered', 'sold'].includes(l.status)) {
        fuentesData[src].cerrados++
        fuentesData[src].revenue += Number(l.budget) || 0
      }
    })
    const fuentes = Object.entries(fuentesData).map(([name, data]) => ({
      name,
      total: data.total,
      cerrados: data.cerrados,
      calificados: data.calificados,
      revenue: data.revenue,
      conversion: data.total > 0 ? Math.round((data.cerrados / data.total) * 100) : 0,
      calidad: data.total > 0 ? Math.round((data.calificados / data.total) * 100) : 0
    })).sort((a, b) => b.total - a.total)

    // Por desarrollo/propiedad
    const porDesarrollo: Record<string, number> = {}
    leadsDelMes.forEach(l => {
      const dev = l.property_interest || 'Sin especificar'
      porDesarrollo[dev] = (porDesarrollo[dev] || 0) + 1
    })
    const desarrollos = Object.entries(porDesarrollo)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // Calidad de leads
    const leadsCalificados = leadsDelMes.filter(l => !['new', 'lost', 'inactive'].includes(l.status)).length
    const calidadLeads = leadsDelMes.length > 0 ? Math.round((leadsCalificados / leadsDelMes.length) * 100) : 0

    // Métricas financieras
    const presupuesto = marketingGoals.budget || 50000
    const cpl = leadsDelMes.length > 0 ? Math.round(presupuesto / leadsDelMes.length) : 0
    const cpql = leadsCalificados > 0 ? Math.round(presupuesto / leadsCalificados) : 0 // Cost per qualified lead
    const ventasCerradas = leadsDelMes.filter(l => ['closed', 'delivered', 'sold'].includes(l.status))
    const revenueGenerado = ventasCerradas.reduce((sum, l) => sum + (Number(l.budget) || 0), 0)
    const roi = presupuesto > 0 ? Math.round(((revenueGenerado - presupuesto) / presupuesto) * 100) : 0
    const cpa = ventasCerradas.length > 0 ? Math.round(presupuesto / ventasCerradas.length) : 0 // Cost per acquisition

    // Velocidad de leads (últimos 7 días)
    const ultimosDias: { dia: string, count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10)
      const count = leads.filter(l => l.created_at?.startsWith(fecha)).length
      ultimosDias.push({ dia: fecha.slice(8, 10), count })
    }
    const promedioLeadsDiarios = Math.round(ultimosDias.reduce((s, d) => s + d.count, 0) / 7)
    const maxLeadsDia = Math.max(...ultimosDias.map(d => d.count), 1)

    // Funnel de marketing
    const funnelMkt = {
      total: leadsDelMes.length,
      contactados: leadsDelMes.filter(l => l.status !== 'new').length,
      calificados: leadsCalificados,
      citas: leadsDelMes.filter(l => ['scheduled', 'visited', 'negotiation', 'reserved', 'closed', 'delivered', 'sold'].includes(l.status)).length,
      cerrados: ventasCerradas.length
    }

    const estadoLeads = porcentajeLeads >= 80 ? 'good' : porcentajeLeads >= 50 ? 'warning' : 'critical'
    const estadoROI = roi >= 100 ? 'good' : roi >= 0 ? 'warning' : 'critical'

    return (
      <div className="space-y-4">
        {/* Header marketing */}
        <div className="bg-gradient-to-r from-pink-900/50 to-purple-900/50 border border-pink-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">📣 Dashboard Marketing</h2>
              <p className="text-sm text-slate-400">Performance de campañas y generación de demanda</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Presupuesto mensual</p>
              <p className="text-lg font-bold text-pink-400">${(presupuesto / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </div>

        {/* KPIs principales - Fila 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Leads del mes */}
          <div className={`kpi-card rounded-xl p-4 border ${estadoLeads === 'good' ? 'bg-green-900/30 border-green-500/40' : estadoLeads === 'warning' ? 'bg-yellow-900/30 border-yellow-500/40' : 'bg-red-900/30 border-red-500/40'}`}>
            <p className="text-[11px] font-medium text-slate-400 mb-1">LEADS DEL MES</p>
            <p className={`text-3xl font-bold ${estadoLeads === 'good' ? 'text-green-400' : estadoLeads === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
              {leadsDelMes.length}
            </p>
            <div className="h-1.5 bg-slate-700 rounded-full mt-2">
              <div className={`h-full rounded-full ${estadoLeads === 'good' ? 'bg-green-500' : estadoLeads === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(porcentajeLeads, 100)}%` }} />
            </div>
            <p className="text-xs mt-1 flex justify-between">
              <span>Meta: {metaLeads}</span>
              <span className={cambioVsMesAnterior >= 0 ? 'text-green-400' : 'text-red-400'}>
                {cambioVsMesAnterior >= 0 ? '↑' : '↓'}{Math.abs(cambioVsMesAnterior)}% vs ant.
              </span>
            </p>
          </div>

          {/* ROI */}
          <div className={`kpi-card rounded-xl p-4 border ${estadoROI === 'good' ? 'bg-green-900/30 border-green-500/40' : estadoROI === 'warning' ? 'bg-yellow-900/30 border-yellow-500/40' : 'bg-red-900/30 border-red-500/40'}`}>
            <p className="text-[11px] font-medium text-slate-400 mb-1">ROI</p>
            <p className={`text-3xl font-bold ${estadoROI === 'good' ? 'text-green-400' : estadoROI === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
              {roi}%
            </p>
            <p className="text-xs text-slate-400 mt-2">Ingresos: ${(revenueGenerado / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-slate-400">{ventasCerradas.length} ventas cerradas</p>
          </div>

          {/* CPL y CPQL */}
          <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
            <p className="text-[11px] font-medium text-slate-400 mb-1">COSTO POR LEAD</p>
            <p className={`text-3xl font-bold ${cpl <= 300 ? 'text-green-400' : cpl <= 500 ? 'text-yellow-400' : 'text-red-400'}`}>${cpl}</p>
            <p className="text-xs text-slate-400 mt-2">CPQL: ${cpql}</p>
            <p className="text-xs text-slate-400">CPA: ${cpa.toLocaleString('es-MX')}</p>
          </div>

          {/* Calidad */}
          <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
            <p className="text-[11px] font-medium text-slate-400 mb-1">CALIDAD LEADS</p>
            <p className={`text-3xl font-bold ${calidadLeads >= 40 ? 'text-green-400' : calidadLeads >= 25 ? 'text-yellow-400' : 'text-red-400'}`}>{calidadLeads}%</p>
            <p className="text-xs text-slate-400 mt-2">{leadsCalificados} calificados</p>
            <p className="text-xs text-slate-400">de {leadsDelMes.length} totales</p>
          </div>
        </div>

        {/* Fila 2: Hoy/Velocidad + Proyección */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Velocidad de leads */}
          <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">📈 Velocidad (últimos 7 días)</h3>
              <span className="text-sm text-slate-400">Prom: {promedioLeadsDiarios}/día</span>
            </div>
            <div className="flex items-end gap-1 h-16">
              {ultimosDias.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full rounded-t ${i === 6 ? 'bg-pink-500' : 'bg-slate-600'}`}
                    style={{ height: `${(d.count / maxLeadsDia) * 100}%`, minHeight: '4px' }}
                  />
                  <span className="text-xs text-slate-400 mt-1">{d.dia}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-blue-400">Hoy: {leadsHoy}</span>
              <span className="text-slate-400">Ayer: {leadsAyer}</span>
            </div>
          </div>

          {/* Proyección */}
          <div className={`border rounded-xl p-4 ${leadsProyectados >= metaLeads ? 'bg-green-900/20 border-green-500/30' : 'bg-yellow-900/20 border-yellow-500/30'}`}>
            <h3 className="font-semibold mb-2">🎯 Proyección Fin de Mes</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{leadsProyectados}</p>
                <p className="text-xs text-slate-400">leads proyectados</p>
              </div>
              <div className="text-right">
                {leadsProyectados >= metaLeads ? (
                  <>
                    <p className="text-green-400 font-semibold">✅ En track</p>
                    <p className="text-xs text-green-400/70">+{leadsProyectados - metaLeads} sobre meta</p>
                  </>
                ) : (
                  <>
                    <p className="text-yellow-400 font-semibold">⚠️ Por debajo</p>
                    <p className="text-xs text-yellow-400/70">Faltan {metaLeads - leadsProyectados} leads</p>
                  </>
                )}
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              Necesitas {Math.ceil((metaLeads - leadsDelMes.length) / (diasEnMes - diasTranscurridos || 1))} leads/día para cumplir meta
            </div>
          </div>
        </div>

        {/* Funnel de Marketing */}
        <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-4">
          <h3 className="font-semibold mb-3">🔄 Funnel de Conversión</h3>
          <div className="flex items-center gap-2">
            {[
              { label: 'Leads', value: funnelMkt.total, color: 'bg-blue-500' },
              { label: 'Contactados', value: funnelMkt.contactados, color: 'bg-cyan-500' },
              { label: 'Calificados', value: funnelMkt.calificados, color: 'bg-purple-500' },
              { label: 'Citas', value: funnelMkt.citas, color: 'bg-orange-500' },
              { label: 'Cerrados', value: funnelMkt.cerrados, color: 'bg-green-500' }
            ].map((stage, i, arr) => (
              <div key={i} className="flex-1 text-center">
                <div className={`${stage.color} rounded-lg py-2 text-lg font-bold`}>{stage.value}</div>
                <p className="text-xs mt-1 text-slate-400">{stage.label}</p>
                {i < arr.length - 1 && funnelMkt.total > 0 && (
                  <p className="text-xs text-slate-400">{Math.round((stage.value / funnelMkt.total) * 100)}%</p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-slate-400 text-center">
            Tasa de conversión total: {funnelMkt.total > 0 ? ((funnelMkt.cerrados / funnelMkt.total) * 100).toFixed(1) : 0}%
          </div>
        </div>

        {/* Performance por fuente */}
        <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-4">
          <h3 className="font-semibold mb-3">📊 Performance por Fuente</h3>
          <div className="space-y-2">
            {fuentes.slice(0, 6).map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-28 text-sm truncate">{sourceLabel(f.name)}</div>
                <div className="flex-1 h-7 bg-slate-700 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                    style={{ width: `${Math.max(5, (f.total / (fuentes[0]?.total || 1)) * 100)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                    {f.total} leads • {f.calidad}% calif • {f.conversion}% conv
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Por desarrollo */}
        <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-4">
          <h3 className="font-semibold mb-3">🏘️ Leads por Desarrollo</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {desarrollos.slice(0, 8).map((d, i) => (
              <div key={i} className="bg-slate-700/50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-pink-400">{d.count}</p>
                <p className="text-xs text-slate-400 truncate">{d.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="flex gap-3">
          <button onClick={() => setView('marketing')} className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 rounded-xl font-medium">
            📊 Ver campañas
          </button>
          <button onClick={() => setView('promotions')} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium">
            📣 Promociónes
          </button>
        </div>
      </div>
    )
  })()}

  {/* ══════ DASHBOARD COORDINADOR ══════ */}
  {currentUser?.role === 'coordinador' && (() => {
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7)
    const today = now.toISOString().slice(0, 10)
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10)

    // Leads capturados
    const leadsHoy = leads.filter(l => l.created_at?.startsWith(today))
    const leadsSemana = leads.filter(l => l.created_at && l.created_at >= weekAgo)
    const leadsDelMes = leads.filter(l => l.created_at?.startsWith(currentMonth))

    // Leads sin asignar o nuevos
    const leadsSinAsignar = leads.filter(l => !l.assigned_to || l.assigned_to === '')
    const leadsNuevos = leads.filter(l => l.status === 'new')
    const leadsUrgentes = leadsNuevos.filter(l => {
      if (!l.created_at) return false
      const horasDesdeCreacion = (now.getTime() - new Date(l.created_at).getTime()) / (1000 * 60 * 60)
      return horasDesdeCreacion > 2 // Más de 2 horas sin contactar
    })

    // Distribución por vendedor
    const porVendedor: Record<string, { name: string, asignados: number, nuevos: number }> = {}
    leads.forEach(l => {
      if (l.assigned_to) {
        const vendedor = team.find(t => t.id === l.assigned_to)
        const vendedorName = vendedor?.name || 'Sin nombre'
        if (!porVendedor[l.assigned_to]) {
          porVendedor[l.assigned_to] = { name: vendedorName, asignados: 0, nuevos: 0 }
        }
        porVendedor[l.assigned_to].asignados++
        if (l.status === 'new') porVendedor[l.assigned_to].nuevos++
      }
    })
    const vendedores = Object.values(porVendedor).sort((a, b) => b.asignados - a.asignados)

    // Por fuente (leads del mes)
    const porFuente: Record<string, number> = {}
    leadsDelMes.forEach(l => {
      const src = l.source || 'Directo'
      porFuente[src] = (porFuente[src] || 0) + 1
    })
    const fuentes = Object.entries(porFuente)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // Actividad reciente (últimos 10 leads)
    const actividadReciente = [...leads]
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .slice(0, 8)

    // Por desarrollo
    const porDesarrollo: Record<string, number> = {}
    leadsDelMes.forEach(l => {
      const dev = l.property_interest || 'Sin especificar'
      porDesarrollo[dev] = (porDesarrollo[dev] || 0) + 1
    })
    const desarrollos = Object.entries(porDesarrollo)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    return (
      <div className="space-y-4">
        {/* Header coordinador */}
        <div className="bg-gradient-to-r from-indigo-900/50 to-blue-900/50 border border-indigo-500/30 rounded-xl p-4">
          <h2 className="text-xl font-bold mb-1">📞 Panel de Coordinación</h2>
          <p className="text-sm text-slate-400">Captura y asignación de leads - {currentUser.name}</p>
        </div>

        {/* Alerta de leads urgentes */}
        {leadsUrgentes.length > 0 && (
          <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🚨</span>
              <span className="font-semibold text-red-400">{leadsUrgentes.length} leads sin contactar (+2 hrs)</span>
            </div>
            <div className="space-y-1">
              {leadsUrgentes.slice(0, 3).map(l => (
                <div key={l.id} className="text-sm flex items-center gap-2">
                  <span className="text-slate-300">{l.name}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-400">{l.phone}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-yellow-400">{sourceLabel(l.source || 'Directo')}</span>
                </div>
              ))}
              {leadsUrgentes.length > 3 && <p className="text-xs text-slate-400">+{leadsUrgentes.length - 3} más</p>}
            </div>
          </div>
        )}

        {/* Alerta sin asignar */}
        {leadsSinAsignar.length > 0 && (
          <div className="bg-yellow-900/30 border border-yellow-500/40 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <span className="font-semibold text-yellow-400">{leadsSinAsignar.length} leads sin asignar</span>
              </div>
              <button onClick={() => setView('leads')} className="text-sm bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded-lg">
                Asignar ahora
              </button>
            </div>
          </div>
        )}

        {/* KPIs principales */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Leads hoy */}
          <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
            <p className="text-[11px] font-medium text-slate-400 mb-1">LEADS HOY</p>
            <p className="text-3xl font-bold text-blue-400">{leadsHoy.length}</p>
            <p className="text-xs text-slate-400">capturados</p>
          </div>

          {/* Leads semana */}
          <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
            <p className="text-[11px] font-medium text-slate-400 mb-1">ESTA SEMANA</p>
            <p className="text-3xl font-bold text-cyan-400">{leadsSemana.length}</p>
            <p className="text-xs text-slate-400">últimos 7 días</p>
          </div>

          {/* Leads nuevos (sin contactar) */}
          <div className={`kpi-card rounded-xl p-4 border ${leadsNuevos.length > 10 ? 'bg-yellow-900/30 border-yellow-500/40' : 'bg-slate-800/50 border-slate-600/30'}`}>
            <p className="text-[11px] font-medium text-slate-400 mb-1">NUEVOS</p>
            <p className={`text-3xl font-bold ${leadsNuevos.length > 10 ? 'text-yellow-400' : 'text-green-400'}`}>{leadsNuevos.length}</p>
            <p className="text-xs text-slate-400">pendientes contactar</p>
          </div>

          {/* Total del mes */}
          <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
            <p className="text-[11px] font-medium text-slate-400 mb-1">ESTE MES</p>
            <p className="text-3xl font-bold text-purple-400">{leadsDelMes.length}</p>
            <p className="text-xs text-slate-400">leads totales</p>
          </div>

          {/* Llamadas Retell */}
          <div className={`kpi-card rounded-xl p-4 border ${leads.filter(l => l.source === 'phone_inbound').length > 0 ? 'bg-orange-900/20 border-orange-500/40' : 'bg-slate-800/50 border-slate-600/30'}`}>
            <p className="text-[11px] font-medium text-slate-400 mb-1">LLAMADAS 📞</p>
            <p className="text-3xl font-bold text-orange-400">{leads.filter(l => l.source === 'phone_inbound' && l.created_at?.startsWith(currentMonth)).length}</p>
            <p className="text-xs text-slate-400">por teléfono</p>
          </div>
        </div>

        {/* Distribución por vendedor */}
        <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-4">
          <h3 className="font-semibold mb-3">👥 Carga por Vendedor</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {vendedores.slice(0, 6).map((v, i) => (
              <div key={i} className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm truncate">{v.name}</p>
                  <p className="text-xs text-slate-400">{v.asignados} leads</p>
                </div>
                {v.nuevos > 0 && (
                  <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full">
                    {v.nuevos} nuevos
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Fila: Fuentes + Desarrollos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Por fuente */}
          <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-4">
            <h3 className="font-semibold mb-3">📣 Por Fuente (mes)</h3>
            <div className="space-y-2">
              {fuentes.slice(0, 5).map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 h-6 bg-slate-700 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-500"
                      style={{ width: `${Math.max(10, (f.count / (fuentes[0]?.count || 1)) * 100)}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-between px-2 text-xs">
                      <span>{sourceLabel(f.name)}</span>
                      <span className="font-bold">{f.count}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Por desarrollo */}
          <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-4">
            <h3 className="font-semibold mb-3">🏘️ Por Desarrollo (mes)</h3>
            <div className="space-y-2">
              {desarrollos.slice(0, 5).map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 h-6 bg-slate-700 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{ width: `${Math.max(10, (d.count / (desarrollos[0]?.count || 1)) * 100)}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-between px-2 text-xs">
                      <span className="truncate">{d.name}</span>
                      <span className="font-bold">{d.count}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-4">
          <h3 className="font-semibold mb-3">🕐 Últimos Leads</h3>
          <div className="space-y-2">
            {actividadReciente.map((l, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${l.status === 'new' ? 'bg-green-500' : 'bg-slate-500'}`} />
                  <div>
                    <p className="font-medium text-sm">{l.name}</p>
                    <p className="text-xs text-slate-400">{l.phone} • {sourceLabel(l.source || 'Directo')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">
                    {l.created_at ? new Date(l.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '-'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {l.assigned_to ? team.find(t => t.id === l.assigned_to)?.name || 'Asignado' : 'Sin asignar'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones rápidas - Fila 1 */}
        <div className="flex gap-3">
          <button onClick={() => setShowNewLead(true)} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-medium">
            ➕ Nuevo Lead
          </button>
          <button onClick={() => setView('leads')} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium">
            📋 Ver Leads
          </button>
          <button onClick={() => setView('calendar')} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium">
            📅 Agenda
          </button>
        </div>

        {/* Acciones rápidas - Fila 2 */}
        <div className="flex gap-3">
          <button onClick={() => setView('properties')} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-medium">
            🏘️ Propiedades
          </button>
          <button onClick={() => setView('promotions')} className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 rounded-xl font-medium">
            📣 Promociónes
          </button>
          <button onClick={() => setView('team')} className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 rounded-xl font-medium">
            👥 Equipo
          </button>
        </div>

        {/* Acciones rápidas - Fila 3 */}
        <div className="flex gap-3">
          <button onClick={() => setView('followups')} className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-xl font-medium">
            🔔 Seguimientos
          </button>
          <button onClick={() => setView('events')} className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-xl font-medium">
            🎉 Eventos
          </button>
          <button onClick={() => setView('encuestas')} className="flex-1 py-3 bg-slate-600 hover:bg-slate-700 rounded-xl font-medium">
            📝 Encuestas
          </button>
        </div>
      </div>
    )
  })()}

  {/* ══════ DASHBOARD ASESOR HIPOTECARIO ══════ */}
  {currentUser?.role === 'asesor' && (() => {
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7)

    // Filtrar solicitudes del asesor
    const misSolicitudes = mortgages.filter(m => m.assigned_advisor_id === currentUser.id)
    const solicitudesDelMes = misSolicitudes.filter(m => m.created_at?.startsWith(currentMonth))

    // Por estado
    const pendientes = misSolicitudes.filter(m => m.status === 'pending').length
    const enRevision = misSolicitudes.filter(m => m.status === 'in_review').length
    const enviadasBanco = misSolicitudes.filter(m => m.status === 'sent_to_bank').length
    const aprobadas = misSolicitudes.filter(m => m.status === 'approved')
    const rechazadas = misSolicitudes.filter(m => m.status === 'rejected')

    // KPIs del mes
    const aprobadasMes = aprobadas.filter(m => m.decision_at?.startsWith(currentMonth)).length
    const rechazadasMes = rechazadas.filter(m => m.decision_at?.startsWith(currentMonth)).length
    const totalDecisionMes = aprobadasMes + rechazadasMes
    const tasaAprobacion = totalDecisionMes > 0 ? Math.round((aprobadasMes / totalDecisionMes) * 100) : 0

    // Monto total aprobado
    const montoAprobadoMes = aprobadas
      .filter(m => m.decision_at?.startsWith(currentMonth))
      .reduce((sum, m) => sum + (m.requested_amount || 0), 0)

    // Solicitudes estancadas (más de 3 días en mismo estado)
    const estancadas = misSolicitudes.filter(m => {
      if (['approved', 'rejected', 'cancelled'].includes(m.status)) return false
      return getDaysInStatus(m) > 3
    })

    // Tiempo promedio de procesamiento (de pending a decisión)
    const conDecision = misSolicitudes.filter(m => m.decision_at && m.pending_at)
    const tiempoPromedio = conDecision.length > 0
      ? Math.round(conDecision.reduce((sum, m) => {
          const inicio = new Date(m.pending_at!).getTime()
          const fin = new Date(m.decision_at!).getTime()
          return sum + (fin - inicio) / (1000 * 60 * 60 * 24)
        }, 0) / conDecision.length)
      : 0

    const estadoAprobacion = tasaAprobacion >= 70 ? 'good' : tasaAprobacion >= 50 ? 'warning' : 'critical'

    return (
      <div className="space-y-4">
        {/* Header asesor */}
        <div className="bg-gradient-to-r from-teal-900/50 to-cyan-900/50 border border-teal-500/30 rounded-xl p-4">
          <h2 className="text-xl font-bold mb-1">💳 Dashboard Asesor Hipotecario</h2>
          <p className="text-sm text-slate-400">Gestión de solicitudes de crédito - {currentUser.name}</p>
        </div>

        {/* Alerta de estancadas */}
        {estancadas.length > 0 && (
          <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🚨</span>
              <span className="font-semibold text-red-400">{estancadas.length} solicitudes estancadas</span>
            </div>
            <div className="space-y-1">
              {estancadas.slice(0, 3).map(m => (
                <div key={m.id} className="text-sm flex items-center gap-2">
                  <span className="text-slate-300">{m.lead_name}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-yellow-400">{getDaysInStatus(m)} días en {m.status}</span>
                </div>
              ))}
              {estancadas.length > 3 && <p className="text-xs text-slate-400">+{estancadas.length - 3} más</p>}
            </div>
          </div>
        )}

        {/* KPIs principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Solicitudes activas */}
          <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
            <p className="text-[11px] font-medium text-slate-400 mb-1">ACTIVAS</p>
            <p className="text-3xl font-bold text-blue-400">{pendientes + enRevision + enviadasBanco}</p>
            <p className="text-xs text-slate-400">{pendientes} pend. • {enRevision} rev. • {enviadasBanco} banco</p>
          </div>

          {/* Tasa de aprobación */}
          <div className={`kpi-card rounded-xl p-4 border ${estadoAprobacion === 'good' ? 'bg-green-900/30 border-green-500/40' : estadoAprobacion === 'warning' ? 'bg-yellow-900/30 border-yellow-500/40' : 'bg-red-900/30 border-red-500/40'}`}>
            <p className="text-[11px] font-medium text-slate-400 mb-1">TASA APROBACIÓN</p>
            <p className={`text-3xl font-bold ${estadoAprobacion === 'good' ? 'text-green-400' : estadoAprobacion === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
              {tasaAprobacion}%
            </p>
            <p className="text-xs text-slate-400">{aprobadasMes} de {totalDecisionMes} este mes</p>
          </div>

          {/* Monto aprobado */}
          <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
            <p className="text-[11px] font-medium text-slate-400 mb-1">MONTO APROBADO</p>
            <p className="text-3xl font-bold text-emerald-400">${(montoAprobadoMes / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-slate-400">este mes</p>
          </div>

          {/* Tiempo promedio */}
          <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
            <p className="text-[11px] font-medium text-slate-400 mb-1">TIEMPO PROM.</p>
            <p className={`text-3xl font-bold ${tiempoPromedio <= 7 ? 'text-green-400' : tiempoPromedio <= 14 ? 'text-yellow-400' : 'text-red-400'}`}>
              {tiempoPromedio}d
            </p>
            <p className="text-xs text-slate-400">solicitud a decisión</p>
          </div>
        </div>

        {/* CHAT IA - Preguntas para Asesor */}
        <div className="bg-gradient-to-br from-teal-900/40 to-cyan-900/40 border border-teal-500/30 p-4 rounded-xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={dashboardPregunta}
              onChange={(e) => setDashboardPregunta(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && preguntarDashboardIA()}
              placeholder="🤖 Pregunta a la IA: ¿Cómo mejorar tasa de aprobación? ¿Qué banco conviene más?"
              className="flex-1 bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2 text-sm focus:border-teal-500 focus:outline-none"
            />
            <button
              onClick={preguntarDashboardIA}
              disabled={dashboardCargando || !dashboardPregunta.trim()}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {dashboardCargando ? '...' : 'Preguntar'}
            </button>
          </div>
          {dashboardRespuesta && (
            <div className="mt-3 bg-slate-800/50 border border-slate-600/50 rounded-lg p-3">
              <p className="text-sm whitespace-pre-wrap">{dashboardRespuesta}</p>
            </div>
          )}
        </div>

        {/* Pipeline visual */}
        <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-4">
          <h3 className="font-semibold mb-3">📊 Mi Pipeline de Créditos</h3>
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: 'Pendiente', count: pendientes, color: 'bg-slate-500' },
              { label: 'Revisión', count: enRevision, color: 'bg-blue-500' },
              { label: 'En Banco', count: enviadasBanco, color: 'bg-purple-500' },
              { label: 'Aprobadas', count: aprobadas.length, color: 'bg-green-500' },
              { label: 'Rechazadas', count: rechazadas.length, color: 'bg-red-500' }
            ].map((stage, i) => (
              <div key={i} className="text-center">
                <div className={`${stage.color} rounded-lg py-3 text-xl font-bold`}>{stage.count}</div>
                <p className="text-xs mt-1 text-slate-400">{stage.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="flex gap-3">
          <button onClick={() => setView('mortgage')} className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 rounded-xl font-medium">
            💳 Ver mis solicitudes
          </button>
          <button onClick={() => setShowNewMortgage(true)} className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-xl font-medium">
            ➕ Nueva solicitud
          </button>
        </div>
      </div>
    )
  })()}

  {/* ═══════════════════════════════════════════════════════════ */}
  {/* 3 KPIs CRÍTICOS DEL CEO - Solo para Admin */}
  {/* ═══════════════════════════════════════════════════════════ */}
  {(!currentUser || currentUser.role === 'admin' || currentUser.role === 'coordinador' || currentUser.role === 'asesor') && (() => {
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7)
    const diasRestantes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()

    // 1. META VS REAL
    const ventasDelMes = filteredLeads.filter(l =>
      (l.status === 'closed' || l.status === 'delivered' || l.status === 'sold') &&
      l.status_changed_at?.startsWith(currentMonth)
    ).length
    const metaMes = monthlyGoals.company_goal || 0
    const ventasFaltantes = Math.max(0, metaMes - ventasDelMes)
    const porcentajeMeta = metaMes > 0 ? Math.round((ventasDelMes / metaMes) * 100) : 0
    const ventasPorDiaNecesarias = diasRestantes > 0 ? (ventasFaltantes / diasRestantes).toFixed(1) : '0'

    // 2. COBERTURA DE PIPELINE
    const leadsActivos = filteredLeads.filter(l =>
      !['closed', 'delivered', 'sold', 'lost', 'inactive'].includes(l.status)
    ).length
    const tasaConversionReal = filteredLeads.length > 0
      ? (filteredLeads.filter(l => l.status === 'closed' || l.status === 'delivered' || l.status === 'sold').length / filteredLeads.length) * 100
      : 2
    const tasaConversion = Math.max(tasaConversionReal, 2) // mínimo 2%
    const ventasProyectadas = Math.round(leadsActivos * (tasaConversion / 100))
    const leadsNecesarios = tasaConversion > 0 ? Math.ceil(ventasFaltantes / (tasaConversion / 100)) : 0
    const coberturaPipeline = leadsNecesarios > 0 ? Math.round((leadsActivos / leadsNecesarios) * 100) : 100

    // 3. TASA DE CONVERSIÓN
    const metaConversion = 10 // 10% es bueno en inmobiliaria
    const diferenciaConversion = tasaConversionReal - metaConversion

    // Determinar estados
    const estadoMeta = metaMes === 0 ? 'warning' : porcentajeMeta >= 80 ? 'good' : porcentajeMeta >= 50 ? 'warning' : 'critical'
    const estadoPipeline = coberturaPipeline >= 100 ? 'good' : coberturaPipeline >= 70 ? 'warning' : 'critical'
    const estadoConversion = tasaConversionReal >= 10 ? 'good' : tasaConversionReal >= 5 ? 'warning' : 'critical'

    const getColor = (estado: string) => {
      if (estado === 'good') return 'from-green-600/30 to-emerald-600/30 border-green-500/50'
      if (estado === 'warning') return 'from-yellow-600/30 to-amber-600/30 border-yellow-500/50'
      return 'from-red-600/30 to-rose-600/30 border-red-500/50'
    }

    const getIcon = (estado: string) => {
      if (estado === 'good') return '✅'
      if (estado === 'warning') return '⚠️'
      return '🚨'
    }

    const getTextColor = (estado: string) => {
      if (estado === 'good') return 'text-green-400'
      if (estado === 'warning') return 'text-yellow-400'
      return 'text-red-400'
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* KPI 1: META VS REAL */}
        <div className={`kpi-card bg-gradient-to-br ${getColor(estadoMeta)} border rounded-xl p-4`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">META DEL MES</span>
            <span className="text-2xl">{getIcon(estadoMeta)}</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className={`text-4xl font-bold ${getTextColor(estadoMeta)}`}>{ventasDelMes}</span>
            <span className="text-slate-400">/ {metaMes || '?'}</span>
            <span className={`text-lg font-bold ${getTextColor(estadoMeta)}`}>({porcentajeMeta}%)</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all ${estadoMeta === 'good' ? 'bg-green-500' : estadoMeta === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(porcentajeMeta, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">
            {metaMes === 0
              ? 'Sin meta configurada'
              : ventasFaltantes > 0
                ? `Faltan ${ventasFaltantes} ventas · ${diasRestantes} días · ${ventasPorDiaNecesarias}/día`
                : '¡Meta alcanzada!'
            }
          </p>
          {metaMes === 0 && (
            <button onClick={() => setView('goals')} className="text-xs text-blue-400 hover:underline mt-1">
              Configurar meta →
            </button>
          )}
        </div>

        {/* KPI 2: COBERTURA DE PIPELINE */}
        <div className={`kpi-card bg-gradient-to-br ${getColor(estadoPipeline)} border rounded-xl p-4`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">PIPELINE</span>
            <span className="text-2xl">{getIcon(estadoPipeline)}</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className={`text-4xl font-bold ${getTextColor(estadoPipeline)}`}>{leadsActivos}</span>
            <span className="text-slate-400">leads activos</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all ${estadoPipeline === 'good' ? 'bg-green-500' : estadoPipeline === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(coberturaPipeline, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">
            {coberturaPipeline >= 100
              ? `Suficiente para ${ventasProyectadas} ventas al ${tasaConversion.toFixed(1)}%`
              : `Necesitas ${leadsNecesarios} leads · Tienes ${leadsActivos} · Faltan ${Math.max(0, leadsNecesarios - leadsActivos)}`
            }
          </p>
        </div>

        {/* KPI 3: TASA DE CONVERSIÓN */}
        <div className={`kpi-card bg-gradient-to-br ${getColor(estadoConversion)} border rounded-xl p-4`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">CONVERSIÓN</span>
            <span className="text-2xl">{getIcon(estadoConversion)}</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className={`text-4xl font-bold ${getTextColor(estadoConversion)}`}>{tasaConversionReal.toFixed(1)}%</span>
            <span className="text-slate-400">lead → venta</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all ${estadoConversion === 'good' ? 'bg-green-500' : estadoConversion === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min((tasaConversionReal / 15) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">
            {diferenciaConversion >= 0
              ? `+${diferenciaConversion.toFixed(1)}% sobre meta (10%)`
              : `${diferenciaConversion.toFixed(1)}% bajo meta · Pierdes ${Math.abs(Math.round(diferenciaConversion * leadsActivos / 100))} ventas potenciales`
            }
          </p>
        </div>
      </div>
    )
  })()}

  {/* ALERTAS CRÍTICAS - Solo si hay */}
  {(() => {
    const maxDays: Record<string, number> = { new: 1, contacted: 3, scheduled: 1, visited: 5, negotiation: 10, reserved: 30 }
    const now = new Date()
    const stalledLeads = filteredLeads.filter(lead => {
      const max = maxDays[lead.status]
      if (!max) return false
      const changedAt = lead.status_changed_at ? new Date(lead.status_changed_at) : new Date(lead.created_at)
      const days = Math.floor((now.getTime() - changedAt.getTime()) / (1000 * 60 * 60 * 24))
      return days >= max
    })
    const hotNoContact = filteredLeads.filter(l => l.status === 'new' && l.score >= 70)
    
    if (stalledLeads.length === 0 && hotNoContact.length === 0) return null
    
    return (
      <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 border border-red-500/30 rounded-xl p-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="text-4xl">🚨</div>
          <div className="flex-1">
            <h3 className="font-bold text-red-400">REQUIERE ATENCIÓN INMEDIATA</h3>
            <div className="flex gap-6 mt-2">
              {stalledLeads.length > 0 && (
                <div onClick={() => setView('leads')} className="cursor-pointer hover:text-red-300">
                  <span className="text-2xl font-bold text-red-400">{stalledLeads.length}</span>
                  <span className="text-sm text-slate-400 ml-2">leads estancados</span>
                </div>
              )}
              {hotNoContact.length > 0 && (
                <div onClick={() => setView('leads')} className="cursor-pointer hover:text-orange-300">
                  <span className="text-2xl font-bold text-orange-400">{hotNoContact.length}</span>
                  <span className="text-sm text-slate-400 ml-2">leads HOT sin contactar</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  })()}

  {/* ============ META vs REALIDAD - ANÁLISIS CRÍTICO ============ */}
  {metaAnalysis.metaMensual > 0 && (
    <div className={`border rounded-xl p-4 ${metaAnalysis.alertaRoja ? 'bg-gradient-to-r from-red-900/50 to-orange-900/50 border-red-500/50' : metaAnalysis.cumplimientoMeta >= 80 ? 'bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-500/50' : 'bg-gradient-to-r from-yellow-900/40 to-amber-900/40 border-yellow-500/40'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold flex items-center gap-2">
          {metaAnalysis.alertaRoja ? '🚨' : metaAnalysis.cumplimientoMeta >= 80 ? '🎯' : '⚠️'}
          Meta del Mes: {metaAnalysis.ventasActuales}/{metaAnalysis.metaMensual} ventas
        </h3>
        <span className={`text-2xl font-bold ${metaAnalysis.cumplimientoMeta >= 80 ? 'text-green-400' : metaAnalysis.cumplimientoMeta >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
          {metaAnalysis.cumplimientoMeta}%
        </span>
      </div>

      {/* Barra de progreso de meta */}
      <div className="w-full bg-slate-700 rounded-full h-3 mb-4">
        <div
          className={`h-3 rounded-full transition-all ${metaAnalysis.cumplimientoMeta >= 80 ? 'bg-green-500' : metaAnalysis.cumplimientoMeta >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${Math.min(metaAnalysis.cumplimientoMeta, 100)}%` }}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/* Ventas faltantes */}
        <div className="bg-slate-800/50 p-3 rounded-lg text-center">
          <p className="text-xs text-slate-400">Faltan vender</p>
          <p className="text-2xl font-bold text-orange-400">{metaAnalysis.ventasFaltantes}</p>
          <p className="text-xs text-slate-400">casas</p>
        </div>

        {/* Leads necesarios */}
        <div className="bg-slate-800/50 p-3 rounded-lg text-center">
          <p className="text-xs text-slate-400">Leads necesarios</p>
          <p className="text-2xl font-bold text-cyan-400">{metaAnalysis.leadsNecesarios}</p>
          <p className="text-xs text-slate-400">al {metaAnalysis.conversionRate.toFixed(1)}% conv</p>
        </div>

        {/* Leads en funnel */}
        <div className="bg-slate-800/50 p-3 rounded-lg text-center">
          <p className="text-xs text-slate-400">Leads en funnel</p>
          <p className={`text-2xl font-bold ${metaAnalysis.leadsActivosEnFunnel >= metaAnalysis.leadsNecesarios ? 'text-green-400' : 'text-red-400'}`}>
            {metaAnalysis.leadsActivosEnFunnel}
          </p>
          <p className="text-xs text-slate-400">activos</p>
        </div>

        {/* Déficit */}
        <div className="bg-slate-800/50 p-3 rounded-lg text-center">
          <p className="text-xs text-slate-400">Déficit leads</p>
          <p className={`text-2xl font-bold ${metaAnalysis.deficitLeads === 0 ? 'text-green-400' : 'text-red-400'}`}>
            {metaAnalysis.deficitLeads === 0 ? '✓' : `-${metaAnalysis.deficitLeads}`}
          </p>
          <p className="text-xs text-slate-400">{metaAnalysis.diasRestantes} días restantes</p>
        </div>
      </div>

      {/* Alertas y recomendaciones */}
      <div className="space-y-2">
        {metaAnalysis.deficitLeads > 0 && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-red-300">
              <strong>⚠️ ALERTA:</strong> Necesitas <strong>{metaAnalysis.leadsPorDiaNecesarios} leads/día</strong> para llegar a meta.
              {metaAnalysis.alertaRoja && ' ¡Urgente aumentar inversión en marketing!'}
            </p>
          </div>
        )}

        {metaAnalysis.alertaCalidad && (
          <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-sm text-yellow-300">
              <strong>📉 CALIDAD:</strong> Solo {metaAnalysis.calidadLeads}% de leads avanzan en el funnel.
              Revisa la segmentación de anuncios - están entrando leads de baja calidad.
            </p>
          </div>
        )}

        {metaAnalysis.deficitLeads === 0 && metaAnalysis.calidadLeads >= 30 && (
          <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3">
            <p className="text-sm text-green-300">
              <strong>✅ EN TRACK:</strong> Tienes suficientes leads para cumplir la meta.
              Enfócate en avanzar los leads actuales por el funnel.
            </p>
          </div>
        )}
      </div>
    </div>
  )}

  {/* Sin meta configurada */}
  {metaAnalysis.metaMensual === 0 && (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🎯</span>
        <div>
          <p className="font-bold text-slate-300">Sin meta de ventas configurada</p>
          <p className="text-sm text-slate-400">Ve a <button onClick={() => setView('goals')} className="text-blue-400 hover:underline">Metas</button> para configurar tu objetivo mensual y ver este análisis.</p>
        </div>
      </div>
    </div>
  )}

  {/* GAUGE DE SALUD DEL FUNNEL - Visual rápido */}
  <div className="bg-slate-800/50 border border-slate-700/50 p-4 lg:p-5 rounded-xl">
    <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-8">
      {/* Donut Chart */}
      <div className="relative w-32 h-32 lg:w-40 lg:h-40 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {(() => {
            const cerrados = filteredLeads.filter(l => l.status === 'closed' || l.status === 'delivered').length
            const hot = filteredLeads.filter(l => ['negotiation', 'reserved'].includes(l.status)).length
            const warm = filteredLeads.filter(l => ['scheduled', 'visited'].includes(l.status)).length
            const cold = filteredLeads.filter(l => ['new', 'contacted'].includes(l.status)).length
            const total = cerrados + hot + warm + cold || 1
            
            const cerradosPct = (cerrados / total) * 100
            const hotPct = (hot / total) * 100
            const warmPct = (warm / total) * 100
            const coldPct = (cold / total) * 100
            
            const radius = 40
            const circumference = 2 * Math.PI * radius
            
            let offset = 0
            const segments = [
              { pct: cerradosPct, color: '#22c55e', label: 'Cerrados' },
              { pct: hotPct, color: '#ef4444', label: 'HOT' },
              { pct: warmPct, color: '#f97316', label: 'WARM' },
              { pct: coldPct, color: '#3b82f6', label: 'COLD' },
            ]
            
            return segments.map((seg, i) => {
              const strokeDasharray = `${(seg.pct / 100) * circumference} ${circumference}`
              const strokeDashoffset = -offset
              offset += (seg.pct / 100) * circumference
              return (
                <circle
                  key={i}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="12"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              )
            })
          })()}
        </svg>
        {/* Centro del donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {(() => {
            const cerrados = filteredLeads.filter(l => l.status === 'closed' || l.status === 'delivered').length
            const hot = filteredLeads.filter(l => ['negotiation', 'reserved'].includes(l.status)).length
            const total = filteredLeads.length || 1
            const healthScore = Math.round(((cerrados * 3 + hot * 2) / total) * 33)
            return (
              <>
                <p className={`text-2xl font-bold ${healthScore >= 60 ? 'text-green-400' : healthScore >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {Math.min(healthScore, 100)}%
                </p>
                <p className="text-xs text-slate-400">Salud</p>
              </>
            )
          })()}
        </div>
      </div>

      {/* Leyenda y conteos */}
      <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 w-full">
        {[
          { label: 'CERRADOS', color: 'bg-green-500', emoji: '✅', count: filteredLeads.filter(l => l.status === 'closed' || l.status === 'delivered').length, desc: 'Meta lograda' },
          { label: 'HOT', color: 'bg-red-500', emoji: '🔥', count: filteredLeads.filter(l => ['negotiation', 'reserved'].includes(l.status)).length, desc: 'Por cerrar' },
          { label: 'WARM', color: 'bg-orange-500', emoji: '🌡️', count: filteredLeads.filter(l => ['scheduled', 'visited'].includes(l.status)).length, desc: 'En proceso' },
          { label: 'COLD', color: 'bg-blue-500', emoji: '❄️', count: filteredLeads.filter(l => ['new', 'contacted'].includes(l.status)).length, desc: 'Sin avance' },
        ].map((item, i) => (
          <div key={i} className="text-center p-2 lg:p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full ${item.color}`}></div>
              <span className="text-[10px] lg:text-xs text-slate-400">{item.label}</span>
            </div>
            <p className="text-lg lg:text-2xl font-bold">{item.emoji} {item.count}</p>
            <p className="text-[10px] lg:text-xs text-slate-400">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Interpretación rápida */}
      <div className="w-full lg:w-64 p-3 lg:p-4 bg-slate-700/30 rounded-lg">
        <p className="text-sm font-bold mb-2">📊 Estado del Funnel</p>
        {(() => {
          const cerrados = filteredLeads.filter(l => l.status === 'closed' || l.status === 'delivered').length
          const hot = filteredLeads.filter(l => ['negotiation', 'reserved'].includes(l.status)).length
          const cold = filteredLeads.filter(l => ['new', 'contacted'].includes(l.status)).length
          const total = filteredLeads.length || 1
          
          const coldPct = (cold / total) * 100
          const hotPct = ((hot + cerrados) / total) * 100
          
          if (hotPct >= 40) {
            return <p className="text-green-400 text-sm">✅ <strong>Funnel sano.</strong> Muchos leads cerca de cerrar. ¡Sigue así!</p>
          } else if (coldPct >= 60) {
            return <p className="text-red-400 text-sm">🚨 <strong>Alerta.</strong> {cold} leads fríos ({Math.round(coldPct)}%). Acelera el seguimiento.</p>
          } else if (hot >= 5) {
            return <p className="text-yellow-400 text-sm">🔥 <strong>{hot} leads HOT</strong> listos para cerrar. Enfócate en ellos.</p>
          } else {
            return <p className="text-blue-400 text-sm">📈 <strong>Funnel en crecimiento.</strong> Mueve leads de COLD a WARM.</p>
          }
        })()}
      </div>
    </div>
  </div>

  {/* KPIs PRINCIPALES - Cards grandes */}
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
    {/* Pipeline Value */}
    <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 border border-cyan-500/30 p-5 rounded-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 text-6xl opacity-10">💰</div>
      <p className="text-cyan-400 text-sm font-medium">PIPELINE ACTIVO</p>
      <p className="text-3xl font-bold mt-1">${(pipelineValue / 1000000).toFixed(1)}M</p>
      <p className="text-xs text-slate-400 mt-1">en negociación</p>
    </div>
    
    {/* Cierres del mes */}
    <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border border-green-500/30 p-5 rounded-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 text-6xl opacity-10">🏆</div>
      <p className="text-green-400 text-sm font-medium">CIERRES MES</p>
      <p className="text-3xl font-bold mt-1">{monthComparison.thisMonthClosed}</p>
      <div className="flex items-center gap-1 mt-1">
        <span className={`text-xs font-bold ${monthComparison.closedChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {monthComparison.closedChange >= 0 ? '↑' : '↓'} {Math.abs(monthComparison.closedChange)}%
        </span>
        <span className="text-xs text-slate-400">vs mes anterior</span>
      </div>
    </div>
    
    {/* Leads HOT */}
    <div onClick={() => setView('leads')} className="bg-gradient-to-br from-red-900/50 to-orange-900/50 border border-red-500/30 p-5 rounded-xl relative overflow-hidden cursor-pointer hover:border-red-400/50 transition-all">
      <div className="absolute top-0 right-0 text-6xl opacity-10">🔥</div>
      <p className="text-red-400 text-sm font-medium">LEADS HOT</p>
      <p className="text-3xl font-bold mt-1">{filteredLeads.filter(l => ['negotiation', 'reserved'].includes(l.status)).length}</p>
      <p className="text-xs text-slate-400 mt-1">listos para cerrar</p>
    </div>
    
    {/* Tiempo Respuesta */}
    <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border border-purple-500/30 p-5 rounded-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 text-6xl opacity-10">⚡</div>
      <p className="text-purple-400 text-sm font-medium">RESPUESTA</p>
      <p className={`text-3xl font-bold mt-1 ${avgResponseTime <= 30 ? 'text-green-400' : avgResponseTime <= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
        {avgResponseTime < 60 ? `${avgResponseTime}m` : `${Math.round(avgResponseTime/60)}h`}
      </p>
      <p className="text-xs text-slate-400 mt-1">{avgResponseTime <= 30 ? '✓ Excelente' : avgResponseTime <= 60 ? '⚠ Mejorar' : '✗ Crítico'}</p>
    </div>
    
    {/* Proyección */}
    <div className="bg-gradient-to-br from-yellow-900/50 to-amber-900/50 border border-yellow-500/30 p-5 rounded-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 text-6xl opacity-10">🎯</div>
      <p className="text-yellow-400 text-sm font-medium">PROYECCIÓN</p>
      <p className="text-3xl font-bold mt-1">{closingProjection.deals}</p>
      <p className="text-xs text-slate-400 mt-1">${(closingProjection.revenue / 1000000).toFixed(1)}M estimado</p>
    </div>
  </div>

  {/* FUNNEL VISUAL - Tipo Tableau */}
  <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-xl">
    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
      <span className="text-2xl">📊</span> Funnel de Ventas
      <span className="text-sm text-slate-400 font-normal ml-auto">Click para ver leads de cada etapa</span>
    </h3>
    <div className="relative">
      {/* Barras del funnel */}
      <div className="space-y-2">
        {[
          { key: 'new', label: 'Nuevos', color: 'from-slate-500 to-slate-600', emoji: '🆕' },
          { key: 'contacted', label: 'Contactados', color: 'from-blue-500 to-blue-600', emoji: '📞' },
          { key: 'scheduled', label: 'Cita Agendada', color: 'from-cyan-500 to-cyan-600', emoji: '📅' },
          { key: 'visited', label: 'Visitaron', color: 'from-purple-500 to-purple-600', emoji: '🏠' },
          { key: 'negotiation', label: 'Negociación', color: 'from-yellow-500 to-yellow-600', emoji: '💰' },
          { key: 'reserved', label: 'Reservado', color: 'from-orange-500 to-orange-600', emoji: '📍' },
          { key: 'closed', label: 'Cerrado', color: 'from-green-500 to-green-600', emoji: '✅' },
        ].map((stage, i) => {
          const count = filteredLeads.filter(l => l.status === stage.key).length
          const total = filteredLeads.length || 1
          const percent = Math.round((count / total) * 100)
          const maxCount = Math.max(...['new', 'contacted', 'scheduled', 'visited', 'negotiation', 'reserved', 'closed'].map(s => filteredLeads.filter(l => l.status === s).length), 1)
          const barWidth = (count / maxCount) * 100
          
          return (
            <div key={stage.key} className="flex items-center gap-3 group cursor-pointer" onClick={() => setView('leads')}>
              <div className="w-24 text-right text-sm text-slate-400">{stage.emoji} {stage.label}</div>
              <div className="flex-1 relative">
                <div className="h-10 bg-slate-700/50 rounded-lg overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${stage.color} rounded-lg transition-all duration-500 group-hover:brightness-110 flex items-center justify-end pr-3`}
                    style={{ width: `${Math.max(barWidth, 5)}%` }}
                  >
                    <span className="text-white font-bold text-sm drop-shadow">{count}</span>
                  </div>
                </div>
              </div>
              <div className="w-16 text-right">
                <span className="text-sm font-semibold">{percent}%</span>
              </div>
              {i < 6 && (
                <div className="w-16 text-right text-xs text-slate-400">
                  {i === 0 ? '' : (() => {
                    const prevCount = filteredLeads.filter(l => l.status === ['new', 'contacted', 'scheduled', 'visited', 'negotiation', 'reserved'][i-1]).length
                    if (prevCount === 0) return '-'
                    return `${Math.round((count / prevCount) * 100)}% conv`
                  })()}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  </div>

  {/* ROW 2: Ranking + Tendencia + ROI */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    
    {/* RANKING VENDEDORES con badges */}
    <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-xl">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-2xl">🏆</span> Top Vendedores
      </h3>
      <div className="space-y-2">
        {vendedoresRanking.slice(0, 5).map((v, i) => {
          const vendorLeads = filteredLeads.filter(l => l.assigned_to === v.id)
          const closedCount = vendorLeads.filter(l => l.status === 'closed').length
          const convRate = vendorLeads.length > 0 ? Math.round((closedCount / vendorLeads.length) * 100) : 0
          const badges = []
          if (i === 0 && (v.sales_count || 0) > 0) badges.push('👑')
          if (convRate >= 20) badges.push('🎯')
          if (vendorLeads.filter(l => l.status === 'new').length === 0 && vendorLeads.length > 0) badges.push('⚡')
          
          return (
            <div key={v.id} className={`flex items-center gap-3 p-3 rounded-lg ${i === 0 ? 'bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-500/30' : 'bg-slate-700/50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                i === 0 ? 'bg-yellow-500 text-black' : 
                i === 1 ? 'bg-slate-400 text-black' : 
                i === 2 ? 'bg-orange-700' : 'bg-slate-600'
              }`}>
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{v.name?.split(' ')[0]}</p>
                <p className="text-xs text-slate-400">{vendorLeads.length} leads · {convRate}% conv</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-400">{v.sales_count || 0}</p>
                <p className="text-xs">{badges.join(' ')}</p>
              </div>
            </div>
          )
        })}
        {vendedoresRanking.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Sin vendedores</p>}
      </div>
    </div>

    {/* TENDENCIA MENSUAL */}
    <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-xl">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-2xl">📈</span> Tendencia 6 Meses
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={monthlyTrend}>
          <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Legend />
          <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={3} name="Leads" dot={{ fill: '#3b82f6', strokeWidth: 2 }} />
          <Line type="monotone" dataKey="closed" stroke="#22c55e" strokeWidth={3} name="Cerrados" dot={{ fill: '#22c55e', strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>

    {/* ROI POR CANAL */}
    <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-xl">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-2xl">💵</span> CPL por Canal
      </h3>
      <div className="space-y-2">
        {cplBySource.slice(0, 5).map((c, i) => (
          <div key={c.channel} className="flex items-center gap-3">
            <div className="w-20 text-sm text-slate-400 truncate">{c.channel}</div>
            <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full ${c.cpl <= 300 ? 'bg-green-500' : c.cpl <= 600 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min((c.cpl / 1000) * 100, 100)}%` }}
              />
            </div>
            <div className={`w-20 text-right text-sm font-bold ${c.cpl <= 300 ? 'text-green-400' : c.cpl <= 600 ? 'text-yellow-400' : 'text-red-400'}`}>
              ${c.cpl}
            </div>
          </div>
        ))}
        {cplBySource.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Sin campañas</p>}
      </div>
      <div className="mt-4 pt-3 border-t border-slate-700">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">ROI Total</span>
          <span className={`font-bold ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>{roi.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  </div>

  {/* ROW 3: Conversiones + Métricas adicionales */}
  <div className="grid grid-cols-2 gap-4">
    
    {/* CONVERSION POR ETAPA - Mini funnel */}
    <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-xl">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-2xl">🔄</span> Tasas de Conversión
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { from: 'Lead', to: 'Cita', rate: conversionByStage.find(s => s.stage === 'Cita')?.conversion || 0, target: 40 },
          { from: 'Cita', to: 'Visita', rate: (() => {
            const citas = filteredLeads.filter(l => ['scheduled', 'visited', 'negotiation', 'reserved', 'closed'].includes(l.status)).length
            const visitas = filteredLeads.filter(l => ['visited', 'negotiation', 'reserved', 'closed'].includes(l.status)).length
            return citas > 0 ? Math.round((visitas / citas) * 100) : 0
          })(), target: 70 },
          { from: 'Visita', to: 'Cierre', rate: (() => {
            const visitas = filteredLeads.filter(l => ['visited', 'negotiation', 'reserved', 'closed'].includes(l.status)).length
            const cierres = filteredLeads.filter(l => l.status === 'closed').length
            return visitas > 0 ? Math.round((cierres / visitas) * 100) : 0
          })(), target: 20 },
        ].map((conv, i) => (
          <div key={i} className="text-center">
            <div className="relative w-20 h-20 mx-auto">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="35" fill="none" stroke="#334155" strokeWidth="6" />
                <circle 
                  cx="40" cy="40" r="35" fill="none" 
                  stroke={conv.rate >= conv.target ? '#22c55e' : conv.rate >= conv.target * 0.7 ? '#eab308' : '#ef4444'}
                  strokeWidth="6"
                  strokeDasharray={`${(conv.rate / 100) * 220} 220`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${conv.rate >= conv.target ? 'text-green-400' : 'text-white'}`}>
                  {conv.rate}%
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">{conv.from} ↑ {conv.to}</p>
            <p className="text-xs text-slate-400">Meta: {conv.target}%</p>
          </div>
        ))}
      </div>
    </div>

    {/* AI INSIGHTS */}
    {insights.length > 0 && (
      <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 p-5 rounded-xl">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">🤖</span> AI Insights
        </h3>
        <div className="space-y-3">
          {insights.slice(0, 3).map((insight, i) => (
            <div key={i} className={`p-3 rounded-lg border-l-4 ${
              insight.type === 'warning' ? 'bg-yellow-900/20 border-yellow-500' : 
              insight.type === 'success' ? 'bg-green-900/20 border-green-500' : 
              'bg-blue-900/20 border-blue-500'
            }`}>
              <p className="font-semibold text-sm">{insight.title}</p>
              <p className="text-xs text-slate-400 mt-1">{insight.description}</p>
            </div>
          ))}
        </div>
      </div>
    )}
    
    {insights.length === 0 && (
      <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-xl">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">📊</span> Distribución de Leads
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={scoreData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({name, value}) => `${name}: ${value}`}>
              {scoreData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>

  {/* ROW 4: KPIs DE CONVERSIÓN INMOBILIARIA */}
  <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 p-5 rounded-xl">
    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
      <span className="text-2xl">📈</span> KPIs de Conversión Inmobiliaria
      <span className="text-xs text-slate-400 font-normal ml-auto">Métricas clave del funnel</span>
    </h3>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* Lead to Sale */}
      <div className="bg-slate-800/50 p-4 rounded-lg text-center">
        <p className="text-[11px] font-medium text-slate-400 mb-1">Lead ↑ Venta</p>
        <p className={`text-2xl font-bold ${parseFloat(conversionLeadToSale) >= 1 ? 'text-green-400' : parseFloat(conversionLeadToSale) >= 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
          {conversionLeadToSale}%
        </p>
        <p className="text-xs text-slate-400 mt-1">Meta: 1-3%</p>
        <div className="w-full bg-slate-700 h-1 rounded mt-2">
          <div className={`h-1 rounded ${parseFloat(conversionLeadToSale) >= 1 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{width: `${Math.min(parseFloat(conversionLeadToSale) * 33, 100)}%`}}></div>
        </div>
      </div>
      
      {/* Lead to Cita */}
      <div className="bg-slate-800/50 p-4 rounded-lg text-center">
        <p className="text-[11px] font-medium text-slate-400 mb-1">Lead ↑ Cita</p>
        <p className={`text-2xl font-bold ${parseFloat(conversionLeadToCita) >= 15 ? 'text-green-400' : parseFloat(conversionLeadToCita) >= 10 ? 'text-yellow-400' : 'text-red-400'}`}>
          {conversionLeadToCita}%
        </p>
        <p className="text-xs text-slate-400 mt-1">Meta: 15-25%</p>
        <div className="w-full bg-slate-700 h-1 rounded mt-2">
          <div className={`h-1 rounded ${parseFloat(conversionLeadToCita) >= 15 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{width: `${Math.min(parseFloat(conversionLeadToCita) * 4, 100)}%`}}></div>
        </div>
      </div>
      
      {/* Cita to Close */}
      <div className="bg-slate-800/50 p-4 rounded-lg text-center">
        <p className="text-[11px] font-medium text-slate-400 mb-1">Visita ↑ Cierre</p>
        <p className={`text-2xl font-bold ${parseFloat(conversionCitaToClose) >= 10 ? 'text-green-400' : parseFloat(conversionCitaToClose) >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
          {conversionCitaToClose}%
        </p>
        <p className="text-xs text-slate-400 mt-1">Meta: 10-20%</p>
        <div className="w-full bg-slate-700 h-1 rounded mt-2">
          <div className={`h-1 rounded ${parseFloat(conversionCitaToClose) >= 10 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{width: `${Math.min(parseFloat(conversionCitaToClose) * 5, 100)}%`}}></div>
        </div>
      </div>
      
      {/* Ratio Leads/Venta */}
      <div className="bg-slate-800/50 p-4 rounded-lg text-center">
        <p className="text-[11px] font-medium text-slate-400 mb-1">Leads por Venta</p>
        <p className={`text-2xl font-bold ${ratioLeadsPorVenta <= 50 ? 'text-green-400' : ratioLeadsPorVenta <= 100 ? 'text-yellow-400' : 'text-red-400'}`}>
          {ratioLeadsPorVenta}:1
        </p>
        <p className="text-xs text-slate-400 mt-1">Meta: 50:1</p>
        <div className="w-full bg-slate-700 h-1 rounded mt-2">
          <div className={`h-1 rounded ${ratioLeadsPorVenta <= 50 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{width: `${Math.max(100 - ratioLeadsPorVenta, 10)}%`}}></div>
        </div>
      </div>
      
      {/* Speed to Lead */}
      <div className="bg-slate-800/50 p-4 rounded-lg text-center">
        <p className="text-[11px] font-medium text-slate-400 mb-1">Tiempo Respuesta</p>
        <p className={`text-2xl font-bold ${avgResponseTime <= 5 ? 'text-green-400' : avgResponseTime <= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
          {avgResponseTime < 60 ? `${avgResponseTime}m` : `${Math.round(avgResponseTime/60)}h`}
        </p>
        <p className="text-xs text-slate-400 mt-1">Meta: &lt;5 min</p>
        <div className="w-full bg-slate-700 h-1 rounded mt-2">
          <div className={`h-1 rounded ${avgResponseTime <= 5 ? 'bg-green-500' : avgResponseTime <= 30 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${Math.max(100 - avgResponseTime * 2, 10)}%`}}></div>
        </div>
      </div>
    </div>
    
    {/* Interpretación automática */}
    <div className="mt-4 p-3 bg-slate-800/30 rounded-lg">
      <p className="text-sm font-semibold text-slate-300 mb-2">💡 Diagnóstico Automático:</p>
      <div className="text-xs text-slate-400 space-y-1">
        {parseFloat(conversionLeadToCita) < 15 && (
          <p className="text-yellow-400">⚠ï¸ Baja conversión Lead↑Cita: Revisa segmentación de anuncios, estás atrayendo curiosos.</p>
        )}
        {parseFloat(conversionCitaToClose) < 10 && parseFloat(conversionLeadToCita) >= 15 && (
          <p className="text-yellow-400">⚠ï¸ Baja conversión Visita↑Cierre: Capacita vendedores o mejora presentación de propiedades.</p>
        )}
        {ratioLeadsPorVenta > 100 && (
          <p className="text-red-400">🚨 Ratio muy alto ({ratioLeadsPorVenta}:1): Tu rentabilidad está en riesgo. Optimiza todo el funnel.</p>
        )}
        {avgResponseTime > 30 && (
          <p className="text-red-400">🚨 Respuesta lenta: El interés cae 10x después de 5 minutos. Automatiza primer contacto.</p>
        )}
        {parseFloat(conversionLeadToSale) >= 2 && avgResponseTime <= 30 && (
          <p className="text-green-400">✅ ¡Excelente! Tu funnel está saludable. Escala tu inversión en marketing.</p>
        )}
      </div>
    </div>
  </div>

  {/* ROW 5: RENDIMIENTO POR DESARROLLO */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    {/* Card: Más Unidades Vendidas */}
    <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border border-blue-500/30 p-5 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-3xl">🏆</span>
        <div>
          <p className="text-xs text-blue-400">MÁS UNIDADES VENDIDAS</p>
          <p className="text-xl font-bold">{topDevByUnits?.name || 'N/A'}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-slate-800/50 p-2 rounded">
          <p className="text-slate-400 text-xs">Unidades</p>
          <p className="font-bold text-lg">{(topDevByUnits?.ventas || 0) + (topDevByUnits?.soldUnits || 0)}</p>
        </div>
        <div className="bg-slate-800/50 p-2 rounded">
          <p className="text-slate-400 text-xs">Leads</p>
          <p className="font-bold text-lg">{topDevByUnits?.leads || 0}</p>
        </div>
      </div>
    </div>

    {/* Card: Más Ingresos */}
    <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border border-green-500/30 p-5 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-3xl">💰</span>
        <div>
          <p className="text-xs text-green-400">MÁS INGRESOS GENERADOS</p>
          <p className="text-xl font-bold">{topDevByRevenue?.name || 'N/A'}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-slate-800/50 p-2 rounded">
          <p className="text-slate-400 text-xs">Ingresos</p>
          <p className="font-bold text-lg text-green-400">${((topDevByRevenue?.revenue || 0) / 1000000).toFixed(1)}M</p>
        </div>
        <div className="bg-slate-800/50 p-2 rounded">
          <p className="text-slate-400 text-xs">Precio Prom</p>
          <p className="font-bold text-lg">${((topDevByRevenue?.avgPrice || 0) / 1000000).toFixed(1)}M</p>
        </div>
      </div>
    </div>

    {/* Card: Insight */}
    <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border border-purple-500/30 p-5 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-3xl">💡</span>
        <p className="text-xs text-purple-400">INSIGHT</p>
      </div>
      {topDevByUnits?.name !== topDevByRevenue?.name ? (
        <div className="text-sm">
          <p className="text-yellow-400 font-semibold mb-2">⚠ï¸ No coinciden</p>
          <p className="text-slate-300 text-xs">
            <strong>{topDevByUnits?.name}</strong> vende más unidades pero <strong>{topDevByRevenue?.name}</strong> genera más dinero.
          </p>
          <p className="text-slate-400 text-xs mt-2">
            Considera enfocar marketing en {topDevByRevenue?.name} para maximizar ingresos.
          </p>
        </div>
      ) : (
        <div className="text-sm">
          <p className="text-green-400 font-semibold mb-2">✅ Alineado</p>
          <p className="text-slate-300 text-xs">
            <strong>{topDevByUnits?.name}</strong> es tu mejor desarrollo en volumen Y revenue.
          </p>
          <p className="text-slate-400 text-xs mt-2">
            ¡Maximiza inversión en este desarrollo!
          </p>
        </div>
      )}
    </div>
  </div>

  {/* Tabla completa de desarrollos */}
  <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-xl">
    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
      <span className="text-2xl">🗝️</span> Rendimiento por Desarrollo
      <span className="text-xs text-slate-400 font-normal ml-auto">Volumen vs Rentabilidad</span>
    </h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 border-b border-slate-700">
            <th className="text-left py-2 px-3">Desarrollo</th>
            <th className="text-center py-2 px-3">Leads</th>
            <th className="text-center py-2 px-3">Ventas</th>
            <th className="text-center py-2 px-3">Conv %</th>
            <th className="text-center py-2 px-3">Precio Prom</th>
            <th className="text-center py-2 px-3">Ingresos</th>
            <th className="text-center py-2 px-3">Disponibles</th>
            <th className="text-center py-2 px-3">Score</th>
          </tr>
        </thead>
        <tbody>
          {developmentPerformance.slice(0, 10).map((dev, i) => {
            const convRate = dev.leads > 0 ? Math.round((dev.ventas / dev.leads) * 100) : 0
            const totalVentas = dev.ventas + dev.soldUnits
            // Score: pondera ventas, revenue y conversión
            const score = (totalVentas * 10) + (dev.revenue / 1000000) + (convRate * 0.5)
            return (
              <tr key={dev.name} className={`border-b border-slate-700/50 ${i === 0 ? 'bg-green-900/20' : ''}`}>
                <td className="py-2 px-3 font-medium">
                  <div className="flex items-center gap-2">
                    {i === 0 && <span className="text-yellow-400">👑</span>}
                    {dev.name}
                  </div>
                </td>
                <td className="text-center py-2 px-3">{dev.leads}</td>
                <td className="text-center py-2 px-3 font-bold text-green-400">{totalVentas}</td>
                <td className="text-center py-2 px-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${convRate >= 5 ? 'bg-green-500/20 text-green-400' : convRate >= 2 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-500/20 text-slate-400'}`}>
                    {convRate}%
                  </span>
                </td>
                <td className="text-center py-2 px-3">${(dev.avgPrice / 1000000).toFixed(1)}M</td>
                <td className="text-center py-2 px-3 font-bold text-cyan-400">${(dev.revenue / 1000000).toFixed(1)}M</td>
                <td className="text-center py-2 px-3">
                  {dev.disponibles > 0 ? (
                    <span className="text-blue-400">{dev.disponibles}</span>
                  ) : (
                    <span className="text-red-400">Agotado</span>
                  )}
                </td>
                <td className="text-center py-2 px-3">
                  {'⭐'.repeat(Math.min(Math.ceil(score / 20), 5))}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {developmentPerformance.length === 0 && (
        <p className="text-slate-400 text-center py-4">Sin datos de desarrollos. Agrega propiedades con el campo "development".</p>
      )}
    </div>
  </div>

  {/* ROW 6: LEADS POR FUENTE/CANAL */}
  <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-xl">
    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
      <span className="text-2xl">📣</span> Rendimiento por Canal de Adquisición
      <span className="text-xs text-slate-400 font-normal ml-auto">¿Qué fuente genera mejores leads?</span>
    </h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 border-b border-slate-700">
            <th className="text-left py-2 px-3">Canal</th>
            <th className="text-center py-2 px-3">Leads</th>
            <th className="text-center py-2 px-3">Citas</th>
            <th className="text-center py-2 px-3">Ventas</th>
            <th className="text-center py-2 px-3">Conv. Cita</th>
            <th className="text-center py-2 px-3">Conv. Venta</th>
            <th className="text-center py-2 px-3">Calidad</th>
          </tr>
        </thead>
        <tbody>
          {leadsBySource.slice(0, 8).map((s, i) => (
            <tr key={s.source} className={`border-b border-slate-700/50 ${i === 0 ? 'bg-green-900/20' : ''}`}>
              <td className="py-2 px-3 font-medium flex items-center gap-2">
                {s.source === 'facebook' || s.source === 'Facebook' || s.source === 'facebook_ads' ? '📘' :
                 s.source === 'google' || s.source === 'Google' ? '🔍' :
                 s.source === 'instagram' || s.source === 'Instagram' ? '📸' :
                 s.source === 'referido' || s.source === 'Referido' || s.source === 'referral' ? '🤝' :
                 s.source === 'phone_inbound' ? '📞' :
                 s.source === 'tiktok' || s.source === 'TikTok' ? '🎵' : '📣'}
                {sourceLabel(s.source)}
                {i === 0 && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Top</span>}
              </td>
              <td className="text-center py-2 px-3 font-bold">{s.total}</td>
              <td className="text-center py-2 px-3">{s.citas}</td>
              <td className="text-center py-2 px-3 text-green-400 font-bold">{s.ventas}</td>
              <td className="text-center py-2 px-3">
                <span className={`px-2 py-0.5 rounded text-xs ${s.convToCita >= 20 ? 'bg-green-500/20 text-green-400' : s.convToCita >= 10 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                  {s.convToCita}%
                </span>
              </td>
              <td className="text-center py-2 px-3">
                <span className={`px-2 py-0.5 rounded text-xs ${s.convToVenta >= 2 ? 'bg-green-500/20 text-green-400' : s.convToVenta >= 1 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-500/20 text-slate-400'}`}>
                  {s.convToVenta}%
                </span>
              </td>
              <td className="text-center py-2 px-3">
                {s.convToCita >= 20 && s.convToVenta >= 2 ? '⭐⭐⭐' : 
                 s.convToCita >= 15 || s.convToVenta >= 1 ? '⭐⭐' : '⭐'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {leadsBySource.length === 0 && (
        <p className="text-slate-400 text-center py-4">Sin datos de fuentes. Asigna el campo "source" a tus leads.</p>
      )}
    </div>
  </div>

  {/* FOOTER - Resumen rápido */}
  <div className="bg-slate-800/30 border border-slate-700/30 p-4 rounded-xl">
    <div className="flex justify-between items-center text-sm">
      <div className="flex gap-6">
        <span className="text-slate-400">Total leads: <span className="text-white font-bold">{filteredLeads.length}</span></span>
        <span className="text-slate-400">Este mes: <span className="text-blue-400 font-bold">{monthComparison.thisMonthLeads}</span></span>
        <span className="text-slate-400">Vendedores activos: <span className="text-green-400 font-bold">{team.filter(t => t.role === 'vendedor' && t.active).length}</span></span>
      </div>
      <div className="flex items-center gap-3 text-slate-400 text-xs">
        <span>🔄 Auto-refresh: {lastRefresh.toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit', second: '2-digit'})}</span>
        <button onClick={() => loadDataSilent()} className="px-2 py-1 bg-slate-700 rounded hover:bg-slate-600">Actualizar</button>
      </div>
    </div>
  </div>
</div>
  )
}
