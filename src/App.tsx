import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { supabase } from './lib/supabase'
import { Lead, Property, TeamMember, MortgageApplication, Campaign, Appointment, Promotion, CRMEvent, EventRegistration, API_BASE, safeFetch } from './types/crm'
import type { View } from './types/crm'
import { PropertyModal, LeadModal, MemberModal, MortgageModal, CampaignModal, PromotionModal, CrmEventModal, SendPromoModal, InviteEventModal, NewAppointmentModal, EditAppointmentModal, ConfirmModal, InputModal } from './components/modals'
import Sidebar from './components/Sidebar'
import NotificationDrawer from './components/NotificationDrawer'
import GlobalSearch from './components/GlobalSearch'
import LoginScreen from './components/LoginScreen'
import { SkeletonDashboard, SkeletonTable, SkeletonCards, SkeletonCalendar, SkeletonGeneric } from './components/Skeletons'
import { Bell, Search } from 'lucide-react'

const LeadsView = lazy(() => import('./views/LeadsView'))
const DashboardView = lazy(() => import('./views/DashboardView'))
const PromotionsView = lazy(() => import('./views/PromotionsView'))
const EventsView = lazy(() => import('./views/EventsView'))
const CalendarView = lazy(() => import('./views/CalendarView'))
const CoordinatorView = lazy(() => import('./views/CoordinatorView'))
const BusinessIntelligenceView = lazy(() => import('./views/BusinessIntelligenceView'))
const MessageMetricsView = lazy(() => import('./views/MessageMetricsView'))
const ReportesCEOView = lazy(() => import('./views/ReportesCEOView'))
const EncuestasEventosView = lazy(() => import('./views/EncuestasEventosView'))
const FollowupsView = lazy(() => import('./views/FollowupsView'))
const SystemView = lazy(() => import('./views/SystemView'))
const AlertasView = lazy(() => import('./views/AlertasView'))
const SlaView = lazy(() => import('./views/SlaView'))
const PropertiesView = lazy(() => import('./views/PropertiesView'))
const TeamView = lazy(() => import('./views/TeamView'))
const MortgageView = lazy(() => import('./views/MortgageView'))
const MarketingView = lazy(() => import('./views/MarketingView'))
const GoalsView = lazy(() => import('./views/GoalsView'))
const ReferralsView = lazy(() => import('./views/ReferralsView'))
const ConfigView = lazy(() => import('./views/ConfigView'))
const SaraAiView = lazy(() => import('./views/SaraAiView'))
const LeadDrawer = lazy(() => import('./components/LeadDrawer'))

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('sidebar_collapsed') || '{}') } catch { return {} }
  })
  const [leads, setLeads] = useState<Lead[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [mortgages, setMortgages] = useState<MortgageApplication[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null)

  // Permisos
  const permisos = {
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
        sistema: ['admin'],
      }
      return acceso[seccion]?.includes(currentUser.role) || false
    }
  }

  const getDaysInStatus = (m: MortgageApplication) => {
    const dateField = m.status === 'pending' ? m.pending_at : m.status === 'in_review' ? m.in_review_at : m.status === 'sent_to_bank' ? m.sent_to_bank_at : m.updated_at
    if (!dateField) return 0
    return Math.floor((Date.now() - new Date(dateField).getTime()) / 86400000)
  }

  const [loginPhone, setLoginPhone] = useState('')
  const [loginError, setLoginError] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)

  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [editingMortgage, setEditingMortgage] = useState<MortgageApplication | null>(null)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [showNewProperty, setShowNewProperty] = useState(false)
  const [showNewMember, setShowNewMember] = useState(false)
  const [showNewMortgage, setShowNewMortgage] = useState(false)
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [showNewAppointment, setShowNewAppointment] = useState(false)
  const [newAppointment, setNewAppointment] = useState<any>({})
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)

  const [showGlobalSearch, setShowGlobalSearch] = useState(false)

  const [toasts, setToasts] = useState<{id: string, message: string, type: 'success' | 'error' | 'info'}[]>([])

  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('sara-crm-read-notifs')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch { return new Set() }
  })

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

  const [inputModal, setInputModal] = useState<{
    title: string
    fields: { name: string; label: string; type?: string; defaultValue?: string }[]
    onSubmit: (values: Record<string, string>) => void
  } | null>(null)

  const [confirmModal, setConfirmModal] = useState<{
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  const [saving, setSaving] = useState(false)

  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false)
  const [notifCategory, setNotifCategory] = useState<'all' | 'leads' | 'citas' | 'sistema'>('all')
  const [notifTimeFilter, setNotifTimeFilter] = useState<'today' | '24h' | '7d' | 'all'>('all')

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev.slice(-2), { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  // Notification generation
  const notifications = useMemo(() => {
    const notifs: Array<{id: string, type: string, title: string, description: string, timestamp: string, leadId?: string}> = []
    const now = Date.now()

    leads.forEach((l: any) => {
      if (l.created_at && (now - new Date(l.created_at).getTime()) < 2 * 3600000) {
        notifs.push({ id: `new-${l.id}`, type: 'new_lead', title: 'Nuevo lead', description: l.name || l.phone, timestamp: l.created_at, leadId: l.id })
      }
      if (l.score >= 70 && l.last_message_at && (now - new Date(l.last_message_at).getTime()) > 24 * 3600000) {
        notifs.push({ id: `hot-${l.id}`, type: 'hot_inactive', title: 'Lead HOT sin seguimiento', description: l.name || l.phone, timestamp: l.last_message_at, leadId: l.id })
      }
      if (l.status === 'new' && l.created_at && (now - new Date(l.created_at).getTime()) > 48 * 3600000) {
        notifs.push({ id: `nofu-${l.id}`, type: 'no_followup', title: 'Lead sin contactar', description: l.name || l.phone, timestamp: l.created_at, leadId: l.id })
      }
      if (l.status_changed_at && (now - new Date(l.status_changed_at).getTime()) < 4 * 3600000) {
        notifs.push({ id: `status-${l.id}-${l.status}`, type: 'status_change', title: `${l.name || 'Lead'} movido a ${l.status}`, description: '', timestamp: l.status_changed_at, leadId: l.id })
      }
    })

    leads.forEach((l: any) => {
      if (l.credit_status && l.credit_status !== 'approved' && l.credit_status !== 'rejected') {
        const statusAge = l.status_changed_at ? (now - new Date(l.status_changed_at).getTime()) : 0
        if (statusAge > 7 * 24 * 3600000) {
          notifs.push({ id: `mort-${l.id}`, type: 'mortgage_stalled', title: 'Hipoteca estancada', description: `${l.name || l.phone} - ${l.credit_status}`, timestamp: l.status_changed_at || l.created_at, leadId: l.id })
        }
      }
      if (l.notes?.score_history?.length >= 2) {
        const hist = l.notes.score_history
        const prev = hist[hist.length - 2]?.score || 0
        const curr = hist[hist.length - 1]?.score || l.score || 0
        if (curr - prev > 20) {
          notifs.push({ id: `score-${l.id}`, type: 'score_jump', title: `Score subio +${curr - prev}`, description: `${l.name || l.phone}: ${prev} → ${curr}`, timestamp: hist[hist.length - 1]?.fecha || l.last_message_at || l.created_at, leadId: l.id })
        }
      }
    })

    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    appointments.forEach((a: any) => {
      if (a.scheduled_date === today && a.status !== 'cancelled') {
        const leadName = leads.find((l: any) => l.id === a.lead_id)?.name || 'Lead'
        notifs.push({ id: `apt-${a.id}`, type: 'appointment_today', title: `Cita hoy: ${leadName}`, description: `${a.scheduled_time || ''}${a.property_name ? ' - ' + a.property_name : ''}`, timestamp: a.created_at || `${a.scheduled_date}T08:00`, leadId: a.lead_id })
      }
      if (a.scheduled_date === tomorrow && a.status !== 'cancelled') {
        const leadName = leads.find((l: any) => l.id === a.lead_id)?.name || 'Lead'
        notifs.push({ id: `apt-tom-${a.id}`, type: 'appointment_tomorrow', title: `Cita manana: ${leadName}`, description: `${a.scheduled_time || ''}${a.property_name ? ' - ' + a.property_name : ''}`, timestamp: a.created_at || `${a.scheduled_date}T08:00`, leadId: a.lead_id })
      }
    })

    notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return notifs.slice(0, 30)
  }, [leads, appointments])

  const unreadNotifCount = notifications.filter(n => !readNotificationIds.has(n.id)).length

  useEffect(() => {
    if (readNotificationIds.size > 0) {
      localStorage.setItem('sara-crm-read-notifs', JSON.stringify([...readNotificationIds]))
    }
  }, [readNotificationIds])

  // Auto-expand sidebar section when navigating to a view
  useEffect(() => {
    const sectionMap: Record<string, string[]> = {
      ventas: ['coordinator','calendar','followups','mortgage','promotions','events'],
      comunicacion: ['mensajes','encuestas','referrals'],
      inteligencia: ['reportes','bi','marketing','sara-ai'],
      monitoreo: ['alertas','sla'],
      admin: ['team','goals','sistema','config'],
    }
    for (const [section, views] of Object.entries(sectionMap)) {
      if (views.includes(view) && collapsedSections[section]) {
        const next = { ...collapsedSections, [section]: false }
        setCollapsedSections(next)
        localStorage.setItem('sidebar_collapsed', JSON.stringify(next))
        break
      }
    }
  }, [view])

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
        setNotifDrawerOpen(false)
        setEditingCampaign(null)
        setEditingPromotion(null)
        setEditingCrmEvent(null)
        setEditingAppointment(null)
        setSelectedLead(null)
        setShowNewProperty(false)
        setShowNewMember(false)
        setShowNewMortgage(false)
        setShowNewCampaign(false)
        setShowNewAppointment(false)
        setShowNewPromotion(false)
        setShowNewCrmEvent(false)
        setShowInviteEventModal(false)
        setShowSendPromoModal(false)
        setShowGlobalSearch(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  // Bloquear scroll del body cuando hay modal abierto
  useEffect(() => {
    const anyModalOpen = !!(inputModal || confirmModal || editingLead || editingProperty || editingMember || editingMortgage || editingCampaign || editingPromotion || editingCrmEvent || editingAppointment || selectedLead || showNewProperty || showNewMember || showNewMortgage || showNewCampaign || showNewAppointment || showNewPromotion || showNewCrmEvent || showInviteEventModal)
    document.body.style.overflow = anyModalOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [inputModal, confirmModal, editingLead, editingProperty, editingMember, editingMortgage, editingCampaign, editingPromotion, editingCrmEvent, editingAppointment, selectedLead, showNewProperty, showNewMember, showNewMortgage, showNewCampaign, showNewAppointment, showNewPromotion, showNewCrmEvent, showInviteEventModal])

  useEffect(() => {
    loadData()
    const interval = setInterval(() => loadDataSilent(), 30000)

    const appointmentsSubscription = supabase
      .channel('appointments-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        supabase.from('appointments').select('*').order('scheduled_date', { ascending: true })
          .then(({ data }) => { if (data) setAppointments(data) })
      })
      .subscribe()

    const leadsSubscription = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        supabase.from('leads').select('*').order('created_at', { ascending: false })
          .then(({ data }) => { if (data) setLeads(data) })
      })
      .subscribe()

    return () => {
      clearInterval(interval)
      appointmentsSubscription.unsubscribe()
      leadsSubscription.unsubscribe()
    }
  }, [])

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
  }

  async function loadData() {
    setLoading(true)
    const [leadsRes, propsRes, teamRes, mortgagesRes, campaignsRes, , appointmentsRes, , promosRes, eventsRes] = await Promise.all([
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
    setAppointments(appointmentsRes.data || [])
    setPromotions(promosRes.data || [])
    setCrmEvents(eventsRes.data || [])
    setLoading(false)

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

  function selectLead(lead: Lead) { setSelectedLead(lead) }

  // Cmd+K global search shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowGlobalSearch(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // CRUD functions
  async function saveProperty(prop: Partial<Property>) {
    if (prop.id) { await supabase.from('properties').update(prop).eq('id', prop.id) }
    else { await supabase.from('properties').insert([prop]) }
    loadData(); setEditingProperty(null); setShowNewProperty(false)
  }

  async function saveLead(lead: Partial<Lead>) {
    if (lead.id) {
      await supabase.from('leads').update({
        name: lead.name, phone: lead.phone, property_interest: lead.property_interest,
        budget: lead.budget, score: lead.score, status: lead.status, source: lead.source,
        assigned_to: lead.assigned_to, credit_status: lead.credit_status
      }).eq('id', lead.id)
    }
    loadData(); setEditingLead(null); setSelectedLead(null)
  }

  async function saveMember(member: Partial<TeamMember>) {
    try {
      const API_URL = `${API_BASE}/api/team-members`
      if (member.id) {
        await safeFetch(`${API_URL}/${member.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(member) })
      } else {
        await safeFetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(member) })
      }
      loadData(); setEditingMember(null); setShowNewMember(false)
    } catch (error) {
      console.error('Error guardando miembro:', error)
      showToast('Error al guardar: ' + (error instanceof Error ? error.message : 'Intenta de nuevo'), 'error')
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
    loadData(); setEditingMortgage(null); setShowNewMortgage(false)
  }

  async function saveCampaign(campaign: Partial<Campaign>) {
    if (campaign.id) { await supabase.from('marketing_campaigns').update(campaign).eq('id', campaign.id) }
    else { await supabase.from('marketing_campaigns').insert([campaign]) }
    loadData(); setEditingCampaign(null); setShowNewCampaign(false)
  }

  async function savePromotion(promo: Partial<Promotion>) {
    if (promo.id) { await supabase.from('promotions').update(promo).eq('id', promo.id) }
    else { await supabase.from('promotions').insert([promo]) }
    loadData(); setEditingPromotion(null); setShowNewPromotion(false)
  }

  async function saveCrmEvent(event: Partial<CRMEvent>) {
    if (event.id) { await supabase.from('events').update(event).eq('id', event.id) }
    else { await supabase.from('events').insert([event]) }
    loadData(); setEditingCrmEvent(null); setShowNewCrmEvent(false)
  }

  async function sendEventInvitations(event: CRMEvent, segment: string, options: { sendImage: boolean, sendVideo: boolean, sendPdf: boolean }) {
    setInviteSending(true)
    try {
      const result = await safeFetch(`${API_BASE}/api/events/invite`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id, segment, send_image: options.sendImage, send_video: options.sendVideo, send_pdf: options.sendPdf })
      })
      if (result.success) showToast(`Invitaciones enviadas: ${result.sent} enviados, ${result.errors} errores`, 'success')
      else showToast('Error al enviar invitaciones: ' + (result.error || 'Error desconocido'), 'error')
    } catch (err: any) { showToast('Error: ' + err.message, 'error') }
    finally { setInviteSending(false); setShowInviteEventModal(false); setSelectedEventForInvite(null) }
  }

  const [showSendPromoModal, setShowSendPromoModal] = useState(false)
  const [selectedPromoToSend, setSelectedPromoToSend] = useState<Promotion | null>(null)
  const [promoSending, setPromoSending] = useState(false)

  async function sendPromoReal(segment: string, options: { sendImage: boolean, sendVideo: boolean, sendPdf: boolean, filters?: any }) {
    if (!selectedPromoToSend) return
    setPromoSending(true)
    try {
      const result = await safeFetch(`${API_BASE}/api/promotions/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotion_id: selectedPromoToSend.id, segment, segment_type: options.filters?.segmentType || 'basic',
          send_image: options.sendImage, send_video: options.sendVideo, send_pdf: options.sendPdf
        })
      })
      if (result.success) { showToast(`Promocion enviada! Enviados: ${result.sent} | Errores: ${result.errors} | Total: ${result.total}`, 'success'); loadData() }
      else showToast('Error: ' + (result.error || 'Error desconocido'), 'error')
    } catch (err: any) { showToast('Error de conexion: ' + err.message, 'error') }
    finally { setPromoSending(false); setShowSendPromoModal(false); setSelectedPromoToSend(null) }
  }

  const handleLogin = async () => {
    const cleanPhone = loginPhone.replace(/\D/g, '').slice(-10)
    if (cleanPhone.length !== 10) { setLoginError('Ingresa un numero de 10 digitos'); return }
    const user = team.find((m: TeamMember) => {
      const memberPhone = m.phone?.replace(/\D/g, '').slice(-10)
      return memberPhone === cleanPhone
    })
    if (user) {
      setCurrentUser(user); setLoginError(''); localStorage.setItem('sara_user_phone', cleanPhone)
      if (user.role === 'agencia') setView('marketing')
      else if (user.role === 'asesor') setView('mortgage')
      else setView('dashboard')
    } else { setLoginError('Numero no registrado en el equipo') }
  }

  if (!currentUser) {
    return <LoginScreen loginPhone={loginPhone} setLoginPhone={setLoginPhone} loginError={loginError} onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 sidebar-backdrop z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Mobile hamburger */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-slate-800 rounded-lg">
        {sidebarOpen ? '✕' : '☰'}
      </button>

      <Sidebar
        view={view} setView={setView}
        sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
        collapsedSections={collapsedSections} setCollapsedSections={setCollapsedSections}
        currentUser={currentUser} setCurrentUser={setCurrentUser}
        permisos={permisos}
        mortgages={mortgages} getDaysInStatus={getDaysInStatus}
        promotions={promotions} crmEvents={crmEvents} leads={leads}
      />

      <div className="flex-1 p-4 pt-16 lg:p-8 lg:pt-8 overflow-auto">
        {/* Desktop: Search + Notifications */}
        <div className="fixed top-4 right-4 z-30 hidden lg:flex items-center gap-2">
          <button onClick={() => setNotifDrawerOpen(true)}
            className="relative p-2 bg-slate-800/80 border border-slate-700/60 rounded-lg text-slate-400 hover:bg-slate-700/80 hover:text-white transition-all backdrop-blur-sm">
            <Bell size={15} />
            {unreadNotifCount > 0 && (
              <span className="notif-badge absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </span>
            )}
          </button>
          <button onClick={() => setShowGlobalSearch(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg text-slate-400 text-sm hover:bg-slate-700/80 hover:text-white transition-all backdrop-blur-sm">
            <Search size={14} /><span>Buscar...</span>
            <kbd className="ml-2 px-1.5 py-0.5 text-[10px] bg-slate-700 rounded border border-slate-600">⌘K</kbd>
          </button>
        </div>
        {/* Mobile: bell + search */}
        <div className="fixed top-4 right-4 z-30 lg:hidden flex items-center gap-2">
          <button onClick={() => setNotifDrawerOpen(true)} className="relative p-2 bg-slate-800 rounded-lg">
            <Bell size={16} className="text-slate-400" />
            {unreadNotifCount > 0 && (
              <span className="notif-badge absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </span>
            )}
          </button>
          <button onClick={() => setShowGlobalSearch(true)} className="p-2 bg-slate-800 rounded-lg">
            <Search size={16} className="text-slate-400" />
          </button>
        </div>

        <NotificationDrawer
          open={notifDrawerOpen} onClose={() => setNotifDrawerOpen(false)}
          notifications={notifications} readNotificationIds={readNotificationIds}
          setReadNotificationIds={setReadNotificationIds} unreadNotifCount={unreadNotifCount}
          notifCategory={notifCategory} setNotifCategory={setNotifCategory}
          notifTimeFilter={notifTimeFilter} setNotifTimeFilter={setNotifTimeFilter}
          leads={leads} onSelectLead={selectLead}
        />

        <GlobalSearch
          show={showGlobalSearch} onClose={() => setShowGlobalSearch(false)}
          leads={leads} properties={properties} team={team} appointments={appointments}
          onSelectLead={(lead) => { setSelectedLead(lead) }} setView={setView}
        />

        <div key={view} className="section-enter">
          {view === 'dashboard' && (loading ? <SkeletonDashboard /> :
            <Suspense fallback={<SkeletonGeneric />}><DashboardView /></Suspense>
          )}
          {view === 'leads' && (loading ? <SkeletonTable /> :
            <Suspense fallback={<SkeletonTable />}><LeadsView onSelectLead={selectLead} /></Suspense>
          )}
          {view === 'properties' && (loading ? <SkeletonCards /> :
            <Suspense fallback={<SkeletonGeneric />}><PropertiesView /></Suspense>
          )}
          {view === 'team' && (loading ? <SkeletonCards /> :
            <Suspense fallback={<SkeletonGeneric />}><TeamView /></Suspense>
          )}
          {view === 'mortgage' && <Suspense fallback={<SkeletonGeneric />}><MortgageView /></Suspense>}
          {view === 'marketing' && <Suspense fallback={<SkeletonGeneric />}><MarketingView /></Suspense>}
          {view === 'promotions' && <Suspense fallback={<SkeletonGeneric />}><PromotionsView /></Suspense>}
          {view === 'events' && <Suspense fallback={<SkeletonGeneric />}><EventsView /></Suspense>}
          {view === 'calendar' && (loading ? <SkeletonCalendar /> :
            <Suspense fallback={<SkeletonGeneric />}><CalendarView /></Suspense>
          )}
          {view === 'goals' && <Suspense fallback={<SkeletonGeneric />}><GoalsView /></Suspense>}
          {view === 'followups' && <Suspense fallback={<SkeletonGeneric />}><FollowupsView supabase={supabase} /></Suspense>}
          {view === 'reportes' && <Suspense fallback={<SkeletonGeneric />}><ReportesCEOView /></Suspense>}
          {view === 'encuestas' && (
            <Suspense fallback={<SkeletonGeneric />}>
              <EncuestasEventosView
                leads={leads} crmEvents={crmEvents} eventRegistrations={eventRegistrations}
                properties={properties} teamMembers={team}
                onSendSurvey={async (config) => {
                  try {
                    const result = await safeFetch(`${API_BASE}/api/send-surveys`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ template: config.template, leads: config.leads, message: config.message, targetType: config.targetType })
                    })
                    if (result.ok) {
                      const destinatarioTipo = config.targetType === 'vendedores' ? 'vendedores' : 'leads'
                      showToast(`Encuesta "${config.template.name}" enviada a ${result.enviados} ${destinatarioTipo} por WhatsApp.${result.errores > 0 ? ` ${result.errores} errores.` : ''}`, 'success')
                    } else { throw new Error(result.error || 'Error desconocido') }
                  } catch (error) {
                    console.error('Error enviando encuestas:', error)
                    showToast('Error al enviar encuestas. Intenta de nuevo.', 'error')
                  }
                }}
                showToast={showToast}
              />
            </Suspense>
          )}
          {view === 'bi' && (
            <Suspense fallback={<SkeletonGeneric />}>
              <BusinessIntelligenceView leads={leads} team={team} appointments={appointments} properties={properties} showToast={showToast} />
            </Suspense>
          )}
          {view === 'mensajes' && <Suspense fallback={<SkeletonGeneric />}><MessageMetricsView /></Suspense>}
          {view === 'referrals' && <Suspense fallback={<SkeletonGeneric />}><ReferralsView /></Suspense>}
          {view === 'coordinator' && <Suspense fallback={<SkeletonGeneric />}><CoordinatorView /></Suspense>}
          {view === 'sistema' && <Suspense fallback={<SkeletonGeneric />}><SystemView /></Suspense>}
          {view === 'sara-ai' && <Suspense fallback={<SkeletonGeneric />}><SaraAiView /></Suspense>}
          {view === 'alertas' && <Suspense fallback={<SkeletonGeneric />}><AlertasView /></Suspense>}
          {view === 'sla' && <Suspense fallback={<SkeletonGeneric />}><SlaView /></Suspense>}
          {view === 'config' && <Suspense fallback={<SkeletonGeneric />}><ConfigView /></Suspense>}
        </div>
      </div>

      {/* Modals */}
      {showNewAppointment && (
        <NewAppointmentModal
          newAppointment={newAppointment} setNewAppointment={setNewAppointment}
          leads={leads} properties={properties} team={team}
          saving={saving} setSaving={setSaving}
          onClose={() => { setShowNewAppointment(false); setNewAppointment({}) }}
          onSaved={loadData} showToast={showToast}
        />
      )}

      {editingAppointment && (
        <EditAppointmentModal
          appointment={editingAppointment} setAppointment={setEditingAppointment}
          team={team} properties={properties}
          saving={saving} setSaving={setSaving}
          onSaved={loadData} showToast={showToast}
        />
      )}

      {(editingProperty || showNewProperty) && (
        <PropertyModal property={editingProperty} onSave={saveProperty}
          onClose={() => { setEditingProperty(null); setShowNewProperty(false) }} />
      )}

      {editingLead && (
        <LeadModal lead={editingLead} properties={properties} team={team}
          onSave={saveLead} onClose={() => setEditingLead(null)} />
      )}

      {(editingMember || showNewMember) && (
        <MemberModal member={editingMember} onSave={saveMember}
          onClose={() => { setEditingMember(null); setShowNewMember(false) }} />
      )}

      {(editingMortgage || showNewMortgage) && (
        <MortgageModal mortgage={editingMortgage} leads={leads} properties={properties}
          asesores={team.filter(t => t.role === 'asesor')}
          onSave={saveMortgage} onClose={() => { setEditingMortgage(null); setShowNewMortgage(false) }} />
      )}

      {(editingCampaign || showNewCampaign) && (
        <CampaignModal campaign={editingCampaign} onSave={saveCampaign}
          onClose={() => { setEditingCampaign(null); setShowNewCampaign(false) }} />
      )}

      {(editingPromotion || showNewPromotion) && (
        <PromotionModal promotion={editingPromotion} onSave={savePromotion}
          onClose={() => { setEditingPromotion(null); setShowNewPromotion(false) }}
          leads={leads} properties={properties} />
      )}

      {(editingCrmEvent || showNewCrmEvent) && (
        <CrmEventModal event={editingCrmEvent} onSave={saveCrmEvent}
          onClose={() => { setEditingCrmEvent(null); setShowNewCrmEvent(false) }}
          leads={leads} properties={properties} />
      )}

      {showInviteEventModal && selectedEventForInvite && (
        <InviteEventModal event={selectedEventForInvite} onSend={sendEventInvitations}
          onClose={() => { setShowInviteEventModal(false); setSelectedEventForInvite(null) }}
          sending={inviteSending} />
      )}

      {showSendPromoModal && selectedPromoToSend && (
        <SendPromoModal promo={selectedPromoToSend} onSend={sendPromoReal}
          onClose={() => { setShowSendPromoModal(false); setSelectedPromoToSend(null) }}
          sending={promoSending} leads={leads} properties={properties} team={team} />
      )}

      {selectedLead && (
        <Suspense fallback={null}>
          <LeadDrawer
            lead={selectedLead} team={team} leads={leads} appointments={appointments}
            currentUser={currentUser}
            onClose={() => setSelectedLead(null)}
            onEdit={(lead) => setEditingLead(lead)}
            setLeads={setLeads} setSelectedLead={setSelectedLead}
            showToast={showToast}
            onScheduleAppointment={(sl) => {
              setSelectedLead(null)
              setNewAppointment({ lead_id: sl.id, lead_name: sl.name || '', lead_phone: sl.phone || '', property_name: sl.property_interest || '', scheduled_date: '', scheduled_time: '' })
              setShowNewAppointment(true)
            }}
          />
        </Suspense>
      )}

      {confirmModal && (
        <ConfirmModal title={confirmModal.title} message={confirmModal.message}
          onConfirm={confirmModal.onConfirm} onClose={() => setConfirmModal(null)} />
      )}

      {inputModal && (
        <InputModal title={inputModal.title} fields={inputModal.fields}
          onSubmit={inputModal.onSubmit} onClose={() => setInputModal(null)} />
      )}

      {/* Stacking toasts */}
      <div className="fixed bottom-6 right-6 z-[200] space-y-2 pointer-events-none">
        {toasts.map((t, i) => (
          <div key={t.id} className={`toast-enter pointer-events-auto px-5 py-3 rounded-xl shadow-2xl text-sm font-medium max-w-sm cursor-pointer ${
            t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
          }`} onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} style={{ opacity: 1 - (i * 0.1) }}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
