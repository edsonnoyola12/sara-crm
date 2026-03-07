import { useState, useRef, useMemo, Fragment } from 'react'
import { useCrm } from '../context/CrmContext'
import type { Appointment } from '../types/crm'
import { getApptStyle, APPT_LEGEND, API_BASE } from '../types/crm'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function getCalendarDays(month: Date) {
  const year = month.getFullYear()
  const m = month.getMonth()
  const firstDay = new Date(year, m, 1)
  const dayOfWeek = firstDay.getDay()
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - mondayOffset)

  const days: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = []
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    days.push({
      date: d,
      isCurrentMonth: d.getMonth() === m,
      isToday: dStr === todayStr
    })
  }
  return days
}

function SkeletonBlock({ h = '1rem', w = '100%' }: { h?: string; w?: string }) {
  return <div className="skeleton" style={{ height: h, width: w }} />
}

function SkeletonCalendar() {
  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex justify-between">
        <SkeletonBlock h="2rem" w="30%" />
        <SkeletonBlock h="2rem" w="20%" />
      </div>
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-2">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {[1,2,3,4,5,6,7].map(i => <SkeletonBlock key={i} h="0.75rem" />)}
        </div>
        {[1,2,3,4,5].map(row => (
          <div key={row} className="grid grid-cols-7 gap-2">
            {[1,2,3,4,5,6,7].map(col => <SkeletonBlock key={col} h="4rem" />)}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CalendarView() {
  const {
    appointments,
    leads,
    properties,
    team,
    currentUser,
    loading,
    showToast,
    loadData,
    setConfirmModal,
  } = useCrm()

  // Local state
  const [showNewAppointment, setShowNewAppointment] = useState(false)
  const [newAppointment, setNewAppointment] = useState<any>({})
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [saving, setSaving] = useState(false)
  const [showAllAppointments, setShowAllAppointments] = useState(false)
  const [calendarViewMode, setCalendarViewMode] = useState<'list' | 'month' | 'week'>('month')
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null)
  const [calendarWeekStart, setCalendarWeekStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); d.setHours(0,0,0,0); return d
  })
  const [calendarTeamFilter, setCalendarTeamFilter] = useState('')
  const calendarSmartDefaultApplied = useRef(false)

  // Filtered appointments based on role
  const myLeadIds = currentUser?.role === 'vendedor' ? new Set(leads.filter(l => l.assigned_to === currentUser?.id).map(l => l.id)) : null
  const filteredAppointments = useMemo(() => {
    if (showAllAppointments || currentUser?.role === 'admin' || currentUser?.role === 'coordinador') {
      return appointments
    }
    return appointments.filter(a =>
      a.vendedor_id === currentUser?.id ||
      a.asesor_id === currentUser?.id ||
      (myLeadIds && myLeadIds.has(a.lead_id))
    )
  }, [appointments, showAllAppointments, currentUser, myLeadIds])

  // Auto-switch calendar to list view when few appointments (one-time)
  if (!calendarSmartDefaultApplied.current && currentUser && appointments.length > 0) {
    calendarSmartDefaultApplied.current = true
    const scheduled = filteredAppointments.filter(a => a.status === 'scheduled').length
    if (scheduled <= 5) {
      setTimeout(() => setCalendarViewMode('list'), 0)
    }
  }

  // Appointments grouped by day
  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    filteredAppointments.forEach(a => {
      if (!a.scheduled_date) return
      const key = a.scheduled_date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(a)
    })
    return map
  }, [filteredAppointments])

  if (loading) return <SkeletonCalendar />

  return (
    <div className="space-y-6">
      {/* Header con botones */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold">📅 Calendario de Citas</h2>
        <div className="flex gap-3 items-center flex-wrap">
          <button
            onClick={() => setShowNewAppointment(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl font-semibold flex items-center gap-2"
          >
            ➕ Nueva Cita
          </button>
          <a
            href="https://calendar.google.com/calendar/embed?src=edsonnoyola%40gmail.com&ctz=America/Mexico_City"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold flex items-center gap-2"
          >
            🗓️ Ver Calendario Citas
          </a>
          {/* Toggle ver todas vs solo mias */}
          {currentUser?.role !== 'admin' && (
            <button
              onClick={() => setShowAllAppointments(!showAllAppointments)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                showAllAppointments
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-slate-600 hover:bg-slate-700'
              }`}
            >
              {showAllAppointments ? '👥 Todas las citas' : '👤 Solo mis citas'}
            </button>
          )}
          <span className="px-3 py-2 bg-green-600/30 border border-green-500 rounded-xl text-sm">✅ {filteredAppointments.filter(a => a.status === 'scheduled').length} Programadas</span>
          <span className="px-3 py-2 bg-red-600/30 border border-red-500 rounded-xl text-sm">❌ {filteredAppointments.filter(a => a.status === 'cancelled').length} Canceladas</span>
          {/* Toggle Mes / Semana / Lista */}
          <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setCalendarViewMode('month')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${calendarViewMode === 'month' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Mes
            </button>
            <button
              onClick={() => setCalendarViewMode('week')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${calendarViewMode === 'week' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Semana
            </button>
            <button
              onClick={() => setCalendarViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${calendarViewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Lista
            </button>
          </div>
        </div>
      </div>

      {/* Color legend — shared across views */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        {APPT_LEGEND.map(t => (
          <span key={t.key} className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded ${t.bg}`} /> {t.icon} {t.label}</span>
        ))}
      </div>

      {/* ═══ MONTH GRID VIEW ═══ */}
      {calendarViewMode === 'month' && (
        <div className="space-y-4">
          {/* Month navigation */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setCalendarMonth(prev => { const d = new Date(prev); d.setMonth(d.getMonth() - 1); return d })}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-slate-400" />
            </button>
            <h3 className="text-lg font-semibold min-w-[200px] text-center">
              {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
            </h3>
            <button
              onClick={() => setCalendarMonth(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + 1); return d })}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronRight size={20} className="text-slate-400" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1">
            {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-500 py-2">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {getCalendarDays(calendarMonth).map((day, idx) => {
              const dateStr = `${day.date.getFullYear()}-${String(day.date.getMonth()+1).padStart(2,'0')}-${String(day.date.getDate()).padStart(2,'0')}`
              const dayAppts = appointmentsByDay.get(dateStr) || []
              const scheduledAppts = dayAppts.filter(a => a.status === 'scheduled')
              const isSelected = selectedCalendarDay === dateStr
              const isPast = day.date < new Date(new Date().setHours(0,0,0,0)) && !day.isToday

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedCalendarDay(isSelected ? null : dateStr)}
                  className={`min-h-[5rem] p-1.5 rounded-lg border text-left transition-all ${
                    !day.isCurrentMonth ? 'opacity-20 border-transparent' :
                    isSelected ? 'border-blue-500 bg-blue-500/10' :
                    day.isToday ? 'border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/30' :
                    isPast ? 'opacity-40 border-slate-800 hover:border-slate-700' :
                    'border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
                  }`}
                >
                  <span className={`text-xs font-medium ${
                    day.isToday ? 'text-blue-400' :
                    !day.isCurrentMonth ? 'text-slate-600' :
                    'text-slate-300'
                  }`}>
                    {day.date.getDate()}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {scheduledAppts.slice(0, 2).map((a, i) => (
                      <div key={i} className="flex items-center gap-1 text-[10px] leading-tight">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getApptStyle(a.appointment_type).dot}`} />
                        <span className="text-slate-300 truncate">{a.scheduled_time?.slice(0,5)} {(a.property_name || a.lead_name || '').slice(0, 10)}</span>
                      </div>
                    ))}
                    {scheduledAppts.length > 2 && (
                      <p className="text-[10px] text-blue-400 font-medium">+{scheduledAppts.length - 2} mas</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Selected day detail panel */}
          {selectedCalendarDay && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {(() => {
                    const [y,m,d] = selectedCalendarDay.split('-').map(Number)
                    return new Date(y, m-1, d).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
                  })()}
                </h3>
                <button onClick={() => setSelectedCalendarDay(null)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              {(appointmentsByDay.get(selectedCalendarDay) || []).filter(a => a.status === 'scheduled').length === 0 ? (
                <div className="text-center py-6 bg-slate-800/30 rounded-xl border border-slate-700/30">
                  <p className="text-slate-500 text-sm">No hay citas programadas este dia</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {(appointmentsByDay.get(selectedCalendarDay) || []).filter(a => a.status === 'scheduled').map(appt => {
                    const vendedorNombre = appt.vendedor_name || team.find(t => t.id === appt.vendedor_id)?.name || 'Sin asignar'
                    return (
                      <div key={appt.id} className={`bg-slate-800 border-l-4 border-slate-700 p-4 rounded-xl flex items-center justify-between gap-4`} style={{ borderLeftColor: `var(--appt-${appt.appointment_type || 'visit'})` }}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="text-2xl">{getApptStyle(appt.appointment_type).icon}</div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold truncate">{appt.property_name || 'Visita'}</p>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-medium ${getApptStyle(appt.appointment_type).badge}`}>{getApptStyle(appt.appointment_type).label}</span>
                            </div>
                            <p className="text-sm text-slate-400">👤 {appt.lead_name || appt.lead_phone} · 🕐 {appt.scheduled_time?.slice(0,5)} · 🏢 {vendedorNombre}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => setEditingAppointment({...appt, mode: 'edit', notificar: true})}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium"
                          >
                            ✏️
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ WEEK VIEW ═══ */}
      {calendarViewMode === 'week' && (() => {
        const weekDays: Date[] = []
        for (let i = 0; i < 7; i++) { const d = new Date(calendarWeekStart); d.setDate(d.getDate() + i); weekDays.push(d) }
        const weekEnd = new Date(calendarWeekStart); weekEnd.setDate(weekEnd.getDate() + 6)
        const fmtRange = `${calendarWeekStart.getDate()} - ${weekEnd.getDate()} ${monthNames[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`
        const hours = Array.from({ length: 13 }, (_, i) => i + 8) // 8:00 - 20:00
        const todayStr = new Date().toISOString().split('T')[0]
        const weekAppts = filteredAppointments.filter(a => {
          if (a.status !== 'scheduled') return false
          if (calendarTeamFilter && a.vendedor_id !== calendarTeamFilter) return false
          return true
        })

        return (
        <div className="space-y-4">
          {/* Week navigation + team filter */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <button onClick={() => setCalendarWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d })} className="p-2 hover:bg-slate-800 rounded-lg"><ChevronLeft size={20} className="text-slate-400" /></button>
              <h3 className="text-lg font-semibold min-w-[240px] text-center">{fmtRange}</h3>
              <button onClick={() => setCalendarWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d })} className="p-2 hover:bg-slate-800 rounded-lg"><ChevronRight size={20} className="text-slate-400" /></button>
              <button onClick={() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); d.setHours(0,0,0,0); setCalendarWeekStart(d) }} className="px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-lg text-xs text-blue-400 hover:bg-blue-600/30">Hoy</button>
            </div>
            {['admin','coordinador'].includes(currentUser?.role || '') && (
              <select value={calendarTeamFilter} onChange={e => setCalendarTeamFilter(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm">
                <option value="">Todos</option>
                {team.filter(t => t.active && ['vendedor','coordinador'].includes(t.role)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
          </div>

          {/* Week grid */}
          <div className="week-grid">
            {/* Header row */}
            <div className="week-grid-header" />
            {weekDays.map(d => {
              const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
              return (
                <div key={ds} className={`week-grid-header ${ds === todayStr ? 'today' : ''}`}>
                  <div className="text-[10px]">{['Lun','Mar','Mie','Jue','Vie','Sab','Dom'][((d.getDay() + 6) % 7)]}</div>
                  <div className={`text-lg font-bold ${ds === todayStr ? 'text-blue-400' : ''}`}>{d.getDate()}</div>
                </div>
              )
            })}

            {/* Time rows */}
            {hours.map(hour => (
              <Fragment key={hour}>
                <div className="week-grid-time">{hour}:00</div>
                {weekDays.map(d => {
                  const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
                  const cellAppts = weekAppts.filter(a => {
                    if (a.scheduled_date !== ds) return false
                    const h = parseInt(a.scheduled_time?.slice(0,2) || '0')
                    return h === hour
                  })
                  return (
                    <div key={`${ds}-${hour}`} className="week-grid-cell">
                      {cellAppts.map(a => (
                        <div
                          key={a.id}
                          onClick={() => setEditingAppointment({...a, mode: 'edit', notificar: true})}
                          className={`week-appt-block ${getApptStyle(a.appointment_type).bg}`}
                          style={{ top: '2px', height: 'calc(100% - 4px)' }}
                          title={`${a.scheduled_time?.slice(0,5)} - ${a.lead_name || ''} - ${a.property_name || ''}`}
                        >
                          <span className="font-medium text-white">{a.scheduled_time?.slice(0,5)}</span>
                          <span className="text-white/80 ml-1 truncate">{(a.lead_name || '').split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </Fragment>
            ))}
          </div>

          {/* Legend is shown globally above views */}
        </div>
        )
      })()}

      {/* ═══ LIST VIEW ═══ */}
      {calendarViewMode === 'list' && (
      <div className="grid grid-cols-1 gap-4">
        {filteredAppointments.filter(a => a.status === 'scheduled').map((appt) => {
          const fecha = (appt.scheduled_date && appt.scheduled_time) ? new Date(appt.scheduled_date + 'T' + appt.scheduled_time) : null
          const vendedorNombre = appt.vendedor_name || team.find(t => t.id === appt.vendedor_id)?.name || 'Sin asignar'
          return (
            <div key={appt.id} className="bg-slate-800 border border-slate-700 p-5 rounded-2xl">
              <div className="flex items-start justify-between gap-4">
                {/* Info de la cita */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-4xl">{getApptStyle(appt.appointment_type).icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <p className="font-bold text-xl">{appt.property_name || 'Visita'}</p>
                      <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${getApptStyle(appt.appointment_type).badge}`}>{getApptStyle(appt.appointment_type).label}</span>
                      {appt.confirmation_sent && (
                        <span className={`px-2 py-1 rounded text-xs ${appt.client_responded ? 'bg-green-600' : 'bg-yellow-600'}`}>
                          {appt.client_responded ? '✅ Confirmado' : '⏳ Enviado'}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400 text-xs">👤 Cliente</p>
                        <p className="font-semibold">{appt.lead_name || 'Sin nombre'}</p>
                        <p className="text-xs text-slate-400">{appt.lead_phone}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">📅 Fecha</p>
                        <p className="font-semibold text-blue-400">
                          {fecha ? fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' }) : appt.scheduled_date || 'Sin fecha'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">🕐 Hora</p>
                        <p className="font-semibold text-green-400 text-lg">
                          {fecha ? fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : appt.scheduled_time || 'Sin hora'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">🏢 Vendedor</p>
                        <p className="font-semibold">{vendedorNombre}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botones de accion */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setEditingAppointment({...appt, mode: 'edit', notificar: true})}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold flex items-center gap-2"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => {
                      const tipoTexto = appt.appointment_type === 'llamada' ? 'llamada' : 'cita';
                      setConfirmModal({
                        title: `Cancelar ${tipoTexto}`,
                        message: `¿Cancelar ${tipoTexto} con ${appt.lead_name}? Se notificará al cliente y vendedor por WhatsApp.`,
                        onConfirm: async () => {
                          try {
                            const response = await fetch(`${API_BASE}/api/appointments/${appt.id}/cancel`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                google_event_id: appt.google_event_vendedor_id,
                                cancelled_by: 'CRM',
                                notificar: true
                              })
                            })
                            if (!response.ok) throw new Error('Error al cancelar')
                            loadData()
                          } catch (err: any) {
                            showToast('Error: ' + err.message, 'error')
                            loadData()
                          }
                          setConfirmModal(null)
                        }
                      })
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold flex items-center gap-2"
                  >
                    ❌ Cancelar
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {filteredAppointments.filter(a => a.status === 'scheduled').length === 0 && (
          <div className="text-center py-16 bg-slate-800/50 rounded-2xl">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-slate-400 text-xl mb-4">No hay citas programadas</p>
            <button
              onClick={() => setShowNewAppointment(true)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold"
            >
              ➕ Crear Primera Cita
            </button>
          </div>
        )}
      </div>
      )}

      {/* Citas Canceladas */}
      {filteredAppointments.filter(a => a.status === 'cancelled').length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-4 text-slate-400">❌ Citas Canceladas ({filteredAppointments.filter(a => a.status === 'cancelled').length})</h3>
          <div className="space-y-2">
            {filteredAppointments.filter(a => a.status === 'cancelled').slice(0, 5).map((appt) => {
              const fecha = (appt.scheduled_date && appt.scheduled_time) ? new Date(appt.scheduled_date + 'T' + appt.scheduled_time) : null
              return (
                <div key={appt.id} className="bg-slate-800/30 border border-slate-700/30 p-3 rounded-xl opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-red-400">❌</span>
                      <div>
                        <p className="font-semibold text-sm">{appt.property_name} - {appt.lead_name || appt.lead_phone}</p>
                        <p className="text-xs text-slate-400">
                          {fecha ? `${fecha.toLocaleDateString('es-MX')} ${fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}` : (appt.scheduled_date || 'Sin fecha')}
                          {appt.cancelled_by && ` • Cancelada por: ${appt.cancelled_by}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ MODALS ═══ */}

      {/* Modal Nueva Cita */}
      {showNewAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewAppointment(false)}>
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">➕ Nueva Cita</h3>
              <button onClick={() => setShowNewAppointment(false)} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X size={24} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Cliente (Lead)</label>
                <select
                  value={newAppointment.lead_id || ''}
                  onChange={(e) => {
                    const lead = leads.find(l => l.id === e.target.value)
                    setNewAppointment({...newAppointment, lead_id: e.target.value, lead_name: lead?.name || '', lead_phone: lead?.phone || ''})
                  }}
                  className="w-full p-3 bg-slate-700 rounded-lg"
                >
                  <option value="">Seleccionar lead...</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.name} - {l.phone}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Desarrollo</label>
                <select
                  value={newAppointment.property_name || ''}
                  onChange={(e) => setNewAppointment({...newAppointment, property_name: e.target.value})}
                  className="w-full p-3 bg-slate-700 rounded-lg"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Oficinas Centrales">🏢 Oficinas Centrales</option>
                  {[...new Set(properties.map(p => p.development || p.name))].filter(Boolean).sort().map(dev => (
                    <option key={dev} value={dev}>{dev}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Fecha</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={newAppointment.scheduled_date || ''}
                    onChange={(e) => setNewAppointment({...newAppointment, scheduled_date: e.target.value})}
                    className="w-full p-3 bg-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Hora</label>
                  <input
                    type="time"
                    value={newAppointment.scheduled_time || ''}
                    onChange={(e) => setNewAppointment({...newAppointment, scheduled_time: e.target.value})}
                    className="w-full p-3 bg-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Vendedor</label>
                <select
                  value={newAppointment.vendedor_id || ''}
                  onChange={(e) => {
                    const v = team.find(t => t.id === e.target.value)
                    setNewAppointment({...newAppointment, vendedor_id: e.target.value, vendedor_name: v?.name || ''})
                  }}
                  className="w-full p-3 bg-slate-700 rounded-lg"
                >
                  <option value="">Seleccionar vendedor...</option>
                  {team.filter(t => t.role === 'vendedor' && t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <button
                disabled={saving}
                onClick={async () => {
                  if (!newAppointment.lead_id || !newAppointment.scheduled_date || !newAppointment.scheduled_time) {
                    showToast('Completa todos los campos', 'error')
                    return
                  }
                  setSaving(true)
                  try {
                    const response = await fetch(`${API_BASE}/api/appointments`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ...newAppointment,
                        appointment_type: 'visita',
                        status: 'scheduled'
                      })
                    })
                    if (!response.ok) throw new Error('Error al crear')
                    setShowNewAppointment(false)
                    setNewAppointment({})
                    loadData()
                    showToast('Cita creada y agregada a Google Calendar', 'success')
                  } catch (err: any) {
                    showToast('Error: ' + err.message, 'error')
                  } finally { setSaving(false) }
                }}
                className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Creando...' : '✅ Crear Cita'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar/Reagendar Cita */}
      {editingAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingAppointment(null)}>
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                ✏️ Editar Cita
              </h3>
              <button onClick={() => setEditingAppointment(null)} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X size={24} /></button>
            </div>

            <div className="bg-slate-700/50 p-4 rounded-xl mb-4">
              <p className="text-sm text-slate-400">Cliente</p>
              <p className="font-bold text-lg">{editingAppointment.lead_name} - {editingAppointment.lead_phone}</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={editingAppointment.scheduled_date || ''}
                    onChange={(e) => setEditingAppointment({...editingAppointment, scheduled_date: e.target.value})}
                    className="w-full p-3 bg-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Hora</label>
                  <input
                    type="time"
                    value={(editingAppointment.scheduled_time || '').substring(0, 5)}
                    onChange={(e) => setEditingAppointment({...editingAppointment, scheduled_time: e.target.value})}
                    className="w-full p-3 bg-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Desarrollo</label>
                <select
                  value={editingAppointment.property_name || ''}
                  onChange={(e) => setEditingAppointment({...editingAppointment, property_name: e.target.value})}
                  className="w-full p-3 bg-slate-700 rounded-lg"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Oficinas Centrales">🏢 Oficinas Centrales</option>
                  {[...new Set(properties.map(p => p.development || p.name))].filter(Boolean).sort().map(dev => (
                    <option key={dev} value={dev}>{dev}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Vendedor Asignado</label>
                <select
                  value={editingAppointment.vendedor_id || ''}
                  onChange={(e) => {
                    const vendedor = team.find(t => t.id === e.target.value);
                    setEditingAppointment({
                      ...editingAppointment,
                      vendedor_id: e.target.value,
                      vendedor_name: vendedor?.name || ''
                    });
                  }}
                  className="w-full p-3 bg-slate-700 rounded-lg"
                >
                  <option value="">Seleccionar vendedor...</option>
                  {team.filter(t => t.role === 'vendedor' || t.role === 'admin').map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Tipo de Cita</label>
                <select
                  value={(editingAppointment as any).appointment_type || 'visita'}
                  onChange={(e) => setEditingAppointment({...editingAppointment, appointment_type: e.target.value} as any)}
                  className="w-full p-3 bg-slate-700 rounded-lg"
                >
                  <option value="visita">🏠 Visita a desarrollo</option>
                  <option value="oficina">🏢 Cita en oficina</option>
                  <option value="videollamada">📹 Videollamada</option>
                  <option value="firma">✏️ Firma de contrato</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Notas</label>
                <textarea
                  value={(editingAppointment as any).notes_text || ''}
                  onChange={(e) => setEditingAppointment({...editingAppointment, notes_text: e.target.value} as any)}
                  placeholder="Notas adicionales sobre la cita..."
                  className="w-full p-3 bg-slate-700 rounded-lg h-24 resize-none"
                />
              </div>

              {/* Checkbox notificar WhatsApp */}
              <label className="flex items-center gap-3 p-3 bg-green-600/20 border border-green-500/50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={(editingAppointment as any).notificar || false}
                  onChange={(e) => setEditingAppointment({...editingAppointment, notificar: e.target.checked} as any)}
                  className="w-5 h-5 rounded"
                />
                <div>
                  <p className="font-semibold">📲 Notificar por WhatsApp</p>
                  <p className="text-xs text-slate-400">Enviar mensaje al cliente y vendedor con los cambios</p>
                </div>
              </label>

              <button
                disabled={saving}
                onClick={async () => {
                  setSaving(true)
                  try {
                    const response = await fetch(`${API_BASE}/api/appointments/` + editingAppointment.id, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        scheduled_date: editingAppointment.scheduled_date,
                        scheduled_time: editingAppointment.scheduled_time,
                        property_name: editingAppointment.property_name,
                        google_event_id: editingAppointment.google_event_vendedor_id,
                        notificar: (editingAppointment as any).notificar,
                        lead_phone: editingAppointment.lead_phone,
                        lead_name: editingAppointment.lead_name,
                        vendedor_id: editingAppointment.vendedor_id,
                        vendedor_name: editingAppointment.vendedor_name,
                        appointment_type: (editingAppointment as any).appointment_type,
                        notes_text: (editingAppointment as any).notes_text
                      })
                    })
                    if (!response.ok) throw new Error('Error al guardar')
                    setEditingAppointment(null)
                    loadData()
                    showToast((editingAppointment as any).notificar ? 'Cita actualizada y notificaciones enviadas por WhatsApp' : 'Cita actualizada', 'success')
                  } catch (err: any) {
                    showToast('Error: ' + err.message, 'error')
                  } finally { setSaving(false) }
                }}
                className={`w-full py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${(editingAppointment as any).mode === 'edit' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
              >
                {saving ? 'Guardando...' : '✅ Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
