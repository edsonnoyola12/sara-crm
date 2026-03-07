import { useState, useEffect, lazy, Suspense } from 'react'
import { useCrm } from './context/CrmContext'
import type { View } from './types/crm'
import type { Lead, Promotion, CRMEvent, Appointment } from './types/crm'
import { API_BASE, safeFetch } from './types/crm'
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
const WhatsAppInboxView = lazy(() => import('./views/WhatsAppInboxView'))
const ForecastView = lazy(() => import('./views/ForecastView'))
const LeadDrawer = lazy(() => import('./components/LeadDrawer'))

export default function App() {
  // All core state comes from CrmContext (loaded once, shared everywhere)
  const {
    leads, properties, team, mortgages, campaigns, appointments,
    promotions, crmEvents, eventRegistrations,
    currentUser, setCurrentUser, permisos,
    view, setView, loading,
    showToast, toasts, setToasts,
    loadData,
    saveProperty, saveLead, saveMember, saveMortgage, saveCampaign,
    savePromotion, saveCrmEvent,
    confirmModal, setConfirmModal, inputModal, setInputModal,
    getDaysInStatus, supabase,
    setLeads,
    unreadNotificationCount,
  } = useCrm()

  // UI-only state (not data)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('sidebar_collapsed') || '{}') } catch { return {} }
  })

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [editingProperty, setEditingProperty] = useState<any>(null)
  const [editingMember, setEditingMember] = useState<any>(null)
  const [editingMortgage, setEditingMortgage] = useState<any>(null)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<any>(null)
  const [showNewProperty, setShowNewProperty] = useState(false)
  const [showNewMember, setShowNewMember] = useState(false)
  const [showNewMortgage, setShowNewMortgage] = useState(false)
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [showNewAppointment, setShowNewAppointment] = useState(false)
  const [newAppointment, setNewAppointment] = useState<any>({})
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [showGlobalSearch, setShowGlobalSearch] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [editingCrmEvent, setEditingCrmEvent] = useState<CRMEvent | null>(null)
  const [showNewPromotion, setShowNewPromotion] = useState(false)
  const [showNewCrmEvent, setShowNewCrmEvent] = useState(false)
  const [showInviteEventModal, setShowInviteEventModal] = useState(false)
  const [selectedEventForInvite, setSelectedEventForInvite] = useState<CRMEvent | null>(null)
  const [inviteSending, setInviteSending] = useState(false)
  const [showSendPromoModal, setShowSendPromoModal] = useState(false)
  const [selectedPromoToSend, setSelectedPromoToSend] = useState<Promotion | null>(null)
  const [promoSending, setPromoSending] = useState(false)
  const [saving, setSaving] = useState(false)

  // Notification state
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false)

  // Login state
  const [loginPhone, setLoginPhone] = useState('')
  const [loginError, setLoginError] = useState('')

  // Auto-expand sidebar section
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

  // Esc closes modals
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInputModal(null); setConfirmModal(null); setEditingLead(null)
        setEditingProperty(null); setEditingMember(null); setEditingMortgage(null)
        setNotifDrawerOpen(false); setEditingCampaign(null); setEditingPromotion(null)
        setEditingCrmEvent(null); setEditingAppointment(null); setSelectedLead(null)
        setShowNewProperty(false); setShowNewMember(false); setShowNewMortgage(false)
        setShowNewCampaign(false); setShowNewAppointment(false); setShowNewPromotion(false)
        setShowNewCrmEvent(false); setShowInviteEventModal(false); setShowSendPromoModal(false)
        setShowGlobalSearch(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  // Block body scroll when modal open
  useEffect(() => {
    const anyModalOpen = !!(inputModal || confirmModal || editingLead || editingProperty || editingMember || editingMortgage || editingCampaign || editingPromotion || editingCrmEvent || editingAppointment || selectedLead || showNewProperty || showNewMember || showNewMortgage || showNewCampaign || showNewAppointment || showNewPromotion || showNewCrmEvent || showInviteEventModal)
    document.body.style.overflow = anyModalOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [inputModal, confirmModal, editingLead, editingProperty, editingMember, editingMortgage, editingCampaign, editingPromotion, editingCrmEvent, editingAppointment, selectedLead, showNewProperty, showNewMember, showNewMortgage, showNewCampaign, showNewAppointment, showNewPromotion, showNewCrmEvent, showInviteEventModal])

  // Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowGlobalSearch(prev => !prev) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function selectLead(lead: Lead) { setSelectedLead(lead) }

  // Save wrappers that close modals
  async function handleSaveProperty(prop: any) { await saveProperty(prop); setEditingProperty(null); setShowNewProperty(false) }
  async function handleSaveLead(lead: any) { await saveLead(lead); setEditingLead(null); setSelectedLead(null) }
  async function handleSaveMember(member: any) { await saveMember(member); setEditingMember(null); setShowNewMember(false) }
  async function handleSaveMortgage(mortgage: any) { await saveMortgage(mortgage); setEditingMortgage(null); setShowNewMortgage(false) }
  async function handleSaveCampaign(campaign: any) { await saveCampaign(campaign); setEditingCampaign(null); setShowNewCampaign(false) }
  async function handleSavePromotion(promo: any) { await savePromotion(promo); setEditingPromotion(null); setShowNewPromotion(false) }
  async function handleSaveCrmEvent(event: any) { await saveCrmEvent(event); setEditingCrmEvent(null); setShowNewCrmEvent(false) }

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

  async function sendPromoReal(segment: string, options: { sendImage: boolean, sendVideo: boolean, sendPdf: boolean, filters?: any }) {
    if (!selectedPromoToSend) return
    setPromoSending(true)
    try {
      const result = await safeFetch(`${API_BASE}/api/promotions/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promotion_id: selectedPromoToSend.id, segment, segment_type: options.filters?.segmentType || 'basic', send_image: options.sendImage, send_video: options.sendVideo, send_pdf: options.sendPdf })
      })
      if (result.success) { showToast(`Promocion enviada! Enviados: ${result.sent} | Errores: ${result.errors} | Total: ${result.total}`, 'success'); loadData() }
      else showToast('Error: ' + (result.error || 'Error desconocido'), 'error')
    } catch (err: any) { showToast('Error de conexion: ' + err.message, 'error') }
    finally { setPromoSending(false); setShowSendPromoModal(false); setSelectedPromoToSend(null) }
  }

  const handleLogin = async () => {
    const cleanPhone = loginPhone.replace(/\D/g, '').slice(-10)
    if (cleanPhone.length !== 10) { setLoginError('Ingresa un numero de 10 digitos'); return }
    const user = team.find(m => m.phone?.replace(/\D/g, '').slice(-10) === cleanPhone)
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
      {sidebarOpen && <div className="fixed inset-0 sidebar-backdrop z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-slate-800 rounded-lg">
        {sidebarOpen ? '✕' : '☰'}
      </button>

      <Sidebar
        view={view} setView={setView} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
        collapsedSections={collapsedSections} setCollapsedSections={setCollapsedSections}
        currentUser={currentUser} setCurrentUser={setCurrentUser} permisos={permisos}
        mortgages={mortgages} getDaysInStatus={getDaysInStatus}
        promotions={promotions} crmEvents={crmEvents} leads={leads}
      />

      <div className="flex-1 p-4 pt-16 lg:p-8 lg:pt-8 overflow-auto">
        {/* Desktop header */}
        <div className="fixed top-4 right-4 z-30 hidden lg:flex items-center gap-2">
          <button onClick={() => setNotifDrawerOpen(true)} className="relative p-2 bg-slate-800/80 border border-slate-700/60 rounded-lg text-slate-400 hover:bg-slate-700/80 hover:text-white transition-all backdrop-blur-sm">
            <Bell size={15} />
            {unreadNotificationCount > 0 && <span className="notif-badge absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</span>}
          </button>
          <button onClick={() => setShowGlobalSearch(true)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg text-slate-400 text-sm hover:bg-slate-700/80 hover:text-white transition-all backdrop-blur-sm">
            <Search size={14} /><span>Buscar...</span><kbd className="ml-2 px-1.5 py-0.5 text-[10px] bg-slate-700 rounded border border-slate-600">⌘K</kbd>
          </button>
        </div>
        {/* Mobile header */}
        <div className="fixed top-4 right-4 z-30 lg:hidden flex items-center gap-2">
          <button onClick={() => setNotifDrawerOpen(true)} className="relative p-2 bg-slate-800 rounded-lg">
            <Bell size={16} className="text-slate-400" />
            {unreadNotificationCount > 0 && <span className="notif-badge absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</span>}
          </button>
          <button onClick={() => setShowGlobalSearch(true)} className="p-2 bg-slate-800 rounded-lg"><Search size={16} className="text-slate-400" /></button>
        </div>

        <NotificationDrawer open={notifDrawerOpen} onClose={() => setNotifDrawerOpen(false)}
          onSelectLead={(leadId) => {
            const lead = leads.find(l => l.id === leadId)
            if (lead) selectLead(lead)
          }} />

        <GlobalSearch show={showGlobalSearch} onClose={() => setShowGlobalSearch(false)}
          leads={leads} properties={properties} team={team} appointments={appointments}
          onSelectLead={lead => setSelectedLead(lead)} setView={setView} />

        {/* Views */}
        <div key={view} className="section-enter">
          {view === 'dashboard' && (loading ? <SkeletonDashboard /> : <Suspense fallback={<SkeletonGeneric />}><DashboardView /></Suspense>)}
          {view === 'leads' && (loading ? <SkeletonTable /> : <Suspense fallback={<SkeletonTable />}><LeadsView onSelectLead={selectLead} /></Suspense>)}
          {view === 'properties' && (loading ? <SkeletonCards /> : <Suspense fallback={<SkeletonGeneric />}><PropertiesView /></Suspense>)}
          {view === 'team' && (loading ? <SkeletonCards /> : <Suspense fallback={<SkeletonGeneric />}><TeamView /></Suspense>)}
          {view === 'mortgage' && <Suspense fallback={<SkeletonGeneric />}><MortgageView /></Suspense>}
          {view === 'marketing' && <Suspense fallback={<SkeletonGeneric />}><MarketingView /></Suspense>}
          {view === 'promotions' && <Suspense fallback={<SkeletonGeneric />}><PromotionsView /></Suspense>}
          {view === 'events' && <Suspense fallback={<SkeletonGeneric />}><EventsView /></Suspense>}
          {view === 'calendar' && (loading ? <SkeletonCalendar /> : <Suspense fallback={<SkeletonGeneric />}><CalendarView /></Suspense>)}
          {view === 'goals' && <Suspense fallback={<SkeletonGeneric />}><GoalsView /></Suspense>}
          {view === 'followups' && <Suspense fallback={<SkeletonGeneric />}><FollowupsView supabase={supabase} /></Suspense>}
          {view === 'reportes' && <Suspense fallback={<SkeletonGeneric />}><ReportesCEOView /></Suspense>}
          {view === 'encuestas' && (
            <Suspense fallback={<SkeletonGeneric />}>
              <EncuestasEventosView leads={leads} crmEvents={crmEvents} eventRegistrations={eventRegistrations}
                properties={properties} teamMembers={team}
                onSendSurvey={async (config) => {
                  try {
                    const result = await safeFetch(`${API_BASE}/api/send-surveys`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ template: config.template, leads: config.leads, message: config.message, targetType: config.targetType })
                    })
                    if (result.ok) showToast(`Encuesta "${config.template.name}" enviada a ${result.enviados} ${config.targetType === 'vendedores' ? 'vendedores' : 'leads'}.${result.errores > 0 ? ` ${result.errores} errores.` : ''}`, 'success')
                    else throw new Error(result.error || 'Error desconocido')
                  } catch (error) { showToast('Error al enviar encuestas.', 'error') }
                }}
                showToast={showToast} />
            </Suspense>
          )}
          {view === 'bi' && <Suspense fallback={<SkeletonGeneric />}><BusinessIntelligenceView leads={leads} team={team} appointments={appointments} properties={properties} showToast={showToast} /></Suspense>}
          {view === 'mensajes' && <Suspense fallback={<SkeletonGeneric />}><MessageMetricsView /></Suspense>}
          {view === 'referrals' && <Suspense fallback={<SkeletonGeneric />}><ReferralsView /></Suspense>}
          {view === 'coordinator' && <Suspense fallback={<SkeletonGeneric />}><CoordinatorView /></Suspense>}
          {view === 'sistema' && <Suspense fallback={<SkeletonGeneric />}><SystemView /></Suspense>}
          {view === 'sara-ai' && <Suspense fallback={<SkeletonGeneric />}><SaraAiView /></Suspense>}
          {view === 'alertas' && <Suspense fallback={<SkeletonGeneric />}><AlertasView /></Suspense>}
          {view === 'sla' && <Suspense fallback={<SkeletonGeneric />}><SlaView /></Suspense>}
          {view === 'config' && <Suspense fallback={<SkeletonGeneric />}><ConfigView /></Suspense>}
          {view === 'inbox' && <Suspense fallback={<SkeletonGeneric />}><WhatsAppInboxView /></Suspense>}
          {view === 'forecast' && <Suspense fallback={<SkeletonGeneric />}><ForecastView /></Suspense>}
        </div>
      </div>

      {/* Modals */}
      {showNewAppointment && <NewAppointmentModal newAppointment={newAppointment} setNewAppointment={setNewAppointment} leads={leads} properties={properties} team={team} saving={saving} setSaving={setSaving} onClose={() => { setShowNewAppointment(false); setNewAppointment({}) }} onSaved={loadData} showToast={showToast} />}
      {editingAppointment && <EditAppointmentModal appointment={editingAppointment} setAppointment={setEditingAppointment} team={team} properties={properties} saving={saving} setSaving={setSaving} onSaved={loadData} showToast={showToast} />}
      {(editingProperty || showNewProperty) && <PropertyModal property={editingProperty} onSave={handleSaveProperty} onClose={() => { setEditingProperty(null); setShowNewProperty(false) }} />}
      {editingLead && <LeadModal lead={editingLead} properties={properties} team={team} onSave={handleSaveLead} onClose={() => setEditingLead(null)} />}
      {(editingMember || showNewMember) && <MemberModal member={editingMember} onSave={handleSaveMember} onClose={() => { setEditingMember(null); setShowNewMember(false) }} />}
      {(editingMortgage || showNewMortgage) && <MortgageModal mortgage={editingMortgage} leads={leads} properties={properties} asesores={team.filter(t => t.role === 'asesor')} onSave={handleSaveMortgage} onClose={() => { setEditingMortgage(null); setShowNewMortgage(false) }} />}
      {(editingCampaign || showNewCampaign) && <CampaignModal campaign={editingCampaign} onSave={handleSaveCampaign} onClose={() => { setEditingCampaign(null); setShowNewCampaign(false) }} />}
      {(editingPromotion || showNewPromotion) && <PromotionModal promotion={editingPromotion} onSave={handleSavePromotion} onClose={() => { setEditingPromotion(null); setShowNewPromotion(false) }} leads={leads} properties={properties} />}
      {(editingCrmEvent || showNewCrmEvent) && <CrmEventModal event={editingCrmEvent} onSave={handleSaveCrmEvent} onClose={() => { setEditingCrmEvent(null); setShowNewCrmEvent(false) }} leads={leads} properties={properties} />}
      {showInviteEventModal && selectedEventForInvite && <InviteEventModal event={selectedEventForInvite} onSend={sendEventInvitations} onClose={() => { setShowInviteEventModal(false); setSelectedEventForInvite(null) }} sending={inviteSending} />}
      {showSendPromoModal && selectedPromoToSend && <SendPromoModal promo={selectedPromoToSend} onSend={sendPromoReal} onClose={() => { setShowSendPromoModal(false); setSelectedPromoToSend(null) }} sending={promoSending} leads={leads} properties={properties} team={team} />}

      {selectedLead && (
        <Suspense fallback={null}>
          <LeadDrawer lead={selectedLead} team={team} leads={leads} appointments={appointments} currentUser={currentUser}
            onClose={() => setSelectedLead(null)} onEdit={lead => setEditingLead(lead)}
            setLeads={setLeads} setSelectedLead={setSelectedLead} showToast={showToast}
            onScheduleAppointment={(sl) => {
              setSelectedLead(null)
              setNewAppointment({ lead_id: sl.id, lead_name: sl.name || '', lead_phone: sl.phone || '', property_name: sl.property_interest || '', scheduled_date: '', scheduled_time: '' })
              setShowNewAppointment(true)
            }} />
        </Suspense>
      )}

      {confirmModal && <ConfirmModal title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onClose={() => setConfirmModal(null)} />}
      {inputModal && <InputModal title={inputModal.title} fields={inputModal.fields} onSubmit={inputModal.onSubmit} onClose={() => setInputModal(null)} />}

      <div className="fixed bottom-6 right-6 z-[200] space-y-2 pointer-events-none">
        {toasts.map((t, i) => (
          <div key={t.id} className={`toast-enter pointer-events-auto px-5 py-3 rounded-xl shadow-2xl text-sm font-medium max-w-sm cursor-pointer ${t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} style={{ opacity: 1 - (i * 0.1) }}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
