import { X } from 'lucide-react'
import { Lead, Property, TeamMember, Appointment, API_BASE } from '../../types/crm'

interface NewAppointmentModalProps {
  newAppointment: any
  setNewAppointment: (v: any) => void
  leads: Lead[]
  properties: Property[]
  team: TeamMember[]
  saving: boolean
  setSaving: (v: boolean) => void
  onClose: () => void
  onSaved: () => void
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
}

export function NewAppointmentModal({
  newAppointment, setNewAppointment, leads, properties, team,
  saving, setSaving, onClose, onSaved, showToast
}: NewAppointmentModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Nueva Cita</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X size={24} /></button>
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
              <option value="Oficinas Centrales">Oficinas Centrales</option>
              {[...new Set(properties.map(p => p.development || p.name))].filter(Boolean).sort().map(dev => (
                <option key={dev} value={dev}>{dev}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Fecha</label>
              <input type="date" min={new Date().toISOString().split('T')[0]}
                value={newAppointment.scheduled_date || ''}
                onChange={(e) => setNewAppointment({...newAppointment, scheduled_date: e.target.value})}
                className="w-full p-3 bg-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Hora</label>
              <input type="time" value={newAppointment.scheduled_time || ''}
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
                  body: JSON.stringify({ ...newAppointment, appointment_type: 'visita', status: 'scheduled' })
                })
                if (!response.ok) throw new Error('Error al crear')
                onClose()
                setNewAppointment({})
                onSaved()
                showToast('Cita creada y agregada a Google Calendar', 'success')
              } catch (err: any) {
                showToast('Error: ' + err.message, 'error')
              } finally { setSaving(false) }
            }}
            className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Creando...' : 'Crear Cita'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface EditAppointmentModalProps {
  appointment: Appointment
  setAppointment: (v: Appointment | null) => void
  team: TeamMember[]
  properties: Property[]
  saving: boolean
  setSaving: (v: boolean) => void
  onSaved: () => void
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void
}

export function EditAppointmentModal({
  appointment, setAppointment, team, properties,
  saving, setSaving, onSaved, showToast
}: EditAppointmentModalProps) {
  const apt = appointment as any

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setAppointment(null)}>
      <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Editar Cita</h3>
          <button onClick={() => setAppointment(null)} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X size={24} /></button>
        </div>

        <div className="bg-slate-700/50 p-4 rounded-xl mb-4">
          <p className="text-sm text-slate-400">Cliente</p>
          <p className="font-bold text-lg">{appointment.lead_name} - {appointment.lead_phone}</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Fecha</label>
              <input type="date" value={appointment.scheduled_date || ''}
                onChange={(e) => setAppointment({...appointment, scheduled_date: e.target.value})}
                className="w-full p-3 bg-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Hora</label>
              <input type="time" value={(appointment.scheduled_time || '').substring(0, 5)}
                onChange={(e) => setAppointment({...appointment, scheduled_time: e.target.value})}
                className="w-full p-3 bg-slate-700 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Desarrollo</label>
            <select value={appointment.property_name || ''}
              onChange={(e) => setAppointment({...appointment, property_name: e.target.value})}
              className="w-full p-3 bg-slate-700 rounded-lg">
              <option value="">Seleccionar...</option>
              <option value="Oficinas Centrales">Oficinas Centrales</option>
              {[...new Set(properties.map(p => p.development || p.name))].filter(Boolean).sort().map(dev => (
                <option key={dev} value={dev}>{dev}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Vendedor Asignado</label>
            <select value={appointment.vendedor_id || ''}
              onChange={(e) => {
                const vendedor = team.find(t => t.id === e.target.value);
                setAppointment({ ...appointment, vendedor_id: e.target.value, vendedor_name: vendedor?.name || '' });
              }}
              className="w-full p-3 bg-slate-700 rounded-lg">
              <option value="">Seleccionar vendedor...</option>
              {team.filter(t => t.role === 'vendedor' || t.role === 'admin').map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Tipo de Cita</label>
            <select value={apt.appointment_type || 'visita'}
              onChange={(e) => setAppointment({...appointment, appointment_type: e.target.value} as any)}
              className="w-full p-3 bg-slate-700 rounded-lg">
              <option value="visita">Visita a desarrollo</option>
              <option value="oficina">Cita en oficina</option>
              <option value="videollamada">Videollamada</option>
              <option value="firma">Firma de contrato</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Notas</label>
            <textarea value={apt.notes_text || ''}
              onChange={(e) => setAppointment({...appointment, notes_text: e.target.value} as any)}
              placeholder="Notas adicionales sobre la cita..."
              className="w-full p-3 bg-slate-700 rounded-lg h-24 resize-none"
            />
          </div>

          <label className="flex items-center gap-3 p-3 bg-green-600/20 border border-green-500/50 rounded-xl cursor-pointer">
            <input type="checkbox" checked={apt.notificar || false}
              onChange={(e) => setAppointment({...appointment, notificar: e.target.checked} as any)}
              className="w-5 h-5 rounded"
            />
            <div>
              <p className="font-semibold">Notificar por WhatsApp</p>
              <p className="text-xs text-slate-400">Enviar mensaje al cliente y vendedor con los cambios</p>
            </div>
          </label>

          <button
            disabled={saving}
            onClick={async () => {
              setSaving(true)
              try {
                const response = await fetch(`${API_BASE}/api/appointments/` + appointment.id, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    scheduled_date: appointment.scheduled_date,
                    scheduled_time: appointment.scheduled_time,
                    property_name: appointment.property_name,
                    google_event_id: appointment.google_event_vendedor_id,
                    notificar: apt.notificar,
                    lead_phone: appointment.lead_phone,
                    lead_name: appointment.lead_name,
                    vendedor_id: appointment.vendedor_id,
                    vendedor_name: appointment.vendedor_name,
                    appointment_type: apt.appointment_type,
                    notes_text: apt.notes_text
                  })
                })
                if (!response.ok) throw new Error('Error al guardar')
                setAppointment(null)
                onSaved()
                showToast(apt.notificar ? 'Cita actualizada y notificaciones enviadas por WhatsApp' : 'Cita actualizada', 'success')
              } catch (err: any) {
                showToast('Error: ' + err.message, 'error')
              } finally { setSaving(false) }
            }}
            className={`w-full py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${apt.mode === 'edit' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
