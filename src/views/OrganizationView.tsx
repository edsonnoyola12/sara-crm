import { useState, useMemo } from 'react'
import { useCrm } from '../context/CrmContext'
import type { Tenant, TenantMember } from '../types/crm'
import {
  Building2, Users, CreditCard, Settings, Crown, Trash2,
  Shield, Check, X, Mail, ChevronRight, AlertTriangle,
  Upload, Palette, Copy, ExternalLink, Zap, Database,
  MessageSquare, BarChart3, Globe, Headphones, Star
} from 'lucide-react'

type OrgTab = 'general' | 'miembros' | 'facturacion' | 'peligro'

const PLAN_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  free: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', label: 'Free' },
  starter: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', label: 'Starter' },
  pro: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', label: 'Pro' },
  enterprise: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Enterprise' },
}

const PLAN_DATA = [
  {
    key: 'free', name: 'Free', price: '$0', period: '/mes',
    features: ['5 usuarios', '100 leads', '500 MB storage', 'CRM basico', 'WhatsApp basico'],
    missing: ['Campos personalizados', 'Automatizaciones', 'API access', 'Soporte prioritario'],
  },
  {
    key: 'starter', name: 'Starter', price: '$29', period: '/mes',
    features: ['15 usuarios', '1,000 leads', '5 GB storage', 'CRM completo', 'WhatsApp avanzado', 'Campos personalizados', 'Reportes basicos'],
    missing: ['Automatizaciones', 'API access', 'Soporte prioritario'],
  },
  {
    key: 'pro', name: 'Pro', price: '$79', period: '/mes',
    features: ['50 usuarios', '10,000 leads', '25 GB storage', 'CRM completo', 'WhatsApp avanzado', 'Campos personalizados', 'Automatizaciones', 'Reportes avanzados', 'API access'],
    missing: ['Soporte prioritario'],
  },
  {
    key: 'enterprise', name: 'Enterprise', price: '$199', period: '/mes',
    features: ['Usuarios ilimitados', 'Leads ilimitados', '100 GB storage', 'CRM completo', 'WhatsApp avanzado', 'Campos personalizados', 'Automatizaciones', 'Reportes avanzados', 'API access', 'Soporte prioritario', 'SLA garantizado', 'Onboarding dedicado'],
    missing: [],
  },
]

const ROLE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  owner: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Owner' },
  admin: { bg: 'bg-purple-500/15', text: 'text-purple-400', label: 'Admin' },
  member: { bg: 'bg-slate-500/15', text: 'text-slate-400', label: 'Miembro' },
}

// Mock members for UI demo
const MOCK_MEMBERS: (TenantMember & { name: string; email: string })[] = [
  { id: '1', tenant_id: 'default', user_id: 'u1', role: 'owner', joined_at: '2024-01-15T00:00:00Z', name: 'Carlos Martinez', email: 'carlos@santarita.mx' },
  { id: '2', tenant_id: 'default', user_id: 'u2', role: 'admin', joined_at: '2024-03-10T00:00:00Z', name: 'Ana Lopez', email: 'ana@santarita.mx' },
  { id: '3', tenant_id: 'default', user_id: 'u3', role: 'member', joined_at: '2024-06-20T00:00:00Z', name: 'Roberto Sanchez', email: 'roberto@santarita.mx' },
]

const MOCK_INVITES = [
  { email: 'miguel@santarita.mx', role: 'member', sent_at: '2026-03-05T10:00:00Z' },
]

export default function OrganizationView() {
  const { currentTenant, setCurrentTenant, leads, team, showToast, setConfirmModal } = useCrm()
  const [activeTab, setActiveTab] = useState<OrgTab>('general')

  // Form state for General tab
  const tenant = currentTenant || {
    id: 'default', name: 'Mi Organizacion', slug: 'mi-org',
    plan: 'free' as const, max_users: 5, max_leads: 100,
    features: ['crm_basico', 'whatsapp'], created_at: new Date().toISOString(), active: true,
  }

  const [orgName, setOrgName] = useState(tenant.name)
  const [logoUrl, setLogoUrl] = useState(tenant.logo_url || '')
  const [primaryColor, setPrimaryColor] = useState(tenant.primary_color || '#6366f1')

  // Members tab state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')

  // Danger zone state
  const [transferEmail, setTransferEmail] = useState('')
  const [deleteConfirmName, setDeleteConfirmName] = useState('')

  const tabs: { key: OrgTab; label: string; icon: any }[] = [
    { key: 'general', label: 'General', icon: Settings },
    { key: 'miembros', label: 'Miembros', icon: Users },
    { key: 'facturacion', label: 'Facturacion', icon: CreditCard },
    { key: 'peligro', label: 'Peligro', icon: AlertTriangle },
  ]

  const planStyle = PLAN_STYLES[tenant.plan] || PLAN_STYLES.free
  const usedUsers = team.length
  const usedLeads = leads.length

  function handleSaveGeneral() {
    const updated: Tenant = {
      ...tenant,
      name: orgName,
      logo_url: logoUrl || undefined,
      primary_color: primaryColor,
    }
    setCurrentTenant(updated)
    showToast('Organizacion actualizada', 'success')
  }

  function handleInvite() {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      showToast('Ingresa un email valido', 'error')
      return
    }
    showToast(`Invitacion enviada a ${inviteEmail}`, 'success')
    setInviteEmail('')
  }

  function handleRemoveMember(member: typeof MOCK_MEMBERS[0]) {
    if (member.role === 'owner') {
      showToast('No puedes eliminar al owner', 'error')
      return
    }
    setConfirmModal({
      title: 'Eliminar miembro',
      message: `Estas seguro de eliminar a ${member.name} de la organizacion?`,
      onConfirm: () => {
        showToast(`${member.name} eliminado de la organizacion`, 'success')
        setConfirmModal(null)
      },
    })
  }

  function handleTransferOwnership() {
    if (!transferEmail.trim()) {
      showToast('Ingresa el email del nuevo owner', 'error')
      return
    }
    setConfirmModal({
      title: 'Transferir propiedad',
      message: `Estas seguro de transferir la propiedad a ${transferEmail}? Perderas el rol de owner.`,
      onConfirm: () => {
        showToast('Propiedad transferida', 'success')
        setTransferEmail('')
        setConfirmModal(null)
      },
    })
  }

  function handleDeleteOrg() {
    if (deleteConfirmName !== tenant.name) {
      showToast('Escribe el nombre exacto de la organizacion para confirmar', 'error')
      return
    }
    setConfirmModal({
      title: 'ELIMINAR ORGANIZACION',
      message: 'Esta accion es IRREVERSIBLE. Se eliminaran todos los datos, leads, propiedades, configuraciones y miembros.',
      onConfirm: () => {
        showToast('Organizacion eliminada', 'success')
        setDeleteConfirmName('')
        setConfirmModal(null)
      },
    })
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Building2 size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Organizacion</h1>
          <p className="text-sm text-slate-400">Configuracion y administracion de tu organizacion</p>
        </div>
        <div className="ml-auto">
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${planStyle.bg} ${planStyle.text} border ${planStyle.border}`}>
            {planStyle.label}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-900/50 p-1 rounded-xl border border-slate-800/60">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                isActive
                  ? tab.key === 'peligro'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-slate-800 text-white border border-slate-700/60 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="section-enter">
        {activeTab === 'general' && (
          <GeneralTab
            tenant={tenant}
            orgName={orgName}
            setOrgName={setOrgName}
            logoUrl={logoUrl}
            setLogoUrl={setLogoUrl}
            primaryColor={primaryColor}
            setPrimaryColor={setPrimaryColor}
            planStyle={planStyle}
            usedUsers={usedUsers}
            usedLeads={usedLeads}
            onSave={handleSaveGeneral}
          />
        )}
        {activeTab === 'miembros' && (
          <MiembrosTab
            members={MOCK_MEMBERS}
            invites={MOCK_INVITES}
            inviteEmail={inviteEmail}
            setInviteEmail={setInviteEmail}
            inviteRole={inviteRole}
            setInviteRole={setInviteRole}
            onInvite={handleInvite}
            onRemove={handleRemoveMember}
            showToast={showToast}
          />
        )}
        {activeTab === 'facturacion' && (
          <FacturacionTab tenant={tenant} usedUsers={usedUsers} usedLeads={usedLeads} showToast={showToast} />
        )}
        {activeTab === 'peligro' && (
          <PeligroTab
            tenant={tenant}
            transferEmail={transferEmail}
            setTransferEmail={setTransferEmail}
            deleteConfirmName={deleteConfirmName}
            setDeleteConfirmName={setDeleteConfirmName}
            onTransfer={handleTransferOwnership}
            onDelete={handleDeleteOrg}
          />
        )}
      </div>
    </div>
  )
}

// ---- General Tab ----
function GeneralTab({ tenant, orgName, setOrgName, logoUrl, setLogoUrl, primaryColor, setPrimaryColor, planStyle, usedUsers, usedLeads, onSave }: {
  tenant: Tenant
  orgName: string
  setOrgName: (v: string) => void
  logoUrl: string
  setLogoUrl: (v: string) => void
  primaryColor: string
  setPrimaryColor: (v: string) => void
  planStyle: { bg: string; text: string; border: string; label: string }
  usedUsers: number
  usedLeads: number
  onSave: () => void
}) {
  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Building2 size={16} className="text-indigo-400" /> Perfil de la organizacion
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo */}
          <div>
            <label className="text-xs text-slate-500 font-medium block mb-2">Logo</label>
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-700 overflow-hidden"
                style={{ backgroundColor: primaryColor + '20' }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Upload size={20} className="text-slate-600" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="URL del logo..."
                  className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/40 rounded-lg text-sm text-white placeholder-slate-600 focus:border-indigo-500/50 focus:outline-none"
                />
                <p className="text-[10px] text-slate-600 mt-1">URL de imagen (PNG, SVG recomendado)</p>
              </div>
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-xs text-slate-500 font-medium block mb-2">
              <Palette size={12} className="inline mr-1" /> Color principal
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-28 px-3 py-2 bg-slate-800/60 border border-slate-700/40 rounded-lg text-sm text-white font-mono focus:border-indigo-500/50 focus:outline-none"
              />
              <div className="w-24 h-10 rounded-lg" style={{ backgroundColor: primaryColor }} />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-slate-500 font-medium block mb-2">Nombre</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/40 rounded-lg text-sm text-white focus:border-indigo-500/50 focus:outline-none"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="text-xs text-slate-500 font-medium block mb-2">Slug (solo lectura)</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tenant.slug}
                readOnly
                className="w-full px-3 py-2 bg-slate-800/30 border border-slate-700/30 rounded-lg text-sm text-slate-500 cursor-not-allowed"
              />
              <button
                onClick={() => { navigator.clipboard.writeText(tenant.slug); }}
                className="p-2 text-slate-500 hover:text-white transition-colors"
                title="Copiar slug"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Guardar cambios
          </button>
        </div>
      </div>

      {/* Usage stats */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-emerald-400" /> Uso actual
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UsageBar label="Usuarios" current={usedUsers} max={tenant.max_users} icon={Users} color="blue" />
          <UsageBar label="Leads" current={usedLeads} max={tenant.max_leads} icon={Database} color="emerald" />
        </div>
      </div>

      {/* Plan features */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Crown size={16} className="text-amber-400" /> Plan actual
        </h3>
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${planStyle.bg} ${planStyle.text} border ${planStyle.border}`}>
            {planStyle.label}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {tenant.features.map((f) => (
            <span key={f} className="text-xs px-2.5 py-1 bg-slate-800/60 border border-slate-700/30 rounded-full text-slate-400">
              {f.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---- Usage Bar ----
function UsageBar({ label, current, max, icon: Icon, color }: {
  label: string; current: number; max: number; icon: any; color: string
}) {
  const pct = Math.min((current / max) * 100, 100)
  const isHigh = pct > 80
  const colorMap: Record<string, { bar: string; text: string }> = {
    blue: { bar: 'bg-blue-500', text: 'text-blue-400' },
    emerald: { bar: 'bg-emerald-500', text: 'text-emerald-400' },
    purple: { bar: 'bg-purple-500', text: 'text-purple-400' },
  }
  const c = colorMap[color] || colorMap.blue

  return (
    <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={14} className={c.text} />
          <span className="text-xs font-medium text-slate-300">{label}</span>
        </div>
        <span className={`text-xs font-semibold ${isHigh ? 'text-red-400' : 'text-slate-400'}`}>
          {current.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>
      <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isHigh ? 'bg-red-500' : c.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-slate-600 mt-1 text-right">{pct.toFixed(0)}% usado</p>
    </div>
  )
}

// ---- Miembros Tab ----
function MiembrosTab({ members, invites, inviteEmail, setInviteEmail, inviteRole, setInviteRole, onInvite, onRemove, showToast }: {
  members: (TenantMember & { name: string; email: string })[]
  invites: { email: string; role: string; sent_at: string }[]
  inviteEmail: string
  setInviteEmail: (v: string) => void
  inviteRole: 'admin' | 'member'
  setInviteRole: (v: 'admin' | 'member') => void
  onInvite: () => void
  onRemove: (member: any) => void
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
}) {
  return (
    <div className="space-y-6">
      {/* Invite */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Mail size={16} className="text-blue-400" /> Invitar miembro
        </h3>
        <div className="flex gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@ejemplo.com"
            className="flex-1 px-3 py-2 bg-slate-800/60 border border-slate-700/40 rounded-lg text-sm text-white placeholder-slate-600 focus:border-indigo-500/50 focus:outline-none"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
            className="px-3 py-2 bg-slate-800/60 border border-slate-700/40 rounded-lg text-sm text-white focus:border-indigo-500/50 focus:outline-none"
          >
            <option value="member">Miembro</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={onInvite}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Invitar
          </button>
        </div>
      </div>

      {/* Members list */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Users size={16} className="text-indigo-400" /> Miembros ({members.length})
        </h3>
        <div className="space-y-2">
          {members.map((m) => {
            const rs = ROLE_STYLES[m.role] || ROLE_STYLES.member
            return (
              <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700/30 hover:border-slate-600/40 transition-all">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-white text-sm font-semibold border border-slate-700/40">
                  {m.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">{m.name}</p>
                    {m.role === 'owner' && <Crown size={12} className="text-amber-400" />}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{m.email}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${rs.bg} ${rs.text}`}>
                  {rs.label}
                </span>
                <span className="text-[10px] text-slate-600 hidden sm:inline">
                  {new Date(m.joined_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                {m.role !== 'owner' && (
                  <div className="flex items-center gap-1">
                    <select
                      defaultValue={m.role}
                      onChange={(e) => showToast(`Rol cambiado a ${e.target.value}`, 'success')}
                      className="text-[10px] px-1.5 py-1 bg-slate-800 border border-slate-700/40 rounded text-slate-400 cursor-pointer"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Miembro</option>
                    </select>
                    <button
                      onClick={() => onRemove(m)}
                      className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Eliminar miembro"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Mail size={16} className="text-amber-400" /> Invitaciones pendientes ({invites.length})
          </h3>
          <div className="space-y-2">
            {invites.map((inv, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
                <Mail size={14} className="text-amber-400" />
                <div className="flex-1">
                  <p className="text-sm text-slate-300">{inv.email}</p>
                  <p className="text-[10px] text-slate-600">
                    Enviada {new Date(inv.sent_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Pendiente
                </span>
                <button className="p-1 text-slate-600 hover:text-red-400 transition-colors" title="Cancelar invitacion">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Facturacion Tab ----
function FacturacionTab({ tenant, usedUsers, usedLeads, showToast }: {
  tenant: Tenant; usedUsers: number; usedLeads: number
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
}) {
  const currentPlanData = PLAN_DATA.find((p) => p.key === tenant.plan) || PLAN_DATA[0]

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Crown size={16} className="text-amber-400" /> Plan actual
        </h3>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl font-bold text-white">{currentPlanData.price}</span>
              <span className="text-sm text-slate-500">{currentPlanData.period}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${PLAN_STYLES[tenant.plan].bg} ${PLAN_STYLES[tenant.plan].text}`}>
                {currentPlanData.name}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentPlanData.features.map((f) => (
                <span key={f} className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center gap-1">
                  <Check size={10} /> {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Usage */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-blue-400" /> Consumo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UsageBar label="Usuarios" current={usedUsers} max={tenant.max_users} icon={Users} color="blue" />
          <UsageBar label="Leads" current={usedLeads} max={tenant.max_leads} icon={Database} color="emerald" />
          <UsageBar label="Storage" current={12} max={500} icon={Database} color="purple" />
        </div>
      </div>

      {/* Plan comparison */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <CreditCard size={16} className="text-purple-400" /> Comparar planes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLAN_DATA.map((plan) => {
            const ps = PLAN_STYLES[plan.key]
            const isCurrent = plan.key === tenant.plan
            return (
              <div
                key={plan.key}
                className={`rounded-xl p-4 border transition-all ${
                  isCurrent
                    ? `${ps.bg} ${ps.border} border-2`
                    : 'bg-slate-800/40 border-slate-700/30 hover:border-slate-600/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-bold ${ps.text}`}>{plan.name}</span>
                  {isCurrent && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full font-medium">
                      Actual
                    </span>
                  )}
                </div>
                <div className="mb-4">
                  <span className="text-xl font-bold text-white">{plan.price}</span>
                  <span className="text-xs text-slate-500">{plan.period}</span>
                </div>
                <div className="space-y-1.5 mb-4">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                      <Check size={10} className="text-emerald-400 flex-shrink-0" /> {f}
                    </div>
                  ))}
                  {plan.missing.map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                      <X size={10} className="flex-shrink-0" /> {f}
                    </div>
                  ))}
                </div>
                {!isCurrent && (
                  <button
                    onClick={() => showToast('Contacta a ventas para cambiar de plan', 'info')}
                    className={`w-full py-2 rounded-lg text-xs font-medium transition-colors ${
                      ps.bg} ${ps.text} hover:opacity-80 border ${ps.border}`}
                  >
                    Cambiar plan
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---- Peligro Tab ----
function PeligroTab({ tenant, transferEmail, setTransferEmail, deleteConfirmName, setDeleteConfirmName, onTransfer, onDelete }: {
  tenant: Tenant
  transferEmail: string
  setTransferEmail: (v: string) => void
  deleteConfirmName: string
  setDeleteConfirmName: (v: string) => void
  onTransfer: () => void
  onDelete: () => void
}) {
  return (
    <div className="space-y-6">
      {/* Transfer ownership */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
          <Crown size={16} /> Transferir propiedad
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Transfiere la propiedad de esta organizacion a otro miembro. Perderas el rol de owner y no podras revertir esta accion.
        </p>
        <div className="flex gap-3">
          <input
            type="email"
            value={transferEmail}
            onChange={(e) => setTransferEmail(e.target.value)}
            placeholder="Email del nuevo owner..."
            className="flex-1 px-3 py-2 bg-slate-800/60 border border-red-500/20 rounded-lg text-sm text-white placeholder-slate-600 focus:border-red-500/50 focus:outline-none"
          />
          <button
            onClick={onTransfer}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded-lg border border-red-500/30 transition-colors"
          >
            Transferir
          </button>
        </div>
      </div>

      {/* Delete organization */}
      <div className="bg-red-500/5 border border-red-500/30 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
          <Trash2 size={16} /> Eliminar organizacion
        </h3>
        <p className="text-xs text-slate-500 mb-2">
          Esta accion es <span className="text-red-400 font-semibold">PERMANENTE E IRREVERSIBLE</span>. Se eliminaran todos los datos incluyendo:
        </p>
        <ul className="text-xs text-slate-500 mb-4 space-y-1 ml-4 list-disc">
          <li>Todos los leads y su historial</li>
          <li>Propiedades y configuraciones</li>
          <li>Miembros del equipo y permisos</li>
          <li>Hipotecas, campanas, eventos</li>
          <li>Conversaciones de WhatsApp</li>
        </ul>
        <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-800/60 mb-4">
          <p className="text-xs text-slate-400 mb-2">
            Escribe <span className="font-mono text-red-400 font-semibold">{tenant.name}</span> para confirmar:
          </p>
          <input
            type="text"
            value={deleteConfirmName}
            onChange={(e) => setDeleteConfirmName(e.target.value)}
            placeholder={tenant.name}
            className="w-full px-3 py-2 bg-slate-800/60 border border-red-500/20 rounded-lg text-sm text-white placeholder-slate-700 focus:border-red-500/50 focus:outline-none font-mono"
          />
        </div>
        <button
          onClick={onDelete}
          disabled={deleteConfirmName !== tenant.name}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            deleteConfirmName === tenant.name
              ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          <Trash2 size={14} /> Eliminar permanentemente
        </button>
      </div>
    </div>
  )
}
