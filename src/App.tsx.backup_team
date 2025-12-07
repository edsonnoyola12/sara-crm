import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { Users, Calendar as CalendarIcon, Settings, TrendingUp, Phone, DollarSign, Target, Award, Building, UserCheck, Flame, X, Save, Plus, Edit, Trash2, CreditCard, AlertTriangle, Clock, CheckCircle, XCircle, ArrowRight, Megaphone, BarChart3, Eye, MousePointer, Lightbulb, TrendingDown, AlertCircle } from 'lucide-react'

type View = 'dashboard' | 'leads' | 'properties' | 'team' | 'calendar' | 'mortgage' | 'marketing' | 'config'

interface Lead {
  id: string
  name: string
  phone: string
  property_interest: string
  budget: string
  score: number
  status: string
  created_at: string
  conversation_history: any[]
  assigned_to?: string
  source?: string
  campaign_id?: string
  updated_at?: string
}

interface Property {
  id: string
  name: string
  category: string
  base_price: number
  bedrooms: number
  bathrooms: number
  sqm: number
  total_units: number
  sold_units: number
  reserved_units: number
  image_url: string
  description: string
  location: string
  amenities: string
  video_url: string
}

interface TeamMember {
  id: string
  name: string
  phone: string
  role: string
  sales_count: number
  commission: number
  active: boolean
  photo_url: string
  email: string
}

interface MortgageApplication {
  id: string
  lead_id: string
  lead_name: string
  lead_phone: string
  property_id: string
  property_name: string
  monthly_income: number
  additional_income: number
  current_debt: number
  down_payment: number
  requested_amount: number
  credit_term_years: number
  prequalification_score: number
  max_approved_amount: number
  estimated_monthly_payment: number
  assigned_advisor_id: string
  assigned_advisor_name: string
  bank: string
  status: string
  status_notes: string
  pending_at: string
  in_review_at: string
  sent_to_bank_at: string
  decision_at: string
  stalled_alert_sent: boolean
  created_at: string
  updated_at: string
}

interface Campaign {
  id: string
  name: string
  channel: string
  status: string
  budget: number
  spent: number
  impressions: number
  clicks: number
  leads_generated: number
  sales_closed: number
  revenue_generated: number
  start_date: string
  end_date: string
  notes: string
  target_audience: string
  creative_url: string
  created_at: string
}

interface ReminderConfig {
  id: string
  lead_category: string
  reminder_hours: number
  active: boolean
  message_template: string
  send_start_hour: number
  send_end_hour: number
}

interface Insight {
  type: 'opportunity' | 'warning' | 'success'
  title: string
  description: string
  action?: string
  icon: any
}

function App() {
  const [view, setView] = useState<View>('dashboard')
  const [leads, setLeads] = useState<Lead[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [mortgages, setMortgages] = useState<MortgageApplication[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [reminderConfigs, setReminderConfigs] = useState<ReminderConfig[]>([])
  const [editingReminder, setEditingReminder] = useState<ReminderConfig | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<Insight[]>([])
  
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [editingMortgage, setEditingMortgage] = useState<MortgageApplication | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [showNewProperty, setShowNewProperty] = useState(false)
  const [showNewMember, setShowNewMember] = useState(false)
  const [showNewMortgage, setShowNewMortgage] = useState(false)
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])
  const [showNewEvent, setShowNewEvent] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [leadsRes, propsRes, teamRes, mortgagesRes, campaignsRes, remindersRes] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('properties').select('*'),
      supabase.from('team_members').select('*'),
      supabase.from('mortgage_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('reminder_config').select('*').order('lead_category')
    ])
    setLeads(leadsRes.data || [])
    setProperties(propsRes.data || [])
    setTeam(teamRes.data || [])
    setMortgages(mortgagesRes.data || [])
    setCampaigns(campaignsRes.data || [])
    setReminderConfigs(remindersRes.data || [])
    console.log('🔍 Reminders cargados:', remindersRes.data)
    
    generateInsights(leadsRes.data || [], teamRes.data || [], campaignsRes.data || [])
    
    setLoading(false)
    loadCalendarEvents()
  }

  function generateInsights(leads: Lead[], team: TeamMember[], campaigns: Campaign[]) {
    const newInsights: Insight[] = []

    const hotLeadsNoActivity = leads.filter(l => {
      if (l.score >= 8 && l.status === 'new') {
        const updatedAt = new Date(l.updated_at || l.created_at)
        const horasSinActividad = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60)
        return horasSinActividad > 2
      }
      return false
    })

    if (hotLeadsNoActivity.length > 0) {
      newInsights.push({
        type: 'warning',
        title: `${hotLeadsNoActivity.length} leads HOT sin atención`,
        description: 'Tienes leads calificados que no han recibido seguimiento en las últimas 2 horas',
        action: 'Contactar urgente',
        icon: Flame
      })
    }

    const highCPLCampaigns = campaigns.filter(c => {
      const cpl = c.leads_generated > 0 ? c.spent / c.leads_generated : 0
      return cpl > 1000 && c.status === 'active'
    })

    if (highCPLCampaigns.length > 0) {
      newInsights.push({
        type: 'warning',
        title: `CPL alto en ${highCPLCampaigns[0].name}`,
        description: `El costo por lead es de $${(highCPLCampaigns[0].spent / highCPLCampaigns[0].leads_generated).toFixed(0)}. Considera ajustar segmentación`,
        action: 'Revisar campaña',
        icon: TrendingDown
      })
    }

    const mostInterested = leads.reduce((acc: Record<string, number>, l) => {
      if (l.property_interest) {
        acc[l.property_interest] = (acc[l.property_interest] || 0) + 1
      }
      return acc
    }, {})

    const topProperty = Object.entries(mostInterested).sort((a, b) => b[1] - a[1])[0]
    if (topProperty && topProperty[1] > 5) {
      newInsights.push({
        type: 'success',
        title: `${topProperty[0]} tiene alta demanda`,
        description: `${topProperty[1]} leads interesados. Considera aumentar precio o crear campaña específica`,
        action: 'Ver propiedad',
        icon: TrendingUp
      })
    }

    const topSeller = team.filter(t => t.role === 'vendedor').sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))[0]
    if (topSeller && topSeller.sales_count > 0) {
      newInsights.push({
        type: 'success',
        title: `${topSeller.name} lidera en ventas`,
        description: `${topSeller.sales_count} ventas cerradas. Comparte sus mejores prácticas con el equipo`,
        action: 'Ver estadísticas',
        icon: Award
      })
    }

    const negativeROICampaigns = campaigns.filter(c => {
      const roi = c.spent > 0 ? ((c.revenue_generated - c.spent) / c.spent * 100) : 0
      return roi < -20 && c.status === 'active'
    })

    if (negativeROICampaigns.length > 0) {
      newInsights.push({
        type: 'warning',
        title: `${negativeROICampaigns.length} campañas con ROI negativo`,
        description: 'Revisa la efectividad de estas campañas y considera pausarlas o ajustarlas',
        action: 'Ver campañas',
        icon: AlertCircle
      })
    }

    const qualifiedLeads = leads.filter(l => l.score >= 7 && l.status === 'qualified')
    if (qualifiedLeads.length > 3) {
      newInsights.push({
        type: 'opportunity',
        title: `${qualifiedLeads.length} clientes listos para cerrar`,
        description: 'Tienes leads calificados que están en la etapa final. Prioriza el seguimiento',
        action: 'Ver leads',
        icon: Target
      })
    }

    setInsights(newInsights)
  }

  async function loadCalendarEvents() {
    try {
      const response = await fetch("https://sara-backend.edson-633.workers.dev/api/calendar/events")
      const data = await response.json()
      setCalendarEvents(data.items || [])
    } catch (error) {
      console.error("Error loading calendar:", error)
    }
  }

  async function createCalendarEvent(eventData: any) {
    try {
      await fetch("https://sara-backend.edson-633.workers.dev/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData)
      })
      loadCalendarEvents()
      setShowNewEvent(false)
    } catch (error) {
      console.error("Error creating event:", error)
    }
  }

  async function deleteCalendarEvent(eventId: string) {
    if (confirm("¿Cancelar esta cita?")) {
      try {
        await fetch(`https://sara-backend.edson-633.workers.dev/api/calendar/events/${eventId}`, {
          method: "DELETE"
        })
        loadCalendarEvents()
      } catch (error) {
        console.error("Error deleting event:", error)
      }
    }
  }

  async function saveProperty(prop: Partial<Property>) {
    if (prop.id) {
      await supabase.from('properties').update(prop).eq('id', prop.id)
    } else {
      await supabase.from('properties').insert([prop])
    }
    loadData()
    setEditingProperty(null)
    setShowNewProperty(false)
  }

  async function deleteProperty(id: string) {
    if (confirm('¿Eliminar esta propiedad?')) {
      await supabase.from('properties').delete().eq('id', id)
      loadData()
    }
  }

  async function saveMember(member: Partial<TeamMember>) {
    if (member.id) {
      await supabase.from('team_members').update(member).eq('id', member.id)
    } else {
      await supabase.from('team_members').insert([member])
    }
    loadData()
    setEditingMember(null)
    setShowNewMember(false)
  }

  async function saveMortgage(mortgage: Partial<MortgageApplication>) {
    const now = new Date().toISOString()
    if (mortgage.id) {
      const current = mortgages.find(m => m.id === mortgage.id)
      if (current && current.status !== mortgage.status) {
        if (mortgage.status === 'in_review') mortgage.in_review_at = now
        if (mortgage.status === 'sent_to_bank') mortgage.sent_to_bank_at = now
        if (mortgage.status === 'approved' || mortgage.status === 'rejected') mortgage.decision_at = now
      }
      await supabase.from('mortgage_applications').update(mortgage).eq('id', mortgage.id)
    } else {
      mortgage.pending_at = now
      await supabase.from('mortgage_applications').insert([mortgage])
    }
    loadData()
    setEditingMortgage(null)
    setShowNewMortgage(false)
  }

  async function updateMortgageStatus(id: string, newStatus: string) {
    const now = new Date().toISOString()
    const updates: any = { status: newStatus }
    if (newStatus === 'in_review') updates.in_review_at = now
    if (newStatus === 'sent_to_bank') updates.sent_to_bank_at = now
    if (newStatus === 'approved' || newStatus === 'rejected') updates.decision_at = now
    
    await supabase.from('mortgage_applications').update(updates).eq('id', id)
    loadData()
  }

  async function saveCampaign(campaign: Partial<Campaign>) {
    if (campaign.id) {
      await supabase.from('marketing_campaigns').update(campaign).eq('id', campaign.id)
    } else {
      await supabase.from('marketing_campaigns').insert([campaign])
    }
    loadData()
    setEditingCampaign(null)
    setShowNewCampaign(false)
  }

  async function deleteCampaign(id: string) {
    if (confirm('¿Eliminar esta campaña?')) {
      await supabase.from('marketing_campaigns').delete().eq('id', id)
      loadData()
    }
  }

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

  const hotLeads = leads.filter(l => l.score >= 8).length
  const warmLeads = leads.filter(l => l.score >= 5 && l.score < 8).length
  const coldLeads = leads.filter(l => l.score < 5).length
  const totalSales = team.reduce((acc, t) => acc + (t.sales_count || 0), 0)
  const totalCommissions = team.reduce((acc, t) => acc + (t.commission || 0), 0)
  const availableUnits = properties.reduce((acc, p) => acc + ((p.total_units || 0) - (p.sold_units || 0) - (p.reserved_units || 0)), 0)
  const soldUnits = properties.reduce((acc, p) => acc + (p.sold_units || 0), 0)

  const totalBudget = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0)
  const totalSpent = campaigns.reduce((acc, c) => acc + (c.spent || 0), 0)
  const totalLeadsFromCampaigns = campaigns.reduce((acc, c) => acc + (c.leads_generated || 0), 0)
  const totalSalesFromCampaigns = campaigns.reduce((acc, c) => acc + (c.sales_closed || 0), 0)
  const totalRevenue = campaigns.reduce((acc, c) => acc + (c.revenue_generated || 0), 0)
  const avgCPL = totalLeadsFromCampaigns > 0 ? totalSpent / totalLeadsFromCampaigns : 0
  const avgCPA = totalSalesFromCampaigns > 0 ? totalSpent / totalSalesFromCampaigns : 0
  const roi = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0

  const scoreData = [
    { name: 'HOT', value: hotLeads, color: '#ef4444' },
    { name: 'WARM', value: warmLeads, color: '#f97316' },
    { name: 'COLD', value: coldLeads, color: '#3b82f6' }
  ]

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

  const saveReminderConfig = async (config: ReminderConfig) => {
    try {
      const { error } = await supabase
        .from('reminder_config')
        .update({
          reminder_hours: config.reminder_hours,
          message_template: config.message_template,
          send_start_hour: config.send_start_hour,
          send_end_hour: config.send_end_hour
        })
        .eq('id', config.id)
      
      if (error) throw error
      
      setReminderConfigs(prev => prev.map(r => r.id === config.id ? config : r))
      setEditingReminder(null)
    } catch (error) {
      console.error('Error updating reminder config:', error)
    }
  }


  const vendedoresRanking = [...team].filter(t => t.role === 'vendedor').sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))
  const asesoresRanking = [...team].filter(t => t.role === 'asesor').sort((a, b) => (b.commission || 0) - (a.commission || 0))
  const asesores = team.filter(t => t.role === 'asesor')

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-red-500'
    if (score >= 5) return 'bg-orange-500'
    return 'bg-blue-500'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'HOT'
    if (score >= 5) return 'WARM'
    return 'COLD'
  }

  const mortgageStatuses = [
    { key: 'pending', label: 'Pendiente', icon: Clock, color: 'bg-gray-500' },
    { key: 'in_review', label: 'En Revisión', icon: AlertTriangle, color: 'bg-yellow-500' },
    { key: 'sent_to_bank', label: 'Enviado a Banco', icon: ArrowRight, color: 'bg-blue-500' },
    { key: 'approved', label: 'Aprobado', icon: CheckCircle, color: 'bg-green-500' },
    { key: 'rejected', label: 'Rechazado', icon: XCircle, color: 'bg-red-500' }
  ]

  const channelColors: Record<string, string> = {
    'Facebook': 'bg-blue-600',
    'Google Ads': 'bg-red-500',
    'Instagram': 'bg-pink-500',
    'TikTok': 'bg-gray-800',
    'TV': 'bg-purple-600',
    'Radio': 'bg-yellow-600',
    'Espectaculares': 'bg-green-600',
    'Referidos': 'bg-cyan-500'
  }

  if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      <div className="w-64 bg-gray-800 p-4 flex flex-col">
        <h1 className="text-2xl font-bold mb-2">SARA CRM</h1>
        <p className="text-gray-400 text-sm mb-8">Real Estate AI</p>
        
        <nav className="flex-1 space-y-2">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'dashboard' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
            <TrendingUp size={20} /> Dashboard
          </button>
          <button onClick={() => setView('leads')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'leads' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
            <Users size={20} /> Leads
          </button>
          <button onClick={() => setView('properties')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'properties' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
            <Building size={20} /> Propiedades
          </button>
          <button onClick={() => setView('team')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'team' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
            <UserCheck size={20} /> Equipo
          </button>
          <button onClick={() => setView('mortgage')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'mortgage' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
            <CreditCard size={20} /> Hipotecas
            {mortgages.filter(m => getDaysInStatus(m) > 3 && !['approved', 'rejected', 'cancelled'].includes(m.status)).length > 0 && (
              <span className="bg-red-500 text-xs px-2 py-1 rounded-full">
                {mortgages.filter(m => getDaysInStatus(m) > 3 && !['approved', 'rejected', 'cancelled'].includes(m.status)).length}
              </span>
            )}
          </button>
          <button onClick={() => setView('marketing')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'marketing' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
            <Megaphone size={20} /> Marketing
          </button>
          <button onClick={() => setView('calendar')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'calendar' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
            <CalendarIcon size={20} /> Calendario
          </button>
          <button onClick={() => setView('config')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${view === 'config' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>
            <Settings size={20} /> Configuración
          </button>
        </nav>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        {view === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Dashboard</h2>
            
            {insights.length > 0 && (
              <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-6 rounded-xl border border-purple-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="text-yellow-400" size={24} />
                  <h3 className="text-xl font-bold">AI Strategic Advisor</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {insights.map((insight, i) => {
                    const Icon = insight.icon
                    return (
                      <div key={i} className={`bg-gray-800/50 p-4 rounded-lg border-l-4 ${
                        insight.type === 'warning' ? 'border-yellow-500' : 
                        insight.type === 'success' ? 'border-green-500' : 
                        'border-blue-500'
                      }`}>
                        <div className="flex items-start gap-3">
                          <Icon className={
                            insight.type === 'warning' ? 'text-yellow-500' : 
                            insight.type === 'success' ? 'text-green-500' : 
                            'text-blue-500'
                          } size={20} />
                          <div className="flex-1">
                            <p className="font-semibold mb-1">{insight.title}</p>
                            <p className="text-sm text-gray-400 mb-2">{insight.description}</p>
                            {insight.action && (
                              <button className="text-sm text-blue-400 hover:text-blue-300">
                                {insight.action} →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-800 p-6 rounded-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400">Total Leads</p>
                    <p className="text-3xl font-bold">{leads.length}</p>
                  </div>
                  <Users className="text-blue-500" />
                </div>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400">Leads HOT 🔥</p>
                    <p className="text-3xl font-bold text-red-500">{hotLeads}</p>
                  </div>
                  <Flame className="text-red-500" />
                </div>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400">Ventas Cerradas</p>
                    <p className="text-3xl font-bold text-green-500">{totalSales}</p>
                  </div>
                  <Target className="text-green-500" />
                </div>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400">ROI Marketing</p>
                    <p className={`text-3xl font-bold ${roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>{roi.toFixed(0)}%</p>
                  </div>
                  <BarChart3 className="text-purple-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-800 p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">Distribución de Leads</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={scoreData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {scoreData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">Leads por Canal</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={roiByChannel}>
                    <XAxis dataKey="channel" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Bar dataKey="leads" fill="#3b82f6" name="Leads" />
                    <Bar dataKey="sales" fill="#22c55e" name="Ventas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Award className="text-yellow-500" /> Leaderboard Vendedores
              </h3>
              <div className="space-y-3">
                {vendedoresRanking.slice(0, 5).map((v, i) => (
                  <div key={v.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-600' : 'bg-gray-600'}`}>
                        {i + 1}
                      </span>
                      <span>{v.name}</span>
                    </div>
                    <span className="font-bold text-green-500">{v.sales_count || 0} ventas</span>
                  </div>
                ))}
                {vendedoresRanking.length === 0 && <p className="text-gray-500">Sin vendedores registrados</p>}
              </div>
            </div>
          </div>
        )}

        {view === 'leads' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Leads ({leads.length})</h2>
              <div className="flex gap-2">
                <span className="bg-red-500 px-3 py-1 rounded-full text-sm">HOT ({hotLeads})</span>
                <span className="bg-orange-500 px-3 py-1 rounded-full text-sm">WARM ({warmLeads})</span>
                <span className="bg-blue-500 px-3 py-1 rounded-full text-sm">COLD ({coldLeads})</span>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="text-left p-4">Nombre</th>
                    <th className="text-left p-4">Teléfono</th>
                    <th className="text-left p-4">Interés</th>
                    <th className="text-left p-4">Score</th>
                    <th className="text-left p-4">Estado</th>
                    <th className="text-left p-4">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(lead => (
                    <tr key={lead.id} onClick={() => setSelectedLead(lead)} className="border-t border-gray-700 hover:bg-gray-700 cursor-pointer">
                      <td className="p-4">{lead.name || 'Sin nombre'}</td>
                      <td className="p-4 flex items-center gap-2"><Phone size={16} /> {lead.phone}</td>
                      <td className="p-4">{lead.property_interest || '-'}</td>
                      <td className="p-4">
                        <span className={`${getScoreColor(lead.score)} px-2 py-1 rounded text-sm`}>
                          {getScoreLabel(lead.score)} ({lead.score})
                        </span>
                      </td>
                      <td className="p-4">{lead.status}</td>
                      <td className="p-4">{new Date(lead.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'properties' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Propiedades ({properties.length})</h2>
              <button onClick={() => setShowNewProperty(true)} className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Plus size={20} /> Agregar Propiedad
              </button>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {properties.map(prop => (
                <div key={prop.id} className="bg-gray-800 rounded-xl overflow-hidden group relative">
                  <div className="h-40 bg-gray-700 flex items-center justify-center">
                    {prop.image_url ? (
                      <img src={prop.image_url} alt={prop.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building size={48} className="text-gray-500" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2">{prop.name}</h3>
                    <p className="text-2xl font-bold text-green-500 mb-2">${(prop.base_price || 0).toLocaleString()}</p>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{prop.description || 'Sin descripción'}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-500">{prop.sold_units || 0} vendidas</span>
                      <span className="text-blue-500">{(prop.total_units || 0) - (prop.sold_units || 0)} disponibles</span>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button onClick={() => setEditingProperty(prop)} className="bg-blue-600 p-2 rounded-lg hover:bg-blue-700">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => deleteProperty(prop.id)} className="bg-red-600 p-2 rounded-lg hover:bg-red-700">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'team' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Equipo ({team.length})</h2>
              <button onClick={() => setShowNewMember(true)} className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Plus size={20} /> Agregar Miembro
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gray-800 p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">Vendedores</h3>
                <div className="space-y-3">
                  {team.filter(t => t.role === 'vendedor').map(member => (
                    <div key={member.id} className="flex items-center justify-between bg-gray-700 p-4 rounded-lg group">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                          <Users size={24} />
                        </div>
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-gray-400 text-sm">{member.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-green-500 font-bold">{member.sales_count || 0} ventas</p>
                        </div>
                        <button onClick={() => setEditingMember(member)} className="opacity-0 group-hover:opacity-100 bg-blue-600 p-2 rounded-lg">
                          <Edit size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {team.filter(t => t.role === 'vendedor').length === 0 && <p className="text-gray-500 text-center py-4">Sin vendedores</p>}
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">Asesores Hipotecarios</h3>
                <div className="space-y-3">
                  {team.filter(t => t.role === 'asesor').map(member => (
                    <div key={member.id} className="flex items-center justify-between bg-gray-700 p-4 rounded-lg group">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                          <Users size={24} />
                        </div>
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-gray-400 text-sm">{member.phone}</p>
                        </div>
                      </div>
                      <button onClick={() => setEditingMember(member)} className="opacity-0 group-hover:opacity-100 bg-blue-600 p-2 rounded-lg">
                        <Edit size={16} />
                      </button>
                    </div>
                  ))}
                  {team.filter(t => t.role === 'asesor').length === 0 && <p className="text-gray-500 text-center py-4">Sin asesores</p>}
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">Marketing / Agencia</h3>
                <div className="space-y-3">
                  {team.filter(t => t.role === 'agencia').map(member => (
                    <div key={member.id} className="flex items-center justify-between bg-gray-700 p-4 rounded-lg group">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                          <Megaphone size={24} />
                        </div>
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-gray-400 text-sm">{member.phone}</p>
                        </div>
                      </div>
                      <button onClick={() => setEditingMember(member)} className="opacity-0 group-hover:opacity-100 bg-blue-600 p-2 rounded-lg">
                        <Edit size={16} />
                      </button>
                    </div>
                  ))}
                  {team.filter(t => t.role === 'agencia').length === 0 && <p className="text-gray-500 text-center py-4">Sin personal de marketing</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'mortgage' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Solicitudes Hipotecarias ({mortgages.length})</h2>
              <button onClick={() => setShowNewMortgage(true)} className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Plus size={20} /> Nueva Solicitud
              </button>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {mortgageStatuses.map(status => {
                const StatusIcon = status.icon
                const statusMortgages = mortgages.filter(m => m.status === status.key)
                return (
                  <div key={status.key} className="bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <StatusIcon className="text-white" size={20} />
                      <h3 className="font-semibold">{status.label}</h3>
                      <span className={`${status.color} text-xs px-2 py-1 rounded-full ml-auto`}>
                        {statusMortgages.length}
                      </span>
                    </div>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {statusMortgages.map(mortgage => {
                        const daysInStatus = getDaysInStatus(mortgage)
                        return (
                          <div key={mortgage.id} onClick={() => setEditingMortgage(mortgage)} className="bg-gray-700 p-3 rounded-lg cursor-pointer hover:bg-gray-600 relative">
                            {daysInStatus > 3 && !['approved', 'rejected'].includes(mortgage.status) && (
                              <AlertTriangle className="absolute top-2 right-2 text-red-500" size={16} />
                            )}
                            <p className="font-semibold text-sm">{mortgage.lead_name}</p>
                            <p className="text-xs text-gray-400">{mortgage.property_name}</p>
                            <p className="text-xs text-gray-400 mt-1">${(mortgage.requested_amount || 0).toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">{daysInStatus}d en {status.label.toLowerCase()}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {view === 'marketing' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Marketing ({campaigns.length} campañas)</h2>
              <button onClick={() => setShowNewCampaign(true)} className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Plus size={20} /> Nueva Campaña
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-800 p-6 rounded-xl">
                <p className="text-gray-400 mb-1">Presupuesto Total</p>
                <p className="text-2xl font-bold">${totalBudget.toLocaleString()}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl">
                <p className="text-gray-400 mb-1">Gastado</p>
                <p className="text-2xl font-bold text-orange-500">${totalSpent.toLocaleString()}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl">
                <p className="text-gray-400 mb-1">CPL Promedio</p>
                <p className="text-2xl font-bold">${avgCPL.toFixed(0)}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl">
                <p className="text-gray-400 mb-1">ROI</p>
                <p className={`text-2xl font-bold ${roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>{roi.toFixed(0)}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-800 p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">Inversión vs Leads por Canal</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={roiByChannel}>
                    <XAxis dataKey="channel" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="spent" fill="#f97316" name="Invertido" />
                    <Bar dataKey="leads" fill="#3b82f6" name="Leads" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">Revenue vs Inversión</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={roiByChannel}>
                    <XAxis dataKey="channel" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="spent" fill="#ef4444" name="Invertido" />
                    <Bar dataKey="revenue" fill="#22c55e" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="text-left p-4">Campaña</th>
                    <th className="text-left p-4">Canal</th>
                    <th className="text-left p-4">Gastado</th>
                    <th className="text-left p-4">Leads</th>
                    <th className="text-left p-4">CPL</th>
                    <th className="text-left p-4">Ventas</th>
                    <th className="text-left p-4">ROI</th>
                    <th className="text-left p-4">Estado</th>
                    <th className="text-left p-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(campaign => {
                    const cpl = campaign.leads_generated > 0 ? campaign.spent / campaign.leads_generated : 0
                    const campaignROI = campaign.spent > 0 ? ((campaign.revenue_generated - campaign.spent) / campaign.spent * 100) : 0
                    return (
                      <tr key={campaign.id} className="border-t border-gray-700 hover:bg-gray-700">
                        <td className="p-4 font-semibold">{campaign.name}</td>
                        <td className="p-4">
                          <span className={`${channelColors[campaign.channel]} px-2 py-1 rounded text-sm`}>
                            {campaign.channel}
                          </span>
                        </td>
                        <td className="p-4">${campaign.spent.toLocaleString()}</td>
                        <td className="p-4">{campaign.leads_generated}</td>
                        <td className="p-4">${cpl.toFixed(0)}</td>
                        <td className="p-4">{campaign.sales_closed}</td>
                        <td className="p-4">
                          <span className={campaignROI >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {campaignROI.toFixed(0)}%
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-sm ${
                            campaign.status === 'active' ? 'bg-green-600' : 
                            campaign.status === 'paused' ? 'bg-yellow-600' : 
                            'bg-gray-600'
                          }`}>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="p-4 flex gap-2">
                          <button onClick={() => setEditingCampaign(campaign)} className="bg-blue-600 p-2 rounded hover:bg-blue-700">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => deleteCampaign(campaign.id)} className="bg-red-600 p-2 rounded hover:bg-red-700">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'calendar' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Calendario de Citas ({calendarEvents.length})</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {calendarEvents.map((event: any) => {
                const startDate = new Date(event.start?.dateTime || event.start?.date)
                return (
                  <div key={event.id} className="bg-gray-800 p-4 rounded-xl flex items-center justify-between hover:bg-gray-700">
                    <div className="flex items-center gap-4">
                      <CalendarIcon className="text-blue-500" size={32} />
                      <div>
                        <p className="font-bold">{event.summary}</p>
                        <p className="text-gray-400 text-sm">{event.description || 'Sin descripción'}</p>
                        <p className="text-blue-400 text-sm mt-1">📅 {startDate.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })} - 🕐 {startDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteCalendarEvent(event.id)} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={20} /></button>
                  </div>
                )
              })}
              {calendarEvents.length === 0 && (
                <div className="text-center py-12">
                  <CalendarIcon size={64} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 text-lg">Sin citas agendadas</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'config' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Configuración</h2>
            <div className="bg-gray-800 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-4">Notificaciones por WhatsApp</h3>
              <p className="text-gray-400 mb-4">Todos los miembros activos recibirán notificaciones según su rol.</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Vendedores (reciben: nuevos leads, leads olvidados)</h4>
                  <div className="space-y-2">
                    {team.filter(t => t.role === 'vendedor').map(v => (
                      <div key={v.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                        <span>{v.name} - {v.phone}</span>
                        <span className={`px-2 py-1 rounded text-sm ${v.active ? 'bg-green-600' : 'bg-gray-600'}`}>
                          {v.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Asesores (reciben: solicitudes hipotecarias, solicitudes estancadas)</h4>
                  <div className="space-y-2">
                    {team.filter(t => t.role === 'asesor').map(a => (
                      <div key={a.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                        <span>{a.name} - {a.phone}</span>
                        <span className={`px-2 py-1 rounded text-sm ${a.active ? 'bg-green-600' : 'bg-gray-600'}`}>
                          {a.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Marketing (pueden reportar métricas, reciben: alertas ROI, CPL alto)</h4>
                  <div className="space-y-2">
                    {team.filter(t => t.role === 'agencia').map(m => (
                      <div key={m.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                        <span>{m.name} - {m.phone}</span>
                        <span className={`px-2 py-1 rounded text-sm ${m.active ? 'bg-green-600' : 'bg-gray-600'}`}>
                          {m.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Configuración de Recordatorios */}
            <div className="bg-gray-800 p-6 rounded-xl mt-6">
              <h3 className="text-xl font-semibold mb-4">⏰ Recordatorios Automáticos</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reminderConfigs.map(config => (
                  <div key={config.id} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold ${
                        config.lead_category === 'HOT' ? 'text-red-500' :
                        config.lead_category === 'WARM' ? 'text-yellow-500' : 'text-blue-500'
                      }`}>{config.lead_category}</span>
                      <button onClick={() => setEditingReminder(config)} className="text-blue-400 hover:text-blue-300">
                        Editar
                      </button>
                    </div>
                    <p className="text-2xl font-bold">Cada {config.reminder_hours}h</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {config.send_start_hour}:00 - {config.send_end_hour}:00
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>


      {editingReminder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingReminder(null)}>
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Editar {editingReminder.lead_category}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Frecuencia (horas)</label>
                <input type="number" defaultValue={editingReminder.reminder_hours} id="hrs" className="w-full bg-gray-700 rounded px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Inicio</label>
                  <input type="number" defaultValue={editingReminder.send_start_hour} id="start" className="w-full bg-gray-700 rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm mb-2">Fin</label>
                  <input type="number" defaultValue={editingReminder.send_end_hour} id="end" className="w-full bg-gray-700 rounded px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Mensaje</label>
                <textarea defaultValue={editingReminder.message_template} id="msg" rows={4} className="w-full bg-gray-700 rounded px-3 py-2" />
              </div>
              <div className="flex gap-3">
                                            <button onClick={() => setEditingReminder(null)} className="flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded">
                                              Cancelar
                                            </button>
                                            <button onClick={() => saveReminderConfig({...editingReminder, reminder_hours: parseInt((document.getElementById('hrs') as HTMLInputElement).value), send_start_hour: parseInt((document.getElementById('start') as HTMLInputElement).value), send_end_hour: parseInt((document.getElementById('end') as HTMLInputElement).value), message_template: (document.getElementById('msg') as HTMLTextAreaElement).value})} className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded">Guardar</button>
                                          </div>
            </div>
          </div>
        </div>
      )}

      {(editingProperty || showNewProperty) && (
        <PropertyModal
          property={editingProperty}
          onSave={saveProperty}
          onClose={() => { setEditingProperty(null); setShowNewProperty(false); }}
        />
      )}

      {(editingMember || showNewMember) && (
        <MemberModal
          member={editingMember}
          onSave={saveMember}
          onClose={() => { setEditingMember(null); setShowNewMember(false); }}
        />
      )}

      {(editingMortgage || showNewMortgage) && (
        <MortgageModal
          mortgage={editingMortgage}
          leads={leads}
          properties={properties}
          asesores={asesores}
          onSave={saveMortgage}
          onClose={() => { setEditingMortgage(null); setShowNewMortgage(false); }}
        />
      )}

      {(editingCampaign || showNewCampaign) && (
        <CampaignModal
          campaign={editingCampaign}
          onSave={saveCampaign}
          onClose={() => { setEditingCampaign(null); setShowNewCampaign(false); }}
        />
      )}

      {showNewEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewEvent(false)}>
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Agendar Cita</h3>
              <button onClick={() => setShowNewEvent(false)} className="text-gray-400 hover:text-white"><X /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Cliente</label>
                <select id="evt-cliente" className="w-full bg-gray-700 rounded-lg p-3">
                  <option value="">Seleccionar</option>
                  {leads.map(l => <option key={l.id} value={(l.name||"")+ "|" + (l.phone||"")}>{l.name || l.phone}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Propiedad</label>
                <select id="evt-prop" className="w-full bg-gray-700 rounded-lg p-3">
                  <option value="">Seleccionar</option>
                  {properties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Fecha</label>
                <input type="date" id="evt-date" className="w-full bg-gray-700 rounded-lg p-3" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Hora</label>
                <select id="evt-time" className="w-full bg-gray-700 rounded-lg p-3">
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowNewEvent(false)} className="px-4 py-2 rounded-lg bg-gray-700">Cancelar</button>
              <button onClick={() => {
                const cv = (document.getElementById("evt-cliente") as HTMLSelectElement).value.split("|");
                const cn = cv[0];
                const cp = cv[1] || "";
                const pr = (document.getElementById("evt-prop") as HTMLSelectElement).value;
                const dt = (document.getElementById("evt-date") as HTMLInputElement).value;
                const tm = (document.getElementById("evt-time") as HTMLSelectElement).value;
                if(cn && dt){
                  createCalendarEvent({
                    summary: "Cita: " + cn + " - " + pr,
                    description: "Cliente: " + cn + "\nTelefono: " + cp + "\nPropiedad: " + pr,
                    startTime: dt + "T" + tm + ":00-06:00",
                    endTime: dt + "T" + String(parseInt(tm.split(":")[0])+1).padStart(2,"0") + ":00:00-06:00"
                  });
                }
              }} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center gap-2"><Save size={20} /> Agendar</button>
            </div>
          </div>
        </div>
      )}

      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedLead(null)}>
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Conversación con {selectedLead.name || 'Lead'}</h3>
              <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-white"><X /></button>
            </div>
            <div className="space-y-3">
              <p><span className="font-semibold">Teléfono:</span> {selectedLead.phone}</p>
              <p><span className="font-semibold">Score:</span> <span className={`${getScoreColor(selectedLead.score)} px-2 py-1 rounded`}>{selectedLead.score}</span></p>
              <p><span className="font-semibold">Estado:</span> {selectedLead.status}</p>
              <p><span className="font-semibold">Interés:</span> {selectedLead.property_interest || 'No definido'}</p>
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Historial de conversación:</h4>
                <div className="bg-gray-700 p-4 rounded-lg max-h-96 overflow-y-auto">
                  {selectedLead.conversation_history && selectedLead.conversation_history.length > 0 ? (
                    selectedLead.conversation_history.map((msg: any, i: number) => (
                      <div key={i} className={`mb-3 ${msg.role === 'user' ? 'text-blue-400' : 'text-green-400'}`}>
                        <span className="font-semibold">{msg.role === 'user' ? 'Cliente' : 'SARA'}:</span> {msg.content}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">Sin historial de conversación</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PropertyModal({ property, onSave, onClose }: { property: Property | null, onSave: (p: Partial<Property>) => void, onClose: () => void }) {
  const [form, setForm] = useState<Partial<Property>>(property || {
    name: '', category: '', base_price: 0, bedrooms: 0, bathrooms: 0, sqm: 0, 
    total_units: 0, sold_units: 0, reserved_units: 0, image_url: '', description: '', 
    location: '', amenities: '', video_url: ''
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 p-6 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{property ? 'Editar Propiedad' : 'Nueva Propiedad'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nombre</label>
            <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Categoría</label>
            <input value={form.category || ''} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Precio Base</label>
            <input type="number" value={form.base_price || ''} onChange={e => setForm({...form, base_price: parseFloat(e.target.value)})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Recámaras</label>
            <input type="number" value={form.bedrooms || ''} onChange={e => setForm({...form, bedrooms: parseInt(e.target.value)})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Baños</label>
            <input type="number" value={form.bathrooms || ''} onChange={e => setForm({...form, bathrooms: parseInt(e.target.value)})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">m²</label>
            <input type="number" value={form.sqm || ''} onChange={e => setForm({...form, sqm: parseInt(e.target.value)})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Total Unidades</label>
            <input type="number" value={form.total_units || ''} onChange={e => setForm({...form, total_units: parseInt(e.target.value)})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Vendidas</label>
            <input type="number" value={form.sold_units || ''} onChange={e => setForm({...form, sold_units: parseInt(e.target.value)})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Descripción</label>
            <textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-gray-700 rounded-lg p-3" rows={3} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">URL Imagen</label>
            <input value={form.image_url || ''} onChange={e => setForm({...form, image_url: e.target.value})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600">Cancelar</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Save size={20} /> Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

function MemberModal({ member, onSave, onClose }: { member: TeamMember | null, onSave: (m: Partial<TeamMember>) => void, onClose: () => void }) {
  const [form, setForm] = useState<Partial<TeamMember>>(member || {
    name: '', phone: '', role: 'vendedor', sales_count: 0, commission: 0, active: true, photo_url: '', email: ''
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{member ? 'Editar Miembro' : 'Nuevo Miembro'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nombre</label>
            <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">WhatsApp</label>
            <input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-gray-700 rounded-lg p-3" placeholder="+5215512345678" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Rol</label>
            <select value={form.role || ''} onChange={e => setForm({...form, role: e.target.value})} className="w-full bg-gray-700 rounded-lg p-3">
              <option value="vendedor">Vendedor</option>
              <option value="asesor">Asesor Hipotecario</option>
              <option value="agencia">Marketing / Agencia</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="w-5 h-5" />
            <label>Activo (recibe notificaciones)</label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600">Cancelar</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Save size={20} /> Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

function MortgageModal({ mortgage, leads, properties, asesores, onSave, onClose }: { 
  mortgage: MortgageApplication | null, 
  leads: Lead[], 
  properties: Property[],
  asesores: TeamMember[],
  onSave: (m: Partial<MortgageApplication>) => void, 
  onClose: () => void 
}) {
  const [form, setForm] = useState<Partial<MortgageApplication>>(mortgage || {
    lead_id: '', lead_name: '', lead_phone: '', property_id: '', property_name: '',
    monthly_income: 0, additional_income: 0, current_debt: 0, down_payment: 0,
    requested_amount: 0, credit_term_years: 20, assigned_advisor_id: '', 
    assigned_advisor_name: '', bank: '', status: 'pending', status_notes: ''
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 p-6 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{mortgage ? 'Editar Solicitud' : 'Nueva Solicitud'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Lead</label>
            <select value={form.lead_id || ''} onChange={e => {
              const lead = leads.find(l => l.id === e.target.value)
              setForm({...form, lead_id: e.target.value, lead_name: lead?.name || '', lead_phone: lead?.phone || ''})
            }} className="w-full bg-gray-700 rounded-lg p-3">
              <option value="">Seleccionar lead</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name || l.phone}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Propiedad</label>
            <select value={form.property_id || ''} onChange={e => {
              const prop = properties.find(p => p.id === e.target.value)
              setForm({...form, property_id: e.target.value, property_name: prop?.name || '', requested_amount: prop?.base_price || 0})
            }} className="w-full bg-gray-700 rounded-lg p-3">
              <option value="">Seleccionar propiedad</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Ingreso Mensual</label>
            <input type="number" value={form.monthly_income || ''} onChange={e => setForm({...form, monthly_income: parseFloat(e.target.value)})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Deuda Actual</label>
            <input type="number" value={form.current_debt || ''} onChange={e => setForm({...form, current_debt: parseFloat(e.target.value)})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Enganche</label>
            <input type="number" value={form.down_payment || ''} onChange={e => setForm({...form, down_payment: parseFloat(e.target.value)})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Asesor</label>
            <select value={form.assigned_advisor_id || ''} onChange={e => {
              const asesor = asesores.find(a => a.id === e.target.value)
              setForm({...form, assigned_advisor_id: e.target.value, assigned_advisor_name: asesor?.name || ''})
            }} className="w-full bg-gray-700 rounded-lg p-3">
              <option value="">Seleccionar asesor</option>
              {asesores.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Estado</label>
            <select value={form.status || ''} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-gray-700 rounded-lg p-3">
              <option value="pending">Pendiente</option>
              <option value="in_review">En Revisión</option>
              <option value="sent_to_bank">Enviado a Banco</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Banco</label>
            <input value={form.bank || ''} onChange={e => setForm({...form, bank: e.target.value})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600">Cancelar</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Save size={20} /> Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

function CampaignModal({ campaign, onSave, onClose }: { campaign: Campaign | null, onSave: (c: Partial<Campaign>) => void, onClose: () => void }) {
  const [form, setForm] = useState<Partial<Campaign>>(campaign || {
    name: '', channel: 'Facebook', status: 'active', budget: 0, spent: 0,
    impressions: 0, clicks: 0, leads_generated: 0, sales_closed: 0, revenue_generated: 0,
    start_date: '', end_date: '', notes: '', target_audience: '', creative_url: ''
  })

  const ctr = form.impressions && form.impressions > 0 ? ((form.clicks || 0) / form.impressions * 100) : 0
  const cpl = form.leads_generated && form.leads_generated > 0 ? ((form.spent || 0) / form.leads_generated) : 0
  const roi = form.spent && form.spent > 0 ? (((form.revenue_generated || 0) - form.spent) / form.spent * 100) : 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 p-6 rounded-xl w-full max-w-3xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{campaign ? 'Editar Campaña' : 'Nueva Campaña'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-1">Nombre de Campaña</label>
            <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Estado</label>
            <select value={form.status || ''} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-gray-700 rounded-lg p-3">
              <option value="active">Activa</option>
              <option value="paused">Pausada</option>
              <option value="completed">Completada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Canal</label>
            <select value={form.channel || ''} onChange={e => setForm({...form, channel: e.target.value})} className="w-full bg-gray-700 rounded-lg p-3">
              <option value="Facebook">Facebook</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
              <option value="TV">TV</option>
              <option value="Radio">Radio</option>
              <option value="Espectaculares">Espectaculares</option>
              <option value="Referidos">Referidos</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Presupuesto</label>
            <input type="number" value={form.budget || ''} onChange={e => setForm({...form, budget: parseFloat(e.target.value)})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Gastado</label>
            <input type="number" value={form.spent || ''} onChange={e => setForm({...form, spent: parseFloat(e.target.value)})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Impresiones</label>
            <input type="number" value={form.impressions || ''} onChange={e => setForm({...form, impressions: parseInt(e.target.value)})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Clicks</label>
            <input type="number" value={form.clicks || ''} onChange={e => setForm({...form, clicks: parseInt(e.target.value)})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Leads Generados</label>
            <input type="number" value={form.leads_generated || ''} onChange={e => setForm({...form, leads_generated: parseInt(e.target.value)})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Ventas Cerradas</label>
            <input type="number" value={form.sales_closed || ''} onChange={e => setForm({...form, sales_closed: parseInt(e.target.value)})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Revenue Generado</label>
            <input type="number" value={form.revenue_generated || ''} onChange={e => setForm({...form, revenue_generated: parseFloat(e.target.value)})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Fecha Inicio</label>
            <input type="date" value={form.start_date || ''} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Fecha Fin</label>
            <input type="date" value={form.end_date || ''} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div className="col-span-3">
            <label className="block text-sm text-gray-400 mb-1">Audiencia Target</label>
            <input value={form.target_audience || ''} onChange={e => setForm({...form, target_audience: e.target.value})} className="w-full bg-gray-700 rounded-lg p-3" />
          </div>
          <div className="col-span-3">
            <label className="block text-sm text-gray-400 mb-1">Notas</label>
            <textarea value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-gray-700 rounded-lg p-3" rows={2} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-gray-700 rounded-lg">
          <div>
            <p className="text-gray-400 text-sm">CTR</p>
            <p className="text-xl font-bold">{ctr.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">CPL</p>
            <p className="text-xl font-bold">${cpl.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">ROI</p>
            <p className={`text-xl font-bold ${roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>{roi.toFixed(0)}%</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600">Cancelar</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Save size={20} /> Guardar
          </button>
        </div>
      </div>
    </div>


  )
}

export default App
