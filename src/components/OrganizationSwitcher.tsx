import { useState, useRef, useEffect } from 'react'
import { Building2, Check, ChevronDown, Plus, Users, Crown } from 'lucide-react'
import type { Tenant } from '../types/crm'

interface OrganizationSwitcherProps {
  currentTenant: Tenant | null
  onSwitch: (tenant: Tenant) => void
  onCreate: () => void
}

const PLAN_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  free: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Free' },
  starter: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Starter' },
  pro: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Pro' },
  enterprise: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Enterprise' },
}

// Default tenant when none exists yet
const DEFAULT_TENANT: Tenant = {
  id: 'default',
  name: 'Mi Organizacion',
  slug: 'mi-org',
  plan: 'free',
  max_users: 5,
  max_leads: 100,
  features: ['crm_basico', 'whatsapp'],
  created_at: new Date().toISOString(),
  active: true,
}

export default function OrganizationSwitcher({ currentTenant, onSwitch, onCreate }: OrganizationSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const ref = useRef<HTMLDivElement>(null)

  const activeTenant = currentTenant || DEFAULT_TENANT

  // Load tenants from supabase (or use defaults for now)
  useEffect(() => {
    // For now, show at least the current/default tenant
    // Once multi-tenant backend is fully wired, this will query tenant_members -> tenants
    const stored = currentTenant ? [currentTenant] : [DEFAULT_TENANT]
    setTenants(stored)
  }, [currentTenant])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const planStyle = PLAN_STYLES[activeTenant.plan] || PLAN_STYLES.free

  return (
    <div ref={ref} className="relative mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40 hover:bg-slate-800 hover:border-slate-600/60 transition-all group"
      >
        {activeTenant.logo_url ? (
          <img src={activeTenant.logo_url} alt="" className="w-7 h-7 rounded-md object-cover flex-shrink-0" />
        ) : (
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
            style={{ backgroundColor: activeTenant.primary_color || '#6366f1' }}
          >
            {activeTenant.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-medium text-slate-200 truncate">{activeTenant.name}</p>
          <span className={`text-[9px] font-semibold uppercase tracking-wider ${planStyle.text}`}>
            {planStyle.label}
          </span>
        </div>
        <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700/60 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-800">
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider px-2 py-1">Organizaciones</p>
          </div>
          <div className="max-h-48 overflow-y-auto p-1.5">
            {tenants.map((t) => {
              const ps = PLAN_STYLES[t.plan] || PLAN_STYLES.free
              const isActive = t.id === activeTenant.id
              return (
                <button
                  key={t.id}
                  onClick={() => { onSwitch(t); setOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all ${
                    isActive ? 'bg-slate-800 border border-slate-700/60' : 'hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  {t.logo_url ? (
                    <img src={t.logo_url} alt="" className="w-6 h-6 rounded-md object-cover flex-shrink-0" />
                  ) : (
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold"
                      style={{ backgroundColor: t.primary_color || '#6366f1' }}
                    >
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs text-slate-200 truncate">{t.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${ps.bg} ${ps.text}`}>
                        {ps.label}
                      </span>
                      <span className="text-[9px] text-slate-500 flex items-center gap-0.5">
                        <Users size={8} /> {t.max_users}
                      </span>
                    </div>
                  </div>
                  {isActive && <Check size={14} className="text-emerald-400 flex-shrink-0" />}
                </button>
              )
            })}
          </div>
          <div className="p-2 border-t border-slate-800">
            <button
              onClick={() => { onCreate(); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all"
            >
              <Plus size={14} /> Crear organizacion
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
