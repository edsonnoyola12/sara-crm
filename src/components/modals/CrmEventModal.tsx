import { useState } from 'react'
import { X, Save } from 'lucide-react'
import type { CRMEvent, Lead, Property } from '../../types/crm'
import SegmentSelector, { type SegmentFilters } from './SegmentSelector'

function CrmEventModal({ event, onSave, onClose, leads, properties }: {
  event: CRMEvent | null,
  onSave: (e: Partial<CRMEvent>) => void,
  onClose: () => void,
  leads: Lead[],
  properties: Property[]
}) {
  const [form, setForm] = useState<Partial<CRMEvent>>(event || {
    name: '', description: '', event_type: 'open_house', event_date: '',
    event_time: '10:00', location: '', location_url: '', max_capacity: 50,
    image_url: '', video_url: '', pdf_url: '', invitation_message: '', status: 'scheduled'
  })

  // Estado para segmentacion avanzada
  const defaultFilters: SegmentFilters = {
    status: [], temperature: [], desarrollos: [],
    needs_mortgage: null, is_buyer: null, source: [],
    min_score: null, max_score: null
  }

  const parseExistingFilters = (): SegmentFilters => {
    if (event?.segment_filters) {
      try {
        const parsed = typeof event.segment_filters === 'string'
          ? JSON.parse(event.segment_filters)
          : event.segment_filters
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
      target_segment: hasFilters ? 'custom' : 'todos',
      segment_filters: hasFilters ? JSON.stringify(segmentFilters) : null
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{event ? 'Editar Evento' : 'Nuevo Evento'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Nombre del Evento</label>
            <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ej: Open House Santa Rita" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Tipo de Evento</label>
            <select value={form.event_type || 'open_house'} onChange={e => setForm({...form, event_type: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="open_house">Open House</option>
              <option value="seminar">Seminario</option>
              <option value="outlet">Outlet/Venta</option>
              <option value="fiesta">Fiesta/Celebracion</option>
              <option value="webinar">Webinar</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Estado</label>
            <select value={form.status || 'scheduled'} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="scheduled">Programado</option>
              <option value="upcoming">Proximo</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Fecha</label>
            <input type="date" value={form.event_date || ''} onChange={e => setForm({...form, event_date: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Hora</label>
            <input type="time" value={form.event_time || '10:00'} onChange={e => setForm({...form, event_time: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Ubicacion</label>
            <input value={form.location || ''} onChange={e => setForm({...form, location: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ej: Sala de Ventas Santa Rita, Av. Principal #123" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">URL Mapa (opcional)</label>
            <input value={form.location_url || ''} onChange={e => setForm({...form, location_url: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://maps.google.com/..." />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Capacidad Maxima</label>
            <input type="number" value={form.max_capacity || ''} onChange={e => setForm({...form, max_capacity: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Descripcion</label>
            <textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={3} placeholder="Describe el evento..." />
          </div>
          <div className="col-span-2 border-t border-slate-600 pt-4 mt-2">
            <p className="text-sm text-emerald-400 font-semibold mb-3">Contenido para Invitaciones</p>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">URL Imagen</label>
            <input value={form.image_url || ''} onChange={e => setForm({...form, image_url: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://ejemplo.com/imagen.jpg" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">URL Video</label>
            <input value={form.video_url || ''} onChange={e => setForm({...form, video_url: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://ejemplo.com/video.mp4" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">URL PDF/Flyer</label>
            <input value={form.pdf_url || ''} onChange={e => setForm({...form, pdf_url: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://ejemplo.com/flyer.pdf" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Mensaje de Invitacion (opcional - se genera automaticamente si esta vacio)</label>
            <textarea value={form.invitation_message || ''} onChange={e => setForm({...form, invitation_message: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={4} placeholder="Hola! Te invitamos a nuestro evento..." />
          </div>

          {/* Segmentacion para invitaciones */}
          <div className="col-span-2 border-t border-slate-600 pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-emerald-400 font-semibold">Segmentacion de Invitados</label>
              <button
                onClick={() => setShowAdvancedSegment(!showAdvancedSegment)}
                className={`px-3 py-1 rounded-lg text-sm ${showAdvancedSegment ? 'bg-emerald-600' : 'bg-slate-600'}`}
              >
                {showAdvancedSegment ? 'Ocultar' : 'Segmentacion Avanzada'}
              </button>
            </div>
            {showAdvancedSegment && (
              <SegmentSelector
                filters={segmentFilters}
                onChange={setSegmentFilters}
                leads={leads}
                properties={properties}
              />
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

export default CrmEventModal
