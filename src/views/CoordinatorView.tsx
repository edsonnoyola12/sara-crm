import { useState } from 'react'
import { Plus, Calendar, ChevronLeft, ChevronRight, UserCheck, AlertCircle, Users, MessageSquare, Edit as EditIcon, X } from 'lucide-react'
import { useCrm } from '../context/CrmContext'
import { API_BASE, safeFetch, STATUS_LABELS } from '../types/crm'

export default function CoordinatorView() {
  const {
    leads, setLeads,
    team,
    appointments, setAppointments,
    properties,
    currentUser,
    showToast,
    setView,
    setInputModal,
    supabase,
  } = useCrm()

  // Local state for coordinator-specific UI
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">📞 Panel Coordinador</h2>
        <p className="text-slate-400">Gestion rapida de llamadas y leads</p>
      </div>

      {/* FORMULARIO RAPIDO CREAR LEAD */}
      <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-600/30 rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Plus size={24} className="text-green-400" /> Nuevo Lead (Llamada/Mail)
        </h3>
        <form onSubmit={async (e) => {
          e.preventDefault()
          const form = e.target as HTMLFormElement
          const nombre = (form.elements.namedItem('coord_nombre') as HTMLInputElement).value.trim()
          const telefono = (form.elements.namedItem('coord_telefono') as HTMLInputElement).value.trim()
          const medio = (form.elements.namedItem('coord_medio') as HTMLSelectElement).value
          const desarrollo = (form.elements.namedItem('coord_desarrollo') as HTMLSelectElement).value
          const vendedorId = (form.elements.namedItem('coord_vendedor') as HTMLSelectElement).value
          // Campos opcionales de cita
          const citaFecha = (form.elements.namedItem('coord_cita_fecha') as HTMLInputElement).value
          const citaHora = (form.elements.namedItem('coord_cita_hora') as HTMLInputElement).value
          const citaLugar = (form.elements.namedItem('coord_cita_lugar') as HTMLSelectElement).value

          if (!nombre || !telefono || !medio) {
            showToast('Nombre, telefono y medio son requeridos', 'error')
            return
          }

          // Validar que si hay cita, tenga fecha, hora y lugar
          const tieneCita = citaFecha || citaHora || citaLugar
          if (tieneCita && (!citaFecha || !citaHora || !citaLugar)) {
            showToast('Si agendas cita, debes completar fecha, hora y lugar', 'error')
            return
          }

          // Normalizar telefono
          let tel = telefono.replace(/[^0-9]/g, '')
          if (tel.length === 10) tel = '52' + tel
          if (!tel.startsWith('52')) tel = '52' + tel.slice(-10)

          // Usar endpoint del backend para crear lead Y notificar al vendedor
          const vendedorName = vendedorId ? team.find(t => t.id === vendedorId)?.name : null
          const lugarCita = citaLugar || desarrollo

          const response = await fetch(`${API_BASE}/api/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: nombre,
              phone: tel,
              status: 'new',
              source: medio,
              property_interest: desarrollo || lugarCita || null,
              assigned_to: vendedorId || undefined,
              created_at: new Date().toISOString(),
              creador_name: currentUser?.name || 'Coordinador',
              creador_role: 'coordinador',
              // Datos de cita opcional
              tiene_cita: tieneCita ? true : false,
              cita_fecha: citaFecha || undefined,
              cita_hora: citaHora || undefined,
              cita_desarrollo: lugarCita || undefined
            })
          })

          const result = await response.json()
          if (!response.ok) {
            showToast('Error: ' + (result.error || 'Error desconocido'), 'error')
            return
          }

          // Actualizar lista local
          setLeads([result, ...leads])
          form.reset()

          const citaMsg = tieneCita ? `\n📅 Cita: ${citaFecha} a las ${citaHora} en ${lugarCita}` : ''
          showToast(`Lead creado${vendedorName ? ` y asignado a ${vendedorName?.split(' ')[0]}` : ''}${citaMsg ? ` | Cita: ${citaFecha} a las ${citaHora} en ${lugarCita}` : ''} | Notificacion enviada por WhatsApp`, 'success')
        }} className="space-y-4">
          {/* Fila 1: Datos basicos */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nombre *</label>
              <input name="coord_nombre" placeholder="Juan Perez" className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Telefono *</label>
              <input name="coord_telefono" placeholder="5512345678" className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Como se entero? *</label>
              <select name="coord_medio" className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
                <option value="">Seleccionar...</option>
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="YouTube">YouTube</option>
                <option value="TikTok">TikTok</option>
                <option value="Google">Google</option>
                <option value="Espectacular">Espectacular</option>
                <option value="Radio">Radio</option>
                <option value="Referido">Referido</option>
                <option value="Llamada directa">Llamada directa</option>
                <option value="Visita oficina">Visita oficina</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Desarrollo de interes</label>
              <select name="coord_desarrollo" className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="">Sin especificar</option>
                {[...new Set(properties.map(p => p.development))].filter(Boolean).map(dev => (
                  <option key={dev} value={dev}>{dev}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Asignar a vendedor</label>
              <select name="coord_vendedor" className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="">Sin asignar</option>
                {team.filter(t => t.role === 'vendedor' && t.active).map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
              <Plus size={20} /> Crear Lead
            </button>
          </div>
          {/* Fila 2: Cita opcional */}
          <div className="border-t border-slate-600 pt-4">
            <p className="text-sm text-slate-400 mb-3 flex items-center gap-2">
              <Calendar size={16} /> Agendar cita (opcional)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Fecha de cita</label>
                <input name="coord_cita_fecha" type="date" min={new Date().toISOString().split('T')[0]} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Hora de cita</label>
                <input name="coord_cita_hora" type="time" className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Lugar de cita</label>
                <select name="coord_cita_lugar" className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="">Seleccionar lugar...</option>
                  <option value="Oficinas Centrales">Oficinas Centrales</option>
                  {[...new Set(properties.map(p => p.development))].filter(Boolean).map(dev => (
                    <option key={dev} value={dev}>{dev}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* VISTA DE DISPONIBILIDAD POR DIA */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Calendar size={24} className="text-cyan-400" /> Disponibilidad del Equipo
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const d = new Date(selectedDate)
                d.setDate(d.getDate() - 1)
                setSelectedDate(d.toISOString().split('T')[0])
              }}
              className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600"
            >
              <ChevronLeft size={20} />
            </button>
            <input
              type="date"
              value={selectedDate || new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-700 rounded-lg px-3 py-2"
            />
            <button
              onClick={() => {
                const d = new Date(selectedDate || new Date())
                d.setDate(d.getDate() + 1)
                setSelectedDate(d.toISOString().split('T')[0])
              }}
              className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600"
            >
              <ChevronRight size={20} />
            </button>
            <span className="ml-2 text-slate-400">
              {new Date((selectedDate || new Date().toISOString().split('T')[0]) + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex gap-4 mb-4 text-sm">
          <span className="flex items-center gap-1"><div className="w-4 h-4 bg-green-600 rounded" /> Disponible</span>
          <span className="flex items-center gap-1"><div className="w-4 h-4 bg-red-600 rounded" /> Ocupado</span>
          <span className="flex items-center gap-1"><div className="w-4 h-4 bg-slate-600 rounded" /> Fuera de horario</span>
        </div>

        {/* Grid de disponibilidad */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-600">
                <th className="text-left p-2 sticky left-0 bg-slate-800">Vendedor</th>
                {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(hora => (
                  <th key={hora} className="p-2 text-center min-w-[60px]">
                    {hora}:00
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {team.filter(t => t.role === 'vendedor' && t.active).map(vendedor => {
                // Obtener citas del vendedor para la fecha seleccionada
                const fechaSeleccionada = selectedDate || new Date().toISOString().split('T')[0]
                const citasVendedor = appointments.filter(a =>
                  a.vendedor_id === vendedor.id &&
                  a.scheduled_date === fechaSeleccionada &&
                  a.status === 'scheduled'
                )

                // Horario de trabajo del vendedor (default 9-18)
                const horaInicio = vendedor.hora_inicio || 9
                const horaFin = vendedor.hora_fin || 18

                // Verificar vacaciones
                const fechaCheck = new Date(fechaSeleccionada)
                const enVacaciones = vendedor.vacation_start && vendedor.vacation_end &&
                  fechaCheck >= new Date(vendedor.vacation_start) &&
                  fechaCheck <= new Date(vendedor.vacation_end)

                return (
                  <tr key={vendedor.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="p-2 sticky left-0 bg-slate-800 font-medium">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${enVacaciones ? 'bg-red-500' : vendedor.is_on_duty ? 'bg-green-500' : 'bg-slate-500'}`} />
                        {vendedor.name?.split(' ')[0] || 'Sin nombre'}
                        {enVacaciones && <span className="text-xs text-red-400">🏖️</span>}
                      </div>
                    </td>
                    {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(hora => {
                      // Verificar si esta en horario de trabajo
                      const enHorario = hora >= horaInicio && hora < horaFin && !enVacaciones

                      // Verificar si tiene cita a esa hora
                      const citaEnHora = citasVendedor.find(c => {
                        const horaC = parseInt(c.scheduled_time?.split(':')[0] || '0')
                        return horaC === hora
                      })

                      const ocupado = !!citaEnHora

                      return (
                        <td key={hora} className="p-1 text-center">
                          {!enHorario ? (
                            <div className="w-full h-8 bg-slate-700/50 rounded cursor-not-allowed" title="Fuera de horario" />
                          ) : ocupado ? (
                            <div
                              className="w-full h-8 bg-red-600/80 rounded flex items-center justify-center cursor-pointer hover:bg-red-500 transition-colors"
                              title={`${citaEnHora.lead_name} - ${citaEnHora.property_name}`}
                              onClick={() => {
                                showToast(`Cita a las ${hora}:00 | ${citaEnHora.lead_name} | ${citaEnHora.property_name} | ${citaEnHora.lead_phone}`, 'info')
                              }}
                            >
                              <span className="text-xs">🔴</span>
                            </div>
                          ) : (
                            <div
                              className="w-full h-8 bg-green-600/60 rounded flex items-center justify-center cursor-pointer hover:bg-green-500 transition-colors"
                              title={`Agendar cita a las ${hora}:00 con ${vendedor.name}`}
                              onClick={() => {
                                // Pre-llenar el formulario de cita
                                const formFecha = document.querySelector('input[name="coord_cita_fecha"]') as HTMLInputElement
                                const formHora = document.querySelector('input[name="coord_cita_hora"]') as HTMLInputElement
                                const formVendedor = document.querySelector('select[name="coord_vendedor"]') as HTMLSelectElement

                                if (formFecha) formFecha.value = fechaSeleccionada
                                if (formHora) formHora.value = `${hora.toString().padStart(2, '0')}:00`
                                if (formVendedor) formVendedor.value = vendedor.id

                                // Scroll al formulario
                                document.querySelector('input[name="coord_nombre"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                ;(document.querySelector('input[name="coord_nombre"]') as HTMLInputElement)?.focus()
                              }}
                            >
                              <span className="text-xs">✓</span>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-3">💡 Haz clic en un horario verde para agendar una cita</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VENDEDORES DISPONIBLES / DE GUARDIA */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <UserCheck size={24} className="text-blue-400" /> Equipo Disponible Hoy
          </h3>
          <div className="space-y-3 max-h-80 overflow-auto">
            {team.filter(t => t.role === 'vendedor' && t.active).map(v => {
              const isOnDuty = v.is_on_duty
              const vacationStart = v.vacation_start ? new Date(v.vacation_start) : null
              const vacationEnd = v.vacation_end ? new Date(v.vacation_end) : null
              const today = new Date()
              const isOnVacation = vacationStart && vacationEnd && today >= vacationStart && today <= vacationEnd
              const leadsAsignados = leads.filter(l => l.assigned_to === v.id && l.status !== 'closed' && l.status !== 'fallen').length

              return (
                <div key={v.id} className={`flex items-center justify-between p-3 rounded-xl ${isOnVacation ? 'bg-red-900/30 border border-red-600/30' : isOnDuty ? 'bg-green-900/30 border border-green-600/30' : 'bg-slate-700/50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isOnVacation ? 'bg-red-500' : isOnDuty ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
                    <div>
                      <p className="font-semibold">{v.name}</p>
                      <p className="text-xs text-slate-400">{v.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded ${isOnVacation ? 'bg-red-600' : isOnDuty ? 'bg-green-600' : 'bg-slate-600'}`}>
                      {isOnVacation ? '🏖️ Vacaciones' : isOnDuty ? '🟢 De Guardia' : 'Disponible'}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">{leadsAsignados} leads activos</p>
                  </div>
                </div>
              )
            })}
            {team.filter(t => t.role === 'vendedor' && t.active).length === 0 && (
              <div className="text-center py-6">
                <Users size={28} className="mx-auto mb-2 text-slate-600" />
                <p className="text-slate-400 text-sm">Sin vendedores activos</p>
              </div>
            )}
          </div>
        </div>

        {/* LEADS SIN ASIGNAR */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle size={24} className="text-yellow-400" /> Leads Sin Asignar
            {leads.filter(l => !l.assigned_to && l.status !== 'closed' && l.status !== 'fallen').length > 0 && (
              <span className="bg-yellow-600 text-xs px-2 py-1 rounded-full ml-2">
                {leads.filter(l => !l.assigned_to && l.status !== 'closed' && l.status !== 'fallen').length}
              </span>
            )}
          </h3>
          <div className="space-y-3 max-h-80 overflow-auto">
            {leads.filter(l => !l.assigned_to && l.status !== 'closed' && l.status !== 'fallen').slice(0, 10).map(lead => (
              <div key={lead.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-xl">
                <div>
                  <p className="font-semibold">{lead.name}</p>
                  <p className="text-xs text-slate-400">{lead.phone} • {lead.property_interest || 'Sin desarrollo'}</p>
                  <p className="text-xs text-slate-400">{new Date(lead.created_at).toLocaleDateString('es-MX')}</p>
                </div>
                <select
                  className="bg-slate-600 rounded-lg px-3 py-2 text-sm"
                  onChange={async (e) => {
                    if (!e.target.value) return
                    await supabase.from('leads').update({ assigned_to: e.target.value }).eq('id', lead.id)
                    setLeads(leads.map(l => l.id === lead.id ? { ...l, assigned_to: e.target.value } : l))
                    const vendedorName = team.find(t => t.id === e.target.value)?.name?.split(' ')[0]
                    showToast(`Asignado a ${vendedorName}`, 'success')
                  }}
                  defaultValue=""
                >
                  <option value="">Asignar a...</option>
                  {team.filter(t => t.role === 'vendedor' && t.active).map(v => (
                    <option key={v.id} value={v.id}>{v.name?.split(' ')[0] || 'Sin nombre'}</option>
                  ))}
                </select>
              </div>
            ))}
            {leads.filter(l => !l.assigned_to && l.status !== 'closed' && l.status !== 'fallen').length === 0 && (
              <p className="text-green-400 text-center py-4">✅ Todos los leads estan asignados</p>
            )}
          </div>
        </div>
      </div>

      {/* GESTION DE CITAS - Proximos 7 dias */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Calendar size={24} className="text-purple-400" /> Gestion de Citas (Proximos 7 dias)
        </h3>
        <div className="space-y-3 max-h-96 overflow-auto">
          {appointments
            .filter(a => {
              const citaDate = new Date(a.scheduled_date)
              const today = new Date()
              const in7Days = new Date()
              in7Days.setDate(in7Days.getDate() + 7)
              return citaDate >= today && citaDate <= in7Days && a.status === 'scheduled'
            })
            .sort((a, b) => {
              const dateCompare = a.scheduled_date.localeCompare(b.scheduled_date)
              if (dateCompare !== 0) return dateCompare
              return a.scheduled_time.localeCompare(b.scheduled_time)
            })
            .map(cita => {
              const vendedor = team.find(t => t.id === cita.vendedor_id)
              const citaDate = new Date(cita.scheduled_date + 'T12:00:00')
              const isToday = citaDate.toDateString() === new Date().toDateString()
              const isTomorrow = citaDate.toDateString() === new Date(Date.now() + 86400000).toDateString()
              const dayLabel = isToday ? 'HOY' : isTomorrow ? 'MANANA' : citaDate.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })

              return (
                <div key={cita.id} className={`bg-slate-700/50 p-4 rounded-xl border-l-4 ${isToday ? 'border-red-500' : isTomorrow ? 'border-yellow-500' : 'border-purple-500'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${isToday ? 'bg-red-600' : isTomorrow ? 'bg-yellow-600' : 'bg-purple-600'}`}>
                          {dayLabel}
                        </span>
                        <span className="text-lg font-bold text-white">{cita.scheduled_time?.slice(0, 5)}</span>
                      </div>
                      <p className="font-semibold">{cita.lead_name || 'Lead'}</p>
                      <p className="text-sm text-slate-400">{cita.property_name} • 👤 {vendedor?.name?.split(' ')[0] || 'Sin asignar'}</p>
                      <p className="text-xs text-slate-400">📱 {cita.lead_phone}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {/* Boton Cambiar Cita */}
                      <button
                        onClick={() => {
                          setInputModal({
                            title: `Cambiar cita de ${cita.lead_name}`,
                            fields: [
                              { name: 'fecha', label: 'Nueva fecha', type: 'date', defaultValue: cita.scheduled_date },
                              { name: 'hora', label: 'Nueva hora', type: 'time', defaultValue: cita.scheduled_time?.slice(0, 5) },
                              { name: 'motivo', label: 'Motivo del cambio', type: 'textarea' }
                            ],
                            onSubmit: async (values) => {
                              try {
                                await supabase.from('appointments').update({
                                  scheduled_date: values.fecha,
                                  scheduled_time: values.hora
                                }).eq('id', cita.id)

                                await safeFetch(`${API_BASE}/api/appointments/notify-change`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    appointment_id: cita.id,
                                    lead_name: cita.lead_name,
                                    lead_phone: cita.lead_phone,
                                    vendedor_phone: vendedor?.phone,
                                    vendedor_name: vendedor?.name,
                                    old_date: cita.scheduled_date,
                                    old_time: cita.scheduled_time,
                                    new_date: values.fecha,
                                    new_time: values.hora,
                                    property: cita.property_name,
                                    nota: values.motivo,
                                    coordinador_name: currentUser?.name || 'Coordinador',
                                    action: 'cambio'
                                  })
                                })

                                setAppointments(appointments.map(a =>
                                  a.id === cita.id ? { ...a, scheduled_date: values.fecha, scheduled_time: values.hora } : a
                                ))

                                showToast(`Cita reprogramada. Notificacion enviada a ${vendedor?.name?.split(' ')[0]} y ${cita.lead_name}`, 'success')
                              } catch (e) {
                                showToast('Error al cambiar cita: ' + e, 'error')
                              }
                            }
                          })
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium flex items-center gap-1"
                      >
                        <EditIcon size={14} /> Cambiar
                      </button>
                      {/* Boton Cancelar Cita */}
                      <button
                        onClick={() => {
                          const tipoTextoCita = (cita as any).appointment_type === 'llamada' ? 'llamada' : 'cita';
                          setInputModal({
                            title: `Cancelar ${tipoTextoCita} de ${cita.lead_name}`,
                            fields: [
                              { name: 'motivo', label: 'Motivo de cancelacion', type: 'textarea' }
                            ],
                            onSubmit: async (values) => {
                              if (!values.motivo) return
                              try {
                                await supabase.from('appointments').update({
                                  status: 'cancelled'
                                }).eq('id', cita.id)

                                await safeFetch(`${API_BASE}/api/appointments/notify-change`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    appointment_id: cita.id,
                                    lead_name: cita.lead_name,
                                    lead_phone: cita.lead_phone,
                                    vendedor_phone: vendedor?.phone,
                                    vendedor_name: vendedor?.name,
                                    old_date: cita.scheduled_date,
                                    old_time: cita.scheduled_time,
                                    property: cita.property_name,
                                    nota: values.motivo,
                                    coordinador_name: currentUser?.name || 'Coordinador',
                                    action: 'cancelacion'
                                  })
                                })

                                setAppointments(appointments.map(a =>
                                  a.id === cita.id ? { ...a, status: 'cancelled' } : a
                                ))

                                showToast(`Cita cancelada. Notificacion enviada a ${vendedor?.name?.split(' ')[0]} y ${cita.lead_name}`, 'success')
                              } catch (e) {
                                showToast('Error al cancelar cita: ' + e, 'error')
                              }
                            }
                          })
                        }}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-medium flex items-center gap-1"
                      >
                        <X size={14} /> Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          {appointments.filter(a => {
            const citaDate = new Date(a.scheduled_date)
            const today = new Date()
            const in7Days = new Date()
            in7Days.setDate(in7Days.getDate() + 7)
            return citaDate >= today && citaDate <= in7Days && a.status === 'scheduled'
          }).length === 0 && (
            <div className="text-center py-8">
              <Calendar size={28} className="mx-auto mb-2 text-slate-600" />
              <p className="text-slate-400 text-sm">Sin citas en los proximos 7 dias</p>
              <button onClick={() => setView('calendar')} className="mt-3 text-xs text-blue-400 hover:text-blue-300">Ver calendario</button>
            </div>
          )}
        </div>
      </div>

      {/* RESUMEN RAPIDO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-400">{leads.filter(l => l.status === 'new').length}</p>
          <p className="text-sm text-slate-400">Leads Nuevos</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-yellow-400">{leads.filter(l => !l.assigned_to && l.status !== 'closed' && l.status !== 'fallen').length}</p>
          <p className="text-sm text-slate-400">Sin Asignar</p>
        </div>
        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-purple-400">
            {appointments.filter(a => {
              const citaDate = new Date(a.scheduled_date)
              const today = new Date()
              return citaDate.toDateString() === today.toDateString() && a.status === 'scheduled'
            }).length}
          </p>
          <p className="text-sm text-slate-400">Citas Hoy</p>
        </div>
        <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{team.filter(t => t.role === 'vendedor' && t.active && t.is_on_duty).length}</p>
          <p className="text-sm text-slate-400">De Guardia</p>
        </div>
      </div>

      {/* LEADS RECIENTES - Con opcion de agregar notas */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <MessageSquare size={24} className="text-orange-400" /> Leads Recientes (Agregar Notas)
        </h3>
        <div className="space-y-3 max-h-96 overflow-auto">
          {leads
            .filter(l => l.status !== 'closed' && l.status !== 'fallen')
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 15)
            .map(lead => {
              const vendedor = team.find(t => t.id === lead.assigned_to)
              return (
                <div key={lead.id} className="bg-slate-700/50 p-4 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{lead.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${lead.status === 'new' ? 'bg-blue-600' : lead.status === 'contacted' ? 'bg-yellow-600' : lead.status === 'qualified' ? 'bg-green-600' : 'bg-slate-600'}`}>
                          {STATUS_LABELS[lead.status] || lead.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">{lead.phone} • {lead.property_interest || 'Sin desarrollo'}</p>
                      <p className="text-xs text-slate-400">
                        👤 {vendedor?.name?.split(' ')[0] || 'Sin asignar'} •
                        📅 {new Date(lead.created_at).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {/* Boton Agregar Nota */}
                      <button
                        onClick={async () => {
                          setInputModal({
                            title: `Nota para ${lead.name}`,
                            fields: [
                              { name: 'nota', label: `Se enviara al vendedor ${vendedor?.name?.split(' ')[0] || 'asignado'} por WhatsApp`, type: 'textarea' }
                            ],
                            onSubmit: async (values) => {
                              if (!values.nota) return
                              try {
                                const notasActuales = lead.notes || {}
                                const nuevasNotas = {
                                  ...notasActuales,
                                  notas_coordinador: [
                                    ...(notasActuales.notas_coordinador || []),
                                    {
                                      texto: values.nota,
                                      fecha: new Date().toISOString(),
                                      autor: currentUser?.name || 'Coordinador'
                                    }
                                  ]
                                }

                                await supabase.from('leads').update({ notes: nuevasNotas }).eq('id', lead.id)

                                if (vendedor?.phone) {
                                  await safeFetch(`${API_BASE}/api/leads/notify-note`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      lead_name: lead.name,
                                      lead_phone: lead.phone,
                                      vendedor_phone: vendedor.phone,
                                      vendedor_name: vendedor.name,
                                      nota: values.nota,
                                      coordinador_name: currentUser?.name || 'Coordinador'
                                    })
                                  })
                                }

                                setLeads(leads.map(l => l.id === lead.id ? { ...l, notes: nuevasNotas } : l))
                                showToast(`Nota agregada. Notificacion enviada a ${vendedor?.name?.split(' ')[0] || 'vendedor'}`, 'success')
                              } catch (e) {
                                showToast('Error: ' + e, 'error')
                              }
                            }
                          })
                        }}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 rounded-lg text-xs font-medium flex items-center gap-1"
                      >
                        <MessageSquare size={14} /> Nota
                      </button>
                      {/* Boton Reasignar */}
                      <select
                        className="px-2 py-1.5 bg-slate-600 hover:bg-slate-500 rounded-lg text-xs"
                        value={lead.assigned_to || ''}
                        onChange={(e) => {
                          const nuevoVendedorId = e.target.value
                          if (!nuevoVendedorId) return

                          const nuevoVendedor = team.find(t => t.id === nuevoVendedorId)
                          setInputModal({
                            title: `Reasignar ${lead.name} a ${nuevoVendedor?.name?.split(' ')[0]}`,
                            fields: [
                              { name: 'nota', label: 'Nota para el nuevo vendedor', type: 'textarea' }
                            ],
                            onSubmit: async (values) => {
                              try {
                                await supabase.from('leads').update({ assigned_to: nuevoVendedorId }).eq('id', lead.id)

                                if (nuevoVendedor?.phone) {
                                  await safeFetch(`${API_BASE}/api/leads/notify-reassign`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      lead_name: lead.name,
                                      lead_phone: lead.phone,
                                      property_interest: lead.property_interest,
                                      vendedor_phone: nuevoVendedor.phone,
                                      vendedor_name: nuevoVendedor.name,
                                      nota: values.nota || 'Reasignado por coordinador',
                                      coordinador_name: currentUser?.name || 'Coordinador'
                                    })
                                  })
                                }

                                setLeads(leads.map(l => l.id === lead.id ? { ...l, assigned_to: nuevoVendedorId } : l))
                                showToast(`Lead reasignado a ${nuevoVendedor?.name?.split(' ')[0]}. Notificacion enviada`, 'success')
                              } catch (e) {
                                showToast('Error: ' + e, 'error')
                              }
                            }
                          })
                        }}
                      >
                        <option value="">Reasignar...</option>
                        {team.filter(t => t.role === 'vendedor' && t.active && t.id !== lead.assigned_to).map(v => (
                          <option key={v.id} value={v.id}>{v.name?.split(' ')[0] || 'Sin nombre'}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
