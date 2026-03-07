import { useState, useEffect } from 'react'
import { Phone, Edit, X, Calendar, MessageSquare, ArrowRight, DollarSign, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Lead, STATUS_LABELS, getScoreColor, getScoreLabel } from '../types/crm'

interface LeadActivity {
  id: string
  lead_id: string
  team_member_id: string
  activity_type: string
  notes: string
  created_at: string
  team_member_name?: string
}

interface LeadDrawerProps {
  lead: Lead
  team: any[]
  leads: Lead[]
  appointments: any[]
  currentUser: any
  onClose: () => void
  onEdit: (lead: Lead) => void
  setLeads: (leads: Lead[]) => void
  setSelectedLead: (lead: Lead | null) => void
  showToast: (msg: string, type: string) => void
  onScheduleAppointment: (lead: Lead) => void
}

export default function LeadDrawer({ lead, team, leads, appointments, currentUser, onClose, onEdit, setLeads, setSelectedLead, showToast, onScheduleAppointment }: LeadDrawerProps) {
  const [leadDetailTab, setLeadDetailTab] = useState<'resumen' | 'info' | 'timeline' | 'citas' | 'notas' | 'credito'>('resumen')
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'messages' | 'activities' | 'appointments' | 'notes'>('all')
  const [expandedMsgIndex, setExpandedMsgIndex] = useState<number | null>(null)
  const [leadActivities, setLeadActivities] = useState<LeadActivity[]>([])

  useEffect(() => {
    loadLeadActivities(lead.id)
  }, [lead.id])

  async function loadLeadActivities(leadId: string) {
    const { data } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    if (data) {
      const activitiesWithNames = data.map(activity => {
        const member = team.find(t => t.id === activity.team_member_id)
        return { ...activity, team_member_name: member?.name || 'Desconocido' }
      })
      setLeadActivities(activitiesWithNames)
    } else {
      setLeadActivities([])
    }
  }

  const selectedLead = lead

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex" onClick={onClose}>
      {/* Spacer — click to close */}
      <div className="flex-1 min-w-0" />
      {/* Drawer panel — slides in from right */}
      <div className="bg-slate-800 border-l border-slate-700/50 w-full max-w-6xl h-full flex flex-col animate-slide-in-right" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-700/50 shrink-0">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-lg font-bold shrink-0">
                {(selectedLead.name || '?')[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold">{selectedLead.name || 'Sin nombre'}</h3>
                <div className="flex items-center gap-3 text-sm text-slate-400 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1"><Phone size={13} />{selectedLead.phone}</span>
                  <span className={`${getScoreColor(selectedLead.score)} px-2 py-0.5 rounded text-xs`}>
                    {getScoreLabel(selectedLead.score)} ({selectedLead.score})
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-slate-700">{STATUS_LABELS[selectedLead.status] || selectedLead.status}</span>
                  {selectedLead.assigned_to && (
                    <span className="text-xs text-slate-500">{team.find(t => t.id === selectedLead.assigned_to)?.name || ''}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { onEdit(selectedLead); onClose(); }} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"><Edit size={16} /> Editar</button>
              <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X size={20} /></button>
            </div>
          </div>
          {/* Tab bar */}
          <div className="flex gap-1 overflow-x-auto">
            {([['resumen','Resumen'],['info','Info'],['timeline','Timeline'],['citas','Citas'],['notas','Notas'],['credito','Credito']] as [typeof leadDetailTab, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setLeadDetailTab(key)}
                className={`tab-indicator px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                  leadDetailTab === key ? 'tab-indicator-active text-blue-400 bg-slate-700/50' : 'text-slate-400 hover:text-slate-200'
                }`}>{label}</button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ===== RESUMEN TAB ===== */}
          {leadDetailTab === 'resumen' && (() => {
            const sl = selectedLead
            const notes = sl.notes || {} as any
            const statusScoreMap: Record<string,number> = { new: 0, contacted: 5, qualified: 10, scheduled: 15, visit_scheduled: 15, visited: 20, negotiation: 25, negotiating: 25, reserved: 28, closed: 30, sold: 30, delivered: 30 }
            const statusScore = statusScoreMap[sl.status] || 0
            const interactionScore = Math.min(20, (sl.conversation_history?.length || 0) * 2)
            const hotSignals = notes.historial_señales_calientes?.length || 0
            const signalScore = Math.min(25, hotSignals * 5)
            const daysSinceMsg = sl.last_message_at ? Math.floor((Date.now() - new Date(sl.last_message_at).getTime()) / 86400000) : 999
            const recencyScore = daysSinceMsg === 0 ? 15 : daysSinceMsg <= 1 ? 12 : daysSinceMsg <= 3 ? 8 : daysSinceMsg <= 7 ? 4 : 0
            const creditScore = sl.credit_status ? 10 : notes.monthly_income ? 5 : 0
            const userMsgs = sl.conversation_history?.filter((m: any) => m.role === 'user')?.length || 0
            const engagementScore = Math.min(10, userMsgs * 2)

            const factors = [
              { label: 'Status', value: statusScore, max: 30, color: 'bg-blue-500' },
              { label: 'Interaccion', value: interactionScore, max: 20, color: 'bg-green-500' },
              { label: 'Senales', value: signalScore, max: 25, color: 'bg-orange-500' },
              { label: 'Recencia', value: recencyScore, max: 15, color: 'bg-cyan-500' },
              { label: 'Credito', value: creditScore, max: 10, color: 'bg-purple-500' },
              { label: 'Engagement', value: engagementScore, max: 10, color: 'bg-pink-500' },
            ]
            const totalScore = sl.score || factors.reduce((s, f) => s + f.value, 0)

            const scoreColor = totalScore < 30 ? '#ef4444' : totalScore < 60 ? '#eab308' : totalScore < 80 ? '#22c55e' : '#3b82f6'
            const scoreLabel = totalScore < 30 ? 'FRIO' : totalScore < 60 ? 'TIBIO' : totalScore < 80 ? 'CALIENTE' : 'MUY CALIENTE'
            const circumference = 2 * Math.PI * 42
            const dashOffset = circumference - (circumference * Math.min(totalScore, 100) / 100)

            const JOURNEY = ['new','contacted','qualified','scheduled','visited','negotiation','reserved','closed','delivered']
            const JOURNEY_LABELS = ['Nuevo','Contactado','Cita','Visita','Negociacion','Reservado','Cerrado','Entregado']
            const currentIdx = Math.max(0, JOURNEY.indexOf(sl.status === 'visit_scheduled' ? 'scheduled' : sl.status === 'negotiating' ? 'negotiation' : sl.status === 'sold' ? 'closed' : sl.status))

            const daysActive = sl.created_at ? Math.max(0, Math.floor((Date.now() - new Date(sl.created_at).getTime()) / 86400000)) : 0
            const lastContact = sl.last_message_at ? (() => { const d = Math.floor((Date.now() - new Date(sl.last_message_at).getTime()) / 86400000); return d === 0 ? 'Hoy' : d === 1 ? 'Ayer' : `Hace ${d}d` })() : 'Sin contacto'
            const nextAction = sl.status === 'new' ? 'Contactar al lead - primer follow-up' :
              sl.status === 'contacted' ? 'Agendar visita a desarrollo' :
              sl.status === 'scheduled' || sl.status === 'visit_scheduled' ? 'Confirmar cita programada' :
              sl.status === 'visited' ? 'Enviar cotizacion personalizada' :
              sl.status === 'negotiation' || sl.status === 'negotiating' ? 'Cerrar venta - hacer seguimiento' :
              sl.status === 'reserved' ? 'Verificar documentacion y pagos' : 'Dar seguimiento'

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* LEFT COLUMN — Score + Quick Info */}
                <div className="space-y-5">
                  {/* Score Donut */}
                  <div className="bg-slate-700/40 rounded-xl p-5 flex flex-col items-center">
                    <svg width="120" height="120" viewBox="0 0 96 96" className="mb-2">
                      <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(51,65,85,0.5)" strokeWidth="6" />
                      <circle cx="48" cy="48" r="42" fill="none" stroke={scoreColor} strokeWidth="6"
                        strokeDasharray={circumference} strokeDashoffset={dashOffset}
                        strokeLinecap="round" className="score-ring" transform="rotate(-90 48 48)" />
                      <text x="48" y="44" textAnchor="middle" className="fill-white text-2xl font-bold" style={{fontSize:'24px'}}>{totalScore}</text>
                      <text x="48" y="58" textAnchor="middle" className="fill-slate-400" style={{fontSize:'7px',textTransform:'uppercase',letterSpacing:'0.05em'}}>{scoreLabel}</text>
                    </svg>
                    <p className="text-xs text-slate-500">Score general del lead</p>
                  </div>
                  {/* Quick Info */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Dias activo', value: `${daysActive}d` },
                      { label: 'Ultimo contacto', value: lastContact },
                      { label: 'Desarrollo', value: sl.property_interest || notes.desarrollos_interes?.[0] || 'No definido' },
                      { label: 'Recamaras', value: notes.recamaras || 'No definido' },
                      { label: 'Fuente', value: sl.source || 'No definida' },
                      { label: 'Vendedor', value: team.find(t => t.id === sl.assigned_to)?.name || 'Sin asignar' },
                    ].map((item, i) => (
                      <div key={i} className="bg-slate-700/30 rounded-xl p-3">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{item.label}</p>
                        <p className="text-sm font-medium mt-0.5 truncate">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Next Best Action */}
                  <div className="next-action-card rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                        <ArrowRight size={16} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold">Siguiente accion</p>
                        <p className="text-sm font-medium mt-0.5">{nextAction}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN — Factors + Journey */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Factor bars */}
                  <div className="bg-slate-700/40 rounded-xl p-5">
                    <h4 className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">Factores de Score</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                      {factors.map(f => (
                        <div key={f.label}>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-400">{f.label}</span>
                            <span className="text-slate-300 font-medium">{f.value}/{f.max}</span>
                          </div>
                          <div className="score-factor-bar">
                            <div className={`score-factor-fill ${f.color}`} style={{ width: `${(f.value / f.max) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                {/* Journey Progress */}
                <div className="bg-slate-700/40 rounded-xl p-5">
                  <h4 className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-4">Progreso en Funnel</h4>
                  <div className="relative flex items-center justify-between">
                    {/* Progress line */}
                    <div className="absolute top-3 left-4 right-4 h-0.5 bg-slate-600 rounded-full" />
                    <div className="absolute top-3 left-4 h-0.5 bg-blue-500 rounded-full transition-all" style={{ width: `${currentIdx > 0 ? (currentIdx / (JOURNEY.length - 1)) * (100 - 8) : 0}%` }} />
                    {JOURNEY_LABELS.map((label, i) => {
                      const isPast = i < currentIdx
                      const isCurrent = i === currentIdx
                      return (
                        <div key={i} className="relative flex flex-col items-center z-10" style={{ width: `${100 / JOURNEY_LABELS.length}%` }}>
                          <div className={`journey-dot w-6 h-6 rounded-full border-2 flex items-center justify-center text-[8px] font-bold ${
                            isCurrent ? 'journey-dot-current bg-blue-600 border-blue-400 text-white' :
                            isPast ? 'bg-blue-600/40 border-blue-500/60 text-blue-300' :
                            'bg-slate-700 border-slate-600 text-slate-500'
                          }`}>
                            {isPast ? '✓' : i + 1}
                          </div>
                          <span className={`text-[8px] mt-1.5 text-center leading-tight ${isCurrent ? 'text-blue-400 font-semibold' : isPast ? 'text-slate-400' : 'text-slate-600'}`}>{label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                </div>
              </div>
            )
          })()}

          {/* ===== INFO TAB ===== */}
          {leadDetailTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="bg-slate-700/40 rounded-xl p-4">
                    <h4 className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">Datos del Lead</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-400">Nombre</span><span className="font-medium">{selectedLead.name || 'Sin nombre'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Telefono</span><span className="font-medium">{selectedLead.phone}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Interes</span><span className="font-medium">{selectedLead.property_interest || 'No definido'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Fuente</span><span className="font-medium">{selectedLead.source || 'No definida'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Presupuesto</span><span className="font-medium">{selectedLead.budget ? `$${Number(selectedLead.budget).toLocaleString('es-MX')}` : 'No definido'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Creado</span><span className="font-medium">{selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span></div>
                    </div>
                  </div>
                  {selectedLead.status === 'fallen' && selectedLead.fallen_reason && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                      <h4 className="text-xs text-red-400 uppercase tracking-wider font-semibold mb-2">Motivo de Caida</h4>
                      <p className="text-sm text-red-300">{selectedLead.fallen_reason}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {selectedLead.notes?.vendor_feedback?.rating && (() => {
                    const vf = selectedLead.notes.vendor_feedback;
                    const emoji = vf.rating === 1 ? '🔥' : vf.rating === 2 ? '👍' : vf.rating === 3 ? '😐' : '❄️';
                    return (
                      <div className="bg-slate-700/40 rounded-xl p-4">
                        <h4 className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Post-visita</h4>
                        <p className="text-sm">{emoji} {vf.rating_text}</p>
                        {vf.vendedor_name && <p className="text-xs text-slate-500 mt-1">Por: {vf.vendedor_name}</p>}
                      </div>
                    );
                  })()}
                  {selectedLead.status === 'reserved' && selectedLead.notes?.apartado && (
                    <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 rounded-xl p-4">
                      <h4 className="text-xs text-emerald-400 uppercase tracking-wider font-semibold mb-3">Datos de Apartado</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-slate-400">Enganche:</span><span className="ml-2 font-semibold text-emerald-300">${selectedLead.notes.apartado.enganche?.toLocaleString('es-MX') || '0'}</span></div>
                        <div><span className="text-slate-400">Propiedad:</span><span className="ml-2 font-semibold">{selectedLead.notes.apartado.propiedad || selectedLead.property_interest || 'Por definir'}</span></div>
                        {selectedLead.notes.apartado.fecha_apartado && (
                          <div><span className="text-slate-400">Fecha:</span><span className="ml-2">{new Date(selectedLead.notes.apartado.fecha_apartado + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                        )}
                        {selectedLead.notes.apartado.fecha_pago && (
                          <div><span className="text-slate-400">Pago:</span><span className="ml-2 font-semibold text-yellow-300">{new Date(selectedLead.notes.apartado.fecha_pago + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                        )}
                      </div>
                      {selectedLead.notes.apartado.fecha_pago && (() => {
                        const hoy = new Date(); const fechaPago = new Date(selectedLead.notes.apartado.fecha_pago + 'T12:00:00');
                        const diasRestantes = Math.ceil((fechaPago.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                        return (<div className={`mt-3 p-2 rounded-lg text-center text-sm font-semibold ${diasRestantes < 0 ? 'bg-red-600/30 text-red-300' : diasRestantes <= 3 ? 'bg-orange-600/30 text-orange-300' : diasRestantes <= 7 ? 'bg-yellow-600/30 text-yellow-300' : 'bg-emerald-600/30 text-emerald-300'}`}>
                          {diasRestantes < 0 ? `Pago vencido hace ${Math.abs(diasRestantes)} dia(s)` : diasRestantes === 0 ? 'Hoy es el dia del pago' : `Faltan ${diasRestantes} dia(s) para el pago`}
                        </div>);
                      })()}
                    </div>
                  )}
                  {selectedLead.notes?.recamaras && (
                    <div className="bg-slate-700/40 rounded-xl p-4">
                      <h4 className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Preferencias</h4>
                      <div className="space-y-1 text-sm">
                        {selectedLead.notes.recamaras && <p><span className="text-slate-400">Recamaras:</span> <span className="font-medium">{selectedLead.notes.recamaras}</span></p>}
                        {selectedLead.notes.urgencia && <p><span className="text-slate-400">Urgencia:</span> <span className="font-medium">{selectedLead.notes.urgencia}</span></p>}
                        {selectedLead.notes.preferred_language && <p><span className="text-slate-400">Idioma:</span> <span className="font-medium">{selectedLead.notes.preferred_language === 'en' ? 'English' : 'Espanol'}</span></p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== TIMELINE TAB ===== */}
          {leadDetailTab === 'timeline' && (
            <div>
              <div className="flex gap-1 mb-3 flex-wrap">
                {([['all','Todo'],['messages','Mensajes'],['activities','Actividades'],['appointments','Citas'],['notes','Notas']] as const).map(([key, label]) => (
                  <button key={key} onClick={() => setTimelineFilter(key)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      timelineFilter === key ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'
                    }`}>{label}</button>
                ))}
              </div>
              <div className="bg-slate-700/50 rounded-xl max-h-[50vh] overflow-y-auto p-4">
                {(() => {
                  const entries: Array<{type: string, timestamp: string, data: any}> = []
                  if (selectedLead.conversation_history?.length) {
                    selectedLead.conversation_history.forEach((msg: any) => {
                      entries.push({ type: 'message', timestamp: msg.timestamp || selectedLead.created_at, data: { role: msg.role, content: msg.content, via_bridge: msg.via_bridge, vendedor_name: msg.vendedor_name } })
                    })
                  }
                  if (leadActivities?.length) {
                    leadActivities.forEach((act: LeadActivity) => {
                      entries.push({ type: 'activity', timestamp: act.created_at, data: { activity_type: act.activity_type, notes: act.notes, team_member: act.team_member_name } })
                    })
                  }
                  const leadAppts = appointments.filter((a: any) => a.lead_id === selectedLead.id)
                  leadAppts.forEach((apt: any) => {
                    entries.push({ type: 'appointment', timestamp: apt.created_at || `${apt.scheduled_date}T${apt.scheduled_time || '00:00'}`, data: { date: apt.scheduled_date, time: apt.scheduled_time, property: apt.property_name, status: apt.status } })
                  })
                  if (selectedLead.notes?.manual && Array.isArray(selectedLead.notes.manual)) {
                    selectedLead.notes.manual.forEach((note: any) => {
                      entries.push({ type: 'note', timestamp: note.timestamp || note.created_at || selectedLead.created_at, data: { text: note.text || note.content, author: note.author } })
                    })
                  }
                  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  const filtered = entries.filter(e => timelineFilter === 'all' ? true : e.type === (timelineFilter === 'messages' ? 'message' : timelineFilter))
                  if (filtered.length === 0) return <p className="text-slate-400 text-sm text-center py-4">Sin registros</p>
                  const timeAgo = (ts: string) => { const diff = Date.now() - new Date(ts).getTime(); const mins = Math.floor(diff / 60000); if (mins < 1) return 'ahora'; if (mins < 60) return `hace ${mins}m`; const hrs = Math.floor(mins / 60); if (hrs < 24) return `hace ${hrs}h`; const days = Math.floor(hrs / 24); if (days < 30) return `hace ${days}d`; return new Date(ts).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) }
                  const dotStyle = (e: typeof entries[0]) => { if (e.type === 'message') { if (e.data.role === 'user') return 'bg-blue-500'; if (e.data.role === 'vendedor') return 'bg-orange-500'; return 'bg-green-500'; } if (e.type === 'activity') return 'bg-purple-500'; if (e.type === 'appointment') return 'bg-cyan-500'; if (e.type === 'note') return 'bg-yellow-500'; return 'bg-slate-500'; }
                  const hotSignals: Array<{type:string,timestamp:string,data:any}> = []
                  const slNotes = selectedLead.notes || {} as any
                  if (slNotes.historial_señales_calientes?.length) {
                    slNotes.historial_señales_calientes.forEach((s: any) => {
                      hotSignals.push({ type: 'hot_signal', timestamp: s.timestamp || s.fecha || selectedLead.created_at, data: { text: s.señal || s.signal || s.texto || JSON.stringify(s), type: 'hot' } })
                    })
                  }
                  if (slNotes.historial_objeciones?.length) {
                    slNotes.historial_objeciones.forEach((o: any) => {
                      hotSignals.push({ type: 'objection', timestamp: o.timestamp || o.fecha || selectedLead.created_at, data: { text: o.objecion || o.objection || o.texto || JSON.stringify(o), type: 'objection' } })
                    })
                  }
                  const allEntries = [...filtered, ...hotSignals].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  return (
                    <div className="space-y-2">
                      {allEntries.map((entry, i) => {
                        if (entry.type === 'message') {
                          const isUser = entry.data.role === 'user'
                          const isBridge = entry.data.via_bridge
                          const content = entry.data.content || ''
                          const isLong = content.length > 200
                          const isExpanded = expandedMsgIndex === i
                          const displayContent = isLong && !isExpanded ? content.slice(0, 200) + '...' : content
                          return (
                            <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] px-4 py-2.5 ${isBridge ? 'chat-bubble-bridge' : isUser ? 'chat-bubble-user' : 'chat-bubble-sara'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[10px] font-semibold ${isUser ? 'text-blue-300' : isBridge ? 'text-orange-300' : 'text-green-300'}`}>
                                    {isUser ? 'Cliente' : isBridge ? (entry.data.vendedor_name || 'Bridge') : 'SARA'}
                                  </span>
                                  {isBridge && <span className="text-[9px] text-orange-400/60 bg-orange-500/10 px-1.5 rounded">bridge</span>}
                                </div>
                                <p className="text-sm text-slate-200 break-words leading-relaxed whitespace-pre-wrap">{displayContent}</p>
                                {isLong && (
                                  <button onClick={() => setExpandedMsgIndex(isExpanded ? null : i)} className="text-[11px] text-blue-400 hover:text-blue-300 mt-1">
                                    {isExpanded ? 'ver menos' : 'ver mas...'}
                                  </button>
                                )}
                                <p className="text-[10px] text-slate-500 mt-1">{timeAgo(entry.timestamp)}</p>
                              </div>
                            </div>
                          )
                        }
                        if (entry.type === 'hot_signal') {
                          return (
                            <div key={i} className="flex gap-3 items-start px-2 py-2 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                              <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-sm">🔥</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">Senal caliente</span>
                                <p className="text-sm text-orange-200/80 break-words mt-0.5">{entry.data.text}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{timeAgo(entry.timestamp)}</p>
                              </div>
                            </div>
                          )
                        }
                        if (entry.type === 'objection') {
                          return (
                            <div key={i} className="flex gap-3 items-start px-2 py-2 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                              <div className="w-7 h-7 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <AlertTriangle size={14} className="text-yellow-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-semibold text-yellow-400 uppercase tracking-wider">Objecion</span>
                                <p className="text-sm text-yellow-200/80 break-words mt-0.5">{entry.data.text}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{timeAgo(entry.timestamp)}</p>
                              </div>
                            </div>
                          )
                        }
                        return (
                          <div key={i} className="flex gap-3 items-start pl-0">
                            <div className={`timeline-dot ${dotStyle(entry)} mt-0.5`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[11px] text-slate-400">{timeAgo(entry.timestamp)}</span>
                                {entry.type === 'activity' && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">{({call:'Llamada',visit:'Visita',whatsapp:'WhatsApp',email:'Email',quote:'Cotizacion'} as Record<string,string>)[entry.data.activity_type] || entry.data.activity_type}</span>}
                                {entry.type === 'appointment' && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">Cita</span>}
                                {entry.type === 'note' && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300">Nota</span>}
                              </div>
                              {entry.type === 'activity' && <div><p className="text-sm text-slate-300">{entry.data.notes || 'Sin detalle'}</p><p className="text-[11px] text-slate-500">Por: {entry.data.team_member}</p></div>}
                              {entry.type === 'appointment' && <p className="text-sm text-slate-300">{entry.data.date} {entry.data.time && `a las ${entry.data.time}`}{entry.data.property && ` - ${entry.data.property}`}<span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${entry.data.status === 'completed' ? 'bg-green-600/30 text-green-300' : entry.data.status === 'cancelled' ? 'bg-red-600/30 text-red-300' : entry.data.status === 'no_show' ? 'bg-orange-600/30 text-orange-300' : 'bg-blue-600/30 text-blue-300'}`}>{entry.data.status}</span></p>}
                              {entry.type === 'note' && <div><p className="text-sm text-slate-300 break-words">{entry.data.text}</p>{entry.data.author && <p className="text-[11px] text-slate-500">Por: {entry.data.author}</p>}</div>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          {/* ===== CITAS TAB ===== */}
          {leadDetailTab === 'citas' && (
            <div className="space-y-3">
              {(() => {
                const leadAppts = appointments.filter((a: any) => a.lead_id === selectedLead.id).sort((a: any, b: any) => new Date(b.scheduled_date + 'T' + (b.scheduled_time || '00:00')).getTime() - new Date(a.scheduled_date + 'T' + (a.scheduled_time || '00:00')).getTime())
                if (leadAppts.length === 0) return (
                  <div className="text-center py-12 text-slate-400">
                    <Calendar size={40} className="mx-auto mb-3 opacity-40" />
                    <p>No hay citas registradas</p>
                  </div>
                )
                return leadAppts.map((apt: any) => {
                  const vendor = team.find(t => t.id === apt.team_member_id)
                  return (
                    <div key={apt.id} className="bg-slate-700/40 rounded-xl p-4 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-slate-600/50 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold leading-none">{apt.scheduled_date ? new Date(apt.scheduled_date + 'T12:00:00').getDate() : '-'}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{apt.scheduled_date ? new Date(apt.scheduled_date + 'T12:00:00').toLocaleDateString('es-MX', { month: 'short' }) : ''}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{apt.scheduled_time || 'Sin hora'}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${apt.status === 'completed' ? 'bg-green-600/30 text-green-300' : apt.status === 'cancelled' ? 'bg-red-600/30 text-red-300' : apt.status === 'no_show' ? 'bg-orange-600/30 text-orange-300' : 'bg-blue-600/30 text-blue-300'}`}>
                            {apt.status === 'completed' ? 'Completada' : apt.status === 'cancelled' ? 'Cancelada' : apt.status === 'no_show' ? 'No asistio' : apt.status === 'confirmed' ? 'Confirmada' : 'Programada'}
                          </span>
                        </div>
                        {apt.property_name && <p className="text-xs text-slate-400 mt-0.5">{apt.property_name}</p>}
                        {vendor && <p className="text-xs text-slate-500 mt-0.5">Con: {vendor.name}</p>}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          )}

          {/* ===== NOTAS TAB ===== */}
          {leadDetailTab === 'notas' && (
            <div className="space-y-4">
              {/* Add note form */}
              <div className="bg-slate-700/40 rounded-xl p-4">
                <textarea
                  id="lead-note-input"
                  placeholder="Escribe una nota..."
                  className="w-full p-3 bg-slate-600/50 rounded-xl text-sm resize-none h-20 placeholder:text-slate-500"
                />
                <div className="flex justify-end mt-2">
                  <button onClick={async () => {
                    const textarea = document.getElementById('lead-note-input') as HTMLTextAreaElement
                    const text = textarea?.value?.trim()
                    if (!text) return
                    const newNote = { text, author: currentUser?.name || 'CRM', timestamp: new Date().toISOString() }
                    const existingNotes = selectedLead.notes?.manual || []
                    const updatedNotes = { ...(selectedLead.notes || {}), manual: [...existingNotes, newNote] }
                    await supabase.from('leads').update({ notes: updatedNotes }).eq('id', selectedLead.id)
                    setSelectedLead({ ...selectedLead, notes: updatedNotes })
                    setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, notes: updatedNotes } : l))
                    textarea.value = ''
                    showToast('Nota guardada', 'success')
                  }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">Guardar nota</button>
                </div>
              </div>
              {/* Notes list */}
              {(() => {
                const notes = selectedLead.notes?.manual || []
                if (notes.length === 0) return <p className="text-slate-400 text-sm text-center py-8">Sin notas manuales</p>
                return [...notes].reverse().map((note: any, i: number) => (
                  <div key={i} className="bg-slate-700/40 rounded-xl p-4">
                    <p className="text-sm text-slate-300 break-words">{note.text || note.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      {note.author && <span>Por: {note.author}</span>}
                      {note.timestamp && <span>{new Date(note.timestamp).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                    </div>
                  </div>
                ))
              })()}
            </div>
          )}

          {/* ===== CREDITO TAB ===== */}
          {leadDetailTab === 'credito' && (
            <div className="space-y-4">
              {selectedLead.credit_status ? (
                <div className="bg-slate-700/40 rounded-xl p-4">
                  <h4 className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">Estado del Credito</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status</span>
                      <span className={`font-medium px-2 py-0.5 rounded text-xs ${selectedLead.credit_status === 'approved' ? 'bg-green-600/30 text-green-300' : selectedLead.credit_status === 'active' ? 'bg-yellow-600/30 text-yellow-300' : selectedLead.credit_status === 'rejected' ? 'bg-red-600/30 text-red-300' : 'bg-blue-600/30 text-blue-300'}`}>
                        {{ approved: 'Aprobado', active: 'En proceso', rejected: 'Rechazado', pending: 'Pendiente' }[selectedLead.credit_status] || selectedLead.credit_status}
                      </span>
                    </div>
                    {selectedLead.notes?.credit_bank && <div className="flex justify-between"><span className="text-slate-400">Banco</span><span className="font-medium">{selectedLead.notes.credit_bank}</span></div>}
                    {selectedLead.notes?.credit_amount && <div className="flex justify-between"><span className="text-slate-400">Monto</span><span className="font-medium">${Number(selectedLead.notes.credit_amount).toLocaleString('es-MX')}</span></div>}
                    {selectedLead.notes?.monthly_income && <div className="flex justify-between"><span className="text-slate-400">Ingreso mensual</span><span className="font-medium">${Number(selectedLead.notes.monthly_income).toLocaleString('es-MX')}</span></div>}
                    {selectedLead.notes?.vendedor_original_id && (
                      <div className="flex justify-between"><span className="text-slate-400">Vendedor original</span><span className="font-medium">{team.find(t => t.id === selectedLead.notes.vendedor_original_id)?.name || 'N/A'}</span></div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <DollarSign size={40} className="mx-auto mb-3 opacity-40" />
                  <p>Sin informacion de credito</p>
                  <p className="text-xs text-slate-500 mt-1">El lead no ha iniciado proceso de credito hipotecario</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== QUICK ACTIONS BAR ===== */}
        <div className="px-6 py-3 border-t border-slate-700/50 flex items-center gap-2 bg-slate-800/95">
          <a href={`https://wa.me/${selectedLead.phone?.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
            className="quick-action-btn flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-sm font-medium border border-green-600/30">
            <Phone size={15} /> WhatsApp
          </a>
          <button onClick={() => {
            onScheduleAppointment(selectedLead)
          }} className="quick-action-btn flex items-center gap-2 px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 rounded-lg text-sm font-medium border border-cyan-600/30">
            <Calendar size={15} /> Agendar Cita
          </button>
          <button onClick={() => setLeadDetailTab('notas')}
            className="quick-action-btn flex items-center gap-2 px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg text-sm font-medium border border-yellow-600/30">
            <MessageSquare size={15} /> Nota
          </button>
          <button onClick={async () => {
            const FUNNEL = ['new','contacted','qualified','scheduled','visited','negotiation','reserved','closed','delivered']
            const curStatus = selectedLead.status === 'visit_scheduled' ? 'scheduled' : selectedLead.status === 'negotiating' ? 'negotiation' : selectedLead.status === 'sold' ? 'closed' : selectedLead.status
            const idx = FUNNEL.indexOf(curStatus)
            if (idx < 0 || idx >= FUNNEL.length - 1) { showToast('Lead ya esta en el ultimo status', 'info'); return }
            const nextStatus = FUNNEL[idx + 1]
            const { error } = await supabase.from('leads').update({ status: nextStatus, status_changed_at: new Date().toISOString() }).eq('id', selectedLead.id)
            if (error) { showToast('Error al mover lead', 'error'); return }
            const updated = { ...selectedLead, status: nextStatus, status_changed_at: new Date().toISOString() }
            setSelectedLead(updated)
            setLeads(leads.map(l => l.id === selectedLead.id ? updated : l))
            showToast(`Lead movido a ${(STATUS_LABELS as any)[nextStatus] || nextStatus}`, 'success')
          }} className="quick-action-btn flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm font-medium border border-blue-600/30">
            <ArrowRight size={15} /> Avanzar Funnel
          </button>
        </div>
      </div>
    </div>
  )
}
