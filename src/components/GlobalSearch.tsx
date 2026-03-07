import { useState, useRef, useEffect } from 'react'
import { Building, Calendar as CalendarIcon, Search, UserCheck, Users } from 'lucide-react'
import { Lead, Property, TeamMember, Appointment, STATUS_LABELS } from '../types/crm'
import type { View } from '../types/crm'

interface GlobalSearchProps {
  show: boolean
  onClose: () => void
  leads: Lead[]
  properties: Property[]
  team: TeamMember[]
  appointments: Appointment[]
  onSelectLead: (lead: Lead) => void
  setView: (v: View) => void
}

export default function GlobalSearch({ show, onClose, leads, properties, team, appointments, onSelectLead, setView }: GlobalSearchProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [globalSearch, setGlobalSearch] = useState('')

  useEffect(() => {
    if (show && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
    if (show) setGlobalSearch('')
  }, [show])

  if (!show) return null

  const results = (() => {
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
      appointments: appointments.filter(a =>
        a.lead_name?.toLowerCase().includes(q) ||
        a.property_name?.toLowerCase().includes(q)
      ).slice(0, 5)
    }
  })()
  const hasResults = results.leads.length + results.properties.length + results.team.length + results.appointments.length > 0

  const close = () => { onClose(); setGlobalSearch('') }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]" onClick={close}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
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

        <div className="max-h-[50vh] overflow-y-auto">
          {globalSearch.length < 2 && (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">Escribe al menos 2 caracteres para buscar</div>
          )}
          {globalSearch.length >= 2 && !hasResults && (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">No se encontraron resultados</div>
          )}
          {results.leads.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Leads</p>
              {results.leads.map(lead => (
                <button key={lead.id} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors text-left"
                  onClick={() => { onSelectLead(lead); close() }}>
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0"><Users size={14} className="text-blue-400" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{lead.name || 'Sin nombre'}</p>
                    <p className="text-xs text-slate-400 truncate">{lead.phone} · {STATUS_LABELS[lead.status] || lead.status}</p>
                  </div>
                  {lead.score > 0 && <span className="text-xs text-amber-400 font-medium">{lead.score}pts</span>}
                </button>
              ))}
            </div>
          )}
          {results.properties.length > 0 && (
            <div className="p-2 border-t border-slate-800">
              <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Propiedades</p>
              {results.properties.map(prop => (
                <button key={prop.id} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors text-left"
                  onClick={() => { setView('properties'); close() }}>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0"><Building size={14} className="text-emerald-400" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{prop.name}</p>
                    <p className="text-xs text-slate-400 truncate">{(prop as any).development_name || prop.city || ''} · ${(prop.price || 0).toLocaleString()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {results.team.length > 0 && (
            <div className="p-2 border-t border-slate-800">
              <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Equipo</p>
              {results.team.map(member => (
                <button key={member.id} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors text-left"
                  onClick={() => { setView('team'); close() }}>
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0"><UserCheck size={14} className="text-purple-400" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{member.name}</p>
                    <p className="text-xs text-slate-400 truncate">{member.role} · {member.phone}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {results.appointments.length > 0 && (
            <div className="p-2 border-t border-slate-800">
              <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Citas</p>
              {results.appointments.map(apt => (
                <button key={apt.id} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors text-left"
                  onClick={() => { setView('calendar'); close() }}>
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0"><CalendarIcon size={14} className="text-amber-400" /></div>
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
  )
}
