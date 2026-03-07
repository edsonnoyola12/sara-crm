import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { API_BASE } from '../types/crm'

export default function MessageMetricsView() {
  const [loading, setLoading] = useState(true)
  const [messageMetrics, setMessageMetrics] = useState<any>(null)
  const [ttsMetrics, setTtsMetrics] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'todos' | 'tts'>('todos')
  const [diasFiltro, setDiasFiltro] = useState(7)
  const [refreshing, setRefreshing] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  const loadMetrics = async () => {
    try {
      const [msgRes, ttsRes] = await Promise.all([
        fetch(`${API_BASE}/api/message-metrics?days=${diasFiltro}`),
        fetch(`${API_BASE}/api/tts-metrics?days=${diasFiltro}`)
      ])
      const [msgData, ttsData] = await Promise.all([
        msgRes.ok ? msgRes.json() : null,
        ttsRes.ok ? ttsRes.json() : null
      ])
      setMessageMetrics(msgData)
      setTtsMetrics(ttsData)
    } catch (err) {
      console.error('Error loading message metrics:', err)
    }
  }

  useEffect(() => {
    setLoading(true)
    loadMetrics().finally(() => setLoading(false))
  }, [diasFiltro])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadMetrics()
    setRefreshing(false)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { sent: 'Enviado', delivered: 'Entregado', read: 'Leído', failed: 'Fallido' }
    return map[s] || s
  }

  const categoriaLabel = (c: string) => {
    const map: Record<string, string> = {
      respuesta_sara: 'Respuesta SARA', recordatorio: 'Recordatorio', alerta: 'Alerta',
      broadcast: 'Broadcast', bridge: 'Bridge', audio_tts: 'Audio TTS',
      notificacion: 'Notificacion', recurso: 'Recurso', template: 'Template',
      seguimiento: 'Seguimiento', encuesta: 'Encuesta', reporte: 'Reporte',
      cadencia: 'Cadencia', video: 'Video', carousel: 'Carousel'
    }
    return map[c] || c
  }

  const tipoLabel = (t: string) => {
    const map: Record<string, string> = {
      text: 'Texto', audio: 'Audio', template: 'Plantilla', image: 'Imagen',
      video: 'Video', document: 'Documento', sticker: 'Sticker', location: 'Ubicacion',
      interactive: 'Interactivo', contacts: 'Contacto', reaction: 'Reaccion'
    }
    return map[t] || t
  }

  // Build chart data from por_tipo_y_categoria
  const chartDataCategoria = (messageMetrics?.por_tipo_y_categoria || []).map((row: any) => ({
    name: categoriaLabel(row.categoria),
    enviados: row.enviados || 0,
    entregados: row.entregados || 0,
    leidos: row.leidos || 0,
    fallidos: row.fallidos || 0,
  }))

  // Pie chart data for status distribution
  const totalPeriodo = messageMetrics?.resumen_periodo
  const pieData = totalPeriodo ? [
    { name: 'Entregados', value: (totalPeriodo.total_entregados || 0) - (totalPeriodo.total_leidos || 0), color: '#22c55e' },
    { name: 'Leídos', value: totalPeriodo.total_leidos || 0, color: '#a855f7' },
    { name: 'Fallidos', value: totalPeriodo.total_fallidos || 0, color: '#ef4444' },
  ].filter(d => d.value > 0) : []

  // Filter messages by search
  const filteredMessages = (messageMetrics?.ultimos_mensajes || []).filter((msg: any) => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return (msg.destinatario || '').toLowerCase().includes(q) ||
      (msg.contenido || '').toLowerCase().includes(q) ||
      (msg.categoria || '').toLowerCase().includes(q)
  })

  const filteredTtsMessages = (ttsMetrics?.ultimos_mensajes || []).filter((msg: any) => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return (msg.destinatario || '').toLowerCase().includes(q) ||
      (msg.tipo || '').toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
          Metricas de Mensajes
        </h2>
        <div className="flex items-center gap-3">
          <select
            value={diasFiltro}
            onChange={(e) => setDiasFiltro(Number(e.target.value))}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
          >
            <option value={1}>Últimas 24h</option>
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 90 días</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('todos')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'todos' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-slate-700 hover:bg-slate-600'
          }`}
        >
          Todos los Mensajes
        </button>
        <button
          onClick={() => setActiveTab('tts')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'tts' ? 'bg-gradient-to-r from-purple-600 to-violet-600' : 'bg-slate-700 hover:bg-slate-600'
          }`}
        >
          Audios TTS
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
        </div>
      )}

      {/* Tab: Todos los mensajes */}
      {activeTab === 'todos' && !loading && messageMetrics && (
        <div className="space-y-6">
          {/* KPIs 24h */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">ENVIADOS (24h)</p>
              <p className="text-3xl font-bold text-blue-400">{messageMetrics.resumen_24h?.enviados || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">ENTREGADOS</p>
              <p className="text-3xl font-bold text-green-400">{messageMetrics.resumen_24h?.entregados || 0}</p>
              <p className="text-xs text-slate-400">{messageMetrics.resumen_24h?.tasaEntrega || 0}% tasa</p>
            </div>
            <div className="bg-gradient-to-br from-purple-600/20 to-violet-600/20 border border-purple-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">LEIDOS</p>
              <p className="text-3xl font-bold text-purple-400">{messageMetrics.resumen_24h?.leidos || 0}</p>
              <p className="text-xs text-slate-400">{messageMetrics.resumen_24h?.tasaLectura || 0}% tasa</p>
            </div>
            <div className="bg-gradient-to-br from-red-600/20 to-orange-600/20 border border-red-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">FALLIDOS</p>
              <p className="text-3xl font-bold text-red-400">{messageMetrics.resumen_24h?.fallidos || 0}</p>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart - por categoria */}
            {chartDataCategoria.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Mensajes por Categoria</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartDataCategoria} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                    <Legend />
                    <Bar dataKey="enviados" name="Enviados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="entregados" name="Entregados" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="leidos" name="Leídos" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Pie chart - distribucion de status */}
            {pieData.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Distribución de Status</h3>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({ name, value }: any) => `${name}: ${value}`}>
                        {pieData.map((entry: any, idx: number) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Resumen numerico */}
                <div className="grid grid-cols-3 gap-3 mt-4 text-center text-sm">
                  <div>
                    <p className="text-xl font-bold text-white">{totalPeriodo?.total_enviados || 0}</p>
                    <p className="text-xs text-slate-400">Enviados</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-400">{totalPeriodo?.total_entregados || 0}</p>
                    <p className="text-xs text-slate-400">Entregados</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-amber-400">{totalPeriodo?.tasa_lectura_global || '0%'}</p>
                    <p className="text-xs text-slate-400">Tasa Lectura</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Por tipo y categoria - tabla */}
          {messageMetrics.por_tipo_y_categoria?.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Desglose por Tipo y Categoria</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="text-left py-2 px-3">Tipo</th>
                      <th className="text-left py-2 px-3">Categoria</th>
                      <th className="text-right py-2 px-3">Enviados</th>
                      <th className="text-right py-2 px-3">Entregados</th>
                      <th className="text-right py-2 px-3">Leídos</th>
                      <th className="text-right py-2 px-3">Tasa Lectura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messageMetrics.por_tipo_y_categoria.map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-2 px-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            row.tipo === 'text' ? 'bg-blue-500/30 text-blue-300' :
                            row.tipo === 'audio' ? 'bg-purple-500/30 text-purple-300' :
                            row.tipo === 'template' ? 'bg-amber-500/30 text-amber-300' :
                            'bg-slate-500/30 text-slate-300'
                          }`}>
                            {row.tipo}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300">{categoriaLabel(row.categoria)}</td>
                        <td className="py-2 px-3 text-right">{row.enviados}</td>
                        <td className="py-2 px-3 text-right text-green-400">{row.entregados}</td>
                        <td className="py-2 px-3 text-right text-purple-400">{row.leidos}</td>
                        <td className="py-2 px-3 text-right text-amber-400">{row.tasa_lectura}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Búsqueda + Últimos mensajes */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h3 className="text-lg font-bold">Últimos Mensajes</h3>
              <input
                type="text"
                placeholder="Buscar por destinatario o contenido..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm w-full sm:w-72"
              />
            </div>
            {filteredMessages.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredMessages.map((msg: any, idx: number) => (
                  <div key={idx} className="flex flex-wrap items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                    <span className={`px-2 py-1 rounded text-xs shrink-0 ${
                      msg.tipo === 'text' ? 'bg-blue-500/30 text-blue-300' :
                      msg.tipo === 'audio' ? 'bg-purple-500/30 text-purple-300' :
                      msg.tipo === 'template' ? 'bg-amber-500/30 text-amber-300' :
                      'bg-slate-500/30 text-slate-300'
                    }`}>
                      {tipoLabel(msg.tipo)}
                    </span>
                    <span className="text-xs text-slate-400 shrink-0 w-20 font-mono">{msg.destinatario || '?'}</span>
                    <span className="flex-1 text-sm text-slate-300 truncate min-w-0" title={msg.contenido || '-'}>{msg.contenido || '-'}</span>
                    <span className={`px-2 py-1 rounded text-xs shrink-0 ${
                      msg.status === 'read' ? 'bg-purple-500/30 text-purple-300' :
                      msg.status === 'delivered' ? 'bg-green-500/30 text-green-300' :
                      msg.status === 'sent' ? 'bg-blue-500/30 text-blue-300' :
                      'bg-red-500/30 text-red-300'
                    }`}>
                      {statusLabel(msg.status)}
                    </span>
                    <span className="text-xs text-slate-400 shrink-0">{formatDate(msg.enviado)}</span>
                    {msg.leido && <span className="text-xs text-purple-400 shrink-0">{formatDate(msg.leido)}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm text-center py-4">
                {busqueda ? 'Sin resultados para esa busqueda' : 'No hay mensajes en este periodo'}
              </p>
            )}
          </div>

          {/* Nota sobre confirmaciones */}
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4">
            <p className="text-amber-300 text-sm">
              <strong>Nota:</strong> Los "leidos" solo se registran si el destinatario tiene las confirmaciones de lectura activadas en WhatsApp.
            </p>
          </div>
        </div>
      )}

      {/* Tab: Audios TTS */}
      {activeTab === 'tts' && !loading && ttsMetrics && (
        <div className="space-y-6">
          {/* KPIs TTS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-600/20 to-violet-600/20 border border-purple-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">AUDIOS ENVIADOS</p>
              <p className="text-3xl font-bold text-purple-400">{ttsMetrics.resumen?.total_enviados || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">ENTREGADOS</p>
              <p className="text-3xl font-bold text-green-400">{ttsMetrics.resumen?.total_entregados || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">ESCUCHADOS</p>
              <p className="text-3xl font-bold text-amber-400">{ttsMetrics.resumen?.total_escuchados || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-xl p-4">
              <p className="text-[11px] font-medium text-slate-400 mb-1">TASA ESCUCHA</p>
              <p className="text-3xl font-bold text-cyan-400">{ttsMetrics.resumen?.tasa_escucha_global || '0%'}</p>
            </div>
          </div>

          {/* TTS Bar Chart */}
          {ttsMetrics.por_tipo?.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Audios por Tipo</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={(ttsMetrics.por_tipo || []).map((r: any) => ({
                  name: r.tipo, enviados: r.enviados || 0, entregados: r.entregados || 0, escuchados: r.escuchados || 0
                }))} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                  <Bar dataKey="enviados" name="Enviados" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="entregados" name="Entregados" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="escuchados" name="Escuchados" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Por tipo de audio - tabla */}
          {ttsMetrics.por_tipo?.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Desglose por Tipo de Audio</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="text-left py-2 px-3">Tipo</th>
                      <th className="text-right py-2 px-3">Enviados</th>
                      <th className="text-right py-2 px-3">Entregados</th>
                      <th className="text-right py-2 px-3">Escuchados</th>
                      <th className="text-right py-2 px-3">Tasa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ttsMetrics.por_tipo.map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-2 px-3 text-slate-300">{row.tipo}</td>
                        <td className="py-2 px-3 text-right">{row.enviados}</td>
                        <td className="py-2 px-3 text-right text-green-400">{row.entregados}</td>
                        <td className="py-2 px-3 text-right text-amber-400">{row.escuchados}</td>
                        <td className="py-2 px-3 text-right text-cyan-400">{row.tasa_escucha}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Últimos audios con búsqueda */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h3 className="text-lg font-bold">Últimos Audios</h3>
              <input
                type="text"
                placeholder="Buscar por destinatario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm w-full sm:w-72"
              />
            </div>
            {filteredTtsMessages.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredTtsMessages.map((msg: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-purple-400 shrink-0">🎤</span>
                    <span className="text-xs text-slate-400 w-20 font-mono shrink-0">{msg.destinatario || '?'}</span>
                    <span className="flex-1 text-sm text-slate-300">{tipoLabel(msg.tipo)}</span>
                    <span className={`px-2 py-1 rounded text-xs shrink-0 ${
                      msg.status === 'read' ? 'bg-amber-500/30 text-amber-300' :
                      msg.status === 'delivered' ? 'bg-green-500/30 text-green-300' :
                      'bg-blue-500/30 text-blue-300'
                    }`}>
                      {msg.status === 'read' ? 'Escuchado' : statusLabel(msg.status)}
                    </span>
                    <span className="text-xs text-slate-400 shrink-0">{formatDate(msg.enviado)}</span>
                    {msg.escuchado && <span className="text-xs text-amber-400 shrink-0">{formatDate(msg.escuchado)}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm text-center py-4">
                {busqueda ? 'Sin resultados para esa busqueda' : 'No hay audios en este periodo'}
              </p>
            )}
          </div>

          {/* Info sobre confirmaciones de lectura */}
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4">
            <p className="text-amber-300 text-sm">
              <strong>Nota:</strong> Los "escuchados" solo se registran si el destinatario tiene las confirmaciones de lectura activadas en WhatsApp.
              Si un usuario tiene esta opcion desactivada, el audio aparecera como "entregado" pero no como "escuchado".
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !messageMetrics && !ttsMetrics && (
        <div className="text-center py-12 text-slate-400">
          <p>No se pudieron cargar las metricas. Verifica la conexion con el backend.</p>
        </div>
      )}
    </div>
  )
}
