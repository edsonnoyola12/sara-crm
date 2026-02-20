import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { Users, Calendar as CalendarIcon, Calendar, Settings, TrendingUp, Phone, DollarSign, Target, Award, Building, UserCheck, Flame, X, Save, Plus, Edit, Trash2, CreditCard, AlertTriangle, Clock, CheckCircle, XCircle, ArrowRight, Megaphone, BarChart3, Eye, MousePointer, Lightbulb, TrendingDown, AlertCircle, Copy, Upload, Download, Link, Facebook, Pause, Play, Send, MapPin, Tag, Star, MessageSquare, Filter, ChevronLeft, ChevronRight, RefreshCw, Gift, LogOut, Search } from 'lucide-react'

const API_BASE = 'https://sara-backend.edson-633.workers.dev'

async function safeFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo', contacted: 'Contactado', qualified: 'Calificado', scheduled: 'Cita',
  visited: 'Visitó', negotiation: 'Negociación', reserved: 'Reservado', closed: 'Cerrado',
  delivered: 'Entregado', sold: 'Vendido', lost: 'Perdido', fallen: 'Caído', inactive: 'Inactivo', paused: 'Pausado'
}

type View = 'dashboard' | 'leads' | 'properties' | 'team' | 'calendar' | 'mortgage' | 'marketing' | 'referrals' | 'goals' | 'config' | 'followups' | 'promotions' | 'events' | 'reportes' | 'encuestas' | 'coordinator' | 'bi' | 'mensajes'

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
  // Campos de encuesta
  survey_completed?: boolean
  survey_rating?: number
  survey_feedback?: string
  survey_step?: number
  // Campos de segmentación
  temperature?: string
  needs_mortgage?: boolean
  // Campos de referidos
  referred_by?: string
  referred_by_name?: string
  referral_date?: string
}

interface Property {
  id: string
  name: string
  category: string
  price: number
  price_equipped: number
  land_size: number
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
  hora_inicio?: number  // 9
  hora_fin?: number     // 18
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
  video_url?: string
  pdf_url?: string
  target_segment: string
  segment_filters?: string | object  // JSON de filtros avanzados
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
  video_url?: string
  pdf_url?: string
  invitation_message?: string
  target_segment?: string
  segment_filters?: string | object  // JSON de filtros avanzados
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
  attended?: boolean
}

function App() {
  const [view, setView] = useState<View>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [mortgages, setMortgages] = useState<MortgageApplication[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [alertSettings, setAlertSettings] = useState<AlertSetting[]>([])
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])

  // Helper: traducir source slugs a nombres legibles con icono
  const sourceLabel = (src: string) => {
    const map: Record<string, string> = {
      'phone_inbound': '📞 Llamada',
      'facebook_ads': '📘 Facebook',
      'referral': '🤝 Referido',
      'agency_import': '📥 Importado',
      'whatsapp': '💬 WhatsApp',
      'website': '🌐 Web',
      'Directo': '➡️ Directo',
    }
    return map[src] || src
  }

  // ═══════════════════════════════════════════════════════════
  // SISTEMA DE PERMISOS POR ROL
  // ═══════════════════════════════════════════════════════════
  const permisos = {
    // LEADS
    puedeVerTodosLeads: () => ['admin', 'coordinador'].includes(currentUser?.role || ''),
    puedeVerLeadsReadOnly: () => currentUser?.role === 'agencia',
    puedeEditarLead: (lead: Lead) => {
      if (!currentUser) return false
      if (['admin', 'coordinador'].includes(currentUser.role)) return true
      if (currentUser.role === 'vendedor' && lead.assigned_to === currentUser.id) return true
      return false
    },
    puedeCambiarStatusLead: (lead: Lead) => {
      if (!currentUser) return false
      if (['admin', 'coordinador'].includes(currentUser.role)) return true
      if (currentUser.role === 'vendedor' && lead.assigned_to === currentUser.id) return true
      return false
    },
    puedeAsignarVendedor: () => ['admin', 'coordinador'].includes(currentUser?.role || ''),
    puedeCrearLead: () => ['admin', 'coordinador', 'vendedor'].includes(currentUser?.role || ''),

    // EQUIPO
    puedeEditarEquipo: () => currentUser?.role === 'admin',

    // PROPIEDADES
    puedeEditarPropiedades: () => ['admin', 'coordinador'].includes(currentUser?.role || ''),

    // HIPOTECAS
    puedeVerTodasHipotecas: () => ['admin', 'coordinador', 'asesor'].includes(currentUser?.role || ''),
    puedeEditarHipoteca: (mortgage: MortgageApplication) => {
      if (!currentUser) return false
      if (['admin', 'coordinador'].includes(currentUser.role)) return true
      if (currentUser.role === 'asesor' && mortgage.assigned_advisor_id === currentUser.id) return true
      return false
    },

    // METAS
    puedeVerTodasMetas: () => ['admin', 'coordinador'].includes(currentUser?.role || ''),
    puedeEditarMetas: () => currentUser?.role === 'admin',

    // MARKETING
    puedeVerMarketing: () => ['admin', 'coordinador', 'agencia'].includes(currentUser?.role || ''),
    puedeEditarMarketing: () => ['admin', 'agencia'].includes(currentUser?.role || ''),

    // SIDEBAR - qué secciones puede ver cada rol
    puedeVerSeccion: (seccion: string) => {
      if (!currentUser) return false
      // Externos: agencia (mkt) y asesor - acceso limitado
      const acceso: Record<string, string[]> = {
        dashboard: ['admin', 'vendedor', 'coordinador', 'asesor', 'agencia'], // Cada rol ve su propio dashboard
        coordinator: ['admin', 'coordinador'], // Panel especial del coordinador
        leads: ['admin', 'vendedor', 'coordinador'], // Externos NO ven leads
        properties: ['admin', 'vendedor', 'coordinador'], // Externos NO ven propiedades
        team: ['admin', 'coordinador'],
        mortgage: ['admin', 'asesor', 'coordinador'], // Asesor solo ve hipotecas
        marketing: ['admin', 'agencia', 'coordinador'], // Agencia solo ve marketing
        goals: ['admin', 'vendedor', 'coordinador'],
        calendar: ['admin', 'vendedor', 'coordinador'],
        promotions: ['admin', 'coordinador', 'agencia'], // Agencia puede ver promociones
        events: ['admin', 'coordinador'],
        followups: ['admin', 'vendedor', 'coordinador'],
        reportes: ['admin'],
        encuestas: ['admin', 'coordinador'],
        referrals: ['admin', 'coordinador', 'vendedor'],
        config: ['admin'],
        bi: ['admin', 'coordinador'], // Business Intelligence
        mensajes: ['admin', 'coordinador'], // Métricas de mensajes WhatsApp
      }
      return acceso[seccion]?.includes(currentUser.role) || false
    }
  }

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
  const [bonoReferido, setBonoReferido] = useState(() => {
    const saved = localStorage.getItem('bonoReferido')
    return saved ? parseInt(saved) : 500
  })
  const [editandoBono, setEditandoBono] = useState(false)
  const [dashboardPregunta, setDashboardPregunta] = useState('')
  const [dashboardRespuesta, setDashboardRespuesta] = useState('')
  const [dashboardCargando, setDashboardCargando] = useState(false)
  const [monthlyGoals, setMonthlyGoals] = useState<{month: string, company_goal: number}>({ month: "", company_goal: 0 })
  const [vendorGoals, setVendorGoals] = useState<{vendor_id: string, goal: number, name: string}[]>([])
  const [selectedGoalMonth, setSelectedGoalMonth] = useState(new Date().toISOString().slice(0, 7))
  const [annualGoal, setAnnualGoal] = useState<{year: number, goal: number}>({ year: new Date().getFullYear(), goal: 0 })
  const [selectedGoalYear, setSelectedGoalYear] = useState(new Date().getFullYear())
  const [marketingGoals, setMarketingGoals] = useState<{month: string, leads_goal: number, budget: number}>({ month: '', leads_goal: 0, budget: 0 })
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [showNewAppointment, setShowNewAppointment] = useState(false)
  const [newAppointment, setNewAppointment] = useState<any>({})
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [showAllAppointments, setShowAllAppointments] = useState(false) // Toggle: ver todas las citas vs solo las mías
  const [showNewEvent, setShowNewEvent] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Global Search (Cmd+K)
  const [globalSearch, setGlobalSearch] = useState('')
  const [showGlobalSearch, setShowGlobalSearch] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Visual Calendar
  const [calendarViewMode, setCalendarViewMode] = useState<'list' | 'month'>('month')
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null)

  // Promociónes y Eventos
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [crmEvents, setCrmEvents] = useState<CRMEvent[]>([])
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([])
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [editingCrmEvent, setEditingCrmEvent] = useState<CRMEvent | null>(null)
  const [showNewPromotion, setShowNewPromotion] = useState(false)
  const [showNewCrmEvent, setShowNewCrmEvent] = useState(false)
  const [showInviteEventModal, setShowInviteEventModal] = useState(false)
  const [selectedEventForInvite, setSelectedEventForInvite] = useState<CRMEvent | null>(null)
  const [inviteSending, setInviteSending] = useState(false)

  // InputModal para reemplazar prompt() nativos
  const [inputModal, setInputModal] = useState<{
    title: string
    fields: { name: string; label: string; type?: string; defaultValue?: string }[]
    onSubmit: (values: Record<string, string>) => void
  } | null>(null)

  // ConfirmModal para reemplazar confirm() nativos
  const [confirmModal, setConfirmModal] = useState<{
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  const [saving, setSaving] = useState(false)
  const [leadSort, setLeadSort] = useState<{ col: string; asc: boolean }>({ col: 'created_at', asc: false })
  const [campSort, setCampSort] = useState<{ col: string; asc: boolean }>({ col: 'name', asc: true })
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Esc cierra modales
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInputModal(null)
        setConfirmModal(null)
        setEditingLead(null)
        setEditingProperty(null)
        setEditingMember(null)
        setEditingMortgage(null)
        setEditingCampaign(null)
        setEditingPromotion(null)
        setEditingCrmEvent(null)
        setEditingAppointment(null)
        setSelectedLead(null)
        setStatusChange(null)
        setShowNewProperty(false)
        setShowNewMember(false)
        setShowNewMortgage(false)
        setShowNewCampaign(false)
        setShowNewLead(false)
        setShowNewAppointment(false)
        setShowNewPromotion(false)
        setShowNewCrmEvent(false)
        setShowNewEvent(false)
        setShowInviteEventModal(false)
        setShowSendPromoModal(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  // Bloquear scroll del body cuando hay modal abierto
  useEffect(() => {
    const anyModalOpen = !!(inputModal || confirmModal || editingLead || editingProperty || editingMember || editingMortgage || editingCampaign || editingPromotion || editingCrmEvent || editingAppointment || selectedLead || statusChange || showNewProperty || showNewMember || showNewMortgage || showNewCampaign || showNewLead || showNewAppointment || showNewPromotion || showNewCrmEvent || showNewEvent || showInviteEventModal)
    document.body.style.overflow = anyModalOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [inputModal, confirmModal, editingLead, editingProperty, editingMember, editingMortgage, editingCampaign, editingPromotion, editingCrmEvent, editingAppointment, selectedLead, statusChange, showNewProperty, showNewMember, showNewMortgage, showNewCampaign, showNewLead, showNewAppointment, showNewPromotion, showNewCrmEvent, showNewEvent, showInviteEventModal])

  useEffect(() => {
    loadData()
    // Auto-refresh cada 30 segundos sin recargar página
    const interval = setInterval(() => {
      loadDataSilent()
    }, 30000)

    // Realtime subscription para appointments (actualización instantánea)
    const appointmentsSubscription = supabase
      .channel('appointments-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          // Recargar appointments silenciosamente
          supabase.from('appointments').select('*').order('scheduled_date', { ascending: true })
            .then(({ data }) => {
              if (data) setAppointments(data)
            })
        }
      )
      .subscribe()

    // Realtime subscription para leads también
    const leadsSubscription = supabase
      .channel('leads-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          supabase.from('leads').select('*').order('created_at', { ascending: false })
            .then(({ data }) => {
              if (data) setLeads(data)
            })
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      appointmentsSubscription.unsubscribe()
      leadsSubscription.unsubscribe()
    }
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

  // Función para preguntar a la IA del dashboard
  async function preguntarDashboardIA() {
    if (!dashboardPregunta.trim()) return
    setDashboardCargando(true)
    setDashboardRespuesta('')
    try {
      // Preparar contexto con datos actuales del dashboard
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
    generateInsights(leadsRes.data || [], teamRes.data || [], campaignsRes.data || [])

    setLoading(false)
    loadCalendarEvents()

    // Restaurar sesión desde localStorage
    if (!currentUser) {
      const savedPhone = localStorage.getItem('sara_user_phone')
      if (savedPhone) {
        const restored = (teamRes.data || []).find((m: TeamMember) => {
          const memberPhone = m.phone?.replace(/\D/g, '').slice(-10)
          return memberPhone === savedPhone
        })
        if (restored) {
          setCurrentUser(restored)
          if (restored.role === 'agencia') setView('marketing')
          else if (restored.role === 'asesor') setView('mortgage')
          else setView('dashboard')
        }
      }
    }
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

  // ============ METAS ANUALES ============
  const loadAnnualGoal = async (year: number) => {
    const { data } = await supabase
      .from('annual_goals')
      .select('*')
      .eq('year', year)
      .single()

    if (data) {
      setAnnualGoal({ year: data.year, goal: data.goal })
    } else {
      setAnnualGoal({ year, goal: 0 })
    }
  }

  const saveAnnualGoal = async (goal: number) => {
    await supabase.from('annual_goals').upsert({
      year: selectedGoalYear,
      goal: goal
    }, { onConflict: 'year' })
    setAnnualGoal({ year: selectedGoalYear, goal })
  }

  // Distribuir meta mensual equitativamente entre vendedores
  const distributeGoalsEqually = async () => {
    const activeVendors = team.filter(t => t.role === 'vendedor' && t.active)
    if (activeVendors.length === 0 || monthlyGoals.company_goal === 0) return

    const goalPerVendor = Math.floor(monthlyGoals.company_goal / activeVendors.length)
    const remainder = monthlyGoals.company_goal % activeVendors.length

    const newGoals = activeVendors.map((v, index) => ({
      vendor_id: v.id,
      goal: goalPerVendor + (index < remainder ? 1 : 0), // distribuir el residuo
      name: v.name
    }))

    setVendorGoals(newGoals)

    // Guardar todas las metas
    for (const vg of newGoals) {
      await supabase.from('vendor_monthly_goals').upsert({
        month: selectedGoalMonth,
        vendor_id: vg.vendor_id,
        goal: vg.goal
      }, { onConflict: 'month,vendor_id' })
    }
  }

  // Aplicar meta anual dividida en 12 meses
  const applyAnnualToMonthly = async () => {
    if (annualGoal.goal === 0) return
    const monthlyGoalValue = Math.round(annualGoal.goal / 12)

    // Guardar para todos los meses del año
    for (let m = 1; m <= 12; m++) {
      const month = `${selectedGoalYear}-${m.toString().padStart(2, '0')}`
      await supabase.from('monthly_goals').upsert({
        month,
        company_goal: monthlyGoalValue
      }, { onConflict: 'month' })
    }

    // Actualizar el mes actual si coincide el año
    if (selectedGoalMonth.startsWith(selectedGoalYear.toString())) {
      setMonthlyGoals({ month: selectedGoalMonth, company_goal: monthlyGoalValue })
    }
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
      (l.status === 'negotiation' || l.status === 'Negociación')
    ).length
  }

  useEffect(() => {
    if (team.length > 0) loadMonthlyGoals(selectedGoalMonth)
  }, [selectedGoalMonth, team.length])

  useEffect(() => {
    loadAnnualGoal(selectedGoalYear)
  }, [selectedGoalYear])

  // GLOBAL SEARCH — Cmd+K keyboard shortcut (must be before ALL conditional returns)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowGlobalSearch(prev => !prev)
        setGlobalSearch('')
      }
      if (e.key === 'Escape' && showGlobalSearch) {
        setShowGlobalSearch(false)
        setGlobalSearch('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showGlobalSearch])

  // Focus search input when modal opens
  useEffect(() => {
    if (showGlobalSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [showGlobalSearch])


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
      const data = await safeFetch(`${API_BASE}/api/calendar/events`)
      setCalendarEvents(data.items || [])
    } catch (error) {
      console.error("Error loading calendar:", error)
    }
  }

  async function createCalendarEvent(eventData: any) {
    try {
      await safeFetch(`${API_BASE}/api/calendar/events`, {
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

  function deleteCalendarEvent(eventId: string) {
    setConfirmModal({
      title: 'Cancelar cita',
      message: '¿Estás seguro de cancelar esta cita?',
      onConfirm: async () => {
        try {
          await safeFetch(`${API_BASE}/api/calendar/events/${eventId}`, {
            method: "DELETE"
          })
          loadCalendarEvents()
        } catch (error) {
          console.error("Error deleting event:", error)
        }
        setConfirmModal(null)
      }
    })
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

  function deleteProperty(id: string) {
    setConfirmModal({
      title: 'Eliminar propiedad',
      message: '¿Estás seguro de eliminar esta propiedad? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        await supabase.from('properties').delete().eq('id', id)
        loadData()
        setConfirmModal(null)
      }
    })
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
      const API_URL = `${API_BASE}/api/team-members`
      
      if (member.id) {
        // Editar existente
        await safeFetch(`${API_URL}/${member.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(member)
        })
      } else {
        // Crear nuevo
        await safeFetch(API_URL, {
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
      showToast('Error al guardar: ' + (error instanceof Error ? error.message : 'Intenta de nuevo'), 'error')
    }
  }

  function deleteMember(id: string) {
    setConfirmModal({
      title: 'Eliminar miembro',
      message: '¿Estás seguro de eliminar este miembro del equipo?',
      onConfirm: async () => {
        try {
          await safeFetch(`${API_BASE}/api/team-members/${id}`, {
            method: 'DELETE'
          })
          loadData()
        } catch (error) {
          console.error('Error eliminando miembro:', error)
          showToast('Error al eliminar: ' + (error instanceof Error ? error.message : 'Intenta de nuevo'), 'error')
        }
        setConfirmModal(null)
      }
    })
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
      await safeFetch(`${API_BASE}/api/mortgage_applications/${mortgage.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
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
    
    await safeFetch(`${API_BASE}/api/mortgage_applications/${id}`, {
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

  function deleteCampaign(id: string) {
    setConfirmModal({
      title: 'Eliminar campaña',
      message: '¿Estás seguro de eliminar esta campaña? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        await supabase.from('marketing_campaigns').delete().eq('id', id)
        loadData()
        setConfirmModal(null)
      }
    })
  }

  // CRUD Promociónes
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

  function deletePromotion(id: string) {
    setConfirmModal({
      title: 'Eliminar promoción',
      message: '¿Estás seguro de eliminar esta promoción? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        await supabase.from('promotions').delete().eq('id', id)
        loadData()
        setConfirmModal(null)
      }
    })
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

  function deleteCrmEvent(id: string) {
    setConfirmModal({
      title: 'Eliminar evento',
      message: '¿Estás seguro de eliminar este evento? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        await supabase.from('events').delete().eq('id', id)
        loadData()
        setConfirmModal(null)
      }
    })
  }

  // Enviar invitaciones de evento
  async function sendEventInvitations(event: CRMEvent, segment: string, options: { sendImage: boolean, sendVideo: boolean, sendPdf: boolean }) {
    setInviteSending(true)
    try {
      const result = await safeFetch(`${API_BASE}/api/events/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          segment,
          send_image: options.sendImage,
          send_video: options.sendVideo,
          send_pdf: options.sendPdf
        })
      })
      if (result.success) {
        showToast(`Invitaciones enviadas: ${result.sent} enviados, ${result.errors} errores`, 'success')
      } else {
        showToast('Error al enviar invitaciones: ' + (result.error || 'Error desconocido'), 'error')
      }
    } catch (err: any) {
      showToast('Error: ' + err.message, 'error')
    } finally {
      setInviteSending(false)
      setShowInviteEventModal(false)
      setSelectedEventForInvite(null)
    }
  }

  // Estados para modal de envío de promoción
  const [showSendPromoModal, setShowSendPromoModal] = useState(false)
  const [selectedPromoToSend, setSelectedPromoToSend] = useState<Promotion | null>(null)
  const [promoSending, setPromoSending] = useState(false)

  // Abrir modal de envío de promoción
  function openSendPromoModal(promo: Promotion) {
    setSelectedPromoToSend(promo)
    setShowSendPromoModal(true)
  }

  // Enviar promoción real usando el backend
  async function sendPromoReal(segment: string, options: { sendImage: boolean, sendVideo: boolean, sendPdf: boolean, filters?: any }) {
    if (!selectedPromoToSend) return
    setPromoSending(true)

    try {
      const result = await safeFetch(`${API_BASE}/api/promotions/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotion_id: selectedPromoToSend.id,
          segment: segment,
          segment_type: options.filters?.segmentType || 'basic',
          send_image: options.sendImage,
          send_video: options.sendVideo,
          send_pdf: options.sendPdf
        })
      })

      if (result.success) {
        showToast(`Promoción enviada! Enviados: ${result.sent} | Errores: ${result.errors} | Total: ${result.total}`, 'success')
        loadData()
      } else {
        showToast('Error: ' + (result.error || 'Error desconocido'), 'error')
      }
    } catch (err: any) {
      showToast('Error de conexion: ' + err.message, 'error')
    } finally {
      setPromoSending(false)
      setShowSendPromoModal(false)
      setSelectedPromoToSend(null)
    }
  }

  // Funcion legacy (ya no se usa directamente)
  async function sendPromoToSegment(promo: Promotion) {
    openSendPromoModal(promo)
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

  // NOTA: hotLeads, warmLeads, coldLeads se recalculan después de filteredLeads
  const _hotLeadsAll = leads.filter(l => l.score >= 8).length
  const _warmLeadsAll = leads.filter(l => l.score >= 5 && l.score < 8).length
  const _coldLeadsAll = leads.filter(l => l.score < 5).length
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

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-red-500 badge-pulse score-hot'  // HOT - pulsating + glow
    if (score >= 40) return 'bg-amber-500'                      // WARM
    return 'bg-slate-500'                                       // COLD
  }

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Caliente'
    if (score >= 40) return 'Tibio'
    return 'Frio'
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

  if (loading) return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-lg font-semibold text-slate-300">Cargando SARA CRM...</p>
    </div>
  )

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
      // Redirigir a la sección correcta según el rol (externos no ven dashboard)
      if (user.role === 'agencia') {
        setView('marketing')
      } else if (user.role === 'asesor') {
        setView('mortgage')
      } else {
        setView('dashboard')
      }
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

  // HOT/WARM/COLD basados en filteredLeads (para el usuario actual)
  const hotLeads = filteredLeads.filter(l => l.score >= 70).length
  const warmLeads = filteredLeads.filter(l => l.score >= 40 && l.score < 70).length
  const coldLeads = filteredLeads.filter(l => l.score < 40).length

  // scoreData para charts
  const scoreData = [
    { name: 'HOT', value: hotLeads, color: '#ef4444' },
    { name: 'WARM', value: warmLeads, color: '#f97316' },
    { name: 'COLD', value: coldLeads, color: '#3b82f6' }
  ]

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

  // Filtrar citas por rol: admin/coordinador ven todas, vendedor/asesor solo las suyas
  const myLeadIds = currentUser?.role === 'vendedor' ? new Set(leads.filter(l => l.assigned_to === currentUser?.id).map(l => l.id)) : null
  const filteredAppointments = showAllAppointments || currentUser?.role === 'admin' || currentUser?.role === 'coordinador'
    ? appointments
    : appointments.filter(a =>
        a.vendedor_id === currentUser?.id ||
        a.asesor_id === currentUser?.id ||
        (myLeadIds && myLeadIds.has(a.lead_id))
      )

  // Pantalla de login
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex">
        {/* Left side - Branding (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 animate-gradient items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-300 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 text-center px-12 animate-fade-in-up">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
              <span className="text-4xl font-bold bg-gradient-to-br from-cyan-300 to-blue-100 bg-clip-text text-transparent">S</span>
            </div>
            <h1 className="text-5xl font-bold mb-3">SARA</h1>
            <p className="text-xl text-blue-200 mb-2">CRM Inmobiliario con IA</p>
            <p className="text-blue-300/70 text-sm max-w-sm mx-auto">Gestiona leads, automatiza seguimiento y cierra mas ventas con inteligencia artificial</p>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm animate-fade-in-up">
            {/* Mobile branding */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold">S</span>
              </div>
              <h1 className="text-3xl font-bold">SARA</h1>
              <p className="text-slate-400 text-sm mt-1">CRM Inmobiliario con IA</p>
            </div>

            {/* Login card */}
            <div className="bg-slate-800/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 shadow-2xl">
              <div className="hidden lg:block mb-6">
                <h2 className="text-2xl font-bold">Bienvenido</h2>
                <p className="text-slate-400 text-sm mt-1">Ingresa con tu numero de WhatsApp</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2 font-medium">Numero de WhatsApp</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="tel"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder="5610016226"
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/60 rounded-xl border border-slate-600/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all text-white placeholder:text-slate-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    />
                  </div>
                </div>
                {loginError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <span>!</span> {loginError}
                  </div>
                )}
                <button
                  onClick={handleLogin}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/25 active:scale-[0.98]"
                >
                  Entrar
                </button>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-slate-500 text-xs mt-6">
              Powered by <span className="text-slate-400">Grupo Santa Rita</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // GLOBAL SEARCH — Results computation
  // ═══════════════════════════════════════════════════════════
  const globalSearchResults = (() => {
    if (!globalSearch || globalSearch.length < 2) return { leads: [], properties: [], team: [], appointments: [] }
    const q = globalSearch.toLowerCase()
    return {
      leads: leads.filter(l =>
        l.name?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.property_interest?.toLowerCase().includes(q)
      ).slice(0, 5),
      properties: properties.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        (p as any).development_name?.toLowerCase().includes(q) ||
        (p as any).development?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q)
      ).slice(0, 5),
      team: team.filter(t =>
        t.name?.toLowerCase().includes(q) ||
        t.phone?.includes(q)
      ).slice(0, 5),
      appointments: filteredAppointments.filter(a =>
        a.lead_name?.toLowerCase().includes(q) ||
        a.property_name?.toLowerCase().includes(q)
      ).slice(0, 5)
    }
  })()
  const hasSearchResults = globalSearchResults.leads.length + globalSearchResults.properties.length + globalSearchResults.team.length + globalSearchResults.appointments.length > 0

  // ═══════════════════════════════════════════════════════════
  // SKELETON COMPONENTS
  // ═══════════════════════════════════════════════════════════
  const SkeletonBlock = ({ h = '1rem', w = '100%' }: { h?: string; w?: string }) => (
    <div className="skeleton" style={{ height: h, width: w }} />
  )

  const SkeletonDashboard = () => (
    <div className="space-y-6 animate-fade-in-up">
      <SkeletonBlock h="2rem" w="40%" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-slate-800/50 rounded-xl p-4 space-y-3 border border-slate-700/50">
            <SkeletonBlock h="0.75rem" w="60%" />
            <SkeletonBlock h="2rem" w="40%" />
            <SkeletonBlock h="0.5rem" w="80%" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 rounded-xl p-4 space-y-3 border border-slate-700/50">
          <SkeletonBlock h="1rem" w="30%" />
          <SkeletonBlock h="12rem" w="100%" />
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 space-y-3 border border-slate-700/50">
          <SkeletonBlock h="1rem" w="30%" />
          {[1,2,3,4].map(i => <SkeletonBlock key={i} h="2rem" w="100%" />)}
        </div>
      </div>
    </div>
  )

  const SkeletonTable = () => (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex justify-between">
        <SkeletonBlock h="2rem" w="30%" />
        <SkeletonBlock h="2rem" w="15%" />
      </div>
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="p-3 border-b border-slate-700/50 flex gap-4">
          {[1,2,3,4,5].map(i => <SkeletonBlock key={i} h="0.75rem" w="15%" />)}
        </div>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="p-3 border-b border-slate-700/30 flex gap-4">
            <SkeletonBlock h="0.75rem" w="20%" />
            <SkeletonBlock h="0.75rem" w="15%" />
            <SkeletonBlock h="0.75rem" w="10%" />
            <SkeletonBlock h="0.75rem" w="12%" />
            <SkeletonBlock h="0.75rem" w="18%" />
          </div>
        ))}
      </div>
    </div>
  )

  const SkeletonCards = () => (
    <div className="space-y-4 animate-fade-in-up">
      <SkeletonBlock h="2rem" w="30%" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
            <SkeletonBlock h="8rem" w="100%" />
            <div className="p-4 space-y-2">
              <SkeletonBlock h="1rem" w="70%" />
              <SkeletonBlock h="0.75rem" w="50%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const SkeletonCalendar = () => (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex justify-between">
        <SkeletonBlock h="2rem" w="30%" />
        <SkeletonBlock h="2rem" w="20%" />
      </div>
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-2">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {[1,2,3,4,5,6,7].map(i => <SkeletonBlock key={i} h="0.75rem" />)}
        </div>
        {[1,2,3,4,5].map(row => (
          <div key={row} className="grid grid-cols-7 gap-2">
            {[1,2,3,4,5,6,7].map(col => <SkeletonBlock key={col} h="4rem" />)}
          </div>
        ))}
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  // CALENDAR HELPERS — Month grid
  // ═══════════════════════════════════════════════════════════
  const getCalendarDays = (month: Date) => {
    const year = month.getFullYear()
    const m = month.getMonth()
    const firstDay = new Date(year, m, 1)
    const lastDay = new Date(year, m + 1, 0)
    // Start from Monday of the week containing the 1st
    let startDate = new Date(firstDay)
    const dayOfWeek = startDate.getDay()
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startDate.setDate(startDate.getDate() - mondayOffset)

    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = []
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      const dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      days.push({
        date: d,
        isCurrentMonth: d.getMonth() === m,
        isToday: dStr === todayStr
      })
    }
    return days
  }

  const appointmentsByDay = (() => {
    const map = new Map<string, Appointment[]>()
    filteredAppointments.forEach(a => {
      if (!a.scheduled_date) return
      const key = a.scheduled_date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(a)
    })
    return map
  })()

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 sidebar-backdrop z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Botón hamburguesa móvil */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-slate-800 rounded-lg"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 p-6 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Branding */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 animate-gradient rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">S</div>
          <div>
            <h1 className="text-xl font-bold leading-tight">SARA</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">CRM Inmobiliario</p>
          </div>
        </div>

        {/* User card */}
        {currentUser && (
          <div className="mt-4 mb-2 bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{currentUser.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={currentUser.role}
                    onChange={(e) => {
                      const newRole = e.target.value as any
                      setCurrentUser({ ...currentUser, role: newRole })
                      if (newRole === 'agencia') setView('marketing')
                      else if (newRole === 'asesor') setView('mortgage')
                      else setView('dashboard')
                    }}
                    className="text-[11px] px-1.5 py-0.5 bg-blue-500/15 text-blue-400 border border-blue-500/20 rounded-md cursor-pointer font-medium"
                    title="Cambiar rol para testing"
                  >
                    <option value="admin">Admin</option>
                    <option value="vendedor">Vendedor</option>
                    <option value="agencia">Marketing</option>
                    <option value="coordinador">Coordinador</option>
                    <option value="asesor">Asesor</option>
                  </select>
                </div>
              </div>
              <button onClick={() => { setCurrentUser(null); localStorage.removeItem('sara_user_phone') }} className="text-xs p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Cerrar sesion">
                <LogOut size={14} />
              </button>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto mt-2 space-y-0.5">
          {/* PRINCIPAL */}
          <p className="sidebar-label">Principal</p>
          {permisos.puedeVerSeccion('dashboard') && (
            <button onClick={() => { setView('dashboard'); setSidebarOpen(false); }} className={`sidebar-item ${view === 'dashboard' ? 'sidebar-item-active' : 'text-slate-400'}`}>
              <TrendingUp size={18} /> Dashboard
            </button>
          )}
          {permisos.puedeVerSeccion('leads') && (
            <button onClick={() => { setView('leads'); setSidebarOpen(false); }} className={`sidebar-item ${view === 'leads' ? 'sidebar-item-active' : 'text-slate-400'}`}>
              <Users size={18} /> Leads
            </button>
          )}
          {permisos.puedeVerSeccion('properties') && (
            <button onClick={() => { setView('properties'); setSidebarOpen(false); }} className={`sidebar-item ${view === 'properties' ? 'sidebar-item-active' : 'text-slate-400'}`}>
              <Building size={18} /> Propiedades
            </button>
          )}

          {/* VENTAS */}
          <p className="sidebar-label">Ventas</p>
          {permisos.puedeVerSeccion('coordinator') && (
            <button onClick={() => { setView('coordinator'); setSidebarOpen(false); }} className={`sidebar-item ${view === 'coordinator' ? 'sidebar-item-active' : 'text-slate-400'}`}>
              <Phone size={18} /> Coordinador
            </button>
          )}
          {permisos.puedeVerSeccion('calendar') && (
            <button onClick={() => { setView('calendar'); setSidebarOpen(false); }} className={`sidebar-item ${view === 'calendar' ? 'sidebar-item-active' : 'text-slate-400'}`}>
              <CalendarIcon size={18} /> Calendario
            </button>
          )}
          {permisos.puedeVerSeccion('followups') && (
            <button onClick={() => { setView('followups'); setSidebarOpen(false); }} className={`sidebar-item ${view === 'followups' ? 'sidebar-item-active' : 'text-slate-400'}`}>
              <Clock size={18} /> Seguimientos
            </button>
          )}
          {permisos.puedeVerSeccion('mortgage') && (
            <button onClick={() => { setView('mortgage'); setSidebarOpen(false); }} className={`sidebar-item ${view === 'mortgage' ? 'sidebar-item-active' : 'text-slate-400'}`}>
              <CreditCard size={18} /> Hipotecas
              {mortgages.filter(m => getDaysInStatus(m) > 3 && !['approved', 'rejected', 'cancelled'].includes(m.status)).length > 0 && (
                <span className="ml-auto bg-red-500/20 text-red-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full badge-pulse">
                  {mortgages.filter(m => getDaysInStatus(m) > 3 && !['approved', 'rejected', 'cancelled'].includes(m.status)).length}
                </span>
              )}
            </button>
          )}

          {/* COMUNICACION */}
          <p className="sidebar-label">Comunicacion</p>
          {permisos.puedeVerSeccion('mensajes') && (
            <button onClick={() => { setView('mensajes'); setSidebarOpen(false); }} className={`sidebar-item ${view === 'mensajes' ? 'sidebar-item-active' : 'text-slate-400'}`}>
              <MessageSquare size={18} /> Mensajes
            </button>
          )}
          {permisos.puedeVerSeccion('encuestas') && (
            <button onClick={() => { setView('encuestas'); setSidebarOpen(false); }} className={`sidebar-item ${view === 'encuestas' ? 'sidebar-item-active' : 'text-slate-400'}`}>
              <Star size={18} /> Encuestas
            </button>
          )}
          {permisos.puedeVerSeccion('referrals') && (
            <button onClick={() => { setView('referrals'); setSidebarOpen(false); }} className={`sidebar-item ${view === 'referrals' ? 'sidebar-item-active' : 'text-slate-400'}`}>
              <Gift size={18} /> Referidos
              {leads.filter(l => l.source === 'referral').length > 0 && (
                <span className="ml-auto bg-pink-500/20 text-pink-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                  {leads.filter(l => l.source === 'referral').length}
                </span>
              )}
            </button>
          )}

          {/* INTELIGENCIA */}
          <p className="sidebar-label">Inteligencia</p>
          {permisos.puedeVerSeccion('reportes') && (
            <button onClick={() => { setView('reportes'); setSidebarOpen(false); }} className={`sidebar-item ${view === 'reportes' ? 'sidebar-item-active' : 'text-slate-400'}`}>
              <BarChart3 size={18} /> Reportes CEO
            </button>
          )}
          {permisos.puedeVerSeccion('bi') && (
            <button onClick={() => { setView('bi'); setSidebarOpen(false); }} className={`sidebar-item ${view === 'bi' ? 'sidebar-item-active' : 'text-slate-400'}`}>
              <Lightbulb size={18} /> Inteligencia Comercial
            </button>
          )}
          {permisos.puedeVerSeccion('marketing') && (
            <button onClick={() => { setView('marketing'); setSidebarOpen(false); }} className={`sidebar-item ${view === 'marketing' ? 'sidebar-item-active' : 'text-slate-400'}`}>
              <Megaphone size={18} /> Marketing
            </button>
          )}

          {/* ADMIN */}
          <p className="sidebar-label">Admin</p>
          {permisos.puedeVerSeccion('team') && (
            <button onClick={() => { setView('team'); setSidebarOpen(false); }} className={`sidebar-item ${view === 'team' ? 'sidebar-item-active' : 'text-slate-400'}`}>
              <UserCheck size={18} /> Equipo
            </button>
          )}
          {permisos.puedeVerSeccion('goals') && (
            <button onClick={() => { setView('goals'); setSidebarOpen(false); }} className={`sidebar-item ${view === 'goals' ? 'sidebar-item-active' : 'text-slate-400'}`}>
              <Target size={18} /> Metas
            </button>
          )}
          {permisos.puedeVerSeccion('promotions') && (
            <button onClick={() => { setView('promotions'); setSidebarOpen(false); }} className={`sidebar-item ${view === 'promotions' ? 'sidebar-item-active' : 'text-slate-400'}`}>
              <Gift size={18} /> Promociones
              {promotions.filter(p => p.status === 'active').length > 0 && (
                <span className="ml-auto bg-purple-500/20 text-purple-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full badge-pulse">
                  {promotions.filter(p => p.status === 'active').length}
                </span>
              )}
            </button>
          )}
          {permisos.puedeVerSeccion('events') && (
            <button onClick={() => { setView('events'); setSidebarOpen(false); }} className={`sidebar-item ${view === 'events' ? 'sidebar-item-active' : 'text-slate-400'}`}>
              <CalendarIcon size={18} /> Eventos
              {crmEvents.filter(e => e.status === 'upcoming').length > 0 && (
                <span className="ml-auto bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full badge-pulse">
                  {crmEvents.filter(e => e.status === 'upcoming').length}
                </span>
              )}
            </button>
          )}
          {permisos.puedeVerSeccion('config') && (
            <button onClick={() => { setView('config'); setSidebarOpen(false); }} className={`sidebar-item ${view === 'config' ? 'sidebar-item-active' : 'text-slate-400'}`}>
              <Settings size={18} /> Configuracion
            </button>
          )}
        </nav>
      </div>

      <div className="flex-1 p-4 pt-16 lg:p-8 lg:pt-8 overflow-auto">
        {/* Search button — fixed top-right */}
        <button
          onClick={() => { setShowGlobalSearch(true); setGlobalSearch('') }}
          className="fixed top-4 right-4 z-30 hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg text-slate-400 text-sm hover:bg-slate-700/80 hover:text-white transition-all backdrop-blur-sm"
        >
          <Search size={14} />
          <span>Buscar...</span>
          <kbd className="ml-2 px-1.5 py-0.5 text-[10px] bg-slate-700 rounded border border-slate-600">⌘K</kbd>
        </button>
        {/* Mobile search button */}
        <button
          onClick={() => { setShowGlobalSearch(true); setGlobalSearch('') }}
          className="fixed top-4 right-4 z-30 lg:hidden p-2 bg-slate-800 rounded-lg"
        >
          <Search size={16} className="text-slate-400" />
        </button>

        {/* ═══ GLOBAL SEARCH OVERLAY ═══ */}
        {showGlobalSearch && (
          <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]" onClick={() => { setShowGlobalSearch(false); setGlobalSearch('') }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
              className="relative w-full max-w-lg mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up"
              onClick={e => e.stopPropagation()}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/60">
                <Search size={18} className="text-slate-400 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={globalSearch}
                  onChange={e => setGlobalSearch(e.target.value)}
                  placeholder="Buscar leads, propiedades, equipo, citas..."
                  className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
                />
                <kbd className="px-1.5 py-0.5 text-[10px] text-slate-500 bg-slate-800 rounded border border-slate-700">ESC</kbd>
              </div>

              {/* Results */}
              <div className="max-h-[50vh] overflow-y-auto">
                {globalSearch.length < 2 && (
                  <div className="px-4 py-8 text-center text-slate-500 text-sm">Escribe al menos 2 caracteres para buscar</div>
                )}
                {globalSearch.length >= 2 && !hasSearchResults && (
                  <div className="px-4 py-8 text-center text-slate-500 text-sm">No se encontraron resultados</div>
                )}
                {/* Leads results */}
                {globalSearchResults.leads.length > 0 && (
                  <div className="p-2">
                    <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Leads</p>
                    {globalSearchResults.leads.map(lead => (
                      <button
                        key={lead.id}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors text-left"
                        onClick={() => { setSelectedLead(lead); setShowGlobalSearch(false); setGlobalSearch('') }}
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <Users size={14} className="text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{lead.name || 'Sin nombre'}</p>
                          <p className="text-xs text-slate-400 truncate">{lead.phone} · {STATUS_LABELS[lead.status] || lead.status}</p>
                        </div>
                        {lead.score > 0 && <span className="text-xs text-amber-400 font-medium">{lead.score}pts</span>}
                      </button>
                    ))}
                  </div>
                )}
                {/* Properties results */}
                {globalSearchResults.properties.length > 0 && (
                  <div className="p-2 border-t border-slate-800">
                    <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Propiedades</p>
                    {globalSearchResults.properties.map(prop => (
                      <button
                        key={prop.id}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors text-left"
                        onClick={() => { setView('properties'); setShowGlobalSearch(false); setGlobalSearch('') }}
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <Building size={14} className="text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{prop.name}</p>
                          <p className="text-xs text-slate-400 truncate">{(prop as any).development_name || prop.city || ''} · ${(prop.price || 0).toLocaleString()}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {/* Team results */}
                {globalSearchResults.team.length > 0 && (
                  <div className="p-2 border-t border-slate-800">
                    <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Equipo</p>
                    {globalSearchResults.team.map(member => (
                      <button
                        key={member.id}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors text-left"
                        onClick={() => { setView('team'); setShowGlobalSearch(false); setGlobalSearch('') }}
                      >
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <UserCheck size={14} className="text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{member.name}</p>
                          <p className="text-xs text-slate-400 truncate">{member.role} · {member.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {/* Appointment results */}
                {globalSearchResults.appointments.length > 0 && (
                  <div className="p-2 border-t border-slate-800">
                    <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Citas</p>
                    {globalSearchResults.appointments.map(apt => (
                      <button
                        key={apt.id}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors text-left"
                        onClick={() => { setView('calendar'); setShowGlobalSearch(false); setGlobalSearch('') }}
                      >
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <CalendarIcon size={14} className="text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{apt.lead_name}</p>
                          <p className="text-xs text-slate-400 truncate">{apt.scheduled_date} {apt.scheduled_time} · {apt.property_name || ''}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div key={view} className="section-enter">
        {view === 'dashboard' && (loading ? <SkeletonDashboard /> :
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

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* DASHBOARD PERSONALIZADO POR ROL */}
            {/* ═══════════════════════════════════════════════════════════ */}

            {/* ══════ DASHBOARD ADMIN ══════ */}
            {currentUser?.role === 'admin' && (() => {
              const now = new Date()
              const currentMonth = now.toISOString().slice(0, 7)
              const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)
              const diasTranscurridos = now.getDate()
              const diasEnMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
              const diasRestantes = diasEnMes - diasTranscurridos

              // Ventas del mes
              const ventasDelMes = leads.filter(l =>
                ['closed', 'delivered', 'sold'].includes(l.status) &&
                l.status_changed_at?.startsWith(currentMonth)
              )
              const ventasMesAnterior = leads.filter(l =>
                ['closed', 'delivered', 'sold'].includes(l.status) &&
                l.status_changed_at?.startsWith(prevMonth)
              ).length
              const metaMes = monthlyGoals.company_goal || 0
              const porcentajeMeta = metaMes > 0 ? Math.round((ventasDelMes.length / metaMes) * 100) : 0
              const cambioVsMesAnterior = ventasMesAnterior > 0
                ? Math.round(((ventasDelMes.length - ventasMesAnterior) / ventasMesAnterior) * 100)
                : 0

              // Pipeline y revenue
              const leadsActivos = leads.filter(l => !['closed', 'delivered', 'sold', 'lost', 'inactive'].includes(l.status))
              const pipelineValue = leadsActivos.reduce((sum, l) => sum + (Number(l.budget) || 0), 0)
              const revenueDelMes = ventasDelMes.reduce((sum, l) => sum + (Number(l.budget) || 0), 0)

              // Leads HOT (negociación + reservado)
              const leadsHot = leads.filter(l => ['negotiation', 'reserved'].includes(l.status))
              const valorLeadsHot = leadsHot.reduce((sum, l) => sum + (Number(l.budget) || 0), 0)

              // Proyección
              const ventasProyectadas = diasTranscurridos > 0 ? Math.round((ventasDelMes.length / diasTranscurridos) * diasEnMes) : 0
              const revenueProyectado = diasTranscurridos > 0 ? Math.round((revenueDelMes / diasTranscurridos) * diasEnMes) : 0

              // Leads del mes
              const leadsDelMes = leads.filter(l => l.created_at?.startsWith(currentMonth)).length
              const leadsNuevosSinContactar = leads.filter(l => l.status === 'new').length

              // Leads estancados (+5 días)
              const leadsEstancados = leads.filter(l => {
                if (['closed', 'delivered', 'sold', 'lost', 'inactive'].includes(l.status)) return false
                const dias = l.status_changed_at ? Math.floor((now.getTime() - new Date(l.status_changed_at).getTime()) / 86400000) : 999
                return dias > 5
              })

              // Conversión general
              const totalLeads = leads.length
              const totalVentas = leads.filter(l => ['closed', 'delivered', 'sold'].includes(l.status)).length
              const tasaConversion = totalLeads > 0 ? ((totalVentas / totalLeads) * 100).toFixed(1) : '0'

              // Ranking vendedores
              const vendedoresRanking = team
                .filter(t => t.role === 'vendedor')
                .map(v => {
                  const ventasV = leads.filter(l =>
                    l.assigned_to === v.id &&
                    ['closed', 'delivered', 'sold'].includes(l.status) &&
                    l.status_changed_at?.startsWith(currentMonth)
                  ).length
                  const metaV = vendorGoals.find(g => g.vendor_id === v.id)?.goal || 0
                  const leadsV = leads.filter(l => l.assigned_to === v.id && !['closed', 'delivered', 'sold', 'lost', 'inactive'].includes(l.status)).length
                  return { ...v, ventas: ventasV, meta: metaV, leads: leadsV, pct: metaV > 0 ? Math.round((ventasV / metaV) * 100) : 0 }
                })
                .sort((a, b) => b.ventas - a.ventas)

              // Por fuente
              const porFuente: Record<string, { leads: number, ventas: number }> = {}
              leads.filter(l => l.created_at?.startsWith(currentMonth)).forEach(l => {
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
              leads.forEach(l => {
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
                new: leads.filter(l => l.status === 'new').length,
                contacted: leads.filter(l => l.status === 'contacted').length,
                scheduled: leads.filter(l => l.status === 'scheduled').length,
                visited: leads.filter(l => l.status === 'visited').length,
                negotiation: leads.filter(l => l.status === 'negotiation').length,
                reserved: leads.filter(l => l.status === 'reserved').length,
                closed: leads.filter(l => ['closed', 'delivered', 'sold'].includes(l.status)).length
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
                      <p className={`text-3xl font-bold ${estadoMeta === 'good' ? 'text-green-400' : estadoMeta === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
                        {ventasDelMes.length}/{metaMes || '?'}
                      </p>
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
                    <div className={`kpi-card rounded-xl p-4 border ${leads.filter(l => l.source === 'phone_inbound' && l.created_at?.startsWith(currentMonth)).length > 0 ? 'bg-orange-900/20 border-orange-500/40' : 'bg-slate-800/50 border-slate-600/30'}`}>
                      <p className="text-[11px] font-medium text-slate-400 mb-1">LLAMADAS 📞</p>
                      <p className="text-3xl font-bold text-orange-400">{leads.filter(l => l.source === 'phone_inbound' && l.created_at?.startsWith(currentMonth)).length}</p>
                      <p className="text-xs text-slate-400 mt-2">{leads.filter(l => l.source === 'phone_inbound').length} total</p>
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

                    {/* Funnel resumen */}
                    <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-4">
                      <h3 className="font-semibold mb-2">📊 Funnel General</h3>
                      <div className="flex items-center gap-1">
                        {[
                          { label: 'Nuevos', count: funnel.new, color: 'bg-blue-500' },
                          { label: 'Contactado', count: funnel.contacted, color: 'bg-cyan-500' },
                          { label: 'Cita', count: funnel.scheduled, color: 'bg-purple-500' },
                          { label: 'Visita', count: funnel.visited, color: 'bg-pink-500' },
                          { label: 'Negoc', count: funnel.negotiation, color: 'bg-orange-500' },
                          { label: 'Reserv', count: funnel.reserved, color: 'bg-yellow-500' },
                          { label: 'Cerrado', count: funnel.closed, color: 'bg-green-500' }
                        ].map((s, i) => (
                          <div key={i} className="flex-1 text-center">
                            <div className={`${s.color} funnel-bar rounded py-1 text-sm font-bold`} style={{ animationDelay: `${i * 0.08}s` }}>{s.count}</div>
                            <p className="text-[10px] mt-0.5 text-slate-400">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Ranking vendedores */}
                  <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-4">
                    <h3 className="font-semibold mb-3">🏆 Ranking Vendedores</h3>
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
                  </div>

                  {/* Por fuente y Por desarrollo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Por fuente */}
                    <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-4">
                      <h3 className="font-semibold mb-3">📣 Por Fuente (mes)</h3>
                      <div className="space-y-2">
                        {fuentes.slice(0, 5).map((f, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="flex-1 h-6 bg-slate-700 rounded-full overflow-hidden relative">
                              <div
                                className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                                style={{ width: `${Math.max(10, (f.leads / (fuentes[0]?.leads || 1)) * 100)}%` }}
                              />
                              <span className="absolute inset-0 flex items-center justify-between px-2 text-xs">
                                <span>{sourceLabel(f.name)}</span>
                                <span>{f.leads} • {f.conv}%</span>
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
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                style={{ width: `${Math.max(10, (d.ventas / (desarrollos[0]?.ventas || 1)) * 100)}%` }}
                              />
                              <span className="absolute inset-0 flex items-center justify-between px-2 text-xs">
                                <span className="truncate">{d.name}</span>
                                <span>{d.ventas} ventas</span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

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
        )}

        {view === 'leads' && (loading ? <SkeletonTable /> :
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Leads ({filteredLeads.length})</h2>
              <div className="flex gap-4 items-center">
                <div className="flex gap-2">
                  <button onClick={() => setLeadViewMode('list')} className={`px-3 py-1 rounded-lg text-sm ${leadViewMode === 'list' ? 'bg-blue-600' : 'bg-slate-700'}`}>Lista</button>
                  <button onClick={() => setLeadViewMode('funnel')} className={`px-3 py-1 rounded-lg text-sm ${leadViewMode === 'funnel' ? 'bg-blue-600' : 'bg-slate-700'}`}>Funnel</button>
                </div>
                {permisos.puedeCrearLead() && (
                  <button onClick={() => setShowNewLead(true)} className="bg-green-600 px-4 py-2 rounded-xl hover:bg-green-700 flex items-center gap-2">
                    <Plus size={20} /> Agregar Lead
                  </button>
                )}
                {permisos.puedeVerLeadsReadOnly() && (
                  <span className="text-xs text-slate-400 bg-slate-700 px-3 py-2 rounded-lg">👁️ Solo lectura</span>
                )}
              </div>
              <div className="flex gap-2">
                <span className="bg-red-500 px-3 py-1 rounded-full text-sm">HOT ({hotLeads})</span>
                <span className="bg-orange-500 px-3 py-1 rounded-full text-sm">WARM ({warmLeads})</span>
                <span className="bg-blue-500 px-3 py-1 rounded-full text-sm">COLD ({coldLeads})</span>
              </div>
            </div>

            {leadViewMode === 'funnel' ? (
              <div className="grid grid-cols-4 lg:grid-cols-9 gap-2">
                {[
                  { key: 'new', label: 'Nuevo', color: 'bg-slate-600' },
                  { key: 'contacted', label: 'Contactado', color: 'bg-blue-600' },
                  { key: 'scheduled', label: 'Cita', color: 'bg-cyan-600' },
                  { key: 'visited', label: 'Visitó', color: 'bg-purple-600' },
                  { key: 'negotiation', label: 'Negociación', color: 'bg-yellow-600' },
                  { key: 'reserved', label: 'Reservado', color: 'bg-orange-600' },
                  { key: 'closed', label: 'Cerrado', color: 'bg-green-600' },
                  { key: 'delivered', label: 'Entregado', color: 'bg-emerald-500' },
                  { key: 'fallen', label: 'Caídos', color: 'bg-red-600' }
                ].map(stage => {
                  const stageLeads = filteredLeads.filter(l => l.status === stage.key)
                  return (
                    <div 
                      key={stage.key} 
                      className="bg-slate-800/50 rounded-xl p-2 min-h-[200px] border-2 border-dashed border-slate-600"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={async (e) => {
                        e.preventDefault()
                        if (draggedLead && draggedLead.status !== stage.key && permisos.puedeCambiarStatusLead(draggedLead)) {
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
                      <div className="space-y-1">
                        {stageLeads.map(lead => (
                          <div 
                            key={lead.id} 
                            className="bg-slate-700 p-2 rounded hover:bg-slate-600"
                          >
                            <p onClick={() => selectLead(lead)} className="font-semibold text-xs truncate cursor-pointer" title={lead.name || 'Sin nombre'}>{lead.name || 'Sin nombre'}</p>
                            <p className="text-xs text-slate-400">...{lead.phone?.slice(-4)}</p>
                            <select
                              value={lead.status}
                              disabled={!permisos.puedeCambiarStatusLead(lead)}
                              onChange={(e) => {
                                if (e.target.value !== lead.status && permisos.puedeCambiarStatusLead(lead)) {
                                  setStatusChange({lead, newStatus: e.target.value})
                                  setStatusNote('')
                                }
                              }}
                              className={`w-full mt-1 p-1 text-xs bg-slate-600 rounded border-none ${!permisos.puedeCambiarStatusLead(lead) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <option value="new">Nuevo</option>
                              <option value="contacted">Contactado</option>
                              <option value="scheduled">Cita</option>
                              <option value="visited">Visitó</option>
                              <option value="negotiation">Negociación</option>
                              <option value="reserved">Reservado</option>
                              <option value="closed">Cerrado</option>
                              <option value="delivered">Entregado</option>
                              <option value="fallen">Caído</option>
                            </select>
                            {stage.key === 'fallen' && lead.fallen_reason && (
                              <p className="text-xs text-red-300 mt-1 truncate" title={lead.fallen_reason}>📌 {lead.fallen_reason}</p>
                            )}
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
                <thead className="bg-slate-700 sticky top-0 z-10">
                  <tr>
                    {[
                      { col: 'name', label: 'Nombre', hide: '' },
                      { col: 'phone', label: 'Teléfono', hide: 'hidden sm:table-cell' },
                      { col: 'property_interest', label: 'Interés', hide: 'hidden md:table-cell' },
                      { col: 'score', label: 'Score', hide: '' },
                      { col: 'status', label: 'Estado', hide: '' },
                      { col: 'created_at', label: 'Fecha', hide: 'hidden lg:table-cell' },
                    ].map(h => (
                      <th key={h.col} className={`text-left p-4 cursor-pointer select-none hover:text-blue-400 ${h.hide}`} onClick={() => setLeadSort(prev => ({ col: h.col, asc: prev.col === h.col ? !prev.asc : true }))}>
                        {h.label} {leadSort.col === h.col ? (leadSort.asc ? '↑' : '↓') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filteredLeads].sort((a: any, b: any) => {
                    const va = a[leadSort.col] ?? ''
                    const vb = b[leadSort.col] ?? ''
                    const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb))
                    return leadSort.asc ? cmp : -cmp
                  }).map(lead => (
                    <tr key={lead.id} onClick={() => selectLead(lead)} className="lead-row border-b border-slate-700/50 cursor-pointer">
                      <td className="p-4">{lead.name || 'Sin nombre'}</td>
                      <td className="p-4 hidden sm:table-cell"><Phone size={16} className="inline mr-1" />{lead.phone}</td>
                      <td className="p-4 hidden md:table-cell">{lead.property_interest || 'Sin definir'}</td>
                      <td className="p-4">
                        <span className={`${getScoreColor(lead.score)} px-2 py-1 rounded text-sm`}>
                          {getScoreLabel(lead.score)} ({lead.score})
                        </span>
                      </td>
                      <td className="p-4">{STATUS_LABELS[lead.status] || lead.status}</td>
                      <td className="p-4 hidden lg:table-cell">{lead.created_at ? new Date(lead.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '-'}</td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && (
                    <tr><td colSpan={6} className="p-12 text-center empty-state">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700/50 mb-3">
                        <span className="text-4xl">🔍</span>
                      </div>
                      <p className="text-slate-400">No se encontraron leads con los filtros actuales</p>
                      <p className="text-slate-500 text-sm mt-1">Intenta cambiar los filtros de busqueda</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
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
                    <button disabled={saving} onClick={async () => {
                      if (!newLead.name || !newLead.phone) { showToast('Nombre y teléfono requeridos', 'error'); return }
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
        )}

        {view === 'properties' && (loading ? <SkeletonCards /> :
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Propiedades ({properties.length})</h2>
              {permisos.puedeEditarPropiedades() ? (
                <button onClick={() => setShowNewProperty(true)} className="bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2">
                  <Plus size={20} /> Agregar Propiedad
                </button>
              ) : (
                <span className="text-xs text-slate-400 bg-slate-700 px-3 py-2 rounded-lg">👁️ Solo lectura</span>
              )}
            </div>
            {properties.length === 0 ? (
              <div className="empty-state text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-700/50 mb-4">
                  <span className="text-5xl">🏠</span>
                </div>
                <p className="text-slate-300 text-xl mb-2">No hay propiedades</p>
                <p className="text-slate-500 text-sm mb-4">Agrega tu primer desarrollo para empezar</p>
                {permisos.puedeEditarPropiedades() && (
                  <button onClick={() => setShowNewProperty(true)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold">
                    Agregar Primera Propiedad
                  </button>
                )}
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map(prop => (
                <div key={prop.id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden group relative hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-200">
                  <div className="property-image-container h-40 bg-slate-700 flex items-center justify-center">
                    {prop.photo_url ? (
                      <img src={prop.photo_url} alt={prop.name} className="w-full h-full object-cover" />
                    ) : prop.youtube_link ? (
                      <img src={getYoutubeThumbnail(prop.youtube_link) || ''} alt={prop.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building size={48} className="text-slate-400" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1">{prop.name}</h3>
                    <p className="text-xs text-slate-400 mb-2">{prop.development || ''} - {prop.city || ''}</p>
                    <p className="text-2xl font-bold text-green-400 bg-green-500/20 p-2 rounded-xl mb-2">${(prop.price || 0).toLocaleString('es-MX')}</p>
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
                  {permisos.puedeEditarPropiedades() && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button onClick={() => setEditingProperty(prop)} className="bg-blue-600 p-2 rounded-xl hover:bg-blue-700">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => deleteProperty(prop.id)} className="bg-red-600 p-2 rounded-xl hover:bg-red-700">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {view === 'team' && (loading ? <SkeletonCards /> :
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Equipo ({team.length})</h2>
              {permisos.puedeEditarEquipo() ? (
                <button onClick={() => setShowNewMember(true)} className="bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2">
                  <Plus size={20} /> Agregar Miembro
                </button>
              ) : (
                <span className="text-xs text-slate-400 bg-slate-700 px-3 py-2 rounded-lg">👁️ Solo lectura</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
                <h3 className="text-xl font-semibold mb-4">Vendedores</h3>
                <div className="space-y-3">
                  {team.filter(t => t.role === 'vendedor').map(member => (
                    <div key={member.id} className="team-card flex items-center justify-between bg-slate-700 p-4 rounded-xl group">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
                          <Users size={24} className="text-blue-400" />
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-700 ${member.active ? 'bg-green-400 online-indicator' : 'bg-slate-500'}`} />
                        </div>
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">Vendedor</span>
                            <span className="text-slate-500 text-xs">{member.phone}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-green-400 bg-green-500/20 p-2 rounded-xl font-bold">{member.sales_count || 0} ventas</p>
                        </div>
                        {permisos.puedeEditarEquipo() && (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                            <button onClick={() => setEditingMember(member)} className="bg-blue-600 p-2 rounded-xl hover:bg-blue-700">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => deleteMember(member.id)} className="bg-red-600 p-2 rounded-xl hover:bg-red-700">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {team.filter(t => t.role === 'vendedor').length === 0 && (
                    <div className="empty-state text-center py-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-600/50 mb-2"><span className="text-2xl">👔</span></div>
                      <p className="text-slate-400 text-sm">Sin vendedores registrados</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
                <h3 className="text-xl font-semibold mb-4">Asesores Hipotecarios</h3>
                <div className="space-y-3">
                  {team.filter(t => t.role === 'asesor').map(member => (
                    <div key={member.id} className="team-card flex items-center justify-between bg-slate-700 p-4 rounded-xl group">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
                          <Users size={24} className="text-purple-400" />
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-700 ${member.active ? 'bg-green-400 online-indicator' : 'bg-slate-500'}`} />
                        </div>
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-medium">Asesor</span>
                            <span className="text-slate-500 text-xs">{member.phone}</span>
                          </div>
                        </div>
                      </div>
                      {permisos.puedeEditarEquipo() && (
                        <button onClick={() => setEditingMember(member)} className="opacity-0 group-hover:opacity-100 bg-blue-600 p-2 rounded-xl">
                          <Edit size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  {team.filter(t => t.role === 'asesor').length === 0 && (
                    <div className="empty-state text-center py-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-600/50 mb-2"><span className="text-2xl">🏦</span></div>
                      <p className="text-slate-400 text-sm">Sin asesores hipotecarios</p>
                    </div>
                  )}
                </div>
              </div>


              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
                <h3 className="text-xl font-semibold mb-4">Coordinadoras</h3>
                <div className="space-y-3">
                  {team.filter(t => t.role === "coordinador").map(member => (
                    <div key={member.id} className="team-card flex items-center justify-between bg-slate-700 p-4 rounded-xl group">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center">
                          <Users size={24} className="text-green-400" />
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-700 ${member.active ? 'bg-green-400 online-indicator' : 'bg-slate-500'}`} />
                        </div>
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">Coordinador</span>
                            <span className="text-slate-500 text-xs">{member.phone}</span>
                          </div>
                        </div>
                      </div>
                      {permisos.puedeEditarEquipo() && (
                        <button onClick={() => setEditingMember(member)} className="opacity-0 group-hover:opacity-100 bg-blue-600 p-2 rounded-xl">
                          <Edit size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  {team.filter(t => t.role === "coordinador").length === 0 && (
                    <div className="empty-state text-center py-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-600/50 mb-2"><span className="text-2xl">📋</span></div>
                      <p className="text-slate-400 text-sm">Sin coordinadoras</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
                <h3 className="text-xl font-semibold mb-4">Marketing / Agencia</h3>
                <div className="space-y-3">
                  {team.filter(t => t.role === 'agencia').map(member => (
                    <div key={member.id} className="team-card flex items-center justify-between bg-slate-700 p-4 rounded-xl group">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full bg-orange-600/20 flex items-center justify-center">
                          <Megaphone size={24} className="text-orange-400" />
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-700 ${member.active ? 'bg-green-400 online-indicator' : 'bg-slate-500'}`} />
                        </div>
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-medium">Marketing</span>
                            <span className="text-slate-500 text-xs">{member.phone}</span>
                          </div>
                        </div>
                      </div>
                      {permisos.puedeEditarEquipo() && (
                        <button onClick={() => setEditingMember(member)} className="opacity-0 group-hover:opacity-100 bg-blue-600 p-2 rounded-xl">
                          <Edit size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  {team.filter(t => t.role === 'agencia').length === 0 && (
                    <div className="empty-state text-center py-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-600/50 mb-2"><span className="text-2xl">📢</span></div>
                      <p className="text-slate-400 text-sm">Sin personal de marketing</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'mortgage' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Solicitudes Hipotecarias ({mortgages.length})</h2>
              {['admin', 'coordinador', 'asesor'].includes(currentUser?.role || '') ? (
                <button onClick={() => setShowNewMortgage(true)} className="bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2">
                  <Plus size={20} /> Nueva Solicitud
                </button>
              ) : (
                <span className="text-xs text-slate-400 bg-slate-700 px-3 py-2 rounded-lg">👁️ Solo lectura</span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {mortgageStatuses.map(status => {
                const StatusIcon = status.icon
                // Filtrar hipotecas: asesor solo ve las suyas, admin/coordinador ven todas
                const filteredMortgagesForRole = currentUser?.role === 'asesor'
                  ? mortgages.filter(m => m.assigned_advisor_id === currentUser.id)
                  : mortgages
                const statusMortgages = filteredMortgagesForRole.filter(m => m.status === status.key)
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
                          <div key={mortgage.id} onClick={() => permisos.puedeEditarHipoteca(mortgage) && setEditingMortgage(mortgage)} className={`bg-slate-700 p-3 rounded-xl relative ${permisos.puedeEditarHipoteca(mortgage) ? 'cursor-pointer hover:bg-gray-600' : 'opacity-70'}`}>
                            {daysInStatus > 3 && !['approved', 'rejected'].includes(mortgage.status) && (
                              <AlertTriangle className="absolute top-2 right-2 text-red-400 bg-red-500/20 p-2 rounded-xl" size={16} />
                            )}
                            <p className="font-semibold text-sm">{mortgage.lead_name}</p>
                            <p className="text-xs text-slate-400">{mortgage.property_name}</p>
                            <p className="text-xs text-slate-400 mt-1">${(mortgage.requested_amount || 0).toLocaleString('es-MX')}</p>
                            <p className="text-xs text-slate-400 mt-1">{daysInStatus}d en {status.label.toLowerCase()}</p>
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
              {permisos.puedeEditarMarketing() ? (
                <button onClick={() => setShowNewCampaign(true)} className="bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2">
                  <Plus size={20} /> Nueva Campaña
                </button>
              ) : (
                <span className="text-xs text-slate-400 bg-slate-700 px-3 py-2 rounded-lg">👁️ Solo lectura</span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 md:p-6 rounded-2xl hover:border-slate-600/50 transition-all">
                <p className="text-slate-400 text-xs md:text-sm mb-1">Presupuesto Total</p>
                <p className="text-lg md:text-2xl font-bold">${totalBudget.toLocaleString('es-MX')}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 md:p-6 rounded-2xl hover:border-slate-600/50 transition-all">
                <p className="text-slate-400 text-xs md:text-sm mb-1">Gastado</p>
                <p className="text-lg md:text-2xl font-bold text-orange-500">${totalSpent.toLocaleString('es-MX')}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 md:p-6 rounded-2xl hover:border-slate-600/50 transition-all">
                <p className="text-slate-400 text-xs md:text-sm mb-1">CPL Promedio</p>
                <p className="text-lg md:text-2xl font-bold">${avgCPL.toFixed(0)}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 md:p-6 rounded-2xl hover:border-slate-600/50 transition-all">
                <p className="text-slate-400 text-xs md:text-sm mb-1">ROI</p>
                <p className={`text-lg md:text-2xl font-bold ${roi >= 0 ? 'text-green-400 bg-green-500/20 p-1 md:p-2 rounded-xl' : 'text-red-400 bg-red-500/20 p-1 md:p-2 rounded-xl'}`}>{roi.toFixed(0)}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 md:p-6 rounded-2xl hover:border-slate-600/50 transition-all">
                <h3 className="text-lg md:text-xl font-semibold mb-4">Inversión vs Leads por Canal</h3>
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

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 md:p-6 rounded-2xl hover:border-slate-600/50 transition-all">
                <h3 className="text-lg md:text-xl font-semibold mb-4">Ingresos vs Inversión</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={roiByChannel}>
                    <XAxis dataKey="channel" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="spent" fill="#ef4444" name="Invertido" />
                    <Bar dataKey="revenue" fill="#22c55e" name="Ingresos" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-slate-700">
                  <tr>
                    {[
                      { col: 'name', label: 'Campaña' },
                      { col: 'channel', label: 'Canal' },
                      { col: 'spent', label: 'Gastado' },
                      { col: 'leads_generated', label: 'Leads' },
                      { col: 'cpl', label: 'CPL' },
                      { col: 'sales', label: 'Ventas' },
                      { col: 'roi', label: 'ROI' },
                      { col: 'status', label: 'Estado' },
                    ].map(h => (
                      <th key={h.col} className="text-left p-4 cursor-pointer select-none hover:text-blue-400" onClick={() => setCampSort(prev => ({ col: h.col, asc: prev.col === h.col ? !prev.asc : true }))}>
                        {h.label} {campSort.col === h.col ? (campSort.asc ? '↑' : '↓') : ''}
                      </th>
                    ))}
                    <th className="text-left p-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {[...campaigns].sort((a: any, b: any) => {
                    let va = a[campSort.col] ?? ''
                    let vb = b[campSort.col] ?? ''
                    if (campSort.col === 'cpl') { va = a.leads_generated > 0 ? a.spent / a.leads_generated : 0; vb = b.leads_generated > 0 ? b.spent / b.leads_generated : 0 }
                    if (campSort.col === 'roi') { va = a.spent > 0 ? (a.revenue_generated - a.spent) / a.spent : 0; vb = b.spent > 0 ? (b.revenue_generated - b.spent) / b.spent : 0 }
                    const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb))
                    return campSort.asc ? cmp : -cmp
                  }).map(campaign => {
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
                        <td className="p-4">${(campaign.spent || 0).toLocaleString('es-MX')}</td>
                        <td className="p-4">{campaign.leads_generated || 0}</td>
                        <td className="p-4">${cpl.toFixed(0)}</td>
                        <td className="p-4">{campaign.sales_closed || 0}</td>
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
                            {{ active: 'Activa', paused: 'Pausada', completed: 'Completada', draft: 'Borrador' }[campaign.status] || campaign.status}
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
              {campaigns.length === 0 && (
                <div className="empty-state text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-700/50 mb-4">
                    <span className="text-5xl">📢</span>
                  </div>
                  <p className="text-slate-300 text-xl mb-2">No hay campanas activas</p>
                  <p className="text-slate-500 text-sm mb-4">Crea tu primera campana para empezar a generar leads</p>
                  <button onClick={() => setShowNewCampaign(true)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold">
                    Crear Primera Campana
                  </button>
                </div>
              )}
            </div>

            {/* Tarjetas de Integraciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mt-6">
              {/* Tarjeta Conexión Facebook/Instagram Leads */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 md:p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 md:p-3 bg-blue-600 rounded-xl">
                    <Facebook size={20} />
                  </div>
                  <div>
                    <h3 className="text-base md:text-xl font-semibold">Facebook/Instagram Leads</h3>
                    <p className="text-slate-400 text-xs md:text-sm">Recibe leads automáticamente desde tus anuncios</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-slate-400 text-sm block mb-1">URL del Webhook</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${API_BASE}/webhook/facebook-leads`}
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm font-mono"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${API_BASE}/webhook/facebook-leads`)
                          showToast('URL copiada!', 'success')
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
                          showToast('Token copiado!', 'success')
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
                      <li>Ve a <a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Meta Business Suite</a> → Integraciones</li>
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
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 md:p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 md:p-3 bg-green-600 rounded-xl">
                    <Upload size={20} />
                  </div>
                  <div>
                    <h3 className="text-base md:text-xl font-semibold">Leads (CSV/Excel)</h3>
                    <p className="text-slate-400 text-xs md:text-sm">Carga leads masivamente desde archivos</p>
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
                          else if (phone.length === 12 && phone.startsWith('52')) phone = '521' + phone.slice(2)

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
                          showToast('No se encontraron leads válidos en el archivo', 'error')
                          return
                        }

                        // Importar usando el backend API (asignación inteligente)
                        try {
                          let importados = 0
                          let errores = 0

                          for (const lead of leadsToImport) {
                            try {
                              const response = await fetch(`${API_BASE}/api/leads`, {
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

                          showToast(`${importados} leads importados${errores > 0 ? ` (${errores} errores)` : ''}`, 'success')
                          loadData()
                        } catch (err) {
                          console.error('Error importando:', err)
                          showToast('Error al importar leads', 'error')
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
              <h2 className="text-3xl font-bold">Promociónes ({promotions.length})</h2>
              <button onClick={() => setShowNewPromotion(true)} className="bg-purple-600 px-4 py-2 rounded-xl hover:bg-purple-700 flex items-center gap-2">
                <Plus size={20} /> Nueva Promoción
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
                    <th className="text-left p-4">Promoción</th>
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
                          <p className="text-sm text-slate-400 truncate max-w-xs" title={promo.description || promo.message}>{promo.description || promo.message}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm">{startDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} - {endDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</p>
                          {promo.status === 'active' && daysRemaining > 0 && (
                            <p className="text-xs text-yellow-400">{daysRemaining} días restantes</p>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-blue-600/30 text-blue-400 rounded text-sm">{promo.target_segment}</span>
                        </td>
                        <td className="p-4">
                          {promo.reminder_enabled ? (
                            <span className="text-green-400 text-sm">{promo.reminder_frequency} ({promo.reminders_sent_count || 0} enviados)</span>
                          ) : (
                            <span className="text-slate-400 text-sm">Desactivados</span>
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
                <div className="empty-state text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-700/50 mb-4">
                    <span className="text-5xl">🎯</span>
                  </div>
                  <p className="text-slate-300 text-xl mb-2">No hay promociones activas</p>
                  <p className="text-slate-500 text-sm mb-4">Crea descuentos y ofertas especiales para tus desarrollos</p>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-emerald-500/50 transition-all">
                <p className="text-slate-400 mb-1">Próximos</p>
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
                          {event.event_type === 'open_house' ? 'Casa Abierta' :
                           event.event_type === 'seminar' ? 'Seminario' :
                           event.event_type === 'outlet' ? 'Venta Especial' : event.event_type}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          event.status === 'upcoming' || event.status === 'scheduled' ? 'bg-green-600' :
                          event.status === 'completed' ? 'bg-slate-600' : 'bg-red-600'
                        }`}>
                          {event.status === 'upcoming' || event.status === 'scheduled' ? 'Próximo' :
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
                        <button
                          onClick={() => { setSelectedEventForInvite(event); setShowInviteEventModal(true) }}
                          className="flex-1 bg-emerald-600 p-2 rounded hover:bg-emerald-700 flex items-center justify-center gap-1"
                          disabled={isPast}
                        >
                          <Send size={16} /> Invitar
                        </button>
                        <button onClick={() => setEditingCrmEvent(event)} className="bg-blue-600 p-2 rounded hover:bg-blue-700 flex items-center justify-center gap-1">
                          <Edit size={16} />
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

        {view === 'calendar' && (loading ? <SkeletonCalendar /> :
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
                  href="https://calendar.google.com/calendar/embed?src=edsonnoyola%40gmail.com&ctz=America/Mexico_City"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold flex items-center gap-2"
                >
                  🗓️ Ver Calendario Citas
                </a>
                {/* Toggle ver todas vs solo mías */}
                {currentUser?.role !== 'admin' && (
                  <button
                    onClick={() => setShowAllAppointments(!showAllAppointments)}
                    className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                      showAllAppointments
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-slate-600 hover:bg-slate-700'
                    }`}
                  >
                    {showAllAppointments ? '👥 Todas las citas' : '👤 Solo mis citas'}
                  </button>
                )}
                <span className="px-3 py-2 bg-green-600/30 border border-green-500 rounded-xl text-sm">✅ {filteredAppointments.filter(a => a.status === 'scheduled').length} Programadas</span>
                <span className="px-3 py-2 bg-red-600/30 border border-red-500 rounded-xl text-sm">❌ {filteredAppointments.filter(a => a.status === 'cancelled').length} Canceladas</span>
                {/* Toggle Lista / Mes */}
                <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                  <button
                    onClick={() => setCalendarViewMode('month')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${calendarViewMode === 'month' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Mes
                  </button>
                  <button
                    onClick={() => setCalendarViewMode('list')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${calendarViewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Lista
                  </button>
                </div>
              </div>
            </div>

            {/* ═══ MONTH GRID VIEW ═══ */}
            {calendarViewMode === 'month' && (
              <div className="space-y-4">
                {/* Month navigation */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setCalendarMonth(prev => { const d = new Date(prev); d.setMonth(d.getMonth() - 1); return d })}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <ChevronLeft size={20} className="text-slate-400" />
                  </button>
                  <h3 className="text-lg font-semibold min-w-[200px] text-center">
                    {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                  </h3>
                  <button
                    onClick={() => setCalendarMonth(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + 1); return d })}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <ChevronRight size={20} className="text-slate-400" />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                    <div key={d} className="text-center text-xs font-medium text-slate-500 py-2">{d}</div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1">
                  {getCalendarDays(calendarMonth).map((day, idx) => {
                    const dateStr = `${day.date.getFullYear()}-${String(day.date.getMonth()+1).padStart(2,'0')}-${String(day.date.getDate()).padStart(2,'0')}`
                    const dayAppts = appointmentsByDay.get(dateStr) || []
                    const scheduledAppts = dayAppts.filter(a => a.status === 'scheduled')
                    const isSelected = selectedCalendarDay === dateStr
                    const isPast = day.date < new Date(new Date().setHours(0,0,0,0)) && !day.isToday

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedCalendarDay(isSelected ? null : dateStr)}
                        className={`min-h-[5rem] p-1.5 rounded-lg border text-left transition-all ${
                          !day.isCurrentMonth ? 'opacity-20 border-transparent' :
                          isSelected ? 'border-blue-500 bg-blue-500/10' :
                          day.isToday ? 'border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/30' :
                          isPast ? 'opacity-40 border-slate-800 hover:border-slate-700' :
                          'border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
                        }`}
                      >
                        <span className={`text-xs font-medium ${
                          day.isToday ? 'text-blue-400' :
                          !day.isCurrentMonth ? 'text-slate-600' :
                          'text-slate-300'
                        }`}>
                          {day.date.getDate()}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {scheduledAppts.slice(0, 2).map((a, i) => (
                            <div key={i} className="flex items-center gap-1 text-[10px] leading-tight">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                              <span className="text-slate-300 truncate">{a.scheduled_time?.slice(0,5)} {(a.property_name || a.lead_name || '').slice(0, 10)}</span>
                            </div>
                          ))}
                          {scheduledAppts.length > 2 && (
                            <p className="text-[10px] text-blue-400 font-medium">+{scheduledAppts.length - 2} más</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Selected day detail panel */}
                {selectedCalendarDay && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        {(() => {
                          const [y,m,d] = selectedCalendarDay.split('-').map(Number)
                          return new Date(y, m-1, d).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
                        })()}
                      </h3>
                      <button onClick={() => setSelectedCalendarDay(null)} className="text-slate-400 hover:text-white">
                        <X size={16} />
                      </button>
                    </div>
                    {(appointmentsByDay.get(selectedCalendarDay) || []).filter(a => a.status === 'scheduled').length === 0 ? (
                      <div className="text-center py-6 bg-slate-800/30 rounded-xl border border-slate-700/30">
                        <p className="text-slate-500 text-sm">No hay citas programadas este día</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {(appointmentsByDay.get(selectedCalendarDay) || []).filter(a => a.status === 'scheduled').map(appt => {
                          const vendedorNombre = appt.vendedor_name || team.find(t => t.id === appt.vendedor_id)?.name || 'Sin asignar'
                          return (
                            <div key={appt.id} className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="text-2xl">🏠</div>
                                <div className="min-w-0">
                                  <p className="font-semibold truncate">{appt.property_name || 'Visita'}</p>
                                  <p className="text-sm text-slate-400">👤 {appt.lead_name || appt.lead_phone} · 🕐 {appt.scheduled_time?.slice(0,5)} · 🏢 {vendedorNombre}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <button
                                  onClick={() => setEditingAppointment({...appt, mode: 'edit', notificar: true})}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium"
                                >
                                  ✏️
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ═══ LIST VIEW ═══ */}
            {calendarViewMode === 'list' && (
            <div className="grid grid-cols-1 gap-4">
              {filteredAppointments.filter(a => a.status === 'scheduled').map((appt) => {
                const fecha = (appt.scheduled_date && appt.scheduled_time) ? new Date(appt.scheduled_date + 'T' + appt.scheduled_time) : null
                const vendedorNombre = appt.vendedor_name || team.find(t => t.id === appt.vendedor_id)?.name || 'Sin asignar'
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
                                {fecha ? fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' }) : appt.scheduled_date || 'Sin fecha'}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-xs">🕐 Hora</p>
                              <p className="font-semibold text-green-400 text-lg">
                                {fecha ? fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : appt.scheduled_time || 'Sin hora'}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-xs">🏢 Vendedor</p>
                              <p className="font-semibold">{vendedorNombre}</p>
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
                          onClick={() => {
                            const tipoTexto = appt.appointment_type === 'llamada' ? 'llamada' : 'cita';
                            setConfirmModal({
                              title: `Cancelar ${tipoTexto}`,
                              message: `¿Cancelar ${tipoTexto} con ${appt.lead_name}? Se notificará al cliente y vendedor por WhatsApp.`,
                              onConfirm: async () => {
                                try {
                                  const response = await fetch(`${API_BASE}/api/appointments/${appt.id}/cancel`, {
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
                                } catch (err: any) {
                                  showToast('Error: ' + err.message, 'error')
                                  loadData()
                                }
                                setConfirmModal(null)
                              }
                            })
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
              
              {filteredAppointments.filter(a => a.status === 'scheduled').length === 0 && (
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
            )}

            {/* Citas Canceladas */}
            {filteredAppointments.filter(a => a.status === 'cancelled').length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4 text-slate-400">❌ Citas Canceladas ({filteredAppointments.filter(a => a.status === 'cancelled').length})</h3>
                <div className="space-y-2">
                  {filteredAppointments.filter(a => a.status === 'cancelled').slice(0, 5).map((appt) => {
                    const fecha = (appt.scheduled_date && appt.scheduled_time) ? new Date(appt.scheduled_date + 'T' + appt.scheduled_time) : null
                    return (
                      <div key={appt.id} className="bg-slate-800/30 border border-slate-700/30 p-3 rounded-xl opacity-60">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-red-400">❌</span>
                            <div>
                              <p className="font-semibold text-sm">{appt.property_name} - {appt.lead_name || appt.lead_phone}</p>
                              <p className="text-xs text-slate-400">
                                {fecha ? `${fecha.toLocaleDateString('es-MX')} ${fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}` : (appt.scheduled_date || 'Sin fecha')}
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
                <button onClick={() => setShowNewAppointment(false)} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X size={24} /></button>
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
                      min={new Date().toISOString().split('T')[0]}
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
                  disabled={saving}
                  onClick={async () => {
                    if (!newAppointment.lead_id || !newAppointment.scheduled_date || !newAppointment.scheduled_time) {
                      showToast('Completa todos los campos', 'error')
                      return
                    }
                    setSaving(true)
                    try {
                      const response = await fetch(`${API_BASE}/api/appointments`, {
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
                      showToast('Cita creada y agregada a Google Calendar', 'success')
                    } catch (err: any) {
                      showToast('Error: ' + err.message, 'error')
                    } finally { setSaving(false) }
                  }}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Creando...' : '✅ Crear Cita'}
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
                <button onClick={() => setEditingAppointment(null)} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X size={24} /></button>
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
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true)
                    try {
                      const response = await fetch(`${API_BASE}/api/appointments/` + editingAppointment.id, {
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
                      showToast((editingAppointment as any).notificar ? 'Cita actualizada y notificaciones enviadas por WhatsApp' : 'Cita actualizada', 'success')
                    } catch (err: any) {
                      showToast('Error: ' + err.message, 'error')
                    } finally { setSaving(false) }
                  }}
                  className={`w-full py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${(editingAppointment as any).mode === 'edit' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                >
                  {saving ? 'Guardando...' : '✅ Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============ METAS ============ */}
        {view === 'goals' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {currentUser?.role === 'vendedor' ? 'Mi Meta' : 'Planeación de Metas'}
              </h2>
              {!permisos.puedeEditarMetas() && (
                <span className="text-xs text-slate-400 bg-slate-700 px-3 py-2 rounded-lg">👁️ Solo lectura</span>
              )}
              <div className="flex gap-2">
                {/* Exportar CSV */}
                <button
                  onClick={() => {
                    const currentMonth = selectedGoalMonth
                    const rows = [
                      ['REPORTE DE METAS - ' + new Date(currentMonth + '-01').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase()],
                      [],
                      ['META ANUAL', annualGoal.goal + ' casas', 'Promedio mensual: ' + Math.round(annualGoal.goal / 12)],
                      ['META MENSUAL', monthlyGoals.company_goal + ' casas'],
                      [],
                      ['VENDEDOR', 'META', 'CERRADOS', 'RESERVADOS', 'NEGOCIANDO', '% AVANCE'],
                      ...vendorGoals.map(vg => {
                        const closed = leads.filter(l => l.assigned_to === vg.vendor_id && (l.status === 'closed' || l.status === 'delivered' || l.status === 'sold') && l.status_changed_at?.startsWith(currentMonth)).length
                        const reserved = leads.filter(l => l.assigned_to === vg.vendor_id && l.status === 'reserved').length
                        const negotiation = leads.filter(l => l.assigned_to === vg.vendor_id && l.status === 'negotiation').length
                        const pct = vg.goal > 0 ? Math.round((closed / vg.goal) * 100) : 0
                        return [vg.name, vg.goal, closed, reserved, negotiation, pct + '%']
                      }),
                      [],
                      ['TOTAL', vendorGoals.reduce((s, v) => s + v.goal, 0), '', '', '', '']
                    ]
                    const csv = rows.map(r => r.join(',')).join('\n')
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = `metas_${currentMonth}.csv`
                    link.click()
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium"
                >
                  <Download size={16} />
                  Excel/CSV
                </button>
                {/* Imprimir/PDF */}
                <button
                  onClick={() => {
                    const monthName = new Date(selectedGoalMonth + '-01').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
                    const vendorRows = vendorGoals.map(vg => {
                      const closed = leads.filter(l => l.assigned_to === vg.vendor_id && (l.status === 'closed' || l.status === 'delivered' || l.status === 'sold') && l.status_changed_at?.startsWith(selectedGoalMonth)).length
                      const reserved = leads.filter(l => l.assigned_to === vg.vendor_id && l.status === 'reserved').length
                      const negotiation = leads.filter(l => l.assigned_to === vg.vendor_id && l.status === 'negotiation').length
                      const pct = vg.goal > 0 ? Math.round((closed / vg.goal) * 100) : 0
                      return '<tr><td><strong>' + vg.name + '</strong></td><td>' + vg.goal + '</td><td>' + closed + '</td><td>' + reserved + '</td><td>' + negotiation + '</td><td><div class="progress"><div class="progress-bar" style="width:' + Math.min(pct, 100) + '%"></div></div><strong>' + pct + '%</strong></td></tr>'
                    }).join('')
                    const totalGoal = vendorGoals.reduce((s, v) => s + v.goal, 0)
                    const printContent = '<html><head><title>Reporte de Metas</title><style>body{font-family:Arial,sans-serif;padding:20px}h1{color:#333;border-bottom:2px solid #333;padding-bottom:10px}h2{color:#666;margin-top:30px}table{width:100%;border-collapse:collapse;margin-top:15px}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f5f5f5;font-weight:bold}.meta-box{display:inline-block;padding:15px 25px;margin:10px;background:#f0f0f0;border-radius:8px}.meta-box .number{font-size:32px;font-weight:bold;color:#333}.meta-box .label{font-size:12px;color:#666}.progress{height:10px;background:#e0e0e0;border-radius:5px;overflow:hidden}.progress-bar{height:100%;background:#4CAF50}.footer{margin-top:30px;font-size:12px;color:#999;border-top:1px solid #eee;padding-top:10px}</style></head><body><h1>Reporte de Metas - ' + monthName + '</h1><div style="margin:20px 0;"><div class="meta-box"><div class="number">' + annualGoal.goal + '</div><div class="label">Meta Anual ' + selectedGoalYear + '</div></div><div class="meta-box"><div class="number">' + Math.round(annualGoal.goal / 12) + '</div><div class="label">Meta Mensual Promedio</div></div><div class="meta-box"><div class="number">' + monthlyGoals.company_goal + '</div><div class="label">Meta Este Mes</div></div></div><h2>Metas por Vendedor</h2><table><thead><tr><th>Vendedor</th><th>Meta</th><th>Cerrados</th><th>Reservados</th><th>Negociando</th><th>Avance</th></tr></thead><tbody>' + vendorRows + '</tbody><tfoot><tr style="background:#f5f5f5;"><td><strong>TOTAL</strong></td><td><strong>' + totalGoal + '</strong></td><td colspan="4"></td></tr></tfoot></table><div class="footer">Generado el ' + new Date().toLocaleString('es-MX') + ' - SARA CRM</div></body></html>'
                    const printWindow = window.open('', '_blank')
                    if (printWindow) {
                      printWindow.document.write(printContent)
                      printWindow.document.close()
                      printWindow.print()
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
                >
                  <Download size={16} />
                  PDF / Imprimir
                </button>
              </div>
            </div>

            {/* META ANUAL */}
            <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Target className="text-purple-400" size={24} />
                  Meta Anual de Empresa
                </h3>
                <select
                  value={selectedGoalYear}
                  onChange={(e) => setSelectedGoalYear(parseInt(e.target.value))}
                  className="bg-slate-700 px-4 py-2 rounded-lg"
                >
                  {[2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/60 rounded-xl p-4">
                  <p className="text-sm text-slate-400 mb-2">Meta anual (casas)</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={annualGoal.goal}
                      onChange={(e) => permisos.puedeEditarMetas() && setAnnualGoal({...annualGoal, goal: parseInt(e.target.value) || 0})}
                      readOnly={!permisos.puedeEditarMetas()}
                      className={`bg-slate-700 px-4 py-3 rounded-lg w-full text-3xl font-bold text-center text-purple-400 ${!permisos.puedeEditarMetas() ? 'opacity-70 cursor-not-allowed' : ''}`}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="bg-slate-800/60 rounded-xl p-4">
                  <p className="text-sm text-slate-400 mb-2">Equivale a mensual</p>
                  <p className="text-3xl font-bold text-cyan-400 text-center py-2">
                    {Math.round(annualGoal.goal / 12)} <span className="text-base text-slate-400">casas/mes</span>
                  </p>
                </div>

                {permisos.puedeEditarMetas() && (
                  <div className="bg-slate-800/60 rounded-xl p-4 flex flex-col justify-center gap-2">
                    <button
                      onClick={() => saveAnnualGoal(annualGoal.goal)}
                      className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium text-sm"
                    >
                      Guardar Meta Anual
                    </button>
                    <button
                      onClick={async () => {
                        await applyAnnualToMonthly()
                        showToast(`Meta de ${Math.round(annualGoal.goal / 12)} casas aplicada a los 12 meses de ${selectedGoalYear}`, 'success')
                      }}
                      className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 px-4 py-2 rounded-lg font-medium text-sm"
                    >
                      Aplicar a Todos los Meses
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* META MENSUAL */}
            <div className="bg-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <CalendarIcon className="text-blue-400" size={24} />
                  Meta Mensual de Empresa
                </h3>
                <input
                  type="month"
                  value={selectedGoalMonth}
                  onChange={(e) => setSelectedGoalMonth(e.target.value)}
                  className="bg-slate-700 px-4 py-2 rounded-lg"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={monthlyGoals.company_goal}
                    onChange={(e) => permisos.puedeEditarMetas() && setMonthlyGoals({...monthlyGoals, company_goal: parseInt(e.target.value) || 0})}
                    readOnly={!permisos.puedeEditarMetas()}
                    className={`bg-slate-700 px-4 py-3 rounded-lg w-32 text-2xl font-bold text-center ${!permisos.puedeEditarMetas() ? 'opacity-70 cursor-not-allowed' : ''}`}
                  />
                  <span className="text-xl text-slate-400">casas</span>
                </div>
                {permisos.puedeEditarMetas() && (
                  <button
                    onClick={() => saveCompanyGoal(monthlyGoals.company_goal)}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
                  >
                    Guardar
                  </button>
                )}
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Avance del equipo ({(() => { const [y, m] = selectedGoalMonth.split('-'); return new Date(parseInt(y), parseInt(m) - 1, 15).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }) })()})</span>
                  <span className="font-bold">{leads.filter(l => (l.status === 'closed' || l.status === 'Cerrado' || l.status === 'delivered' || l.status === 'sold') && l.status_changed_at?.startsWith(selectedGoalMonth)).length} / {monthlyGoals.company_goal || 0}</span>
                </div>
                <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                    style={{ width: `${Math.min(100, (leads.filter(l => (l.status === 'closed' || l.status === 'Cerrado' || l.status === 'delivered' || l.status === 'sold') && l.status_changed_at?.startsWith(selectedGoalMonth)).length / (monthlyGoals.company_goal || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* DISTRIBUCIÓN POR VENDEDOR */}
            <div className="bg-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Users className="text-green-400" size={24} />
                  Metas por Vendedor
                </h3>
                {permisos.puedeEditarMetas() && (
                  <button
                    onClick={async () => {
                      await distributeGoalsEqually()
                      showToast('Metas distribuidas equitativamente entre vendedores', 'success')
                    }}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                  >
                    <Users size={18} />
                    Distribuir Equitativamente
                  </button>
                )}
              </div>

              {vendorGoals.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No hay vendedores activos</p>
              ) : (
                <div className="space-y-4">
                  {vendorGoals.map(vg => {
                    const closedThisMonth = leads.filter(l =>
                      l.assigned_to === vg.vendor_id &&
                      (l.status === 'closed' || l.status === 'Cerrado' || l.status === 'delivered' || l.status === 'sold') &&
                      l.status_changed_at?.startsWith(selectedGoalMonth)
                    ).length
                    const reserved = getReservedByVendor(vg.vendor_id)
                    const negotiation = getNegotiationByVendor(vg.vendor_id)
                    const percentage = vg.goal > 0 ? Math.round((closedThisMonth / vg.goal) * 100) : 0

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
                                {closedThisMonth} cerrados | {reserved} reservados | {negotiation} negociando
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={vg.goal}
                              onChange={(e) => {
                                if (!permisos.puedeEditarMetas()) return
                                const newGoals = vendorGoals.map(g =>
                                  g.vendor_id === vg.vendor_id ? {...g, goal: parseInt(e.target.value) || 0} : g
                                )
                                setVendorGoals(newGoals)
                              }}
                              onBlur={() => permisos.puedeEditarMetas() && saveVendorGoal(vg.vendor_id, vg.goal)}
                              readOnly={!permisos.puedeEditarMetas()}
                              className={`bg-slate-600 px-3 py-2 rounded-lg w-20 text-center font-bold ${!permisos.puedeEditarMetas() ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                            Si cierras los {reserved} reservados llegas a {Math.round(((closedThisMonth + reserved) / (vg.goal || 1)) * 100)}%
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-slate-600">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total asignado a vendedores:</span>
                  <span className="text-xl font-bold">{vendorGoals.reduce((sum, vg) => sum + vg.goal, 0)} casas</span>
                </div>
                {vendorGoals.reduce((sum, vg) => sum + vg.goal, 0) !== monthlyGoals.company_goal && monthlyGoals.company_goal > 0 && (
                  <div className="mt-3 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg flex items-center gap-2">
                    <AlertTriangle size={18} className="text-yellow-400" />
                    <p className="text-yellow-400 text-sm">
                      La suma de metas ({vendorGoals.reduce((sum, vg) => sum + vg.goal, 0)}) no coincide con la meta de empresa ({monthlyGoals.company_goal})
                    </p>
                  </div>
                )}
                {vendorGoals.reduce((sum, vg) => sum + vg.goal, 0) === monthlyGoals.company_goal && monthlyGoals.company_goal > 0 && (
                  <div className="mt-3 p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-400" />
                    <p className="text-green-400 text-sm">
                      Las metas están correctamente distribuidas
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* RESUMEN ANUAL */}
            <div className="bg-slate-800/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="text-cyan-400" size={20} />
                Resumen Anual {selectedGoalYear}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-purple-400">{annualGoal.goal}</p>
                  <p className="text-sm text-slate-400">Meta anual</p>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-cyan-400">{Math.round(annualGoal.goal / 12)}</p>
                  <p className="text-sm text-slate-400">Promedio mensual</p>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-400">
                    {leads.filter(l =>
                      (l.status === 'closed' || l.status === 'delivered' || l.status === 'sold') &&
                      l.status_changed_at?.startsWith(selectedGoalYear.toString())
                    ).length}
                  </p>
                  <p className="text-sm text-slate-400">Ventas {selectedGoalYear}</p>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-amber-400">
                    {annualGoal.goal > 0
                      ? Math.round((leads.filter(l =>
                          (l.status === 'closed' || l.status === 'delivered' || l.status === 'sold') &&
                          l.status_changed_at?.startsWith(selectedGoalYear.toString())
                        ).length / annualGoal.goal) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm text-slate-400">Cumplimiento</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'followups' && (
          <FollowupsView supabase={supabase} />
        )}

        {view === 'reportes' && (
          <ReportesCEOView />
        )}

        {view === 'encuestas' && (
          <EncuestasEventosView
            leads={leads}
            crmEvents={crmEvents}
            eventRegistrations={eventRegistrations}
            properties={properties}
            teamMembers={team}
            onSendSurvey={async (config) => {
              try {
                // Llamar al backend para enviar por WhatsApp
                const result = await safeFetch(`${API_BASE}/api/send-surveys`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    template: config.template,
                    leads: config.leads,
                    message: config.message,
                    targetType: config.targetType // Importante para diferenciar vendedores de leads
                  })
                })
                if (result.ok) {
                  const destinatarioTipo = config.targetType === 'vendedores' ? 'vendedores' : 'leads'
                  showToast(`Encuesta "${config.template.name}" enviada a ${result.enviados} ${destinatarioTipo} por WhatsApp.${result.errores > 0 ? ` ${result.errores} errores.` : ''}`, 'success')
                } else {
                  throw new Error(result.error || 'Error desconocido')
                }
              } catch (error) {
                console.error('Error enviando encuestas:', error)
                showToast('Error al enviar encuestas. Intenta de nuevo.', 'error')
              }
            }}
            showToast={showToast}
          />
        )}

        {view === 'bi' && (
          <BusinessIntelligenceView
            leads={leads}
            team={team}
            appointments={appointments}
            properties={properties}
            showToast={showToast}
          />
        )}

        {view === 'mensajes' && (
          <MessageMetricsView />
        )}

        {view === 'referrals' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent">
              Programa de Referidos
            </h2>

            {/* Estadísticas generales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-pink-600/20 to-rose-600/20 border border-pink-500/30 rounded-2xl p-6">
                <div className="text-4xl font-bold text-pink-400">
                  {leads.filter(l => l.source === 'referral').length}
                </div>
                <div className="text-slate-400 text-sm">Total Referidos</div>
              </div>
              <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-6">
                <div className="text-4xl font-bold text-green-400">
                  {leads.filter(l => l.source === 'referral' && l.status === 'sold').length}
                </div>
                <div className="text-slate-400 text-sm">Referidos Vendidos</div>
              </div>
              <div className="bg-gradient-to-br from-amber-600/20 to-yellow-600/20 border border-amber-500/30 rounded-2xl p-6">
                <div className="text-4xl font-bold text-amber-400">
                  {leads.filter(l => l.source === 'referral' && ['visited', 'reserved', 'negotiation'].includes(l.status)).length}
                </div>
                <div className="text-slate-400 text-sm">En Proceso</div>
              </div>
              <div className="bg-gradient-to-br from-purple-600/20 to-violet-600/20 border border-purple-500/30 rounded-2xl p-6">
                <div className="text-4xl font-bold text-purple-400">
                  {(() => {
                    const referidores = new Set(leads.filter(l => l.source === 'referral' && l.referred_by).map(l => l.referred_by))
                    return referidores.size
                  })()}
                </div>
                <div className="text-slate-400 text-sm">Clientes Referidores</div>
              </div>
            </div>

            {/* Tasa de conversión */}
            <div className="bg-slate-800/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp size={24} className="text-green-400" />
                Tasa de Conversión de Referidos
              </h3>
              <div className="flex items-center gap-8">
                <div>
                  <div className="text-5xl font-bold text-green-400">
                    {leads.filter(l => l.source === 'referral').length > 0
                      ? Math.round((leads.filter(l => l.source === 'referral' && l.status === 'sold').length / leads.filter(l => l.source === 'referral').length) * 100)
                      : 0}%
                  </div>
                  <div className="text-slate-400">Referidos que compraron</div>
                </div>
                <div className="flex-1 h-4 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${leads.filter(l => l.source === 'referral').length > 0
                      ? (leads.filter(l => l.source === 'referral' && l.status === 'sold').length / leads.filter(l => l.source === 'referral').length) * 100
                      : 0}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-4">
                Los leads referidos tienen mayor probabilidad de conversión porque vienen con confianza previa del referidor.
              </p>
            </div>

            {/* Top Referidores */}
            <div className="bg-slate-800/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Award size={24} className="text-amber-400" />
                Top Clientes Referidores
              </h3>
              <div className="space-y-3">
                {(() => {
                  const referidorCounts: Record<string, { count: number; name: string; vendidos: number }> = {}
                  leads.filter(l => l.source === 'referral' && l.referred_by).forEach(l => {
                    if (!referidorCounts[l.referred_by!]) {
                      referidorCounts[l.referred_by!] = { count: 0, name: l.referred_by_name || 'Sin nombre', vendidos: 0 }
                    }
                    referidorCounts[l.referred_by!].count++
                    if (l.status === 'sold') referidorCounts[l.referred_by!].vendidos++
                  })
                  const sorted = Object.entries(referidorCounts).sort((a, b) => b[1].count - a[1].count).slice(0, 5)
                  if (sorted.length === 0) {
                    return <p className="text-slate-400">Aún no hay clientes que hayan referido leads</p>
                  }
                  return sorted.map(([id, data], idx) => (
                    <div key={id} className="flex items-center gap-4 bg-slate-700/50 rounded-xl p-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        idx === 0 ? 'bg-amber-500 text-black' :
                        idx === 1 ? 'bg-slate-300 text-black' :
                        idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{data.name}</div>
                        <div className="text-sm text-slate-400">
                          {data.count} referido{data.count !== 1 ? 's' : ''}
                          {data.vendidos > 0 && <span className="text-green-400 ml-2">({data.vendidos} vendido{data.vendidos !== 1 ? 's' : ''})</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-pink-400">{data.count}</div>
                      </div>
                    </div>
                  ))
                })()}
              </div>
            </div>

            {/* Lista de Referidos */}
            <div className="bg-slate-800/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users size={24} className="text-blue-400" />
                Leads Referidos
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-700">
                      <th className="pb-3 pr-4">Lead</th>
                      <th className="pb-3 pr-4">Referido por</th>
                      <th className="pb-3 pr-4">Vendedor</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {leads.filter(l => l.source === 'referral').length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No hay leads referidos aún. Los clientes que ya compraron pueden enviar contactos por WhatsApp.
                        </td>
                      </tr>
                    ) : (
                      leads.filter(l => l.source === 'referral').sort((a, b) =>
                        new Date(b.referral_date || b.created_at).getTime() - new Date(a.referral_date || a.created_at).getTime()
                      ).map(lead => (
                        <tr key={lead.id} className="hover:bg-slate-700/30">
                          <td className="py-3 pr-4">
                            <div className="font-semibold">{lead.name}</div>
                            <div className="text-sm text-slate-400">{lead.phone}</div>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="text-pink-400">{lead.referred_by_name || 'Desconocido'}</div>
                          </td>
                          <td className="py-3 pr-4">
                            {team.find(t => t.id === lead.assigned_to)?.name || 'Sin asignar'}
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                              lead.status === 'sold' ? 'bg-green-500/20 text-green-400' :
                              lead.status === 'reserved' ? 'bg-purple-500/20 text-purple-400' :
                              lead.status === 'visited' ? 'bg-blue-500/20 text-blue-400' :
                              lead.status === 'contacted' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {STATUS_LABELS[lead.status] || lead.status}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-sm text-slate-400">
                            {new Date(lead.referral_date || lead.created_at).toLocaleDateString('es-MX')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Premios para Referidores - Seguimiento */}
            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  🎁 Premios para Referidores
                </h3>
                <button
                  onClick={() => setEditandoBono(true)}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm flex items-center gap-1"
                >
                  ✏️ Editar Premio
                </button>
              </div>

              {/* Editor de Premio */}
              {editandoBono && (
                <div className="bg-slate-700/50 p-4 rounded-xl mb-4 flex flex-wrap items-center gap-4">
                  <label className="text-sm text-slate-400">Premio por referido que compre:</label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">$</span>
                    <input
                      type="number"
                      value={bonoReferido}
                      onChange={(e) => setBonoReferido(parseInt(e.target.value) || 0)}
                      className="w-24 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-center"
                    />
                    <span className="text-slate-400">MXN</span>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.setItem('bonoReferido', bonoReferido.toString())
                      setEditandoBono(false)
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditandoBono(false)}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              <p className="text-slate-400 text-sm mb-4">
                💰 Premio actual: <span className="text-green-400 font-bold">${bonoReferido.toLocaleString('es-MX')} MXN</span> para quien refiera a alguien que compre
              </p>

              {/* Premios Pendientes */}
              {(() => {
                const referidosVendidos = leads.filter(l =>
                  l.source === 'referral' &&
                  (l.status === 'sold' || l.status === 'closed' || l.status === 'delivered') &&
                  l.referred_by
                )
                const pendientes = referidosVendidos.filter(l => !l.notes?.reward_delivered)
                const entregados = referidosVendidos.filter(l => l.notes?.reward_delivered)

                return (
                  <>
                    {/* Pendientes */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
                        ⏳ Premios Pendientes de Entregar ({pendientes.length})
                      </h4>
                      {pendientes.length === 0 ? (
                        <p className="text-slate-400 text-sm">No hay premios pendientes</p>
                      ) : (
                        <div className="space-y-3">
                          {pendientes.map(lead => {
                            const vendedor = team.find(t => t.id === lead.assigned_to)
                            return (
                              <div key={lead.id} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                  <div className="flex-1 min-w-[200px]">
                                    <div className="flex items-center gap-2">
                                      <span className="text-amber-400 font-bold">🎁 Premio para:</span>
                                      <span className="text-white font-semibold">{lead.referred_by_name || 'Sin nombre'}</span>
                                    </div>
                                    <div className="text-sm text-slate-400 mt-1">
                                      Por referir a <span className="text-pink-400">{lead.name}</span> quien compró
                                    </div>
                                    <div className="text-sm text-slate-400">
                                      Vendedor responsable: <span className="text-blue-400">{vendedor?.name || 'Sin asignar'}</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-green-400">${bonoReferido.toLocaleString('es-MX')}</div>
                                    <button
                                      onClick={async () => {
                                        const newNotes = { ...(lead.notes || {}), reward_delivered: true, reward_delivered_at: new Date().toISOString() }
                                        await supabase.from('leads').update({ notes: newNotes }).eq('id', lead.id)
                                        loadData()
                                      }}
                                      className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-semibold"
                                    >
                                      ✅ Marcar Entregado
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Entregados */}
                    {entregados.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                          ✅ Premios Entregados ({entregados.length})
                        </h4>
                        <div className="space-y-2">
                          {entregados.slice(0, 5).map(lead => (
                            <div key={lead.id} className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
                              <div>
                                <span className="text-green-400">{lead.referred_by_name || 'Sin nombre'}</span>
                                <span className="text-slate-400 text-sm ml-2">por referir a {lead.name}</span>
                              </div>
                              <div className="text-green-400 font-bold">${bonoReferido.toLocaleString('es-MX')}</div>
                            </div>
                          ))}
                          {entregados.length > 5 && (
                            <p className="text-slate-400 text-sm text-center">... y {entregados.length - 5} más</p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {view === 'coordinator' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">📞 Panel Coordinador</h2>
              <p className="text-slate-400">Gestión rápida de llamadas y leads</p>
            </div>

            {/* FORMULARIO RÁPIDO CREAR LEAD */}
            <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-600/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Plus size={24} className="text-green-400" /> Nuevo Lead (Llamada/Mail)
              </h3>
              <form onSubmit={async (e) => {
                e.preventDefault()
                const form = e.target as HTMLFormElement
                const nombre = (form.elements.namedItem('coord_nombre') as HTMLInputElement).value.trim()
                const telefono = (form.elements.namedItem('coord_telefono') as HTMLInputElement).value.trim()
                const medio = (form.elements.namedItem('coord_medio') as HTMLSelectElement).value
                const desarrollo = (form.elements.namedItem('coord_desarrollo') as HTMLSelectElement).value
                const vendedorId = (form.elements.namedItem('coord_vendedor') as HTMLSelectElement).value
                // Campos opcionales de cita
                const citaFecha = (form.elements.namedItem('coord_cita_fecha') as HTMLInputElement).value
                const citaHora = (form.elements.namedItem('coord_cita_hora') as HTMLInputElement).value
                const citaLugar = (form.elements.namedItem('coord_cita_lugar') as HTMLSelectElement).value

                if (!nombre || !telefono || !medio) {
                  showToast('Nombre, teléfono y medio son requeridos', 'error')
                  return
                }

                // Validar que si hay cita, tenga fecha, hora y lugar
                const tieneCita = citaFecha || citaHora || citaLugar
                if (tieneCita && (!citaFecha || !citaHora || !citaLugar)) {
                  showToast('Si agendas cita, debes completar fecha, hora y lugar', 'error')
                  return
                }

                // Normalizar teléfono
                let tel = telefono.replace(/[^0-9]/g, '')
                if (tel.length === 10) tel = '52' + tel
                if (!tel.startsWith('52')) tel = '52' + tel.slice(-10)

                // Usar endpoint del backend para crear lead Y notificar al vendedor
                const vendedorName = vendedorId ? team.find(t => t.id === vendedorId)?.name : null
                const lugarCita = citaLugar || desarrollo

                const response = await fetch(`${API_BASE}/api/leads`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: nombre,
                    phone: tel,
                    status: 'new',
                    source: medio,
                    property_interest: desarrollo || lugarCita || null,
                    assigned_to: vendedorId || undefined,
                    created_at: new Date().toISOString(),
                    creador_name: currentUser?.name || 'Coordinador',
                    creador_role: 'coordinador',
                    // Datos de cita opcional
                    tiene_cita: tieneCita ? true : false,
                    cita_fecha: citaFecha || undefined,
                    cita_hora: citaHora || undefined,
                    cita_desarrollo: lugarCita || undefined
                  })
                })

                const result = await response.json()
                if (!response.ok) {
                  showToast('Error: ' + (result.error || 'Error desconocido'), 'error')
                  return
                }

                // Actualizar lista local
                setLeads([result, ...leads])
                form.reset()

                const citaMsg = tieneCita ? `\n📅 Cita: ${citaFecha} a las ${citaHora} en ${lugarCita}` : ''
                showToast(`Lead creado${vendedorName ? ` y asignado a ${vendedorName?.split(' ')[0]}` : ''}${citaMsg ? ` | Cita: ${citaFecha} a las ${citaHora} en ${lugarCita}` : ''} | Notificación enviada por WhatsApp`, 'success')
              }} className="space-y-4">
                {/* Fila 1: Datos básicos */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Nombre *</label>
                    <input name="coord_nombre" placeholder="Juan Pérez" className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Teléfono *</label>
                    <input name="coord_telefono" placeholder="5512345678" className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">¿Cómo se enteró? *</label>
                    <select name="coord_medio" className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
                      <option value="">Seleccionar...</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Instagram">Instagram</option>
                      <option value="YouTube">YouTube</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Google">Google</option>
                      <option value="Espectacular">Espectacular</option>
                      <option value="Radio">Radio</option>
                      <option value="Referido">Referido</option>
                      <option value="Llamada directa">Llamada directa</option>
                      <option value="Visita oficina">Visita oficina</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Desarrollo de interés</label>
                    <select name="coord_desarrollo" className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                      <option value="">Sin especificar</option>
                      {[...new Set(properties.map(p => p.development))].filter(Boolean).map(dev => (
                        <option key={dev} value={dev}>{dev}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Asignar a vendedor</label>
                    <select name="coord_vendedor" className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                      <option value="">Sin asignar</option>
                      {team.filter(t => t.role === 'vendedor' && t.active).map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                    <Plus size={20} /> Crear Lead
                  </button>
                </div>
                {/* Fila 2: Cita opcional */}
                <div className="border-t border-slate-600 pt-4">
                  <p className="text-sm text-slate-400 mb-3 flex items-center gap-2">
                    <Calendar size={16} /> Agendar cita (opcional)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Fecha de cita</label>
                      <input name="coord_cita_fecha" type="date" min={new Date().toISOString().split('T')[0]} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Hora de cita</label>
                      <input name="coord_cita_hora" type="time" className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Lugar de cita</label>
                      <select name="coord_cita_lugar" className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        <option value="">Seleccionar lugar...</option>
                        <option value="Oficinas Centrales">Oficinas Centrales</option>
                        {[...new Set(properties.map(p => p.development))].filter(Boolean).map(dev => (
                          <option key={dev} value={dev}>{dev}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* VISTA DE DISPONIBILIDAD POR DÍA */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Calendar size={24} className="text-cyan-400" /> Disponibilidad del Equipo
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const d = new Date(selectedDate)
                      d.setDate(d.getDate() - 1)
                      setSelectedDate(d.toISOString().split('T')[0])
                    }}
                    className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <input
                    type="date"
                    value={selectedDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-slate-700 rounded-lg px-3 py-2"
                  />
                  <button
                    onClick={() => {
                      const d = new Date(selectedDate || new Date())
                      d.setDate(d.getDate() + 1)
                      setSelectedDate(d.toISOString().split('T')[0])
                    }}
                    className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <span className="ml-2 text-slate-400">
                    {new Date((selectedDate || new Date().toISOString().split('T')[0]) + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>

              {/* Leyenda */}
              <div className="flex gap-4 mb-4 text-sm">
                <span className="flex items-center gap-1"><div className="w-4 h-4 bg-green-600 rounded" /> Disponible</span>
                <span className="flex items-center gap-1"><div className="w-4 h-4 bg-red-600 rounded" /> Ocupado</span>
                <span className="flex items-center gap-1"><div className="w-4 h-4 bg-slate-600 rounded" /> Fuera de horario</span>
              </div>

              {/* Grid de disponibilidad */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left p-2 sticky left-0 bg-slate-800">Vendedor</th>
                      {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(hora => (
                        <th key={hora} className="p-2 text-center min-w-[60px]">
                          {hora}:00
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {team.filter(t => t.role === 'vendedor' && t.active).map(vendedor => {
                      // Obtener citas del vendedor para la fecha seleccionada
                      const fechaSeleccionada = selectedDate || new Date().toISOString().split('T')[0]
                      const citasVendedor = appointments.filter(a =>
                        a.vendedor_id === vendedor.id &&
                        a.scheduled_date === fechaSeleccionada &&
                        a.status === 'scheduled'
                      )

                      // Horario de trabajo del vendedor (default 9-18)
                      const horaInicio = vendedor.hora_inicio || 9
                      const horaFin = vendedor.hora_fin || 18

                      // Verificar vacaciones
                      const fechaCheck = new Date(fechaSeleccionada)
                      const enVacaciones = vendedor.vacation_start && vendedor.vacation_end &&
                        fechaCheck >= new Date(vendedor.vacation_start) &&
                        fechaCheck <= new Date(vendedor.vacation_end)

                      return (
                        <tr key={vendedor.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                          <td className="p-2 sticky left-0 bg-slate-800 font-medium">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${enVacaciones ? 'bg-red-500' : vendedor.is_on_duty ? 'bg-green-500' : 'bg-slate-500'}`} />
                              {vendedor.name?.split(' ')[0] || 'Sin nombre'}
                              {enVacaciones && <span className="text-xs text-red-400">🏖️</span>}
                            </div>
                          </td>
                          {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(hora => {
                            // Verificar si está en horario de trabajo
                            const enHorario = hora >= horaInicio && hora < horaFin && !enVacaciones

                            // Verificar si tiene cita a esa hora
                            const citaEnHora = citasVendedor.find(c => {
                              const horaC = parseInt(c.scheduled_time?.split(':')[0] || '0')
                              return horaC === hora
                            })

                            const ocupado = !!citaEnHora

                            return (
                              <td key={hora} className="p-1 text-center">
                                {!enHorario ? (
                                  <div className="w-full h-8 bg-slate-700/50 rounded cursor-not-allowed" title="Fuera de horario" />
                                ) : ocupado ? (
                                  <div
                                    className="w-full h-8 bg-red-600/80 rounded flex items-center justify-center cursor-pointer hover:bg-red-500 transition-colors"
                                    title={`${citaEnHora.lead_name} - ${citaEnHora.property_name}`}
                                    onClick={() => {
                                      showToast(`Cita a las ${hora}:00 | ${citaEnHora.lead_name} | ${citaEnHora.property_name} | ${citaEnHora.lead_phone}`, 'info')
                                    }}
                                  >
                                    <span className="text-xs">🔴</span>
                                  </div>
                                ) : (
                                  <div
                                    className="w-full h-8 bg-green-600/60 rounded flex items-center justify-center cursor-pointer hover:bg-green-500 transition-colors"
                                    title={`Agendar cita a las ${hora}:00 con ${vendedor.name}`}
                                    onClick={() => {
                                      // Pre-llenar el formulario de cita
                                      const formFecha = document.querySelector('input[name="coord_cita_fecha"]') as HTMLInputElement
                                      const formHora = document.querySelector('input[name="coord_cita_hora"]') as HTMLInputElement
                                      const formVendedor = document.querySelector('select[name="coord_vendedor"]') as HTMLSelectElement

                                      if (formFecha) formFecha.value = fechaSeleccionada
                                      if (formHora) formHora.value = `${hora.toString().padStart(2, '0')}:00`
                                      if (formVendedor) formVendedor.value = vendedor.id

                                      // Scroll al formulario
                                      document.querySelector('input[name="coord_nombre"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                      ;(document.querySelector('input[name="coord_nombre"]') as HTMLInputElement)?.focus()
                                    }}
                                  >
                                    <span className="text-xs">✓</span>
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400 mt-3">💡 Haz clic en un horario verde para agendar una cita</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* VENDEDORES DISPONIBLES / DE GUARDIA */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <UserCheck size={24} className="text-blue-400" /> Equipo Disponible Hoy
                </h3>
                <div className="space-y-3 max-h-80 overflow-auto">
                  {team.filter(t => t.role === 'vendedor' && t.active).map(v => {
                    const isOnDuty = v.is_on_duty
                    const vacationStart = v.vacation_start ? new Date(v.vacation_start) : null
                    const vacationEnd = v.vacation_end ? new Date(v.vacation_end) : null
                    const today = new Date()
                    const isOnVacation = vacationStart && vacationEnd && today >= vacationStart && today <= vacationEnd
                    const leadsAsignados = leads.filter(l => l.assigned_to === v.id && l.status !== 'closed' && l.status !== 'fallen').length

                    return (
                      <div key={v.id} className={`flex items-center justify-between p-3 rounded-xl ${isOnVacation ? 'bg-red-900/30 border border-red-600/30' : isOnDuty ? 'bg-green-900/30 border border-green-600/30' : 'bg-slate-700/50'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${isOnVacation ? 'bg-red-500' : isOnDuty ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
                          <div>
                            <p className="font-semibold">{v.name}</p>
                            <p className="text-xs text-slate-400">{v.phone}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded ${isOnVacation ? 'bg-red-600' : isOnDuty ? 'bg-green-600' : 'bg-slate-600'}`}>
                            {isOnVacation ? '🏖️ Vacaciones' : isOnDuty ? '🟢 De Guardia' : 'Disponible'}
                          </span>
                          <p className="text-xs text-slate-400 mt-1">{leadsAsignados} leads activos</p>
                        </div>
                      </div>
                    )
                  })}
                  {team.filter(t => t.role === 'vendedor' && t.active).length === 0 && (
                    <p className="text-slate-400 text-center py-4">No hay vendedores activos</p>
                  )}
                </div>
              </div>

              {/* LEADS SIN ASIGNAR */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <AlertCircle size={24} className="text-yellow-400" /> Leads Sin Asignar
                  {leads.filter(l => !l.assigned_to && l.status !== 'closed' && l.status !== 'fallen').length > 0 && (
                    <span className="bg-yellow-600 text-xs px-2 py-1 rounded-full ml-2">
                      {leads.filter(l => !l.assigned_to && l.status !== 'closed' && l.status !== 'fallen').length}
                    </span>
                  )}
                </h3>
                <div className="space-y-3 max-h-80 overflow-auto">
                  {leads.filter(l => !l.assigned_to && l.status !== 'closed' && l.status !== 'fallen').slice(0, 10).map(lead => (
                    <div key={lead.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-xl">
                      <div>
                        <p className="font-semibold">{lead.name}</p>
                        <p className="text-xs text-slate-400">{lead.phone} • {lead.property_interest || 'Sin desarrollo'}</p>
                        <p className="text-xs text-slate-400">{new Date(lead.created_at).toLocaleDateString('es-MX')}</p>
                      </div>
                      <select
                        className="bg-slate-600 rounded-lg px-3 py-2 text-sm"
                        onChange={async (e) => {
                          if (!e.target.value) return
                          await supabase.from('leads').update({ assigned_to: e.target.value }).eq('id', lead.id)
                          setLeads(leads.map(l => l.id === lead.id ? { ...l, assigned_to: e.target.value } : l))
                          const vendedorName = team.find(t => t.id === e.target.value)?.name?.split(' ')[0]
                          showToast(`Asignado a ${vendedorName}`, 'success')
                        }}
                        defaultValue=""
                      >
                        <option value="">Asignar a...</option>
                        {team.filter(t => t.role === 'vendedor' && t.active).map(v => (
                          <option key={v.id} value={v.id}>{v.name?.split(' ')[0] || 'Sin nombre'}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {leads.filter(l => !l.assigned_to && l.status !== 'closed' && l.status !== 'fallen').length === 0 && (
                    <p className="text-green-400 text-center py-4">✅ Todos los leads están asignados</p>
                  )}
                </div>
              </div>
            </div>

            {/* GESTIÓN DE CITAS - Próximas 7 días */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CalendarIcon size={24} className="text-purple-400" /> Gestión de Citas (Próximos 7 días)
              </h3>
              <div className="space-y-3 max-h-96 overflow-auto">
                {appointments
                  .filter(a => {
                    const citaDate = new Date(a.scheduled_date)
                    const today = new Date()
                    const in7Days = new Date()
                    in7Days.setDate(in7Days.getDate() + 7)
                    return citaDate >= today && citaDate <= in7Days && a.status === 'scheduled'
                  })
                  .sort((a, b) => {
                    const dateCompare = a.scheduled_date.localeCompare(b.scheduled_date)
                    if (dateCompare !== 0) return dateCompare
                    return a.scheduled_time.localeCompare(b.scheduled_time)
                  })
                  .map(cita => {
                    const vendedor = team.find(t => t.id === cita.vendedor_id)
                    const citaDate = new Date(cita.scheduled_date + 'T12:00:00')
                    const isToday = citaDate.toDateString() === new Date().toDateString()
                    const isTomorrow = citaDate.toDateString() === new Date(Date.now() + 86400000).toDateString()
                    const dayLabel = isToday ? 'HOY' : isTomorrow ? 'MAÑANA' : citaDate.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })

                    return (
                      <div key={cita.id} className={`bg-slate-700/50 p-4 rounded-xl border-l-4 ${isToday ? 'border-red-500' : isTomorrow ? 'border-yellow-500' : 'border-purple-500'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${isToday ? 'bg-red-600' : isTomorrow ? 'bg-yellow-600' : 'bg-purple-600'}`}>
                                {dayLabel}
                              </span>
                              <span className="text-lg font-bold text-white">{cita.scheduled_time?.slice(0, 5)}</span>
                            </div>
                            <p className="font-semibold">{cita.lead_name || 'Lead'}</p>
                            <p className="text-sm text-slate-400">{cita.property_name} • 👤 {vendedor?.name?.split(' ')[0] || 'Sin asignar'}</p>
                            <p className="text-xs text-slate-400">📱 {cita.lead_phone}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            {/* Botón Cambiar Cita */}
                            <button
                              onClick={() => {
                                setInputModal({
                                  title: `Cambiar cita de ${cita.lead_name}`,
                                  fields: [
                                    { name: 'fecha', label: 'Nueva fecha', type: 'date', defaultValue: cita.scheduled_date },
                                    { name: 'hora', label: 'Nueva hora', type: 'time', defaultValue: cita.scheduled_time?.slice(0, 5) },
                                    { name: 'motivo', label: 'Motivo del cambio', type: 'textarea' }
                                  ],
                                  onSubmit: async (values) => {
                                    try {
                                      await supabase.from('appointments').update({
                                        scheduled_date: values.fecha,
                                        scheduled_time: values.hora
                                      }).eq('id', cita.id)

                                      await safeFetch(`${API_BASE}/api/appointments/notify-change`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          appointment_id: cita.id,
                                          lead_name: cita.lead_name,
                                          lead_phone: cita.lead_phone,
                                          vendedor_phone: vendedor?.phone,
                                          vendedor_name: vendedor?.name,
                                          old_date: cita.scheduled_date,
                                          old_time: cita.scheduled_time,
                                          new_date: values.fecha,
                                          new_time: values.hora,
                                          property: cita.property_name,
                                          nota: values.motivo,
                                          coordinador_name: currentUser?.name || 'Coordinador',
                                          action: 'cambio'
                                        })
                                      })

                                      setAppointments(appointments.map(a =>
                                        a.id === cita.id ? { ...a, scheduled_date: values.fecha, scheduled_time: values.hora } : a
                                      ))

                                      showToast(`Cita reprogramada. Notificación enviada a ${vendedor?.name?.split(' ')[0]} y ${cita.lead_name}`, 'success')
                                    } catch (e) {
                                      showToast('Error al cambiar cita: ' + e, 'error')
                                    }
                                  }
                                })
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium flex items-center gap-1"
                            >
                              <Edit size={14} /> Cambiar
                            </button>
                            {/* Botón Cancelar Cita */}
                            <button
                              onClick={() => {
                                const tipoTextoCita = (cita as any).appointment_type === 'llamada' ? 'llamada' : 'cita';
                                setInputModal({
                                  title: `Cancelar ${tipoTextoCita} de ${cita.lead_name}`,
                                  fields: [
                                    { name: 'motivo', label: 'Motivo de cancelación', type: 'textarea' }
                                  ],
                                  onSubmit: async (values) => {
                                    if (!values.motivo) return
                                    try {
                                      await supabase.from('appointments').update({
                                        status: 'cancelled'
                                      }).eq('id', cita.id)

                                      await safeFetch(`${API_BASE}/api/appointments/notify-change`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          appointment_id: cita.id,
                                          lead_name: cita.lead_name,
                                          lead_phone: cita.lead_phone,
                                          vendedor_phone: vendedor?.phone,
                                          vendedor_name: vendedor?.name,
                                          old_date: cita.scheduled_date,
                                          old_time: cita.scheduled_time,
                                          property: cita.property_name,
                                          nota: values.motivo,
                                          coordinador_name: currentUser?.name || 'Coordinador',
                                          action: 'cancelacion'
                                        })
                                      })

                                      setAppointments(appointments.map(a =>
                                        a.id === cita.id ? { ...a, status: 'cancelled' } : a
                                      ))

                                      showToast(`Cita cancelada. Notificación enviada a ${vendedor?.name?.split(' ')[0]} y ${cita.lead_name}`, 'success')
                                    } catch (e) {
                                      showToast('Error al cancelar cita: ' + e, 'error')
                                    }
                                  }
                                })
                              }}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-medium flex items-center gap-1"
                            >
                              <X size={14} /> Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                {appointments.filter(a => {
                  const citaDate = new Date(a.scheduled_date)
                  const today = new Date()
                  const in7Days = new Date()
                  in7Days.setDate(in7Days.getDate() + 7)
                  return citaDate >= today && citaDate <= in7Days && a.status === 'scheduled'
                }).length === 0 && (
                  <p className="text-slate-400 text-center py-8">No hay citas programadas en los próximos 7 días</p>
                )}
              </div>
            </div>

            {/* RESUMEN RÁPIDO */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{leads.filter(l => l.status === 'new').length}</p>
                <p className="text-sm text-slate-400">Leads Nuevos</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-yellow-400">{leads.filter(l => !l.assigned_to && l.status !== 'closed' && l.status !== 'fallen').length}</p>
                <p className="text-sm text-slate-400">Sin Asignar</p>
              </div>
              <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-purple-400">
                  {appointments.filter(a => {
                    const citaDate = new Date(a.scheduled_date)
                    const today = new Date()
                    return citaDate.toDateString() === today.toDateString() && a.status === 'scheduled'
                  }).length}
                </p>
                <p className="text-sm text-slate-400">Citas Hoy</p>
              </div>
              <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-green-400">{team.filter(t => t.role === 'vendedor' && t.active && t.is_on_duty).length}</p>
                <p className="text-sm text-slate-400">De Guardia</p>
              </div>
            </div>

            {/* LEADS RECIENTES - Con opción de agregar notas */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MessageSquare size={24} className="text-orange-400" /> Leads Recientes (Agregar Notas)
              </h3>
              <div className="space-y-3 max-h-96 overflow-auto">
                {leads
                  .filter(l => l.status !== 'closed' && l.status !== 'fallen')
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 15)
                  .map(lead => {
                    const vendedor = team.find(t => t.id === lead.assigned_to)
                    return (
                      <div key={lead.id} className="bg-slate-700/50 p-4 rounded-xl">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{lead.name}</p>
                              <span className={`text-xs px-2 py-0.5 rounded ${lead.status === 'new' ? 'bg-blue-600' : lead.status === 'contacted' ? 'bg-yellow-600' : lead.status === 'qualified' ? 'bg-green-600' : 'bg-slate-600'}`}>
                                {STATUS_LABELS[lead.status] || lead.status}
                              </span>
                            </div>
                            <p className="text-sm text-slate-400">{lead.phone} • {lead.property_interest || 'Sin desarrollo'}</p>
                            <p className="text-xs text-slate-400">
                              👤 {vendedor?.name?.split(' ')[0] || 'Sin asignar'} •
                              📅 {new Date(lead.created_at).toLocaleDateString('es-MX')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {/* Botón Agregar Nota */}
                            <button
                              onClick={async () => {
                                setInputModal({
                                  title: `Nota para ${lead.name}`,
                                  fields: [
                                    { name: 'nota', label: `Se enviará al vendedor ${vendedor?.name?.split(' ')[0] || 'asignado'} por WhatsApp`, type: 'textarea' }
                                  ],
                                  onSubmit: async (values) => {
                                    if (!values.nota) return
                                    try {
                                      const notasActuales = lead.notes || {}
                                      const nuevasNotas = {
                                        ...notasActuales,
                                        notas_coordinador: [
                                          ...(notasActuales.notas_coordinador || []),
                                          {
                                            texto: values.nota,
                                            fecha: new Date().toISOString(),
                                            autor: currentUser?.name || 'Coordinador'
                                          }
                                        ]
                                      }

                                      await supabase.from('leads').update({ notes: nuevasNotas }).eq('id', lead.id)

                                      if (vendedor?.phone) {
                                        await safeFetch(`${API_BASE}/api/leads/notify-note`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            lead_name: lead.name,
                                            lead_phone: lead.phone,
                                            vendedor_phone: vendedor.phone,
                                            vendedor_name: vendedor.name,
                                            nota: values.nota,
                                            coordinador_name: currentUser?.name || 'Coordinador'
                                          })
                                        })
                                      }

                                      setLeads(leads.map(l => l.id === lead.id ? { ...l, notes: nuevasNotas } : l))
                                      showToast(`Nota agregada. Notificación enviada a ${vendedor?.name?.split(' ')[0] || 'vendedor'}`, 'success')
                                    } catch (e) {
                                      showToast('Error: ' + e, 'error')
                                    }
                                  }
                                })
                              }}
                              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 rounded-lg text-xs font-medium flex items-center gap-1"
                            >
                              <MessageSquare size={14} /> Nota
                            </button>
                            {/* Botón Reasignar */}
                            <select
                              className="px-2 py-1.5 bg-slate-600 hover:bg-slate-500 rounded-lg text-xs"
                              value={lead.assigned_to || ''}
                              onChange={(e) => {
                                const nuevoVendedorId = e.target.value
                                if (!nuevoVendedorId) return

                                const nuevoVendedor = team.find(t => t.id === nuevoVendedorId)
                                setInputModal({
                                  title: `Reasignar ${lead.name} a ${nuevoVendedor?.name?.split(' ')[0]}`,
                                  fields: [
                                    { name: 'nota', label: 'Nota para el nuevo vendedor', type: 'textarea' }
                                  ],
                                  onSubmit: async (values) => {
                                    try {
                                      await supabase.from('leads').update({ assigned_to: nuevoVendedorId }).eq('id', lead.id)

                                      if (nuevoVendedor?.phone) {
                                        await safeFetch(`${API_BASE}/api/leads/notify-reassign`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            lead_name: lead.name,
                                            lead_phone: lead.phone,
                                            property_interest: lead.property_interest,
                                            vendedor_phone: nuevoVendedor.phone,
                                            vendedor_name: nuevoVendedor.name,
                                            nota: values.nota || 'Reasignado por coordinador',
                                            coordinador_name: currentUser?.name || 'Coordinador'
                                          })
                                        })
                                      }

                                      setLeads(leads.map(l => l.id === lead.id ? { ...l, assigned_to: nuevoVendedorId } : l))
                                      showToast(`Lead reasignado a ${nuevoVendedor?.name?.split(' ')[0]}. Notificación enviada`, 'success')
                                    } catch (e) {
                                      showToast('Error: ' + e, 'error')
                                    }
                                  }
                                })
                              }}
                            >
                              <option value="">Reasignar...</option>
                              {team.filter(t => t.role === 'vendedor' && t.active && t.id !== lead.assigned_to).map(v => (
                                <option key={v.id} value={v.id}>{v.name?.split(' ')[0] || 'Sin nombre'}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
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
                    <p className="text-xs text-slate-400 mt-1 text-center">días</p>
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
                    <p className="text-xs text-slate-400 mt-1 text-center">días sin actualizar</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-4">El asesor puede responder: "Aprobado Juan", "Rechazado Juan", "Documentos Juan"</p>
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
          leads={leads}
          properties={properties}
        />
      )}

      {(editingCrmEvent || showNewCrmEvent) && (
        <CrmEventModal
          event={editingCrmEvent}
          onSave={saveCrmEvent}
          onClose={() => { setEditingCrmEvent(null); setShowNewCrmEvent(false); }}
          leads={leads}
          properties={properties}
        />
      )}

      {showInviteEventModal && selectedEventForInvite && (
        <InviteEventModal
          event={selectedEventForInvite}
          onSend={sendEventInvitations}
          onClose={() => { setShowInviteEventModal(false); setSelectedEventForInvite(null); }}
          sending={inviteSending}
        />
      )}

      {/* Modal Enviar Promoción con Segmentación Especializada */}
      {showSendPromoModal && selectedPromoToSend && (
        <SendPromoModal
          promo={selectedPromoToSend}
          onSend={sendPromoReal}
          onClose={() => { setShowSendPromoModal(false); setSelectedPromoToSend(null); }}
          sending={promoSending}
          leads={leads}
          properties={properties}
          team={team}
        />
      )}

      {showNewEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewEvent(false)}>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Agendar Cita</h3>
              <button onClick={() => setShowNewEvent(false)} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Cliente</label>
                <select id="evt-cliente" className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="">Seleccionar</option>
                  {leads.map(l => <option key={l.id} value={(l.name||"")+ "|" + (l.phone||"")}>{l.name || l.phone}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Propiedad</label>
                <select id="evt-prop" className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="">Seleccionar</option>
                  {properties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Fecha</label>
                <input type="date" id="evt-date" min={new Date().toISOString().split('T')[0]} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Hora</label>
                <select id="evt-time" className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
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
                    description: "Cliente: " + cn + "\nTeléfono: " + cp + "\nPropiedad: " + pr,
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
                <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X /></button>
              </div>
            </div>
            <div className="space-y-3">
              <p><span className="font-semibold">Teléfono:</span> {selectedLead.phone}</p>
              <p><span className="font-semibold">Score:</span> <span className={`${getScoreColor(selectedLead.score)} px-2 py-1 rounded`}>{selectedLead.score} {selectedLead.score >= 70 ? '🔥' : selectedLead.score >= 40 ? '⚡' : '❄️'}</span></p>
              <p><span className="font-semibold">Estado:</span> {STATUS_LABELS[selectedLead.status] || selectedLead.status}</p>
              {selectedLead.status === 'fallen' && selectedLead.fallen_reason && (
                <p><span className="font-semibold">Motivo:</span> <span className="text-red-400">{selectedLead.fallen_reason}</span></p>
              )}
              {selectedLead.credit_status && (
                <p><span className="font-semibold">Crédito:</span> <span className={selectedLead.credit_status === 'approved' ? 'text-green-400' : selectedLead.credit_status === 'active' ? 'text-yellow-400' : 'text-red-400'}>{{ approved: 'Aprobado', active: 'En proceso', rejected: 'Rechazado', pending: 'Pendiente' }[selectedLead.credit_status] || selectedLead.credit_status}</span></p>
              )}
              <p><span className="font-semibold">Interés:</span> {selectedLead.property_interest || 'No definido'}</p>
              {selectedLead.notes?.vendor_feedback?.rating && (() => {
                const vf = selectedLead.notes.vendor_feedback;
                const emoji = vf.rating === 1 ? '🔥' : vf.rating === 2 ? '👍' : vf.rating === 3 ? '😐' : '❄️';
                const colors = { 1: 'bg-red-500/20 text-red-300 border-red-500/30', 2: 'bg-green-500/20 text-green-300 border-green-500/30', 3: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', 4: 'bg-blue-500/20 text-blue-300 border-blue-500/30' } as Record<number, string>;
                return (
                  <div className={`mt-2 px-3 py-2 rounded-lg border ${colors[vf.rating] || colors[3]}`}>
                    <span className="font-semibold">{emoji} Post-visita:</span> {vf.rating_text}
                    {vf.vendedor_name && <span className="text-xs ml-2 opacity-70">({vf.vendedor_name.split(' ')[0]})</span>}
                  </div>
                );
              })()}

              {/* Sección de Apartado - Solo si tiene datos de apartado */}
              {selectedLead.status === 'reserved' && selectedLead.notes?.apartado && (
                <div className="mt-4 p-4 bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 rounded-xl">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-emerald-400">
                    📋 Datos de Apartado
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-400">💰 Enganche:</span>
                      <span className="ml-2 font-semibold text-emerald-300">
                        ${selectedLead.notes.apartado.enganche?.toLocaleString('es-MX') || '0'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">🏠 Propiedad:</span>
                      <span className="ml-2 font-semibold">
                        {selectedLead.notes.apartado.propiedad || selectedLead.property_interest || 'Por definir'}
                      </span>
                    </div>
                    {selectedLead.notes.apartado.fecha_apartado && (
                      <div>
                        <span className="text-slate-400">📅 Fecha apartado:</span>
                        <span className="ml-2">
                          {new Date(selectedLead.notes.apartado.fecha_apartado + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                    {selectedLead.notes.apartado.fecha_pago && (
                      <div>
                        <span className="text-slate-400">⏰ Fecha pago:</span>
                        <span className="ml-2 font-semibold text-yellow-300">
                          {new Date(selectedLead.notes.apartado.fecha_pago + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                  {selectedLead.notes.apartado.fecha_pago && (() => {
                    const hoy = new Date();
                    const fechaPago = new Date(selectedLead.notes.apartado.fecha_pago + 'T12:00:00');
                    const diasRestantes = Math.ceil((fechaPago.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <div className={`mt-3 p-2 rounded-lg text-center font-semibold ${
                        diasRestantes < 0 ? 'bg-red-600/30 text-red-300' :
                        diasRestantes <= 3 ? 'bg-orange-600/30 text-orange-300' :
                        diasRestantes <= 7 ? 'bg-yellow-600/30 text-yellow-300' :
                        'bg-emerald-600/30 text-emerald-300'
                      }`}>
                        {diasRestantes < 0
                          ? `⚠️ Pago vencido hace ${Math.abs(diasRestantes)} día(s)`
                          : diasRestantes === 0
                          ? '🔔 ¡Hoy es el día del pago!'
                          : `📆 Faltan ${diasRestantes} día(s) para el pago`
                        }
                      </div>
                    );
                  })()}
                  {selectedLead.notes.apartado.vendedor_nombre && (
                    <p className="mt-2 text-xs text-slate-400">
                      Registrado por: {selectedLead.notes.apartado.vendedor_nombre}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4">
                <h4 className="font-semibold mb-2">Historial de conversación:</h4>
                <div className="bg-slate-700 p-4 rounded-xl max-h-96 overflow-y-auto">
                  {selectedLead.conversation_history && selectedLead.conversation_history.length > 0 ? (
                    selectedLead.conversation_history.map((msg: any, i: number) => {
                      // Determinar color y etiqueta según el rol
                      let colorClass = 'text-green-400';
                      let label = 'SARA';

                      if (msg.role === 'user') {
                        colorClass = 'text-blue-400';
                        label = 'Cliente';
                      } else if (msg.role === 'vendedor') {
                        colorClass = 'text-orange-400';
                        label = msg.vendedor_name ? `Vendedor (${msg.vendedor_name})` : 'Vendedor';
                      }

                      return (
                        <div key={i} className={`mb-3 ${colorClass} break-words`}>
                          <span className="font-semibold">{label}:</span> {msg.content}
                          {msg.via_bridge && <span className="text-xs text-slate-400 ml-2">(chat directo)</span>}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-slate-400">Sin historial de conversación</p>
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
                    <p className="text-slate-400">Cargando actividades...</p>
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
                    <p className="text-slate-400">Sin actividades registradas</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* InputModal - reemplaza prompt() nativos */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setConfirmModal(null)}>
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-slate-400 mb-5">{confirmModal.message}</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmModal(null)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm">Cancelar</button>
              <button onClick={confirmModal.onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {inputModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setInputModal(null)}>
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{inputModal.title}</h3>
            <form onSubmit={e => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const values: Record<string, string> = {}
              inputModal.fields.forEach(f => { values[f.name] = formData.get(f.name) as string || '' })
              inputModal.onSubmit(values)
              setInputModal(null)
            }}>
              {inputModal.fields.map(field => (
                <div key={field.name} className="mb-3">
                  <label className="block text-sm text-slate-400 mb-1">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea name={field.name} defaultValue={field.defaultValue} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" rows={3} autoFocus={inputModal.fields[0].name === field.name} />
                  ) : (
                    <input name={field.name} type={field.type || 'text'} defaultValue={field.defaultValue} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" autoFocus={inputModal.fields[0].name === field.name} />
                  )}
                </div>
              ))}
              <div className="flex gap-2 justify-end mt-4">
                <button type="button" onClick={() => setInputModal(null)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-fade-in max-w-sm ${
          toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`} onClick={() => setToast(null)}>
          {toast.message}
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
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nombre</label>
            <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Categoría</label>
            <input value={form.category || ''} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Precio Base</label>
            <input type="number" min="0" value={form.price || ''} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Precio Equipada</label>
            <input type="number" min="0" value={form.price_equipped || ''} onChange={e => setForm({...form, price_equipped: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Terreno m²</label>
            <input type="number" min="0" value={form.land_size || ''} onChange={e => setForm({...form, land_size: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Pisos</label>
            <input type="number" min="0" value={form.floors || ''} onChange={e => setForm({...form, floors: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Recámaras</label>
            <input type="number" min="0" value={form.bedrooms || ''} onChange={e => setForm({...form, bedrooms: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Baños</label>
            <input type="number" min="0" value={form.bathrooms || ''} onChange={e => setForm({...form, bathrooms: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">m²</label>
            <input type="number" min="0" value={form.area_m2 || ''} onChange={e => setForm({...form, area_m2: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Total Unidades</label>
            <input type="number" min="0" value={form.total_units || ''} onChange={e => setForm({...form, total_units: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Vendidas</label>
            <input type="number" min="0" value={form.sold_units || ''} onChange={e => setForm({...form, sold_units: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Descripción</label>
            <textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={3} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">URL Imagen</label>
            <input value={form.photo_url || ''} onChange={e => setForm({...form, photo_url: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">YouTube Link</label>
            <input value={form.youtube_link || ''} onChange={e => setForm({...form, youtube_link: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://youtu.be/..." />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Matterport 3D</label>
            <input value={form.matterport_link || ''} onChange={e => setForm({...form, matterport_link: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://my.matterport.com/..." />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">GPS / Ubicación</label>
            <input value={form.gps_link || ''} onChange={e => setForm({...form, gps_link: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://maps.google.com/..." />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Brochure PDF</label>
            <input value={form.brochure_urls || ''} onChange={e => setForm({...form, brochure_urls: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="URL del PDF..." />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Galería (URLs separadas por coma)</label>
            <input value={form.gallery_urls || ''} onChange={e => setForm({...form, gallery_urls: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="url1, url2, url3..." />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Frase de Venta</label>
            <input value={form.sales_phrase || ''} onChange={e => setForm({...form, sales_phrase: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="El pitch de venta..." />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Cliente Ideal</label>
            <input value={form.ideal_client || ''} onChange={e => setForm({...form, ideal_client: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Para quién es esta propiedad..." />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Desarrollo</label>
            <input value={form.development || ''} onChange={e => setForm({...form, development: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Ciudad</label>
            <input value={form.city || ''} onChange={e => setForm({...form, city: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
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
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nombre</label>
            <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Teléfono</label>
            <input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Interés en propiedad</label>
            <select value={form.property_interest || ''} onChange={e => setForm({...form, property_interest: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">Seleccionar...</option>
              {properties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Presupuesto</label>
            <input value={form.budget || ''} onChange={e => setForm({...form, budget: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="ej: 500,000 - 800,000" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Score (1-10)</label>
            <input type="number" min="1" max="10" value={form.score || ''} onChange={e => setForm({...form, score: parseInt(e.target.value) || 0})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Estado</label>
            <select value={form.status || ''} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Fuente</label>
            <input value={form.source || ''} onChange={e => setForm({...form, source: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="ej: Facebook, Referido" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Asignado a</label>
            <select value={form.assigned_to || ''} onChange={e => setForm({...form, assigned_to: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">Sin asignar</option>
              {team.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Estado de crédito</label>
            <select value={form.credit_status || ''} onChange={e => setForm({...form, credit_status: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              {creditOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
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
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X /></button>
        </div>
        <div className="space-y-4">
          {/* Datos básicos */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nombre</label>
            <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <input type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="nombre@gruposantarita.com" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">WhatsApp</label>
            <input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="5215512345678" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Rol</label>
            <select value={form.role || ''} onChange={e => setForm({...form, role: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
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
                <input type="time" value={form.work_start || '09:00'} onChange={e => setForm({...form, work_start: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Hora salida</label>
                <input type="time" value={form.work_end || '18:00'} onChange={e => setForm({...form, work_end: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
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
                <input type="date" value={form.vacation_start || ''} onChange={e => setForm({...form, vacation_start: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Vacaciones hasta</label>
                <input type="date" value={form.vacation_end || ''} onChange={e => setForm({...form, vacation_end: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
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
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Lead</label>
            <select value={form.lead_id || ''} onChange={e => {
              const lead = leads.find(l => l.id === e.target.value)
              setForm({...form, lead_id: e.target.value, lead_name: lead?.name || '', lead_phone: lead?.phone || ''})
            }} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">Seleccionar lead</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name || l.phone}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Propiedad</label>
            <select value={form.property_id || ''} onChange={e => {
              const prop = properties.find(p => p.id === e.target.value)
              setForm({...form, property_id: e.target.value, property_name: prop?.name || '', requested_amount: prop?.price || 0})
            }} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">Seleccionar propiedad</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Ingreso Mensual</label>
            <input type="number" value={form.monthly_income || ''} onChange={e => setForm({...form, monthly_income: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Deuda Actual</label>
            <input type="number" value={form.current_debt || ''} onChange={e => setForm({...form, current_debt: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Enganche</label>
            <input type="number" value={form.down_payment || ''} onChange={e => setForm({...form, down_payment: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Asesor</label>
            <select value={form.assigned_advisor_id || ''} onChange={e => {
              const asesor = asesores.find(a => a.id === e.target.value)
              setForm({...form, assigned_advisor_id: e.target.value, assigned_advisor_name: asesor?.name || ''})
            }} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">Seleccionar asesor</option>
              {asesores.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Estado</label>
            <select value={form.status || ''} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="pending">Pendiente</option>
              <option value="in_review">En Revisión</option>
              <option value="sent_to_bank">Enviado a Banco</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Banco</label>
            <input value={form.bank || ''} onChange={e => setForm({...form, bank: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
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
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X /></button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Nombre de Campaña</label>
            <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Estado</label>
            <select value={form.status || ''} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="active">Activa</option>
              <option value="paused">Pausada</option>
              <option value="completed">Completada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Canal</label>
            <select value={form.channel || ''} onChange={e => setForm({...form, channel: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
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
            <input type="number" value={form.budget || ''} onChange={e => setForm({...form, budget: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Gastado</label>
            <input type="number" value={form.spent || ''} onChange={e => setForm({...form, spent: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Impresiones</label>
            <input type="number" value={form.impressions || ''} onChange={e => setForm({...form, impressions: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Clicks</label>
            <input type="number" value={form.clicks || ''} onChange={e => setForm({...form, clicks: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Leads Generados</label>
            <input type="number" value={form.leads_generated || ''} onChange={e => setForm({...form, leads_generated: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Ventas Cerradas</label>
            <input type="number" value={form.sales_closed || ''} onChange={e => setForm({...form, sales_closed: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Ingresos Generados</label>
            <input type="number" value={form.revenue_generated || ''} onChange={e => setForm({...form, revenue_generated: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Fecha Inicio</label>
            <input type="date" value={form.start_date || ''} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Fecha Fin</label>
            <input type="date" value={form.end_date || ''} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="col-span-3">
            <label className="block text-sm text-slate-400 mb-1">Audiencia Target</label>
            <input value={form.target_audience || ''} onChange={e => setForm({...form, target_audience: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="col-span-3">
            <label className="block text-sm text-slate-400 mb-1">Notas</label>
            <textarea value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={2} />
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

// ═══════════════════════════════════════════════════════════════
// COMPONENTE DE SEGMENTACIÓN AVANZADA
// ═══════════════════════════════════════════════════════════════
interface SegmentFilters {
  status: string[]
  temperature: string[]
  desarrollos: string[]
  needs_mortgage: boolean | null
  is_buyer: boolean | null
  source: string[]
  min_score: number | null
  max_score: number | null
}

function SegmentSelector({
  filters,
  onChange,
  leads,
  properties
}: {
  filters: SegmentFilters,
  onChange: (f: SegmentFilters) => void,
  leads: Lead[],
  properties: Property[]
}) {
  // Contar leads que coinciden con los filtros actuales
  const matchingLeads = leads.filter(lead => {
    // Filtro por status
    if (filters.status.length > 0 && !filters.status.includes(lead.status)) return false

    // Filtro por temperatura (basado en score)
    if (filters.temperature.length > 0) {
      const temp = lead.score >= 70 ? 'hot' : lead.score >= 40 ? 'warm' : 'cold'
      if (!filters.temperature.includes(temp)) return false
    }

    // Filtro por desarrollo
    if (filters.desarrollos.length > 0 && lead.property_interest) {
      const matchDesarrollo = filters.desarrollos.some(d =>
        lead.property_interest?.toLowerCase().includes(d.toLowerCase())
      )
      if (!matchDesarrollo) return false
    }

    // Filtro por hipoteca
    if (filters.needs_mortgage === true && lead.credit_status !== 'active' && lead.credit_status !== 'approved') return false
    if (filters.needs_mortgage === false && (lead.credit_status === 'active' || lead.credit_status === 'approved')) return false

    // Filtro por comprador
    if (filters.is_buyer === true && lead.status !== 'closed_won' && lead.status !== 'delivered') return false
    if (filters.is_buyer === false && (lead.status === 'closed_won' || lead.status === 'delivered')) return false

    // Filtro por source
    if (filters.source.length > 0 && lead.source && !filters.source.includes(lead.source)) return false

    // Filtro por score
    if (filters.min_score !== null && lead.score < filters.min_score) return false
    if (filters.max_score !== null && lead.score > filters.max_score) return false

    return true
  })

  // Obtener desarrollos únicos de propiedades
  const desarrollosUnicos = [...new Set(properties.map(p => p.name).filter(Boolean))]

  // Sources únicos
  const sourcesUnicos = [...new Set(leads.map(l => l.source).filter(Boolean))]

  const toggleArrayValue = (arr: string[], value: string) => {
    return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
  }

  return (
    <div className="bg-slate-700/50 rounded-xl p-4 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-600 pb-2">
        <h4 className="font-semibold text-purple-400">Segmentación Avanzada</h4>
        <span className="bg-purple-600 px-3 py-1 rounded-full text-sm font-bold">
          {matchingLeads.length} leads
        </span>
      </div>

      {/* Status del Lead */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">Estado del Lead</label>
        <div className="flex flex-wrap gap-2">
          {['new', 'contacted', 'qualified', 'appointment_scheduled', 'closed_won', 'fallen'].map(status => (
            <button
              key={status}
              onClick={() => onChange({...filters, status: toggleArrayValue(filters.status, status)})}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                filters.status.includes(status)
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
            >
              {status === 'new' ? 'Nuevos' :
               status === 'contacted' ? 'Contactados' :
               status === 'qualified' ? 'Calificados' :
               status === 'appointment_scheduled' ? 'Cita Agendada' :
               status === 'closed_won' ? 'Compradores' :
               status === 'fallen' ? 'Caídos' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Temperatura */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">Temperatura</label>
        <div className="flex gap-2">
          {[
            { value: 'hot', label: 'HOT', color: 'bg-red-600' },
            { value: 'warm', label: 'WARM', color: 'bg-yellow-600' },
            { value: 'cold', label: 'COLD', color: 'bg-blue-600' }
          ].map(temp => (
            <button
              key={temp.value}
              onClick={() => onChange({...filters, temperature: toggleArrayValue(filters.temperature, temp.value)})}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filters.temperature.includes(temp.value)
                  ? temp.color + ' text-white'
                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
            >
              {temp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desarrollos */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">Desarrollo de Interés</label>
        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
          {desarrollosUnicos.slice(0, 10).map(desarrollo => (
            <button
              key={desarrollo}
              onClick={() => onChange({...filters, desarrollos: toggleArrayValue(filters.desarrollos, desarrollo)})}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                filters.desarrollos.includes(desarrollo)
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
            >
              {desarrollo}
            </button>
          ))}
        </div>
      </div>

      {/* Hipoteca y Compradores */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Crédito Hipotecario</label>
          <div className="flex gap-2">
            <button
              onClick={() => onChange({...filters, needs_mortgage: filters.needs_mortgage === true ? null : true})}
              className={`px-3 py-2 rounded-lg text-sm flex-1 ${
                filters.needs_mortgage === true ? 'bg-orange-600' : 'bg-slate-600 hover:bg-slate-500'
              }`}
            >
              Con Hipoteca
            </button>
            <button
              onClick={() => onChange({...filters, needs_mortgage: filters.needs_mortgage === false ? null : false})}
              className={`px-3 py-2 rounded-lg text-sm flex-1 ${
                filters.needs_mortgage === false ? 'bg-slate-500' : 'bg-slate-600 hover:bg-slate-500'
              }`}
            >
              Sin Hipoteca
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-2">Tipo</label>
          <div className="flex gap-2">
            <button
              onClick={() => onChange({...filters, is_buyer: filters.is_buyer === true ? null : true})}
              className={`px-3 py-2 rounded-lg text-sm flex-1 ${
                filters.is_buyer === true ? 'bg-green-600' : 'bg-slate-600 hover:bg-slate-500'
              }`}
            >
              Compradores
            </button>
            <button
              onClick={() => onChange({...filters, is_buyer: filters.is_buyer === false ? null : false})}
              className={`px-3 py-2 rounded-lg text-sm flex-1 ${
                filters.is_buyer === false ? 'bg-blue-600' : 'bg-slate-600 hover:bg-slate-500'
              }`}
            >
              Prospectos
            </button>
          </div>
        </div>
      </div>

      {/* Source */}
      {sourcesUnicos.length > 0 && (
        <div>
          <label className="block text-sm text-slate-400 mb-2">Origen</label>
          <div className="flex flex-wrap gap-2">
            {sourcesUnicos.slice(0, 6).map(source => (
              <button
                key={source}
                onClick={() => onChange({...filters, source: toggleArrayValue(filters.source, source!)})}
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  filters.source.includes(source!)
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                }`}
              >
                {source}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Limpiar filtros */}
      <button
        onClick={() => onChange({
          status: [], temperature: [], desarrollos: [],
          needs_mortgage: null, is_buyer: null, source: [],
          min_score: null, max_score: null
        })}
        className="w-full py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm text-slate-300"
      >
        Limpiar Filtros (Enviar a Todos)
      </button>
    </div>
  )
}

function PromotionModal({ promotion, onSave, onClose, leads, properties }: {
  promotion: Promotion | null,
  onSave: (p: Partial<Promotion>) => void,
  onClose: () => void,
  leads: Lead[],
  properties: Property[]
}) {
  const [form, setForm] = useState<Partial<Promotion>>(promotion || {
    name: '', description: '', start_date: '', end_date: '', message: '',
    image_url: '', video_url: '', pdf_url: '', target_segment: 'todos', reminder_enabled: true,
    reminder_frequency: 'weekly', status: 'scheduled'
  })

  // Estado para segmentación avanzada
  const defaultFilters: SegmentFilters = {
    status: [], temperature: [], desarrollos: [],
    needs_mortgage: null, is_buyer: null, source: [],
    min_score: null, max_score: null
  }

  // Parsear filtros existentes si los hay
  const parseExistingFilters = (): SegmentFilters => {
    if (promotion?.segment_filters) {
      try {
        const parsed = typeof promotion.segment_filters === 'string'
          ? JSON.parse(promotion.segment_filters)
          : promotion.segment_filters
        return { ...defaultFilters, ...parsed }
      } catch { return defaultFilters }
    }
    return defaultFilters
  }

  const [segmentFilters, setSegmentFilters] = useState<SegmentFilters>(parseExistingFilters())
  const [showAdvancedSegment, setShowAdvancedSegment] = useState(false)

  // Guardar con filtros
  const handleSave = () => {
    const hasFilters = segmentFilters.status.length > 0 ||
      segmentFilters.temperature.length > 0 ||
      segmentFilters.desarrollos.length > 0 ||
      segmentFilters.needs_mortgage !== null ||
      segmentFilters.is_buyer !== null ||
      segmentFilters.source.length > 0

    onSave({
      ...form,
      target_segment: hasFilters ? 'custom' : form.target_segment,
      segment_filters: hasFilters ? JSON.stringify(segmentFilters) : null
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{promotion ? 'Editar Promoción' : 'Nueva Promoción'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Nombre de la Promoción</label>
            <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ej: Outlet Santa Rita Enero 2026" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Fecha Inicio</label>
            <input type="date" value={form.start_date || ''} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Fecha Fin</label>
            <input type="date" value={form.end_date || ''} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>

          {/* Toggle para segmentación avanzada */}
          <div className="col-span-2 border-t border-slate-600 pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-slate-400">Segmentación de Audiencia</label>
              <button
                onClick={() => setShowAdvancedSegment(!showAdvancedSegment)}
                className={`px-3 py-1 rounded-lg text-sm ${showAdvancedSegment ? 'bg-purple-600' : 'bg-slate-600'}`}
              >
                {showAdvancedSegment ? 'Ocultar Avanzado' : 'Segmentación Avanzada'}
              </button>
            </div>

            {!showAdvancedSegment ? (
              <select value={form.target_segment || 'todos'} onChange={e => setForm({...form, target_segment: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="todos">Todos los leads</option>
                <option value="hot">Solo HOT</option>
                <option value="warm">Solo WARM</option>
                <option value="cold">Solo COLD</option>
                <option value="compradores">Compradores</option>
                <option value="caidos">Caidos</option>
                <option value="new">Nuevos</option>
              </select>
            ) : (
              <SegmentSelector
                filters={segmentFilters}
                onChange={setSegmentFilters}
                leads={leads}
                properties={properties}
              />
            )}
          </div>

          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Estado</label>
            <select value={form.status || 'scheduled'} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="scheduled">Programada</option>
              <option value="active">Activa</option>
              <option value="paused">Pausada</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Mensaje de la Promoción</label>
            <textarea value={form.message || ''} onChange={e => setForm({...form, message: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={4} placeholder="Escribe el mensaje que se enviara a los leads..." />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Descripción (opcional)</label>
            <input value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Descripción interna de la promocion" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">URL de Imagen (opcional)</label>
            <input value={form.image_url || ''} onChange={e => setForm({...form, image_url: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://ejemplo.com/imagen.jpg" />
            {form.image_url && <img src={form.image_url} alt="Vista previa" className="mt-2 h-20 rounded-lg object-cover" />}
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">URL de Video (opcional)</label>
            <input value={form.video_url || ''} onChange={e => setForm({...form, video_url: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://youtube.com/watch?v=..." />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">URL de PDF/Brochure (opcional)</label>
            <input value={form.pdf_url || ''} onChange={e => setForm({...form, pdf_url: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://ejemplo.com/brochure.pdf" />
          </div>
          <div className="col-span-2 border-t border-slate-600 pt-4 mt-2">
            <div className="flex items-center gap-3 mb-3">
              <input type="checkbox" id="reminder-enabled" checked={form.reminder_enabled || false} onChange={e => setForm({...form, reminder_enabled: e.target.checked})} className="w-5 h-5 rounded" />
              <label htmlFor="reminder-enabled" className="text-sm">Activar recordatorios automáticos</label>
            </div>
            {form.reminder_enabled && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Frecuencia de recordatorios</label>
                <select value={form.reminder_frequency || 'weekly'} onChange={e => setForm({...form, reminder_frequency: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
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
          <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Save size={20} /> Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

function CrmEventModal({ event, onSave, onClose, leads, properties }: {
  event: CRMEvent | null,
  onSave: (e: Partial<CRMEvent>) => void,
  onClose: () => void,
  leads: Lead[],
  properties: Property[]
}) {
  const [form, setForm] = useState<Partial<CRMEvent>>(event || {
    name: '', description: '', event_type: 'open_house', event_date: '',
    event_time: '10:00', location: '', location_url: '', max_capacity: 50,
    image_url: '', video_url: '', pdf_url: '', invitation_message: '', status: 'scheduled'
  })

  // Estado para segmentación avanzada
  const defaultFilters: SegmentFilters = {
    status: [], temperature: [], desarrollos: [],
    needs_mortgage: null, is_buyer: null, source: [],
    min_score: null, max_score: null
  }

  const parseExistingFilters = (): SegmentFilters => {
    if (event?.segment_filters) {
      try {
        const parsed = typeof event.segment_filters === 'string'
          ? JSON.parse(event.segment_filters)
          : event.segment_filters
        return { ...defaultFilters, ...parsed }
      } catch { return defaultFilters }
    }
    return defaultFilters
  }

  const [segmentFilters, setSegmentFilters] = useState<SegmentFilters>(parseExistingFilters())
  const [showAdvancedSegment, setShowAdvancedSegment] = useState(false)

  const handleSave = () => {
    const hasFilters = segmentFilters.status.length > 0 ||
      segmentFilters.temperature.length > 0 ||
      segmentFilters.desarrollos.length > 0 ||
      segmentFilters.needs_mortgage !== null ||
      segmentFilters.is_buyer !== null ||
      segmentFilters.source.length > 0

    onSave({
      ...form,
      target_segment: hasFilters ? 'custom' : 'todos',
      segment_filters: hasFilters ? JSON.stringify(segmentFilters) : null
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{event ? 'Editar Evento' : 'Nuevo Evento'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Nombre del Evento</label>
            <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ej: Open House Santa Rita" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Tipo de Evento</label>
            <select value={form.event_type || 'open_house'} onChange={e => setForm({...form, event_type: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
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
            <select value={form.status || 'scheduled'} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="scheduled">Programado</option>
              <option value="upcoming">Proximo</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Fecha</label>
            <input type="date" value={form.event_date || ''} onChange={e => setForm({...form, event_date: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Hora</label>
            <input type="time" value={form.event_time || '10:00'} onChange={e => setForm({...form, event_time: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Ubicacion</label>
            <input value={form.location || ''} onChange={e => setForm({...form, location: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ej: Sala de Ventas Santa Rita, Av. Principal #123" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">URL Mapa (opcional)</label>
            <input value={form.location_url || ''} onChange={e => setForm({...form, location_url: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://maps.google.com/..." />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Capacidad Maxima</label>
            <input type="number" value={form.max_capacity || ''} onChange={e => setForm({...form, max_capacity: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Descripción</label>
            <textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={3} placeholder="Describe el evento..." />
          </div>
          <div className="col-span-2 border-t border-slate-600 pt-4 mt-2">
            <p className="text-sm text-emerald-400 font-semibold mb-3">Contenido para Invitaciones</p>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">URL Imagen</label>
            <input value={form.image_url || ''} onChange={e => setForm({...form, image_url: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://ejemplo.com/imagen.jpg" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">URL Video</label>
            <input value={form.video_url || ''} onChange={e => setForm({...form, video_url: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://ejemplo.com/video.mp4" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">URL PDF/Flyer</label>
            <input value={form.pdf_url || ''} onChange={e => setForm({...form, pdf_url: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://ejemplo.com/flyer.pdf" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Mensaje de Invitacion (opcional - se genera automaticamente si esta vacio)</label>
            <textarea value={form.invitation_message || ''} onChange={e => setForm({...form, invitation_message: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={4} placeholder="Hola! Te invitamos a nuestro evento..." />
          </div>

          {/* Segmentación para invitaciones */}
          <div className="col-span-2 border-t border-slate-600 pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-emerald-400 font-semibold">Segmentación de Invitados</label>
              <button
                onClick={() => setShowAdvancedSegment(!showAdvancedSegment)}
                className={`px-3 py-1 rounded-lg text-sm ${showAdvancedSegment ? 'bg-emerald-600' : 'bg-slate-600'}`}
              >
                {showAdvancedSegment ? 'Ocultar' : 'Segmentación Avanzada'}
              </button>
            </div>
            {showAdvancedSegment && (
              <SegmentSelector
                filters={segmentFilters}
                onChange={setSegmentFilters}
                leads={leads}
                properties={properties}
              />
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-gray-600">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Save size={20} /> Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// MODAL INVITACIONES EVENTO
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// COMPONENTE SENDPROMOMODAL - Modal para enviar promociones
// ═══════════════════════════════════════════════════════
function SendPromoModal({
  promo,
  onSend,
  onClose,
  sending,
  leads,
  properties,
  team
}: {
  promo: Promotion,
  onSend: (segment: string, options: { sendImage: boolean, sendVideo: boolean, sendPdf: boolean, filters?: any }) => void,
  onClose: () => void,
  sending: boolean,
  leads: Lead[],
  properties: Property[],
  team: TeamMember[]
}) {
  const [segmentType, setSegmentType] = useState<'basic' | 'status' | 'source' | 'property' | 'vendedor'>('basic')
  const [segment, setSegment] = useState('todos')
  const [sendImage, setSendImage] = useState(true)
  const [sendVideo, setSendVideo] = useState(true)
  const [sendPdf, setSendPdf] = useState(true)

  // Opciones dinámicas basadas en datos reales
  const sources = [...new Set(leads.map(l => l.source).filter(Boolean))]
  const propertyInterests = [...new Set(leads.map(l => l.property_interest).filter(Boolean))]
  const vendedores = team.filter(t => t.role === 'vendedor' && t.active)

  // Conteo de leads por segmento seleccionado
  const getLeadCount = () => {
    let filtered = leads.filter(l => !['lost', 'fallen', 'closed', 'delivered', 'sold'].includes(l.status))

    if (segmentType === 'basic') {
      switch (segment) {
        case 'hot': filtered = filtered.filter(l => l.score >= 7); break
        case 'warm': filtered = filtered.filter(l => l.score >= 4 && l.score < 7); break
        case 'cold': filtered = filtered.filter(l => l.score < 4); break
        case 'compradores': filtered = leads.filter(l => ['closed', 'delivered', 'sold'].includes(l.status)); break
        case 'new': filtered = filtered.filter(l => l.status === 'new'); break
      }
    } else if (segmentType === 'status') {
      filtered = filtered.filter(l => l.status === segment)
    } else if (segmentType === 'source') {
      filtered = filtered.filter(l => l.source === segment)
    } else if (segmentType === 'property') {
      filtered = filtered.filter(l => l.property_interest === segment)
    } else if (segmentType === 'vendedor') {
      filtered = filtered.filter(l => l.assigned_to === segment)
    }

    return segment === 'todos' ? leads.filter(l => !['lost', 'fallen'].includes(l.status)).length : filtered.length
  }

  const startDate = new Date(promo.start_date)
  const formattedDate = startDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2"><Megaphone size={24} /> Enviar Promoción</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X /></button>
        </div>

        {/* Preview de la promocion */}
        <div className="bg-slate-700/50 p-4 rounded-xl mb-4">
          <h4 className="font-bold text-lg mb-2">{promo.name}</h4>
          <div className="text-sm text-slate-300 space-y-1">
            <p><CalendarIcon size={14} className="inline mr-2" />Vigente desde: {formattedDate}</p>
            {promo.target_segment && <p><Users size={14} className="inline mr-2" />Segmento original: {promo.target_segment}</p>}
            <p className="text-slate-400 mt-2">{promo.description || promo.message?.slice(0, 100)}...</p>
          </div>
        </div>

        {/* Tipo de segmentación */}
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">Tipo de segmentación:</label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'basic', label: 'Basico', icon: '📊' },
              { key: 'status', label: 'Por Etapa', icon: '🎯' },
              { key: 'source', label: 'Por Fuente', icon: '📣' },
              { key: 'property', label: 'Por Desarrollo', icon: '🏠' },
              { key: 'vendedor', label: 'Por Vendedor', icon: '👤' }
            ].map(tipo => (
              <button
                key={tipo.key}
                onClick={() => { setSegmentType(tipo.key as any); setSegment('todos'); }}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                  segmentType === tipo.key
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {tipo.icon} {tipo.label}
              </button>
            ))}
          </div>
        </div>

        {/* Segmento específico */}
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">Enviar a:</label>
          <select
            value={segment}
            onChange={e => setSegment(e.target.value)}
            className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="todos">Todos los leads activos</option>

            {segmentType === 'basic' && (
              <>
                <option value="hot">🔥 Leads HOT (score 7+)</option>
                <option value="warm">🌡️ Leads WARM (score 4-6)</option>
                <option value="cold">❄️ Leads COLD (score 0-3)</option>
                <option value="compradores">✅ Compradores (ya cerraron)</option>
                <option value="new">🆕 Leads Nuevos (sin contactar)</option>
              </>
            )}

            {segmentType === 'status' && (
              <>
                <option value="new">🆕 Nuevos</option>
                <option value="contacted">📞 Contactados</option>
                <option value="scheduled">📅 Cita Agendada</option>
                <option value="visited">🏠 Visitaron</option>
                <option value="negotiation">💼 En Negociación</option>
                <option value="reserved">📋 Reservado</option>
              </>
            )}

            {segmentType === 'source' && sources.length > 0 && (
              <>
                {sources.map(src => (
                  <option key={src} value={src}>
                    {src === 'facebook' ? '📘 Facebook' :
                     src === 'instagram' ? '📸 Instagram' :
                     src === 'website' ? '🌐 Website' :
                     src === 'referral' ? '🤝 Referidos' :
                     src === 'whatsapp' ? '💬 WhatsApp' :
                     src === 'google' ? '🔍 Google' :
                     src}
                  </option>
                ))}
              </>
            )}

            {segmentType === 'property' && propertyInterests.length > 0 && (
              <>
                {propertyInterests.map(prop => (
                  <option key={prop} value={prop}>🏘️ {prop}</option>
                ))}
              </>
            )}

            {segmentType === 'vendedor' && vendedores.length > 0 && (
              <>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id}>👤 {v.name}</option>
                ))}
              </>
            )}
          </select>

          {/* Conteo de leads */}
          <div className="mt-2 text-sm text-slate-400 flex items-center gap-2">
            <Users size={14} />
            <span>Se enviará a <strong className="text-purple-400">{getLeadCount()}</strong> leads</span>
          </div>
        </div>

        {/* Opciones de contenido */}
        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-2">Contenido a enviar:</label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendImage}
                onChange={e => setSendImage(e.target.checked)}
                disabled={!promo.image_url}
                className="w-5 h-5 rounded"
              />
              <span className={!promo.image_url ? 'text-slate-400' : ''}>
                Imagen {!promo.image_url && '(no configurada)'}
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendVideo}
                onChange={e => setSendVideo(e.target.checked)}
                disabled={!promo.video_url}
                className="w-5 h-5 rounded"
              />
              <span className={!promo.video_url ? 'text-slate-400' : ''}>
                Video {!promo.video_url && '(no configurado)'}
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendPdf}
                onChange={e => setSendPdf(e.target.checked)}
                disabled={!promo.pdf_url}
                className="w-5 h-5 rounded"
              />
              <span className={!promo.pdf_url ? 'text-slate-400' : ''}>
                PDF/Brochure {!promo.pdf_url && '(no configurado)'}
              </span>
            </label>
          </div>
        </div>

        {/* Preview del mensaje */}
        <div className="bg-slate-900/50 p-4 rounded-xl mb-6 text-sm">
          <p className="text-slate-400 mb-2">Vista previa del mensaje:</p>
          <div className="text-white whitespace-pre-line max-h-32 overflow-y-auto">
            {promo.message || 'Sin mensaje configurado'}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600">
            Cancelar
          </button>
          <button
            onClick={() => onSend(segment, { sendImage, sendVideo, sendPdf, filters: { segmentType } })}
            disabled={sending || getLeadCount() === 0}
            className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
          >
            {sending ? (
              <>Enviando...</>
            ) : (
              <><Send size={18} /> Enviar a {getLeadCount()} leads</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function InviteEventModal({
  event,
  onSend,
  onClose,
  sending
}: {
  event: CRMEvent,
  onSend: (event: CRMEvent, segment: string, options: { sendImage: boolean, sendVideo: boolean, sendPdf: boolean }) => void,
  onClose: () => void,
  sending: boolean
}) {
  const [segment, setSegment] = useState('todos')
  const [sendImage, setSendImage] = useState(true)
  const [sendVideo, setSendVideo] = useState(true)
  const [sendPdf, setSendPdf] = useState(true)

  const eventDate = new Date(event.event_date)
  const formattedDate = eventDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Enviar Invitaciones</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X /></button>
        </div>

        {/* Preview del evento */}
        <div className="bg-slate-700/50 p-4 rounded-xl mb-4">
          <h4 className="font-bold text-lg mb-2">{event.name}</h4>
          <div className="text-sm text-slate-300 space-y-1">
            <p><Calendar size={14} className="inline mr-2" />{formattedDate} {event.event_time && `a las ${event.event_time}`}</p>
            {event.location && <p><MapPin size={14} className="inline mr-2" />{event.location}</p>}
          </div>
        </div>

        {/* Segmento */}
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">Enviar a segmento:</label>
          <select
            value={segment}
            onChange={e => setSegment(e.target.value)}
            className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="todos">Todos los leads</option>
            <option value="hot">Leads HOT (score 70+)</option>
            <option value="warm">Leads WARM (score 40-69)</option>
            <option value="cold">Leads COLD (score menor a 40)</option>
            <option value="compradores">Compradores</option>
          </select>
        </div>

        {/* Opciones de contenido */}
        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-2">Contenido a enviar:</label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendImage}
                onChange={e => setSendImage(e.target.checked)}
                disabled={!event.image_url}
                className="w-5 h-5 rounded"
              />
              <span className={!event.image_url ? 'text-slate-400' : ''}>
                Imagen {!event.image_url && '(no configurada)'}
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendVideo}
                onChange={e => setSendVideo(e.target.checked)}
                disabled={!event.video_url}
                className="w-5 h-5 rounded"
              />
              <span className={!event.video_url ? 'text-slate-400' : ''}>
                Video {!event.video_url && '(no configurado)'}
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendPdf}
                onChange={e => setSendPdf(e.target.checked)}
                disabled={!event.pdf_url}
                className="w-5 h-5 rounded"
              />
              <span className={!event.pdf_url ? 'text-slate-400' : ''}>
                PDF/Flyer {!event.pdf_url && '(no configurado)'}
              </span>
            </label>
          </div>
        </div>

        {/* Preview del mensaje */}
        <div className="bg-slate-900/50 p-4 rounded-xl mb-6 text-sm">
          <p className="text-slate-400 mb-2">Vista previa del mensaje:</p>
          <div className="text-white whitespace-pre-line">
            {event.invitation_message || `Hola! Te invitamos a *${event.name}*

${event.description || ''}

Fecha: ${formattedDate}
${event.event_time ? `Hora: ${event.event_time}` : ''}
${event.location ? `Lugar: ${event.location}` : ''}

Responde *SI* para confirmar tu asistencia.`}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600">
            Cancelar
          </button>
          <button
            onClick={() => onSend(event, segment, { sendImage, sendVideo, sendPdf })}
            disabled={sending}
            className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
          >
            {sending ? (
              <>Enviando...</>
            ) : (
              <><Send size={18} /> Enviar Invitaciones</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// COMPONENTE FOLLOWUPS VIEW - Sistema de seguimiento 90 dias
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

// ═══════════════════════════════════════════════════════════
// BUSINESS INTELLIGENCE VIEW - Servicios BI Avanzados
// ═══════════════════════════════════════════════════════════
function BusinessIntelligenceView({ leads, team, appointments, properties, showToast }: {
  leads: Lead[]
  team: TeamMember[]
  appointments: Appointment[]
  properties: Property[]
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
}) {
  const [activeSection, setActiveSection] = useState<'pipeline' | 'alerts' | 'market' | 'clv' | 'offers' | 'reports'>('pipeline')
  const [loading, setLoading] = useState(false)
  const [sectionError, setSectionError] = useState<string | null>(null)
  const [pipelineData, setPipelineData] = useState<any>(null)
  const [alertsData, setAlertsData] = useState<any>(null)
  const [marketData, setMarketData] = useState<any>(null)
  const [clvData, setClvData] = useState<any>(null)
  const [offersData, setOffersData] = useState<any>(null)

  const STAGE_LABELS: Record<string, string> = {
    'new': 'Nuevos', 'contacted': 'Contactados', 'qualified': 'Calificados',
    'visit_scheduled': 'Cita Agendada', 'scheduled': 'Cita Agendada',
    'visited': 'Visitaron', 'negotiating': 'Negociación', 'negotiation': 'Negociación',
    'reserved': 'Apartados', 'sold': 'Vendidos', 'closed': 'Cerrados',
    'delivered': 'Entregados', 'lost': 'Perdidos', 'inactive': 'Inactivos',
  }

  const ALERT_TYPE_LABELS: Record<string, string> = {
    'cold_lead': 'Lead Frío', 'vendor_inactive': 'Vendedor Inactivo',
    'visit_upcoming': 'Visita Próxima', 'offer_expiring': 'Oferta por Vencer',
    'stalled_deal': 'Negociación Estancada', 'hot_lead': 'Lead Caliente',
    'no_follow_up': 'Sin Seguimiento', 'mortgage_stalled': 'Hipoteca Estancada',
  }

  const STAGE_COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316']

  // Cargar datos según la sección activa
  const loadSectionData = async () => {
    setLoading(true)
    setSectionError(null)
    try {
      switch (activeSection) {
        case 'pipeline': {
          const res = await fetch(`${API_BASE}/api/pipeline?timeframe=90`)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          if (data.success) setPipelineData(data)
          else throw new Error('El servidor no retornó datos')
          break
        }
        case 'alerts': {
          const res = await fetch(`${API_BASE}/api/alerts`)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          if (data.success) setAlertsData(data)
          else throw new Error('El servidor no retornó datos')
          break
        }
        case 'market': {
          const res = await fetch(`${API_BASE}/api/market?days=30`)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          if (data.success) setMarketData(data.analysis)
          else throw new Error('El servidor no retornó datos')
          break
        }
        case 'clv': {
          const res = await fetch(`${API_BASE}/api/clv`)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          if (data.success) setClvData(data.analysis)
          else throw new Error('El servidor no retornó datos')
          break
        }
        case 'offers': {
          const res = await fetch(`${API_BASE}/api/offers?days=30`)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          if (data.success) setOffersData(data)
          else setOffersData({ total_offers: 0, by_status: {} })
          break
        }
      }
    } catch (err: any) {
      console.error('Error loading BI data:', err)
      setSectionError(`Error cargando datos: ${err.message || 'Conexión fallida'}`)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSectionData()
  }, [activeSection])

  // Tabs de navegación
  const tabs = [
    { id: 'pipeline', label: 'Pipeline', icon: '📊' },
    { id: 'alerts', label: 'Alertas', icon: '🚨' },
    { id: 'market', label: 'Mercado', icon: '📈' },
    { id: 'clv', label: 'CLV', icon: '👥' },
    { id: 'offers', label: 'Ofertas', icon: '💰' },
    { id: 'reports', label: 'Reportes', icon: '📋' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Inteligencia Comercial
        </h2>
        <button
          onClick={() => loadSectionData()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600"
        >
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeSection === tab.id
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
        </div>
      )}

      {/* Error con retry */}
      {sectionError && !loading && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
          <AlertTriangle className="mx-auto mb-3 text-red-400" size={32} />
          <p className="text-red-400 mb-4">{sectionError}</p>
          <button
            onClick={() => loadSectionData()}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500"
          >
            <RefreshCw size={16} /> Reintentar
          </button>
        </div>
      )}

      {/* Pipeline Section */}
      {activeSection === 'pipeline' && !loading && pipelineData && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">LEADS ACTIVOS</p>
              <p className="text-3xl font-bold text-cyan-400">{pipelineData.total_leads || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">VALOR PIPELINE</p>
              <p className="text-3xl font-bold text-green-400">${((pipelineData.total_pipeline_value || 0) / 1000000).toFixed(1)}M</p>
            </div>
            <div className="bg-gradient-to-br from-purple-600/20 to-violet-600/20 border border-purple-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">INGRESO ESPERADO</p>
              <p className="text-3xl font-bold text-purple-400">${((pipelineData.expected_revenue || 0) / 1000000).toFixed(1)}M</p>
            </div>
            <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">CONVERSIÓN</p>
              <p className="text-3xl font-bold text-amber-400">{pipelineData.overall_conversion_rate || '0%'}</p>
            </div>
          </div>

          {/* Funnel por etapa */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Funnel de Ventas</h3>
            <div className="space-y-3">
              {pipelineData.by_stage && Object.entries(pipelineData.by_stage).map(([stageName, count]: [string, any], idx: number) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-slate-400">{STAGE_LABELS[stageName] || stageName.replace('_', ' ')}</div>
                  <div className="flex-1 h-8 bg-slate-700 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(Math.min((count / (pipelineData.total_leads || 1)) * 100, 100), count > 0 ? 8 : 0)}%` }}
                    >
                      <span className="text-xs font-bold">{count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfica de distribución */}
          {pipelineData.by_stage && (() => {
            const chartData = Object.entries(pipelineData.by_stage)
              .filter(([_, count]) => (count as number) > 0)
              .map(([stage, count]) => ({ name: STAGE_LABELS[stage] || stage, value: count as number }))
            return chartData.length > 0 ? (
              <div className="bg-slate-800/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Distribución por Etapa</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                      {chartData.map((_, idx) => (
                        <Cell key={idx} fill={STAGE_COLORS[idx % STAGE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : null
          })()}

          {/* Leads en riesgo */}
          {pipelineData.at_risk_leads?.length > 0 && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-400" /> Leads en Riesgo ({pipelineData.at_risk_leads.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pipelineData.at_risk_leads.slice(0, 6).map((lead: any, idx: number) => (
                  <div key={idx} className="bg-slate-800/50 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-xs text-slate-400">{lead.days_in_stage} días en etapa • {lead.assigned_to_name}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-red-500/30 text-red-300 rounded">{lead.risk_reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alerts Section */}
      {activeSection === 'alerts' && !loading && alertsData && (
        <div className="space-y-6">
          {/* Resumen de alertas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">CRÍTICAS</p>
              <p className="text-3xl font-bold text-red-400">{alertsData.by_priority?.critical || 0}</p>
            </div>
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">ALTAS</p>
              <p className="text-3xl font-bold text-orange-400">{alertsData.by_priority?.high || 0}</p>
            </div>
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">MEDIAS</p>
              <p className="text-3xl font-bold text-yellow-400">{alertsData.by_priority?.medium || 0}</p>
            </div>
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">BAJAS</p>
              <p className="text-3xl font-bold text-blue-400">{alertsData.by_priority?.low || 0}</p>
            </div>
          </div>

          {/* Lista de alertas */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Alertas Activas</h3>
            <div className="space-y-3">
              {alertsData.alerts?.slice(0, 10).map((alert: any, idx: number) => (
                <div key={idx} className={`p-4 rounded-lg border ${
                  alert.priority === 'critical' ? 'bg-red-900/30 border-red-500/50' :
                  alert.priority === 'high' ? 'bg-orange-900/30 border-orange-500/50' :
                  alert.priority === 'medium' ? 'bg-yellow-900/30 border-yellow-500/50' :
                  'bg-slate-700/50 border-slate-600/50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-slate-400">{alert.message}</p>
                      {alert.action_required && (
                        <p className="text-xs text-cyan-400 mt-1">→ {alert.action_required}</p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      alert.priority === 'critical' ? 'bg-red-500/30 text-red-300' :
                      alert.priority === 'high' ? 'bg-orange-500/30 text-orange-300' :
                      'bg-yellow-500/30 text-yellow-300'
                    }`}>{ALERT_TYPE_LABELS[alert.type] || alert.type?.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Market Intelligence Section */}
      {activeSection === 'market' && !loading && marketData && (
        <div className="space-y-6">
          {/* KPIs de mercado */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">CONSULTAS TOTALES</p>
              <p className="text-3xl font-bold text-cyan-400">{marketData.demand?.total_inquiries || 0}</p>
            </div>
            <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">PRESUPUESTO PROM</p>
              <p className="text-3xl font-bold text-green-400">${((marketData.pricing?.avg_budget || 0) / 1000000).toFixed(1)}M</p>
            </div>
            <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">SENSIBILIDAD PRECIO</p>
              <p className="text-3xl font-bold text-amber-400">{marketData.pricing?.price_sensitivity || 'N/A'}</p>
            </div>
            <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">DÍAS A DECISIÓN</p>
              <p className="text-3xl font-bold text-purple-400">{marketData.timing?.avg_decision_days || 0}</p>
            </div>
          </div>

          {/* Demanda por desarrollo */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Demanda por Desarrollo</h3>
            <div className="space-y-3">
              {marketData.demand?.by_development?.slice(0, 8).map((dev: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-40 truncate">{dev.development}</div>
                  <div className="flex-1 h-6 bg-slate-700 rounded-lg overflow-hidden">
                    <div
                      className={`h-full ${dev.trend === 'up' ? 'bg-green-500' : dev.trend === 'down' ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min((dev.inquiries / (marketData.demand?.total_inquiries || 1)) * 100 * 3, 100)}%` }}
                    />
                  </div>
                  <div className="w-16 text-right">{dev.inquiries}</div>
                  <div className={`w-16 text-right text-sm ${dev.trend === 'up' ? 'text-green-400' : dev.trend === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
                    {dev.trend === 'up' ? '↑' : dev.trend === 'down' ? '↓' : '→'} {Math.abs(dev.trend_percent || 0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recomendaciones */}
          {marketData.recommendations?.length > 0 && (
            <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Lightbulb className="text-yellow-400" /> Recomendaciones
              </h3>
              <div className="space-y-2">
                {marketData.recommendations.map((rec: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400">•</span>
                    <p className="text-slate-300">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CLV Section */}
      {activeSection === 'clv' && !loading && clvData && (
        <div className="space-y-6">
          {/* KPIs CLV */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">TOTAL CLIENTES</p>
              <p className="text-3xl font-bold text-purple-400">{clvData.total_customers || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">CLV TOTAL</p>
              <p className="text-3xl font-bold text-green-400">${((clvData.total_clv || 0) / 1000000).toFixed(1)}M</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">CLV PROMEDIO</p>
              <p className="text-3xl font-bold text-cyan-400">${((clvData.avg_clv || 0) / 1000000).toFixed(2)}M</p>
            </div>
            <div className="bg-gradient-to-br from-pink-600/20 to-rose-600/20 border border-pink-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">REFERIDOS CONV</p>
              <p className="text-3xl font-bold text-pink-400">{clvData.referrals?.conversion_rate || '0%'}</p>
            </div>
          </div>

          {/* Segmentación */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Segmentación de Clientes</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-yellow-400">👑 {clvData.by_segment?.vip || 0}</p>
                <p className="text-sm text-slate-400">VIP</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-500/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-purple-400">💎 {clvData.by_segment?.high_value || 0}</p>
                <p className="text-sm text-slate-400">Alto Valor</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">💰 {clvData.by_segment?.medium_value || 0}</p>
                <p className="text-sm text-slate-400">Medio Valor</p>
              </div>
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-400">🆕 {clvData.by_segment?.new || 0}</p>
                <p className="text-sm text-slate-400">Nuevos</p>
              </div>
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-orange-400">⚠️ {clvData.by_segment?.at_risk || 0}</p>
                <p className="text-sm text-slate-400">En Riesgo</p>
              </div>
              <div className="bg-gradient-to-r from-slate-500/20 to-gray-500/20 border border-slate-500/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-slate-400">❌ {clvData.by_segment?.churned || 0}</p>
                <p className="text-sm text-slate-400">Perdidos</p>
              </div>
            </div>
          </div>

          {/* Top referidores */}
          {clvData.referrals?.top_referrers?.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">🏆 Top Referidores</h3>
              <div className="space-y-3">
                {clvData.referrals.top_referrers.map((ref: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '•'}</span>
                      <div>
                        <p className="font-medium">{ref.name}</p>
                        <p className="text-sm text-slate-400">{ref.referrals} referidos, {ref.conversions} ventas</p>
                      </div>
                    </div>
                    <p className="text-green-400 font-bold">${(ref.value_generated / 1000000).toFixed(2)}M</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Offers Section */}
      {activeSection === 'offers' && !loading && (
        <div className="space-y-6">
          {!offersData ? (
            <div className="text-center text-slate-400 py-12">
              <p>Cargando datos de ofertas...</p>
            </div>
          ) : (
            <>
              {/* KPIs ofertas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
                  <p className="text-[11px] font-medium text-slate-400 mb-1">OFERTAS TOTALES</p>
                  <p className="text-3xl font-bold text-cyan-400">{offersData.total_offers || 0}</p>
                </div>
                <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
                  <p className="text-[11px] font-medium text-slate-400 mb-1">VALOR OFERTADO</p>
                  <p className="text-3xl font-bold text-green-400">${((offersData.total_offered_value || 0) / 1000000).toFixed(1)}M</p>
                </div>
                <div className="kpi-card bg-slate-800/50 border border-slate-600/30 rounded-xl p-4">
                  <p className="text-[11px] font-medium text-slate-400 mb-1">TASA ACEPTACIÓN</p>
                  <p className="text-3xl font-bold text-purple-400">{offersData.acceptance_rate || '0%'}</p>
                </div>
                <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-4">
                  <p className="text-[11px] font-medium text-slate-400 mb-1">POR VENCER</p>
                  <p className="text-3xl font-bold text-orange-400">{offersData.expiring_soon?.length || 0}</p>
                </div>
              </div>

              {/* Ofertas por estado */}
              <div className="bg-slate-800/50 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Ofertas por Estado</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {offersData.by_status && Object.entries(offersData.by_status)
                    .filter(([_, count]) => (count as number) > 0)
                    .map(([status, count]: [string, any], idx: number) => (
                    <div key={idx} className="bg-slate-700/50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-white">{count}</p>
                      <p className="text-sm text-slate-400 capitalize">{status.replace('_', ' ')}</p>
                    </div>
                  ))}
                  {(!offersData.by_status || Object.values(offersData.by_status).every((v: any) => v === 0)) && (
                    <div className="col-span-4 text-center text-slate-400 py-8">
                      No hay ofertas registradas en este período
                    </div>
                  )}
                </div>
              </div>

              {/* Ofertas por vencer */}
              {offersData.expiring_soon?.length > 0 && (
                <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Clock className="text-orange-400" /> Ofertas por Vencer
                  </h3>
                  <div className="space-y-2">
                    {offersData.expiring_soon.map((offer: any, idx: number) => (
                      <div key={idx} className="bg-slate-800/50 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{offer.lead_name}</p>
                          <p className="text-sm text-slate-400">{offer.property_name}</p>
                        </div>
                        <span className="text-orange-400">${((offer.amount || 0) / 1000000).toFixed(1)}M</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Reports Section */}
      {activeSection === 'reports' && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reporte Semanal */}
            <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                📊 Reporte Semanal
              </h3>
              <p className="text-slate-400 mb-4">Resumen ejecutivo de la última semana con KPIs, pipeline y rendimiento del equipo.</p>
              <div className="flex gap-2">
                <a
                  href={`${API_BASE}/api/reports/weekly/html`}
                  target="_blank"
                  className="flex-1 text-center px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500"
                >
                  Ver HTML
                </a>
                <button
                  onClick={async () => {
                    const data = await safeFetch(`${API_BASE}/api/reports/weekly/whatsapp`)
                    if (data.success) {
                      navigator.clipboard.writeText(data.message)
                      showToast('Reporte copiado al portapapeles', 'success')
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600"
                >
                  Copiar WhatsApp
                </button>
              </div>
            </div>

            {/* Reporte Mensual */}
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                📋 Reporte Mensual
              </h3>
              <p className="text-slate-400 mb-4">Análisis completo del mes con tendencias, comparativas y proyecciones.</p>
              <div className="flex gap-2">
                <a
                  href={`${API_BASE}/api/reports/monthly/html`}
                  target="_blank"
                  className="flex-1 text-center px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500"
                >
                  Ver HTML
                </a>
                <button
                  onClick={async () => {
                    const data = await safeFetch(`${API_BASE}/api/reports/monthly/whatsapp`)
                    if (data.success) {
                      navigator.clipboard.writeText(data.message)
                      showToast('Reporte copiado al portapapeles', 'success')
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600"
                >
                  Copiar WhatsApp
                </button>
              </div>
            </div>
          </div>

          {/* Info adicional */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">📡 Endpoints API Disponibles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-cyan-400">GET /api/pipeline/summary</p>
                <p className="text-slate-400">Pipeline de ventas y forecast</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-cyan-400">GET /api/alerts</p>
                <p className="text-slate-400">Alertas inteligentes</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-cyan-400">GET /api/market</p>
                <p className="text-slate-400">Inteligencia de mercado</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-cyan-400">GET /api/clv</p>
                <p className="text-slate-400">Valor del cliente (CLV)</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-cyan-400">GET /api/offers/summary</p>
                <p className="text-slate-400">Tracking de ofertas</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-cyan-400">GET /api/reports/*</p>
                <p className="text-slate-400">Reportes PDF/HTML</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state (only show if no error already shown) */}
      {!loading && !sectionError && !pipelineData && !alertsData && !marketData && !clvData && !offersData && activeSection !== 'reports' && (
        <div className="text-center py-12 text-slate-400">
          <p>Cargando datos del backend...</p>
          <button
            onClick={() => loadSectionData()}
            className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600"
          >
            <RefreshCw size={16} /> Cargar datos
          </button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MESSAGE METRICS VIEW - Métricas de Mensajes WhatsApp
// ═══════════════════════════════════════════════════════════
function MessageMetricsView() {
  const [loading, setLoading] = useState(true)
  const [messageMetrics, setMessageMetrics] = useState<any>(null)
  const [ttsMetrics, setTtsMetrics] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'todos' | 'tts'>('todos')
  const [diasFiltro, setDiasFiltro] = useState(7)
  const [refreshing, setRefreshing] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  const loadMetrics = async () => {
    try {
      const [msgRes, ttsRes] = await Promise.all([
        fetch(`${API_BASE}/api/message-metrics?days=${diasFiltro}`),
        fetch(`${API_BASE}/api/tts-metrics?days=${diasFiltro}`)
      ])
      const [msgData, ttsData] = await Promise.all([msgRes.json(), ttsRes.json()])
      setMessageMetrics(msgData)
      setTtsMetrics(ttsData)
    } catch (err) {
      console.error('Error loading message metrics:', err)
    }
  }

  useEffect(() => {
    setLoading(true)
    loadMetrics().finally(() => setLoading(false))
  }, [diasFiltro])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadMetrics()
    setRefreshing(false)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { sent: 'Enviado', delivered: 'Entregado', read: 'Leído', failed: 'Fallido' }
    return map[s] || s
  }

  const categoriaLabel = (c: string) => {
    const map: Record<string, string> = {
      respuesta_sara: 'Respuesta SARA', recordatorio: 'Recordatorio', alerta: 'Alerta',
      broadcast: 'Broadcast', bridge: 'Bridge', audio_tts: 'Audio TTS',
      notificacion: 'Notificación', recurso: 'Recurso', template: 'Template'
    }
    return map[c] || c
  }

  // Build chart data from por_tipo_y_categoria
  const chartDataCategoria = (messageMetrics?.por_tipo_y_categoria || []).map((row: any) => ({
    name: categoriaLabel(row.categoria),
    enviados: row.enviados || 0,
    entregados: row.entregados || 0,
    leidos: row.leidos || 0,
    fallidos: row.fallidos || 0,
  }))

  // Pie chart data for status distribution
  const totalPeriodo = messageMetrics?.resumen_periodo
  const pieData = totalPeriodo ? [
    { name: 'Entregados', value: (totalPeriodo.total_entregados || 0) - (totalPeriodo.total_leidos || 0), color: '#22c55e' },
    { name: 'Leídos', value: totalPeriodo.total_leidos || 0, color: '#a855f7' },
    { name: 'Fallidos', value: totalPeriodo.total_fallidos || 0, color: '#ef4444' },
  ].filter(d => d.value > 0) : []

  // Filter messages by search
  const filteredMessages = (messageMetrics?.ultimos_mensajes || []).filter((msg: any) => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return (msg.destinatario || '').toLowerCase().includes(q) ||
      (msg.contenido || '').toLowerCase().includes(q) ||
      (msg.categoria || '').toLowerCase().includes(q)
  })

  const filteredTtsMessages = (ttsMetrics?.ultimos_mensajes || []).filter((msg: any) => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return (msg.destinatario || '').toLowerCase().includes(q) ||
      (msg.tipo || '').toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
          Metricas de Mensajes
        </h2>
        <div className="flex items-center gap-3">
          <select
            value={diasFiltro}
            onChange={(e) => setDiasFiltro(Number(e.target.value))}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
          >
            <option value={1}>Últimas 24h</option>
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 90 días</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('todos')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'todos' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-slate-700 hover:bg-slate-600'
          }`}
        >
          Todos los Mensajes
        </button>
        <button
          onClick={() => setActiveTab('tts')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'tts' ? 'bg-gradient-to-r from-purple-600 to-violet-600' : 'bg-slate-700 hover:bg-slate-600'
          }`}
        >
          Audios TTS
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
        </div>
      )}

      {/* Tab: Todos los mensajes */}
      {activeTab === 'todos' && !loading && messageMetrics && (
        <div className="space-y-6">
          {/* KPIs 24h */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">ENVIADOS (24h)</p>
              <p className="text-3xl font-bold text-blue-400">{messageMetrics.resumen_24h?.enviados || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">ENTREGADOS</p>
              <p className="text-3xl font-bold text-green-400">{messageMetrics.resumen_24h?.entregados || 0}</p>
              <p className="text-xs text-slate-400">{messageMetrics.resumen_24h?.tasaEntrega || 0}% tasa</p>
            </div>
            <div className="bg-gradient-to-br from-purple-600/20 to-violet-600/20 border border-purple-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">LEIDOS</p>
              <p className="text-3xl font-bold text-purple-400">{messageMetrics.resumen_24h?.leidos || 0}</p>
              <p className="text-xs text-slate-400">{messageMetrics.resumen_24h?.tasaLectura || 0}% tasa</p>
            </div>
            <div className="bg-gradient-to-br from-red-600/20 to-orange-600/20 border border-red-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">FALLIDOS</p>
              <p className="text-3xl font-bold text-red-400">{messageMetrics.resumen_24h?.fallidos || 0}</p>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart - por categoria */}
            {chartDataCategoria.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Mensajes por Categoria</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartDataCategoria} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                    <Legend />
                    <Bar dataKey="enviados" name="Enviados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="entregados" name="Entregados" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="leidos" name="Leídos" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Pie chart - distribucion de status */}
            {pieData.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Distribución de Status</h3>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({ name, value }: any) => `${name}: ${value}`}>
                        {pieData.map((entry: any, idx: number) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Resumen numerico */}
                <div className="grid grid-cols-3 gap-3 mt-4 text-center text-sm">
                  <div>
                    <p className="text-xl font-bold text-white">{totalPeriodo?.total_enviados || 0}</p>
                    <p className="text-xs text-slate-400">Enviados</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-400">{totalPeriodo?.total_entregados || 0}</p>
                    <p className="text-xs text-slate-400">Entregados</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-amber-400">{totalPeriodo?.tasa_lectura_global || '0%'}</p>
                    <p className="text-xs text-slate-400">Tasa Lectura</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Por tipo y categoria - tabla */}
          {messageMetrics.por_tipo_y_categoria?.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Desglose por Tipo y Categoria</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="text-left py-2 px-3">Tipo</th>
                      <th className="text-left py-2 px-3">Categoria</th>
                      <th className="text-right py-2 px-3">Enviados</th>
                      <th className="text-right py-2 px-3">Entregados</th>
                      <th className="text-right py-2 px-3">Leídos</th>
                      <th className="text-right py-2 px-3">Tasa Lectura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messageMetrics.por_tipo_y_categoria.map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-2 px-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            row.tipo === 'text' ? 'bg-blue-500/30 text-blue-300' :
                            row.tipo === 'audio' ? 'bg-purple-500/30 text-purple-300' :
                            row.tipo === 'template' ? 'bg-amber-500/30 text-amber-300' :
                            'bg-slate-500/30 text-slate-300'
                          }`}>
                            {row.tipo}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300">{categoriaLabel(row.categoria)}</td>
                        <td className="py-2 px-3 text-right">{row.enviados}</td>
                        <td className="py-2 px-3 text-right text-green-400">{row.entregados}</td>
                        <td className="py-2 px-3 text-right text-purple-400">{row.leidos}</td>
                        <td className="py-2 px-3 text-right text-amber-400">{row.tasa_lectura}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Búsqueda + Últimos mensajes */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h3 className="text-lg font-bold">Últimos Mensajes</h3>
              <input
                type="text"
                placeholder="Buscar por destinatario o contenido..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm w-full sm:w-72"
              />
            </div>
            {filteredMessages.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredMessages.map((msg: any, idx: number) => (
                  <div key={idx} className="flex flex-wrap items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                    <span className={`px-2 py-1 rounded text-xs shrink-0 ${
                      msg.tipo === 'text' ? 'bg-blue-500/30 text-blue-300' :
                      msg.tipo === 'audio' ? 'bg-purple-500/30 text-purple-300' :
                      msg.tipo === 'template' ? 'bg-amber-500/30 text-amber-300' :
                      'bg-slate-500/30 text-slate-300'
                    }`}>
                      {msg.tipo}
                    </span>
                    <span className="text-xs text-slate-400 shrink-0 w-20 font-mono">{msg.destinatario || '?'}</span>
                    <span className="flex-1 text-sm text-slate-300 truncate min-w-0" title={msg.contenido || '-'}>{msg.contenido || '-'}</span>
                    <span className={`px-2 py-1 rounded text-xs shrink-0 ${
                      msg.status === 'read' ? 'bg-purple-500/30 text-purple-300' :
                      msg.status === 'delivered' ? 'bg-green-500/30 text-green-300' :
                      msg.status === 'sent' ? 'bg-blue-500/30 text-blue-300' :
                      'bg-red-500/30 text-red-300'
                    }`}>
                      {statusLabel(msg.status)}
                    </span>
                    <span className="text-xs text-slate-400 shrink-0">{formatDate(msg.enviado)}</span>
                    {msg.leido && <span className="text-xs text-purple-400 shrink-0">{formatDate(msg.leido)}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm text-center py-4">
                {busqueda ? 'Sin resultados para esa busqueda' : 'No hay mensajes en este periodo'}
              </p>
            )}
          </div>

          {/* Nota sobre confirmaciones */}
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4">
            <p className="text-amber-300 text-sm">
              <strong>Nota:</strong> Los "leidos" solo se registran si el destinatario tiene las confirmaciones de lectura activadas en WhatsApp.
            </p>
          </div>
        </div>
      )}

      {/* Tab: Audios TTS */}
      {activeTab === 'tts' && !loading && ttsMetrics && (
        <div className="space-y-6">
          {/* KPIs TTS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-600/20 to-violet-600/20 border border-purple-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">AUDIOS ENVIADOS</p>
              <p className="text-3xl font-bold text-purple-400">{ttsMetrics.resumen?.total_enviados || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">ENTREGADOS</p>
              <p className="text-3xl font-bold text-green-400">{ttsMetrics.resumen?.total_entregados || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">ESCUCHADOS</p>
              <p className="text-3xl font-bold text-amber-400">{ttsMetrics.resumen?.total_escuchados || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">TASA ESCUCHA</p>
              <p className="text-3xl font-bold text-cyan-400">{ttsMetrics.resumen?.tasa_escucha_global || '0%'}</p>
            </div>
          </div>

          {/* TTS Bar Chart */}
          {ttsMetrics.por_tipo?.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Audios por Tipo</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={(ttsMetrics.por_tipo || []).map((r: any) => ({
                  name: r.tipo, enviados: r.enviados || 0, entregados: r.entregados || 0, escuchados: r.escuchados || 0
                }))} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                  <Bar dataKey="enviados" name="Enviados" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="entregados" name="Entregados" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="escuchados" name="Escuchados" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Por tipo de audio - tabla */}
          {ttsMetrics.por_tipo?.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Desglose por Tipo de Audio</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="text-left py-2 px-3">Tipo</th>
                      <th className="text-right py-2 px-3">Enviados</th>
                      <th className="text-right py-2 px-3">Entregados</th>
                      <th className="text-right py-2 px-3">Escuchados</th>
                      <th className="text-right py-2 px-3">Tasa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ttsMetrics.por_tipo.map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-2 px-3 text-slate-300">{row.tipo}</td>
                        <td className="py-2 px-3 text-right">{row.enviados}</td>
                        <td className="py-2 px-3 text-right text-green-400">{row.entregados}</td>
                        <td className="py-2 px-3 text-right text-amber-400">{row.escuchados}</td>
                        <td className="py-2 px-3 text-right text-cyan-400">{row.tasa_escucha}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Últimos audios con búsqueda */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h3 className="text-lg font-bold">Últimos Audios</h3>
              <input
                type="text"
                placeholder="Buscar por destinatario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm w-full sm:w-72"
              />
            </div>
            {filteredTtsMessages.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredTtsMessages.map((msg: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-purple-400 shrink-0">🎤</span>
                    <span className="text-xs text-slate-400 w-20 font-mono shrink-0">{msg.destinatario || '?'}</span>
                    <span className="flex-1 text-sm text-slate-300">{msg.tipo}</span>
                    <span className={`px-2 py-1 rounded text-xs shrink-0 ${
                      msg.status === 'read' ? 'bg-amber-500/30 text-amber-300' :
                      msg.status === 'delivered' ? 'bg-green-500/30 text-green-300' :
                      'bg-blue-500/30 text-blue-300'
                    }`}>
                      {msg.status === 'read' ? 'Escuchado' : statusLabel(msg.status)}
                    </span>
                    <span className="text-xs text-slate-400 shrink-0">{formatDate(msg.enviado)}</span>
                    {msg.escuchado && <span className="text-xs text-amber-400 shrink-0">{formatDate(msg.escuchado)}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm text-center py-4">
                {busqueda ? 'Sin resultados para esa busqueda' : 'No hay audios en este periodo'}
              </p>
            )}
          </div>

          {/* Info sobre confirmaciones de lectura */}
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4">
            <p className="text-amber-300 text-sm">
              <strong>Nota:</strong> Los "escuchados" solo se registran si el destinatario tiene las confirmaciones de lectura activadas en WhatsApp.
              Si un usuario tiene esta opcion desactivada, el audio aparecera como "entregado" pero no como "escuchado".
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !messageMetrics && !ttsMetrics && (
        <div className="text-center py-12 text-slate-400">
          <p>No se pudieron cargar las metricas. Verifica la conexion con el backend.</p>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// REPORTES CEO VIEW - Diario, Semanal, Mensual
// ═══════════════════════════════════════════════════════════
function ReportesCEOView() {
  const [activeTab, setActiveTab] = useState<'diario' | 'semanal' | 'mensual'>('mensual')
  const [loading, setLoading] = useState(true)
  const [reporteDiario, setReporteDiario] = useState<any>(null)
  const [reporteSemanal, setReporteSemanal] = useState<any>(null)
  const [reporteMensual, setReporteMensual] = useState<any>(null)

  // Selector de mes/año
  const hoy = new Date()
  const [mesSeleccionado, setMesSeleccionado] = useState(hoy.getMonth() + 1) // 1-12
  const [añoSeleccionado, setAñoSeleccionado] = useState(hoy.getFullYear())

  // Chat IA
  const [preguntaIA, setPreguntaIA] = useState('')
  const [respuestaIA, setRespuestaIA] = useState('')
  const [loadingIA, setLoadingIA] = useState(false)

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  useEffect(() => {
    loadReportes()
  }, [mesSeleccionado, añoSeleccionado])

  async function loadReportes() {
    setLoading(true)
    try {
      const [diario, semanal, mensual] = await Promise.all([
        fetch(`${API_BASE}/api/reportes/diario`).then(r => r.json()),
        fetch(`${API_BASE}/api/reportes/semanal`).then(r => r.json()),
        fetch(`${API_BASE}/api/reportes/mensual?mes=${mesSeleccionado}&ano=${añoSeleccionado}`).then(r => r.json())
      ])
      setReporteDiario(diario)
      setReporteSemanal(semanal)
      setReporteMensual(mensual)
    } catch (err) {
      console.error('Error cargando reportes:', err)
    }
    setLoading(false)
  }

  async function preguntarIA() {
    if (!preguntaIA.trim()) return
    setLoadingIA(true)
    setRespuestaIA('')
    try {
      const contexto = {
        mensual: reporteMensual,
        semanal: reporteSemanal,
        diario: reporteDiario
      }
      const data = await safeFetch(`${API_BASE}/api/reportes/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: preguntaIA, contexto })
      })
      setRespuestaIA(data.respuesta || 'No pude procesar tu pregunta.')
    } catch (err) {
      setRespuestaIA('Error al consultar IA.')
    }
    setLoadingIA(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          📊 Reportes CEO
        </h2>
        <div className="flex items-center gap-3">
          {/* Selector de mes/año */}
          <select
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(Number(e.target.value))}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
          >
            {meses.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={añoSeleccionado}
            onChange={(e) => setAñoSeleccionado(Number(e.target.value))}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={loadReportes} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center gap-2">
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Chat IA */}
      <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 p-4 rounded-2xl">
        <div className="flex gap-3">
          <input
            type="text"
            value={preguntaIA}
            onChange={(e) => setPreguntaIA(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && preguntarIA()}
            placeholder="Pregunta sobre tus reportes... (ej: ¿Cuántos leads cerró Rosalía?)"
            className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 placeholder-slate-500"
          />
          <button
            onClick={preguntarIA}
            disabled={loadingIA}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold disabled:opacity-50"
          >
            {loadingIA ? '🔄' : '🤖 Preguntar'}
          </button>
        </div>
        {respuestaIA && (
          <div className="mt-3 p-4 bg-slate-800/50 rounded-xl">
            <p className="text-purple-300 whitespace-pre-wrap">{respuestaIA}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('diario')} className={`px-6 py-3 rounded-xl font-semibold ${activeTab === 'diario' ? 'bg-amber-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
          📅 Diario
        </button>
        <button onClick={() => setActiveTab('semanal')} className={`px-6 py-3 rounded-xl font-semibold ${activeTab === 'semanal' ? 'bg-amber-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
          📈 Semanal
        </button>
        <button onClick={() => setActiveTab('mensual')} className={`px-6 py-3 rounded-xl font-semibold ${activeTab === 'mensual' ? 'bg-amber-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
          📉 Mensual
        </button>
      </div>

      {/* REPORTE DIARIO */}
      {activeTab === 'diario' && reporteDiario && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-500/30 p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4">☀️ Reporte del Día - {reporteDiario.fecha}</h3>

            {/* KPIs principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-800/50 p-4 rounded-xl text-center">
                <p className="text-3xl font-bold text-blue-400">{reporteDiario.ayer?.leads_nuevos || 0}</p>
                <p className="text-sm text-slate-400">Leads Ayer</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl text-center">
                <p className="text-3xl font-bold text-green-400">{reporteDiario.ayer?.cierres || 0}</p>
                <p className="text-sm text-slate-400">Cierres Ayer</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl text-center">
                <p className="text-3xl font-bold text-purple-400">{reporteDiario.hoy?.citas_agendadas || 0}</p>
                <p className="text-sm text-slate-400">Citas Hoy</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl text-center">
                <p className="text-3xl font-bold text-orange-400">{reporteDiario.pipeline?.leads_hot || 0}</p>
                <p className="text-sm text-slate-400">Leads HOT 🔥</p>
              </div>
            </div>

            {/* Alertas */}
            {reporteDiario.pipeline?.leads_estancados > 0 && (
              <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl mb-4">
                <p className="text-red-400 font-semibold">⚠️ {reporteDiario.pipeline.leads_estancados} leads sin contactar</p>
              </div>
            )}

            {/* Citas de hoy */}
            {reporteDiario.hoy?.citas?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">📅 Citas de Hoy</h4>
                <div className="space-y-2">
                  {reporteDiario.hoy.citas.map((cita: any, i: number) => (
                    <div key={i} className="bg-slate-800/50 p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <span className="font-semibold">{cita.hora?.substring(0,5)}</span>
                        <span className="mx-2">-</span>
                        <span>{cita.lead || 'Sin nombre'}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${cita.status === 'scheduled' ? 'bg-green-600' : 'bg-slate-600'}`}>
                        {cita.status === 'scheduled' ? 'Confirmada' : cita.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REPORTE SEMANAL */}
      {activeTab === 'semanal' && reporteSemanal && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4">📈 Reporte Semanal ({reporteSemanal.fecha_inicio} al {reporteSemanal.fecha_fin})</h3>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-slate-800/50 p-4 rounded-xl text-center">
                <p className="text-3xl font-bold text-blue-400">{reporteSemanal.resumen?.leads_nuevos || 0}</p>
                <p className="text-sm text-slate-400">Leads</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl text-center">
                <p className="text-3xl font-bold text-purple-400">{reporteSemanal.resumen?.citas_totales || 0}</p>
                <p className="text-sm text-slate-400">Citas</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl text-center">
                <p className="text-3xl font-bold text-green-400">{reporteSemanal.resumen?.cierres || 0}</p>
                <p className="text-sm text-slate-400">Cierres</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl text-center">
                <p className="text-3xl font-bold text-amber-400">{reporteSemanal.resumen?.revenue_formatted || '$0'}</p>
                <p className="text-sm text-slate-400">Ingresos</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl text-center">
                <p className="text-3xl font-bold text-cyan-400">{reporteSemanal.conversion?.lead_a_cierre || 0}%</p>
                <p className="text-sm text-slate-400">Conversión</p>
              </div>
            </div>

            {/* Insight */}
            <div className={`p-4 rounded-xl mb-6 ${reporteSemanal.conversion?.lead_a_cierre >= 5 ? 'bg-green-900/30 border border-green-500/30' : 'bg-yellow-900/30 border border-yellow-500/30'}`}>
              <p>{reporteSemanal.conversion?.lead_a_cierre >= 5 ? '✅' : '⚠️'} {reporteSemanal.conversion?.insight}</p>
            </div>

            {/* Ranking Vendedores */}
            {reporteSemanal.ranking_vendedores?.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3">🏆 Top Vendedores</h4>
                <div className="space-y-2">
                  {reporteSemanal.ranking_vendedores.map((v: any, i: number) => (
                    <div key={i} className="bg-slate-800/50 p-3 rounded-lg flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '👤'}</span>
                        <span className="font-semibold">{v.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-green-400 font-bold">{v.ventas} ventas</span>
                        <span className="text-slate-400 mx-2">|</span>
                        <span className="text-blue-400">{v.citas} citas</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fuentes */}
            {reporteSemanal.fuentes?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">📣 Fuentes de Leads</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {reporteSemanal.fuentes.map((f: any, i: number) => (
                    <div key={i} className="bg-slate-800/50 p-3 rounded-lg text-center">
                      <p className="text-xl font-bold text-blue-400">{f.leads}</p>
                      <p className="text-xs text-slate-400 truncate">{f.fuente}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REPORTE MENSUAL */}
      {activeTab === 'mensual' && reporteMensual && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4">📉 Reporte Mensual - {reporteMensual.mes} {reporteMensual.año}</h3>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-800/50 p-4 rounded-xl text-center">
                <p className="text-3xl font-bold text-blue-400">{reporteMensual.resumen?.leads_nuevos || 0}</p>
                <p className="text-sm text-slate-400">Leads</p>
                {reporteMensual.resumen?.crecimiento_leads !== 0 && (
                  <p className={`text-xs ${reporteMensual.resumen?.crecimiento_leads > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {reporteMensual.resumen?.crecimiento_leads > 0 ? '↑' : '↓'} {Math.abs(reporteMensual.resumen?.crecimiento_leads)}% vs mes anterior
                  </p>
                )}
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl text-center">
                <p className="text-3xl font-bold text-green-400">{reporteMensual.resumen?.cierres || 0}</p>
                <p className="text-sm text-slate-400">Cierres</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl text-center">
                <p className="text-3xl font-bold text-amber-400">{reporteMensual.resumen?.revenue_formatted || '$0'}</p>
                <p className="text-sm text-slate-400">Ingresos</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl text-center">
                <p className="text-3xl font-bold text-cyan-400">{reporteMensual.conversion?.lead_a_cierre || 0}%</p>
                <p className="text-sm text-slate-400">Conversión Total</p>
              </div>
            </div>

            {/* Funnel de conversión */}
            <div className="bg-slate-800/50 p-4 rounded-xl mb-6">
              <h4 className="font-semibold mb-3">🔄 Funnel de Conversión</h4>
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">{reporteMensual.resumen?.leads_nuevos || 0}</p>
                  <p className="text-xs text-slate-400">Leads</p>
                </div>
                <span className="text-slate-400">→ {reporteMensual.conversion?.lead_a_cita || 0}%</span>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{reporteMensual.resumen?.citas_totales || 0}</p>
                  <p className="text-xs text-slate-400">Citas</p>
                </div>
                <span className="text-slate-400">→ {reporteMensual.conversion?.cita_a_cierre || 0}%</span>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{reporteMensual.resumen?.cierres || 0}</p>
                  <p className="text-xs text-slate-400">Cierres</p>
                </div>
              </div>
            </div>

            {/* Ranking Vendedores */}
            {reporteMensual.ranking_vendedores?.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3">🏆 Ranking de Vendedores</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                        <th className="pb-2">#</th>
                        <th className="pb-2">Vendedor</th>
                        <th className="pb-2 text-right">Ventas</th>
                        <th className="pb-2 text-right">Citas</th>
                        <th className="pb-2 text-right">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporteMensual.ranking_vendedores.map((v: any) => (
                        <tr key={v.posicion} className="border-b border-slate-700/50">
                          <td className="py-2 text-xl">{v.posicion === 1 ? '🥇' : v.posicion === 2 ? '🥈' : v.posicion === 3 ? '🥉' : v.posicion}</td>
                          <td className="py-2 font-semibold">{v.name}</td>
                          <td className="py-2 text-right text-green-400">{v.ventas}</td>
                          <td className="py-2 text-right text-blue-400">{v.citas}</td>
                          <td className="py-2 text-right text-amber-400">${(v.revenue/1000000).toFixed(1)}M</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Desarrollos */}
            {reporteMensual.desarrollos?.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3">🏘️ Ventas por Desarrollo</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {reporteMensual.desarrollos.map((d: any, i: number) => (
                    <div key={i} className="bg-slate-800/50 p-4 rounded-lg">
                      <p className="font-semibold truncate">{d.desarrollo}</p>
                      <p className="text-2xl font-bold text-green-400">{d.ventas}</p>
                      <p className="text-xs text-amber-400">{d.revenue_formatted}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fuentes */}
            {reporteMensual.fuentes?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">📣 Fuentes de Leads</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {reporteMensual.fuentes.map((f: any, i: number) => (
                    <div key={i} className="bg-slate-800/50 p-3 rounded-lg text-center">
                      <p className="text-xl font-bold text-blue-400">{f.leads}</p>
                      <p className="text-xs text-slate-400 truncate">{f.fuente}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE: Encuestas y Eventos
// ═══════════════════════════════════════════════════════════════
function EncuestasEventosView({ leads, crmEvents, eventRegistrations, properties, teamMembers, onSendSurvey, showToast }: {
  leads: Lead[],
  crmEvents: CRMEvent[],
  eventRegistrations: EventRegistration[],
  properties: Property[],
  teamMembers: TeamMember[],
  onSendSurvey: (config: any) => void,
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
}) {
  const [activeTab, setActiveTab] = useState<'encuestas' | 'resultados' | 'plantillas' | 'eventos'>('encuestas')
  const [showNewSurvey, setShowNewSurvey] = useState(false)
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [surveyMessage, setSurveyMessage] = useState('')
  const [showAdvancedSegment, setShowAdvancedSegment] = useState(false)
  const [segmentFilters, setSegmentFilters] = useState<SegmentFilters>({
    status: [],
    temperature: [],
    desarrollos: [],
    needs_mortgage: null,
    is_buyer: null,
    source: [],
    min_score: null,
    max_score: null
  })
  const [sendingSurvey, setSendingSurvey] = useState(false)

  // Nuevo: Tipo de destinatario y selección manual
  const [targetType, setTargetType] = useState<'leads' | 'vendedores' | 'manual'>('leads')
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Estado para resultados de encuestas
  const [surveyResults, setSurveyResults] = useState<any[]>([])
  const [surveyMetrics, setSurveyMetrics] = useState<any>(null)
  const [loadingSurveys, setLoadingSurveys] = useState(false)
  const [surveyFilter, setSurveyFilter] = useState<'all' | 'sent' | 'answered' | 'awaiting_feedback'>('all')

  // Cargar resultados de encuestas al montar + al cambiar tab/filtro
  useEffect(() => {
    fetchSurveyResults()
  }, [surveyFilter])

  useEffect(() => {
    if (activeTab === 'resultados') {
      fetchSurveyResults()
    }
  }, [activeTab])

  const fetchSurveyResults = async () => {
    setLoadingSurveys(true)
    try {
      const data = await safeFetch(`${API_BASE}/api/surveys?status=${surveyFilter}`)
      setSurveyResults(data.surveys || [])
      setSurveyMetrics(data.metrics || null)
    } catch (error) {
      console.error('Error fetching surveys:', error)
    } finally {
      setLoadingSurveys(false)
    }
  }

  // Estado para nueva plantilla
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'nps' as 'nps' | 'satisfaction' | 'post_cita' | 'rescate' | 'custom',
    greeting: '',
    questions: [{ text: '', type: 'rating' as 'rating' | 'text' | 'yesno' }],
    closing: ''
  })

  // Plantillas pre-hechas
  const prebuiltTemplates = [
    {
      id: 'nps',
      name: 'NPS - Net Promoter Score',
      type: 'nps',
      icon: '📊',
      color: 'blue',
      greeting: 'Hola {nombre}, nos encantaría conocer tu opinión.',
      questions: [
        { text: 'Del 0 al 10, ¿qué tan probable es que nos recomiendes con un amigo o familiar?', type: 'rating' },
        { text: '¿Qué podríamos mejorar?', type: 'text' }
      ],
      closing: '¡Gracias por tu tiempo! Tu opinión nos ayuda a mejorar.'
    },
    {
      id: 'post_cita',
      name: 'Post-Cita',
      type: 'post_cita',
      icon: '🏠',
      color: 'green',
      greeting: 'Hola {nombre}, gracias por visitarnos.',
      questions: [
        { text: '¿Cómo calificarías la atención de nuestro asesor? (1-5)', type: 'rating' },
        { text: '¿La propiedad cumplió tus expectativas?', type: 'yesno' },
        { text: '¿Tienes algún comentario adicional?', type: 'text' }
      ],
      closing: '¡Gracias! Estamos para servirte.'
    },
    {
      id: 'satisfaction',
      name: 'Satisfacción General',
      type: 'satisfaction',
      icon: '⭐',
      color: 'yellow',
      greeting: 'Hola {nombre}, queremos saber cómo fue tu experiencia.',
      questions: [
        { text: 'Del 1 al 5, ¿qué tan satisfecho estás con nuestro servicio?', type: 'rating' },
        { text: '¿Qué fue lo que más te gustó?', type: 'text' },
        { text: '¿En qué podemos mejorar?', type: 'text' }
      ],
      closing: '¡Tu opinión es muy valiosa para nosotros!'
    },
    {
      id: 'rescate',
      name: 'Rescate de Lead',
      type: 'rescate',
      icon: '🔄',
      color: 'purple',
      greeting: 'Hola {nombre}, hace tiempo no sabemos de ti.',
      questions: [
        { text: '¿Sigues interesado en adquirir una propiedad?', type: 'yesno' },
        { text: '¿Qué te ha detenido?', type: 'text' },
        { text: '¿Te gustaría que te contactemos?', type: 'yesno' }
      ],
      closing: 'Estamos aquí cuando nos necesites. ¡Gracias!'
    },
    {
      id: 'post_cierre',
      name: 'Post-Cierre / Comprador',
      type: 'post_cierre',
      icon: '🎉',
      color: 'emerald',
      greeting: '¡Felicidades {nombre} por tu nueva casa!',
      questions: [
        { text: 'Del 1 al 10, ¿cómo calificarías todo el proceso de compra?', type: 'rating' },
        { text: '¿Nos recomendarías con familiares o amigos?', type: 'yesno' },
        { text: '¿Algún comentario sobre tu experiencia?', type: 'text' }
      ],
      closing: '¡Gracias por confiar en nosotros! Bienvenido a tu nuevo hogar.'
    }
  ]

  const [customTemplates, setCustomTemplates] = useState<any[]>([])

  // Calcular estadísticas de encuestas desde la API de surveys
  const totalEncuestas = surveyMetrics?.total || 0
  const encuestasRespondidas = surveyMetrics?.answered || 0
  const npsPromedio = surveyMetrics?.avg_nps || 0
  const tasaRespuesta = totalEncuestas > 0 ? Math.round((encuestasRespondidas / totalEncuestas) * 100) : 0
  const conFeedbackSurveys = surveyResults.filter((s: any) => s.feedback)

  // Distribución NPS (0-10) agrupada
  const npsDistribution = [
    { label: 'Detractores (0-6)', count: surveyMetrics?.detractors || 0, color: 'bg-red-500', emoji: '😞' },
    { label: 'Pasivos (7-8)', count: surveyMetrics?.passives || 0, color: 'bg-yellow-500', emoji: '😐' },
    { label: 'Promotores (9-10)', count: surveyMetrics?.promoters || 0, color: 'bg-green-500', emoji: '🤩' },
  ]

  // Estadísticas de eventos
  const eventosActivos = crmEvents.filter(e => new Date(e.event_date) >= new Date())
  const eventosPasados = crmEvents.filter(e => new Date(e.event_date) < new Date())

  // Filtrar leads para encuestas según segmentación
  const filteredLeadsForSurvey = leads.filter(lead => {
    if (segmentFilters.status.length > 0 && !segmentFilters.status.includes(lead.status)) return false
    if (segmentFilters.temperature.length > 0 && !segmentFilters.temperature.includes(lead.temperature || '')) return false
    if (segmentFilters.desarrollos.length > 0) {
      const leadDesarrollo = lead.property_interest || ''
      if (!segmentFilters.desarrollos.some(d => leadDesarrollo.toLowerCase().includes(d.toLowerCase()))) return false
    }
    if (segmentFilters.needs_mortgage !== null && lead.needs_mortgage !== segmentFilters.needs_mortgage) return false
    if (segmentFilters.is_buyer !== null) {
      const isBuyer = lead.status === 'closed'
      if (isBuyer !== segmentFilters.is_buyer) return false
    }
    if (segmentFilters.source.length > 0 && !segmentFilters.source.includes(lead.source || '')) return false
    if (segmentFilters.min_score !== null && (lead.score || 0) < segmentFilters.min_score) return false
    if (segmentFilters.max_score !== null && (lead.score || 0) > segmentFilters.max_score) return false
    return true
  })

  const handleSendSurvey = async () => {
    if (!selectedTemplate) {
      showToast('Selecciona una plantilla primero', 'error')
      return
    }

    // Determinar destinatarios según el tipo seleccionado
    let destinatarios: { id: string; phone: string; name: string }[] = []

    if (targetType === 'vendedores') {
      // Encuesta interna a vendedores
      const vendedoresSeleccionados = selectedVendorIds.length > 0
        ? teamMembers.filter(v => selectedVendorIds.includes(v.id))
        : teamMembers.filter(v => v.active && v.phone)
      destinatarios = vendedoresSeleccionados.map(v => ({ id: v.id, phone: v.phone || '', name: v.name }))
    } else if (targetType === 'manual') {
      // Leads seleccionados manualmente
      const leadsSeleccionados = leads.filter(l => selectedLeadIds.includes(l.id))
      destinatarios = leadsSeleccionados.map(l => ({ id: l.id, phone: l.phone, name: l.name }))
    } else {
      // Leads con filtros de segmentación
      const leadsToSend = showAdvancedSegment ? filteredLeadsForSurvey : leads
      destinatarios = leadsToSend.map(l => ({ id: l.id, phone: l.phone, name: l.name }))
    }

    if (destinatarios.length === 0) {
      showToast('No hay destinatarios seleccionados', 'error')
      return
    }

    setSendingSurvey(true)
    try {
      await onSendSurvey({
        template: selectedTemplate,
        message: surveyMessage,
        filters: showAdvancedSegment ? segmentFilters : null,
        leads: destinatarios,
        targetType
      })
      setShowNewSurvey(false)
      setSelectedTemplate(null)
      setSurveyMessage('')
      setSelectedLeadIds([])
      setSelectedVendorIds([])
      setTargetType('leads')
      setSearchTerm('')
      setSegmentFilters({
        status: [],
        temperature: [],
        desarrollos: [],
        needs_mortgage: null,
        is_buyer: null,
        source: [],
        min_score: null,
        max_score: null
      })
    } catch (error) {
      console.error('Error enviando encuesta:', error)
      showToast('Error al enviar encuestas', 'error')
    } finally {
      setSendingSurvey(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
          Encuestas & Eventos
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('encuestas')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'encuestas' ? 'bg-yellow-500 text-black' : 'bg-slate-700'}`}
          >
            <Send size={18} /> Enviar
          </button>
          <button
            onClick={() => setActiveTab('resultados')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'resultados' ? 'bg-blue-500 text-white' : 'bg-slate-700'}`}
          >
            <Star size={18} /> Resultados
          </button>
          <button
            onClick={() => setActiveTab('plantillas')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'plantillas' ? 'bg-purple-500 text-black' : 'bg-slate-700'}`}
          >
            <MessageSquare size={18} /> Plantillas
          </button>
          <button
            onClick={() => setActiveTab('eventos')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'eventos' ? 'bg-emerald-500 text-black' : 'bg-slate-700'}`}
          >
            <CalendarIcon size={18} /> Eventos
          </button>
        </div>
      </div>

      {/* TAB ENCUESTAS */}
      {activeTab === 'encuestas' && (
        <div className="space-y-6">
          {/* Botón enviar encuesta */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowNewSurvey(true)}
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <Send size={18} /> Enviar Encuesta
            </button>
          </div>

          {/* KPIs de encuestas (datos de API /api/surveys) */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-yellow-900/50 to-amber-900/50 border border-yellow-500/30 p-5 rounded-xl">
              <div className="text-yellow-400 text-sm mb-1">NPS Promedio</div>
              <div className="text-4xl font-bold text-yellow-300">{npsPromedio} <span className="text-2xl">/ 10</span></div>
              <div className="text-yellow-400/60 text-xs mt-1">{encuestasRespondidas} respuestas</div>
            </div>
            <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border border-green-500/30 p-5 rounded-xl">
              <div className="text-green-400 text-sm mb-1">Encuestas Enviadas</div>
              <div className="text-4xl font-bold text-green-300">{totalEncuestas}</div>
              <div className="text-green-400/60 text-xs mt-1">{encuestasRespondidas} respondidas</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border border-blue-500/30 p-5 rounded-xl">
              <div className="text-blue-400 text-sm mb-1">Con Feedback</div>
              <div className="text-4xl font-bold text-blue-300">{conFeedbackSurveys.length}</div>
              <div className="text-blue-400/60 text-xs mt-1">comentarios recibidos</div>
            </div>
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-500/30 p-5 rounded-xl">
              <div className="text-purple-400 text-sm mb-1">Tasa de Respuesta</div>
              <div className="text-4xl font-bold text-purple-300">{tasaRespuesta}%</div>
              <div className="text-purple-400/60 text-xs mt-1">de encuestas enviadas</div>
            </div>
          </div>

          {/* Distribución NPS */}
          <div className="bg-slate-800/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4">Distribución NPS</h3>
            <div className="flex gap-4 items-end h-40">
              {npsDistribution.map(r => (
                <div key={r.label} className="flex-1 flex flex-col items-center">
                  <div className="text-2xl mb-2">{r.emoji}</div>
                  <div
                    className={`w-full rounded-t-lg ${r.color}`}
                    style={{ height: `${Math.max((r.count / Math.max(...npsDistribution.map(x => x.count), 1)) * 100, 10)}%` }}
                  />
                  <div className="text-lg font-bold mt-2">{r.count}</div>
                  <div className="text-slate-400 text-sm text-center">{r.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Lista de feedback desde API de surveys */}
          <div className="bg-slate-800/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4">Comentarios Recientes</h3>
            {loadingSurveys ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-slate-400">Cargando...</p>
              </div>
            ) : conFeedbackSurveys.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
                <p>No hay comentarios todavía</p>
                <p className="text-sm">Los comentarios aparecerán cuando los clientes completen encuestas</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {conFeedbackSurveys.slice(0, 20).map((survey: any) => (
                  <div key={survey.id} className="bg-slate-700/50 p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{survey.lead_name || survey.phone || 'Cliente'}</div>
                      <div className="flex items-center gap-2">
                        {survey.nps_score !== null && (
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            survey.nps_score >= 9 ? 'bg-green-500/20 text-green-400' :
                            survey.nps_score >= 7 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            NPS: {survey.nps_score}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          survey.nps_category === 'promotor' ? 'bg-green-500/20 text-green-400' :
                          survey.nps_category === 'pasivo' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {survey.nps_category || survey.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm italic">"{survey.feedback}"</p>
                    <div className="text-slate-400 text-xs mt-2">
                      {survey.template_type && <span className="mr-2">{survey.template_type}</span>}
                      {new Date(survey.answered_at || survey.sent_at || '').toLocaleDateString('es-MX')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB RESULTADOS */}
      {activeTab === 'resultados' && (
        <div className="space-y-6">
          {/* Métricas NPS */}
          {surveyMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="text-3xl font-bold text-blue-400">{surveyMetrics.total}</div>
                <div className="text-slate-400 text-sm">Total Encuestas</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="text-3xl font-bold text-green-400">{surveyMetrics.answered}</div>
                <div className="text-slate-400 text-sm">Respondidas</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="text-3xl font-bold text-yellow-400">{surveyMetrics.avg_nps || '-'}</div>
                <div className="text-slate-400 text-sm">NPS Promedio</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">{surveyMetrics.promoters}</span>
                  <span className="text-slate-400">/</span>
                  <span className="text-yellow-400">{surveyMetrics.passives}</span>
                  <span className="text-slate-400">/</span>
                  <span className="text-red-400">{surveyMetrics.detractors}</span>
                </div>
                <div className="text-slate-400 text-sm">Promotores / Pasivos / Detractores</div>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Filtrar:</span>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'Todas' },
                { value: 'sent', label: 'Enviadas' },
                { value: 'awaiting_feedback', label: 'Esperando' },
                { value: 'answered', label: 'Respondidas' }
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setSurveyFilter(f.value as any)}
                  className={`px-3 py-1 rounded-lg text-sm ${surveyFilter === f.value ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              onClick={fetchSurveyResults}
              className="ml-auto px-3 py-1 bg-slate-700 rounded-lg text-sm flex items-center gap-1"
            >
              <RefreshCw size={14} className={loadingSurveys ? 'animate-spin' : ''} /> Actualizar
            </button>
          </div>

          {/* Lista de encuestas */}
          {loadingSurveys ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-slate-400">Cargando encuestas...</p>
            </div>
          ) : surveyResults.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Star size={48} className="mx-auto mb-4 opacity-50" />
              <p>No hay encuestas registradas</p>
              <p className="text-sm mt-1">Envía una encuesta desde la pestaña "Enviar"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {surveyResults.map((survey) => (
                <div key={survey.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-white">{survey.lead_name || 'Sin nombre'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          survey.status === 'answered' ? 'bg-green-500/20 text-green-400' :
                          survey.status === 'awaiting_feedback' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {survey.status === 'answered' ? 'Respondida' :
                           survey.status === 'awaiting_feedback' ? 'Esperando comentario' :
                           'Enviada'}
                        </span>
                        <span className="text-slate-400 text-xs">
                          {survey.survey_type?.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-slate-400 text-sm mt-1">
                        {survey.lead_phone}
                      </div>
                      {survey.nps_score !== null && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-slate-400 text-sm">NPS:</span>
                          <span className={`text-lg font-bold ${
                            survey.nps_score >= 9 ? 'text-green-400' :
                            survey.nps_score >= 7 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {survey.nps_score}
                          </span>
                          <span className={`text-xs ${
                            survey.nps_score >= 9 ? 'text-green-400' :
                            survey.nps_score >= 7 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {survey.nps_score >= 9 ? 'Promotor' :
                             survey.nps_score >= 7 ? 'Pasivo' :
                             'Detractor'}
                          </span>
                        </div>
                      )}
                      {survey.feedback && (
                        <div className="mt-2 p-2 bg-slate-700/50 rounded-lg">
                          <span className="text-slate-400 text-xs">Comentario:</span>
                          <p className="text-white text-sm">{survey.feedback}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <div>Enviada: {new Date(survey.sent_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      {survey.answered_at && (
                        <div>Respondida: {new Date(survey.answered_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB PLANTILLAS */}
      {activeTab === 'plantillas' && (
        <div className="space-y-6">
          {/* Botones de acción */}
          <div className="flex justify-between items-center">
            <p className="text-slate-400">Selecciona una plantilla para enviar o crea una nueva</p>
            <button
              onClick={() => setShowCreateTemplate(true)}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <Plus size={18} /> Crear Plantilla
            </button>
          </div>

          {/* Plantillas Pre-hechas */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Lightbulb size={20} className="text-yellow-400" /> Plantillas Prediseñadas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prebuiltTemplates.map(template => (
                <div
                  key={template.id}
                  className={`bg-slate-800/80 border-2 border-${template.color}-500/30 rounded-xl p-5 hover:border-${template.color}-500/60 transition-all cursor-pointer group`}
                  onClick={() => {
                    setSelectedTemplate(template)
                    setShowNewSurvey(true)
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{template.icon}</div>
                    <span className={`text-xs px-2 py-1 rounded bg-${template.color}-500/20 text-${template.color}-300`}>
                      {template.type}
                    </span>
                  </div>
                  <h4 className="font-bold text-lg mb-2">{template.name}</h4>
                  <p className="text-slate-400 text-sm mb-3 line-clamp-2">{template.greeting}</p>
                  <div className="text-xs text-slate-400 mb-3">
                    {template.questions.length} pregunta{template.questions.length > 1 ? 's' : ''}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTemplate(template)
                        setShowNewSurvey(true)
                      }}
                      className={`flex-1 bg-${template.color}-600 hover:bg-${template.color}-700 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1`}
                    >
                      <Send size={14} /> Enviar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Preview
                        showToast(`Vista previa: ${template.greeting} | ${template.questions.map((q, i) => `${i+1}. ${q.text}`).join(' | ')} | ${template.closing}`, 'info')
                      }}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Plantillas Personalizadas */}
          {customTemplates.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Edit size={20} className="text-purple-400" /> Mis Plantillas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customTemplates.map((template, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-800/80 border-2 border-purple-500/30 rounded-xl p-5 hover:border-purple-500/60 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">📝</div>
                      <button
                        onClick={() => {
                          setCustomTemplates(prev => prev.filter((_, i) => i !== idx))
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <h4 className="font-bold text-lg mb-2">{template.name}</h4>
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">{template.greeting}</p>
                    <div className="text-xs text-slate-400 mb-3">
                      {template.questions.length} pregunta{template.questions.length > 1 ? 's' : ''}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTemplate(template)
                        setShowNewSurvey(true)
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <Send size={14} /> Enviar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tip de IA */}
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🤖</div>
              <div>
                <h4 className="font-bold text-lg mb-1">Tip: Usa IA para personalizar</h4>
                <p className="text-slate-400 text-sm">
                  Las encuestas se envían por WhatsApp y SARA puede adaptar las preguntas según el contexto de cada lead.
                  Por ejemplo, si el lead visitó una propiedad específica, mencionará ese desarrollo en el mensaje.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB EVENTOS */}
      {activeTab === 'eventos' && (
        <div className="space-y-6">
          {/* KPIs de eventos */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-900/50 to-green-900/50 border border-emerald-500/30 p-5 rounded-xl">
              <div className="text-emerald-400 text-sm mb-1">Eventos Activos</div>
              <div className="text-4xl font-bold text-emerald-300">{eventosActivos.length}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border border-blue-500/30 p-5 rounded-xl">
              <div className="text-blue-400 text-sm mb-1">Total Registrados</div>
              <div className="text-4xl font-bold text-blue-300">{eventRegistrations.length}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-500/30 p-5 rounded-xl">
              <div className="text-purple-400 text-sm mb-1">Eventos Pasados</div>
              <div className="text-4xl font-bold text-purple-300">{eventosPasados.length}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 border border-orange-500/30 p-5 rounded-xl">
              <div className="text-orange-400 text-sm mb-1">Tasa Asistencia</div>
              <div className="text-4xl font-bold text-orange-300">
                {eventRegistrations.length > 0
                  ? Math.round((eventRegistrations.filter(r => r.attended).length / eventRegistrations.length) * 100)
                  : 0}%
              </div>
            </div>
          </div>

          {/* Lista de eventos con registrados */}
          <div className="bg-slate-800/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4">Eventos y Registros</h3>
            {crmEvents.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CalendarIcon size={48} className="mx-auto mb-3 opacity-50" />
                <p>No hay eventos creados</p>
                <p className="text-sm">Ve a la seccion Eventos para crear uno</p>
              </div>
            ) : (
              <div className="space-y-4">
                {crmEvents.map(evento => {
                  const registrados = eventRegistrations.filter(r => r.event_id === evento.id)
                  const asistieron = registrados.filter(r => r.attended).length
                  const isPast = new Date(evento.event_date) < new Date()

                  return (
                    <div key={evento.id} className={`bg-slate-700/50 p-4 rounded-xl border-l-4 ${isPast ? 'border-slate-500' : 'border-emerald-500'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-lg flex items-center gap-2">
                            {evento.name}
                            {isPast && <span className="text-xs bg-slate-600 px-2 py-0.5 rounded">Pasado</span>}
                          </div>
                          <div className="text-slate-400 text-sm">
                            {new Date(evento.event_date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                            {evento.event_time && ` - ${evento.event_time}`}
                          </div>
                          {evento.location && <div className="text-slate-400 text-sm flex items-center gap-1"><MapPin size={12} /> {evento.location}</div>}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-emerald-400">{registrados.length}</div>
                          <div className="text-slate-400 text-sm">
                            {evento.max_capacity ? `/ ${evento.max_capacity}` : ''} registrados
                          </div>
                          {isPast && (
                            <div className="text-xs text-slate-400 mt-1">
                              {asistieron} asistieron ({registrados.length > 0 ? Math.round((asistieron / registrados.length) * 100) : 0}%)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Lista de registrados */}
                      {registrados.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-600">
                          <div className="text-sm text-slate-400 mb-2">Registrados:</div>
                          <div className="flex flex-wrap gap-2">
                            {registrados.slice(0, 10).map(reg => (
                              <span key={reg.id} className={`px-2 py-1 rounded text-xs ${reg.attended ? 'bg-green-500/20 text-green-300' : 'bg-slate-600 text-slate-300'}`}>
                                {reg.lead_name || 'Lead'} {reg.attended && '✓'}
                              </span>
                            ))}
                            {registrados.length > 10 && (
                              <span className="px-2 py-1 bg-slate-600 rounded text-xs">+{registrados.length - 10} más</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL ENVIAR ENCUESTA */}
      {showNewSurvey && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800 z-10">
              <h3 className="text-2xl font-bold text-yellow-400">
                {selectedTemplate ? `Enviar: ${selectedTemplate.name}` : 'Enviar Encuesta'}
              </h3>
              <button onClick={() => { setShowNewSurvey(false); setSelectedTemplate(null) }} className="text-slate-400 hover:text-white" aria-label="Cerrar">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Plantilla seleccionada */}
              {selectedTemplate && (
                <div className="bg-slate-900/50 rounded-xl p-4 border border-yellow-500/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">{selectedTemplate.icon || '📝'}</div>
                    <div>
                      <div className="font-bold">{selectedTemplate.name}</div>
                      <div className="text-sm text-slate-400">{selectedTemplate.questions?.length || 0} preguntas</div>
                    </div>
                  </div>
                  <div className="bg-green-900/30 rounded-lg p-3 text-sm">
                    <p className="mb-2 text-green-300">{selectedTemplate.greeting}</p>
                    {selectedTemplate.questions?.map((q: any, i: number) => (
                      <p key={i} className="text-slate-300 mb-1">{i + 1}. {q.text}</p>
                    ))}
                    <p className="mt-2 text-slate-400 italic">{selectedTemplate.closing}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="mt-3 text-sm text-slate-400 hover:text-white"
                  >
                    Cambiar plantilla
                  </button>
                </div>
              )}

              {/* Selector de plantilla si no hay una seleccionada */}
              {!selectedTemplate && (
                <div>
                  <label className="block text-sm font-medium mb-2">Selecciona una Plantilla</label>
                  <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                    {[...prebuiltTemplates, ...customTemplates].map(template => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className="p-3 rounded-xl border-2 border-slate-600 hover:border-yellow-500 text-left transition-all"
                      >
                        <div className="text-2xl mb-1">{template.icon || '📝'}</div>
                        <div className="font-bold text-sm">{template.name}</div>
                        <div className="text-xs text-slate-400">{template.questions?.length || 0} preguntas</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tipo de destinatario */}
              <div>
                <label className="block text-sm font-medium mb-2">Enviar a</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => { setTargetType('leads'); setSelectedLeadIds([]); setSelectedVendorIds([]) }}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      targetType === 'leads' ? 'border-yellow-500 bg-yellow-500/20' : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <Users size={20} className="mx-auto mb-1" />
                    <div className="text-sm font-medium">Leads</div>
                    <div className="text-xs text-slate-400">Con filtros</div>
                  </button>
                  <button
                    onClick={() => { setTargetType('manual'); setSelectedVendorIds([]) }}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      targetType === 'manual' ? 'border-blue-500 bg-blue-500/20' : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <UserCheck size={20} className="mx-auto mb-1" />
                    <div className="text-sm font-medium">Específicos</div>
                    <div className="text-xs text-slate-400">Seleccionar</div>
                  </button>
                  <button
                    onClick={() => { setTargetType('vendedores'); setSelectedLeadIds([]) }}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      targetType === 'vendedores' ? 'border-purple-500 bg-purple-500/20' : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <Award size={20} className="mx-auto mb-1" />
                    <div className="text-sm font-medium">Vendedores</div>
                    <div className="text-xs text-slate-400">Interna</div>
                  </button>
                </div>
              </div>

              {/* Selección manual de leads */}
              {targetType === 'manual' && (
                <div className="border border-blue-500/30 rounded-xl p-4">
                  <label className="block text-sm font-medium mb-2">Buscar y seleccionar leads</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nombre o teléfono..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 mb-3"
                  />
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {leads
                      .filter(l =>
                        l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        l.phone?.includes(searchTerm)
                      )
                      .slice(0, 20)
                      .map(lead => (
                        <label key={lead.id} className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedLeadIds.includes(lead.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLeadIds(prev => [...prev, lead.id])
                              } else {
                                setSelectedLeadIds(prev => prev.filter(id => id !== lead.id))
                              }
                            }}
                            className="rounded"
                          />
                          <span className="flex-1">{lead.name}</span>
                          <span className="text-xs text-slate-400">{lead.phone?.slice(-4)}</span>
                        </label>
                      ))}
                  </div>
                  {selectedLeadIds.length > 0 && (
                    <div className="mt-2 text-sm text-blue-400">
                      {selectedLeadIds.length} lead{selectedLeadIds.length > 1 ? 's' : ''} seleccionado{selectedLeadIds.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}

              {/* Selección de vendedores */}
              {targetType === 'vendedores' && (
                <div className="border border-purple-500/30 rounded-xl p-4">
                  <label className="block text-sm font-medium mb-2">Seleccionar vendedores</label>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setSelectedVendorIds(teamMembers.filter(v => v.active && v.phone).map(v => v.id))}
                      className="text-xs bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded"
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setSelectedVendorIds([])}
                      className="text-xs bg-slate-600 hover:bg-slate-500 px-2 py-1 rounded"
                    >
                      Ninguno
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {teamMembers.filter(v => v.active && v.phone).map(vendor => (
                      <label key={vendor.id} className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedVendorIds.includes(vendor.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVendorIds(prev => [...prev, vendor.id])
                            } else {
                              setSelectedVendorIds(prev => prev.filter(id => id !== vendor.id))
                            }
                          }}
                          className="rounded"
                        />
                        <span className="flex-1">{vendor.name}</span>
                        <span className="text-xs text-slate-400">{vendor.role}</span>
                      </label>
                    ))}
                  </div>
                  {selectedVendorIds.length > 0 && (
                    <div className="mt-2 text-sm text-purple-400">
                      {selectedVendorIds.length} vendedor{selectedVendorIds.length > 1 ? 'es' : ''} seleccionado{selectedVendorIds.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}

              {/* Mensaje adicional */}
              <div>
                <label className="block text-sm font-medium mb-2">Mensaje Adicional (opcional)</label>
                <textarea
                  value={surveyMessage}
                  onChange={(e) => setSurveyMessage(e.target.value)}
                  placeholder="Agrega un contexto adicional si lo deseas..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 h-20 resize-none"
                />
              </div>

              {/* Toggle segmentación avanzada - solo para leads */}
              {targetType === 'leads' && (
                <div className="border border-slate-600 rounded-xl p-4">
                  <button
                    onClick={() => setShowAdvancedSegment(!showAdvancedSegment)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Filter size={20} className="text-yellow-400" />
                      <div>
                        <div className="font-medium">Segmentación Avanzada</div>
                        <div className="text-sm text-slate-400">Filtrar a quién enviar la encuesta</div>
                      </div>
                    </div>
                    <ChevronRight size={20} className={`transition-transform ${showAdvancedSegment ? 'rotate-90' : ''}`} />
                  </button>

                  {showAdvancedSegment && (
                    <div className="mt-4 pt-4 border-t border-slate-600">
                      <SegmentSelector
                        filters={segmentFilters}
                        onChange={setSegmentFilters}
                        leads={leads}
                        properties={properties}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Preview de destinatarios */}
              <div className="bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-slate-400">Destinatarios</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {targetType === 'vendedores'
                      ? (selectedVendorIds.length > 0 ? selectedVendorIds.length : teamMembers.filter(v => v.active && v.phone).length)
                      : targetType === 'manual'
                        ? selectedLeadIds.length
                        : (showAdvancedSegment ? filteredLeadsForSurvey.length : leads.length)
                    } {targetType === 'vendedores' ? 'vendedor(es)' : 'lead(s)'}
                  </div>
                </div>
                {/* Preview para leads con filtros */}
                {targetType === 'leads' && showAdvancedSegment && filteredLeadsForSurvey.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {filteredLeadsForSurvey.slice(0, 15).map(l => (
                      <span key={l.id} className="bg-slate-600 px-2 py-0.5 rounded text-xs">
                        {l.name}
                      </span>
                    ))}
                    {filteredLeadsForSurvey.length > 15 && (
                      <span className="bg-slate-600 px-2 py-0.5 rounded text-xs">
                        +{filteredLeadsForSurvey.length - 15} más
                      </span>
                    )}
                  </div>
                )}
                {/* Preview para selección manual */}
                {targetType === 'manual' && selectedLeadIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {leads.filter(l => selectedLeadIds.includes(l.id)).map(l => (
                      <span key={l.id} className="bg-blue-600/50 px-2 py-0.5 rounded text-xs">
                        {l.name}
                      </span>
                    ))}
                  </div>
                )}
                {/* Preview para vendedores */}
                {targetType === 'vendedores' && (
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {(selectedVendorIds.length > 0
                      ? teamMembers.filter(v => selectedVendorIds.includes(v.id))
                      : teamMembers.filter(v => v.active && v.phone)
                    ).map(v => (
                      <span key={v.id} className="bg-purple-600/50 px-2 py-0.5 rounded text-xs">
                        {v.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-slate-800">
              <button
                onClick={() => { setShowNewSurvey(false); setSelectedTemplate(null); setTargetType('leads'); setSelectedLeadIds([]); setSelectedVendorIds([]) }}
                className="px-6 py-2 bg-slate-600 rounded-lg hover:bg-slate-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendSurvey}
                disabled={sendingSurvey || !selectedTemplate || (
                  targetType === 'manual' && selectedLeadIds.length === 0
                ) || (
                  targetType === 'leads' && showAdvancedSegment && filteredLeadsForSurvey.length === 0
                )}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingSurvey ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Enviar Encuesta ({showAdvancedSegment ? filteredLeadsForSurvey.length : leads.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR PLANTILLA */}
      {showCreateTemplate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800 z-10">
              <h3 className="text-2xl font-bold text-purple-400">Crear Nueva Plantilla</h3>
              <button onClick={() => setShowCreateTemplate(false)} className="text-slate-400 hover:text-white" aria-label="Cerrar">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Nombre de la plantilla */}
              <div>
                <label className="block text-sm font-medium mb-2">Nombre de la Plantilla</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Encuesta de seguimiento mensual"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3"
                />
              </div>

              {/* Saludo inicial */}
              <div>
                <label className="block text-sm font-medium mb-2">Saludo Inicial</label>
                <textarea
                  value={newTemplate.greeting}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, greeting: e.target.value }))}
                  placeholder="Hola {nombre}, ..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 h-20 resize-none"
                />
                <p className="text-xs text-slate-400 mt-1">Usa {'{nombre}'} para personalizar con el nombre del lead</p>
              </div>

              {/* Preguntas */}
              <div>
                <label className="block text-sm font-medium mb-2">Preguntas</label>
                <div className="space-y-3">
                  {newTemplate.questions.map((q, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={q.text}
                        onChange={(e) => {
                          const newQuestions = [...newTemplate.questions]
                          newQuestions[idx].text = e.target.value
                          setNewTemplate(prev => ({ ...prev, questions: newQuestions }))
                        }}
                        placeholder={`Pregunta ${idx + 1}`}
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-lg p-2"
                      />
                      <select
                        value={q.type}
                        onChange={(e) => {
                          const newQuestions = [...newTemplate.questions]
                          newQuestions[idx].type = e.target.value as any
                          setNewTemplate(prev => ({ ...prev, questions: newQuestions }))
                        }}
                        className="bg-slate-700 border border-slate-600 rounded-lg px-2"
                      >
                        <option value="rating">Rating (1-5)</option>
                        <option value="text">Texto libre</option>
                        <option value="yesno">Si/No</option>
                      </select>
                      {newTemplate.questions.length > 1 && (
                        <button
                          onClick={() => {
                            setNewTemplate(prev => ({
                              ...prev,
                              questions: prev.questions.filter((_, i) => i !== idx)
                            }))
                          }}
                          className="text-red-400 hover:text-red-300 px-2"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setNewTemplate(prev => ({
                    ...prev,
                    questions: [...prev.questions, { text: '', type: 'text' }]
                  }))}
                  className="mt-3 text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                >
                  <Plus size={16} /> Agregar pregunta
                </button>
              </div>

              {/* Mensaje de cierre */}
              <div>
                <label className="block text-sm font-medium mb-2">Mensaje de Cierre</label>
                <textarea
                  value={newTemplate.closing}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, closing: e.target.value }))}
                  placeholder="Gracias por tu tiempo..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 h-20 resize-none"
                />
              </div>

              {/* Vista previa */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-600">
                <div className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                  <Eye size={14} /> Vista Previa (WhatsApp)
                </div>
                <div className="bg-green-900/30 rounded-lg p-3 text-sm">
                  <p className="mb-2">{newTemplate.greeting || 'Hola {nombre}...'}</p>
                  {newTemplate.questions.filter(q => q.text).map((q, i) => (
                    <p key={i} className="mb-1">{i + 1}. {q.text}</p>
                  ))}
                  {newTemplate.closing && <p className="mt-2 text-slate-400">{newTemplate.closing}</p>}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-slate-800">
              <button
                onClick={() => setShowCreateTemplate(false)}
                className="px-6 py-2 bg-slate-600 rounded-lg hover:bg-slate-500"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!newTemplate.name || !newTemplate.greeting || newTemplate.questions.every(q => !q.text)) {
                    showToast('Completa al menos el nombre, saludo y una pregunta', 'error')
                    return
                  }
                  setCustomTemplates(prev => [...prev, { ...newTemplate, id: Date.now().toString() }])
                  setNewTemplate({
                    name: '',
                    type: 'custom',
                    greeting: '',
                    questions: [{ text: '', type: 'rating' }],
                    closing: ''
                  })
                  setShowCreateTemplate(false)
                }}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold flex items-center gap-2"
              >
                <Save size={18} /> Guardar Plantilla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FollowupsView({ supabase }: { supabase: any }) {
  const [rules, setRules] = useState<FollowupRule[]>([])
  const [scheduled, setScheduled] = useState<ScheduledFollowup[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'rules' | 'scheduled' | 'history'>('rules')
  const [stats, setStats] = useState({ pendientes: 0, enviadosHoy: 0, canceladosHoy: 0 })
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null)

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

  function cancelFollowup(followup: ScheduledFollowup) {
    setConfirmModal({
      title: 'Cancelar follow-up',
      message: `¿Cancelar follow-up para ${followup.lead_name}?`,
      onConfirm: async () => {
        await supabase
          .from('scheduled_followups')
          .update({ cancelled: true, cancel_reason: 'manual_cancel' })
          .eq('id', followup.id)
        loadData()
        setConfirmModal(null)
      }
    })
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
                      <span className="text-slate-400 text-xs">({formatDelay(rule.delay_hours)})</span>
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
                      <span className="text-slate-400 text-xs">({formatDelay(rule.delay_hours)})</span>
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
                    <p className="text-sm text-slate-400 mt-1 truncate max-w-md" title={followup.message}>{followup.message}</p>
                    <p className="text-xs text-slate-400 mt-1">📱 {followup.lead_phone}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-yellow-400">⏰ {formatDate(followup.scheduled_at)}</p>
                      <p className="text-xs text-slate-400">Programado</p>
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

      {confirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setConfirmModal(null)}>
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-slate-400 mb-5">{confirmModal.message}</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmModal(null)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm">Cancelar</button>
              <button onClick={confirmModal.onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
