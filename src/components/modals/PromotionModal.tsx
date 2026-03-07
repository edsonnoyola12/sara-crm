import { useState } from 'react'
import { X, Save } from 'lucide-react'
import type { Promotion, Lead, Property } from '../../types/crm'
import SegmentSelector, { type SegmentFilters } from './SegmentSelector'

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

  // Estado para segmentacion avanzada
  const defaultFilters: SegmentFilters = {
    status: [], temperature: [], desarrollos: [],
    needs_mortgage: null, is_buyer: null, source: [],
    min_score: null, max_score: null
  }

  // Parsear filtros existentes si los hay
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

  // Guardar con filtros
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

export default PromotionModal
