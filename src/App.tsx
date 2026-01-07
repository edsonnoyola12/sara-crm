import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { Users, Calendar as CalendarIcon, Calendar, Settings, TrendingUp, Phone, DollarSign, Target, Award, Building, UserCheck, Flame, X, Save, Plus, Edit, Trash2, CreditCard, AlertTriangle, Clock, CheckCircle, XCircle, ArrowRight, Megaphone, BarChart3, Eye, MousePointer, Lightbulb, TrendingDown, AlertCircle, Copy, Upload, Download, Link, Facebook, Pause, Play, Send, MapPin, Tag } from 'lucide-react'

type View = 'dashboard' | 'leads' | 'properties' | 'team' | 'calendar' | 'mortgage' | 'marketing' | 'referrals' | 'goals' | 'config' | 'followups' | 'promotions' | 'events'

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
  fallen_reason?: string
  notes?: any
  credit_status?: string
  status_changed_at?: string
  template_sent?: string
  template_sent_at?: string
  sara_activated?: boolean
  sara_activated_at?: string
}

interface Property {
  id: string
  name: string
  category: string
  price: number
  bedrooms: number
  bathrooms: number
  area_m2: number
  total_units: number
  sold_units: number
  photo_url: string
  description: string
  neighborhood: string
  city: string
  development: string
  ideal_client: string
  sales_phrase: string
  youtube_link: string
  matterport_link: string
  gps_link: string
  brochure_urls: string
  gallery_urls: string
  address: string
  floors: number
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
  // Campos de disponibilidad
  vacation_start?: string
  vacation_end?: string
  is_on_duty?: boolean
  work_start?: string  // "09:00"
  work_end?: string    // "18:00"
  working_days?: number[]  // [1,2,3,4,5] = Lun-Vie
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

interface AlertSetting {
  id: string
  category: string
  stage: string
  max_days: number
}

interface LeadActivity {
  id: string
  lead_id: string
  team_member_id: string
  activity_type: string
  notes: string
  created_at: string
  team_member_name?: string
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

interface Appointment {
  id: string
  lead_id: string
  lead_phone: string
  lead_name?: string
  property_id: string
  property_name: string
  vendedor_id?: string
  vendedor_name?: string
  asesor_id?: string
  asesor_name?: string
  scheduled_date: string
  scheduled_time: string
  status: 'scheduled' | 'cancelled' | 'completed'
  appointment_type: string
  duration_minutes: number
  google_event_vendedor_id?: string
  google_event_asesor_id?: string
  cancelled_by?: string
  created_at: string
  updated_at: string
  mode?: string
  notificar?: boolean
  confirmation_sent?: boolean
  confirmation_sent_at?: string
  client_responded?: boolean
  client_responded_at?: string
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

interface Promotion {
  id: string
  name: string
  description?: string
  start_date: string
  end_date: string
  message: string
  image_url?: string
  target_segment: string
  reminder_enabled: boolean
  reminder_frequency: string
  last_reminder_sent?: string
  reminders_sent_count: number
  total_reached: number
  total_responses: number
  status: string
  created_by?: string
  created_at: string
  updated_at?: string
}

interface CRMEvent {
  id: string
  name: string
  description?: string
  event_type: string
  event_date: string
  event_time?: string
  location?: string
  location_url?: string
  max_capacity?: number
  registered_count: number
  image_url?: string
  pdf_url?: string
  status: string
  created_at: string
  created_by?: string
}

interface EventRegistration {
  id: string
  event_id: string
  lead_id: string
  status: string
  registered_at: string
  lead_name?: string
  lead_phone?: string
}

function App() {
  const [view, setView] = useState<View>('dashboard')
  const [leads, setLeads] = useState<Lead[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [mortgages, setMortgages] = useState<MortgageApplication[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [alertSettings, setAlertSettings] = useState<AlertSetting[]>([])
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null)
  const [loginPhone, setLoginPhone] = useState('')
  const [loginError, setLoginError] = useState('')
  const [showAllData, setShowAllData] = useState(false)
  const [leadViewMode, setLeadViewMode] = useState<'list' | 'funnel'>('list')
  const [showNewLead, setShowNewLead] = useState(false)
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [statusChange, setStatusChange] = useState<{lead: Lead, newStatus: string} | null>(null)
  const [statusNote, setStatusNote] = useState("")
  const [newLead, setNewLead] = useState({ name: '', phone: '', property_interest: '', budget: '', status: 'new' })
  const [reminderConfigs, setReminderConfigs] = useState<ReminderConfig[]>([])
  const [editingReminder, setEditingReminder] = useState<ReminderConfig | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [leadActivities, setLeadActivities] = useState<LeadActivity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<Insight[]>([])
  
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [editingMortgage, setEditingMortgage] = useState<MortgageApplication | null>(null)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [showNewProperty, setShowNewProperty] = useState(false)
  const [showNewMember, setShowNewMember] = useState(false)
  const [showNewMortgage, setShowNewMortgage] = useState(false)
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])
  const [referrals, setReferrals] = useState<any[]>([])
  const [monthlyGoals, setMonthlyGoals] = useState<{month: string, company_goal: number}>({ month: "", company_goal: 0 })
  const [vendorGoals, setVendorGoals] = useState<{vendor_id: string, goal: number, name: string}[]>([])
  const [selectedGoalMonth, setSelectedGoalMonth] = useState(new Date().toISOString().slice(0, 7))
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [showNewAppointment, setShowNewAppointment] = useState(false)
  const [newAppointment, setNewAppointment] = useState<any>({})
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [showNewEvent, setShowNewEvent] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Promociones y Eventos
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [crmEvents, setCrmEvents] = useState<CRMEvent[]>([])
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([])
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [editingCrmEvent, setEditingCrmEvent] = useState<CRMEvent | null>(null)
  const [showNewPromotion, setShowNewPromotion] = useState(false)
  const [showNewCrmEvent, setShowNewCrmEvent] = useState(false)

  useEffect(() => {
    loadData()
    // Auto-refresh cada 30 segundos sin recargar página
    const interval = setInterval(() => {
      loadDataSilent()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Carga silenciosa (sin loading spinner)
  async function loadDataSilent() {
    const [leadsRes, propsRes, teamRes, mortgagesRes, campaignsRes, appointmentsRes] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('properties').select('*'),
      supabase.from('team_members').select('*'),
      supabase.from('mortgage_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('appointments').select('*').order('scheduled_date', { ascending: true })
    ])
    setLeads(leadsRes.data || [])
    setProperties(propsRes.data || [])
    setTeam(teamRes.data || [])
    setMortgages(mortgagesRes.data || [])
    setCampaigns(campaignsRes.data || [])
    setAppointments(appointmentsRes.data || [])
    setLastRefresh(new Date())
    generateInsights(leadsRes.data || [], teamRes.data || [], campaignsRes.data || [])
  }

  async function loadData() {
    setLoading(true)
    const [leadsRes, propsRes, teamRes, mortgagesRes, campaignsRes, remindersRes, appointmentsRes, alertRes, promosRes, eventsRes] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('properties').select('*'),
      supabase.from('team_members').select('*'),
      supabase.from('mortgage_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('reminder_config').select('*').order('lead_category'),
      supabase.from('appointments').select('*').order('scheduled_date', { ascending: true }),
      supabase.from('alert_settings').select('*').order('category').order('stage'),
      supabase.from('promotions').select('*').order('start_date', { ascending: false }),
      supabase.from('events').select('*').order('event_date', { ascending: true })
    ])
    setLeads(leadsRes.data || [])
    setProperties(propsRes.data || [])
    setTeam(teamRes.data || [])
    setMortgages(mortgagesRes.data || [])
    setCampaigns(campaignsRes.data || [])
    setAlertSettings(alertRes.data || [])
    setReminderConfigs(remindersRes.data || [])
    setAppointments(appointmentsRes.data || [])
    setPromotions(promosRes.data || [])
    setCrmEvents(eventsRes.data || [])
    console.log('🔍 Reminders cargados:', remindersRes.data)

    generateInsights(leadsRes.data || [], teamRes.data || [], campaignsRes.data || [])

    setLoading(false)
    loadCalendarEvents()
  }

  // Cargar actividades del lead seleccionado
  async function loadLeadActivities(leadId: string) {
    setLoadingActivities(true)
    const { data, error } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
    
    if (data) {
      // Agregar nombre del team member
      const activitiesWithNames = data.map(activity => {
        const member = team.find(t => t.id === activity.team_member_id)
        return { ...activity, team_member_name: member?.name || 'Desconocido' }
      })
      setLeadActivities(activitiesWithNames)
    } else {
      setLeadActivities([])
    }
    setLoadingActivities(false)
  }

  // Función para seleccionar lead y cargar sus actividades
  async function selectLead(lead: Lead) {
    setSelectedLead(lead)
    loadLeadActivities(lead.id)
  }

  
  // Extraer thumbnail de YouTube
  const getYoutubeThumbnail = (url: string) => {
    if (!url) return null
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([^&?]+)/)
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null
  }

  // ============ METAS MENSUALES ============
  const loadMonthlyGoals = async (month: string) => {
    const { data: companyGoal } = await supabase
      .from('monthly_goals')
      .select('*')
      .eq('month', month)
      .single()
    
    if (companyGoal) {
      setMonthlyGoals({ month: companyGoal.month, company_goal: companyGoal.company_goal })
    } else {
      setMonthlyGoals({ month, company_goal: 0 })
    }
    
    const { data: vendorGoalsData } = await supabase
      .from('vendor_monthly_goals')
      .select('*')
      .eq('month', month)
    
    const activeVendors = team.filter(t => t.role === 'vendedor' && t.active)
    const goals = activeVendors.map(v => {
      const existing = vendorGoalsData?.find((vg: any) => vg.vendor_id === v.id)
      return { vendor_id: v.id, goal: existing?.goal || 0, name: v.name }
    })
    setVendorGoals(goals)
  }
  
  const saveCompanyGoal = async (goal: number) => {
    await supabase.from('monthly_goals').upsert({ 
      month: selectedGoalMonth, 
      company_goal: goal 
    }, { onConflict: 'month' })
    setMonthlyGoals({ month: selectedGoalMonth, company_goal: goal })
  }
  
  const saveVendorGoal = async (vendorId: string, goal: number) => {
    await supabase.from('vendor_monthly_goals').upsert({
      month: selectedGoalMonth,
      vendor_id: vendorId,
      goal: goal
    }, { onConflict: 'month,vendor_id' })
  }
  
  const getClosedByVendor = (vendorId: string) => {
    return leads.filter(l => 
      l.assigned_to === vendorId && 
      (l.status === 'closed' || l.status === 'Cerrado')
    ).length
  }
  
  const getReservedByVendor = (vendorId: string) => {
    return leads.filter(l => 
      l.assigned_to === vendorId && 
      (l.status === 'reserved' || l.status === 'Reservado')
    ).length
  }
  
  const getNegotiationByVendor = (vendorId: string) => {
    return leads.filter(l => 
      l.assigned_to === vendorId && 
      (l.status === 'negotiation' || l.status === 'Negociacion')
    ).length
  }

  useEffect(() => {
    if (team.length > 0) loadMonthlyGoals(selectedGoalMonth)
  }, [selectedGoalMonth, team.length])


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


    // ============ INSIGHTS DE METAS ============
    const today = new Date()
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    const dayOfMonth = today.getDate()
    const daysRemaining = daysInMonth - dayOfMonth
    
    const closedThisMonth = leads.filter(l => 
      (l.status === 'closed' || l.status === 'Cerrado') &&
      new Date(l.updated_at || l.created_at).getMonth() === today.getMonth()
    ).length
    
    const currentMonthGoal = monthlyGoals.company_goal || 0
    if (currentMonthGoal > 0) {
      const percentComplete = Math.round((closedThisMonth / currentMonthGoal) * 100)
      const expectedPercent = Math.round((dayOfMonth / daysInMonth) * 100)
      
      if (percentComplete < expectedPercent - 10) {
        newInsights.push({
          type: 'warning',
          title: `Meta en riesgo: ${percentComplete}% completado`,
          description: `Faltan ${daysRemaining} días y deberían ir al ${expectedPercent}%. Necesitan cerrar ${currentMonthGoal - closedThisMonth} más.`,
          action: 'Ver metas',
          icon: Target
        })
      }
    }
    
    // Reservados estancados (+7 días)
    const stuckReserved = leads.filter(l => {
      if (l.status === 'reserved' || l.status === 'Reservado') {
        const updatedAt = new Date(l.updated_at || l.created_at)
        const daysSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)
        return daysSinceUpdate > 7
      }
      return false
    })
    
    if (stuckReserved.length > 0) {
      newInsights.push({
        type: 'warning',
        title: `${stuckReserved.length} reservados estancados`,
        description: 'Llevan más de 7 días sin avance en crédito. Revisar con asesores hipotecarios.',
        action: 'Ver leads',
        icon: Clock
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

  async function saveLead(lead: Partial<Lead>) {
    if (lead.id) {
      await supabase.from('leads').update({
        name: lead.name,
        phone: lead.phone,
        property_interest: lead.property_interest,
        budget: lead.budget,
        score: lead.score,
        status: lead.status,
        source: lead.source,
        assigned_to: lead.assigned_to,
        credit_status: lead.credit_status
      }).eq('id', lead.id)
    }
    loadData()
    setEditingLead(null)
    setSelectedLead(null)
  }

  async function saveMember(member: Partial<TeamMember>) {
    try {
      const API_URL = 'https://sara-backend.edson-633.workers.dev/api/team-members'
      
      if (member.id) {
        // Editar existente
        await fetch(`${API_URL}/${member.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(member)
        })
      } else {
        // Crear nuevo
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(member)
        })
      }
      
      loadData()
      setEditingMember(null)
      setShowNewMember(false)
    } catch (error) {
      console.error('Error guardando miembro:', error)
      alert('Error al guardar. Revisa la consola.')
    }
  }

  async function deleteMember(id: string) {
    if (!confirm('¿Eliminar este miembro del equipo?')) return
    
    try {
      await fetch(`https://sara-backend.edson-633.workers.dev/api/team-members/${id}`, {
        method: 'DELETE'
      })
      loadData()
    } catch (error) {
      console.error('Error eliminando miembro:', error)
      alert('Error al eliminar. Revisa la consola.')
    }
  }

  async function saveMortgage(mortgage: Partial<MortgageApplication>) {
    const now = new Date().toISOString()
    if (mortgage.id) {
      const current = mortgages.find(m => m.id === mortgage.id)
      const statusChanged = current && current.status !== mortgage.status
      if (statusChanged) {
        if (mortgage.status === 'in_review') mortgage.in_review_at = now
        if (mortgage.status === 'sent_to_bank') mortgage.sent_to_bank_at = now
        if (mortgage.status === 'approved' || mortgage.status === 'rejected') mortgage.decision_at = now
      }
      // Incluir info del usuario que hace el cambio para notificar al vendedor
      const payload: any = { ...mortgage }
      if (statusChanged && currentUser) {
        payload.changed_by_id = currentUser.id
        payload.changed_by_name = currentUser.name
        payload.previous_status = current?.status
      }
      await fetch(`https://sara-backend.edson-633.workers.dev/api/mortgage_applications/${mortgage.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      mortgage.pending_at = now
      if (currentUser?.role === 'asesor') {
        mortgage.assigned_advisor_id = currentUser.id
        mortgage.assigned_advisor_name = currentUser.name
      }
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
    
    await fetch(`https://sara-backend.edson-633.workers.dev/api/mortgage_applications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
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

  // CRUD Promociones
  async function savePromotion(promo: Partial<Promotion>) {
    if (promo.id) {
      await supabase.from('promotions').update(promo).eq('id', promo.id)
    } else {
      await supabase.from('promotions').insert([promo])
    }
    loadData()
    setEditingPromotion(null)
    setShowNewPromotion(false)
  }

  async function deletePromotion(id: string) {
    if (confirm('¿Eliminar esta promoción?')) {
      await supabase.from('promotions').delete().eq('id', id)
      loadData()
    }
  }

  async function togglePromoStatus(promo: Promotion) {
    const newStatus = promo.status === 'active' ? 'paused' : 'active'
    await supabase.from('promotions').update({ status: newStatus }).eq('id', promo.id)
    loadData()
  }

  // CRUD Eventos
  async function saveCrmEvent(event: Partial<CRMEvent>) {
    if (event.id) {
      await supabase.from('events').update(event).eq('id', event.id)
    } else {
      await supabase.from('events').insert([event])
    }
    loadData()
    setEditingCrmEvent(null)
    setShowNewCrmEvent(false)
  }

  async function deleteCrmEvent(id: string) {
    if (confirm('¿Eliminar este evento?')) {
      await supabase.from('events').delete().eq('id', id)
      loadData()
    }
  }

  // Enviar mensaje a segmento desde promoción
  async function sendPromoToSegment(promo: Promotion) {
    if (!confirm(`¿Enviar promoción "${promo.name}" a segmento ${promo.target_segment}?`)) return

    // Obtener leads del segmento
    let query = supabase.from('leads').select('id, name, phone, lead_score, score, status, property_interest')

    const { data: leadsData } = await query
    if (!leadsData) return

    let segmentLeads = leadsData.filter((l: any) => l.phone)
    const seg = promo.target_segment

    if (seg === 'hot') {
      segmentLeads = segmentLeads.filter((l: any) => (l.lead_score || l.score || 0) >= 70)
    } else if (seg === 'warm') {
      segmentLeads = segmentLeads.filter((l: any) => (l.lead_score || l.score || 0) >= 40 && (l.lead_score || l.score || 0) < 70)
    } else if (seg === 'cold') {
      segmentLeads = segmentLeads.filter((l: any) => (l.lead_score || l.score || 0) < 40)
    } else if (seg === 'compradores') {
      segmentLeads = segmentLeads.filter((l: any) => ['closed_won', 'delivered'].includes(l.status))
    }

    alert(`Se enviaría a ${segmentLeads.length} leads del segmento ${seg}.\n\n(El envío real se hace desde WhatsApp con el comando:\nenviar a ${seg}: ${promo.message})`)
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
  const availableUnits = properties.reduce((acc, p) => acc + ((p.total_units || 0) - (p.sold_units || 0) - 0), 0)
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

  // 7. Proyección de cierre (basado en pipeline actual)
  const closingProjection = (() => {
    const weights: Record<string, number> = {
      'new': 0.05, 'contacted': 0.10, 'scheduled': 0.20, 'visited': 0.40,
      'negotiation': 0.60, 'reserved': 0.85, 'closed': 1.0
    }
    const avgTicket = 2000000 // Precio promedio propiedad
    const projectedDeals = leads.reduce((sum, l) => sum + (weights[l.status] || 0), 0)
    return {
      deals: Math.round(projectedDeals),
      revenue: Math.round(projectedDeals * avgTicket)
    }
  })()

  // 8. Valor del pipeline ($)
  const pipelineValue = (() => {
    const avgTicket = 2000000
    const stageValues: Record<string, number> = {
      'negotiation': avgTicket * 0.6,
      'reserved': avgTicket * 0.85,
      'visited': avgTicket * 0.4
    }
    return leads.reduce((sum, l) => sum + (stageValues[l.status] || 0), 0)
  })()

  // ============ KPIs DE CONVERSIÓN INMOBILIARIA ============
  
  // 9. Tasa de Conversión General (Lead to Sale) - Meta: 1-3%
  const conversionLeadToSale = (() => {
    const totalLeads = leads.length
    const totalSales = leads.filter(l => l.status === 'closed' || l.status === 'delivered').length
    return totalLeads > 0 ? ((totalSales / totalLeads) * 100).toFixed(1) : '0'
  })()

  // 10. Tasa de Conversión Lead-a-Cita - Meta: 15-25%
  const conversionLeadToCita = (() => {
    const totalLeads = leads.length
    const citasRealizadas = leads.filter(l => ['scheduled', 'visited', 'negotiation', 'reserved', 'closed', 'delivered'].includes(l.status)).length
    return totalLeads > 0 ? ((citasRealizadas / totalLeads) * 100).toFixed(1) : '0'
  })()

  // 11. Tasa de Cierre de Citas (Appointment to Close) - Meta: 10-20%
  const conversionCitaToClose = (() => {
    const citasRealizadas = leads.filter(l => ['visited', 'negotiation', 'reserved', 'closed', 'delivered'].includes(l.status)).length
    const ventas = leads.filter(l => l.status === 'closed' || l.status === 'delivered').length
    return citasRealizadas > 0 ? ((ventas / citasRealizadas) * 100).toFixed(1) : '0'
  })()

  // 12. Ratio de Leads por Venta - Meta: 50:1
  const ratioLeadsPorVenta = (() => {
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
    'TikTok': 'bg-slate-800/50 backdrop-blur-sm border border-slate-700/50',
    'TV': 'bg-purple-600',
    'Radio': 'bg-yellow-600',
    'Espectaculares': 'bg-green-600',
    'Referidos': 'bg-cyan-500'
  }

  if (loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Cargando...</div>

  // Función de login
  const handleLogin = async () => {
    const cleanPhone = loginPhone.replace(/\D/g, '').slice(-10)
    if (cleanPhone.length !== 10) {
      setLoginError('Ingresa un número de 10 dígitos')
      return
    }
    
    const user = team.find((m: TeamMember) => {
      const memberPhone = m.phone?.replace(/\D/g, '').slice(-10)
      return memberPhone === cleanPhone
    })
    
    if (user) {
      setCurrentUser(user)
      setLoginError('')
      localStorage.setItem('sara_user_phone', cleanPhone)
    } else {
      setLoginError('Número no registrado en el equipo')
    }
  }

  // Filtrar leads por usuario
  const filteredLeads = currentUser && currentUser.role !== 'admin'
    ? leads.filter(l => l.assigned_to === currentUser.id)
    : leads

  // Filtrar solicitudes hipotecarias
  const filteredMortgages = currentUser && currentUser.role !== 'admin'
    ? mortgages.filter(m => 
        currentUser.role === 'asesor' 
          ? m.assigned_advisor_id === currentUser.id
          : leads.some(l => l.id === m.lead_id && l.assigned_to === currentUser.id)
      )
    : mortgages

  // Pantalla de login
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-96">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">SARA CRM</h1>
            <p className="text-slate-400 mt-2">Real Estate AI</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Tu número de WhatsApp</label>
              <input type="tel" value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} placeholder="5610016226" className="w-full p-3 bg-slate-700 rounded-xl border border-slate-600 focus:border-cyan-500 focus:outline-none" onKeyPress={(e) => e.key === 'Enter' && handleLogin()} />
            </div>
            {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
            <button onClick={handleLogin} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold hover:opacity-90 transition">Entrar</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <div className="w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">S</div><h1 className="text-2xl font-bold">SARA</h1></div>
        <p className="text-slate-400 text-sm mb-4">Real Estate AI</p>
        
        {currentUser && (
          <div className="bg-slate-800 rounded-xl p-3 mb-4">
            <p className="text-sm text-slate-400">Conectado como:</p>
            <p className="font-semibold">{currentUser.name}</p>
            <p className="text-xs text-slate-500">{currentUser.role}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => { setCurrentUser(null); localStorage.removeItem('sara_user_phone') }} className="text-xs px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30">
                Salir
              </button>
            </div>
          </div>
        )}
        
        <nav className="flex-1 space-y-2">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${view === 'dashboard' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}>
            <TrendingUp size={20} /> Dashboard
          </button>
          <button onClick={() => setView('leads')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${view === 'leads' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}>
            <Users size={20} /> Leads
          </button>
          <button onClick={() => setView('properties')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${view === 'properties' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}>
            <Building size={20} /> Propiedades
          </button>
          <button onClick={() => setView('team')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${view === 'team' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}>
            <UserCheck size={20} /> Equipo
          </button>
          <button onClick={() => setView('mortgage')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${view === 'mortgage' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}>
            <CreditCard size={20} /> Hipotecas
            {mortgages.filter(m => getDaysInStatus(m) > 3 && !['approved', 'rejected', 'cancelled'].includes(m.status)).length > 0 && (
              <span className="bg-red-500 text-xs px-2 py-1 rounded-full">
                {mortgages.filter(m => getDaysInStatus(m) > 3 && !['approved', 'rejected', 'cancelled'].includes(m.status)).length}
              </span>
            )}
          </button>
          <button onClick={() => setView('marketing')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${view === 'marketing' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}>
            <Megaphone size={20} /> Marketing
          </button>
          <button onClick={() => setView('promotions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${view === 'promotions' ? 'bg-purple-600' : 'hover:bg-slate-700'}`}>
            <Target size={20} /> Promociones
            {promotions.filter(p => p.status === 'active').length > 0 && (
              <span className="bg-purple-500 text-xs px-2 py-1 rounded-full ml-auto">
                {promotions.filter(p => p.status === 'active').length}
              </span>
            )}
          </button>
          <button onClick={() => setView('events')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${view === 'events' ? 'bg-emerald-600' : 'hover:bg-slate-700'}`}>
            <CalendarIcon size={20} /> Eventos
            {crmEvents.filter(e => e.status === 'upcoming').length > 0 && (
              <span className="bg-emerald-500 text-xs px-2 py-1 rounded-full ml-auto">
                {crmEvents.filter(e => e.status === 'upcoming').length}
              </span>
            )}
          </button>
          <button onClick={() => setView('calendar')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${view === 'calendar' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}>
            <CalendarIcon size={20} /> Calendario
          </button>
          {(!currentUser || currentUser.role === 'admin') && (
            <button onClick={() => setView('goals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${view === 'goals' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}>
              <Target size={20} /> Metas
            </button>
          )}
          <button onClick={() => setView('followups')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${view === 'followups' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}>
            <Clock size={20} /> Follow-ups
          </button>
          <button onClick={() => setView('config')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${view === 'config' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}>
            <Settings size={20} /> Configuración
          </button>
        </nav>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        {view === 'dashboard' && (
          <div className="space-y-4">
            {/* HEADER - Hora y última actualización */}
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Dashboard Ejecutivo
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-sm text-slate-400">
                  Actualizado: {new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'})}
                </div>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-3 py-1 bg-slate-700 rounded-lg text-sm hover:bg-slate-600 flex items-center gap-2"
                >
                  🔄 Refrescar
                </button>
              </div>
            </div>

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

            {/* GAUGE DE SALUD DEL FUNNEL - Visual rápido */}
            <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-xl">
              <div className="flex items-center gap-8">
                {/* Donut Chart */}
                <div className="relative w-40 h-40 flex-shrink-0">
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
                <div className="flex-1 grid grid-cols-4 gap-3">
                  {[
                    { label: 'CERRADOS', color: 'bg-green-500', emoji: '✅', count: filteredLeads.filter(l => l.status === 'closed' || l.status === 'delivered').length, desc: 'Meta lograda' },
                    { label: 'HOT', color: 'bg-red-500', emoji: '🔥', count: filteredLeads.filter(l => ['negotiation', 'reserved'].includes(l.status)).length, desc: 'Por cerrar' },
                    { label: 'WARM', color: 'bg-orange-500', emoji: '🌡️', count: filteredLeads.filter(l => ['scheduled', 'visited'].includes(l.status)).length, desc: 'En proceso' },
                    { label: 'COLD', color: 'bg-blue-500', emoji: '❄️', count: filteredLeads.filter(l => ['new', 'contacted'].includes(l.status)).length, desc: 'Sin avance' },
                  ].map((item, i) => (
                    <div key={i} className="text-center p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                        <span className="text-xs text-slate-400">{item.label}</span>
                      </div>
                      <p className="text-2xl font-bold">{item.emoji} {item.count}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Interpretación rápida */}
                <div className="w-64 p-4 bg-slate-700/30 rounded-lg">
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
            <div className="grid grid-cols-5 gap-4">
              {/* Pipeline Value */}
              <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 border border-cyan-500/30 p-5 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 text-6xl opacity-10">💰</div>
                <p className="text-cyan-400 text-sm font-medium">PIPELINE</p>
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
                  <span className="text-xs text-slate-500">vs mes anterior</span>
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
                    { key: 'new', label: 'Nuevos', color: 'from-slate-500 to-slate-600', emoji: '🏆•' },
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
                          <div className="w-16 text-right text-xs text-slate-500">
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
            <div className="grid grid-cols-3 gap-4">
              
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
                  {vendedoresRanking.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Sin vendedores</p>}
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
                  {cplBySource.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Sin campañas</p>}
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
                <div className="grid grid-cols-3 gap-4">
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
                      <p className="text-xs text-slate-500">Meta: {conv.target}%</p>
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
              <div className="grid grid-cols-5 gap-4">
                {/* Lead to Sale */}
                <div className="bg-slate-800/50 p-4 rounded-lg text-center">
                  <p className="text-xs text-slate-400 mb-1">Lead ↑ Venta</p>
                  <p className={`text-2xl font-bold ${parseFloat(conversionLeadToSale) >= 1 ? 'text-green-400' : parseFloat(conversionLeadToSale) >= 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {conversionLeadToSale}%
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Meta: 1-3%</p>
                  <div className="w-full bg-slate-700 h-1 rounded mt-2">
                    <div className={`h-1 rounded ${parseFloat(conversionLeadToSale) >= 1 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{width: `${Math.min(parseFloat(conversionLeadToSale) * 33, 100)}%`}}></div>
                  </div>
                </div>
                
                {/* Lead to Cita */}
                <div className="bg-slate-800/50 p-4 rounded-lg text-center">
                  <p className="text-xs text-slate-400 mb-1">Lead ↑ Cita</p>
                  <p className={`text-2xl font-bold ${parseFloat(conversionLeadToCita) >= 15 ? 'text-green-400' : parseFloat(conversionLeadToCita) >= 10 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {conversionLeadToCita}%
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Meta: 15-25%</p>
                  <div className="w-full bg-slate-700 h-1 rounded mt-2">
                    <div className={`h-1 rounded ${parseFloat(conversionLeadToCita) >= 15 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{width: `${Math.min(parseFloat(conversionLeadToCita) * 4, 100)}%`}}></div>
                  </div>
                </div>
                
                {/* Cita to Close */}
                <div className="bg-slate-800/50 p-4 rounded-lg text-center">
                  <p className="text-xs text-slate-400 mb-1">Visita ↑ Cierre</p>
                  <p className={`text-2xl font-bold ${parseFloat(conversionCitaToClose) >= 10 ? 'text-green-400' : parseFloat(conversionCitaToClose) >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {conversionCitaToClose}%
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Meta: 10-20%</p>
                  <div className="w-full bg-slate-700 h-1 rounded mt-2">
                    <div className={`h-1 rounded ${parseFloat(conversionCitaToClose) >= 10 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{width: `${Math.min(parseFloat(conversionCitaToClose) * 5, 100)}%`}}></div>
                  </div>
                </div>
                
                {/* Ratio Leads/Venta */}
                <div className="bg-slate-800/50 p-4 rounded-lg text-center">
                  <p className="text-xs text-slate-400 mb-1">Leads por Venta</p>
                  <p className={`text-2xl font-bold ${ratioLeadsPorVenta <= 50 ? 'text-green-400' : ratioLeadsPorVenta <= 100 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {ratioLeadsPorVenta}:1
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Meta: 50:1</p>
                  <div className="w-full bg-slate-700 h-1 rounded mt-2">
                    <div className={`h-1 rounded ${ratioLeadsPorVenta <= 50 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{width: `${Math.max(100 - ratioLeadsPorVenta, 10)}%`}}></div>
                  </div>
                </div>
                
                {/* Speed to Lead */}
                <div className="bg-slate-800/50 p-4 rounded-lg text-center">
                  <p className="text-xs text-slate-400 mb-1">Tiempo Respuesta</p>
                  <p className={`text-2xl font-bold ${avgResponseTime <= 5 ? 'text-green-400' : avgResponseTime <= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {avgResponseTime < 60 ? `${avgResponseTime}m` : `${Math.round(avgResponseTime/60)}h`}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Meta: &lt;5 min</p>
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
            <div className="grid grid-cols-3 gap-4">
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

              {/* Card: Más Revenue */}
              <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border border-green-500/30 p-5 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-3xl">💰</span>
                  <div>
                    <p className="text-xs text-green-400">MÁS REVENUE GENERADO</p>
                    <p className="text-xl font-bold">{topDevByRevenue?.name || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-slate-800/50 p-2 rounded">
                    <p className="text-slate-400 text-xs">Revenue</p>
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
                      Considera enfocar marketing en {topDevByRevenue?.name} para maximizar revenue.
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
                      <th className="text-center py-2 px-3">Revenue</th>
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
                  <p className="text-slate-500 text-center py-4">Sin datos de desarrollos. Agrega propiedades con el campo "development".</p>
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
                          {s.source === 'facebook' || s.source === 'Facebook' ? '📘' : 
                           s.source === 'google' || s.source === 'Google' ? '🔍' :
                           s.source === 'instagram' || s.source === 'Instagram' ? '📸' :
                           s.source === 'referido' || s.source === 'Referido' ? '🤝' :
                           s.source === 'tiktok' || s.source === 'TikTok' ? '🎵' : '📣'}
                          {s.source}
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
                  <p className="text-slate-500 text-center py-4">Sin datos de fuentes. Asigna el campo "source" a tus leads.</p>
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
                <div className="flex items-center gap-3 text-slate-500 text-xs">
                  <span>🔄 Auto-refresh: {lastRefresh.toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit', second: '2-digit'})}</span>
                  <button onClick={() => loadDataSilent()} className="px-2 py-1 bg-slate-700 rounded hover:bg-slate-600">Actualizar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'leads' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Leads ({filteredLeads.length})</h2>
              <div className="flex gap-4 items-center">
                <div className="flex gap-2">
                  <button onClick={() => setLeadViewMode('list')} className={`px-3 py-1 rounded-lg text-sm ${leadViewMode === 'list' ? 'bg-blue-600' : 'bg-slate-700'}`}>Lista</button>
                  <button onClick={() => setLeadViewMode('funnel')} className={`px-3 py-1 rounded-lg text-sm ${leadViewMode === 'funnel' ? 'bg-blue-600' : 'bg-slate-700'}`}>Funnel</button>
                </div>
                <button onClick={() => setShowNewLead(true)} className="bg-green-600 px-4 py-2 rounded-xl hover:bg-green-700 flex items-center gap-2">
                  <Plus size={20} /> Agregar Lead
                </button>
              </div>
              <div className="flex gap-2">
                <span className="bg-red-500 px-3 py-1 rounded-full text-sm">HOT ({hotLeads})</span>
                <span className="bg-orange-500 px-3 py-1 rounded-full text-sm">WARM ({warmLeads})</span>
                <span className="bg-blue-500 px-3 py-1 rounded-full text-sm">COLD ({coldLeads})</span>
              </div>
            </div>

            {leadViewMode === 'funnel' ? (
              <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
                {[
                  { key: 'new', label: 'Nuevo', color: 'bg-slate-600' },
                  { key: 'contacted', label: 'Contactado', color: 'bg-blue-600' },
                  { key: 'scheduled', label: 'Cita', color: 'bg-cyan-600' },
                  { key: 'visited', label: 'Visitó', color: 'bg-purple-600' },
                  { key: 'negotiation', label: 'Negociación', color: 'bg-yellow-600' },
                  { key: 'reserved', label: 'Reservado', color: 'bg-orange-600' },
                  { key: 'closed', label: 'Cerrado', color: 'bg-green-600' },
                  { key: 'delivered', label: 'Entregado', color: 'bg-emerald-500' }
                ].map(stage => {
                  const stageLeads = filteredLeads.filter(l => l.status === stage.key)
                  return (
                    <div 
                      key={stage.key} 
                      className="bg-slate-800/50 rounded-xl p-2 min-h-[200px] border-2 border-dashed border-slate-600"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={async (e) => {
                        e.preventDefault()
                        if (draggedLead && draggedLead.status !== stage.key) {
                          await supabase.from('leads').update({ status: stage.key, status_changed_at: new Date().toISOString() }).eq('id', draggedLead.id)
                          setLeads(leads.map(l => l.id === draggedLead.id ? {...l, status: stage.key} : l))
                        }
                        setDraggedLead(null)
                      }}
                    >
                      <div className="bg-slate-600 text-center py-2 rounded-lg mb-2">
                        <p className="font-semibold text-xs">{stage.label}</p>
                        <p className="text-xl font-bold">{stageLeads.length}</p>
                      </div>
                      <div className="space-y-1 space-y-1">
                        {stageLeads.map(lead => (
                          <div 
                            key={lead.id} 
                            className="bg-slate-700 p-2 rounded hover:bg-slate-600"
                          >
                            <p onClick={() => selectLead(lead)} className="font-semibold text-xs truncate cursor-pointer">{lead.name || 'Sin nombre'}</p>
                            <p className="text-xs text-slate-400">...{lead.phone?.slice(-4)}</p>
                            <select 
                              value={lead.status} 
                              onChange={(e) => {
                                if (e.target.value !== lead.status) {
                                  setStatusChange({lead, newStatus: e.target.value})
                                  setStatusNote('')
                                }
                              }}
                              className="w-full mt-1 p-1 text-xs bg-slate-600 rounded border-none"
                            >
                              <option value="new">Nuevo</option>
                              <option value="contacted">Contactado</option>
                              <option value="scheduled">Cita</option>
                              <option value="visited">Visitó</option>
                              <option value="negotiation">Negociación</option>
                              <option value="reserved">Reservado</option>
                              <option value="closed">Cerrado</option>
                              <option value="delivered">Entregado</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-700">
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
                  {filteredLeads.map(lead => (
                    <tr key={lead.id} onClick={() => selectLead(lead)} className="border-t border-slate-700 hover:bg-slate-700 cursor-pointer">
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
            )}

            {statusChange && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-slate-800 p-6 rounded-2xl w-[400px]">
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

            {showNewLead && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-slate-800 p-6 rounded-2xl w-[500px]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Nuevo Lead</h3>
                    <button onClick={() => setShowNewLead(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Nombre *</label>
                      <input type="text" value={newLead.name} onChange={(e) => setNewLead({...newLead, name: e.target.value})} className="w-full p-3 bg-slate-700 rounded-xl" placeholder="Juan Pérez" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Teléfono *</label>
                      <input type="tel" value={newLead.phone} onChange={(e) => setNewLead({...newLead, phone: e.target.value})} className="w-full p-3 bg-slate-700 rounded-xl" placeholder="5512345678" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Interés</label>
                      <input type="text" value={newLead.property_interest} onChange={(e) => setNewLead({...newLead, property_interest: e.target.value})} className="w-full p-3 bg-slate-700 rounded-xl" placeholder="Casa 3 recámaras" />
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
                        <option value="visited">Visitó</option>
                        <option value="negotiation">Negociación</option>
                      </select>
                    </div>
                    <button onClick={async () => {
                      if (!newLead.name || !newLead.phone) { alert('Nombre y teléfono requeridos'); return }
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
                      if (error) { alert('Error: ' + error.message); return }
                      setShowNewLead(false)
                      setNewLead({ name: '', phone: '', property_interest: '', budget: '', status: 'new' })
                      const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
                      if (data) setLeads(data)
                    }} className="w-full py-3 bg-green-600 rounded-xl font-semibold hover:bg-green-700">
                      Guardar Lead
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'properties' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Propiedades ({properties.length})</h2>
              <button onClick={() => setShowNewProperty(true)} className="bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2">
                <Plus size={20} /> Agregar Propiedad
              </button>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {properties.map(prop => (
                <div key={prop.id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden group relative">
                  <div className="h-40 bg-slate-700 flex items-center justify-center">
                    {prop.photo_url ? (
                      <img src={prop.photo_url} alt={prop.name} className="w-full h-full object-cover" />
                    ) : prop.youtube_link ? (
                      <img src={getYoutubeThumbnail(prop.youtube_link) || ''} alt={prop.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building size={48} className="text-slate-500" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1">{prop.name}</h3>
                    <p className="text-xs text-slate-400 mb-2">{prop.development || ''} - {prop.city || ''}</p>
                    <p className="text-2xl font-bold text-green-400 bg-green-500/20 p-2 rounded-xl mb-2">${(prop.price || 0).toLocaleString()}</p>
                    <p className="text-slate-400 text-sm mb-2">{prop.bedrooms || 0} rec | {prop.bathrooms || 0} baños | {prop.area_m2 || 0}m²</p>
                    <p className="text-cyan-400 text-xs mb-3 line-clamp-2">{prop.sales_phrase || prop.description || ''}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {prop.youtube_link && (
                        <a href={prop.youtube_link} target="_blank" rel="noreferrer" className="bg-red-600/20 text-red-400 px-2 py-1 rounded text-xs hover:bg-red-600/40">▶ Video</a>
                      )}
                      {prop.matterport_link && (
                        <a href={prop.matterport_link} target="_blank" rel="noreferrer" className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded text-xs hover:bg-purple-600/40">🏠 3D</a>
                      )}
                      {prop.gps_link && (
                        <a href={prop.gps_link} target="_blank" rel="noreferrer" className="bg-green-600/20 text-green-400 px-2 py-1 rounded text-xs hover:bg-green-600/40">📍 GPS</a>
                      )}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-400 bg-green-500/20 p-2 rounded-xl">{prop.sold_units || 0} vendidas</span>
                      <span className="text-blue-400 bg-blue-500/20 p-2 rounded-xl">{(prop.total_units || 0) - (prop.sold_units || 0)} disponibles</span>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button onClick={() => setEditingProperty(prop)} className="bg-blue-600 p-2 rounded-xl hover:bg-blue-700">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => deleteProperty(prop.id)} className="bg-red-600 p-2 rounded-xl hover:bg-red-700">
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
              <button onClick={() => setShowNewMember(true)} className="bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2">
                <Plus size={20} /> Agregar Miembro
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
                <h3 className="text-xl font-semibold mb-4">Vendedores</h3>
                <div className="space-y-3">
                  {team.filter(t => t.role === 'vendedor').map(member => (
                    <div key={member.id} className="flex items-center justify-between bg-slate-700 p-4 rounded-xl group">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                          <Users size={24} />
                        </div>
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-slate-400 text-sm">{member.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-green-400 bg-green-500/20 p-2 rounded-xl font-bold">{member.sales_count || 0} ventas</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                          <button onClick={() => setEditingMember(member)} className="bg-blue-600 p-2 rounded-xl hover:bg-blue-700">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => deleteMember(member.id)} className="bg-red-600 p-2 rounded-xl hover:bg-red-700">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {team.filter(t => t.role === 'vendedor').length === 0 && <p className="text-slate-500 text-center py-4">Sin vendedores</p>}
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
                <h3 className="text-xl font-semibold mb-4">Asesores Hipotecarios</h3>
                <div className="space-y-3">
                  {team.filter(t => t.role === 'asesor').map(member => (
                    <div key={member.id} className="flex items-center justify-between bg-slate-700 p-4 rounded-xl group">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                          <Users size={24} />
                        </div>
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-slate-400 text-sm">{member.phone}</p>
                        </div>
                      </div>
                      <button onClick={() => setEditingMember(member)} className="opacity-0 group-hover:opacity-100 bg-blue-600 p-2 rounded-xl">
                        <Edit size={16} />
                      </button>
                    </div>
                  ))}
                  {team.filter(t => t.role === 'asesor').length === 0 && <p className="text-slate-500 text-center py-4">Sin asesores</p>}
                </div>
              </div>


              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
                <h3 className="text-xl font-semibold mb-4">Coordinadoras</h3>
                <div className="space-y-3">
                  {team.filter(t => t.role === "coordinador").map(member => (
                    <div key={member.id} className="flex items-center justify-between bg-slate-700 p-4 rounded-xl group">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                          <Users size={24} />
                        </div>
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-slate-400 text-sm">{member.phone}</p>
                        </div>
                      </div>
                      <button onClick={() => setEditingMember(member)} className="opacity-0 group-hover:opacity-100 bg-blue-600 p-2 rounded-xl">
                        <Edit size={16} />
                      </button>
                    </div>
                  ))}
                  {team.filter(t => t.role === "coordinador").length === 0 && <p className="text-slate-500 text-center py-4">Sin coordinadoras</p>}
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
                <h3 className="text-xl font-semibold mb-4">Marketing / Agencia</h3>
                <div className="space-y-3">
                  {team.filter(t => t.role === 'agencia').map(member => (
                    <div key={member.id} className="flex items-center justify-between bg-slate-700 p-4 rounded-xl group">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                          <Megaphone size={24} />
                        </div>
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-slate-400 text-sm">{member.phone}</p>
                        </div>
                      </div>
                      <button onClick={() => setEditingMember(member)} className="opacity-0 group-hover:opacity-100 bg-blue-600 p-2 rounded-xl">
                        <Edit size={16} />
                      </button>
                    </div>
                  ))}
                  {team.filter(t => t.role === 'agencia').length === 0 && <p className="text-slate-500 text-center py-4">Sin personal de marketing</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'mortgage' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Solicitudes Hipotecarias ({mortgages.length})</h2>
              <button onClick={() => setShowNewMortgage(true)} className="bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2">
                <Plus size={20} /> Nueva Solicitud
              </button>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {mortgageStatuses.map(status => {
                const StatusIcon = status.icon
                const statusMortgages = mortgages.filter(m => m.status === status.key)
                return (
                  <div key={status.key} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4">
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
                          <div key={mortgage.id} onClick={() => setEditingMortgage(mortgage)} className="bg-slate-700 p-3 rounded-xl cursor-pointer hover:bg-gray-600 relative">
                            {daysInStatus > 3 && !['approved', 'rejected'].includes(mortgage.status) && (
                              <AlertTriangle className="absolute top-2 right-2 text-red-400 bg-red-500/20 p-2 rounded-xl" size={16} />
                            )}
                            <p className="font-semibold text-sm">{mortgage.lead_name}</p>
                            <p className="text-xs text-slate-400">{mortgage.property_name}</p>
                            <p className="text-xs text-slate-400 mt-1">${(mortgage.requested_amount || 0).toLocaleString()}</p>
                            <p className="text-xs text-slate-500 mt-1">{daysInStatus}d en {status.label.toLowerCase()}</p>
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
              <button onClick={() => setShowNewCampaign(true)} className="bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2">
                <Plus size={20} /> Nueva Campaña
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
                <p className="text-slate-400 mb-1">Presupuesto Total</p>
                <p className="text-2xl font-bold">${totalBudget.toLocaleString()}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
                <p className="text-slate-400 mb-1">Gastado</p>
                <p className="text-2xl font-bold text-orange-500">${totalSpent.toLocaleString()}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
                <p className="text-slate-400 mb-1">CPL Promedio</p>
                <p className="text-2xl font-bold">${avgCPL.toFixed(0)}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
                <p className="text-slate-400 mb-1">ROI</p>
                <p className={`text-2xl font-bold ${roi >= 0 ? 'text-green-400 bg-green-500/20 p-2 rounded-xl' : 'text-red-400 bg-red-500/20 p-2 rounded-xl'}`}>{roi.toFixed(0)}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
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

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
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

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-700">
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
                      <tr key={campaign.id} className="border-t border-slate-700 hover:bg-slate-700">
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
                          <span className={campaignROI >= 0 ? 'text-green-400 bg-green-500/20 p-2 rounded-xl' : 'text-red-400 bg-red-500/20 p-2 rounded-xl'}>
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

            {/* Tarjetas de Integraciones */}
            <div className="grid grid-cols-2 gap-6 mt-6">
              {/* Tarjeta Conexión Facebook/Instagram Leads */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-600 rounded-xl">
                    <Facebook size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Conexión Facebook/Instagram Leads</h3>
                    <p className="text-slate-400 text-sm">Recibe leads automáticamente desde tus anuncios</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-slate-400 text-sm block mb-1">URL del Webhook</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value="https://sara-backend.edson-633.workers.dev/webhook/facebook-leads"
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm font-mono"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('https://sara-backend.edson-633.workers.dev/webhook/facebook-leads')
                          alert('URL copiada!')
                        }}
                        className="bg-slate-600 hover:bg-slate-500 px-3 py-2 rounded-lg"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-sm block mb-1">Verify Token</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value="sara_fb_leads_token"
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm font-mono"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('sara_fb_leads_token')
                          alert('Token copiado!')
                        }}
                        className="bg-slate-600 hover:bg-slate-500 px-3 py-2 rounded-lg"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-700/50 p-4 rounded-xl text-sm">
                    <p className="font-semibold mb-2">📋 Instrucciones:</p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300">
                      <li>Ve a <a href="https://business.facebook.com/settings" target="_blank" rel="noopener" className="text-blue-400 hover:underline">Meta Business Suite</a> → Integraciones</li>
                      <li>Busca "Webhooks" o ve a tu App en developers.facebook.com</li>
                      <li>Suscribe al objeto <strong>Page</strong> → campo <strong>leadgen</strong></li>
                      <li>Pega la URL y el token de arriba</li>
                    </ol>
                  </div>

                  <div className={`flex items-center gap-2 p-3 rounded-xl ${leads.filter(l => l.source === 'facebook_ads').length > 0 ? 'bg-green-600/20 border border-green-500' : 'bg-slate-700/50'}`}>
                    {leads.filter(l => l.source === 'facebook_ads').length > 0 ? (
                      <>
                        <CheckCircle className="text-green-400" size={20} />
                        <span className="text-green-400 font-semibold">{leads.filter(l => l.source === 'facebook_ads').length} leads recibidos de Facebook/IG</span>
                      </>
                    ) : (
                      <>
                        <Clock className="text-slate-400" size={20} />
                        <span className="text-slate-400">Esperando conexión...</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Tarjeta Importar Leads CSV/Excel */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-600 rounded-xl">
                    <Upload size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Importar Leads (CSV/Excel)</h3>
                    <p className="text-slate-400 text-sm">Carga leads masivamente desde archivos</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-700/50 p-4 rounded-xl text-sm">
                    <p className="font-semibold mb-2">📄 Formato esperado:</p>
                    <code className="text-xs bg-slate-800 p-2 rounded block text-green-400">
                      nombre, telefono, email, interes, notas
                    </code>
                    <p className="text-slate-400 mt-2 text-xs">
                      El teléfono debe ser de 10 dígitos (se agregará 521 automáticamente)
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const csvContent = "nombre,telefono,email,interes,notas\nJuan Pérez,4921234567,juan@email.com,Santa Rita,Interesado en casa 3 recámaras\nMaría García,4929876543,maria@email.com,Los Alamos,Busca crédito INFONAVIT"
                      const blob = new Blob([csvContent], { type: 'text/csv' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'plantilla_leads.csv'
                      a.click()
                    }}
                    className="w-full bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Descargar Plantilla CSV
                  </button>

                  <label className="w-full bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer">
                    <Upload size={20} /> Subir Archivo CSV
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return

                        const text = await file.text()
                        const lines = text.split('\n').filter(l => l.trim())
                        const headers = lines[0].toLowerCase().split(',').map(h => h.trim())

                        const leadsToImport: any[] = []

                        for (let i = 1; i < lines.length; i++) {
                          const values = lines[i].split(',').map(v => v.trim())
                          const row: any = {}
                          headers.forEach((h, idx) => {
                            row[h] = values[idx] || ''
                          })

                          let phone = (row.telefono || row.phone || row.celular || '').replace(/\D/g, '')
                          if (phone.length === 10) phone = '521' + phone

                          if (row.nombre || row.name) {
                            leadsToImport.push({
                              name: row.nombre || row.name,
                              phone: phone || null,
                              email: row.email || row.correo || null,
                              property_interest: row.interes || row.interest || row.propiedad || null,
                              notes: row.notas || row.notes || null,
                              source: 'agency_import',
                              status: 'new',
                              score: 50,
                              temperature: 'COLD'
                            })
                          }
                        }

                        if (leadsToImport.length === 0) {
                          alert('No se encontraron leads válidos en el archivo')
                          return
                        }

                        // Importar usando el backend API (asignación inteligente)
                        try {
                          let importados = 0
                          let errores = 0

                          for (const lead of leadsToImport) {
                            try {
                              const response = await fetch('https://sara-backend.edson-633.workers.dev/api/leads', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(lead)
                              })
                              if (response.ok) {
                                importados++
                              } else {
                                errores++
                              }
                            } catch {
                              errores++
                            }
                          }

                          alert(`✅ ${importados} leads importados${errores > 0 ? ` (${errores} errores)` : ''}`)
                          loadData()
                        } catch (err) {
                          console.error('Error importando:', err)
                          alert('Error al importar leads')
                        }

                        e.target.value = ''
                      }}
                    />
                  </label>

                  <div className={`flex items-center gap-2 p-3 rounded-xl ${leads.filter(l => l.source === 'agency_import').length > 0 ? 'bg-green-600/20 border border-green-500' : 'bg-slate-700/50'}`}>
                    {leads.filter(l => l.source === 'agency_import').length > 0 ? (
                      <>
                        <CheckCircle className="text-green-400" size={20} />
                        <span className="text-green-400 font-semibold">{leads.filter(l => l.source === 'agency_import').length} leads importados</span>
                      </>
                    ) : (
                      <>
                        <Clock className="text-slate-400" size={20} />
                        <span className="text-slate-400">Sin importaciones aún</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'promotions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Promociones ({promotions.length})</h2>
              <button onClick={() => setShowNewPromotion(true)} className="bg-purple-600 px-4 py-2 rounded-xl hover:bg-purple-700 flex items-center gap-2">
                <Plus size={20} /> Nueva Promocion
              </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-green-500/50 transition-all">
                <p className="text-slate-400 mb-1">Activas</p>
                <p className="text-2xl font-bold text-green-400">{promotions.filter(p => p.status === 'active').length}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-yellow-500/50 transition-all">
                <p className="text-slate-400 mb-1">Programadas</p>
                <p className="text-2xl font-bold text-yellow-400">{promotions.filter(p => p.status === 'scheduled').length}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-blue-500/50 transition-all">
                <p className="text-slate-400 mb-1">Total Alcanzados</p>
                <p className="text-2xl font-bold text-blue-400">{promotions.reduce((acc, p) => acc + (p.total_reached || 0), 0)}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-purple-500/50 transition-all">
                <p className="text-slate-400 mb-1">Respuestas</p>
                <p className="text-2xl font-bold text-purple-400">{promotions.reduce((acc, p) => acc + (p.total_responses || 0), 0)}</p>
              </div>
            </div>

            {/* Promotions Table */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="text-left p-4">Promocion</th>
                    <th className="text-left p-4">Fechas</th>
                    <th className="text-left p-4">Segmento</th>
                    <th className="text-left p-4">Recordatorios</th>
                    <th className="text-left p-4">Alcance</th>
                    <th className="text-left p-4">Estado</th>
                    <th className="text-left p-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {promotions.map(promo => {
                    const startDate = new Date(promo.start_date)
                    const endDate = new Date(promo.end_date)
                    const today = new Date()
                    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                    return (
                      <tr key={promo.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                        <td className="p-4">
                          <p className="font-semibold">{promo.name}</p>
                          <p className="text-sm text-slate-400 truncate max-w-xs">{promo.description || promo.message.substring(0, 50)}...</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm">{startDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} - {endDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</p>
                          {promo.status === 'active' && daysRemaining > 0 && (
                            <p className="text-xs text-yellow-400">{daysRemaining} dias restantes</p>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-blue-600/30 text-blue-400 rounded text-sm">{promo.target_segment}</span>
                        </td>
                        <td className="p-4">
                          {promo.reminder_enabled ? (
                            <span className="text-green-400 text-sm">{promo.reminder_frequency} ({promo.reminders_sent_count || 0} enviados)</span>
                          ) : (
                            <span className="text-slate-500 text-sm">Desactivados</span>
                          )}
                        </td>
                        <td className="p-4">
                          <p className="font-semibold">{promo.total_reached || 0}</p>
                          <p className="text-xs text-slate-400">{promo.total_responses || 0} respuestas</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-sm ${
                            promo.status === 'active' ? 'bg-green-600' :
                            promo.status === 'scheduled' ? 'bg-yellow-600' :
                            promo.status === 'paused' ? 'bg-orange-600' :
                            promo.status === 'completed' ? 'bg-blue-600' :
                            'bg-gray-600'
                          }`}>
                            {promo.status === 'active' ? 'Activa' :
                             promo.status === 'scheduled' ? 'Programada' :
                             promo.status === 'paused' ? 'Pausada' :
                             promo.status === 'completed' ? 'Completada' : promo.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button onClick={() => setEditingPromotion(promo)} className="bg-blue-600 p-2 rounded hover:bg-blue-700" title="Editar">
                              <Edit size={16} />
                            </button>
                            {promo.status === 'active' ? (
                              <button onClick={() => togglePromoStatus(promo)} className="bg-orange-600 p-2 rounded hover:bg-orange-700" title="Pausar">
                                <Pause size={16} />
                              </button>
                            ) : promo.status !== 'completed' && (
                              <button onClick={() => togglePromoStatus(promo)} className="bg-green-600 p-2 rounded hover:bg-green-700" title="Activar">
                                <Play size={16} />
                              </button>
                            )}
                            <button onClick={() => sendPromoToSegment(promo)} className="bg-purple-600 p-2 rounded hover:bg-purple-700" title="Enviar ahora">
                              <Send size={16} />
                            </button>
                            <button onClick={() => deletePromotion(promo.id)} className="bg-red-600 p-2 rounded hover:bg-red-700" title="Eliminar">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {promotions.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-slate-400 text-xl mb-4">No hay promociones</p>
                  <button onClick={() => setShowNewPromotion(true)} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold">
                    Crear Primera Promocion
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'events' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Eventos ({crmEvents.length})</h2>
              <button onClick={() => setShowNewCrmEvent(true)} className="bg-emerald-600 px-4 py-2 rounded-xl hover:bg-emerald-700 flex items-center gap-2">
                <Plus size={20} /> Nuevo Evento
              </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-emerald-500/50 transition-all">
                <p className="text-slate-400 mb-1">Proximos</p>
                <p className="text-2xl font-bold text-emerald-400">{crmEvents.filter(e => e.status === 'upcoming' || e.status === 'scheduled').length}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-blue-500/50 transition-all">
                <p className="text-slate-400 mb-1">Total Registrados</p>
                <p className="text-2xl font-bold text-blue-400">{crmEvents.reduce((acc, e) => acc + (e.registered_count || 0), 0)}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-purple-500/50 transition-all">
                <p className="text-slate-400 mb-1">Capacidad Total</p>
                <p className="text-2xl font-bold text-purple-400">{crmEvents.reduce((acc, e) => acc + (e.max_capacity || 0), 0)}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-green-500/50 transition-all">
                <p className="text-slate-400 mb-1">Completados</p>
                <p className="text-2xl font-bold text-green-400">{crmEvents.filter(e => e.status === 'completed').length}</p>
              </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {crmEvents.map(event => {
                const eventDate = new Date(event.event_date)
                const isPast = eventDate < new Date()
                const occupancy = event.max_capacity ? Math.round((event.registered_count / event.max_capacity) * 100) : 0

                return (
                  <div key={event.id} className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all ${isPast ? 'opacity-60' : ''}`}>
                    {event.image_url && (
                      <img src={event.image_url} alt={event.name} className="w-full h-40 object-cover" />
                    )}
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          event.event_type === 'open_house' ? 'bg-blue-600' :
                          event.event_type === 'seminar' ? 'bg-purple-600' :
                          event.event_type === 'outlet' ? 'bg-orange-600' :
                          'bg-emerald-600'
                        }`}>
                          {event.event_type === 'open_house' ? 'Open House' :
                           event.event_type === 'seminar' ? 'Seminario' :
                           event.event_type === 'outlet' ? 'Outlet' : event.event_type}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          event.status === 'upcoming' || event.status === 'scheduled' ? 'bg-green-600' :
                          event.status === 'completed' ? 'bg-slate-600' : 'bg-red-600'
                        }`}>
                          {event.status === 'upcoming' || event.status === 'scheduled' ? 'Proximo' :
                           event.status === 'completed' ? 'Completado' : event.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-lg mb-2">{event.name}</h3>
                      {event.description && (
                        <p className="text-sm text-slate-400 mb-3 line-clamp-2">{event.description}</p>
                      )}

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Calendar size={16} className="text-emerald-400" />
                          <span>{eventDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                        </div>
                        {event.event_time && (
                          <div className="flex items-center gap-2 text-slate-300">
                            <Clock size={16} className="text-blue-400" />
                            <span>{event.event_time}</span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-2 text-slate-300">
                            <MapPin size={16} className="text-red-400" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>

                      {event.max_capacity && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-400">Registrados</span>
                            <span className="font-semibold">{event.registered_count}/{event.max_capacity}</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${occupancy >= 90 ? 'bg-red-500' : occupancy >= 70 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(occupancy, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mt-4">
                        <button onClick={() => setEditingCrmEvent(event)} className="flex-1 bg-blue-600 p-2 rounded hover:bg-blue-700 flex items-center justify-center gap-1">
                          <Edit size={16} /> Editar
                        </button>
                        <button onClick={() => deleteCrmEvent(event.id)} className="bg-red-600 p-2 rounded hover:bg-red-700">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {crmEvents.length === 0 && (
              <div className="text-center py-16 bg-slate-800/50 rounded-2xl">
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-slate-400 text-xl mb-4">No hay eventos programados</p>
                <button onClick={() => setShowNewCrmEvent(true)} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold">
                  Crear Primer Evento
                </button>
              </div>
            )}
          </div>
        )}

        {view === 'calendar' && (
          <div className="space-y-6">
            {/* Header con botones */}
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h2 className="text-3xl font-bold">📅 Calendario de Citas</h2>
              <div className="flex gap-3 items-center flex-wrap">
                <button 
                  onClick={() => setShowNewAppointment(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl font-semibold flex items-center gap-2"
                >
                  ➕ Nueva Cita
                </button>
                <a 
                  href="https://calendar.google.com/calendar/u/0/r" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold flex items-center gap-2"
                >
                  🗓️ Abrir Google Calendar
                </a>
                <span className="px-3 py-2 bg-green-600/30 border border-green-500 rounded-xl text-sm">✅ {appointments.filter(a => a.status === 'scheduled').length} Programadas</span>
                <span className="px-3 py-2 bg-red-600/30 border border-red-500 rounded-xl text-sm">❌ {appointments.filter(a => a.status === 'cancelled').length} Canceladas</span>
              </div>
            </div>

            {/* Lista de citas programadas */}
            <div className="grid grid-cols-1 gap-4">
              {appointments.filter(a => a.status === 'scheduled').map((appt) => {
                const fecha = new Date(appt.scheduled_date + 'T' + appt.scheduled_time)
                return (
                  <div key={appt.id} className="bg-slate-800 border border-slate-700 p-5 rounded-2xl">
                    <div className="flex items-start justify-between gap-4">
                      {/* Info de la cita */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className="text-4xl">🏠</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <p className="font-bold text-xl">{appt.property_name || 'Visita'}</p>
                            <span className="px-2 py-1 bg-blue-600 rounded text-xs uppercase">{appt.appointment_type || 'visita'}</span>
                            {appt.confirmation_sent && (
                              <span className={`px-2 py-1 rounded text-xs ${appt.client_responded ? 'bg-green-600' : 'bg-yellow-600'}`}>
                                {appt.client_responded ? '✅ Confirmado' : '⏳ Enviado'}
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-slate-400 text-xs">👤 Cliente</p>
                              <p className="font-semibold">{appt.lead_name || 'Sin nombre'}</p>
                              <p className="text-xs text-slate-400">{appt.lead_phone}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-xs">📅 Fecha</p>
                              <p className="font-semibold text-blue-400">
                                {fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-xs">🕐 Hora</p>
                              <p className="font-semibold text-green-400 text-lg">
                                {fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-xs">🏢 Vendedor</p>
                              <p className="font-semibold">{appt.vendedor_name || 'Sin asignar'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Botones de acción */}
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => setEditingAppointment({...appt, mode: 'edit', notificar: true})}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold flex items-center gap-2"
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          onClick={async () => {
                            if (confirm(`¿Cancelar cita con ${appt.lead_name}?\n\nSe notificará al cliente y vendedor por WhatsApp.`)) {
                              try {
                                // Llamar al backend que envía WhatsApp y elimina de Google Calendar
                                const response = await fetch(`https://sara-backend.edson-633.workers.dev/api/appointments/${appt.id}/cancel`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ 
                                    google_event_id: appt.google_event_vendedor_id,
                                    cancelled_by: 'CRM',
                                    notificar: true
                                  })
                                })
                                if (!response.ok) throw new Error('Error al cancelar')
                                loadData()
                                alert('✅ Cita cancelada. Se notificó al cliente y vendedor por WhatsApp.')
                              } catch (err: any) {
                                alert('Error: ' + err.message)
                                loadData()
                              }
                            }
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold flex items-center gap-2"
                        >
                          ❌ Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {appointments.filter(a => a.status === 'scheduled').length === 0 && (
                <div className="text-center py-16 bg-slate-800/50 rounded-2xl">
                  <div className="text-6xl mb-4">📅</div>
                  <p className="text-slate-400 text-xl mb-4">No hay citas programadas</p>
                  <button 
                    onClick={() => setShowNewAppointment(true)}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold"
                  >
                    ➕ Crear Primera Cita
                  </button>
                </div>
              )}
            </div>

            {/* Citas Canceladas */}
            {appointments.filter(a => a.status === 'cancelled').length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4 text-slate-400">❌ Citas Canceladas ({appointments.filter(a => a.status === 'cancelled').length})</h3>
                <div className="space-y-2">
                  {appointments.filter(a => a.status === 'cancelled').slice(0, 5).map((appt) => {
                    const fecha = new Date(appt.scheduled_date + 'T' + appt.scheduled_time)
                    return (
                      <div key={appt.id} className="bg-slate-800/30 border border-slate-700/30 p-3 rounded-xl opacity-60">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-red-400">❌</span>
                            <div>
                              <p className="font-semibold text-sm">{appt.property_name} - {appt.lead_name || appt.lead_phone}</p>
                              <p className="text-xs text-slate-500">
                                {fecha.toLocaleDateString('es-MX')} {fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                {appt.cancelled_by && ` • Cancelada por: ${appt.cancelled_by}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Nueva Cita */}
        {showNewAppointment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewAppointment(false)}>
            <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">➕ Nueva Cita</h3>
                <button onClick={() => setShowNewAppointment(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Cliente (Lead)</label>
                  <select 
                    value={newAppointment.lead_id || ''} 
                    onChange={(e) => {
                      const lead = leads.find(l => l.id === e.target.value)
                      setNewAppointment({...newAppointment, lead_id: e.target.value, lead_name: lead?.name || '', lead_phone: lead?.phone || ''})
                    }}
                    className="w-full p-3 bg-slate-700 rounded-lg"
                  >
                    <option value="">Seleccionar lead...</option>
                    {leads.map(l => <option key={l.id} value={l.id}>{l.name} - {l.phone}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Desarrollo</label>
                  <select 
                    value={newAppointment.property_name || ''} 
                    onChange={(e) => setNewAppointment({...newAppointment, property_name: e.target.value})}
                    className="w-full p-3 bg-slate-700 rounded-lg"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Oficinas Centrales">🏢 Oficinas Centrales</option>
                    {[...new Set(properties.map(p => p.development || p.name))].filter(Boolean).sort().map(dev => (
                      <option key={dev} value={dev}>{dev}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Fecha</label>
                    <input 
                      type="date" 
                      value={newAppointment.scheduled_date || ''} 
                      onChange={(e) => setNewAppointment({...newAppointment, scheduled_date: e.target.value})}
                      className="w-full p-3 bg-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Hora</label>
                    <input 
                      type="time" 
                      value={newAppointment.scheduled_time || ''} 
                      onChange={(e) => setNewAppointment({...newAppointment, scheduled_time: e.target.value})}
                      className="w-full p-3 bg-slate-700 rounded-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Vendedor</label>
                  <select 
                    value={newAppointment.vendedor_id || ''} 
                    onChange={(e) => {
                      const v = team.find(t => t.id === e.target.value)
                      setNewAppointment({...newAppointment, vendedor_id: e.target.value, vendedor_name: v?.name || ''})
                    }}
                    className="w-full p-3 bg-slate-700 rounded-lg"
                  >
                    <option value="">Seleccionar vendedor...</option>
                    {team.filter(t => t.role === 'vendedor' && t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                
                <button 
                  onClick={async () => {
                    if (!newAppointment.lead_id || !newAppointment.scheduled_date || !newAppointment.scheduled_time) {
                      alert('Completa todos los campos')
                      return
                    }
                    try {
                      const response = await fetch('https://sara-backend.edson-633.workers.dev/api/appointments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          ...newAppointment,
                          appointment_type: 'visita',
                          status: 'scheduled'
                        })
                      })
                      if (!response.ok) throw new Error('Error al crear')
                      setShowNewAppointment(false)
                      setNewAppointment({})
                      loadData()
                      alert('✅ Cita creada y agregada a Google Calendar')
                    } catch (err: any) {
                      alert('Error: ' + err.message)
                    }
                  }}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold"
                >
                  ✅ Crear Cita
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar/Reagendar Cita */}
        {editingAppointment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingAppointment(null)}>
            <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  ✏️ Editar Cita
                </h3>
                <button onClick={() => setEditingAppointment(null)} className="text-slate-400 hover:text-white"><X size={24} /></button>
              </div>
              
              <div className="bg-slate-700/50 p-4 rounded-xl mb-4">
                <p className="text-sm text-slate-400">Cliente</p>
                <p className="font-bold text-lg">{editingAppointment.lead_name} - {editingAppointment.lead_phone}</p>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Fecha</label>
                    <input 
                      type="date" 
                      value={editingAppointment.scheduled_date || ''} 
                      onChange={(e) => setEditingAppointment({...editingAppointment, scheduled_date: e.target.value})}
                      className="w-full p-3 bg-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Hora</label>
                    <input 
                      type="time" 
                      value={(editingAppointment.scheduled_time || '').substring(0, 5)} 
                      onChange={(e) => setEditingAppointment({...editingAppointment, scheduled_time: e.target.value})}
                      className="w-full p-3 bg-slate-700 rounded-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Desarrollo</label>
                  <select 
                    value={editingAppointment.property_name || ''} 
                    onChange={(e) => setEditingAppointment({...editingAppointment, property_name: e.target.value})}
                    className="w-full p-3 bg-slate-700 rounded-lg"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Oficinas Centrales">🏢 Oficinas Centrales</option>
                    {[...new Set(properties.map(p => p.development || p.name))].filter(Boolean).sort().map(dev => (
                      <option key={dev} value={dev}>{dev}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Vendedor Asignado</label>
                  <select 
                    value={editingAppointment.vendedor_id || ''} 
                    onChange={(e) => {
                      const vendedor = team.find(t => t.id === e.target.value);
                      setEditingAppointment({
                        ...editingAppointment, 
                        vendedor_id: e.target.value,
                        vendedor_name: vendedor?.name || ''
                      });
                    }}
                    className="w-full p-3 bg-slate-700 rounded-lg"
                  >
                    <option value="">Seleccionar vendedor...</option>
                    {team.filter(t => t.role === 'vendedor' || t.role === 'admin').map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Tipo de Cita</label>
                  <select 
                    value={(editingAppointment as any).appointment_type || 'visita'} 
                    onChange={(e) => setEditingAppointment({...editingAppointment, appointment_type: e.target.value} as any)}
                    className="w-full p-3 bg-slate-700 rounded-lg"
                  >
                    <option value="visita">🏠 Visita a desarrollo</option>
                    <option value="oficina">🏢 Cita en oficina</option>
                    <option value="videollamada">📹 Videollamada</option>
                    <option value="firma">✏️ Firma de contrato</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Notas</label>
                  <textarea 
                    value={(editingAppointment as any).notes_text || ''} 
                    onChange={(e) => setEditingAppointment({...editingAppointment, notes_text: e.target.value} as any)}
                    placeholder="Notas adicionales sobre la cita..."
                    className="w-full p-3 bg-slate-700 rounded-lg h-24 resize-none"
                  />
                </div>
                
                {/* Checkbox notificar WhatsApp */}
                <label className="flex items-center gap-3 p-3 bg-green-600/20 border border-green-500/50 rounded-xl cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={(editingAppointment as any).notificar || false}
                    onChange={(e) => setEditingAppointment({...editingAppointment, notificar: e.target.checked} as any)}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <p className="font-semibold">📲 Notificar por WhatsApp</p>
                    <p className="text-xs text-slate-400">Enviar mensaje al cliente y vendedor con los cambios</p>
                  </div>
                </label>
                
                <button 
                  onClick={async () => {
                    try {
                      const response = await fetch('https://sara-backend.edson-633.workers.dev/api/appointments/' + editingAppointment.id, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          scheduled_date: editingAppointment.scheduled_date,
                          scheduled_time: editingAppointment.scheduled_time,
                          property_name: editingAppointment.property_name,
                          google_event_id: editingAppointment.google_event_vendedor_id,
                          notificar: (editingAppointment as any).notificar,
                          lead_phone: editingAppointment.lead_phone,
                          lead_name: editingAppointment.lead_name,
                          vendedor_id: editingAppointment.vendedor_id,
                          vendedor_name: editingAppointment.vendedor_name,
                          appointment_type: (editingAppointment as any).appointment_type,
                          notes_text: (editingAppointment as any).notes_text
                        })
                      })
                      if (!response.ok) throw new Error('Error al guardar')
                      setEditingAppointment(null)
                      loadData()
                      alert((editingAppointment as any).notificar ? '✅ Cita actualizada y notificaciones enviadas por WhatsApp' : '✅ Cita actualizada')
                    } catch (err: any) {
                      alert('Error: ' + err.message)
                    }
                  }}
                  className={`w-full py-3 rounded-xl font-semibold ${(editingAppointment as any).mode === 'edit' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                >
                  ✅ Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============ METAS ============ */}
        {view === 'goals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Metas Mensuales</h2>
              <input 
                type="month" 
                value={selectedGoalMonth}
                onChange={(e) => setSelectedGoalMonth(e.target.value)}
                className="bg-slate-700 px-4 py-2 rounded-lg"
              />
            </div>
            
            <div className="bg-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Meta del Mes - Empresa</h3>
              <div className="flex items-center gap-4">
                <input 
                  type="number"
                  value={monthlyGoals.company_goal}
                  onChange={(e) => setMonthlyGoals({...monthlyGoals, company_goal: parseInt(e.target.value) || 0})}
                  className="bg-slate-700 px-4 py-3 rounded-lg w-32 text-2xl font-bold text-center"
                />
                <span className="text-xl">casas</span>
                <button 
                  onClick={() => saveCompanyGoal(monthlyGoals.company_goal)}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
                >
                  Guardar
                </button>
              </div>
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Avance del equipo</span>
                  <span>{leads.filter(l => l.status === 'closed' || l.status === 'Cerrado').length} / {monthlyGoals.company_goal || 0}</span>
                </div>
                <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                    style={{ width: `${Math.min(100, (leads.filter(l => l.status === 'closed' || l.status === 'Cerrado').length / (monthlyGoals.company_goal || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Metas por Vendedor</h3>
              <div className="space-y-4">
                {vendorGoals.map(vg => {
                  const closed = getClosedByVendor(vg.vendor_id)
                  const reserved = getReservedByVendor(vg.vendor_id)
                  const negotiation = getNegotiationByVendor(vg.vendor_id)
                  const percentage = vg.goal > 0 ? Math.round((closed / vg.goal) * 100) : 0
                  
                  return (
                    <div key={vg.vendor_id} className="bg-slate-700/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center font-bold">
                            {vg.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{vg.name}</p>
                            <p className="text-sm text-slate-400">
                              {closed} cerrados | {reserved} reservados | {negotiation} negociando
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            value={vg.goal}
                            onChange={(e) => {
                              const newGoals = vendorGoals.map(g => 
                                g.vendor_id === vg.vendor_id ? {...g, goal: parseInt(e.target.value) || 0} : g
                              )
                              setVendorGoals(newGoals)
                            }}
                            onBlur={() => saveVendorGoal(vg.vendor_id, vg.goal)}
                            className="bg-slate-600 px-3 py-2 rounded-lg w-20 text-center font-bold"
                          />
                          <span className="text-slate-400">meta</span>
                        </div>
                      </div>
                      <div className="relative pt-4">
                        <div className="h-3 bg-slate-600 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${percentage >= 100 ? 'bg-green-500' : percentage >= 70 ? 'bg-blue-500' : percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(100, percentage)}%` }}
                          />
                        </div>
                        <span className={`absolute right-0 top-0 text-sm font-bold ${percentage >= 100 ? 'text-green-400' : percentage >= 70 ? 'text-blue-400' : percentage >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {percentage}%
                        </span>
                      </div>
                      {reserved > 0 && (
                        <p className="text-xs text-cyan-400 mt-2">
                          Si cierras los {reserved} reservados llegas a {Math.round(((closed + reserved) / (vg.goal || 1)) * 100)}%
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-600 flex justify-between items-center">
                <span className="text-slate-400">Total asignado:</span>
                <span className="text-xl font-bold">{vendorGoals.reduce((sum, vg) => sum + vg.goal, 0)} casas</span>
              </div>
              {vendorGoals.reduce((sum, vg) => sum + vg.goal, 0) !== monthlyGoals.company_goal && monthlyGoals.company_goal > 0 && (
                <p className="text-yellow-400 text-sm mt-2">
                  La suma de metas ({vendorGoals.reduce((sum, vg) => sum + vg.goal, 0)}) no coincide con meta empresa ({monthlyGoals.company_goal})
                </p>
              )}
            </div>
          </div>
        )}

        {view === 'followups' && (
          <FollowupsView supabase={supabase} />
        )}

        {view === 'config' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Configuración</h2>
            
            <div className="bg-slate-800/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">⏰ Alertas de Estancamiento - Leads</h3>
              <p className="text-slate-400 text-sm mb-4">Días máximos antes de alertar al vendedor</p>
              <div className="grid grid-cols-3 gap-4">
                {alertSettings.filter(s => s.category === 'leads').map(setting => (
                  <div key={setting.id} className="bg-slate-700 p-4 rounded-xl">
                    <label className="block text-sm text-slate-400 mb-2 capitalize">{setting.stage.replace('_', ' ')}</label>
                    <input 
                      type="number" 
                      value={setting.max_days}
                      onChange={async (e) => {
                        const newDays = parseInt(e.target.value) || 1
                        await supabase.from('alert_settings').update({ max_days: newDays }).eq('id', setting.id)
                        setAlertSettings(alertSettings.map(s => s.id === setting.id ? {...s, max_days: newDays} : s))
                      }}
                      className="w-full p-2 bg-slate-600 rounded-lg text-center text-xl font-bold text-white"
                      min="1"
                    />
                    <p className="text-xs text-slate-500 mt-1 text-center">días</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">👔 Seguimiento a Asesores Hipotecarios</h3>
              <p className="text-slate-400 text-sm mb-4">SARA contacta al asesor y escala al vendedor si no responde</p>
              <div className="grid grid-cols-2 gap-4">
                {alertSettings.filter(s => s.category === 'asesor').map(setting => (
                  <div key={setting.id} className="bg-slate-700 p-4 rounded-xl">
                    <label className="block text-sm text-slate-400 mb-2">
                      {setting.stage === 'recordatorio' ? '📱 Recordatorio al Asesor' : '🚨 Escalar al Vendedor'}
                    </label>
                    <input 
                      type="number" 
                      value={setting.max_days}
                      onChange={async (e) => {
                        const newDays = parseInt(e.target.value) || 1
                        await supabase.from('alert_settings').update({ max_days: newDays }).eq('id', setting.id)
                        setAlertSettings(alertSettings.map(s => s.id === setting.id ? {...s, max_days: newDays} : s))
                      }}
                      className="w-full p-2 bg-slate-600 rounded-lg text-center text-xl font-bold text-white"
                      min="1"
                    />
                    <p className="text-xs text-slate-500 mt-1 text-center">días sin actualizar</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-4">El asesor puede responder: "Aprobado Juan", "Rechazado Juan", "Documentos Juan"</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
              <h3 className="text-xl font-semibold mb-4">Notificaciones por WhatsApp</h3>
              <p className="text-slate-400 mb-4">Todos los miembros activos recibirán notificaciones según su rol.</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Vendedores (reciben: nuevos leads, leads olvidados)</h4>
                  <div className="space-y-2">
                    {team.filter(t => t.role === 'vendedor').map(v => (
                      <div key={v.id} className="flex items-center justify-between bg-slate-700 p-3 rounded-xl">
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
                      <div key={a.id} className="flex items-center justify-between bg-slate-700 p-3 rounded-xl">
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
                      <div key={m.id} className="flex items-center justify-between bg-slate-700 p-3 rounded-xl">
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
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all mt-6">
              <h3 className="text-xl font-semibold mb-4">⏰ Recordatorios Automáticos</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reminderConfigs.map(config => (
                  <div key={config.id} className="bg-slate-700 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold ${
                        config.lead_category === 'HOT' ? 'text-red-400 bg-red-500/20 p-2 rounded-xl' :
                        config.lead_category === 'WARM' ? 'text-yellow-500' : 'text-blue-400 bg-blue-500/20 p-2 rounded-xl'
                      }`}>{config.lead_category}</span>
                      <button onClick={() => setEditingReminder(config)} className="text-blue-400 hover:text-blue-300">
                        Editar
                      </button>
                    </div>
                    <p className="text-2xl font-bold">Cada {config.reminder_hours}h</p>
                    <p className="text-sm text-slate-400 mt-2">
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
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Editar {editingReminder.lead_category}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Frecuencia (horas)</label>
                <input type="number" defaultValue={editingReminder.reminder_hours} id="hrs" className="w-full bg-slate-700 rounded px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Inicio</label>
                  <input type="number" defaultValue={editingReminder.send_start_hour} id="start" className="w-full bg-slate-700 rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm mb-2">Fin</label>
                  <input type="number" defaultValue={editingReminder.send_end_hour} id="end" className="w-full bg-slate-700 rounded px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Mensaje</label>
                <textarea defaultValue={editingReminder.message_template} id="msg" rows={4} className="w-full bg-slate-700 rounded px-3 py-2" />
              </div>
              <div className="flex gap-3">
                                            <button onClick={() => setEditingReminder(null)} className="flex-1 bg-gray-600 hover:bg-slate-700 py-2 rounded">
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

      {editingLead && (
        <LeadModal
          lead={editingLead}
          properties={properties}
          team={team}
          onSave={saveLead}
          onClose={() => setEditingLead(null)}
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

      {(editingPromotion || showNewPromotion) && (
        <PromotionModal
          promotion={editingPromotion}
          onSave={savePromotion}
          onClose={() => { setEditingPromotion(null); setShowNewPromotion(false); }}
        />
      )}

      {(editingCrmEvent || showNewCrmEvent) && (
        <CrmEventModal
          event={editingCrmEvent}
          onSave={saveCrmEvent}
          onClose={() => { setEditingCrmEvent(null); setShowNewCrmEvent(false); }}
        />
      )}

      {showNewEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewEvent(false)}>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Agendar Cita</h3>
              <button onClick={() => setShowNewEvent(false)} className="text-slate-400 hover:text-white"><X /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Cliente</label>
                <select id="evt-cliente" className="w-full bg-slate-700 rounded-xl p-3">
                  <option value="">Seleccionar</option>
                  {leads.map(l => <option key={l.id} value={(l.name||"")+ "|" + (l.phone||"")}>{l.name || l.phone}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Propiedad</label>
                <select id="evt-prop" className="w-full bg-slate-700 rounded-xl p-3">
                  <option value="">Seleccionar</option>
                  {properties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Fecha</label>
                <input type="date" id="evt-date" className="w-full bg-slate-700 rounded-xl p-3" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Hora</label>
                <select id="evt-time" className="w-full bg-slate-700 rounded-xl p-3">
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
              <button onClick={() => setShowNewEvent(false)} className="px-4 py-2 rounded-xl bg-slate-700">Cancelar</button>
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
              }} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center gap-2"><Save size={20} /> Agendar</button>
            </div>
          </div>
        </div>
      )}

      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedLead(null)}>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Conversación con {selectedLead.name || 'Lead'}</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditingLead(selectedLead); setSelectedLead(null); }} className="text-blue-400 hover:text-blue-300 flex items-center gap-1"><Edit size={18} /> Editar</button>
                <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-white"><X /></button>
              </div>
            </div>
            <div className="space-y-3">
              <p><span className="font-semibold">Teléfono:</span> {selectedLead.phone}</p>
              <p><span className="font-semibold">Score:</span> <span className={`${getScoreColor(selectedLead.score)} px-2 py-1 rounded`}>{selectedLead.score}</span></p>
              <p><span className="font-semibold">Estado:</span> {selectedLead.status}</p>
              {selectedLead.status === 'fallen' && selectedLead.fallen_reason && (
                <p><span className="font-semibold">Motivo:</span> <span className="text-red-400">{selectedLead.fallen_reason}</span></p>
              )}
              {selectedLead.credit_status && (
                <p><span className="font-semibold">Crédito:</span> <span className={selectedLead.credit_status === 'approved' ? 'text-green-400' : selectedLead.credit_status === 'active' ? 'text-yellow-400' : 'text-red-400'}>{selectedLead.credit_status}</span></p>
              )}
              <p><span className="font-semibold">Interés:</span> {selectedLead.property_interest || 'No definido'}</p>
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Historial de conversación:</h4>
                <div className="bg-slate-700 p-4 rounded-xl max-h-96 overflow-y-auto">
                  {selectedLead.conversation_history && selectedLead.conversation_history.length > 0 ? (
                    selectedLead.conversation_history.map((msg: any, i: number) => (
                      <div key={i} className={`mb-3 ${msg.role === 'user' ? 'text-blue-400' : 'text-green-400'}`}>
                        <span className="font-semibold">{msg.role === 'user' ? 'Cliente' : 'SARA'}:</span> {msg.content}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">Sin historial de conversación</p>
                  )}
                </div>
              </div>
              
              {/* Sección de Actividades del Vendedor */}
              <div className="mt-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Actividades del vendedor:
                </h4>
                <div className="bg-slate-700 p-4 rounded-xl max-h-48 overflow-y-auto">
                  {loadingActivities ? (
                    <p className="text-slate-500">Cargando actividades...</p>
                  ) : leadActivities.length > 0 ? (
                    leadActivities.map((activity: LeadActivity) => (
                      <div key={activity.id} className="mb-3 pb-2 border-b border-slate-600 last:border-0">
                        <div className="flex justify-between items-start">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            activity.activity_type === 'call' ? 'bg-blue-600' :
                            activity.activity_type === 'visit' ? 'bg-green-600' :
                            activity.activity_type === 'whatsapp' ? 'bg-emerald-600' :
                            activity.activity_type === 'email' ? 'bg-purple-600' :
                            activity.activity_type === 'quote' ? 'bg-yellow-600' :
                            'bg-slate-600'
                          }`}>
                            {activity.activity_type === 'call' ? '📞 Llamada' :
                             activity.activity_type === 'visit' ? '🏠 Visita' :
                             activity.activity_type === 'whatsapp' ? '💬 WhatsApp' :
                             activity.activity_type === 'email' ? '📧 Email' :
                             activity.activity_type === 'quote' ? '💰 Cotización' :
                             activity.activity_type}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(activity.created_at).toLocaleDateString('es-MX', { 
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 mt-1">Por: {activity.team_member_name}</p>
                        {activity.notes && <p className="text-sm text-slate-400 mt-1">{activity.notes}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">Sin actividades registradas</p>
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
    name: '', category: '', price: 0, bedrooms: 0, bathrooms: 0, area_m2: 0, 
    total_units: 0, sold_units: 0, photo_url: '', description: '', 
    neighborhood: '', city: '', youtube_link: ''
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{property ? 'Editar Propiedad' : 'Nueva Propiedad'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nombre</label>
            <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Categoría</label>
            <input value={form.category || ''} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Precio Base</label>
            <input type="number" value={form.price || ''} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Recámaras</label>
            <input type="number" value={form.bedrooms || ''} onChange={e => setForm({...form, bedrooms: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Baños</label>
            <input type="number" value={form.bathrooms || ''} onChange={e => setForm({...form, bathrooms: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">m²</label>
            <input type="number" value={form.area_m2 || ''} onChange={e => setForm({...form, area_m2: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Total Unidades</label>
            <input type="number" value={form.total_units || ''} onChange={e => setForm({...form, total_units: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Vendidas</label>
            <input type="number" value={form.sold_units || ''} onChange={e => setForm({...form, sold_units: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Descripción</label>
            <textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" rows={3} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">URL Imagen</label>
            <input value={form.photo_url || ''} onChange={e => setForm({...form, photo_url: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">YouTube Link</label>
            <input value={form.youtube_link || ''} onChange={e => setForm({...form, youtube_link: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" placeholder="https://youtu.be/..." />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Matterport 3D</label>
            <input value={form.matterport_link || ''} onChange={e => setForm({...form, matterport_link: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" placeholder="https://my.matterport.com/..." />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">GPS / Ubicación</label>
            <input value={form.gps_link || ''} onChange={e => setForm({...form, gps_link: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" placeholder="https://maps.google.com/..." />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Brochure PDF</label>
            <input value={form.brochure_urls || ''} onChange={e => setForm({...form, brochure_urls: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" placeholder="URL del PDF..." />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Galería (URLs separadas por coma)</label>
            <input value={form.gallery_urls || ''} onChange={e => setForm({...form, gallery_urls: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" placeholder="url1, url2, url3..." />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Frase de Venta</label>
            <input value={form.sales_phrase || ''} onChange={e => setForm({...form, sales_phrase: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" placeholder="El pitch de venta..." />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Cliente Ideal</label>
            <input value={form.ideal_client || ''} onChange={e => setForm({...form, ideal_client: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" placeholder="Para quién es esta propiedad..." />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Desarrollo</label>
            <input value={form.development || ''} onChange={e => setForm({...form, development: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Ciudad</label>
            <input value={form.city || ''} onChange={e => setForm({...form, city: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-gray-600">Cancelar</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Save size={20} /> Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

function LeadModal({ lead, properties, team, onSave, onClose }: {
  lead: Lead,
  properties: Property[],
  team: TeamMember[],
  onSave: (l: Partial<Lead>) => void,
  onClose: () => void
}) {
  const [form, setForm] = useState<Partial<Lead>>({
    id: lead.id,
    name: lead.name || '',
    phone: lead.phone || '',
    property_interest: lead.property_interest || '',
    budget: lead.budget || '',
    score: lead.score || 0,
    status: lead.status || 'new',
    source: lead.source || '',
    assigned_to: lead.assigned_to || '',
    credit_status: lead.credit_status || ''
  })

  const statusOptions = [
    { value: 'new', label: 'Nuevo' },
    { value: 'contacted', label: 'Contactado' },
    { value: 'qualified', label: 'Calificado' },
    { value: 'scheduled', label: 'Cita Agendada' },
    { value: 'visited', label: 'Visitó' },
    { value: 'negotiation', label: 'Negociación' },
    { value: 'reserved', label: 'Reservado' },
    { value: 'closed', label: 'Cerrado' },
    { value: 'delivered', label: 'Entregado' },
    { value: 'fallen', label: 'Caído' }
  ]

  const creditOptions = [
    { value: '', label: 'Sin información' },
    { value: 'none', label: 'Sin crédito' },
    { value: 'active', label: 'Activo' },
    { value: 'approved', label: 'Aprobado' },
    { value: 'rejected', label: 'Rechazado' }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Editar Lead</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nombre</label>
            <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Teléfono</label>
            <input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Interés en propiedad</label>
            <select value={form.property_interest || ''} onChange={e => setForm({...form, property_interest: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3">
              <option value="">Seleccionar...</option>
              {properties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Presupuesto</label>
            <input value={form.budget || ''} onChange={e => setForm({...form, budget: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" placeholder="ej: 500,000 - 800,000" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Score (1-10)</label>
            <input type="number" min="1" max="10" value={form.score || ''} onChange={e => setForm({...form, score: parseInt(e.target.value) || 0})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Estado</label>
            <select value={form.status || ''} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3">
              {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Fuente</label>
            <input value={form.source || ''} onChange={e => setForm({...form, source: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" placeholder="ej: Facebook, Referido" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Asignado a</label>
            <select value={form.assigned_to || ''} onChange={e => setForm({...form, assigned_to: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3">
              <option value="">Sin asignar</option>
              {team.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Estado de crédito</label>
            <select value={form.credit_status || ''} onChange={e => setForm({...form, credit_status: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3">
              {creditOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600">Cancelar</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Save size={20} /> Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

function MemberModal({ member, onSave, onClose }: { member: TeamMember | null, onSave: (m: Partial<TeamMember>) => void, onClose: () => void }) {
  const [form, setForm] = useState<Partial<TeamMember>>(member || {
    name: '', phone: '', role: 'vendedor', sales_count: 0, commission: 0, active: true, photo_url: '', email: '',
    vacation_start: '', vacation_end: '', is_on_duty: false, work_start: '09:00', work_end: '18:00', working_days: [1,2,3,4,5]
  })

  const diasSemana = [
    { value: 0, label: 'Dom' },
    { value: 1, label: 'Lun' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Mié' },
    { value: 4, label: 'Jue' },
    { value: 5, label: 'Vie' },
    { value: 6, label: 'Sáb' }
  ]

  const toggleDay = (day: number) => {
    const current = form.working_days || []
    if (current.includes(day)) {
      setForm({...form, working_days: current.filter(d => d !== day)})
    } else {
      setForm({...form, working_days: [...current, day].sort()})
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{member ? 'Editar Miembro' : 'Nuevo Miembro'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
        </div>
        <div className="space-y-4">
          {/* Datos básicos */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nombre</label>
            <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <input type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" placeholder="nombre@gruposantarita.com" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">WhatsApp</label>
            <input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" placeholder="5215512345678" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Rol</label>
            <select value={form.role || ''} onChange={e => setForm({...form, role: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3">
              <option value="vendedor">Vendedor</option>
              <option value="asesor">Asesor Hipotecario</option>
              <option value="coordinador">Coordinador</option>
              <option value="agencia">Marketing / Agencia</option>
              <option value="gerente">Gerente</option>
            </select>
          </div>

          {/* Sección de disponibilidad */}
          <div className="border-t border-slate-600 pt-4 mt-4">
            <h4 className="font-semibold text-slate-300 mb-3">Disponibilidad</h4>

            {/* Horario de trabajo */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Hora entrada</label>
                <input type="time" value={form.work_start || '09:00'} onChange={e => setForm({...form, work_start: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Hora salida</label>
                <input type="time" value={form.work_end || '18:00'} onChange={e => setForm({...form, work_end: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" />
              </div>
            </div>

            {/* Días laborales */}
            <div className="mb-3">
              <label className="block text-sm text-slate-400 mb-2">Días laborales</label>
              <div className="flex gap-1">
                {diasSemana.map(dia => (
                  <button
                    key={dia.value}
                    type="button"
                    onClick={() => toggleDay(dia.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      (form.working_days || []).includes(dia.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {dia.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vacaciones */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Vacaciones desde</label>
                <input type="date" value={form.vacation_start || ''} onChange={e => setForm({...form, vacation_start: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Vacaciones hasta</label>
                <input type="date" value={form.vacation_end || ''} onChange={e => setForm({...form, vacation_end: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" />
              </div>
            </div>

            {/* Guardia y Activo */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 bg-orange-600/20 p-3 rounded-xl">
                <input type="checkbox" checked={form.is_on_duty || false} onChange={e => setForm({...form, is_on_duty: e.target.checked})} className="w-5 h-5" />
                <label className="text-orange-300">De guardia (prioridad en asignación)</label>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="w-5 h-5" />
                <label>Activo (recibe notificaciones y leads)</label>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-gray-600">Cancelar</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
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
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{mortgage ? 'Editar Solicitud' : 'Nueva Solicitud'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Lead</label>
            <select value={form.lead_id || ''} onChange={e => {
              const lead = leads.find(l => l.id === e.target.value)
              setForm({...form, lead_id: e.target.value, lead_name: lead?.name || '', lead_phone: lead?.phone || ''})
            }} className="w-full bg-slate-700 rounded-xl p-3">
              <option value="">Seleccionar lead</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name || l.phone}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Propiedad</label>
            <select value={form.property_id || ''} onChange={e => {
              const prop = properties.find(p => p.id === e.target.value)
              setForm({...form, property_id: e.target.value, property_name: prop?.name || '', requested_amount: prop?.price || 0})
            }} className="w-full bg-slate-700 rounded-xl p-3">
              <option value="">Seleccionar propiedad</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Ingreso Mensual</label>
            <input type="number" value={form.monthly_income || ''} onChange={e => setForm({...form, monthly_income: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Deuda Actual</label>
            <input type="number" value={form.current_debt || ''} onChange={e => setForm({...form, current_debt: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Enganche</label>
            <input type="number" value={form.down_payment || ''} onChange={e => setForm({...form, down_payment: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Asesor</label>
            <select value={form.assigned_advisor_id || ''} onChange={e => {
              const asesor = asesores.find(a => a.id === e.target.value)
              setForm({...form, assigned_advisor_id: e.target.value, assigned_advisor_name: asesor?.name || ''})
            }} className="w-full bg-slate-700 rounded-xl p-3">
              <option value="">Seleccionar asesor</option>
              {asesores.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Estado</label>
            <select value={form.status || ''} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3">
              <option value="pending">Pendiente</option>
              <option value="in_review">En Revisión</option>
              <option value="sent_to_bank">Enviado a Banco</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Banco</label>
            <input value={form.bank || ''} onChange={e => setForm({...form, bank: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-gray-600">Cancelar</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
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
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all w-full max-w-3xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{campaign ? 'Editar Campaña' : 'Nueva Campaña'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Nombre de Campaña</label>
            <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Estado</label>
            <select value={form.status || ''} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3">
              <option value="active">Activa</option>
              <option value="paused">Pausada</option>
              <option value="completed">Completada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Canal</label>
            <select value={form.channel || ''} onChange={e => setForm({...form, channel: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3">
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
            <label className="block text-sm text-slate-400 mb-1">Presupuesto</label>
            <input type="number" value={form.budget || ''} onChange={e => setForm({...form, budget: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Gastado</label>
            <input type="number" value={form.spent || ''} onChange={e => setForm({...form, spent: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Impresiones</label>
            <input type="number" value={form.impressions || ''} onChange={e => setForm({...form, impressions: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Clicks</label>
            <input type="number" value={form.clicks || ''} onChange={e => setForm({...form, clicks: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Leads Generados</label>
            <input type="number" value={form.leads_generated || ''} onChange={e => setForm({...form, leads_generated: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Ventas Cerradas</label>
            <input type="number" value={form.sales_closed || ''} onChange={e => setForm({...form, sales_closed: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Revenue Generado</label>
            <input type="number" value={form.revenue_generated || ''} onChange={e => setForm({...form, revenue_generated: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Fecha Inicio</label>
            <input type="date" value={form.start_date || ''} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Fecha Fin</label>
            <input type="date" value={form.end_date || ''} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div className="col-span-3">
            <label className="block text-sm text-slate-400 mb-1">Audiencia Target</label>
            <input value={form.target_audience || ''} onChange={e => setForm({...form, target_audience: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div className="col-span-3">
            <label className="block text-sm text-slate-400 mb-1">Notas</label>
            <textarea value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" rows={2} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-slate-700 rounded-xl">
          <div>
            <p className="text-slate-400 text-sm">CTR</p>
            <p className="text-xl font-bold">{ctr.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">CPL</p>
            <p className="text-xl font-bold">${cpl.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">ROI</p>
            <p className={`text-xl font-bold ${roi >= 0 ? 'text-green-400 bg-green-500/20 p-2 rounded-xl' : 'text-red-400 bg-red-500/20 p-2 rounded-xl'}`}>{roi.toFixed(0)}%</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-gray-600">Cancelar</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Save size={20} /> Guardar
          </button>
        </div>
      </div>
    </div>


  )
}

function PromotionModal({ promotion, onSave, onClose }: { promotion: Promotion | null, onSave: (p: Partial<Promotion>) => void, onClose: () => void }) {
  const [form, setForm] = useState<Partial<Promotion>>(promotion || {
    name: '', description: '', start_date: '', end_date: '', message: '',
    image_url: '', target_segment: 'todos', reminder_enabled: true,
    reminder_frequency: 'weekly', status: 'scheduled'
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{promotion ? 'Editar Promocion' : 'Nueva Promocion'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Nombre de la Promocion</label>
            <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" placeholder="Ej: Outlet Santa Rita Enero 2026" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Fecha Inicio</label>
            <input type="date" value={form.start_date || ''} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Fecha Fin</label>
            <input type="date" value={form.end_date || ''} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Segmento Objetivo</label>
            <select value={form.target_segment || 'todos'} onChange={e => setForm({...form, target_segment: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3">
              <option value="todos">Todos los leads</option>
              <option value="hot">Solo HOT</option>
              <option value="warm">Solo WARM</option>
              <option value="cold">Solo COLD</option>
              <option value="compradores">Compradores</option>
              <option value="caidos">Caidos</option>
              <option value="new">Nuevos</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Estado</label>
            <select value={form.status || 'scheduled'} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3">
              <option value="scheduled">Programada</option>
              <option value="active">Activa</option>
              <option value="paused">Pausada</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Mensaje de la Promocion</label>
            <textarea value={form.message || ''} onChange={e => setForm({...form, message: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" rows={4} placeholder="Escribe el mensaje que se enviara a los leads..." />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Descripcion (opcional)</label>
            <input value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" placeholder="Descripcion interna de la promocion" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">URL de Imagen (opcional)</label>
            <input value={form.image_url || ''} onChange={e => setForm({...form, image_url: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" placeholder="https://ejemplo.com/imagen.jpg" />
          </div>
          <div className="col-span-2 border-t border-slate-600 pt-4 mt-2">
            <div className="flex items-center gap-3 mb-3">
              <input type="checkbox" id="reminder-enabled" checked={form.reminder_enabled || false} onChange={e => setForm({...form, reminder_enabled: e.target.checked})} className="w-5 h-5 rounded" />
              <label htmlFor="reminder-enabled" className="text-sm">Activar recordatorios automaticos</label>
            </div>
            {form.reminder_enabled && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Frecuencia de recordatorios</label>
                <select value={form.reminder_frequency || 'weekly'} onChange={e => setForm({...form, reminder_frequency: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3">
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="at_start">Solo al inicio</option>
                  <option value="at_end">Solo al final</option>
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-gray-600">Cancelar</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 flex items-center gap-2">
            <Save size={20} /> Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

function CrmEventModal({ event, onSave, onClose }: { event: CRMEvent | null, onSave: (e: Partial<CRMEvent>) => void, onClose: () => void }) {
  const [form, setForm] = useState<Partial<CRMEvent>>(event || {
    name: '', description: '', event_type: 'open_house', event_date: '',
    event_time: '10:00', location: '', location_url: '', max_capacity: 50,
    image_url: '', pdf_url: '', status: 'scheduled'
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{event ? 'Editar Evento' : 'Nuevo Evento'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Nombre del Evento</label>
            <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" placeholder="Ej: Open House Santa Rita" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Tipo de Evento</label>
            <select value={form.event_type || 'open_house'} onChange={e => setForm({...form, event_type: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3">
              <option value="open_house">Open House</option>
              <option value="seminar">Seminario</option>
              <option value="outlet">Outlet/Venta</option>
              <option value="fiesta">Fiesta/Celebracion</option>
              <option value="webinar">Webinar</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Estado</label>
            <select value={form.status || 'scheduled'} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3">
              <option value="scheduled">Programado</option>
              <option value="upcoming">Proximo</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Fecha</label>
            <input type="date" value={form.event_date || ''} onChange={e => setForm({...form, event_date: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Hora</label>
            <input type="time" value={form.event_time || '10:00'} onChange={e => setForm({...form, event_time: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Ubicacion</label>
            <input value={form.location || ''} onChange={e => setForm({...form, location: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" placeholder="Ej: Sala de Ventas Santa Rita, Av. Principal #123" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">URL Mapa (opcional)</label>
            <input value={form.location_url || ''} onChange={e => setForm({...form, location_url: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" placeholder="https://maps.google.com/..." />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Capacidad Maxima</label>
            <input type="number" value={form.max_capacity || ''} onChange={e => setForm({...form, max_capacity: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Descripcion</label>
            <textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" rows={3} placeholder="Describe el evento..." />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">URL Imagen (opcional)</label>
            <input value={form.image_url || ''} onChange={e => setForm({...form, image_url: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" placeholder="https://ejemplo.com/imagen.jpg" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">URL PDF/Flyer (opcional)</label>
            <input value={form.pdf_url || ''} onChange={e => setForm({...form, pdf_url: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3" placeholder="https://ejemplo.com/flyer.pdf" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-gray-600">Cancelar</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
            <Save size={20} /> Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// COMPONENTE FOLLOWUPS VIEW - Sistema de seguimiento 90 días
// ═══════════════════════════════════════════════════════

interface FollowupRule {
  id: string
  name: string
  funnel: 'ventas' | 'hipoteca'
  trigger_event: string
  trigger_status: string | null
  requires_no_response: boolean
  delay_hours: number
  message_template: string
  is_active: boolean
  sequence_order: number
  sequence_group: string
}

interface ScheduledFollowup {
  id: string
  lead_id: string
  rule_id: string
  lead_phone: string
  lead_name: string
  desarrollo: string
  message: string
  scheduled_at: string
  sent: boolean
  sent_at: string | null
  cancelled: boolean
  cancel_reason: string | null
  created_at: string
}

function FollowupsView({ supabase }: { supabase: any }) {
  const [rules, setRules] = useState<FollowupRule[]>([])
  const [scheduled, setScheduled] = useState<ScheduledFollowup[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'rules' | 'scheduled' | 'history'>('rules')
  const [stats, setStats] = useState({ pendientes: 0, enviadosHoy: 0, canceladosHoy: 0 })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    
    const { data: rulesData } = await supabase
      .from('followup_rules')
      .select('*')
      .order('funnel')
      .order('sequence_order')
    
    const { data: scheduledData } = await supabase
      .from('scheduled_followups')
      .select('*')
      .order('scheduled_at', { ascending: true })
      .limit(100)
    
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    const { count: pendientes } = await supabase
      .from('scheduled_followups')
      .select('*', { count: 'exact', head: true })
      .eq('sent', false)
      .eq('cancelled', false)
    
    const { count: enviadosHoy } = await supabase
      .from('scheduled_followups')
      .select('*', { count: 'exact', head: true })
      .eq('sent', true)
      .gte('sent_at', hoy.toISOString())
    
    const { count: canceladosHoy } = await supabase
      .from('scheduled_followups')
      .select('*', { count: 'exact', head: true })
      .eq('cancelled', true)
      .gte('created_at', hoy.toISOString())

    setRules(rulesData || [])
    setScheduled(scheduledData || [])
    setStats({
      pendientes: pendientes || 0,
      enviadosHoy: enviadosHoy || 0,
      canceladosHoy: canceladosHoy || 0
    })
    setLoading(false)
  }

  async function toggleRuleActive(rule: FollowupRule) {
    await supabase
      .from('followup_rules')
      .update({ is_active: !rule.is_active })
      .eq('id', rule.id)
    setRules(rules.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r))
  }

  async function updateRuleDelay(rule: FollowupRule, newDelay: number) {
    await supabase
      .from('followup_rules')
      .update({ delay_hours: newDelay })
      .eq('id', rule.id)
    setRules(rules.map(r => r.id === rule.id ? { ...r, delay_hours: newDelay } : r))
  }

  async function cancelFollowup(followup: ScheduledFollowup) {
    if (!confirm(`¿Cancelar follow-up para ${followup.lead_name}?`)) return
    await supabase
      .from('scheduled_followups')
      .update({ cancelled: true, cancel_reason: 'manual_cancel' })
      .eq('id', followup.id)
    loadData()
  }

  function formatDelay(hours: number): string {
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    if (remainingHours === 0) return `${days}d`
    return `${days}d ${remainingHours}h`
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  }

  const ventasRules = rules.filter(r => r.funnel === 'ventas')
  const hipotecaRules = rules.filter(r => r.funnel === 'hipoteca')
  const pendingFollowups = scheduled.filter(s => !s.sent && !s.cancelled)
  const sentFollowups = scheduled.filter(s => s.sent)
  const cancelledFollowups = scheduled.filter(s => s.cancelled)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">📬 Follow-ups Automáticos</h2>
        <button onClick={loadData} className="px-4 py-2 bg-slate-700 rounded-xl hover:bg-slate-600 flex items-center gap-2">
          🔄 Actualizar
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl">
          <p className="text-blue-200 text-sm">Pendientes</p>
          <p className="text-4xl font-bold">{stats.pendientes}</p>
        </div>
        <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-2xl">
          <p className="text-green-200 text-sm">Enviados Hoy</p>
          <p className="text-4xl font-bold">{stats.enviadosHoy}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-600 to-orange-800 p-6 rounded-2xl">
          <p className="text-orange-200 text-sm">Cancelados Hoy</p>
          <p className="text-4xl font-bold">{stats.canceladosHoy}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-700 pb-2">
        <button onClick={() => setActiveTab('rules')} className={`px-4 py-2 rounded-t-xl ${activeTab === 'rules' ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-700'}`}>
          ⚙️ Reglas ({rules.length})
        </button>
        <button onClick={() => setActiveTab('scheduled')} className={`px-4 py-2 rounded-t-xl ${activeTab === 'scheduled' ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-700'}`}>
          📅 Programados ({pendingFollowups.length})
        </button>
        <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-t-xl ${activeTab === 'history' ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-700'}`}>
          📜 Historial
        </button>
      </div>

      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              🏠 Funnel Ventas
              <span className="text-sm font-normal text-slate-400">({ventasRules.length} reglas)</span>
            </h3>
            <div className="space-y-3">
              {ventasRules.map(rule => (
                <div key={rule.id} className={`flex items-center justify-between p-4 rounded-xl ${rule.is_active ? 'bg-slate-700' : 'bg-slate-800 opacity-50'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${rule.is_active ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                      <span className="font-semibold">{rule.name}</span>
                      {rule.requires_no_response && (
                        <span className="text-xs bg-yellow-600/30 text-yellow-400 px-2 py-1 rounded">Solo sin respuesta</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{rule.trigger_event} ↑ {rule.trigger_status || 'cualquier'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-sm">Delay:</span>
                      <input type="number" value={rule.delay_hours} onChange={(e) => updateRuleDelay(rule, parseInt(e.target.value) || 1)} className="w-20 bg-slate-600 rounded-lg p-2 text-center font-bold" min="1" />
                      <span className="text-slate-400 text-sm">hrs</span>
                      <span className="text-slate-500 text-xs">({formatDelay(rule.delay_hours)})</span>
                    </div>
                    <button onClick={() => toggleRuleActive(rule)} className={`px-3 py-2 rounded-lg ${rule.is_active ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'}`}>
                      {rule.is_active ? '✓ Activa' : 'Inactiva'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              💳 Funnel Hipoteca
              <span className="text-sm font-normal text-slate-400">({hipotecaRules.length} reglas)</span>
            </h3>
            <div className="space-y-3">
              {hipotecaRules.map(rule => (
                <div key={rule.id} className={`flex items-center justify-between p-4 rounded-xl ${rule.is_active ? 'bg-slate-700' : 'bg-slate-800 opacity-50'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${rule.is_active ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                      <span className="font-semibold">{rule.name}</span>
                      {rule.requires_no_response && (
                        <span className="text-xs bg-yellow-600/30 text-yellow-400 px-2 py-1 rounded">Solo sin respuesta</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{rule.trigger_event} ↑ {rule.trigger_status || 'cualquier'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-sm">Delay:</span>
                      <input type="number" value={rule.delay_hours} onChange={(e) => updateRuleDelay(rule, parseInt(e.target.value) || 1)} className="w-20 bg-slate-600 rounded-lg p-2 text-center font-bold" min="1" />
                      <span className="text-slate-400 text-sm">hrs</span>
                      <span className="text-slate-500 text-xs">({formatDelay(rule.delay_hours)})</span>
                    </div>
                    <button onClick={() => toggleRuleActive(rule)} className={`px-3 py-2 rounded-lg ${rule.is_active ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'}`}>
                      {rule.is_active ? '✓ Activa' : 'Inactiva'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-4">
            <p className="text-blue-300 text-sm">
              💡 <strong>Tip:</strong> Modifica el delay (horas) para ajustar cuándo se envía cada follow-up. 
              Los cambios aplican a futuros follow-ups, no a los ya programados.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'scheduled' && (
        <div className="bg-slate-800/50 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">📅 Follow-ups Programados</h3>
          {pendingFollowups.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-4xl mb-2">📭</p>
              <p>No hay follow-ups pendientes</p>
              <p className="text-sm mt-2">Se programarán automáticamente cuando los leads agenden citas o cambien de status</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingFollowups.map(followup => (
                <div key={followup.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{followup.lead_name || 'Sin nombre'}</span>
                      <span className="text-xs bg-blue-600/30 text-blue-400 px-2 py-1 rounded">{followup.desarrollo}</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1 truncate max-w-md">{followup.message}</p>
                    <p className="text-xs text-slate-500 mt-1">📱 {followup.lead_phone}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-yellow-400">⏰ {formatDate(followup.scheduled_at)}</p>
                      <p className="text-xs text-slate-500">Programado</p>
                    </div>
                    <button onClick={() => cancelFollowup(followup)} className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/40">
                      Cancelar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 text-green-400">✅ Enviados ({sentFollowups.length})</h3>
            {sentFollowups.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No hay follow-ups enviados aún</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-auto">
                {sentFollowups.slice(0, 20).map(followup => (
                  <div key={followup.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div>
                      <span className="font-semibold">{followup.lead_name}</span>
                      <span className="text-slate-400 text-sm ml-2">• {followup.desarrollo}</span>
                    </div>
                    <span className="text-sm text-green-400">{formatDate(followup.sent_at || '')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 text-orange-400">❌ Cancelados ({cancelledFollowups.length})</h3>
            {cancelledFollowups.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No hay follow-ups cancelados</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-auto">
                {cancelledFollowups.slice(0, 20).map(followup => (
                  <div key={followup.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div>
                      <span className="font-semibold">{followup.lead_name}</span>
                      <span className="text-slate-400 text-sm ml-2">• {followup.desarrollo}</span>
                    </div>
                    <span className="text-sm text-orange-400">{followup.cancel_reason || 'manual'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
