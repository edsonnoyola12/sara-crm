import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, Users, Building, UserCheck, ArrowRight, Calendar, CheckSquare, BarChart3, Settings, LayoutDashboard, Home } from 'lucide-react'
import { useCrm } from '../context/CrmContext'
import { STATUS_LABELS } from '../types/crm'
import type { View } from '../types/crm'

interface NavItem {
  label: string
  view: View
  icon: string
}

interface ResultItem {
  type: 'lead' | 'property' | 'team' | 'nav'
  label: string
  sublabel: string
  view: View
  icon?: string
  leadId?: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', view: 'dashboard', icon: '📊' },
  { label: 'Leads', view: 'leads', icon: '👥' },
  { label: 'Propiedades', view: 'properties', icon: '🏢' },
  { label: 'Calendario', view: 'calendar', icon: '📅' },
  { label: 'Tareas', view: 'tasks', icon: '✅' },
  { label: 'Hipotecas', view: 'mortgage', icon: '🏦' },
  { label: 'Reportes', view: 'reportes', icon: '📈' },
  { label: 'Equipo', view: 'team', icon: '👤' },
  { label: 'Configuracion', view: 'config', icon: '⚙️' },
  { label: 'Marketing', view: 'marketing', icon: '📣' },
  { label: 'Promociones', view: 'promotions', icon: '🎯' },
  { label: 'Eventos', view: 'events', icon: '🎪' },
  { label: 'Seguimientos', view: 'followups', icon: '🔄' },
  { label: 'Coordinador', view: 'coordinator', icon: '🎛️' },
  { label: 'Inteligencia de Negocio', view: 'bi', icon: '🧠' },
  { label: 'SARA AI', view: 'sara-ai', icon: '🤖' },
  { label: 'WhatsApp Inbox', view: 'inbox', icon: '💬' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const { leads, properties, team, setView } = useCrm()

  // Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => {
          if (!prev) {
            setQuery('')
            setSelectedIndex(0)
          }
          return !prev
        })
      }
      if (e.key === 'Escape' && open) {
        e.stopPropagation()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return
    const items = listRef.current.querySelectorAll('[data-result-item]')
    const selected = items[selectedIndex]
    if (selected) selected.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const results = useMemo((): ResultItem[] => {
    if (!query.trim()) {
      return navItems.map(n => ({
        type: 'nav' as const,
        label: n.label,
        sublabel: 'Ir a ' + n.label,
        view: n.view,
        icon: n.icon,
      }))
    }
    const q = query.toLowerCase()
    const items: ResultItem[] = []

    // Leads
    const matchedLeads = leads.filter(l =>
      l.name?.toLowerCase().includes(q) || l.phone?.includes(q)
    ).slice(0, 5)
    matchedLeads.forEach(l => items.push({
      type: 'lead',
      label: l.name || l.phone || 'Sin nombre',
      sublabel: `${l.phone || ''} · ${STATUS_LABELS[l.status] || l.status}`,
      view: 'leads',
      leadId: l.id,
    }))

    // Properties
    const matchedProps = properties.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q)
    ).slice(0, 5)
    matchedProps.forEach(p => items.push({
      type: 'property',
      label: p.name,
      sublabel: `${p.city || ''} · $${(p.price || 0).toLocaleString()}`,
      view: 'properties',
    }))

    // Team
    const matchedTeam = team.filter(t =>
      t.name?.toLowerCase().includes(q) || t.phone?.includes(q)
    ).slice(0, 5)
    matchedTeam.forEach(t => items.push({
      type: 'team',
      label: t.name,
      sublabel: `${t.role} · ${t.phone || ''}`,
      view: 'team',
    }))

    // Nav
    const matchedNav = navItems.filter(n => n.label.toLowerCase().includes(q))
    matchedNav.forEach(n => items.push({
      type: 'nav',
      label: n.label,
      sublabel: 'Ir a ' + n.label,
      view: n.view,
      icon: n.icon,
    }))

    return items
  }, [query, leads, properties, team])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [results.length])

  const handleSelect = (item: ResultItem) => {
    setView(item.view)
    setOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    }
  }

  if (!open) return null

  const typeIcon = (type: string) => {
    switch (type) {
      case 'lead': return <Users size={14} className="text-blue-400" />
      case 'property': return <Building size={14} className="text-emerald-400" />
      case 'team': return <UserCheck size={14} className="text-purple-400" />
      default: return <ArrowRight size={14} className="text-slate-400" />
    }
  }

  // Group results by type for section headers
  const grouped: { type: string; label: string; items: (ResultItem & { globalIndex: number })[] }[] = []
  const typeLabels: Record<string, string> = { lead: 'Leads', property: 'Propiedades', team: 'Equipo', nav: 'Navegacion' }
  let globalIdx = 0
  const typeOrder = query.trim() ? ['lead', 'property', 'team', 'nav'] : ['nav']
  for (const t of typeOrder) {
    const items = results
      .map((r, i) => ({ ...r, globalIndex: i }))
      .filter(r => r.type === t)
    if (items.length > 0) {
      grouped.push({ type: t, label: typeLabels[t] || t, items })
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[20vh]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-[calc(100%-2rem)] max-w-lg bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <Search size={18} className="text-slate-500 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar leads, propiedades, equipo..."
            className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
          />
          <kbd className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto">
          {results.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-8">No se encontraron resultados</p>
          )}
          {grouped.map(group => (
            <div key={group.type} className="py-1">
              <p className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                {group.label}
              </p>
              {group.items.map(item => (
                <button
                  key={`${item.type}-${item.label}-${item.globalIndex}`}
                  data-result-item
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(item.globalIndex)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    item.globalIndex === selectedIndex
                      ? 'bg-blue-600/20 text-white'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon ? (
                    <span className="text-sm w-5 text-center flex-shrink-0">{item.icon}</span>
                  ) : (
                    <span className="w-5 flex items-center justify-center flex-shrink-0">{typeIcon(item.type)}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    <p className="text-xs text-slate-500 truncate">{item.sublabel}</p>
                  </div>
                  {item.globalIndex === selectedIndex && (
                    <ArrowRight size={14} className="text-slate-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Footer hints */}
        <div className="px-4 py-2 border-t border-slate-800 flex items-center gap-4 text-[10px] text-slate-600">
          <span>↑↓ navegar</span>
          <span>↵ seleccionar</span>
          <span>esc cerrar</span>
        </div>
      </div>
    </div>
  )
}
