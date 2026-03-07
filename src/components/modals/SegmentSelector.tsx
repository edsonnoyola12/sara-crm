import type { Lead, Property } from '../../types/crm'

export interface SegmentFilters {
  status: string[]
  temperature: string[]
  desarrollos: string[]
  needs_mortgage: boolean | null
  is_buyer: boolean | null
  source: string[]
  min_score: number | null
  max_score: number | null
}

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
  // Contar leads que coinciden con los filtros actuales
  const matchingLeads = leads.filter(lead => {
    // Filtro por status
    if (filters.status.length > 0 && !filters.status.includes(lead.status)) return false

    // Filtro por temperatura (basado en score)
    if (filters.temperature.length > 0) {
      const temp = lead.score >= 70 ? 'hot' : lead.score >= 40 ? 'warm' : 'cold'
      if (!filters.temperature.includes(temp)) return false
    }

    // Filtro por desarrollo
    if (filters.desarrollos.length > 0 && lead.property_interest) {
      const matchDesarrollo = filters.desarrollos.some(d =>
        lead.property_interest?.toLowerCase().includes(d.toLowerCase())
      )
      if (!matchDesarrollo) return false
    }

    // Filtro por hipoteca
    if (filters.needs_mortgage === true && lead.credit_status !== 'active' && lead.credit_status !== 'approved') return false
    if (filters.needs_mortgage === false && (lead.credit_status === 'active' || lead.credit_status === 'approved')) return false

    // Filtro por comprador
    if (filters.is_buyer === true && lead.status !== 'closed_won' && lead.status !== 'delivered') return false
    if (filters.is_buyer === false && (lead.status === 'closed_won' || lead.status === 'delivered')) return false

    // Filtro por source
    if (filters.source.length > 0 && lead.source && !filters.source.includes(lead.source)) return false

    // Filtro por score
    if (filters.min_score !== null && lead.score < filters.min_score) return false
    if (filters.max_score !== null && lead.score > filters.max_score) return false

    return true
  })

  // Obtener desarrollos unicos de propiedades
  const desarrollosUnicos = [...new Set(properties.map(p => p.name).filter(Boolean))]

  // Sources unicos
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

export default SegmentSelector
