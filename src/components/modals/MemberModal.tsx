import { useState } from 'react'
import { X, Save } from 'lucide-react'
import type { TeamMember } from '../../types/crm'

function MemberModal({ member, onSave, onClose }: { member: TeamMember | null, onSave: (m: Partial<TeamMember>) => void, onClose: () => void }) {
  const [form, setForm] = useState<Partial<TeamMember>>(member || {
    name: '', phone: '', role: 'vendedor', sales_count: 0, commission: 0, active: true, photo_url: '', email: '',
    vacation_start: '', vacation_end: '', is_on_duty: false, work_start: '09:00', work_end: '18:00', working_days: [1,2,3,4,5]
  })

  const diasSemana = [
    { value: 0, label: 'Dom' },
    { value: 1, label: 'Lun' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Mie' },
    { value: 4, label: 'Jue' },
    { value: 5, label: 'Vie' },
    { value: 6, label: 'Sab' }
  ]

  const toggleDay = (day: number) => {
    const current = form.working_days || []
    if (current.includes(day)) {
      setForm({...form, working_days: current.filter(d => d !== day)})
    } else {
      setForm({...form, working_days: [...current, day].sort()})
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{member ? 'Editar Miembro' : 'Nuevo Miembro'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X /></button>
        </div>
        <div className="space-y-4">
          {/* Datos basicos */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nombre</label>
            <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <input type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="nombre@gruposantarita.com" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">WhatsApp</label>
            <input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="5215512345678" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Rol</label>
            <select value={form.role || ''} onChange={e => setForm({...form, role: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="vendedor">Vendedor</option>
              <option value="asesor">Asesor Hipotecario</option>
              <option value="coordinador">Coordinador</option>
              <option value="agencia">Marketing / Agencia</option>
              <option value="gerente">Gerente</option>
            </select>
          </div>

          {/* Seccion de disponibilidad */}
          <div className="border-t border-slate-600 pt-4 mt-4">
            <h4 className="font-semibold text-slate-300 mb-3">Disponibilidad</h4>

            {/* Horario de trabajo */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Hora entrada</label>
                <input type="time" value={form.work_start || '09:00'} onChange={e => setForm({...form, work_start: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Hora salida</label>
                <input type="time" value={form.work_end || '18:00'} onChange={e => setForm({...form, work_end: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
            </div>

            {/* Dias laborales */}
            <div className="mb-3">
              <label className="block text-sm text-slate-400 mb-2">Dias laborales</label>
              <div className="flex gap-1">
                {diasSemana.map(dia => (
                  <button
                    key={dia.value}
                    type="button"
                    onClick={() => toggleDay(dia.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      (form.working_days || []).includes(dia.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {dia.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vacaciones */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Vacaciones desde</label>
                <input type="date" value={form.vacation_start || ''} onChange={e => setForm({...form, vacation_start: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Vacaciones hasta</label>
                <input type="date" value={form.vacation_end || ''} onChange={e => setForm({...form, vacation_end: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
            </div>

            {/* Guardia y Activo */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 bg-orange-600/20 p-3 rounded-xl">
                <input type="checkbox" checked={form.is_on_duty || false} onChange={e => setForm({...form, is_on_duty: e.target.checked})} className="w-5 h-5" />
                <label className="text-orange-300">De guardia (prioridad en asignacion)</label>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="w-5 h-5" />
                <label>Activo (recibe notificaciones y leads)</label>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-gray-600">Cancelar</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Save size={20} /> Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

export default MemberModal
