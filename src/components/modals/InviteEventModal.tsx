import { useState } from 'react'
import { X, Send, Calendar, MapPin } from 'lucide-react'
import type { CRMEvent } from '../../types/crm'

function InviteEventModal({
  event,
  onSend,
  onClose,
  sending
}: {
  event: CRMEvent,
  onSend: (event: CRMEvent, segment: string, options: { sendImage: boolean, sendVideo: boolean, sendPdf: boolean }) => void,
  onClose: () => void,
  sending: boolean
}) {
  const [segment, setSegment] = useState('todos')
  const [sendImage, setSendImage] = useState(true)
  const [sendVideo, setSendVideo] = useState(true)
  const [sendPdf, setSendPdf] = useState(true)

  const eventDate = new Date(event.event_date)
  const formattedDate = eventDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Enviar Invitaciones</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X /></button>
        </div>

        {/* Preview del evento */}
        <div className="bg-slate-700/50 p-4 rounded-xl mb-4">
          <h4 className="font-bold text-lg mb-2">{event.name}</h4>
          <div className="text-sm text-slate-300 space-y-1">
            <p><Calendar size={14} className="inline mr-2" />{formattedDate} {event.event_time && `a las ${event.event_time}`}</p>
            {event.location && <p><MapPin size={14} className="inline mr-2" />{event.location}</p>}
          </div>
        </div>

        {/* Segmento */}
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">Enviar a segmento:</label>
          <select
            value={segment}
            onChange={e => setSegment(e.target.value)}
            className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="todos">Todos los leads</option>
            <option value="hot">Leads HOT (score 70+)</option>
            <option value="warm">Leads WARM (score 40-69)</option>
            <option value="cold">Leads COLD (score menor a 40)</option>
            <option value="compradores">Compradores</option>
          </select>
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
                disabled={!event.image_url}
                className="w-5 h-5 rounded"
              />
              <span className={!event.image_url ? 'text-slate-400' : ''}>
                Imagen {!event.image_url && '(no configurada)'}
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendVideo}
                onChange={e => setSendVideo(e.target.checked)}
                disabled={!event.video_url}
                className="w-5 h-5 rounded"
              />
              <span className={!event.video_url ? 'text-slate-400' : ''}>
                Video {!event.video_url && '(no configurado)'}
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendPdf}
                onChange={e => setSendPdf(e.target.checked)}
                disabled={!event.pdf_url}
                className="w-5 h-5 rounded"
              />
              <span className={!event.pdf_url ? 'text-slate-400' : ''}>
                PDF/Flyer {!event.pdf_url && '(no configurado)'}
              </span>
            </label>
          </div>
        </div>

        {/* Preview del mensaje */}
        <div className="bg-slate-900/50 p-4 rounded-xl mb-6 text-sm">
          <p className="text-slate-400 mb-2">Vista previa del mensaje:</p>
          <div className="text-white whitespace-pre-line">
            {event.invitation_message || `Hola! Te invitamos a *${event.name}*

${event.description || ''}

Fecha: ${formattedDate}
${event.event_time ? `Hora: ${event.event_time}` : ''}
${event.location ? `Lugar: ${event.location}` : ''}

Responde *SI* para confirmar tu asistencia.`}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600">
            Cancelar
          </button>
          <button
            onClick={() => onSend(event, segment, { sendImage, sendVideo, sendPdf })}
            disabled={sending}
            className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
          >
            {sending ? (
              <>Enviando...</>
            ) : (
              <><Send size={18} /> Enviar Invitaciones</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default InviteEventModal
