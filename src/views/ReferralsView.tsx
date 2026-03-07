import { useState } from 'react'
import { TrendingUp, Award, Users, Gift } from 'lucide-react'
import { useCrm } from '../context/CrmContext'

const STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo', contacted: 'Contactado', qualified: 'Calificado', scheduled: 'Cita',
  visited: 'Visitó', negotiation: 'Negociación', reserved: 'Reservado', closed: 'Cerrado',
  delivered: 'Entregado', sold: 'Vendido', lost: 'Perdido', fallen: 'Caído', inactive: 'Inactivo', paused: 'Pausado'
}

export default function ReferralsView() {
  const { leads, team, supabase, showToast, loadData } = useCrm()

  const [bonoReferido, setBonoReferido] = useState(() => {
    const saved = localStorage.getItem('bonoReferido')
    return saved ? parseInt(saved) : 500
  })
  const [editandoBono, setEditandoBono] = useState(false)

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent">
        Programa de Referidos
      </h2>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-pink-600/20 to-rose-600/20 border border-pink-500/30 rounded-2xl p-6">
          <div className="text-4xl font-bold text-pink-400">
            {leads.filter(l => l.source === 'referral').length}
          </div>
          <div className="text-slate-400 text-sm">Total Referidos</div>
        </div>
        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-6">
          <div className="text-4xl font-bold text-green-400">
            {leads.filter(l => l.source === 'referral' && l.status === 'sold').length}
          </div>
          <div className="text-slate-400 text-sm">Referidos Vendidos</div>
        </div>
        <div className="bg-gradient-to-br from-amber-600/20 to-yellow-600/20 border border-amber-500/30 rounded-2xl p-6">
          <div className="text-4xl font-bold text-amber-400">
            {leads.filter(l => l.source === 'referral' && ['visited', 'reserved', 'negotiation'].includes(l.status)).length}
          </div>
          <div className="text-slate-400 text-sm">En Proceso</div>
        </div>
        <div className="bg-gradient-to-br from-purple-600/20 to-violet-600/20 border border-purple-500/30 rounded-2xl p-6">
          <div className="text-4xl font-bold text-purple-400">
            {(() => {
              const referidores = new Set(leads.filter(l => l.source === 'referral' && l.referred_by).map(l => l.referred_by))
              return referidores.size
            })()}
          </div>
          <div className="text-slate-400 text-sm">Clientes Referidores</div>
        </div>
      </div>

      {/* Tasa de conversión */}
      <div className="bg-slate-800/50 rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp size={24} className="text-green-400" />
          Tasa de Conversión de Referidos
        </h3>
        <div className="flex items-center gap-8">
          <div>
            <div className="text-5xl font-bold text-green-400">
              {leads.filter(l => l.source === 'referral').length > 0
                ? Math.round((leads.filter(l => l.source === 'referral' && l.status === 'sold').length / leads.filter(l => l.source === 'referral').length) * 100)
                : 0}%
            </div>
            <div className="text-slate-400">Referidos que compraron</div>
          </div>
          <div className="flex-1 h-4 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${leads.filter(l => l.source === 'referral').length > 0
                ? (leads.filter(l => l.source === 'referral' && l.status === 'sold').length / leads.filter(l => l.source === 'referral').length) * 100
                : 0}%` }}
            />
          </div>
        </div>
        <p className="text-sm text-slate-400 mt-4">
          Los leads referidos tienen mayor probabilidad de conversión porque vienen con confianza previa del referidor.
        </p>
      </div>

      {/* Top Referidores */}
      <div className="bg-slate-800/50 rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Award size={24} className="text-amber-400" />
          Top Clientes Referidores
        </h3>
        <div className="space-y-3">
          {(() => {
            const referidorCounts: Record<string, { count: number; name: string; vendidos: number }> = {}
            leads.filter(l => l.source === 'referral' && l.referred_by).forEach(l => {
              if (!referidorCounts[l.referred_by!]) {
                referidorCounts[l.referred_by!] = { count: 0, name: l.referred_by_name || 'Sin nombre', vendidos: 0 }
              }
              referidorCounts[l.referred_by!].count++
              if (l.status === 'sold') referidorCounts[l.referred_by!].vendidos++
            })
            const sorted = Object.entries(referidorCounts).sort((a, b) => b[1].count - a[1].count).slice(0, 5)
            if (sorted.length === 0) {
              return <p className="text-slate-400">Aún no hay clientes que hayan referido leads</p>
            }
            return sorted.map(([id, data], idx) => (
              <div key={id} className="flex items-center gap-4 bg-slate-700/50 rounded-xl p-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  idx === 0 ? 'bg-amber-500 text-black' :
                  idx === 1 ? 'bg-slate-300 text-black' :
                  idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-600'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{data.name}</div>
                  <div className="text-sm text-slate-400">
                    {data.count} referido{data.count !== 1 ? 's' : ''}
                    {data.vendidos > 0 && <span className="text-green-400 ml-2">({data.vendidos} vendido{data.vendidos !== 1 ? 's' : ''})</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-pink-400">{data.count}</div>
                </div>
              </div>
            ))
          })()}
        </div>
      </div>

      {/* Lista de Referidos */}
      <div className="bg-slate-800/50 rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users size={24} className="text-blue-400" />
          Leads Referidos
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700">
                <th className="pb-3 pr-4">Lead</th>
                <th className="pb-3 pr-4">Referido por</th>
                <th className="pb-3 pr-4">Vendedor</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {leads.filter(l => l.source === 'referral').length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Gift size={40} className="mx-auto mb-3 text-slate-600" />
                    <p className="text-slate-300 font-medium">Sin referidos todavia</p>
                    <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">Cuando un cliente satisfecho envie un contacto por WhatsApp, aparecera aqui automaticamente</p>
                  </td>
                </tr>
              ) : (
                leads.filter(l => l.source === 'referral').sort((a, b) =>
                  new Date(b.referral_date || b.created_at).getTime() - new Date(a.referral_date || a.created_at).getTime()
                ).map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-700/30">
                    <td className="py-3 pr-4">
                      <div className="font-semibold">{lead.name}</div>
                      <div className="text-sm text-slate-400">{lead.phone}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="text-pink-400">{lead.referred_by_name || 'Desconocido'}</div>
                    </td>
                    <td className="py-3 pr-4">
                      {team.find(t => t.id === lead.assigned_to)?.name || 'Sin asignar'}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        lead.status === 'sold' ? 'bg-green-500/20 text-green-400' :
                        lead.status === 'reserved' ? 'bg-purple-500/20 text-purple-400' :
                        lead.status === 'visited' ? 'bg-blue-500/20 text-blue-400' :
                        lead.status === 'contacted' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {STATUS_LABELS[lead.status] || lead.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-400">
                      {new Date(lead.referral_date || lead.created_at).toLocaleDateString('es-MX')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Premios para Referidores - Seguimiento */}
      <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            🎁 Premios para Referidores
          </h3>
          <button
            onClick={() => setEditandoBono(true)}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm flex items-center gap-1"
          >
            ✏️ Editar Premio
          </button>
        </div>

        {/* Editor de Premio */}
        {editandoBono && (
          <div className="bg-slate-700/50 p-4 rounded-xl mb-4 flex flex-wrap items-center gap-4">
            <label className="text-sm text-slate-400">Premio por referido que compre:</label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">$</span>
              <input
                type="number"
                value={bonoReferido}
                onChange={(e) => setBonoReferido(parseInt(e.target.value) || 0)}
                className="w-24 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-center"
              />
              <span className="text-slate-400">MXN</span>
            </div>
            <button
              onClick={() => {
                localStorage.setItem('bonoReferido', bonoReferido.toString())
                setEditandoBono(false)
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg"
            >
              Guardar
            </button>
            <button
              onClick={() => setEditandoBono(false)}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg"
            >
              Cancelar
            </button>
          </div>
        )}

        <p className="text-slate-400 text-sm mb-4">
          💰 Premio actual: <span className="text-green-400 font-bold">${bonoReferido.toLocaleString('es-MX')} MXN</span> para quien refiera a alguien que compre
        </p>

        {/* Premios Pendientes */}
        {(() => {
          const referidosVendidos = leads.filter(l =>
            l.source === 'referral' &&
            (l.status === 'sold' || l.status === 'closed' || l.status === 'delivered') &&
            l.referred_by
          )
          const pendientes = referidosVendidos.filter(l => !l.notes?.reward_delivered)
          const entregados = referidosVendidos.filter(l => l.notes?.reward_delivered)

          return (
            <>
              {/* Pendientes */}
              <div className="mb-6">
                <h4 className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
                  ⏳ Premios Pendientes de Entregar ({pendientes.length})
                </h4>
                {pendientes.length === 0 ? (
                  <p className="text-slate-400 text-sm">No hay premios pendientes</p>
                ) : (
                  <div className="space-y-3">
                    {pendientes.map(lead => {
                      const vendedor = team.find(t => t.id === lead.assigned_to)
                      return (
                        <div key={lead.id} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex-1 min-w-[200px]">
                              <div className="flex items-center gap-2">
                                <span className="text-amber-400 font-bold">🎁 Premio para:</span>
                                <span className="text-white font-semibold">{lead.referred_by_name || 'Sin nombre'}</span>
                              </div>
                              <div className="text-sm text-slate-400 mt-1">
                                Por referir a <span className="text-pink-400">{lead.name}</span> quien compró
                              </div>
                              <div className="text-sm text-slate-400">
                                Vendedor responsable: <span className="text-blue-400">{vendedor?.name || 'Sin asignar'}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-400">${bonoReferido.toLocaleString('es-MX')}</div>
                              <button
                                onClick={async () => {
                                  const newNotes = { ...(lead.notes || {}), reward_delivered: true, reward_delivered_at: new Date().toISOString() }
                                  await supabase.from('leads').update({ notes: newNotes }).eq('id', lead.id)
                                  loadData()
                                }}
                                className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-semibold"
                              >
                                ✅ Marcar Entregado
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Entregados */}
              {entregados.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                    ✅ Premios Entregados ({entregados.length})
                  </h4>
                  <div className="space-y-2">
                    {entregados.slice(0, 5).map(lead => (
                      <div key={lead.id} className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <span className="text-green-400">{lead.referred_by_name || 'Sin nombre'}</span>
                          <span className="text-slate-400 text-sm ml-2">por referir a {lead.name}</span>
                        </div>
                        <div className="text-green-400 font-bold">${bonoReferido.toLocaleString('es-MX')}</div>
                      </div>
                    ))}
                    {entregados.length > 5 && (
                      <p className="text-slate-400 text-sm text-center">... y {entregados.length - 5} más</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )
        })()}
      </div>
    </div>
  )
}
