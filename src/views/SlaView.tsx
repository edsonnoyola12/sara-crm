import { useState, useEffect } from 'react'
import { Clock, RefreshCw, CheckCircle } from 'lucide-react'
import { API_BASE } from '../types/crm'

export default function SlaView() {
  const [slaData, setSlaData] = useState<any>(null)
  const [slaMetrics, setSlaMetrics] = useState<any>(null)
  const [slaLoading, setSlaLoading] = useState(false)

  const loadSla = () => {
    setSlaLoading(true)
    Promise.all([
      fetch(`${API_BASE}/api/sla/pending`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_BASE}/api/sla/metrics`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_BASE}/api/sla/violations`).then(r => r.ok ? r.json() : null).catch(() => null)
    ]).then(([pending, metrics, violations]) => {
      setSlaData({ pending: pending?.pending || {}, violations: violations?.violations || [] })
      setSlaMetrics(metrics?.metrics || null)
      setSlaLoading(false)
    }).catch(() => setSlaLoading(false))
  }

  useEffect(() => { loadSla() }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold flex items-center gap-3"><Clock size={28} /> SLA - Tiempos de Respuesta</h2>
        <button onClick={loadSla} className="bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2 text-sm">
          <RefreshCw size={16} className={slaLoading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {slaLoading && !slaMetrics ? (
        <div className="flex items-center justify-center py-20"><RefreshCw size={32} className="animate-spin text-blue-400" /></div>
      ) : (<>
        {slaMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Cumplimiento SLA</div>
              <div className={`text-3xl font-bold ${(slaMetrics.slaComplianceRate || 0) >= 90 ? 'text-green-400' : (slaMetrics.slaComplianceRate || 0) >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                {Math.round(slaMetrics.slaComplianceRate || 0)}%
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                <div className={`h-1.5 rounded-full ${(slaMetrics.slaComplianceRate || 0) >= 90 ? 'bg-green-400' : (slaMetrics.slaComplianceRate || 0) >= 70 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${Math.min(100, slaMetrics.slaComplianceRate || 0)}%` }} />
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Tiempo Resp. Promedio</div>
              <div className="text-3xl font-bold text-blue-400">{Math.round(slaMetrics.avgFirstResponseMinutes || 0)}<span className="text-lg text-slate-400">min</span></div>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Violaciones</div>
              <div className={`text-3xl font-bold ${(slaMetrics.violations || 0) === 0 ? 'text-green-400' : 'text-red-400'}`}>{slaMetrics.violations || 0}</div>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Leads Atendidos</div>
              <div className="text-3xl font-bold text-white">{slaMetrics.totalLeads || 0}</div>
            </div>
          </div>
        )}

        {slaMetrics?.violationsByType && (
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-bold mb-4">Violaciones por Tipo</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{slaMetrics?.violationsByType?.first_response || 0}</div>
                <div className="text-xs text-slate-400 mt-1">Primera Respuesta</div>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">{slaMetrics?.violationsByType?.follow_up || 0}</div>
                <div className="text-xs text-slate-400 mt-1">Seguimiento</div>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{slaMetrics?.violationsByType?.escalation || 0}</div>
                <div className="text-xs text-slate-400 mt-1">Escalamiento</div>
              </div>
            </div>
          </div>
        )}

        {slaMetrics?.violationsByVendor && slaMetrics.violationsByVendor.length > 0 && (
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-bold mb-4">Cumplimiento por Vendedor</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs border-b border-slate-700">
                    <th className="text-left py-2 px-3">Vendedor</th>
                    <th className="text-center py-2 px-3">Cumplimiento</th>
                    <th className="text-center py-2 px-3">Violaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(slaMetrics?.violationsByVendor || [])].sort((a: any, b: any) => (a.complianceRate || 0) - (b.complianceRate || 0)).map((v: any, i: number) => (
                    <tr key={v.vendorId || i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                      <td className="py-2.5 px-3 font-medium">{v.vendorName}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`font-bold ${v.complianceRate >= 90 ? 'text-green-400' : v.complianceRate >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {Math.round(v.complianceRate)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${v.violations === 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {v.violations}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {slaData?.pending && (
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              Respuestas Pendientes
              {((slaData.pending.warnings?.length || 0) + (slaData.pending.breaches?.length || 0) + (slaData.pending.escalations?.length || 0)) > 0 && (
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{(slaData.pending.warnings?.length || 0) + (slaData.pending.breaches?.length || 0) + (slaData.pending.escalations?.length || 0)}</span>
              )}
            </h3>
            {(slaData.pending.total || 0) === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
                <p className="text-sm">Todas las respuestas al dia</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(slaData.pending.escalations || []).map((p: any, i: number) => (
                  <div key={`esc-${i}`} className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-red-300">{p.leadName}</span>
                        <span className="text-[10px] bg-red-500/30 text-red-300 px-1.5 py-0.5 rounded-full">ESCALADO</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">Vendedor: {p.vendorName} — Esperando {Math.round(p.waitingMinutes)} min (limite: {p.slaLimit} min)</div>
                    </div>
                  </div>
                ))}
                {(slaData.pending.breaches || []).map((p: any, i: number) => (
                  <div key={`br-${i}`} className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-orange-300">{p.leadName}</span>
                        <span className="text-[10px] bg-orange-500/30 text-orange-300 px-1.5 py-0.5 rounded-full">VIOLACION</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">Vendedor: {p.vendorName} — {Math.round(p.waitingMinutes)} min ({Math.round(p.percentUsed)}% del SLA)</div>
                    </div>
                  </div>
                ))}
                {(slaData.pending.warnings || []).map((p: any, i: number) => (
                  <div key={`warn-${i}`} className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-yellow-300">{p.leadName}</span>
                        <span className="text-[10px] bg-yellow-500/30 text-yellow-300 px-1.5 py-0.5 rounded-full">ADVERTENCIA</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">Vendedor: {p.vendorName} — {Math.round(p.waitingMinutes)} min ({Math.round(p.percentUsed)}% del SLA)</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {slaData?.violations && slaData.violations.length > 0 && (
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-bold mb-4">Violaciones Recientes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs border-b border-slate-700">
                    <th className="text-left py-2 px-3">Lead</th>
                    <th className="text-left py-2 px-3">Vendedor</th>
                    <th className="text-center py-2 px-3">Tipo</th>
                    <th className="text-center py-2 px-3">Tiempo Real</th>
                    <th className="text-center py-2 px-3">Limite</th>
                    <th className="text-center py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {slaData.violations.slice(0, 20).map((v: any, i: number) => (
                    <tr key={v.id || i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                      <td className="py-2.5 px-3 font-medium">{v.leadName}</td>
                      <td className="py-2.5 px-3 text-slate-400">{v.vendorName}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-600/50 text-slate-300">
                          {v.violationType === 'first_response' ? '1ra Resp.' : v.violationType === 'follow_up' ? 'Follow-up' : 'Escalado'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-red-400 font-mono">{Math.round(v.actualMinutes)} min</td>
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{v.expectedMinutes} min</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${v.status === 'resolved' ? 'bg-green-500/20 text-green-400' : v.status === 'escalated' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                          {v.status === 'resolved' ? 'Resuelto' : v.status === 'escalated' ? 'Escalado' : 'Abierto'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!slaMetrics && !slaData && (
          <div className="text-center py-12 text-slate-500">
            <Clock size={40} className="mx-auto mb-3" />
            <p className="text-lg font-medium">Sin datos de SLA</p>
            <p className="text-sm mt-1">Los datos se generan conforme se procesan mensajes</p>
          </div>
        )}
      </>)}
    </div>
  )
}
