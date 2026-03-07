import { useState } from 'react'
import { Plus, Edit, Pause, Play, Send, Trash2, X, Save, Megaphone, Calendar as CalendarIcon, Users } from 'lucide-react'
import { useCrm } from '../context/CrmContext'
import type { Promotion, Lead, Property, TeamMember } from '../types/crm'
import { API_BASE, safeFetch } from '../types/crm'

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface SegmentFilters {
  status: string[]
  temperature: string[]
  desarrollos: string[]
  needs_mortgage: boolean | null
  is_buyer: boolean | null
  source: string[]
  min_score: number | null
  max_score: number | null
}

// ═══════════════════════════════════════════════════════
// MAIN VIEW
// ═══════════════════════════════════════════════════════

export default function PromotionsView() {
  const {
    promotions,
    leads,
    properties,
    team,
    savePromotion,
    deletePromotion,
    togglePromoStatus,
    showToast,
    loadData,
  } = useCrm()

  const [showNewPromotion, setShowNewPromotion] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [showSendPromoModal, setShowSendPromoModal] = useState(false)
  const [selectedPromoToSend, setSelectedPromoToSend] = useState<Promotion | null>(null)
  const [promoSending, setPromoSending] = useState(false)

  function sendPromoToSegment(promo: Promotion) {
    setSelectedPromoToSend(promo)
    setShowSendPromoModal(true)
  }

  async function sendPromoReal(segment: string, options: { sendImage: boolean; sendVideo: boolean; sendPdf: boolean; filters?: any }) {
    if (!selectedPromoToSend) return
    setPromoSending(true)

    try {
      const result = await safeFetch(`${API_BASE}/api/promotions/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotion_id: selectedPromoToSend.id,
          segment: segment,
          segment_type: options.filters?.segmentType || 'basic',
          send_image: options.sendImage,
          send_video: options.sendVideo,
          send_pdf: options.sendPdf,
        }),
      })

      if (result.success) {
        showToast(`Promocion enviada! Enviados: ${result.sent} | Errores: ${result.errors} | Total: ${result.total}`, 'success')
        loadData()
      } else {
        showToast('Error: ' + (result.error || 'Error desconocido'), 'error')
      }
    } catch (err: any) {
      showToast('Error de conexion: ' + err.message, 'error')
    } finally {
      setPromoSending(false)
      setShowSendPromoModal(false)
      setSelectedPromoToSend(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Promociones ({promotions.length})</h2>
        <button onClick={() => setShowNewPromotion(true)} className="bg-purple-600 px-4 py-2 rounded-xl hover:bg-purple-700 flex items-center gap-2">
          <Plus size={20} /> Nueva Promocion
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-green-500/50 transition-all">
          <p className="text-slate-400 mb-1">Activas</p>
          <p className="text-2xl font-bold text-green-400">{promotions.filter(p => p.status === 'active').length}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-yellow-500/50 transition-all">
          <p className="text-slate-400 mb-1">Programadas</p>
          <p className="text-2xl font-bold text-yellow-400">{promotions.filter(p => p.status === 'scheduled').length}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-blue-500/50 transition-all">
          <p className="text-slate-400 mb-1">Total Alcanzados</p>
          <p className="text-2xl font-bold text-blue-400">{promotions.reduce((acc, p) => acc + (p.total_reached || 0), 0)}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-purple-500/50 transition-all">
          <p className="text-slate-400 mb-1">Respuestas</p>
          <p className="text-2xl font-bold text-purple-400">{promotions.reduce((acc, p) => acc + (p.total_responses || 0), 0)}</p>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700">
            <tr>
              <th className="text-left p-4">Promocion</th>
              <th className="text-left p-4">Fechas</th>
              <th className="text-left p-4">Segmento</th>
              <th className="text-left p-4">Recordatorios</th>
              <th className="text-left p-4">Alcance</th>
              <th className="text-left p-4">Estado</th>
              <th className="text-left p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map(promo => {
              const startDate = new Date(promo.start_date)
              const endDate = new Date(promo.end_date)
              const today = new Date()
              const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

              return (
                <tr key={promo.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                  <td className="p-4">
                    <p className="font-semibold">{promo.name}</p>
                    <p className="text-sm text-slate-400 truncate max-w-xs" title={promo.description || promo.message}>{promo.description || promo.message}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm">{startDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} - {endDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</p>
                    {promo.status === 'active' && daysRemaining > 0 && (
                      <p className="text-xs text-yellow-400">{daysRemaining} dias restantes</p>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-blue-600/30 text-blue-400 rounded text-sm">{promo.target_segment}</span>
                  </td>
                  <td className="p-4">
                    {promo.reminder_enabled ? (
                      <span className="text-green-400 text-sm">{promo.reminder_frequency} ({promo.reminders_sent_count || 0} enviados)</span>
                    ) : (
                      <span className="text-slate-400 text-sm">Desactivados</span>
                    )}
                  </td>
                  <td className="p-4">
                    <p className="font-semibold">{promo.total_reached || 0}</p>
                    <p className="text-xs text-slate-400">{promo.total_responses || 0} respuestas</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-sm ${
                      promo.status === 'active' ? 'bg-green-600' :
                      promo.status === 'scheduled' ? 'bg-yellow-600' :
                      promo.status === 'paused' ? 'bg-orange-600' :
                      promo.status === 'completed' ? 'bg-blue-600' :
                      'bg-gray-600'
                    }`}>
                      {promo.status === 'active' ? 'Activa' :
                       promo.status === 'scheduled' ? 'Programada' :
                       promo.status === 'paused' ? 'Pausada' :
                       promo.status === 'completed' ? 'Completada' : promo.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => setEditingPromotion(promo)} className="bg-blue-600 p-2 rounded hover:bg-blue-700" title="Editar">
                        <Edit size={16} />
                      </button>
                      {promo.status === 'active' ? (
                        <button onClick={() => togglePromoStatus(promo)} className="bg-orange-600 p-2 rounded hover:bg-orange-700" title="Pausar">
                          <Pause size={16} />
                        </button>
                      ) : promo.status !== 'completed' && (
                        <button onClick={() => togglePromoStatus(promo)} className="bg-green-600 p-2 rounded hover:bg-green-700" title="Activar">
                          <Play size={16} />
                        </button>
                      )}
                      <button onClick={() => sendPromoToSegment(promo)} className="bg-purple-600 p-2 rounded hover:bg-purple-700" title="Enviar ahora">
                        <Send size={16} />
                      </button>
                      <button onClick={() => deletePromotion(promo.id)} className="bg-red-600 p-2 rounded hover:bg-red-700" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {promotions.length === 0 && (
          <div className="empty-state text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-700/50 mb-4">
              <span className="text-5xl">🎯</span>
            </div>
            <p className="text-slate-300 text-xl mb-2">No hay promociones activas</p>
            <p className="text-slate-500 text-sm mb-4">Crea descuentos y ofertas especiales para tus desarrollos</p>
            <button onClick={() => setShowNewPromotion(true)} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold">
              Crear Primera Promocion
            </button>
          </div>
        )}
      </div>

      {/* PromotionModal - edit/create */}
      {(editingPromotion || showNewPromotion) && (
        <PromotionModal
          promotion={editingPromotion}
          onSave={savePromotion}
          onClose={() => { setEditingPromotion(null); setShowNewPromotion(false) }}
          leads={leads}
          properties={properties}
        />
      )}

      {/* SendPromoModal - send to segment */}
      {showSendPromoModal && selectedPromoToSend && (
        <SendPromoModal
          promo={selectedPromoToSend}
          onSend={sendPromoReal}
          onClose={() => { setShowSendPromoModal(false); setSelectedPromoToSend(null) }}
          sending={promoSending}
          leads={leads}
          properties={properties}
          team={team}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// SEGMENT SELECTOR
// ═══════════════════════════════════════════════════════

function SegmentSelector({
  filters,
  onChange,
  leads,
  properties
}: {
  filters: SegmentFilters,
  onChange: (f: SegmentFilters) => void,
  leads: Lead[],
  properties: Property[]
}) {
  const matchingLeads = leads.filter(lead => {
    if (filters.status.length > 0 && !filters.status.includes(lead.status)) return false
    if (filters.temperature.length > 0) {
      const temp = lead.score >= 70 ? 'hot' : lead.score >= 40 ? 'warm' : 'cold'
      if (!filters.temperature.includes(temp)) return false
    }
    if (filters.desarrollos.length > 0 && lead.property_interest) {
      const matchDesarrollo = filters.desarrollos.some(d =>
        lead.property_interest?.toLowerCase().includes(d.toLowerCase())
      )
      if (!matchDesarrollo) return false
    }
    if (filters.needs_mortgage === true && lead.credit_status !== 'active' && lead.credit_status !== 'approved') return false
    if (filters.needs_mortgage === false && (lead.credit_status === 'active' || lead.credit_status === 'approved')) return false
    if (filters.is_buyer === true && lead.status !== 'closed_won' && lead.status !== 'delivered') return false
    if (filters.is_buyer === false && (lead.status === 'closed_won' || lead.status === 'delivered')) return false
    if (filters.source.length > 0 && lead.source && !filters.source.includes(lead.source)) return false
    if (filters.min_score !== null && lead.score < filters.min_score) return false
    if (filters.max_score !== null && lead.score > filters.max_score) return false
    return true
  })

  const desarrollosUnicos = [...new Set(properties.map(p => p.name).filter(Boolean))]
  const sourcesUnicos = [...new Set(leads.map(l => l.source).filter(Boolean))]

  const toggleArrayValue = (arr: string[], value: string) => {
    return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
  }

  return (
    <div className="bg-slate-700/50 rounded-xl p-4 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-600 pb-2">
        <h4 className="font-semibold text-purple-400">Segmentacion Avanzada</h4>
        <span className="bg-purple-600 px-3 py-1 rounded-full text-sm font-bold">
          {matchingLeads.length} leads
        </span>
      </div>

      {/* Status del Lead */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">Estado del Lead</label>
        <div className="flex flex-wrap gap-2">
          {['new', 'contacted', 'qualified', 'appointment_scheduled', 'closed_won', 'fallen'].map(status => (
            <button
              key={status}
              onClick={() => onChange({...filters, status: toggleArrayValue(filters.status, status)})}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                filters.status.includes(status)
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
            >
              {status === 'new' ? 'Nuevos' :
               status === 'contacted' ? 'Contactados' :
               status === 'qualified' ? 'Calificados' :
               status === 'appointment_scheduled' ? 'Cita Agendada' :
               status === 'closed_won' ? 'Compradores' :
               status === 'fallen' ? 'Caidos' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Temperatura */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">Temperatura</label>
        <div className="flex gap-2">
          {[
            { value: 'hot', label: 'HOT', color: 'bg-red-600' },
            { value: 'warm', label: 'WARM', color: 'bg-yellow-600' },
            { value: 'cold', label: 'COLD', color: 'bg-blue-600' }
          ].map(temp => (
            <button
              key={temp.value}
              onClick={() => onChange({...filters, temperature: toggleArrayValue(filters.temperature, temp.value)})}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filters.temperature.includes(temp.value)
                  ? temp.color + ' text-white'
                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
            >
              {temp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desarrollos */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">Desarrollo de Interes</label>
        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
          {desarrollosUnicos.slice(0, 10).map(desarrollo => (
            <button
              key={desarrollo}
              onClick={() => onChange({...filters, desarrollos: toggleArrayValue(filters.desarrollos, desarrollo)})}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                filters.desarrollos.includes(desarrollo)
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
            >
              {desarrollo}
            </button>
          ))}
        </div>
      </div>

      {/* Hipoteca y Compradores */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Credito Hipotecario</label>
          <div className="flex gap-2">
            <button
              onClick={() => onChange({...filters, needs_mortgage: filters.needs_mortgage === true ? null : true})}
              className={`px-3 py-2 rounded-lg text-sm flex-1 ${
                filters.needs_mortgage === true ? 'bg-orange-600' : 'bg-slate-600 hover:bg-slate-500'
              }`}
            >
              Con Hipoteca
            </button>
            <button
              onClick={() => onChange({...filters, needs_mortgage: filters.needs_mortgage === false ? null : false})}
              className={`px-3 py-2 rounded-lg text-sm flex-1 ${
                filters.needs_mortgage === false ? 'bg-slate-500' : 'bg-slate-600 hover:bg-slate-500'
              }`}
            >
              Sin Hipoteca
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-2">Tipo</label>
          <div className="flex gap-2">
            <button
              onClick={() => onChange({...filters, is_buyer: filters.is_buyer === true ? null : true})}
              className={`px-3 py-2 rounded-lg text-sm flex-1 ${
                filters.is_buyer === true ? 'bg-green-600' : 'bg-slate-600 hover:bg-slate-500'
              }`}
            >
              Compradores
            </button>
            <button
              onClick={() => onChange({...filters, is_buyer: filters.is_buyer === false ? null : false})}
              className={`px-3 py-2 rounded-lg text-sm flex-1 ${
                filters.is_buyer === false ? 'bg-blue-600' : 'bg-slate-600 hover:bg-slate-500'
              }`}
            >
              Prospectos
            </button>
          </div>
        </div>
      </div>

      {/* Source */}
      {sourcesUnicos.length > 0 && (
        <div>
          <label className="block text-sm text-slate-400 mb-2">Origen</label>
          <div className="flex flex-wrap gap-2">
            {sourcesUnicos.slice(0, 6).map(source => (
              <button
                key={source}
                onClick={() => onChange({...filters, source: toggleArrayValue(filters.source, source!)})}
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  filters.source.includes(source!)
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                }`}
              >
                {source}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Limpiar filtros */}
      <button
        onClick={() => onChange({
          status: [], temperature: [], desarrollos: [],
          needs_mortgage: null, is_buyer: null, source: [],
          min_score: null, max_score: null
        })}
        className="w-full py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm text-slate-300"
      >
        Limpiar Filtros (Enviar a Todos)
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// PROMOTION MODAL
// ═══════════════════════════════════════════════════════

function PromotionModal({ promotion, onSave, onClose, leads, properties }: {
  promotion: Promotion | null,
  onSave: (p: Partial<Promotion>) => void,
  onClose: () => void,
  leads: Lead[],
  properties: Property[]
}) {
  const [form, setForm] = useState<Partial<Promotion>>(promotion || {
    name: '', description: '', start_date: '', end_date: '', message: '',
    image_url: '', video_url: '', pdf_url: '', target_segment: 'todos', reminder_enabled: true,
    reminder_frequency: 'weekly', status: 'scheduled'
  })

  const defaultFilters: SegmentFilters = {
    status: [], temperature: [], desarrollos: [],
    needs_mortgage: null, is_buyer: null, source: [],
    min_score: null, max_score: null
  }

  const parseExistingFilters = (): SegmentFilters => {
    if (promotion?.segment_filters) {
      try {
        const parsed = typeof promotion.segment_filters === 'string'
          ? JSON.parse(promotion.segment_filters)
          : promotion.segment_filters
        return { ...defaultFilters, ...parsed }
      } catch { return defaultFilters }
    }
    return defaultFilters
  }

  const [segmentFilters, setSegmentFilters] = useState<SegmentFilters>(parseExistingFilters())
  const [showAdvancedSegment, setShowAdvancedSegment] = useState(false)

  const handleSave = () => {
    const hasFilters = segmentFilters.status.length > 0 ||
      segmentFilters.temperature.length > 0 ||
      segmentFilters.desarrollos.length > 0 ||
      segmentFilters.needs_mortgage !== null ||
      segmentFilters.is_buyer !== null ||
      segmentFilters.source.length > 0

    onSave({
      ...form,
      target_segment: hasFilters ? 'custom' : form.target_segment,
      segment_filters: hasFilters ? JSON.stringify(segmentFilters) : null
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{promotion ? 'Editar Promocion' : 'Nueva Promocion'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Nombre de la Promocion</label>
            <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ej: Outlet Santa Rita Enero 2026" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Fecha Inicio</label>
            <input type="date" value={form.start_date || ''} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Fecha Fin</label>
            <input type="date" value={form.end_date || ''} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>

          {/* Toggle para segmentacion avanzada */}
          <div className="col-span-2 border-t border-slate-600 pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-slate-400">Segmentacion de Audiencia</label>
              <button
                onClick={() => setShowAdvancedSegment(!showAdvancedSegment)}
                className={`px-3 py-1 rounded-lg text-sm ${showAdvancedSegment ? 'bg-purple-600' : 'bg-slate-600'}`}
              >
                {showAdvancedSegment ? 'Ocultar Avanzado' : 'Segmentacion Avanzada'}
              </button>
            </div>

            {!showAdvancedSegment ? (
              <select value={form.target_segment || 'todos'} onChange={e => setForm({...form, target_segment: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="todos">Todos los leads</option>
                <option value="hot">Solo HOT</option>
                <option value="warm">Solo WARM</option>
                <option value="cold">Solo COLD</option>
                <option value="compradores">Compradores</option>
                <option value="caidos">Caidos</option>
                <option value="new">Nuevos</option>
              </select>
            ) : (
              <SegmentSelector
                filters={segmentFilters}
                onChange={setSegmentFilters}
                leads={leads}
                properties={properties}
              />
            )}
          </div>

          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Estado</label>
            <select value={form.status || 'scheduled'} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="scheduled">Programada</option>
              <option value="active">Activa</option>
              <option value="paused">Pausada</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Mensaje de la Promocion</label>
            <textarea value={form.message || ''} onChange={e => setForm({...form, message: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={4} placeholder="Escribe el mensaje que se enviara a los leads..." />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Descripcion (opcional)</label>
            <input value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Descripcion interna de la promocion" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">URL de Imagen (opcional)</label>
            <input value={form.image_url || ''} onChange={e => setForm({...form, image_url: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://ejemplo.com/imagen.jpg" />
            {form.image_url && <img src={form.image_url} alt="Vista previa" className="mt-2 h-20 rounded-lg object-cover" />}
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">URL de Video (opcional)</label>
            <input value={form.video_url || ''} onChange={e => setForm({...form, video_url: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://youtube.com/watch?v=..." />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">URL de PDF/Brochure (opcional)</label>
            <input value={form.pdf_url || ''} onChange={e => setForm({...form, pdf_url: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://ejemplo.com/brochure.pdf" />
          </div>
          <div className="col-span-2 border-t border-slate-600 pt-4 mt-2">
            <div className="flex items-center gap-3 mb-3">
              <input type="checkbox" id="reminder-enabled" checked={form.reminder_enabled || false} onChange={e => setForm({...form, reminder_enabled: e.target.checked})} className="w-5 h-5 rounded" />
              <label htmlFor="reminder-enabled" className="text-sm">Activar recordatorios automaticos</label>
            </div>
            {form.reminder_enabled && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Frecuencia de recordatorios</label>
                <select value={form.reminder_frequency || 'weekly'} onChange={e => setForm({...form, reminder_frequency: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="at_start">Solo al inicio</option>
                  <option value="at_end">Solo al final</option>
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-gray-600">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Save size={20} /> Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// SEND PROMO MODAL
// ═══════════════════════════════════════════════════════

function SendPromoModal({
  promo,
  onSend,
  onClose,
  sending,
  leads,
  properties,
  team
}: {
  promo: Promotion,
  onSend: (segment: string, options: { sendImage: boolean, sendVideo: boolean, sendPdf: boolean, filters?: any }) => void,
  onClose: () => void,
  sending: boolean,
  leads: Lead[],
  properties: Property[],
  team: TeamMember[]
}) {
  const [segmentType, setSegmentType] = useState<'basic' | 'status' | 'source' | 'property' | 'vendedor'>('basic')
  const [segment, setSegment] = useState('todos')
  const [sendImage, setSendImage] = useState(true)
  const [sendVideo, setSendVideo] = useState(true)
  const [sendPdf, setSendPdf] = useState(true)

  const sources = [...new Set(leads.map(l => l.source).filter(Boolean))]
  const propertyInterests = [...new Set(leads.map(l => l.property_interest).filter(Boolean))]
  const vendedores = team.filter(t => t.role === 'vendedor' && t.active)

  const getLeadCount = () => {
    let filtered = leads.filter(l => !['lost', 'fallen', 'closed', 'delivered', 'sold'].includes(l.status))

    if (segmentType === 'basic') {
      switch (segment) {
        case 'hot': filtered = filtered.filter(l => l.score >= 7); break
        case 'warm': filtered = filtered.filter(l => l.score >= 4 && l.score < 7); break
        case 'cold': filtered = filtered.filter(l => l.score < 4); break
        case 'compradores': filtered = leads.filter(l => ['closed', 'delivered', 'sold'].includes(l.status)); break
        case 'new': filtered = filtered.filter(l => l.status === 'new'); break
      }
    } else if (segmentType === 'status') {
      filtered = filtered.filter(l => l.status === segment)
    } else if (segmentType === 'source') {
      filtered = filtered.filter(l => l.source === segment)
    } else if (segmentType === 'property') {
      filtered = filtered.filter(l => l.property_interest === segment)
    } else if (segmentType === 'vendedor') {
      filtered = filtered.filter(l => l.assigned_to === segment)
    }

    return segment === 'todos' ? leads.filter(l => !['lost', 'fallen'].includes(l.status)).length : filtered.length
  }

  const startDate = new Date(promo.start_date)
  const formattedDate = startDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2"><Megaphone size={24} /> Enviar Promocion</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X /></button>
        </div>

        {/* Preview de la promocion */}
        <div className="bg-slate-700/50 p-4 rounded-xl mb-4">
          <h4 className="font-bold text-lg mb-2">{promo.name}</h4>
          <div className="text-sm text-slate-300 space-y-1">
            <p><CalendarIcon size={14} className="inline mr-2" />Vigente desde: {formattedDate}</p>
            {promo.target_segment && <p><Users size={14} className="inline mr-2" />Segmento original: {promo.target_segment}</p>}
            <p className="text-slate-400 mt-2">{promo.description || promo.message?.slice(0, 100)}...</p>
          </div>
        </div>

        {/* Tipo de segmentacion */}
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">Tipo de segmentacion:</label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'basic', label: 'Basico', icon: '📊' },
              { key: 'status', label: 'Por Etapa', icon: '🎯' },
              { key: 'source', label: 'Por Fuente', icon: '📣' },
              { key: 'property', label: 'Por Desarrollo', icon: '🏠' },
              { key: 'vendedor', label: 'Por Vendedor', icon: '👤' }
            ].map(tipo => (
              <button
                key={tipo.key}
                onClick={() => { setSegmentType(tipo.key as any); setSegment('todos'); }}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                  segmentType === tipo.key
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {tipo.icon} {tipo.label}
              </button>
            ))}
          </div>
        </div>

        {/* Segmento especifico */}
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">Enviar a:</label>
          <select
            value={segment}
            onChange={e => setSegment(e.target.value)}
            className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="todos">Todos los leads activos</option>

            {segmentType === 'basic' && (
              <>
                <option value="hot">🔥 Leads HOT (score 7+)</option>
                <option value="warm">🌡️ Leads WARM (score 4-6)</option>
                <option value="cold">❄️ Leads COLD (score 0-3)</option>
                <option value="compradores">✅ Compradores (ya cerraron)</option>
                <option value="new">🆕 Leads Nuevos (sin contactar)</option>
              </>
            )}

            {segmentType === 'status' && (
              <>
                <option value="new">🆕 Nuevos</option>
                <option value="contacted">📞 Contactados</option>
                <option value="scheduled">📅 Cita Agendada</option>
                <option value="visited">🏠 Visitaron</option>
                <option value="negotiation">💼 En Negociacion</option>
                <option value="reserved">📋 Reservado</option>
              </>
            )}

            {segmentType === 'source' && sources.length > 0 && (
              <>
                {sources.map(src => (
                  <option key={src} value={src}>
                    {src === 'facebook' ? '📘 Facebook' :
                     src === 'instagram' ? '📸 Instagram' :
                     src === 'website' ? '🌐 Website' :
                     src === 'referral' ? '🤝 Referidos' :
                     src === 'whatsapp' ? '💬 WhatsApp' :
                     src === 'google' ? '🔍 Google' :
                     src}
                  </option>
                ))}
              </>
            )}

            {segmentType === 'property' && propertyInterests.length > 0 && (
              <>
                {propertyInterests.map(prop => (
                  <option key={prop} value={prop}>🏘️ {prop}</option>
                ))}
              </>
            )}

            {segmentType === 'vendedor' && vendedores.length > 0 && (
              <>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id}>👤 {v.name}</option>
                ))}
              </>
            )}
          </select>

          {/* Conteo de leads */}
          <div className="mt-2 text-sm text-slate-400 flex items-center gap-2">
            <Users size={14} />
            <span>Se enviara a <strong className="text-purple-400">{getLeadCount()}</strong> leads</span>
          </div>
        </div>

        {/* Opciones de contenido */}
        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-2">Contenido a enviar:</label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendImage}
                onChange={e => setSendImage(e.target.checked)}
                disabled={!promo.image_url}
                className="w-5 h-5 rounded"
              />
              <span className={!promo.image_url ? 'text-slate-400' : ''}>
                Imagen {!promo.image_url && '(no configurada)'}
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendVideo}
                onChange={e => setSendVideo(e.target.checked)}
                disabled={!promo.video_url}
                className="w-5 h-5 rounded"
              />
              <span className={!promo.video_url ? 'text-slate-400' : ''}>
                Video {!promo.video_url && '(no configurado)'}
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendPdf}
                onChange={e => setSendPdf(e.target.checked)}
                disabled={!promo.pdf_url}
                className="w-5 h-5 rounded"
              />
              <span className={!promo.pdf_url ? 'text-slate-400' : ''}>
                PDF/Brochure {!promo.pdf_url && '(no configurado)'}
              </span>
            </label>
          </div>
        </div>

        {/* Preview del mensaje */}
        <div className="bg-slate-900/50 p-4 rounded-xl mb-6 text-sm">
          <p className="text-slate-400 mb-2">Vista previa del mensaje:</p>
          <div className="text-white whitespace-pre-line max-h-32 overflow-y-auto">
            {promo.message || 'Sin mensaje configurado'}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600">
            Cancelar
          </button>
          <button
            onClick={() => onSend(segment, { sendImage, sendVideo, sendPdf, filters: { segmentType } })}
            disabled={sending || getLeadCount() === 0}
            className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
          >
            {sending ? (
              <>Enviando...</>
            ) : (
              <><Send size={18} /> Enviar a {getLeadCount()} leads</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
