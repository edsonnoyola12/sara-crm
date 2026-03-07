import { useNavigate } from 'react-router-dom'
import { Award, AlertTriangle, BarChart3, Bell, Building, Building2, Calendar as CalendarIcon, CheckSquare, ChevronRight, Clock, CreditCard, Gift, Globe, Inbox, Lightbulb, LogOut, Megaphone, MessageSquare, Phone, Settings, Shield, Star, Tag, Target, TrendingUp, UserCheck, Users, Zap } from 'lucide-react'
import type { View, Tenant } from '../types/crm'
import type { Lead, MortgageApplication, Promotion, CRMEvent, TeamMember } from '../types/crm'
import OrganizationSwitcher from './OrganizationSwitcher'

interface SidebarProps {
  view: View
  setView: (v: View) => void
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  collapsedSections: Record<string, boolean>
  setCollapsedSections: (v: Record<string, boolean>) => void
  currentUser: TeamMember | null
  setCurrentUser: (u: TeamMember | null) => void
  permisos: {
    puedeVerSeccion: (s: string) => boolean
  }
  mortgages: MortgageApplication[]
  getDaysInStatus: (m: MortgageApplication) => number
  promotions: Promotion[]
  crmEvents: CRMEvent[]
  leads: Lead[]
  currentTenant?: Tenant | null
  onSwitchTenant?: (tenant: Tenant) => void
  onCreateOrg?: () => void
  onOpenSecurity?: () => void
  onLogout?: () => void
}

export default function Sidebar({
  view, setView, sidebarOpen, setSidebarOpen,
  collapsedSections, setCollapsedSections,
  currentUser, setCurrentUser,
  permisos, mortgages, getDaysInStatus,
  promotions, crmEvents, leads,
  currentTenant, onSwitchTenant, onCreateOrg,
  onOpenSecurity, onLogout
}: SidebarProps) {
  const routerNavigate = useNavigate()

  const toggleSection = (key: string) => {
    const next = { ...collapsedSections, [key]: !collapsedSections[key] }
    setCollapsedSections(next)
    localStorage.setItem('sidebar_collapsed', JSON.stringify(next))
  }

  const nav = (v: View) => {
    // Navigate via router (CrmContext syncs view state from URL automatically)
    routerNavigate(v === 'dashboard' ? '/' : '/' + v)
    setSidebarOpen(false)
  }

  const SectionHeader = ({ sectionKey, label, activeViews }: { sectionKey: string; label: string; activeViews: string[] }) => {
    const isOpen = !collapsedSections[sectionKey]
    const hasActive = activeViews.includes(view)
    return (
      <button onClick={() => toggleSection(sectionKey)} className={`sidebar-label cursor-pointer select-none flex items-center justify-between w-full ${hasActive ? 'text-slate-300' : ''}`}>
        <span>{label}</span>
        <ChevronRight size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
      </button>
    )
  }

  const NavItem = ({ viewKey, icon: Icon, label, badge }: { viewKey: View; icon: any; label: string; badge?: number }) => (
    <button onClick={() => nav(viewKey)} className={`sidebar-item ${view === viewKey ? 'sidebar-item-active' : 'text-slate-400'}`}>
      <Icon size={16} /> {label}
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto bg-red-500/20 text-red-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full badge-pulse">
          {badge}
        </span>
      )}
    </button>
  )

  return (
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

      {/* Organization Switcher */}
      <div className="mt-3">
        <OrganizationSwitcher
          currentTenant={currentTenant || null}
          onSwitch={(t) => onSwitchTenant?.(t)}
          onCreate={() => onCreateOrg?.()}
        />
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
                    if (newRole === 'agencia') routerNavigate('/marketing')
                    else if (newRole === 'asesor') routerNavigate('/mortgage')
                    else routerNavigate('/')
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
            <button onClick={() => onOpenSecurity?.()} className="text-xs p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Seguridad">
              <Shield size={14} />
            </button>
            <button onClick={() => onLogout?.()} className="text-xs p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Cerrar sesion">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto mt-2 space-y-0.5">
        {/* Principal */}
        <p className="sidebar-label" style={{cursor:'default'}}>Principal</p>
        {permisos.puedeVerSeccion('dashboard') && <NavItem viewKey="dashboard" icon={TrendingUp} label="Dashboard" />}
        {permisos.puedeVerSeccion('leads') && <NavItem viewKey="leads" icon={Users} label="Leads" />}
        {permisos.puedeVerSeccion('properties') && <NavItem viewKey="properties" icon={Building} label="Propiedades" />}

        {/* Ventas */}
        <SectionHeader sectionKey="ventas" label="Ventas" activeViews={['coordinator','calendar','followups','tasks','mortgage','promotions','events','workflows']} />
        <div className={`overflow-hidden transition-all duration-200 ${!collapsedSections['ventas'] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          {permisos.puedeVerSeccion('coordinator') && <NavItem viewKey="coordinator" icon={Phone} label="Coordinador" />}
          {permisos.puedeVerSeccion('calendar') && <NavItem viewKey="calendar" icon={CalendarIcon} label="Calendario" />}
          {permisos.puedeVerSeccion('followups') && <NavItem viewKey="followups" icon={Clock} label="Seguimientos" />}
          {permisos.puedeVerSeccion('tasks') && <NavItem viewKey="tasks" icon={CheckSquare} label="Tareas" />}
          {permisos.puedeVerSeccion('workflows') && <NavItem viewKey="workflows" icon={Zap} label="Automatizaciones" />}
          {permisos.puedeVerSeccion('mortgage') && (
            <button onClick={() => nav('mortgage')} className={`sidebar-item ${view === 'mortgage' ? 'sidebar-item-active' : 'text-slate-400'}`}>
              <CreditCard size={16} /> Hipotecas
              {mortgages.filter(m => getDaysInStatus(m) > 3 && !['approved', 'rejected', 'cancelled'].includes(m.status)).length > 0 && (
                <span className="ml-auto bg-red-500/20 text-red-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full badge-pulse">
                  {mortgages.filter(m => getDaysInStatus(m) > 3 && !['approved', 'rejected', 'cancelled'].includes(m.status)).length}
                </span>
              )}
            </button>
          )}
          {permisos.puedeVerSeccion('promotions') && (
            <button onClick={() => nav('promotions')} className={`sidebar-item ${view === 'promotions' ? 'sidebar-item-active' : 'text-slate-400'}`}>
              <Tag size={16} /> Promociones
              {promotions.filter(p => p.status === 'active').length > 0 && (
                <span className="ml-auto bg-purple-500/20 text-purple-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full badge-pulse">
                  {promotions.filter(p => p.status === 'active').length}
                </span>
              )}
            </button>
          )}
          {permisos.puedeVerSeccion('events') && (
            <button onClick={() => nav('events')} className={`sidebar-item ${view === 'events' ? 'sidebar-item-active' : 'text-slate-400'}`}>
              <CalendarIcon size={16} /> Eventos
              {crmEvents.filter(e => e.status === 'upcoming').length > 0 && (
                <span className="ml-auto bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full badge-pulse">
                  {crmEvents.filter(e => e.status === 'upcoming').length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Comunicacion */}
        <SectionHeader sectionKey="comunicacion" label="Comunicacion" activeViews={['mensajes','encuestas','referrals','inbox']} />
        <div className={`overflow-hidden transition-all duration-200 ${!collapsedSections['comunicacion'] ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
          {permisos.puedeVerSeccion('inbox') && <NavItem viewKey="inbox" icon={Inbox} label="WhatsApp Inbox" />}
          {permisos.puedeVerSeccion('mensajes') && <NavItem viewKey="mensajes" icon={MessageSquare} label="Mensajes" />}
          {permisos.puedeVerSeccion('encuestas') && <NavItem viewKey="encuestas" icon={Star} label="Encuestas" />}
          {permisos.puedeVerSeccion('referrals') && (
            <button onClick={() => nav('referrals')} className={`sidebar-item ${view === 'referrals' ? 'sidebar-item-active' : 'text-slate-400'}`}>
              <Gift size={16} /> Referidos
              {leads.filter(l => l.source === 'referral').length > 0 && (
                <span className="ml-auto bg-pink-500/20 text-pink-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                  {leads.filter(l => l.source === 'referral').length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Inteligencia */}
        <SectionHeader sectionKey="inteligencia" label="Inteligencia" activeViews={['reportes','bi','marketing','sara-ai','forecast','report-builder']} />
        <div className={`overflow-hidden transition-all duration-200 ${!collapsedSections['inteligencia'] ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
          {permisos.puedeVerSeccion('reportes') && <NavItem viewKey="reportes" icon={BarChart3} label="Reportes CEO" />}
          {permisos.puedeVerSeccion('forecast') && <NavItem viewKey="forecast" icon={TrendingUp} label="Forecast" />}
          {permisos.puedeVerSeccion('report-builder') && <NavItem viewKey="report-builder" icon={BarChart3} label="Report Builder" />}
          {permisos.puedeVerSeccion('bi') && <NavItem viewKey="bi" icon={Lightbulb} label="Inteligencia Comercial" />}
          {permisos.puedeVerSeccion('marketing') && <NavItem viewKey="marketing" icon={Megaphone} label="Marketing" />}
          {permisos.puedeVerSeccion('sistema') && <NavItem viewKey="sara-ai" icon={Lightbulb} label="SARA IA" />}
        </div>

        {/* Monitoreo */}
        <SectionHeader sectionKey="monitoreo" label="Monitoreo" activeViews={['alertas','sla']} />
        <div className={`overflow-hidden transition-all duration-200 ${!collapsedSections['monitoreo'] ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
          {permisos.puedeVerSeccion('sistema') && <NavItem viewKey="alertas" icon={Bell} label="Alertas" />}
          {permisos.puedeVerSeccion('sistema') && <NavItem viewKey="sla" icon={Award} label="SLA" />}
        </div>

        {/* Admin */}
        <SectionHeader sectionKey="admin" label="Admin" activeViews={['team','goals','sistema','config','approvals','api-webhooks','organization']} />
        <div className={`overflow-hidden transition-all duration-200 ${!collapsedSections['admin'] ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
          {permisos.puedeVerSeccion('team') && <NavItem viewKey="team" icon={UserCheck} label="Equipo" />}
          {permisos.puedeVerSeccion('goals') && <NavItem viewKey="goals" icon={Target} label="Metas" />}
          {permisos.puedeVerSeccion('sistema') && <NavItem viewKey="sistema" icon={AlertTriangle} label="Sistema" />}
          {permisos.puedeVerSeccion('config') && <NavItem viewKey="config" icon={Settings} label="Configuracion" />}
          {permisos.puedeVerSeccion('approvals') && <NavItem viewKey="approvals" icon={Shield} label="Aprobaciones" />}
          {permisos.puedeVerSeccion('api-webhooks') && <NavItem viewKey="api-webhooks" icon={Globe} label="API / Webhooks" />}
          {permisos.puedeVerSeccion('organization') && <NavItem viewKey="organization" icon={Building2} label="Organizacion" />}
        </div>
      </nav>
    </div>
  )
}
