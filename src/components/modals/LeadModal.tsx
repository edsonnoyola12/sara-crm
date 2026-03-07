import { useState } from 'react'
import { X, Save } from 'lucide-react'
import type { Lead, Property, TeamMember } from '../../types/crm'

function LeadModal({ lead, properties, team, onSave, onClose }: {
  lead: Lead,
  properties: Property[],
  team: TeamMember[],
  onSave: (l: Partial<Lead>) => void,
  onClose: () => void
}) {
  const [form, setForm] = useState<Partial<Lead>>({
    id: lead.id,
    name: lead.name || '',
    phone: lead.phone || '',
    property_interest: lead.property_interest || '',
    budget: lead.budget || '',
    score: lead.score || 0,
    status: lead.status || 'new',
    source: lead.source || '',
    assigned_to: lead.assigned_to || '',
    credit_status: lead.credit_status || ''
  })

  const statusOptions = [
    { value: 'new', label: 'Nuevo' },
    { value: 'contacted', label: 'Contactado' },
    { value: 'qualified', label: 'Calificado' },
    { value: 'scheduled', label: 'Cita Agendada' },
    { value: 'visited', label: 'Visito' },
    { value: 'negotiation', label: 'Negociacion' },
    { value: 'reserved', label: 'Reservado' },
    { value: 'closed', label: 'Cerrado' },
    { value: 'delivered', label: 'Entregado' },
    { value: 'fallen', label: 'Caido' }
  ]

  const creditOptions = [
    { value: '', label: 'Sin informacion' },
    { value: 'none', label: 'Sin credito' },
    { value: 'active', label: 'Activo' },
    { value: 'approved', label: 'Aprobado' },
    { value: 'rejected', label: 'Rechazado' }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Editar Lead</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nombre</label>
            <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Telefono</label>
            <input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Interes en propiedad</label>
            <select value={form.property_interest || ''} onChange={e => setForm({...form, property_interest: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">Seleccionar...</option>
              {properties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Presupuesto</label>
            <input value={form.budget || ''} onChange={e => setForm({...form, budget: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="ej: 500,000 - 800,000" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Score (1-10)</label>
            <input type="number" min="1" max="10" value={form.score || ''} onChange={e => setForm({...form, score: parseInt(e.target.value) || 0})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Estado</label>
            <select value={form.status || ''} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Fuente</label>
            <input value={form.source || ''} onChange={e => setForm({...form, source: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="ej: Facebook, Referido" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Asignado a</label>
            <select value={form.assigned_to || ''} onChange={e => setForm({...form, assigned_to: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">Sin asignar</option>
              {team.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Estado de credito</label>
            <select value={form.credit_status || ''} onChange={e => setForm({...form, credit_status: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              {creditOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
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

export default LeadModal
