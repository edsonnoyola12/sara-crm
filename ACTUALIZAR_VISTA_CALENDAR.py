with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Agregar interface Appointment después de Campaign
insert_after = content.find("interface Campaign {")
insert_after = content.find("}", insert_after) + 1

appointment_interface = """

interface Appointment {
  id: string
  lead_id: string
  lead_phone: string
  lead_name?: string
  property_id: string
  property_name: string
  vendedor_id?: string
  vendedor_name?: string
  asesor_id?: string
  asesor_name?: string
  scheduled_date: string
  scheduled_time: string
  status: 'scheduled' | 'cancelled' | 'completed'
  appointment_type: string
  duration_minutes: number
  google_event_vendedor_id?: string
  google_event_asesor_id?: string
  cancelled_by?: string
  created_at: string
  updated_at: string
}
"""

content = content[:insert_after] + appointment_interface + content[insert_after:]

# 2. Agregar estado appointments
insert_state = content.find("const [calendarEvents, setCalendarEvents] = useState<any[]>([])") 
insert_state = content.find("\n", insert_state) + 1

appointments_state = "  const [appointments, setAppointments] = useState<Appointment[]>([])\n"

content = content[:insert_state] + appointments_state + content[insert_state:]

# 3. Agregar fetch de appointments en loadData
old_loaddata = "const calData = await fetch("
insert_before_calendar = content.find(old_loaddata)

fetch_appointments = """    // Cargar citas de Supabase
    const { data: appointmentsData } = await supabase
      .from('appointments')
      .select('*')
      .order('scheduled_date', { ascending: true })
    setAppointments(appointmentsData || [])

    """

content = content[:insert_before_calendar] + fetch_appointments + content[insert_before_calendar:]

# 4. Actualizar la vista calendar
old_calendar_view = """        {view === 'calendar' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Calendario de Citas ({calendarEvents.length})</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {calendarEvents.map((event: any) => {
                const startDate = new Date(event.start?.dateTime || event.start?.date)
                return (
                  <div key={event.id} className="bg-gray-800 p-4 rounded-xl flex items-center justify-between hover:bg-gray-700">
                    <div className="flex items-center gap-4">
                      <CalendarIcon className="text-blue-500" size={32} />
                      <div>
                        <p className="font-bold">{event.summary}</p>
                        <p className="text-gray-400 text-sm">{event.description || 'Sin descripción'}</p>
                        <p className="text-blue-400 text-sm mt-1">📅 {startDate.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })} - 🕐 {startDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteCalendarEvent(event.id)} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={20} /></button>
                  </div>
                )
              })}
              {calendarEvents.length === 0 && (
                <div className="text-center py-12">
                  <CalendarIcon size={64} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 text-lg">Sin citas agendadas</p>
                </div>
              )}
            </div>
          </div>
        )}"""

new_calendar_view = """        {view === 'calendar' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Calendario de Citas</h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-green-600 rounded-lg text-sm">Programadas: {appointments.filter(a => a.status === 'scheduled').length}</span>
                <span className="px-3 py-1 bg-red-600 rounded-lg text-sm">Canceladas: {appointments.filter(a => a.status === 'cancelled').length}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {appointments.filter(a => a.status === 'scheduled').map((appt) => {
                const fecha = new Date(appt.scheduled_date + 'T' + appt.scheduled_time)
                return (
                  <div key={appt.id} className="bg-gray-800 p-6 rounded-xl hover:bg-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <CalendarIcon className="text-blue-500 mt-1" size={32} />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-bold text-lg">{appt.property_name}</p>
                            <span className="px-2 py-1 bg-blue-600 rounded text-xs">{appt.appointment_type}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400">👤 Cliente</p>
                              <p className="font-semibold">{appt.lead_phone}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">📅 Fecha y Hora</p>
                              <p className="font-semibold text-blue-400">
                                {fecha.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })} - {fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {appt.vendedor_name && (
                              <div>
                                <p className="text-gray-400">🏢 Vendedor</p>
                                <p className="font-semibold">{appt.vendedor_name}</p>
                              </div>
                            )}
                            {appt.asesor_name && (
                              <div>
                                <p className="text-gray-400">💼 Asesor</p>
                                <p className="font-semibold">{appt.asesor_name}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={async () => {
                          if (confirm('¿Cancelar esta cita?')) {
                            await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appt.id)
                            if (appt.google_event_vendedor_id || appt.google_event_asesor_id) {
                              // Llamar al backend para cancelar en Calendar
                              await fetch('https://sara-backend.edson-633.workers.dev/api/cancel-appointment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  appointmentId: appt.id,
                                  vendedorEventId: appt.google_event_vendedor_id,
                                  asesorEventId: appt.google_event_asesor_id
                                })
                              })
                            }
                            loadData()
                          }
                        }}
                        className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded-lg"
                      >
                        <XCircle size={24} />
                      </button>
                    </div>
                  </div>
                )
              })}
              
              {appointments.filter(a => a.status === 'scheduled').length === 0 && (
                <div className="text-center py-12">
                  <CalendarIcon size={64} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 text-lg">Sin citas programadas</p>
                </div>
              )}
            </div>

            {/* Citas Canceladas */}
            {appointments.filter(a => a.status === 'cancelled').length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4 text-gray-400">Citas Canceladas</h3>
                <div className="space-y-2">
                  {appointments.filter(a => a.status === 'cancelled').map((appt) => {
                    const fecha = new Date(appt.scheduled_date + 'T' + appt.scheduled_time)
                    return (
                      <div key={appt.id} className="bg-gray-800/50 p-4 rounded-lg opacity-60">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <XCircle className="text-red-500" size={20} />
                            <div>
                              <p className="font-semibold">{appt.property_name} - {appt.lead_phone}</p>
                              <p className="text-sm text-gray-400">
                                {fecha.toLocaleDateString('es-MX')} {fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          {appt.cancelled_by && (
                            <p className="text-xs text-gray-500">Cancelada por: {appt.cancelled_by}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}"""

content = content.replace(old_calendar_view, new_calendar_view)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("✅ Vista Calendar actualizada:")
print("   - Muestra appointments de Supabase")
print("   - Datos completos: vendedor, asesor, cliente, fecha")
print("   - Botón cancelar (actualiza DB + Calendar)")
print("   - Sección de citas canceladas")
