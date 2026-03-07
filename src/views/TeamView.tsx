import { useState, useEffect, useMemo } from 'react'
import { useCrm } from '../context/CrmContext'
import type { TeamMember, Lead, Appointment } from '../types/crm'
import { Users, Plus, Edit, Trash2, Megaphone } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line } from 'recharts'

export default function TeamView() {
  const { team, leads, appointments, permisos, saveMember, deleteMember, showToast, supabase, currentUser } = useCrm()

  const [teamViewMode, setTeamViewMode] = useState<'cards' | 'scorecards'>('cards')
  const [showNewMember, setShowNewMember] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)

  // vendorGoals - loaded locally since not in context
  const [vendorGoals, setVendorGoals] = useState<{vendor_id: string, goal: number, name: string}[]>([])

  useEffect(() => {
    loadVendorGoals()
  }, [team])

  async function loadVendorGoals() {
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const { data: vendorGoalsData } = await supabase
      .from('vendor_monthly_goals')
      .select('*')
      .eq('month', month)

    const activeVendors = team.filter(t => t.role === 'vendedor' && t.active)
    const goals = activeVendors.map(v => {
      const existing = vendorGoalsData?.find((vg: any) => vg.vendor_id === v.id)
      return { vendor_id: v.id, goal: existing?.goal || 0, name: v.name }
    })
    setVendorGoals(goals)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Equipo ({team.length})</h2>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-700 rounded-xl p-1">
            <button onClick={() => setTeamViewMode('cards')} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${teamViewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              Tarjetas
            </button>
            <button onClick={() => setTeamViewMode('scorecards')} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${teamViewMode === 'scorecards' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              Rendimiento
            </button>
          </div>
          {permisos.puedeEditarEquipo() && (
            <button onClick={() => setShowNewMember(true)} className="bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2">
              <Plus size={20} /> Agregar
            </button>
          )}
        </div>
      </div>

      {teamViewMode === 'scorecards' && (() => {
        const vendors = team.filter(t => t.role === 'vendedor' && t.active)
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

        const scorecardsData = vendors.map(v => {
          const myLeads = leads.filter(l => l.assigned_to === v.id)
          const activeLeads = myLeads.filter(l => !['closed','delivered','lost','inactive','fallen'].includes(l.status))
          const cerrados = myLeads.filter(l => ['closed','delivered'].includes(l.status)).length
          const citasMes = appointments.filter(a => a.vendedor_id === v.id && a.scheduled_date >= monthStart).length
          const conversionRate = myLeads.length > 0 ? Math.round(cerrados / myLeads.length * 100) : 0
          const goal = vendorGoals.find(g => g.vendor_id === v.id)?.goal || 2
          const goalProgress = Math.min(100, Math.round(cerrados / goal * 100))

          const spark = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(now)
            d.setDate(d.getDate() - (6 - i))
            const dayStr = d.toISOString().split('T')[0]
            return { day: i, count: myLeads.filter(l => l.created_at?.startsWith(dayStr)).length }
          })

          return { vendor: v, activeLeads: activeLeads.length, citasMes, cerrados, conversionRate, goal, goalProgress, spark }
        }).sort((a, b) => b.cerrados - a.cerrados || b.activeLeads - a.activeLeads)

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {scorecardsData.map((sc, idx) => {
              const rank = idx + 1
              const ringR = 24, ringC = 2 * Math.PI * ringR
              const ringOffset = ringC - (sc.goalProgress / 100) * ringC
              const ringColor = sc.goalProgress >= 100 ? '#22c55e' : sc.goalProgress >= 50 ? '#3b82f6' : '#f59e0b'
              return (
                <div key={sc.vendor.id} className="scorecard bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-5 rounded-2xl">
                  <div className="flex items-center gap-4">
                    {/* Rank + Name */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`rank-medal ${rank <= 3 ? `rank-${rank}` : 'rank-other'}`}>
                        {rank <= 3 ? ['\u{1F947}','\u{1F948}','\u{1F949}'][rank-1] : rank}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-lg truncate">{sc.vendor.name}</p>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${sc.vendor.active ? 'bg-green-400' : 'bg-slate-500'}`} />
                          <span className="text-xs text-slate-400">Vendedor</span>
                        </div>
                      </div>
                    </div>

                    {/* Goal Ring */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <svg width="60" height="60">
                        <circle cx="30" cy="30" r={ringR} fill="none" stroke="rgba(51,65,85,0.5)" strokeWidth="4" />
                        <circle cx="30" cy="30" r={ringR} fill="none" stroke={ringColor} strokeWidth="4" strokeDasharray={ringC} strokeDashoffset={ringOffset} strokeLinecap="round" transform="rotate(-90 30 30)" className="transition-all duration-700" />
                        <text x="30" y="33" textAnchor="middle" className="fill-white text-sm font-bold">{sc.goalProgress}%</text>
                      </svg>
                      <span className="text-[10px] text-slate-400 mt-0.5">{sc.cerrados}/{sc.goal} meta</span>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    <div className="text-center bg-slate-700/50 rounded-xl py-2.5 px-1">
                      <p className="text-lg font-bold text-blue-400">{sc.activeLeads}</p>
                      <p className="text-[10px] text-slate-400">Leads</p>
                    </div>
                    <div className="text-center bg-slate-700/50 rounded-xl py-2.5 px-1">
                      <p className="text-lg font-bold text-purple-400">{sc.citasMes}</p>
                      <p className="text-[10px] text-slate-400">Citas Mes</p>
                    </div>
                    <div className="text-center bg-slate-700/50 rounded-xl py-2.5 px-1">
                      <p className="text-lg font-bold text-green-400">{sc.cerrados}</p>
                      <p className="text-[10px] text-slate-400">Cerrados</p>
                    </div>
                    <div className="text-center bg-slate-700/50 rounded-xl py-2.5 px-1">
                      <p className="text-lg font-bold text-amber-400">{sc.conversionRate}%</p>
                      <p className="text-[10px] text-slate-400">Conversion</p>
                    </div>
                  </div>

                  {/* Sparkline */}
                  <div className="sparkline-container mt-3 flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">7d</span>
                    <ResponsiveContainer width="100%" height={30}>
                      <LineChart data={sc.spark}>
                        <Line type="monotone" dataKey="count" stroke="#60a5fa" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )
            })}
            {scorecardsData.length === 0 && (
              <div className="col-span-2 text-center py-12">
                <Users size={32} className="mx-auto mb-3 text-slate-600" />
                <p className="text-slate-400">Sin vendedores activos</p>
                <p className="text-slate-500 text-sm mt-1">Agrega vendedores en la seccion Equipo</p>
              </div>
            )}
          </div>
        )
      })()}

      {teamViewMode === 'cards' && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
          <h3 className="text-xl font-semibold mb-4">Vendedores</h3>
          <div className="space-y-3">
            {team.filter(t => t.role === 'vendedor').map(member => {
              const memberLeads = leads.filter(l => l.assigned_to === member.id && !['closed','delivered','lost','inactive','fallen'].includes(l.status))
              const todayStr = new Date().toISOString().split('T')[0]
              const citasHoy = appointments.filter(a => a.vendedor_id === member.id && a.scheduled_date === todayStr && a.status !== 'cancelled')
              const hotCount = memberLeads.filter(l => l.score >= 70).length
              return (
              <div key={member.id} className="team-card flex items-center justify-between bg-slate-700 p-4 rounded-xl group">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
                    <Users size={24} className="text-blue-400" />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-700 ${member.active ? 'bg-green-400 online-indicator' : 'bg-slate-500'}`} />
                  </div>
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-600 text-slate-300">{memberLeads.length} leads</span>
                      {hotCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">{hotCount} hot</span>}
                      {citasHoy.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">{citasHoy.length} cita{citasHoy.length > 1 ? 's' : ''} hoy</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-green-400 bg-green-500/20 p-2 rounded-xl font-bold">{member.sales_count || 0} ventas</p>
                  </div>
                  {permisos.puedeEditarEquipo() && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                      <button onClick={() => setEditingMember(member)} className="bg-blue-600 p-2 rounded-xl hover:bg-blue-700">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => deleteMember(member.id)} className="bg-red-600 p-2 rounded-xl hover:bg-red-700">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              )
            })}
            {team.filter(t => t.role === 'vendedor').length === 0 && (
              <div className="empty-state text-center py-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-600/50 mb-2"><span className="text-2xl">{'\u{1F454}'}</span></div>
                <p className="text-slate-400 text-sm">Sin vendedores registrados</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
          <h3 className="text-xl font-semibold mb-4">Asesores Hipotecarios</h3>
          <div className="space-y-3">
            {team.filter(t => t.role === 'asesor').map(member => (
              <div key={member.id} className="team-card flex items-center justify-between bg-slate-700 p-4 rounded-xl group">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
                    <Users size={24} className="text-purple-400" />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-700 ${member.active ? 'bg-green-400 online-indicator' : 'bg-slate-500'}`} />
                  </div>
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-medium">Asesor</span>
                      <span className="text-slate-500 text-xs">{member.phone}</span>
                    </div>
                  </div>
                </div>
                {permisos.puedeEditarEquipo() && (
                  <button onClick={() => setEditingMember(member)} className="opacity-0 group-hover:opacity-100 bg-blue-600 p-2 rounded-xl">
                    <Edit size={16} />
                  </button>
                )}
              </div>
            ))}
            {team.filter(t => t.role === 'asesor').length === 0 && (
              <div className="empty-state text-center py-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-600/50 mb-2"><span className="text-2xl">{'\u{1F3E6}'}</span></div>
                <p className="text-slate-400 text-sm">Sin asesores hipotecarios</p>
              </div>
            )}
          </div>
        </div>


        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
          <h3 className="text-xl font-semibold mb-4">Coordinadoras</h3>
          <div className="space-y-3">
            {team.filter(t => t.role === "coordinador").map(member => (
              <div key={member.id} className="team-card flex items-center justify-between bg-slate-700 p-4 rounded-xl group">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center">
                    <Users size={24} className="text-green-400" />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-700 ${member.active ? 'bg-green-400 online-indicator' : 'bg-slate-500'}`} />
                  </div>
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">Coordinador</span>
                      <span className="text-slate-500 text-xs">{member.phone}</span>
                    </div>
                  </div>
                </div>
                {permisos.puedeEditarEquipo() && (
                  <button onClick={() => setEditingMember(member)} className="opacity-0 group-hover:opacity-100 bg-blue-600 p-2 rounded-xl">
                    <Edit size={16} />
                  </button>
                )}
              </div>
            ))}
            {team.filter(t => t.role === "coordinador").length === 0 && (
              <div className="empty-state text-center py-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-600/50 mb-2"><span className="text-2xl">{'\u{1F4CB}'}</span></div>
                <p className="text-slate-400 text-sm">Sin coordinadoras</p>
              </div>
            )}
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
          <h3 className="text-xl font-semibold mb-4">Marketing / Agencia</h3>
          <div className="space-y-3">
            {team.filter(t => t.role === 'agencia').map(member => (
              <div key={member.id} className="team-card flex items-center justify-between bg-slate-700 p-4 rounded-xl group">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full bg-orange-600/20 flex items-center justify-center">
                    <Megaphone size={24} className="text-orange-400" />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-700 ${member.active ? 'bg-green-400 online-indicator' : 'bg-slate-500'}`} />
                  </div>
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-medium">Marketing</span>
                      <span className="text-slate-500 text-xs">{member.phone}</span>
                    </div>
                  </div>
                </div>
                {permisos.puedeEditarEquipo() && (
                  <button onClick={() => setEditingMember(member)} className="opacity-0 group-hover:opacity-100 bg-blue-600 p-2 rounded-xl">
                    <Edit size={16} />
                  </button>
                )}
              </div>
            ))}
            {team.filter(t => t.role === 'agencia').length === 0 && (
              <div className="empty-state text-center py-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-600/50 mb-2"><span className="text-2xl">{'\u{1F4E2}'}</span></div>
                <p className="text-slate-400 text-sm">Sin personal de marketing</p>
              </div>
            )}
          </div>
        </div>
      </div>}
    </div>
  )
}
