import { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type {
  Lead, Property, TeamMember, MortgageApplication, Campaign,
  Appointment, AlertSetting, ReminderConfig, Insight, Promotion,
  CRMEvent, EventRegistration, LeadActivity, View
} from '../types/crm'
import { API_BASE, safeFetch } from '../types/crm'
import { Flame, TrendingDown, TrendingUp, Award, AlertCircle, Target, Clock } from 'lucide-react'

// ---- Permisos ----
function buildPermisos(currentUser: TeamMember | null) {
  return {
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
    puedeEditarEquipo: () => currentUser?.role === 'admin',
    puedeEditarPropiedades: () => ['admin', 'coordinador'].includes(currentUser?.role || ''),
    puedeVerTodasHipotecas: () => ['admin', 'coordinador', 'asesor'].includes(currentUser?.role || ''),
    puedeEditarHipoteca: (mortgage: MortgageApplication) => {
      if (!currentUser) return false
      if (['admin', 'coordinador'].includes(currentUser.role)) return true
      if (currentUser.role === 'asesor' && mortgage.assigned_advisor_id === currentUser.id) return true
      return false
    },
    puedeVerTodasMetas: () => ['admin', 'coordinador'].includes(currentUser?.role || ''),
    puedeEditarMetas: () => currentUser?.role === 'admin',
    puedeVerMarketing: () => ['admin', 'coordinador', 'agencia'].includes(currentUser?.role || ''),
    puedeEditarMarketing: () => ['admin', 'agencia'].includes(currentUser?.role || ''),
    puedeVerSeccion: (seccion: string) => {
      if (!currentUser) return false
      const acceso: Record<string, string[]> = {
        dashboard: ['admin', 'vendedor', 'coordinador', 'asesor', 'agencia'],
        coordinator: ['admin', 'coordinador'],
        leads: ['admin', 'vendedor', 'coordinador'],
        properties: ['admin', 'vendedor', 'coordinador'],
        team: ['admin', 'coordinador'],
        mortgage: ['admin', 'asesor', 'coordinador'],
        marketing: ['admin', 'agencia', 'coordinador'],
        goals: ['admin', 'vendedor', 'coordinador'],
        calendar: ['admin', 'vendedor', 'coordinador'],
        promotions: ['admin', 'coordinador', 'agencia'],
        events: ['admin', 'coordinador'],
        followups: ['admin', 'vendedor', 'coordinador'],
        reportes: ['admin'],
        encuestas: ['admin', 'coordinador'],
        referrals: ['admin', 'coordinador', 'vendedor'],
        config: ['admin'],
        bi: ['admin', 'coordinador'],
        mensajes: ['admin', 'coordinador'],
        inbox: ['admin', 'coordinador', 'vendedor'],
        sistema: ['admin'],
        'sara-ai': ['admin'],
        alertas: ['admin', 'coordinador'],
        sla: ['admin', 'coordinador'],
      }
      return acceso[seccion]?.includes(currentUser.role) || false
    }
  }
}

export type Permisos = ReturnType<typeof buildPermisos>

// ---- Notification types ----
export interface CrmNotification {
  id: string
  message: string
  type: 'info' | 'success' | 'warning'
  timestamp: string
  read: boolean
  leadId?: string
  category: 'leads' | 'citas' | 'sistema'
}

// ---- Context shape ----
interface CrmContextValue {
  // Core data
  leads: Lead[]
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>
  properties: Property[]
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>
  team: TeamMember[]
  setTeam: React.Dispatch<React.SetStateAction<TeamMember[]>>
  mortgages: MortgageApplication[]
  setMortgages: React.Dispatch<React.SetStateAction<MortgageApplication[]>>
  campaigns: Campaign[]
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>
  appointments: Appointment[]
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>
  alertSettings: AlertSetting[]
  setAlertSettings: React.Dispatch<React.SetStateAction<AlertSetting[]>>
  reminderConfigs: ReminderConfig[]
  setReminderConfigs: React.Dispatch<React.SetStateAction<ReminderConfig[]>>
  promotions: Promotion[]
  setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>>
  crmEvents: CRMEvent[]
  setCrmEvents: React.Dispatch<React.SetStateAction<CRMEvent[]>>
  eventRegistrations: EventRegistration[]
  setEventRegistrations: React.Dispatch<React.SetStateAction<EventRegistration[]>>
  insights: Insight[]

  // Auth
  currentUser: TeamMember | null
  setCurrentUser: React.Dispatch<React.SetStateAction<TeamMember | null>>
  permisos: Permisos

  // Navigation
  view: View
  setView: React.Dispatch<React.SetStateAction<View>>

  // Loading
  loading: boolean
  lastRefresh: Date

  // Toast
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[]
  setToasts: React.Dispatch<React.SetStateAction<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>>

  // Notifications
  notifications: CrmNotification[]
  addNotification: (notif: Omit<CrmNotification, 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  clearNotifications: () => void
  unreadNotificationCount: number

  // Data operations
  loadData: () => Promise<void>
  loadDataSilent: () => Promise<void>

  // CRUD
  saveProperty: (prop: Partial<Property>) => Promise<void>
  deleteProperty: (id: string) => void
  saveLead: (lead: Partial<Lead>) => Promise<void>
  saveMember: (member: Partial<TeamMember>) => Promise<void>
  deleteMember: (id: string) => void
  saveMortgage: (mortgage: Partial<MortgageApplication>) => Promise<void>
  updateMortgageStatus: (id: string, newStatus: string) => Promise<void>
  saveCampaign: (campaign: Partial<Campaign>) => Promise<void>
  deleteCampaign: (id: string) => void
  savePromotion: (promo: Partial<Promotion>) => Promise<void>
  deletePromotion: (id: string) => void
  togglePromoStatus: (promo: Promotion) => Promise<void>
  saveCrmEvent: (event: Partial<CRMEvent>) => Promise<void>
  deleteCrmEvent: (id: string) => void
  saveReminderConfig: (config: ReminderConfig) => Promise<void>

  // Modals
  confirmModal: { title: string; message: string; onConfirm: () => void } | null
  setConfirmModal: React.Dispatch<React.SetStateAction<{ title: string; message: string; onConfirm: () => void } | null>>
  inputModal: { title: string; fields: { name: string; label: string; type?: string; defaultValue?: string }[]; onSubmit: (values: Record<string, string>) => void } | null
  setInputModal: React.Dispatch<React.SetStateAction<any>>

  // Computed
  filteredLeads: Lead[]
  filteredMortgages: MortgageApplication[]
  vendedoresRanking: TeamMember[]
  asesoresRanking: TeamMember[]

  // Helpers
  getDaysInStatus: (mortgage: MortgageApplication) => number
  getYoutubeThumbnail: (url: string) => string | null
  sourceLabel: (src: string) => string

  // Supabase ref
  supabase: typeof supabase
}

const CrmContext = createContext<CrmContextValue | null>(null)

export function useCrm() {
  const ctx = useContext(CrmContext)
  if (!ctx) throw new Error('useCrm must be used inside CrmProvider')
  return ctx
}

// Valid view names for route mapping
const VALID_VIEWS: View[] = [
  'dashboard', 'leads', 'properties', 'team', 'mortgage', 'marketing',
  'calendar', 'promotions', 'events', 'goals', 'followups', 'reportes',
  'bi', 'mensajes', 'encuestas', 'referrals', 'coordinator', 'sistema',
  'sara-ai', 'alertas', 'sla', 'config', 'inbox'
]

function pathToView(pathname: string): View {
  const segment = pathname.replace(/^\//, '').split('/')[0] || 'dashboard'
  if (segment === '' || segment === 'dashboard') return 'dashboard'
  if (VALID_VIEWS.includes(segment as View)) return segment as View
  return 'dashboard'
}

function viewToPath(v: View): string {
  return v === 'dashboard' ? '/' : '/' + v
}

// Inner provider that uses Router hooks (must be inside a Router)
function CrmProviderWithRouter({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  return <CrmProviderInner navigate={navigate} locationPathname={location.pathname}>{children}</CrmProviderInner>
}

// Outer provider that gracefully handles missing Router
export function CrmProvider({ children }: { children: ReactNode }) {
  // Check if we're inside a Router by looking for the LocationContext
  // We use a try-render approach: wrap in error boundary alternative
  // Simpler: check if UNSAFE_DataRouterContext or location context exists
  // Safest: just render with router hooks — in production always inside BrowserRouter
  // For tests without Router, use CrmProviderInner directly
  return <CrmProviderWithRouter>{children}</CrmProviderWithRouter>
}

function CrmProviderInner({ children, navigate, locationPathname }: {
  children: ReactNode
  navigate: ReturnType<typeof useNavigate> | null
  locationPathname: string | null
}) {
  // ---- Core data state ----
  const initialView = locationPathname ? pathToView(locationPathname) : 'dashboard'
  const [view, setViewState] = useState<View>(initialView)

  // Wrap setView to also update URL
  const setView = useCallback((action: React.SetStateAction<View>) => {
    setViewState(prev => {
      const next = typeof action === 'function' ? action(prev) : action
      if (navigate) {
        try { navigate(viewToPath(next), { replace: false }) } catch { /* noop */ }
      }
      return next
    })
  }, [navigate]) as React.Dispatch<React.SetStateAction<View>>

  // Sync view when browser back/forward changes the URL
  useEffect(() => {
    if (!locationPathname) return
    const viewFromUrl = pathToView(locationPathname)
    setViewState(viewFromUrl)
  }, [locationPathname])
  const [leads, setLeads] = useState<Lead[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [mortgages, setMortgages] = useState<MortgageApplication[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [alertSettings, setAlertSettings] = useState<AlertSetting[]>([])
  const [reminderConfigs, setReminderConfigs] = useState<ReminderConfig[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [crmEvents, setCrmEvents] = useState<CRMEvent[]>([])
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([])
  const [insights, setInsights] = useState<Insight[]>([])

  // ---- Auth ----
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null)
  const permisos = useMemo(() => buildPermisos(currentUser), [currentUser])

  // ---- UI ----
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([])
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null)
  const [inputModal, setInputModal] = useState<any>(null)

  // ---- Toast ----
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev.slice(-2), { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  // ---- Notifications ----
  const [notifications, setNotifications] = useState<CrmNotification[]>(() => {
    try {
      const saved = localStorage.getItem('sara-crm-notifications')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  // Persist notifications to localStorage (keep last 50)
  useEffect(() => {
    localStorage.setItem('sara-crm-notifications', JSON.stringify(notifications.slice(0, 50)))
  }, [notifications])

  const addNotification = useCallback((notif: Omit<CrmNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: CrmNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      read: false,
    }
    setNotifications(prev => [newNotif, ...prev].slice(0, 50))
  }, [])

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadNotificationCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  // ---- Computed ----
  const filteredLeads = useMemo(() => {
    if (!currentUser || currentUser.role === 'admin') return leads
    return leads.filter(l => l.assigned_to === currentUser.id)
  }, [leads, currentUser])

  const filteredMortgages = useMemo(() => {
    if (!currentUser || currentUser.role === 'admin') return mortgages
    if (currentUser.role === 'asesor') return mortgages.filter(m => m.assigned_advisor_id === currentUser.id)
    return mortgages.filter(m => leads.some(l => l.id === m.lead_id && l.assigned_to === currentUser.id))
  }, [mortgages, currentUser, leads])

  const vendedoresRanking = useMemo(() =>
    [...team].filter(t => t.role === 'vendedor').sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0)),
    [team]
  )

  const asesoresRanking = useMemo(() =>
    [...team].filter(t => t.role === 'asesor').sort((a, b) => (b.commission || 0) - (a.commission || 0)),
    [team]
  )

  // ---- Helpers ----
  const getDaysInStatus = useCallback((mortgage: MortgageApplication): number => {
    let statusDate: string | null = null
    switch (mortgage.status) {
      case 'pending': statusDate = mortgage.pending_at; break
      case 'in_review': statusDate = mortgage.in_review_at; break
      case 'sent_to_bank': statusDate = mortgage.sent_to_bank_at; break
      default: statusDate = mortgage.updated_at
    }
    if (!statusDate) return 0
    return Math.floor((Date.now() - new Date(statusDate).getTime()) / (1000 * 60 * 60 * 24))
  }, [])

  const getYoutubeThumbnail = useCallback((url: string) => {
    if (!url) return null
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([^&?]+)/)
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null
  }, [])

  const sourceLabelFn = useCallback((src: string) => {
    const map: Record<string, string> = {
      'phone_inbound': '📞 Llamada', 'facebook_ads': '📘 Facebook', 'referral': '🤝 Referido',
      'agency_import': '📥 Importado', 'whatsapp': '💬 WhatsApp', 'website': '🌐 Web', 'Directo': '➡️ Directo',
    }
    return map[src] || src
  }, [])

  // ---- Insights ----
  function generateInsights(leadsData: Lead[], teamData: TeamMember[], campaignsData: Campaign[]) {
    const newInsights: Insight[] = []

    const hotLeadsNoActivity = leadsData.filter(l => {
      if (l.score >= 8 && l.status === 'new') {
        const updatedAt = new Date(l.updated_at || l.created_at)
        return (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60) > 2
      }
      return false
    })
    if (hotLeadsNoActivity.length > 0) {
      newInsights.push({ type: 'warning', title: `${hotLeadsNoActivity.length} leads HOT sin atencion`, description: 'Tienes leads calificados que no han recibido seguimiento en las ultimas 2 horas', action: 'Contactar urgente', icon: Flame })
    }

    const highCPLCampaigns = campaignsData.filter(c => {
      const cpl = c.leads_generated > 0 ? c.spent / c.leads_generated : 0
      return cpl > 1000 && c.status === 'active'
    })
    if (highCPLCampaigns.length > 0) {
      newInsights.push({ type: 'warning', title: `CPL alto en ${highCPLCampaigns[0].name}`, description: `El costo por lead es de $${(highCPLCampaigns[0].spent / highCPLCampaigns[0].leads_generated).toFixed(0)}. Considera ajustar segmentacion`, action: 'Revisar campana', icon: TrendingDown })
    }

    const mostInterested = leadsData.reduce((acc: Record<string, number>, l) => { if (l.property_interest) { acc[l.property_interest] = (acc[l.property_interest] || 0) + 1 }; return acc }, {})
    const topProperty = Object.entries(mostInterested).sort((a, b) => b[1] - a[1])[0]
    if (topProperty && topProperty[1] > 5) {
      newInsights.push({ type: 'success', title: `${topProperty[0]} tiene alta demanda`, description: `${topProperty[1]} leads interesados. Considera aumentar precio o crear campana especifica`, action: 'Ver propiedad', icon: TrendingUp })
    }

    const topSeller = teamData.filter(t => t.role === 'vendedor').sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))[0]
    if (topSeller && topSeller.sales_count > 0) {
      newInsights.push({ type: 'success', title: `${topSeller.name} lidera en ventas`, description: `${topSeller.sales_count} ventas cerradas`, action: 'Ver estadisticas', icon: Award })
    }

    const negROI = campaignsData.filter(c => { const roi = c.spent > 0 ? ((c.revenue_generated - c.spent) / c.spent * 100) : 0; return roi < -20 && c.status === 'active' })
    if (negROI.length > 0) {
      newInsights.push({ type: 'warning', title: `${negROI.length} campanas con ROI negativo`, description: 'Revisa la efectividad de estas campanas', action: 'Ver campanas', icon: AlertCircle })
    }

    const qualifiedLeads = leadsData.filter(l => l.score >= 7 && l.status === 'qualified')
    if (qualifiedLeads.length > 3) {
      newInsights.push({ type: 'opportunity', title: `${qualifiedLeads.length} clientes listos para cerrar`, description: 'Tienes leads calificados en etapa final', action: 'Ver leads', icon: Target })
    }

    const stuckReserved = leadsData.filter(l => {
      if (l.status === 'reserved' || l.status === 'Reservado') {
        return (Date.now() - new Date(l.updated_at || l.created_at).getTime()) / (1000 * 60 * 60 * 24) > 7
      }
      return false
    })
    if (stuckReserved.length > 0) {
      newInsights.push({ type: 'warning', title: `${stuckReserved.length} reservados estancados`, description: 'Llevan mas de 7 dias sin avance en credito', action: 'Ver leads', icon: Clock })
    }

    setInsights(newInsights)
  }

  // ---- Data Loading ----
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
    setLastRefresh(new Date())

    // Restore session
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

  // ---- Initial load + realtime + auto-refresh ----
  useEffect(() => {
    loadData()
    const interval = setInterval(loadDataSilent, 30000)

    const appointmentsSub = supabase
      .channel('appointments-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'appointments' }, (payload) => {
        const apt = payload.new as any
        const leadName = apt.lead_name || 'Lead'
        const propName = apt.property_name || ''
        addNotification({
          message: `Nueva cita: ${leadName}${propName ? ' - ' + propName : ''}`,
          type: 'info',
          category: 'citas',
          leadId: apt.lead_id,
        })
        supabase.from('appointments').select('*').order('scheduled_date', { ascending: true }).then(({ data }) => { if (data) setAppointments(data) })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'appointments' }, () => {
        supabase.from('appointments').select('*').order('scheduled_date', { ascending: true }).then(({ data }) => { if (data) setAppointments(data) })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'appointments' }, () => {
        supabase.from('appointments').select('*').order('scheduled_date', { ascending: true }).then(({ data }) => { if (data) setAppointments(data) })
      })
      .subscribe()

    const leadsSub = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
        const lead = payload.new as any
        const name = lead.name || lead.phone || 'Sin nombre'
        const interest = lead.property_interest ? ` interesado en ${lead.property_interest}` : ''
        addNotification({
          message: `Nuevo lead: ${name}${interest}`,
          type: 'success',
          category: 'leads',
          leadId: lead.id,
        })
        supabase.from('leads').select('*').order('created_at', { ascending: false }).then(({ data }) => { if (data) setLeads(data) })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, (payload) => {
        const newLead = payload.new as any
        const oldLead = payload.old as any
        if (oldLead.status && newLead.status && oldLead.status !== newLead.status) {
          const name = newLead.name || newLead.phone || 'Lead'
          addNotification({
            message: `Lead ${name} cambio a ${newLead.status}`,
            type: 'info',
            category: 'leads',
            leadId: newLead.id,
          })
        }
        supabase.from('leads').select('*').order('created_at', { ascending: false }).then(({ data }) => { if (data) setLeads(data) })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'leads' }, () => {
        supabase.from('leads').select('*').order('created_at', { ascending: false }).then(({ data }) => { if (data) setLeads(data) })
      })
      .subscribe()

    const mortgageSub = supabase
      .channel('mortgages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mortgage_applications' }, (payload) => {
        const mort = payload.new as any
        const leadName = mort.lead_name || 'Lead'
        addNotification({
          message: `Hipoteca de ${leadName}: ${mort.status || 'nueva solicitud'}`,
          type: 'info',
          category: 'sistema',
        })
        supabase.from('mortgage_applications').select('*').order('created_at', { ascending: false }).then(({ data }) => { if (data) setMortgages(data) })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mortgage_applications' }, (payload) => {
        const newMort = payload.new as any
        const oldMort = payload.old as any
        if (oldMort.status && newMort.status && oldMort.status !== newMort.status) {
          const leadName = newMort.lead_name || 'Lead'
          const statusLabel: Record<string, string> = {
            pending: 'pendiente', in_review: 'en revision', sent_to_bank: 'enviada al banco',
            approved: 'aprobada', rejected: 'rechazada', cancelled: 'cancelada'
          }
          addNotification({
            message: `Hipoteca de ${leadName}: ${statusLabel[newMort.status] || newMort.status}`,
            type: newMort.status === 'approved' ? 'success' : newMort.status === 'rejected' ? 'warning' : 'info',
            category: 'sistema',
          })
        }
        supabase.from('mortgage_applications').select('*').order('created_at', { ascending: false }).then(({ data }) => { if (data) setMortgages(data) })
      })
      .subscribe()

    return () => { clearInterval(interval); appointmentsSub.unsubscribe(); leadsSub.unsubscribe(); mortgageSub.unsubscribe() }
  }, [])

  // ---- CRUD Functions ----
  async function savePropertyFn(prop: Partial<Property>) {
    if (prop.id) { await supabase.from('properties').update(prop).eq('id', prop.id) }
    else { await supabase.from('properties').insert([prop]) }
    loadData()
  }

  function deletePropertyFn(id: string) {
    setConfirmModal({
      title: 'Eliminar propiedad', message: 'Esta accion no se puede deshacer.',
      onConfirm: async () => { await supabase.from('properties').delete().eq('id', id); loadData(); setConfirmModal(null) }
    })
  }

  async function saveLeadFn(lead: Partial<Lead>) {
    if (lead.id) {
      await supabase.from('leads').update({ name: lead.name, phone: lead.phone, property_interest: lead.property_interest, budget: lead.budget, score: lead.score, status: lead.status, source: lead.source, assigned_to: lead.assigned_to, credit_status: lead.credit_status }).eq('id', lead.id)
    }
    loadData()
  }

  async function saveMemberFn(member: Partial<TeamMember>) {
    try {
      const API_URL = `${API_BASE}/api/team-members`
      if (member.id) {
        await safeFetch(`${API_URL}/${member.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(member) })
      } else {
        await safeFetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(member) })
      }
      loadData()
    } catch (error) {
      showToast('Error al guardar: ' + (error instanceof Error ? error.message : 'Intenta de nuevo'), 'error')
    }
  }

  function deleteMemberFn(id: string) {
    setConfirmModal({
      title: 'Eliminar miembro', message: 'Esta seguro de eliminar este miembro del equipo?',
      onConfirm: async () => {
        try { await safeFetch(`${API_BASE}/api/team-members/${id}`, { method: 'DELETE' }); loadData() }
        catch (error) { showToast('Error al eliminar', 'error') }
        setConfirmModal(null)
      }
    })
  }

  async function saveMortgageFn(mortgage: Partial<MortgageApplication>) {
    const now = new Date().toISOString()
    if (mortgage.id) {
      const current = mortgages.find(m => m.id === mortgage.id)
      const statusChanged = current && current.status !== mortgage.status
      if (statusChanged) {
        if (mortgage.status === 'in_review') mortgage.in_review_at = now
        if (mortgage.status === 'sent_to_bank') mortgage.sent_to_bank_at = now
        if (mortgage.status === 'approved' || mortgage.status === 'rejected') mortgage.decision_at = now
      }
      const payload: any = { ...mortgage }
      if (statusChanged && currentUser) { payload.changed_by_id = currentUser.id; payload.changed_by_name = currentUser.name; payload.previous_status = current?.status }
      await safeFetch(`${API_BASE}/api/mortgage_applications/${mortgage.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      mortgage.pending_at = now
      if (currentUser?.role === 'asesor') { mortgage.assigned_advisor_id = currentUser.id; mortgage.assigned_advisor_name = currentUser.name }
      await supabase.from('mortgage_applications').insert([mortgage])
    }
    loadData()
  }

  async function updateMortgageStatusFn(id: string, newStatus: string) {
    const now = new Date().toISOString()
    const updates: any = { status: newStatus }
    if (newStatus === 'in_review') updates.in_review_at = now
    if (newStatus === 'sent_to_bank') updates.sent_to_bank_at = now
    if (newStatus === 'approved' || newStatus === 'rejected') updates.decision_at = now
    await safeFetch(`${API_BASE}/api/mortgage_applications/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
    loadData()
  }

  async function saveCampaignFn(campaign: Partial<Campaign>) {
    if (campaign.id) { await supabase.from('marketing_campaigns').update(campaign).eq('id', campaign.id) }
    else { await supabase.from('marketing_campaigns').insert([campaign]) }
    loadData()
  }

  function deleteCampaignFn(id: string) {
    setConfirmModal({
      title: 'Eliminar campana', message: 'Esta accion no se puede deshacer.',
      onConfirm: async () => { await supabase.from('marketing_campaigns').delete().eq('id', id); loadData(); setConfirmModal(null) }
    })
  }

  async function savePromotionFn(promo: Partial<Promotion>) {
    if (promo.id) { await supabase.from('promotions').update(promo).eq('id', promo.id) }
    else { await supabase.from('promotions').insert([promo]) }
    loadData()
  }

  function deletePromotionFn(id: string) {
    setConfirmModal({
      title: 'Eliminar promocion', message: 'Esta accion no se puede deshacer.',
      onConfirm: async () => { await supabase.from('promotions').delete().eq('id', id); loadData(); setConfirmModal(null) }
    })
  }

  async function togglePromoStatusFn(promo: Promotion) {
    const newStatus = promo.status === 'active' ? 'paused' : 'active'
    await supabase.from('promotions').update({ status: newStatus }).eq('id', promo.id)
    loadData()
  }

  async function saveCrmEventFn(event: Partial<CRMEvent>) {
    if (event.id) { await supabase.from('events').update(event).eq('id', event.id) }
    else { await supabase.from('events').insert([event]) }
    loadData()
  }

  function deleteCrmEventFn(id: string) {
    setConfirmModal({
      title: 'Eliminar evento', message: 'Esta accion no se puede deshacer.',
      onConfirm: async () => { await supabase.from('events').delete().eq('id', id); loadData(); setConfirmModal(null) }
    })
  }

  async function saveReminderConfigFn(config: ReminderConfig) {
    try {
      await supabase.from('reminder_config').update({
        reminder_hours: config.reminder_hours, message_template: config.message_template,
        send_start_hour: config.send_start_hour, send_end_hour: config.send_end_hour
      }).eq('id', config.id)
      setReminderConfigs(prev => prev.map(r => r.id === config.id ? config : r))
    } catch (error) {
      console.error('Error updating reminder config:', error)
    }
  }

  // ---- Context value ----
  const value: CrmContextValue = {
    leads, setLeads, properties, setProperties, team, setTeam,
    mortgages, setMortgages, campaigns, setCampaigns,
    appointments, setAppointments, alertSettings, setAlertSettings,
    reminderConfigs, setReminderConfigs, promotions, setPromotions,
    crmEvents, setCrmEvents, eventRegistrations, setEventRegistrations,
    insights, currentUser, setCurrentUser, permisos, view, setView,
    loading, lastRefresh, showToast, toasts, setToasts,
    notifications, addNotification, markNotificationRead, markAllNotificationsRead,
    clearNotifications, unreadNotificationCount,
    loadData, loadDataSilent,
    saveProperty: savePropertyFn, deleteProperty: deletePropertyFn,
    saveLead: saveLeadFn, saveMember: saveMemberFn, deleteMember: deleteMemberFn,
    saveMortgage: saveMortgageFn, updateMortgageStatus: updateMortgageStatusFn,
    saveCampaign: saveCampaignFn, deleteCampaign: deleteCampaignFn,
    savePromotion: savePromotionFn, deletePromotion: deletePromotionFn,
    togglePromoStatus: togglePromoStatusFn,
    saveCrmEvent: saveCrmEventFn, deleteCrmEvent: deleteCrmEventFn,
    saveReminderConfig: saveReminderConfigFn,
    confirmModal, setConfirmModal, inputModal, setInputModal,
    filteredLeads, filteredMortgages, vendedoresRanking, asesoresRanking,
    getDaysInStatus, getYoutubeThumbnail, sourceLabel: sourceLabelFn,
    supabase,
  }

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>
}
