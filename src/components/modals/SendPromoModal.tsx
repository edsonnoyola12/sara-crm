import { useState } from 'react'
import { X, Send, Megaphone, Calendar as CalendarIcon, Users } from 'lucide-react'
import type { Promotion, Lead, Property, TeamMember } from '../../types/crm'

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

  // Opciones dinamicas basadas en datos reales
  const sources = [...new Set(leads.map(l => l.source).filter(Boolean))]
  const propertyInterests = [...new Set(leads.map(l => l.property_interest).filter(Boolean))]
  const vendedores = team.filter(t => t.role === 'vendedor' && t.active)

  // Conteo de leads por segmento seleccionado
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
              { key: 'basic', label: 'Basico', icon: '' },
              { key: 'status', label: 'Por Etapa', icon: '' },
              { key: 'source', label: 'Por Fuente', icon: '' },
              { key: 'property', label: 'Por Desarrollo', icon: '' },
              { key: 'vendedor', label: 'Por Vendedor', icon: '' }
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
                <option value="hot">Leads HOT (score 7+)</option>
                <option value="warm">Leads WARM (score 4-6)</option>
                <option value="cold">Leads COLD (score 0-3)</option>
                <option value="compradores">Compradores (ya cerraron)</option>
                <option value="new">Leads Nuevos (sin contactar)</option>
              </>
            )}

            {segmentType === 'status' && (
              <>
                <option value="new">Nuevos</option>
                <option value="contacted">Contactados</option>
                <option value="scheduled">Cita Agendada</option>
                <option value="visited">Visitaron</option>
                <option value="negotiation">En Negociacion</option>
                <option value="reserved">Reservado</option>
              </>
            )}

            {segmentType === 'source' && sources.length > 0 && (
              <>
                {sources.map(src => (
                  <option key={src} value={src}>
                    {src === 'facebook' ? 'Facebook' :
                     src === 'instagram' ? 'Instagram' :
                     src === 'website' ? 'Website' :
                     src === 'referral' ? 'Referidos' :
                     src === 'whatsapp' ? 'WhatsApp' :
                     src === 'google' ? 'Google' :
                     src}
                  </option>
                ))}
              </>
            )}

            {segmentType === 'property' && propertyInterests.length > 0 && (
              <>
                {propertyInterests.map(prop => (
                  <option key={prop} value={prop}>{prop}</option>
                ))}
              </>
            )}

            {segmentType === 'vendedor' && vendedores.length > 0 && (
              <>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
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

export default SendPromoModal
