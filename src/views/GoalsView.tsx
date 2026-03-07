import { useState, useEffect } from 'react'
import { Target, Calendar as CalendarIcon, Users, BarChart3, AlertTriangle, CheckCircle, Download } from 'lucide-react'
import { useCrm } from '../context/CrmContext'

export default function GoalsView() {
  const { team, leads, supabase, permisos, showToast, currentUser } = useCrm()

  const [monthlyGoals, setMonthlyGoals] = useState<{ month: string; company_goal: number }>({ month: '', company_goal: 0 })
  const [vendorGoals, setVendorGoals] = useState<{ vendor_id: string; goal: number; name: string }[]>([])
  const [selectedGoalMonth, setSelectedGoalMonth] = useState(new Date().toISOString().slice(0, 7))
  const [annualGoal, setAnnualGoal] = useState<{ year: number; goal: number }>({ year: new Date().getFullYear(), goal: 0 })
  const [selectedGoalYear, setSelectedGoalYear] = useState(new Date().getFullYear())

  // ============ METAS MENSUALES ============
  const loadMonthlyGoals = async (month: string) => {
    const { data: companyGoal } = await supabase
      .from('monthly_goals')
      .select('*')
      .eq('month', month)
      .single()

    if (companyGoal) {
      setMonthlyGoals({ month: companyGoal.month, company_goal: companyGoal.company_goal })
    } else {
      setMonthlyGoals({ month, company_goal: 0 })
    }

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

  const saveCompanyGoal = async (goal: number) => {
    await supabase.from('monthly_goals').upsert({
      month: selectedGoalMonth,
      company_goal: goal
    }, { onConflict: 'month' })
    setMonthlyGoals({ month: selectedGoalMonth, company_goal: goal })
  }

  const saveVendorGoal = async (vendorId: string, goal: number) => {
    await supabase.from('vendor_monthly_goals').upsert({
      month: selectedGoalMonth,
      vendor_id: vendorId,
      goal: goal
    }, { onConflict: 'month,vendor_id' })
  }

  // ============ METAS ANUALES ============
  const loadAnnualGoal = async (year: number) => {
    const { data } = await supabase
      .from('annual_goals')
      .select('*')
      .eq('year', year)
      .single()

    if (data) {
      setAnnualGoal({ year: data.year, goal: data.goal })
    } else {
      setAnnualGoal({ year, goal: 0 })
    }
  }

  const saveAnnualGoal = async (goal: number) => {
    await supabase.from('annual_goals').upsert({
      year: selectedGoalYear,
      goal: goal
    }, { onConflict: 'year' })
    setAnnualGoal({ year: selectedGoalYear, goal })
  }

  // Distribuir meta mensual equitativamente entre vendedores
  const distributeGoalsEqually = async () => {
    const activeVendors = team.filter(t => t.role === 'vendedor' && t.active)
    if (activeVendors.length === 0 || monthlyGoals.company_goal === 0) return

    const goalPerVendor = Math.floor(monthlyGoals.company_goal / activeVendors.length)
    const remainder = monthlyGoals.company_goal % activeVendors.length

    const newGoals = activeVendors.map((v, index) => ({
      vendor_id: v.id,
      goal: goalPerVendor + (index < remainder ? 1 : 0), // distribuir el residuo
      name: v.name
    }))

    setVendorGoals(newGoals)

    // Guardar todas las metas
    for (const vg of newGoals) {
      await supabase.from('vendor_monthly_goals').upsert({
        month: selectedGoalMonth,
        vendor_id: vg.vendor_id,
        goal: vg.goal
      }, { onConflict: 'month,vendor_id' })
    }
  }

  // Aplicar meta anual dividida en 12 meses
  const applyAnnualToMonthly = async () => {
    if (annualGoal.goal === 0) return
    const monthlyGoalValue = Math.round(annualGoal.goal / 12)

    // Guardar para todos los meses del ano
    for (let m = 1; m <= 12; m++) {
      const month = `${selectedGoalYear}-${m.toString().padStart(2, '0')}`
      await supabase.from('monthly_goals').upsert({
        month,
        company_goal: monthlyGoalValue
      }, { onConflict: 'month' })
    }

    // Actualizar el mes actual si coincide el ano
    if (selectedGoalMonth.startsWith(selectedGoalYear.toString())) {
      setMonthlyGoals({ month: selectedGoalMonth, company_goal: monthlyGoalValue })
    }
  }

  const getReservedByVendor = (vendorId: string) => {
    return leads.filter(l =>
      l.assigned_to === vendorId &&
      (l.status === 'reserved' || l.status === 'Reservado')
    ).length
  }

  const getNegotiationByVendor = (vendorId: string) => {
    return leads.filter(l =>
      l.assigned_to === vendorId &&
      (l.status === 'negotiation' || l.status === 'Negociacion')
    ).length
  }

  useEffect(() => {
    if (team.length > 0) loadMonthlyGoals(selectedGoalMonth)
  }, [selectedGoalMonth, team.length])

  useEffect(() => {
    loadAnnualGoal(selectedGoalYear)
  }, [selectedGoalYear])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          {currentUser?.role === 'vendedor' ? 'Mi Meta' : 'Planeacion de Metas'}
        </h2>
        {!permisos.puedeEditarMetas() && (
          <span className="text-xs text-slate-400 bg-slate-700 px-3 py-2 rounded-lg">👁️ Solo lectura</span>
        )}
        <div className="flex gap-2">
          {/* Exportar CSV */}
          <button
            onClick={() => {
              const currentMonth = selectedGoalMonth
              const rows = [
                ['REPORTE DE METAS - ' + new Date(currentMonth + '-01').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase()],
                [],
                ['META ANUAL', annualGoal.goal + ' casas', 'Promedio mensual: ' + Math.round(annualGoal.goal / 12)],
                ['META MENSUAL', monthlyGoals.company_goal + ' casas'],
                [],
                ['VENDEDOR', 'META', 'CERRADOS', 'RESERVADOS', 'NEGOCIANDO', '% AVANCE'],
                ...vendorGoals.map(vg => {
                  const closed = leads.filter(l => l.assigned_to === vg.vendor_id && (l.status === 'closed' || l.status === 'delivered' || l.status === 'sold') && l.status_changed_at?.startsWith(currentMonth)).length
                  const reserved = leads.filter(l => l.assigned_to === vg.vendor_id && l.status === 'reserved').length
                  const negotiation = leads.filter(l => l.assigned_to === vg.vendor_id && l.status === 'negotiation').length
                  const pct = vg.goal > 0 ? Math.round((closed / vg.goal) * 100) : 0
                  return [vg.name, vg.goal, closed, reserved, negotiation, pct + '%']
                }),
                [],
                ['TOTAL', vendorGoals.reduce((s, v) => s + v.goal, 0), '', '', '', '']
              ]
              const csv = rows.map(r => r.join(',')).join('\n')
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = `metas_${currentMonth}.csv`
              link.click()
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium"
          >
            <Download size={16} />
            Excel/CSV
          </button>
          {/* Imprimir/PDF */}
          <button
            onClick={() => {
              const monthName = new Date(selectedGoalMonth + '-01').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
              const vendorRows = vendorGoals.map(vg => {
                const closed = leads.filter(l => l.assigned_to === vg.vendor_id && (l.status === 'closed' || l.status === 'delivered' || l.status === 'sold') && l.status_changed_at?.startsWith(selectedGoalMonth)).length
                const reserved = leads.filter(l => l.assigned_to === vg.vendor_id && l.status === 'reserved').length
                const negotiation = leads.filter(l => l.assigned_to === vg.vendor_id && l.status === 'negotiation').length
                const pct = vg.goal > 0 ? Math.round((closed / vg.goal) * 100) : 0
                return '<tr><td><strong>' + vg.name + '</strong></td><td>' + vg.goal + '</td><td>' + closed + '</td><td>' + reserved + '</td><td>' + negotiation + '</td><td><div class="progress"><div class="progress-bar" style="width:' + Math.min(pct, 100) + '%"></div></div><strong>' + pct + '%</strong></td></tr>'
              }).join('')
              const totalGoal = vendorGoals.reduce((s, v) => s + v.goal, 0)
              const printContent = '<html><head><title>Reporte de Metas</title><style>body{font-family:Arial,sans-serif;padding:20px}h1{color:#333;border-bottom:2px solid #333;padding-bottom:10px}h2{color:#666;margin-top:30px}table{width:100%;border-collapse:collapse;margin-top:15px}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f5f5f5;font-weight:bold}.meta-box{display:inline-block;padding:15px 25px;margin:10px;background:#f0f0f0;border-radius:8px}.meta-box .number{font-size:32px;font-weight:bold;color:#333}.meta-box .label{font-size:12px;color:#666}.progress{height:10px;background:#e0e0e0;border-radius:5px;overflow:hidden}.progress-bar{height:100%;background:#4CAF50}.footer{margin-top:30px;font-size:12px;color:#999;border-top:1px solid #eee;padding-top:10px}</style></head><body><h1>Reporte de Metas - ' + monthName + '</h1><div style="margin:20px 0;"><div class="meta-box"><div class="number">' + annualGoal.goal + '</div><div class="label">Meta Anual ' + selectedGoalYear + '</div></div><div class="meta-box"><div class="number">' + Math.round(annualGoal.goal / 12) + '</div><div class="label">Meta Mensual Promedio</div></div><div class="meta-box"><div class="number">' + monthlyGoals.company_goal + '</div><div class="label">Meta Este Mes</div></div></div><h2>Metas por Vendedor</h2><table><thead><tr><th>Vendedor</th><th>Meta</th><th>Cerrados</th><th>Reservados</th><th>Negociando</th><th>Avance</th></tr></thead><tbody>' + vendorRows + '</tbody><tfoot><tr style="background:#f5f5f5;"><td><strong>TOTAL</strong></td><td><strong>' + totalGoal + '</strong></td><td colspan="4"></td></tr></tfoot></table><div class="footer">Generado el ' + new Date().toLocaleString('es-MX') + ' - SARA CRM</div></body></html>'
              const printWindow = window.open('', '_blank')
              if (printWindow) {
                printWindow.document.write(printContent)
                printWindow.document.close()
                printWindow.print()
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
          >
            <Download size={16} />
            PDF / Imprimir
          </button>
        </div>
      </div>

      {/* META ANUAL */}
      <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Target className="text-purple-400" size={24} />
            Meta Anual de Empresa
          </h3>
          <select
            value={selectedGoalYear}
            onChange={(e) => setSelectedGoalYear(parseInt(e.target.value))}
            className="bg-slate-700 px-4 py-2 rounded-lg"
          >
            {[2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/60 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-2">Meta anual (casas)</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={annualGoal.goal}
                onChange={(e) => permisos.puedeEditarMetas() && setAnnualGoal({...annualGoal, goal: parseInt(e.target.value) || 0})}
                readOnly={!permisos.puedeEditarMetas()}
                className={`bg-slate-700 px-4 py-3 rounded-lg w-full text-3xl font-bold text-center text-purple-400 ${!permisos.puedeEditarMetas() ? 'opacity-70 cursor-not-allowed' : ''}`}
                placeholder="0"
              />
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-2">Equivale a mensual</p>
            <p className="text-3xl font-bold text-cyan-400 text-center py-2">
              {Math.round(annualGoal.goal / 12)} <span className="text-base text-slate-400">casas/mes</span>
            </p>
          </div>

          {permisos.puedeEditarMetas() && (
            <div className="bg-slate-800/60 rounded-xl p-4 flex flex-col justify-center gap-2">
              <button
                onClick={() => saveAnnualGoal(annualGoal.goal)}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium text-sm"
              >
                Guardar Meta Anual
              </button>
              <button
                onClick={async () => {
                  await applyAnnualToMonthly()
                  showToast(`Meta de ${Math.round(annualGoal.goal / 12)} casas aplicada a los 12 meses de ${selectedGoalYear}`, 'success')
                }}
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 px-4 py-2 rounded-lg font-medium text-sm"
              >
                Aplicar a Todos los Meses
              </button>
            </div>
          )}
        </div>
      </div>

      {/* META MENSUAL */}
      <div className="bg-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <CalendarIcon className="text-blue-400" size={24} />
            Meta Mensual de Empresa
          </h3>
          <input
            type="month"
            value={selectedGoalMonth}
            onChange={(e) => setSelectedGoalMonth(e.target.value)}
            className="bg-slate-700 px-4 py-2 rounded-lg"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={monthlyGoals.company_goal}
              onChange={(e) => permisos.puedeEditarMetas() && setMonthlyGoals({...monthlyGoals, company_goal: parseInt(e.target.value) || 0})}
              readOnly={!permisos.puedeEditarMetas()}
              className={`bg-slate-700 px-4 py-3 rounded-lg w-32 text-2xl font-bold text-center ${!permisos.puedeEditarMetas() ? 'opacity-70 cursor-not-allowed' : ''}`}
            />
            <span className="text-xl text-slate-400">casas</span>
          </div>
          {permisos.puedeEditarMetas() && (
            <button
              onClick={() => saveCompanyGoal(monthlyGoals.company_goal)}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
            >
              Guardar
            </button>
          )}
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Avance del equipo ({(() => { const [y, m] = selectedGoalMonth.split('-'); return new Date(parseInt(y), parseInt(m) - 1, 15).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }) })()})</span>
            <span className="font-bold">{leads.filter(l => (l.status === 'closed' || l.status === 'Cerrado' || l.status === 'delivered' || l.status === 'sold') && l.status_changed_at?.startsWith(selectedGoalMonth)).length} / {monthlyGoals.company_goal || 0}</span>
          </div>
          <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
              style={{ width: `${Math.min(100, (leads.filter(l => (l.status === 'closed' || l.status === 'Cerrado' || l.status === 'delivered' || l.status === 'sold') && l.status_changed_at?.startsWith(selectedGoalMonth)).length / (monthlyGoals.company_goal || 1)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* DISTRIBUCION POR VENDEDOR */}
      <div className="bg-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Users className="text-green-400" size={24} />
            Metas por Vendedor
          </h3>
          {permisos.puedeEditarMetas() && (
            <button
              onClick={async () => {
                await distributeGoalsEqually()
                showToast('Metas distribuidas equitativamente entre vendedores', 'success')
              }}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              <Users size={18} />
              Distribuir Equitativamente
            </button>
          )}
        </div>

        {vendorGoals.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No hay vendedores activos</p>
        ) : (
          <div className="space-y-4">
            {vendorGoals.map(vg => {
              const closedThisMonth = leads.filter(l =>
                l.assigned_to === vg.vendor_id &&
                (l.status === 'closed' || l.status === 'Cerrado' || l.status === 'delivered' || l.status === 'sold') &&
                l.status_changed_at?.startsWith(selectedGoalMonth)
              ).length
              const reserved = getReservedByVendor(vg.vendor_id)
              const negotiation = getNegotiationByVendor(vg.vendor_id)
              const percentage = vg.goal > 0 ? Math.round((closedThisMonth / vg.goal) * 100) : 0

              return (
                <div key={vg.vendor_id} className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center font-bold">
                        {vg.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{vg.name}</p>
                        <p className="text-sm text-slate-400">
                          {closedThisMonth} cerrados | {reserved} reservados | {negotiation} negociando
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={vg.goal}
                        onChange={(e) => {
                          if (!permisos.puedeEditarMetas()) return
                          const newGoals = vendorGoals.map(g =>
                            g.vendor_id === vg.vendor_id ? {...g, goal: parseInt(e.target.value) || 0} : g
                          )
                          setVendorGoals(newGoals)
                        }}
                        onBlur={() => permisos.puedeEditarMetas() && saveVendorGoal(vg.vendor_id, vg.goal)}
                        readOnly={!permisos.puedeEditarMetas()}
                        className={`bg-slate-600 px-3 py-2 rounded-lg w-20 text-center font-bold ${!permisos.puedeEditarMetas() ? 'opacity-70 cursor-not-allowed' : ''}`}
                      />
                      <span className="text-slate-400">meta</span>
                    </div>
                  </div>
                  <div className="relative pt-4">
                    <div className="h-3 bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${percentage >= 100 ? 'bg-green-500' : percentage >= 70 ? 'bg-blue-500' : percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                    <span className={`absolute right-0 top-0 text-sm font-bold ${percentage >= 100 ? 'text-green-400' : percentage >= 70 ? 'text-blue-400' : percentage >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {percentage}%
                    </span>
                  </div>
                  {reserved > 0 && (
                    <p className="text-xs text-cyan-400 mt-2">
                      Si cierras los {reserved} reservados llegas a {Math.round(((closedThisMonth + reserved) / (vg.goal || 1)) * 100)}%
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-600">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Total asignado a vendedores:</span>
            <span className="text-xl font-bold">{vendorGoals.reduce((sum, vg) => sum + vg.goal, 0)} casas</span>
          </div>
          {vendorGoals.reduce((sum, vg) => sum + vg.goal, 0) !== monthlyGoals.company_goal && monthlyGoals.company_goal > 0 && (
            <div className="mt-3 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg flex items-center gap-2">
              <AlertTriangle size={18} className="text-yellow-400" />
              <p className="text-yellow-400 text-sm">
                La suma de metas ({vendorGoals.reduce((sum, vg) => sum + vg.goal, 0)}) no coincide con la meta de empresa ({monthlyGoals.company_goal})
              </p>
            </div>
          )}
          {vendorGoals.reduce((sum, vg) => sum + vg.goal, 0) === monthlyGoals.company_goal && monthlyGoals.company_goal > 0 && (
            <div className="mt-3 p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2">
              <CheckCircle size={18} className="text-green-400" />
              <p className="text-green-400 text-sm">
                Las metas estan correctamente distribuidas
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RESUMEN ANUAL */}
      <div className="bg-slate-800/50 rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="text-cyan-400" size={20} />
          Resumen Anual {selectedGoalYear}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-700/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-purple-400">{annualGoal.goal}</p>
            <p className="text-sm text-slate-400">Meta anual</p>
          </div>
          <div className="bg-slate-700/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-cyan-400">{Math.round(annualGoal.goal / 12)}</p>
            <p className="text-sm text-slate-400">Promedio mensual</p>
          </div>
          <div className="bg-slate-700/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-400">
              {leads.filter(l =>
                (l.status === 'closed' || l.status === 'delivered' || l.status === 'sold') &&
                l.status_changed_at?.startsWith(selectedGoalYear.toString())
              ).length}
            </p>
            <p className="text-sm text-slate-400">Ventas {selectedGoalYear}</p>
          </div>
          <div className="bg-slate-700/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-amber-400">
              {annualGoal.goal > 0
                ? Math.round((leads.filter(l =>
                    (l.status === 'closed' || l.status === 'delivered' || l.status === 'sold') &&
                    l.status_changed_at?.startsWith(selectedGoalYear.toString())
                  ).length / annualGoal.goal) * 100)
                : 0}%
            </p>
            <p className="text-sm text-slate-400">Cumplimiento</p>
          </div>
        </div>
      </div>
    </div>
  )
}
