import { useState } from 'react'
import { useCrm } from '../context/CrmContext'
import type { MortgageApplication, Lead, Property, TeamMember } from '../types/crm'
import { Plus, Edit, X, Save, Clock, AlertTriangle, ArrowRight, CheckCircle, XCircle, DollarSign } from 'lucide-react'

const mortgageStatuses = [
  { key: 'pending', label: 'Pendiente', icon: Clock, color: 'bg-gray-500' },
  { key: 'in_review', label: 'En Revision', icon: AlertTriangle, color: 'bg-yellow-500' },
  { key: 'sent_to_bank', label: 'Enviado a Banco', icon: ArrowRight, color: 'bg-blue-500' },
  { key: 'approved', label: 'Aprobado', icon: CheckCircle, color: 'bg-green-500' },
  { key: 'rejected', label: 'Rechazado', icon: XCircle, color: 'bg-red-500' }
]

export default function MortgageView() {
  const { mortgages, leads, team, properties, permisos, saveMortgage, updateMortgageStatus, getDaysInStatus, showToast, filteredMortgages, currentUser } = useCrm()

  const [mortgageDetailId, setMortgageDetailId] = useState<string | null>(null)
  const [mortgageCalc, setMortgageCalc] = useState({ precio: 2000000, enganche: 20, plazo: 20, tasa: 11.5 })
  const [mortgageDragId, setMortgageDragId] = useState<string | null>(null)
  const [mortgageDragOverCol, setMortgageDragOverCol] = useState<string | null>(null)
  const [showNewMortgage, setShowNewMortgage] = useState(false)
  const [editingMortgage, setEditingMortgage] = useState<MortgageApplication | null>(null)

  const filteredMortgagesForRole = currentUser?.role === 'asesor'
    ? mortgages.filter(m => m.assigned_advisor_id === currentUser.id)
    : mortgages
  const approvedCount = filteredMortgagesForRole.filter(m => m.status === 'approved').length
  const inProcessCount = filteredMortgagesForRole.filter(m => ['pending','in_review','sent_to_bank'].includes(m.status)).length
  const completedMortgages = filteredMortgagesForRole.filter(m => ['approved','rejected'].includes(m.status) && m.created_at && m.decision_at)
  const avgDays = completedMortgages.length > 0
    ? Math.round(completedMortgages.reduce((s, m) => s + (new Date(m.decision_at).getTime() - new Date(m.created_at).getTime()) / (1000*60*60*24), 0) / completedMortgages.length)
    : 0
  const selectedMortgage = mortgageDetailId ? filteredMortgagesForRole.find(m => m.id === mortgageDetailId) : null
  const calcMensualidad = (() => {
    const p = mortgageCalc.precio * (1 - mortgageCalc.enganche / 100)
    const r = mortgageCalc.tasa / 100 / 12
    const n = mortgageCalc.plazo * 12
    if (r === 0) return p / n
    return p * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  })()
  const calcTotal = calcMensualidad * mortgageCalc.plazo * 12
  const calcIntereses = calcTotal - mortgageCalc.precio * (1 - mortgageCalc.enganche / 100)
  const mortStatusTimeline = ['pending','in_review','sent_to_bank','approved']

  const asesores = team.filter(t => t.role === 'asesor')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Hipotecas ({filteredMortgagesForRole.length})</h2>
        {['admin', 'coordinador', 'asesor'].includes(currentUser?.role || '') ? (
          <button onClick={() => setShowNewMortgage(true)} className="bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2">
            <Plus size={20} /> Nueva Solicitud
          </button>
        ) : (
          <span className="text-xs text-slate-400 bg-slate-700 px-3 py-2 rounded-lg">Solo lectura</span>
        )}
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="kpi-card bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 rounded-2xl">
          <p className="text-slate-400 text-xs mb-1">Total Solicitudes</p>
          <p className="text-2xl font-bold">{filteredMortgagesForRole.length}</p>
        </div>
        <div className="kpi-card bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 rounded-2xl">
          <p className="text-slate-400 text-xs mb-1">Aprobadas</p>
          <p className="text-2xl font-bold text-green-400">{approvedCount}</p>
          <p className="text-xs text-slate-500">{filteredMortgagesForRole.length > 0 ? Math.round(approvedCount/filteredMortgagesForRole.length*100) : 0}% del total</p>
        </div>
        <div className="kpi-card bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 rounded-2xl">
          <p className="text-slate-400 text-xs mb-1">En Proceso</p>
          <p className="text-2xl font-bold text-blue-400">{inProcessCount}</p>
        </div>
        <div className="kpi-card bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 rounded-2xl">
          <p className="text-slate-400 text-xs mb-1">Tiempo Promedio</p>
          <p className="text-2xl font-bold">{avgDays}d</p>
          <p className="text-xs text-slate-500">hasta resolucion</p>
        </div>
      </div>

      {/* Kanban with drag & drop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {mortgageStatuses.map(status => {
          const StatusIcon = status.icon
          const statusMortgages = filteredMortgagesForRole.filter(m => m.status === status.key)
          return (
            <div
              key={status.key}
              className={`bg-slate-800/50 backdrop-blur-sm border rounded-2xl p-4 transition-all ${mortgageDragOverCol === status.key ? 'kanban-column-highlight' : 'border-slate-700/50'}`}
              onDragOver={e => { e.preventDefault(); setMortgageDragOverCol(status.key) }}
              onDragLeave={() => setMortgageDragOverCol(null)}
              onDrop={async e => {
                e.preventDefault(); setMortgageDragOverCol(null)
                if (mortgageDragId && mortgageDragId !== status.key) {
                  const m = mortgages.find(x => x.id === mortgageDragId)
                  if (m && m.status !== status.key) {
                    await updateMortgageStatus(mortgageDragId, status.key)
                    showToast(`${m.lead_name} movido a ${status.label}`, 'success')
                  }
                }
                setMortgageDragId(null)
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <StatusIcon className="text-white" size={20} />
                <h3 className="font-semibold text-sm">{status.label}</h3>
                <span className={`${status.color} text-xs px-2 py-1 rounded-full ml-auto`}>{statusMortgages.length}</span>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {statusMortgages.map(mortgage => {
                  const daysInStatus = getDaysInStatus(mortgage)
                  return (
                    <div
                      key={mortgage.id}
                      draggable={['admin','coordinador','asesor'].includes(currentUser?.role || '')}
                      onDragStart={() => setMortgageDragId(mortgage.id)}
                      onDragEnd={() => { setMortgageDragId(null); setMortgageDragOverCol(null) }}
                      onClick={() => setMortgageDetailId(mortgage.id)}
                      className={`kanban-card bg-slate-700 p-3 rounded-xl relative cursor-pointer ${mortgageDragId === mortgage.id ? 'dragging' : ''}`}
                    >
                      {daysInStatus > 3 && !['approved','rejected'].includes(mortgage.status) && (
                        <AlertTriangle className="absolute top-2 right-2 text-red-400" size={14} />
                      )}
                      <p className="font-semibold text-sm">{mortgage.lead_name}</p>
                      <p className="text-xs text-slate-400">{mortgage.property_name}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-slate-400">${(mortgage.requested_amount || 0).toLocaleString('es-MX')}</p>
                        <p className="text-[10px] text-slate-500">{daysInStatus}d</p>
                      </div>
                      {mortgage.bank && <p className="text-[10px] text-blue-400 mt-1">{mortgage.bank}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mortgage Detail Modal */}
      {/* TODO: Add <DocumentManager entityType="mortgage" entityId={selectedMortgage.id} currentUser={...} /> inside the modal below to show documents per mortgage */}
      {selectedMortgage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setMortgageDetailId(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold">{selectedMortgage.lead_name}</h3>
                <p className="text-sm text-slate-400">{selectedMortgage.lead_phone} · {selectedMortgage.property_name}</p>
                <p className="text-sm text-blue-400 mt-1">${(selectedMortgage.requested_amount || 0).toLocaleString('es-MX')} · {selectedMortgage.bank || 'Sin banco'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setMortgageDetailId(null); setEditingMortgage(selectedMortgage) }} className="bg-blue-600 px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"><Edit size={14} /> Editar</button>
                <button onClick={() => setMortgageDetailId(null)} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-300 mb-3">Progreso</h4>
              <div className="flex items-center gap-1">
                {mortStatusTimeline.map((st, i) => {
                  const stIdx = mortStatusTimeline.indexOf(selectedMortgage.status)
                  const isActive = i <= stIdx || selectedMortgage.status === 'approved'
                  const isCurrent = st === selectedMortgage.status
                  const dateMap: Record<string, string|null> = { pending: selectedMortgage.pending_at, in_review: selectedMortgage.in_review_at, sent_to_bank: selectedMortgage.sent_to_bank_at, approved: selectedMortgage.decision_at }
                  const statusLabel: Record<string, string> = { pending: 'Pendiente', in_review: 'Revision', sent_to_bank: 'En Banco', approved: 'Aprobado' }
                  return (
                    <div key={st} className="flex-1 text-center">
                      <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                        selectedMortgage.status === 'rejected' && i > stIdx ? 'border-red-500/30 bg-red-500/10 text-red-400' :
                        isCurrent ? 'border-blue-500 bg-blue-500 text-white mortgage-timeline-dot active' :
                        isActive ? 'border-green-500 bg-green-500/20 text-green-400' :
                        'border-slate-600 bg-slate-700 text-slate-500'
                      }`}>{i + 1}</div>
                      <p className={`text-[10px] mt-1 ${isCurrent ? 'text-blue-400 font-medium' : 'text-slate-500'}`}>{statusLabel[st]}</p>
                      {dateMap[st] && <p className="text-[9px] text-slate-600">{new Date(dateMap[st]!).toLocaleDateString('es-MX', { day:'numeric', month:'short' })}</p>}
                    </div>
                  )
                })}
                {selectedMortgage.status === 'rejected' && (
                  <div className="flex-1 text-center">
                    <div className="mx-auto w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-red-500 bg-red-500 text-white"><XCircle size={14} /></div>
                    <p className="text-[10px] mt-1 text-red-400 font-medium">Rechazado</p>
                    {selectedMortgage.decision_at && <p className="text-[9px] text-slate-600">{new Date(selectedMortgage.decision_at).toLocaleDateString('es-MX', { day:'numeric', month:'short' })}</p>}
                  </div>
                )}
              </div>
              {selectedMortgage.status === 'rejected' && selectedMortgage.status_notes && (
                <p className="text-xs text-red-400/80 mt-2 bg-red-500/10 p-2 rounded-lg">Motivo: {selectedMortgage.status_notes}</p>
              )}
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-700/50 p-3 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Ingreso Mensual</p>
                <p className="text-sm font-semibold">${(selectedMortgage.monthly_income || 0).toLocaleString('es-MX')}</p>
              </div>
              <div className="bg-slate-700/50 p-3 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Enganche</p>
                <p className="text-sm font-semibold">${(selectedMortgage.down_payment || 0).toLocaleString('es-MX')}</p>
              </div>
              <div className="bg-slate-700/50 p-3 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Plazo</p>
                <p className="text-sm font-semibold">{selectedMortgage.credit_term_years || 20} anos</p>
              </div>
              <div className="bg-slate-700/50 p-3 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Pago Estimado</p>
                <p className="text-sm font-semibold text-green-400">${(selectedMortgage.estimated_monthly_payment || 0).toLocaleString('es-MX')}/mes</p>
              </div>
            </div>

            {/* Financing Calculator */}
            <div className="bg-slate-700/30 border border-slate-600/50 p-4 rounded-xl mb-6">
              <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><DollarSign size={14} /> Calculadora</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Precio</label>
                  <input type="number" value={mortgageCalc.precio} onChange={e => setMortgageCalc(p => ({...p, precio: +e.target.value}))} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Enganche %</label>
                  <input type="number" value={mortgageCalc.enganche} onChange={e => setMortgageCalc(p => ({...p, enganche: +e.target.value}))} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm" min={0} max={100} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Plazo (anos)</label>
                  <input type="number" value={mortgageCalc.plazo} onChange={e => setMortgageCalc(p => ({...p, plazo: +e.target.value}))} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm" min={1} max={30} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase">Tasa Anual %</label>
                  <input type="number" value={mortgageCalc.tasa} onChange={e => setMortgageCalc(p => ({...p, tasa: +e.target.value}))} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm" step={0.1} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-800 p-2 rounded-lg text-center">
                  <p className="text-[9px] text-slate-400">Mensualidad</p>
                  <p className="text-sm font-bold text-green-400">${Math.round(calcMensualidad).toLocaleString('es-MX')}</p>
                </div>
                <div className="bg-slate-800 p-2 rounded-lg text-center">
                  <p className="text-[9px] text-slate-400">Total a Pagar</p>
                  <p className="text-sm font-bold">${Math.round(calcTotal).toLocaleString('es-MX')}</p>
                </div>
                <div className="bg-slate-800 p-2 rounded-lg text-center">
                  <p className="text-[9px] text-slate-400">Intereses</p>
                  <p className="text-sm font-bold text-red-400">${Math.round(calcIntereses).toLocaleString('es-MX')}</p>
                </div>
              </div>
            </div>

            {/* Advisor Info */}
            {selectedMortgage.assigned_advisor_name && (
              <div className="bg-slate-700/30 p-3 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Asesor Asignado</p>
                <p className="text-sm font-semibold">{selectedMortgage.assigned_advisor_name}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New / Edit Mortgage Modal */}
      {(showNewMortgage || editingMortgage) && (
        <MortgageModal
          mortgage={editingMortgage}
          leads={leads}
          properties={properties}
          asesores={asesores}
          onSave={(m) => {
            saveMortgage(m)
            setShowNewMortgage(false)
            setEditingMortgage(null)
          }}
          onClose={() => {
            setShowNewMortgage(false)
            setEditingMortgage(null)
          }}
        />
      )}
    </div>
  )
}

// ---- MortgageModal (inlined from App.tsx) ----

function MortgageModal({ mortgage, leads, properties, asesores, onSave, onClose }: {
  mortgage: MortgageApplication | null,
  leads: Lead[],
  properties: Property[],
  asesores: TeamMember[],
  onSave: (m: Partial<MortgageApplication>) => void,
  onClose: () => void
}) {
  const [form, setForm] = useState<Partial<MortgageApplication>>(mortgage || {
    lead_id: '', lead_name: '', lead_phone: '', property_id: '', property_name: '',
    monthly_income: 0, additional_income: 0, current_debt: 0, down_payment: 0,
    requested_amount: 0, credit_term_years: 20, assigned_advisor_id: '',
    assigned_advisor_name: '', bank: '', status: 'pending', status_notes: ''
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{mortgage ? 'Editar Solicitud' : 'Nueva Solicitud'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Lead</label>
            <select value={form.lead_id || ''} onChange={e => {
              const lead = leads.find(l => l.id === e.target.value)
              setForm({...form, lead_id: e.target.value, lead_name: lead?.name || '', lead_phone: lead?.phone || ''})
            }} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">Seleccionar lead</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name || l.phone}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Propiedad</label>
            <select value={form.property_id || ''} onChange={e => {
              const prop = properties.find(p => p.id === e.target.value)
              setForm({...form, property_id: e.target.value, property_name: prop?.name || '', requested_amount: prop?.price || 0})
            }} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">Seleccionar propiedad</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Ingreso Mensual</label>
            <input type="number" value={form.monthly_income || ''} onChange={e => setForm({...form, monthly_income: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Deuda Actual</label>
            <input type="number" value={form.current_debt || ''} onChange={e => setForm({...form, current_debt: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Enganche</label>
            <input type="number" value={form.down_payment || ''} onChange={e => setForm({...form, down_payment: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Asesor</label>
            <select value={form.assigned_advisor_id || ''} onChange={e => {
              const asesor = asesores.find(a => a.id === e.target.value)
              setForm({...form, assigned_advisor_id: e.target.value, assigned_advisor_name: asesor?.name || ''})
            }} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">Seleccionar asesor</option>
              {asesores.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Estado</label>
            <select value={form.status || ''} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="pending">Pendiente</option>
              <option value="in_review">En Revision</option>
              <option value="sent_to_bank">Enviado a Banco</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Banco</label>
            <input value={form.bank || ''} onChange={e => setForm({...form, bank: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
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
