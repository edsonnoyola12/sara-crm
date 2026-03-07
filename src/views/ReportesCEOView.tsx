import { useState, useEffect } from 'react'
import { RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { API_BASE, safeFetch } from '../types/crm'

export default function ReportesCEOView() {
  const [activeTab, setActiveTab] = useState<'diario' | 'semanal' | 'mensual'>('semanal')
  const [loading, setLoading] = useState(true)
  const [reporteDiario, setReporteDiario] = useState<any>(null)
  const [reporteSemanal, setReporteSemanal] = useState<any>(null)
  const [reporteMensual, setReporteMensual] = useState<any>(null)

  const hoy = new Date()
  const [mesSeleccionado, setMesSeleccionado] = useState(hoy.getMonth() + 1)
  const [añoSeleccionado, setAñoSeleccionado] = useState(hoy.getFullYear())

  const [preguntaIA, setPreguntaIA] = useState('')
  const [respuestaIA, setRespuestaIA] = useState('')
  const [loadingIA, setLoadingIA] = useState(false)

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1']

  useEffect(() => { loadReportes() }, [mesSeleccionado, añoSeleccionado])

  async function loadReportes() {
    setLoading(true)
    try {
      const [diario, semanal, mensual] = await Promise.all([
        fetch(`${API_BASE}/api/reportes/diario`).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE}/api/reportes/semanal`).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE}/api/reportes/mensual?mes=${mesSeleccionado}&ano=${añoSeleccionado}`).then(r => r.ok ? r.json() : null)
      ])
      setReporteDiario(diario)
      setReporteSemanal(semanal)
      setReporteMensual(mensual)
    } catch (err) { console.error('Error cargando reportes:', err) }
    setLoading(false)
  }

  async function preguntarIA() {
    if (!preguntaIA.trim()) return
    setLoadingIA(true); setRespuestaIA('')
    try {
      const data = await safeFetch(`${API_BASE}/api/reportes/ask`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: preguntaIA, contexto: { mensual: reporteMensual, semanal: reporteSemanal, diario: reporteDiario } })
      })
      setRespuestaIA(data.respuesta || 'No pude procesar tu pregunta.')
    } catch { setRespuestaIA('Error al consultar IA.') }
    setLoadingIA(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div></div>

  // Chart data transforms
  const rankingChartData = (data: any[]) => (data || []).map(v => ({ name: (v.name || '').split(' ')[0], ventas: v.ventas || 0, citas: v.citas || 0, revenue: Math.round((v.revenue || 0) / 1000000 * 10) / 10 })).slice(0, 8)
  const fuentesChartData = (data: any[]) => (data || []).filter(f => f.leads > 0).map(f => ({ name: f.fuente || 'Otro', value: f.leads }))
  const desarrollosChartData = (data: any[]) => (data || []).map(d => ({ name: (d.desarrollo || '').substring(0, 12), ventas: d.ventas || 0, revenue: Math.round((d.revenue || 0) / 1000000 * 10) / 10 }))

  return (
    <div className="space-y-6 section-enter">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Reportes CEO</h2>
        <div className="flex items-center gap-3">
          <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(Number(e.target.value))} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm">
            {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={añoSeleccionado} onChange={(e) => setAñoSeleccionado(Number(e.target.value))} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={loadReportes} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center gap-2"><RefreshCw size={14} /> Actualizar</button>
        </div>
      </div>

      {/* Chat IA */}
      <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 p-4 rounded-2xl">
        <div className="flex gap-3">
          <input type="text" value={preguntaIA} onChange={(e) => setPreguntaIA(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && preguntarIA()} placeholder="Pregunta sobre tus reportes..." className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 placeholder-slate-500 text-sm" />
          <button onClick={preguntarIA} disabled={loadingIA} className="px-5 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold disabled:opacity-50 text-sm">{loadingIA ? '...' : 'Preguntar'}</button>
        </div>
        {respuestaIA && <div className="mt-3 p-4 bg-slate-800/50 rounded-xl"><p className="text-purple-300 whitespace-pre-wrap text-sm">{respuestaIA}</p></div>}
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700 w-fit">
        {(['diario', 'semanal', 'mensual'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${activeTab === tab ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
            {tab === 'diario' ? 'Diario' : tab === 'semanal' ? 'Semanal' : 'Mensual'}
          </button>
        ))}
      </div>

      {/* ═══ DIARIO ═══ */}
      {activeTab === 'diario' && reporteDiario && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { val: reporteDiario.hoy?.leads_nuevos || reporteDiario.ayer?.leads_nuevos || 0, label: 'Leads Nuevos', color: 'text-blue-400', sub: 'Hoy' },
              { val: reporteDiario.hoy?.citas_agendadas || 0, label: 'Citas Hoy', color: 'text-purple-400' },
              { val: reporteDiario.pipeline?.leads_hot || 0, label: 'Leads HOT', color: 'text-orange-400' },
              { val: reporteDiario.pipeline?.leads_estancados || 0, label: 'Estancados', color: 'text-red-400' },
            ].map((kpi, i) => (
              <div key={i} className="kpi-card bg-slate-800/60 border border-slate-700/50 p-4 rounded-2xl text-center">
                <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.val}</p>
                <p className="text-xs text-slate-400 mt-1">{kpi.label}</p>
              </div>
            ))}
          </div>

          {reporteDiario.pipeline?.leads_estancados > 0 && (
            <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-xl flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-400" />
              <p className="text-red-400 text-sm font-medium">{reporteDiario.pipeline.leads_estancados} leads sin contactar</p>
            </div>
          )}

          {/* Ayer vs Hoy comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl">
              <h4 className="text-sm font-semibold text-slate-400 mb-3">Ayer</h4>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-slate-400 text-sm">Leads</span><span className="font-bold text-blue-400">{reporteDiario.ayer?.leads_nuevos || 0}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 text-sm">Cierres</span><span className="font-bold text-green-400">{reporteDiario.ayer?.cierres || 0}</span></div>
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl">
              <h4 className="text-sm font-semibold text-slate-400 mb-3">Hoy</h4>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-slate-400 text-sm">Leads</span><span className="font-bold text-blue-400">{reporteDiario.hoy?.leads_nuevos || 0}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 text-sm">Citas</span><span className="font-bold text-purple-400">{reporteDiario.hoy?.citas_agendadas || 0}</span></div>
              </div>
            </div>
          </div>

          {/* Citas de hoy - table */}
          {reporteDiario.hoy?.citas?.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl">
              <h4 className="font-semibold mb-3 text-sm">Citas del Dia</h4>
              <div className="space-y-2">
                {reporteDiario.hoy.citas.map((cita: any, i: number) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono bg-slate-700 px-2 py-1 rounded">{cita.hora?.substring(0,5)}</span>
                      <span className="text-sm">{cita.lead || 'Sin nombre'}</span>
                      {cita.desarrollo && <span className="text-xs text-slate-500">{cita.desarrollo}</span>}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${cita.status === 'scheduled' ? 'bg-green-600/30 text-green-400' : 'bg-slate-600/30 text-slate-400'}`}>
                      {cita.status === 'scheduled' ? 'Confirmada' : cita.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pipeline snapshot - horizontal bars */}
          <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl">
            <h4 className="font-semibold mb-3 text-sm">Pipeline Snapshot</h4>
            <div className="space-y-2">
              {[
                { label: 'Nuevos', val: reporteDiario.pipeline?.nuevos || 0, color: 'bg-blue-500' },
                { label: 'Contactados', val: reporteDiario.pipeline?.contactados || 0, color: 'bg-purple-500' },
                { label: 'Con cita', val: reporteDiario.pipeline?.con_cita || reporteDiario.hoy?.citas_agendadas || 0, color: 'bg-amber-500' },
                { label: 'HOT', val: reporteDiario.pipeline?.leads_hot || 0, color: 'bg-red-500' },
              ].map((item, i) => {
                const maxVal = Math.max(...[reporteDiario.pipeline?.nuevos || 0, reporteDiario.pipeline?.contactados || 0, reporteDiario.pipeline?.con_cita || 0, reporteDiario.pipeline?.leads_hot || 0, 1])
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-24">{item.label}</span>
                    <div className="flex-1 h-5 bg-slate-700/50 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full funnel-bar`} style={{ width: `${(item.val / maxVal) * 100}%` }}></div>
                    </div>
                    <span className="text-xs font-bold w-8 text-right">{item.val}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ SEMANAL ═══ */}
      {activeTab === 'semanal' && reporteSemanal && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { val: reporteSemanal.resumen?.leads_nuevos || 0, label: 'Leads', color: 'text-blue-400' },
              { val: reporteSemanal.resumen?.citas_totales || 0, label: 'Citas', color: 'text-purple-400' },
              { val: reporteSemanal.resumen?.cierres || 0, label: 'Cierres', color: 'text-green-400' },
              { val: reporteSemanal.resumen?.revenue_formatted || '$0', label: 'Revenue', color: 'text-amber-400' },
              { val: `${reporteSemanal.conversion?.lead_a_cierre || 0}%`, label: 'Conversión', color: 'text-cyan-400' },
            ].map((kpi, i) => (
              <div key={i} className="kpi-card bg-slate-800/60 border border-slate-700/50 p-4 rounded-2xl text-center">
                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.val}</p>
                <p className="text-xs text-slate-400 mt-1">{kpi.label}</p>
              </div>
            ))}
          </div>

          {reporteSemanal.conversion?.insight && (
            <div className={`p-3 rounded-xl text-sm ${reporteSemanal.conversion?.lead_a_cierre >= 5 ? 'bg-green-900/20 border border-green-500/30 text-green-300' : 'bg-yellow-900/20 border border-yellow-500/30 text-yellow-300'}`}>
              {reporteSemanal.conversion.insight}
            </div>
          )}

          {/* Conversion Funnel - visual */}
          <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl">
            <h4 className="font-semibold mb-4 text-sm">Funnel de Conversión</h4>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {[
                { label: 'Leads', val: reporteSemanal.resumen?.leads_nuevos || 0, color: 'bg-blue-500', pct: '' },
                { label: 'Citas', val: reporteSemanal.resumen?.citas_totales || 0, color: 'bg-purple-500', pct: `${reporteSemanal.conversion?.lead_a_cita || 0}%` },
                { label: 'Cierres', val: reporteSemanal.resumen?.cierres || 0, color: 'bg-green-500', pct: `${reporteSemanal.conversion?.cita_a_cierre || 0}%` },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 && <div className="flex flex-col items-center"><ArrowRight size={14} className="text-slate-500" /><span className="text-[10px] text-slate-500">{step.pct}</span></div>}
                  <div className="text-center">
                    <div className={`w-16 h-16 ${step.color}/20 border-2 ${step.color.replace('bg-', 'border-')} rounded-full flex items-center justify-center mx-auto mb-1`}>
                      <span className="text-lg font-bold">{step.val}</span>
                    </div>
                    <span className="text-xs text-slate-400">{step.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Ranking Chart */}
            {reporteSemanal.ranking_vendedores?.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl">
                <h4 className="font-semibold mb-3 text-sm">Ranking Vendedores</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={rankingChartData(reporteSemanal.ranking_vendedores)} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={70} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                    <Bar dataKey="ventas" fill="#10b981" radius={[0,4,4,0]} name="Ventas" />
                    <Bar dataKey="citas" fill="#3b82f6" radius={[0,4,4,0]} name="Citas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Fuentes PieChart */}
            {reporteSemanal.fuentes?.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl">
                <h4 className="font-semibold mb-3 text-sm">Fuentes de Leads</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={fuentesChartData(reporteSemanal.fuentes)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {fuentesChartData(reporteSemanal.fuentes).map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Cierres Detalle */}
          {reporteSemanal.cierres_detalle?.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl">
              <h4 className="font-semibold mb-3 text-sm">Cierres de la Semana</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-slate-500 text-xs border-b border-slate-700"><th className="pb-2">Lead</th><th className="pb-2">Propiedad</th><th className="pb-2 text-right">Precio</th><th className="pb-2">Fecha</th></tr></thead>
                  <tbody>
                    {reporteSemanal.cierres_detalle.map((c: any, i: number) => (
                      <tr key={i} className="border-b border-slate-700/30"><td className="py-2">{c.lead || c.nombre}</td><td className="py-2 text-slate-400">{c.propiedad || c.desarrollo}</td><td className="py-2 text-right text-green-400">${((c.precio || 0)/1000000).toFixed(1)}M</td><td className="py-2 text-slate-500">{c.fecha}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ MENSUAL ═══ */}
      {activeTab === 'mensual' && reporteMensual && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { val: reporteMensual.resumen?.leads_nuevos || 0, label: 'Leads', color: 'text-blue-400', growth: reporteMensual.resumen?.crecimiento_leads },
              { val: reporteMensual.resumen?.citas_totales || 0, label: 'Citas', color: 'text-purple-400' },
              { val: reporteMensual.resumen?.cierres || 0, label: 'Cierres', color: 'text-green-400' },
              { val: reporteMensual.resumen?.revenue_formatted || '$0', label: 'Revenue', color: 'text-amber-400' },
              { val: `${reporteMensual.conversion?.lead_a_cita || 0}%`, label: 'Lead→Cita', color: 'text-cyan-400' },
              { val: `${reporteMensual.conversion?.cita_a_cierre || 0}%`, label: 'Cita→Cierre', color: 'text-emerald-400' },
            ].map((kpi, i) => (
              <div key={i} className="kpi-card bg-slate-800/60 border border-slate-700/50 p-3 rounded-2xl text-center">
                <p className={`text-xl font-bold ${kpi.color}`}>{kpi.val}</p>
                <p className="text-[10px] text-slate-400 mt-1">{kpi.label}</p>
                {kpi.growth != null && kpi.growth !== 0 && <p className={`text-[10px] ${kpi.growth > 0 ? 'text-green-400' : 'text-red-400'}`}>{kpi.growth > 0 ? '↑' : '↓'}{Math.abs(kpi.growth)}%</p>}
              </div>
            ))}
          </div>

          {/* Funnel visual with bars */}
          <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl">
            <h4 className="font-semibold mb-4 text-sm">Funnel de Conversión</h4>
            <div className="space-y-3">
              {[
                { label: 'Leads', val: reporteMensual.resumen?.leads_nuevos || 0, color: 'bg-blue-500', pct: 100 },
                { label: 'Citas', val: reporteMensual.resumen?.citas_totales || 0, color: 'bg-purple-500', pct: reporteMensual.conversion?.lead_a_cita || 0 },
                { label: 'Cierres', val: reporteMensual.resumen?.cierres || 0, color: 'bg-green-500', pct: reporteMensual.conversion?.lead_a_cierre || 0 },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-16">{step.label}</span>
                  <div className="flex-1 h-8 bg-slate-700/30 rounded-lg overflow-hidden relative">
                    <div className={`h-full ${step.color} rounded-lg funnel-bar flex items-center px-3`} style={{ width: `${Math.max(step.pct, 5)}%` }}>
                      <span className="text-xs font-bold text-white drop-shadow">{step.val}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 w-10 text-right">{step.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue por Desarrollo - BarChart */}
            {reporteMensual.desarrollos?.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl">
                <h4 className="font-semibold mb-3 text-sm">Revenue por Desarrollo</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={desarrollosChartData(reporteMensual.desarrollos)} margin={{ bottom: 20 }}>
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-30} textAnchor="end" />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} formatter={(val: any) => [`$${val}M`, 'Revenue']} />
                    <Bar dataKey="revenue" radius={[4,4,0,0]}>
                      {desarrollosChartData(reporteMensual.desarrollos).map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Fuentes PieChart */}
            {reporteMensual.fuentes?.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl">
                <h4 className="font-semibold mb-3 text-sm">Fuentes de Leads</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={fuentesChartData(reporteMensual.fuentes)} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {fuentesChartData(reporteMensual.fuentes).map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Ranking Vendedores - table + chart */}
          {reporteMensual.ranking_vendedores?.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl">
              <h4 className="font-semibold mb-3 text-sm">Ranking de Vendedores</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-slate-500 text-xs border-b border-slate-700"><th className="pb-2">#</th><th className="pb-2">Vendedor</th><th className="pb-2 text-right">Ventas</th><th className="pb-2 text-right">Citas</th><th className="pb-2 text-right">Revenue</th></tr></thead>
                    <tbody>
                      {reporteMensual.ranking_vendedores.map((v: any) => (
                        <tr key={v.posicion} className="border-b border-slate-700/30">
                          <td className="py-2">{v.posicion === 1 ? <span className="medal-gold">🥇</span> : v.posicion === 2 ? '🥈' : v.posicion === 3 ? '🥉' : <span className="text-slate-500">{v.posicion}</span>}</td>
                          <td className="py-2 font-medium">{v.name}</td>
                          <td className="py-2 text-right text-green-400 font-medium">{v.ventas}</td>
                          <td className="py-2 text-right text-blue-400">{v.citas}</td>
                          <td className="py-2 text-right text-amber-400">${((v.revenue || 0)/1000000).toFixed(1)}M</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={rankingChartData(reporteMensual.ranking_vendedores)} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={60} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                    <Bar dataKey="ventas" fill="#10b981" radius={[0,4,4,0]} name="Ventas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
