import { useState, useEffect, Fragment } from 'react'
import { RefreshCw, Search, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'

const INTENT_COLORS: Record<string, string> = {
  'interes_desarrollo': '#3b82f6', 'solicitar_cita': '#22c55e', 'confirmar_cita': '#10b981',
  'info_credito': '#8b5cf6', 'saludo': '#f59e0b', 'despedida': '#6b7280',
  'hablar_humano': '#ef4444', 'otro': '#94a3b8', 'info_desarrollo': '#06b6d4',
}

export default function SaraAiView() {
  const [aiResponses, setAiResponses] = useState<any[]>([])
  const [aiResponsesLoading, setAiResponsesLoading] = useState(false)
  const [aiDaysFilter, setAiDaysFilter] = useState(7)
  const [aiTab, setAiTab] = useState<'responses' | 'health' | 'delivery'>('responses')
  const [healthHistory, setHealthHistory] = useState<any[]>([])
  const [retryQueue, setRetryQueue] = useState<any[]>([])
  const [aiSearchTerm, setAiSearchTerm] = useState('')
  const [expandedAiLogId, setExpandedAiLogId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setAiResponsesLoading(true)
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - aiDaysFilter)
    const since = daysAgo.toISOString()
    Promise.all([
      supabase.from('ai_responses').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(200),
      supabase.from('health_checks').select('*').order('created_at', { ascending: false }).limit(168),
      supabase.from('retry_queue').select('*').order('created_at', { ascending: false }).limit(50)
    ]).then(([aiRes, healthRes, retryRes]) => {
      setAiResponses(aiRes.data || [])
      setHealthHistory(healthRes.data || [])
      setRetryQueue(retryRes.data || [])
      setAiResponsesLoading(false)
    })
  }, [aiDaysFilter, refreshKey])

  // KPIs
  const totalResponses = aiResponses.length
  const avgResponseTime = totalResponses > 0 ? Math.round(aiResponses.reduce((s, r) => s + (r.response_time_ms || 0), 0) / totalResponses) : 0
  const avgTokens = totalResponses > 0 ? Math.round(aiResponses.reduce((s, r) => s + (r.tokens_used || 0), 0) / totalResponses) : 0
  const intentCounts: Record<string, number> = {}
  aiResponses.forEach(r => { const i = r.intent || 'otro'; intentCounts[i] = (intentCounts[i] || 0) + 1 })
  const topIntent = Object.entries(intentCounts).sort((a, b) => b[1] - a[1])[0]

  // Chart data - response times over time (grouped by hour)
  const timeChartData = (() => {
    const grouped: Record<string, { times: number[], tokens: number[], count: number }> = {}
    aiResponses.forEach(r => {
      const d = new Date(r.created_at)
      const key = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:00`
      if (!grouped[key]) grouped[key] = { times: [], tokens: [], count: 0 }
      grouped[key].times.push(r.response_time_ms || 0)
      grouped[key].tokens.push(r.tokens_used || 0)
      grouped[key].count++
    })
    return Object.entries(grouped).map(([time, data]) => ({
      time,
      avgTime: Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length),
      count: data.count
    })).slice(-48)
  })()

  // Intent pie chart data
  const intentPieData = Object.entries(intentCounts).map(([name, value]) => ({
    name, value, fill: INTENT_COLORS[name] || '#94a3b8'
  })).sort((a, b) => b.value - a.value)

  // Filtered AI log
  const filteredAiLog = aiResponses.filter(r => {
    if (!aiSearchTerm) return true
    const term = aiSearchTerm.toLowerCase()
    return (r.lead_phone || '').includes(term) || (r.lead_message || '').toLowerCase().includes(term) || (r.ai_response || '').toLowerCase().includes(term) || (r.intent || '').toLowerCase().includes(term)
  })

  // Health trending
  const healthTrending = healthHistory.map(h => {
    const d = new Date(h.created_at)
    const details = typeof h.details === 'string' ? JSON.parse(h.details || '{}') : (h.details || {})
    return {
      time: `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,
      supabase: details.supabase_latency || details.supabase?.latency || 0,
      meta: details.meta_latency || details.meta?.latency || 0,
      openai: details.openai_latency || details.openai?.latency || 0,
      status: h.status
    }
  }).reverse().slice(-48)

  // Retry queue KPIs
  const retryPending = retryQueue.filter(r => r.status === 'pending').length
  const retryDelivered = retryQueue.filter(r => r.status === 'delivered').length
  const retryFailed = retryQueue.filter(r => r.status === 'failed_permanent').length
  const retryTotal = retryQueue.length
  const retrySuccessRate = retryTotal > 0 ? Math.round((retryDelivered / retryTotal) * 100) : 100

  return (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-3xl font-bold">SARA Intelligence</h2>
      <button onClick={() => setRefreshKey(k => k + 1)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-600 transition-all">
        <RefreshCw size={14} className={aiResponsesLoading ? 'animate-spin' : ''} /> Actualizar
      </button>
    </div>

    {/* Tabs */}
    <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl w-fit">
      {([['responses', 'Respuestas IA'], ['health', 'Salud'], ['delivery', 'Delivery']] as const).map(([key, label]) => (
        <button key={key} onClick={() => setAiTab(key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${aiTab === key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
          {label}
        </button>
      ))}
    </div>

    {aiResponsesLoading ? <div className="flex items-center justify-center py-20"><RefreshCw size={24} className="animate-spin text-blue-400" /></div> : <>

    {/* === TAB 1: AI RESPONSES === */}
    {aiTab === 'responses' && (
      <div className="space-y-6">
        {/* Day filter chips */}
        <div className="flex gap-2">
          {[1, 3, 7, 30].map(d => (
            <button key={d} onClick={() => setAiDaysFilter(d)} className={`px-3 py-1 rounded-lg text-sm transition-all ${aiDaysFilter === d ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>
              {d}d
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
            <p className="text-sm text-slate-400">Total Respuestas</p>
            <p className="text-3xl font-bold text-white mt-1">{totalResponses}</p>
            <p className="text-xs text-slate-500 mt-1">ultimos {aiDaysFilter}d</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
            <p className="text-sm text-slate-400">Tiempo Promedio</p>
            <p className="text-3xl font-bold text-blue-400 mt-1">{avgResponseTime < 1000 ? `${avgResponseTime}ms` : `${(avgResponseTime/1000).toFixed(1)}s`}</p>
            <p className="text-xs text-slate-500 mt-1">respuesta IA</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
            <p className="text-sm text-slate-400">Tokens Promedio</p>
            <p className="text-3xl font-bold text-purple-400 mt-1">{avgTokens.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">por mensaje</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
            <p className="text-sm text-slate-400">Intent Principal</p>
            <p className="text-xl font-bold text-amber-400 mt-1 truncate">{topIntent ? topIntent[0].replace('_', ' ') : '-'}</p>
            <p className="text-xs text-slate-500 mt-1">{topIntent ? `${topIntent[1]} veces` : ''}</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Response Time Chart */}
          <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Tiempo de Respuesta</h3>
            {timeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={timeChartData}>
                  <defs>
                    <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}s` : `${v}ms`} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: 12 }} formatter={(v: number) => [`${(v/1000).toFixed(1)}s`, 'Tiempo']} />
                  <Area type="monotone" dataKey="avgTime" stroke="#3b82f6" fill="url(#colorTime)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-[220px] text-slate-500 text-sm">Sin datos</div>}
          </div>

          {/* Intent Distribution */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Intents</h3>
            {intentPieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={intentPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2} dataKey="value">
                      {intentPieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {intentPieData.slice(0, 5).map(ip => (
                    <div key={ip.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ip.fill }} />
                      <span className="text-slate-400 truncate flex-1">{ip.name.replace('_', ' ')}</span>
                      <span className="text-slate-300 font-medium">{ip.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="flex items-center justify-center h-[160px] text-slate-500 text-sm">Sin datos</div>}
          </div>
        </div>

        {/* Response Log Table */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300">Log de Respuestas</h3>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={aiSearchTerm} onChange={e => setAiSearchTerm(e.target.value)} placeholder="Buscar..." className="pl-8 pr-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white w-48 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 text-xs border-b border-slate-700/50">
                  <th className="pb-2 pr-3">Tiempo</th>
                  <th className="pb-2 pr-3">Telefono</th>
                  <th className="pb-2 pr-3">Mensaje Lead</th>
                  <th className="pb-2 pr-3">Respuesta SARA</th>
                  <th className="pb-2 pr-3">Intent</th>
                  <th className="pb-2 pr-3 text-right">ms</th>
                  <th className="pb-2 text-right">Tokens</th>
                </tr>
              </thead>
              <tbody>
                {filteredAiLog.slice(0, 50).map(r => {
                  const ago = (() => {
                    const mins = Math.round((Date.now() - new Date(r.created_at).getTime()) / 60000)
                    if (mins < 60) return `${mins}m`
                    if (mins < 1440) return `${Math.round(mins/60)}h`
                    return `${Math.round(mins/1440)}d`
                  })()
                  const isExpanded = expandedAiLogId === r.id
                  return (
                    <Fragment key={r.id}>
                      <tr onClick={() => setExpandedAiLogId(isExpanded ? null : r.id)} className="ai-log-row border-b border-slate-700/30 cursor-pointer">
                        <td className="py-2 pr-3 text-slate-400 whitespace-nowrap">{ago}</td>
                        <td className="py-2 pr-3 text-slate-300 font-mono text-xs">{(r.lead_phone || '').slice(-10)}</td>
                        <td className="py-2 pr-3 text-slate-300 max-w-[200px] truncate">{r.lead_message?.slice(0, 60)}</td>
                        <td className="py-2 pr-3 text-slate-400 max-w-[250px] truncate">{r.ai_response?.slice(0, 80)}</td>
                        <td className="py-2 pr-3">
                          <span className="intent-badge" style={{ background: `${INTENT_COLORS[r.intent] || '#94a3b8'}22`, color: INTENT_COLORS[r.intent] || '#94a3b8' }}>
                            {(r.intent || 'otro').replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-right text-slate-400">{r.response_time_ms ? `${(r.response_time_ms/1000).toFixed(1)}s` : '-'}</td>
                        <td className="py-2 text-right text-slate-400">{r.tokens_used?.toLocaleString() || '-'}</td>
                      </tr>
                      {isExpanded && (
                        <tr><td colSpan={7} className="p-3 bg-slate-700/30">
                          <div className="space-y-2">
                            <div><span className="text-xs text-slate-500">Mensaje completo:</span><p className="text-sm text-slate-200 mt-0.5">{r.lead_message}</p></div>
                            <div><span className="text-xs text-slate-500">Respuesta SARA:</span><p className="text-sm text-slate-300 mt-0.5">{r.ai_response}</p></div>
                            <div className="flex gap-4 text-xs text-slate-500">
                              <span>Modelo: {r.model_used || '-'}</span>
                              <span>Input: {r.input_tokens?.toLocaleString() || '-'}</span>
                              <span>Output: {r.output_tokens?.toLocaleString() || '-'}</span>
                            </div>
                          </div>
                        </td></tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
            {filteredAiLog.length === 0 && <div className="text-center py-8 text-slate-500 text-sm">Sin respuestas en el periodo</div>}
            {filteredAiLog.length > 50 && <p className="text-center text-xs text-slate-500 mt-2">Mostrando 50 de {filteredAiLog.length}</p>}
          </div>
        </div>
      </div>
    )}

    {/* === TAB 2: HEALTH TRENDING === */}
    {aiTab === 'health' && (
      <div className="space-y-6">
        {/* Current Health Status */}
        {healthHistory.length > 0 && (() => {
          const latest = healthHistory[0]
          const details = typeof latest.details === 'string' ? JSON.parse(latest.details || '{}') : (latest.details || {})
          const ago = Math.round((Date.now() - new Date(latest.created_at).getTime()) / 60000)
          return (
            <div className={`border rounded-2xl p-4 ${latest.status === 'healthy' ? 'bg-green-500/5 border-green-500/30' : 'bg-red-500/5 border-red-500/30'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${latest.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="font-bold text-lg">{latest.status === 'healthy' ? 'Sistema Saludable' : 'Problemas Detectados'}</span>
                <span className="text-sm text-slate-400 ml-auto">hace {ago < 60 ? `${ago}m` : `${Math.round(ago/60)}h`}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div className="text-center">
                  <div className={`text-2xl ${latest.supabase_ok ? '' : 'grayscale'}`}>{latest.supabase_ok ? '\u{1F7E2}' : '\u{1F534}'}</div>
                  <p className="text-xs text-slate-400 mt-1">Supabase</p>
                  <p className="text-xs text-slate-500">{details.supabase_latency || details.supabase?.latency || '?'}ms</p>
                </div>
                <div className="text-center">
                  <div className={`text-2xl ${latest.meta_ok ? '' : 'grayscale'}`}>{latest.meta_ok ? '\u{1F7E2}' : '\u{1F534}'}</div>
                  <p className="text-xs text-slate-400 mt-1">Meta API</p>
                  <p className="text-xs text-slate-500">{details.meta_latency || details.meta?.latency || '?'}ms</p>
                </div>
                <div className="text-center">
                  <div className={`text-2xl ${latest.openai_ok ? '' : 'grayscale'}`}>{latest.openai_ok ? '\u{1F7E2}' : '\u{1F534}'}</div>
                  <p className="text-xs text-slate-400 mt-1">OpenAI</p>
                  <p className="text-xs text-slate-500">{details.openai_latency || details.openai?.latency || '?'}ms</p>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Latency Trending Chart */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Latencia por Servicio</h3>
          {healthTrending.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={healthTrending}>
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}ms`} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: 11 }} formatter={(v: number, name: string) => [`${v}ms`, name === 'supabase' ? 'Supabase' : name === 'meta' ? 'Meta' : 'OpenAI']} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="supabase" stroke="#22c55e" strokeWidth={1.5} dot={false} name="Supabase" />
                <Line type="monotone" dataKey="meta" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="Meta" />
                <Line type="monotone" dataKey="openai" stroke="#a855f7" strokeWidth={1.5} dot={false} name="OpenAI" />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-[280px] text-slate-500 text-sm">Sin datos de health checks</div>}
        </div>

        {/* Uptime Grid */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Uptime (ultimos {Math.min(healthHistory.length, 48)} checks)</h3>
          <div className="flex flex-wrap gap-1">
            {healthHistory.slice(0, 48).reverse().map((h, i) => {
              const d = new Date(h.created_at)
              const timeStr = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
              const color = h.status === 'healthy' ? 'bg-green-500' : h.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              return (
                <div key={i} className={`uptime-square ${color}`} title={`${timeStr} - ${h.status}`} />
              )
            })}
          </div>
          {healthHistory.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Sin health checks registrados</p>}
        </div>
      </div>
    )}

    {/* === TAB 3: MESSAGE DELIVERY === */}
    {aiTab === 'delivery' && (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
            <p className="text-sm text-slate-400">Pendientes</p>
            <p className="text-3xl font-bold text-amber-400 mt-1">{retryPending}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
            <p className="text-sm text-slate-400">Entregados</p>
            <p className="text-3xl font-bold text-green-400 mt-1">{retryDelivered}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
            <p className="text-sm text-slate-400">Fallidos</p>
            <p className="text-3xl font-bold text-red-400 mt-1">{retryFailed}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
            <p className="text-sm text-slate-400">Tasa Exito</p>
            <p className="text-3xl font-bold text-blue-400 mt-1">{retrySuccessRate}%</p>
          </div>
        </div>

        {/* Retry Queue Table */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Cola de Reintentos</h3>
          {retryQueue.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 text-xs border-b border-slate-700/50">
                    <th className="pb-2 pr-3">Tiempo</th>
                    <th className="pb-2 pr-3">Telefono</th>
                    <th className="pb-2 pr-3">Tipo</th>
                    <th className="pb-2 pr-3">Status</th>
                    <th className="pb-2 pr-3 text-right">Intentos</th>
                    <th className="pb-2">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {retryQueue.map(r => {
                    const ago = (() => {
                      const mins = Math.round((Date.now() - new Date(r.created_at).getTime()) / 60000)
                      if (mins < 60) return `${mins}m`
                      if (mins < 1440) return `${Math.round(mins/60)}h`
                      return `${Math.round(mins/1440)}d`
                    })()
                    const statusColor = r.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : r.status === 'delivered' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    return (
                      <tr key={r.id} className="border-b border-slate-700/30">
                        <td className="py-2 pr-3 text-slate-400 whitespace-nowrap">{ago}</td>
                        <td className="py-2 pr-3 text-slate-300 font-mono text-xs">{(r.recipient_phone || '').slice(-10)}</td>
                        <td className="py-2 pr-3 text-slate-300">{r.message_type || 'text'}</td>
                        <td className="py-2 pr-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>{r.status}</span></td>
                        <td className="py-2 pr-3 text-right text-slate-400">{r.attempts || 0}/{r.max_attempts || 3}</td>
                        <td className="py-2 text-slate-500 text-xs max-w-[200px] truncate">{r.last_error || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
              <p className="text-sm">Cola vacia — todos los mensajes entregados</p>
            </div>
          )}
        </div>
      </div>
    )}

    </>}
  </div>
  )
}
