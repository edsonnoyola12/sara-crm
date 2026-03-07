import { useState, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'

interface FollowupRule {
  id: string
  name: string
  funnel: 'ventas' | 'hipoteca'
  trigger_event: string
  trigger_status: string | null
  requires_no_response: boolean
  delay_hours: number
  message_template: string
  is_active: boolean
  sequence_order: number
  sequence_group: string
}

interface ScheduledFollowup {
  id: string
  lead_id: string
  rule_id: string
  lead_phone: string
  lead_name: string
  desarrollo: string
  message: string
  scheduled_at: string
  sent: boolean
  sent_at: string | null
  cancelled: boolean
  cancel_reason: string | null
  created_at: string
}

export default function FollowupsView({ supabase }: { supabase: any }) {
  const [rules, setRules] = useState<FollowupRule[]>([])
  const [scheduled, setScheduled] = useState<ScheduledFollowup[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'rules' | 'scheduled' | 'history'>('rules')
  const [stats, setStats] = useState({ pendientes: 0, enviadosHoy: 0, canceladosHoy: 0 })
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    const { data: rulesData } = await supabase
      .from('followup_rules')
      .select('*')
      .order('funnel')
      .order('sequence_order')

    const { data: scheduledData } = await supabase
      .from('scheduled_followups')
      .select('*')
      .order('scheduled_at', { ascending: true })
      .limit(100)

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const { count: pendientes } = await supabase
      .from('scheduled_followups')
      .select('*', { count: 'exact', head: true })
      .eq('sent', false)
      .eq('cancelled', false)

    const { count: enviadosHoy } = await supabase
      .from('scheduled_followups')
      .select('*', { count: 'exact', head: true })
      .eq('sent', true)
      .gte('sent_at', hoy.toISOString())

    const { count: canceladosHoy } = await supabase
      .from('scheduled_followups')
      .select('*', { count: 'exact', head: true })
      .eq('cancelled', true)
      .gte('created_at', hoy.toISOString())

    setRules(rulesData || [])
    setScheduled(scheduledData || [])
    setStats({
      pendientes: pendientes || 0,
      enviadosHoy: enviadosHoy || 0,
      canceladosHoy: canceladosHoy || 0
    })
    setLoading(false)
  }

  async function toggleRuleActive(rule: FollowupRule) {
    await supabase
      .from('followup_rules')
      .update({ is_active: !rule.is_active })
      .eq('id', rule.id)
    setRules(rules.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r))
  }

  async function updateRuleDelay(rule: FollowupRule, newDelay: number) {
    await supabase
      .from('followup_rules')
      .update({ delay_hours: newDelay })
      .eq('id', rule.id)
    setRules(rules.map(r => r.id === rule.id ? { ...r, delay_hours: newDelay } : r))
  }

  function cancelFollowup(followup: ScheduledFollowup) {
    setConfirmModal({
      title: 'Cancelar follow-up',
      message: `¿Cancelar follow-up para ${followup.lead_name}?`,
      onConfirm: async () => {
        await supabase
          .from('scheduled_followups')
          .update({ cancelled: true, cancel_reason: 'manual_cancel' })
          .eq('id', followup.id)
        loadData()
        setConfirmModal(null)
      }
    })
  }

  function formatDelay(hours: number): string {
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    if (remainingHours === 0) return `${days}d`
    return `${days}d ${remainingHours}h`
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  }

  const ventasRules = rules.filter(r => r.funnel === 'ventas')
  const hipotecaRules = rules.filter(r => r.funnel === 'hipoteca')
  const pendingFollowups = scheduled.filter(s => !s.sent && !s.cancelled)
  const sentFollowups = scheduled.filter(s => s.sent)
  const cancelledFollowups = scheduled.filter(s => s.cancelled)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">📬 Follow-ups Automáticos</h2>
        <button onClick={loadData} className="px-4 py-2 bg-slate-700 rounded-xl hover:bg-slate-600 flex items-center gap-2">
          🔄 Actualizar
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl">
          <p className="text-blue-200 text-sm">Pendientes</p>
          <p className="text-4xl font-bold">{stats.pendientes}</p>
        </div>
        <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-2xl">
          <p className="text-green-200 text-sm">Enviados Hoy</p>
          <p className="text-4xl font-bold">{stats.enviadosHoy}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-600 to-orange-800 p-6 rounded-2xl">
          <p className="text-orange-200 text-sm">Cancelados Hoy</p>
          <p className="text-4xl font-bold">{stats.canceladosHoy}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-700 pb-2">
        <button onClick={() => setActiveTab('rules')} className={`px-4 py-2 rounded-t-xl ${activeTab === 'rules' ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-700'}`}>
          ⚙️ Reglas ({rules.length})
        </button>
        <button onClick={() => setActiveTab('scheduled')} className={`px-4 py-2 rounded-t-xl ${activeTab === 'scheduled' ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-700'}`}>
          📅 Programados ({pendingFollowups.length})
        </button>
        <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-t-xl ${activeTab === 'history' ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-700'}`}>
          📜 Historial
        </button>
      </div>

      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              🏠 Funnel Ventas
              <span className="text-sm font-normal text-slate-400">({ventasRules.length} reglas)</span>
            </h3>
            <div className="space-y-3">
              {ventasRules.map(rule => (
                <div key={rule.id} className={`flex items-center justify-between p-4 rounded-xl ${rule.is_active ? 'bg-slate-700' : 'bg-slate-800 opacity-50'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${rule.is_active ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                      <span className="font-semibold">{rule.name}</span>
                      {rule.requires_no_response && (
                        <span className="text-xs bg-yellow-600/30 text-yellow-400 px-2 py-1 rounded">Solo sin respuesta</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{rule.trigger_event} ↑ {rule.trigger_status || 'cualquier'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-sm">Delay:</span>
                      <input type="number" value={rule.delay_hours} onChange={(e) => updateRuleDelay(rule, parseInt(e.target.value) || 1)} className="w-20 bg-slate-600 rounded-lg p-2 text-center font-bold" min="1" />
                      <span className="text-slate-400 text-sm">hrs</span>
                      <span className="text-slate-400 text-xs">({formatDelay(rule.delay_hours)})</span>
                    </div>
                    <button onClick={() => toggleRuleActive(rule)} className={`px-3 py-2 rounded-lg ${rule.is_active ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'}`}>
                      {rule.is_active ? '✓ Activa' : 'Inactiva'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              💳 Funnel Hipoteca
              <span className="text-sm font-normal text-slate-400">({hipotecaRules.length} reglas)</span>
            </h3>
            <div className="space-y-3">
              {hipotecaRules.map(rule => (
                <div key={rule.id} className={`flex items-center justify-between p-4 rounded-xl ${rule.is_active ? 'bg-slate-700' : 'bg-slate-800 opacity-50'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${rule.is_active ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                      <span className="font-semibold">{rule.name}</span>
                      {rule.requires_no_response && (
                        <span className="text-xs bg-yellow-600/30 text-yellow-400 px-2 py-1 rounded">Solo sin respuesta</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{rule.trigger_event} ↑ {rule.trigger_status || 'cualquier'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-sm">Delay:</span>
                      <input type="number" value={rule.delay_hours} onChange={(e) => updateRuleDelay(rule, parseInt(e.target.value) || 1)} className="w-20 bg-slate-600 rounded-lg p-2 text-center font-bold" min="1" />
                      <span className="text-slate-400 text-sm">hrs</span>
                      <span className="text-slate-400 text-xs">({formatDelay(rule.delay_hours)})</span>
                    </div>
                    <button onClick={() => toggleRuleActive(rule)} className={`px-3 py-2 rounded-lg ${rule.is_active ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'}`}>
                      {rule.is_active ? '✓ Activa' : 'Inactiva'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-4">
            <p className="text-blue-300 text-sm">
              💡 <strong>Tip:</strong> Modifica el delay (horas) para ajustar cuándo se envía cada follow-up.
              Los cambios aplican a futuros follow-ups, no a los ya programados.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'scheduled' && (
        <div className="bg-slate-800/50 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">📅 Follow-ups Programados</h3>
          {pendingFollowups.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <p className="text-slate-300 text-lg font-medium">Todo al dia</p>
              <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">No hay follow-ups pendientes. Se programan automaticamente cuando un lead agenda cita o cambia de status</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingFollowups.map(followup => (
                <div key={followup.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{followup.lead_name || 'Sin nombre'}</span>
                      <span className="text-xs bg-blue-600/30 text-blue-400 px-2 py-1 rounded">{followup.desarrollo}</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1 truncate max-w-md" title={followup.message}>{followup.message}</p>
                    <p className="text-xs text-slate-400 mt-1">📱 {followup.lead_phone}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-yellow-400">⏰ {formatDate(followup.scheduled_at)}</p>
                      <p className="text-xs text-slate-400">Programado</p>
                    </div>
                    <button onClick={() => cancelFollowup(followup)} className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/40">
                      Cancelar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 text-green-400">✅ Enviados ({sentFollowups.length})</h3>
            {sentFollowups.length === 0 ? (
              <p className="text-slate-500 text-center py-6 text-sm">Los follow-ups enviados por SARA apareceran aqui</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-auto">
                {sentFollowups.slice(0, 20).map(followup => (
                  <div key={followup.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div>
                      <span className="font-semibold">{followup.lead_name}</span>
                      <span className="text-slate-400 text-sm ml-2">• {followup.desarrollo}</span>
                    </div>
                    <span className="text-sm text-green-400">{formatDate(followup.sent_at || '')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 text-orange-400">❌ Cancelados ({cancelledFollowups.length})</h3>
            {cancelledFollowups.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No hay follow-ups cancelados</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-auto">
                {cancelledFollowups.slice(0, 20).map(followup => (
                  <div key={followup.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div>
                      <span className="font-semibold">{followup.lead_name}</span>
                      <span className="text-slate-400 text-sm ml-2">• {followup.desarrollo}</span>
                    </div>
                    <span className="text-sm text-orange-400">{followup.cancel_reason || 'manual'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setConfirmModal(null)}>
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-slate-400 mb-5">{confirmModal.message}</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmModal(null)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm">Cancelar</button>
              <button onClick={confirmModal.onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
