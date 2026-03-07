import { useState } from 'react'
import { Plus, Calendar, Clock, MapPin, Send, Edit, Trash2 } from 'lucide-react'
import { useCrm } from '../context/CrmContext'
import type { CRMEvent } from '../types/crm'

export default function EventsView() {
  const { crmEvents, saveCrmEvent, deleteCrmEvent } = useCrm()

  const [showNewCrmEvent, setShowNewCrmEvent] = useState(false)
  const [editingCrmEvent, setEditingCrmEvent] = useState<CRMEvent | null>(null)
  const [showInviteEventModal, setShowInviteEventModal] = useState(false)
  const [selectedEventForInvite, setSelectedEventForInvite] = useState<CRMEvent | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Eventos ({crmEvents.length})</h2>
        <button onClick={() => setShowNewCrmEvent(true)} className="bg-emerald-600 px-4 py-2 rounded-xl hover:bg-emerald-700 flex items-center gap-2">
          <Plus size={20} /> Nuevo Evento
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-emerald-500/50 transition-all">
          <p className="text-slate-400 mb-1">Proximos</p>
          <p className="text-2xl font-bold text-emerald-400">{crmEvents.filter(e => e.status === 'upcoming' || e.status === 'scheduled').length}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-blue-500/50 transition-all">
          <p className="text-slate-400 mb-1">Total Registrados</p>
          <p className="text-2xl font-bold text-blue-400">{crmEvents.reduce((acc, e) => acc + (e.registered_count || 0), 0)}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-purple-500/50 transition-all">
          <p className="text-slate-400 mb-1">Capacidad Total</p>
          <p className="text-2xl font-bold text-purple-400">{crmEvents.reduce((acc, e) => acc + (e.max_capacity || 0), 0)}</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-green-500/50 transition-all">
          <p className="text-slate-400 mb-1">Completados</p>
          <p className="text-2xl font-bold text-green-400">{crmEvents.filter(e => e.status === 'completed').length}</p>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {crmEvents.map(event => {
          const eventDate = new Date(event.event_date)
          const isPast = eventDate < new Date()
          const occupancy = event.max_capacity ? Math.round((event.registered_count / event.max_capacity) * 100) : 0

          return (
            <div key={event.id} className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all ${isPast ? 'opacity-60' : ''}`}>
              {event.image_url && (
                <img src={event.image_url} alt={event.name} className="w-full h-40 object-cover" />
              )}
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    event.event_type === 'open_house' ? 'bg-blue-600' :
                    event.event_type === 'seminar' ? 'bg-purple-600' :
                    event.event_type === 'outlet' ? 'bg-orange-600' :
                    'bg-emerald-600'
                  }`}>
                    {event.event_type === 'open_house' ? 'Casa Abierta' :
                     event.event_type === 'seminar' ? 'Seminario' :
                     event.event_type === 'outlet' ? 'Venta Especial' : event.event_type}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    event.status === 'upcoming' || event.status === 'scheduled' ? 'bg-green-600' :
                    event.status === 'completed' ? 'bg-slate-600' : 'bg-red-600'
                  }`}>
                    {event.status === 'upcoming' || event.status === 'scheduled' ? 'Proximo' :
                     event.status === 'completed' ? 'Completado' : event.status}
                  </span>
                </div>

                <h3 className="font-bold text-lg mb-2">{event.name}</h3>
                {event.description && (
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">{event.description}</p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar size={16} className="text-emerald-400" />
                    <span>{eventDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  </div>
                  {event.event_time && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock size={16} className="text-blue-400" />
                      <span>{event.event_time}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin size={16} className="text-red-400" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>

                {event.max_capacity && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">Registrados</span>
                      <span className="font-semibold">{event.registered_count}/{event.max_capacity}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${occupancy >= 90 ? 'bg-red-500' : occupancy >= 70 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(occupancy, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => { setSelectedEventForInvite(event); setShowInviteEventModal(true) }}
                    className="flex-1 bg-emerald-600 p-2 rounded hover:bg-emerald-700 flex items-center justify-center gap-1"
                    disabled={isPast}
                  >
                    <Send size={16} /> Invitar
                  </button>
                  <button onClick={() => setEditingCrmEvent(event)} className="bg-blue-600 p-2 rounded hover:bg-blue-700 flex items-center justify-center gap-1">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => deleteCrmEvent(event.id)} className="bg-red-600 p-2 rounded hover:bg-red-700">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {crmEvents.length === 0 && (
        <div className="text-center py-16 bg-slate-800/50 rounded-2xl">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-slate-400 text-xl mb-4">No hay eventos programados</p>
          <button onClick={() => setShowNewCrmEvent(true)} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold">
            Crear Primer Evento
          </button>
        </div>
      )}
    </div>
  )
}
