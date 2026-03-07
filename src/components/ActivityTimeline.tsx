import { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare, Phone, ArrowRightLeft, Calendar, StickyNote, Cpu,
  MessageCircle, PhoneIncoming, Send, ChevronDown
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { STATUS_LABELS } from '../types/crm'

interface TimelineEntry {
  id: string
  type: 'message_sent' | 'message_received' | 'call' | 'status_change' | 'appointment_scheduled' | 'appointment_completed' | 'note_added' | 'system_event'
  title: string
  description: string
  timestamp: string
  teamMemberName?: string
}

interface ActivityTimelineProps {
  leadId: string
  lead: any
  team: any[]
  appointments: any[]
  currentUser: any
  showToast: (msg: string, type: string) => void
  onActivityAdded?: () => void
}

const PAGE_SIZE = 20

const ICON_MAP: Record<string, { icon: any; bg: string; text: string }> = {
  message_sent:           { icon: Send,            bg: 'bg-blue-500/20',   text: 'text-blue-400' },
  message_received:       { icon: MessageCircle,   bg: 'bg-blue-500/20',   text: 'text-blue-400' },
  call:                   { icon: Phone,           bg: 'bg-green-500/20',  text: 'text-green-400' },
  status_change:          { icon: ArrowRightLeft,  bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  appointment_scheduled:  { icon: Calendar,        bg: 'bg-purple-500/20', text: 'text-purple-400' },
  appointment_completed:  { icon: Calendar,        bg: 'bg-purple-500/20', text: 'text-purple-400' },
  note_added:             { icon: StickyNote,      bg: 'bg-gray-500/20',   text: 'text-gray-400' },
  system_event:           { icon: Cpu,             bg: 'bg-slate-500/20',  text: 'text-slate-400' },
}

const BORDER_COLOR_MAP: Record<string, string> = {
  message_sent:          'border-blue-500/40',
  message_received:      'border-blue-500/40',
  call:                  'border-green-500/40',
  status_change:         'border-yellow-500/40',
  appointment_scheduled: 'border-purple-500/40',
  appointment_completed: 'border-purple-500/40',
  note_added:            'border-gray-500/40',
  system_event:          'border-slate-500/40',
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `hace ${days} dias`
  return new Date(ts).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ActivityTimeline({ leadId, lead, team, appointments, currentUser, showToast, onActivityAdded }: ActivityTimelineProps) {
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [noteText, setNoteText] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const buildTimeline = useCallback(async () => {
    setLoading(true)
    const allEntries: TimelineEntry[] = []

    // 1. Fetch lead_activities from Supabase
    const { data: activities } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    if (activities) {
      activities.forEach((act: any) => {
        const member = team.find(t => t.id === act.team_member_id)
        const actType = act.activity_type || 'system_event'
        allEntries.push({
          id: `act-${act.id}`,
          type: actType as TimelineEntry['type'],
          title: activityTypeLabel(actType),
          description: act.notes || '',
          timestamp: act.created_at,
          teamMemberName: member?.name || undefined,
        })
      })
    }

    // 2. Conversation history entries
    if (lead.conversation_history?.length) {
      lead.conversation_history.forEach((msg: any, idx: number) => {
        const isUser = msg.role === 'user'
        const isBridge = msg.via_bridge
        const ts = msg.timestamp || lead.created_at
        allEntries.push({
          id: `msg-${idx}`,
          type: isUser ? 'message_received' : 'message_sent',
          title: isUser ? 'Mensaje recibido del cliente' : isBridge ? `Mensaje enviado por ${msg.vendedor_name || 'vendedor'}` : 'Mensaje enviado por SARA',
          description: truncate(msg.content || '', 160),
          timestamp: ts,
          teamMemberName: isBridge ? (msg.vendedor_name || 'Vendedor') : isUser ? undefined : 'SARA',
        })
      })
    }

    // 3. Status change (from status_changed_at)
    if (lead.status_changed_at) {
      allEntries.push({
        id: `status-current`,
        type: 'status_change',
        title: `Cambio de status: ${STATUS_LABELS[lead.status] || lead.status}`,
        description: `El lead fue movido al status "${STATUS_LABELS[lead.status] || lead.status}"`,
        timestamp: lead.status_changed_at,
      })
    }

    // 4. Appointments
    const leadAppts = appointments.filter((a: any) => a.lead_id === leadId)
    leadAppts.forEach((apt: any) => {
      const isCompleted = apt.status === 'completed'
      const vendor = team.find(t => t.id === (apt.team_member_id || apt.vendedor_id))
      allEntries.push({
        id: `apt-${apt.id}`,
        type: isCompleted ? 'appointment_completed' : 'appointment_scheduled',
        title: isCompleted ? 'Cita completada' : 'Cita agendada',
        description: `${apt.scheduled_date} ${apt.scheduled_time ? `a las ${apt.scheduled_time}` : ''}${apt.property_name ? ` - ${apt.property_name}` : ''}`,
        timestamp: apt.created_at || `${apt.scheduled_date}T${apt.scheduled_time || '00:00'}`,
        teamMemberName: vendor?.name,
      })
    })

    // 5. Manual notes from lead.notes.manual
    if (lead.notes?.manual && Array.isArray(lead.notes.manual)) {
      lead.notes.manual.forEach((note: any, idx: number) => {
        allEntries.push({
          id: `note-${idx}`,
          type: 'note_added',
          title: 'Nota agregada',
          description: note.text || note.content || '',
          timestamp: note.timestamp || note.created_at || lead.created_at,
          teamMemberName: note.author,
        })
      })
    }

    // Sort newest first
    allEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setEntries(allEntries)
    setLoading(false)
  }, [leadId, lead, team, appointments])

  useEffect(() => {
    buildTimeline()
  }, [buildTimeline])

  async function handleAddNote() {
    const text = noteText.trim()
    if (!text) return
    setSaving(true)

    const { error } = await supabase.from('lead_activities').insert({
      lead_id: leadId,
      team_member_id: currentUser?.id || null,
      activity_type: 'note_added',
      notes: text,
    })

    if (error) {
      showToast('Error al guardar nota', 'error')
      setSaving(false)
      return
    }

    setNoteText('')
    setSaving(false)
    showToast('Nota agregada', 'success')
    onActivityAdded?.()
    // Rebuild timeline
    buildTimeline()
  }

  const visible = entries.slice(0, visibleCount)
  const hasMore = entries.length > visibleCount

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Add Note Form */}
      <div className="bg-slate-700/40 rounded-xl p-4">
        <h4 className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Agregar nota</h4>
        <textarea
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          placeholder="Escribe una nota sobre este lead..."
          className="w-full p-3 bg-slate-600/50 rounded-xl text-sm resize-none h-20 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleAddNote}
            disabled={saving || !noteText.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar nota'}
          </button>
        </div>
      </div>

      {/* Timeline */}
      {entries.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
          <p>Sin actividad registrada</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-700/60" />

          <div className="space-y-1">
            {visible.map((entry) => {
              const style = ICON_MAP[entry.type] || ICON_MAP.system_event
              const borderColor = BORDER_COLOR_MAP[entry.type] || 'border-slate-500/40'
              const IconComponent = style.icon
              return (
                <div key={entry.id} className="relative flex gap-3 pl-0">
                  {/* Icon dot */}
                  <div className={`relative z-10 w-10 h-10 rounded-full ${style.bg} flex items-center justify-center flex-shrink-0`}>
                    <IconComponent size={16} className={style.text} />
                  </div>
                  {/* Content card */}
                  <div className={`flex-1 min-w-0 bg-slate-700/30 rounded-xl p-3 border-l-2 ${borderColor} mb-1`}>
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-sm font-medium text-slate-200 truncate">{entry.title}</span>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap flex-shrink-0">{timeAgo(entry.timestamp)}</span>
                    </div>
                    {entry.description && (
                      <p className="text-xs text-slate-400 break-words leading-relaxed">{entry.description}</p>
                    )}
                    {entry.teamMemberName && (
                      <p className="text-[10px] text-slate-500 mt-1">Por: {entry.teamMemberName}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ChevronDown size={14} />
                Cargar mas ({entries.length - visibleCount} restantes)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function activityTypeLabel(type: string): string {
  const map: Record<string, string> = {
    message_sent: 'Mensaje enviado',
    message_received: 'Mensaje recibido',
    call: 'Llamada',
    status_change: 'Cambio de status',
    appointment_scheduled: 'Cita agendada',
    appointment_completed: 'Cita completada',
    note_added: 'Nota agregada',
    system_event: 'Evento del sistema',
    visit: 'Visita',
    whatsapp: 'WhatsApp',
    email: 'Email',
    quote: 'Cotizacion',
  }
  return map[type] || type
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max) + '...'
}
