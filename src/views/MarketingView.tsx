import { useState } from 'react'
import { Plus, Edit, Trash2, CheckCircle, Clock, Copy, Upload, Download, Facebook, X, Save } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useCrm } from '../context/CrmContext'
import { API_BASE } from '../types/crm'
import type { Campaign } from '../types/crm'

const channelColors: Record<string, string> = {
  'Facebook': 'bg-blue-600',
  'Google Ads': 'bg-red-500',
  'Instagram': 'bg-pink-500',
  'TikTok': 'bg-slate-800/50 backdrop-blur-sm border border-slate-700/50',
  'TV': 'bg-purple-600',
  'Radio': 'bg-yellow-600',
  'Espectaculares': 'bg-green-600',
  'Referidos': 'bg-cyan-500'
}

function CampaignModal({ campaign, onSave, onClose }: { campaign: Campaign | null, onSave: (c: Partial<Campaign>) => void, onClose: () => void }) {
  const [form, setForm] = useState<Partial<Campaign>>(campaign || {
    name: '', channel: 'Facebook', status: 'active', budget: 0, spent: 0,
    impressions: 0, clicks: 0, leads_generated: 0, sales_closed: 0, revenue_generated: 0,
    start_date: '', end_date: '', notes: '', target_audience: '', creative_url: ''
  })

  const ctr = form.impressions && form.impressions > 0 ? ((form.clicks || 0) / form.impressions * 100) : 0
  const cpl = form.leads_generated && form.leads_generated > 0 ? ((form.spent || 0) / form.leads_generated) : 0
  const roi = form.spent && form.spent > 0 ? (((form.revenue_generated || 0) - form.spent) / form.spent * 100) : 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all w-full max-w-3xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{campaign ? 'Editar Campana' : 'Nueva Campana'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X /></button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Nombre de Campana</label>
            <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Estado</label>
            <select value={form.status || ''} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="active">Activa</option>
              <option value="paused">Pausada</option>
              <option value="completed">Completada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Canal</label>
            <select value={form.channel || ''} onChange={e => setForm({...form, channel: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="Facebook">Facebook</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
              <option value="TV">TV</option>
              <option value="Radio">Radio</option>
              <option value="Espectaculares">Espectaculares</option>
              <option value="Referidos">Referidos</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Presupuesto</label>
            <input type="number" value={form.budget || ''} onChange={e => setForm({...form, budget: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Gastado</label>
            <input type="number" value={form.spent || ''} onChange={e => setForm({...form, spent: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Impresiones</label>
            <input type="number" value={form.impressions || ''} onChange={e => setForm({...form, impressions: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Clicks</label>
            <input type="number" value={form.clicks || ''} onChange={e => setForm({...form, clicks: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Leads Generados</label>
            <input type="number" value={form.leads_generated || ''} onChange={e => setForm({...form, leads_generated: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Ventas Cerradas</label>
            <input type="number" value={form.sales_closed || ''} onChange={e => setForm({...form, sales_closed: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Ingresos Generados</label>
            <input type="number" value={form.revenue_generated || ''} onChange={e => setForm({...form, revenue_generated: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Fecha Inicio</label>
            <input type="date" value={form.start_date || ''} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Fecha Fin</label>
            <input type="date" value={form.end_date || ''} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="col-span-3">
            <label className="block text-sm text-slate-400 mb-1">Audiencia Target</label>
            <input value={form.target_audience || ''} onChange={e => setForm({...form, target_audience: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="col-span-3">
            <label className="block text-sm text-slate-400 mb-1">Notas</label>
            <textarea value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={2} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-slate-700 rounded-xl">
          <div>
            <p className="text-slate-400 text-sm">CTR</p>
            <p className="text-xl font-bold">{ctr.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">CPL</p>
            <p className="text-xl font-bold">${cpl.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">ROI</p>
            <p className={`text-xl font-bold ${roi >= 0 ? 'text-green-400 bg-green-500/20 p-2 rounded-xl' : 'text-red-400 bg-red-500/20 p-2 rounded-xl'}`}>{roi.toFixed(0)}%</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-gray-600">Cancelar</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Save size={20} /> Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MarketingView() {
  const { campaigns, leads, properties, team, supabase, permisos, saveCampaign, deleteCampaign, showToast, loadData } = useCrm()

  const [campSort, setCampSort] = useState<{ col: string; asc: boolean }>({ col: 'name', asc: true })
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)

  // Computed marketing KPIs
  const totalBudget = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0)
  const totalSpent = campaigns.reduce((acc, c) => acc + (c.spent || 0), 0)
  const totalLeadsFromCampaigns = campaigns.reduce((acc, c) => acc + (c.leads_generated || 0), 0)
  const totalRevenue = campaigns.reduce((acc, c) => acc + (c.revenue_generated || 0), 0)
  const avgCPL = totalLeadsFromCampaigns > 0 ? totalSpent / totalLeadsFromCampaigns : 0
  const roi = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0

  const roiByChannel = campaigns.reduce((acc: any[], c) => {
    const existing = acc.find(x => x.channel === c.channel)
    if (existing) {
      existing.spent += c.spent || 0
      existing.leads += c.leads_generated || 0
      existing.sales += c.sales_closed || 0
      existing.revenue += c.revenue_generated || 0
    } else {
      acc.push({
        channel: c.channel,
        spent: c.spent || 0,
        leads: c.leads_generated || 0,
        sales: c.sales_closed || 0,
        revenue: c.revenue_generated || 0
      })
    }
    return acc
  }, [])

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Marketing ({campaigns.length} campanas)</h2>
          {permisos.puedeEditarMarketing() ? (
            <button onClick={() => setShowNewCampaign(true)} className="bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2">
              <Plus size={20} /> Nueva Campana
            </button>
          ) : (
            <span className="text-xs text-slate-400 bg-slate-700 px-3 py-2 rounded-lg">👁️ Solo lectura</span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 md:p-6 rounded-2xl hover:border-slate-600/50 transition-all">
            <p className="text-slate-400 text-xs md:text-sm mb-1">Presupuesto Total</p>
            <p className="text-lg md:text-2xl font-bold">${totalBudget.toLocaleString('es-MX')}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 md:p-6 rounded-2xl hover:border-slate-600/50 transition-all">
            <p className="text-slate-400 text-xs md:text-sm mb-1">Gastado</p>
            <p className="text-lg md:text-2xl font-bold text-orange-500">${totalSpent.toLocaleString('es-MX')}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 md:p-6 rounded-2xl hover:border-slate-600/50 transition-all">
            <p className="text-slate-400 text-xs md:text-sm mb-1">CPL Promedio</p>
            <p className="text-lg md:text-2xl font-bold">${avgCPL.toFixed(0)}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 md:p-6 rounded-2xl hover:border-slate-600/50 transition-all">
            <p className="text-slate-400 text-xs md:text-sm mb-1">ROI</p>
            <p className={`text-lg md:text-2xl font-bold ${roi >= 0 ? 'text-green-400 bg-green-500/20 p-1 md:p-2 rounded-xl' : 'text-red-400 bg-red-500/20 p-1 md:p-2 rounded-xl'}`}>{roi.toFixed(0)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 md:p-6 rounded-2xl hover:border-slate-600/50 transition-all">
            <h3 className="text-lg md:text-xl font-semibold mb-4">Inversion vs Leads por Canal</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={roiByChannel}>
                <XAxis dataKey="channel" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Bar dataKey="spent" fill="#f97316" name="Invertido" />
                <Bar dataKey="leads" fill="#3b82f6" name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 md:p-6 rounded-2xl hover:border-slate-600/50 transition-all">
            <h3 className="text-lg md:text-xl font-semibold mb-4">Ingresos vs Inversion</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={roiByChannel}>
                <XAxis dataKey="channel" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Bar dataKey="spent" fill="#ef4444" name="Invertido" />
                <Bar dataKey="revenue" fill="#22c55e" name="Ingresos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-700">
              <tr>
                {[
                  { col: 'name', label: 'Campana' },
                  { col: 'channel', label: 'Canal' },
                  { col: 'spent', label: 'Gastado' },
                  { col: 'leads_generated', label: 'Leads' },
                  { col: 'cpl', label: 'CPL' },
                  { col: 'sales', label: 'Ventas' },
                  { col: 'roi', label: 'ROI' },
                  { col: 'status', label: 'Estado' },
                ].map(h => (
                  <th key={h.col} className="text-left p-4 cursor-pointer select-none hover:text-blue-400" onClick={() => setCampSort(prev => ({ col: h.col, asc: prev.col === h.col ? !prev.asc : true }))}>
                    {h.label} {campSort.col === h.col ? (campSort.asc ? '\u2191' : '\u2193') : ''}
                  </th>
                ))}
                <th className="text-left p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {[...campaigns].sort((a: any, b: any) => {
                let va = a[campSort.col] ?? ''
                let vb = b[campSort.col] ?? ''
                if (campSort.col === 'cpl') { va = a.leads_generated > 0 ? a.spent / a.leads_generated : 0; vb = b.leads_generated > 0 ? b.spent / b.leads_generated : 0 }
                if (campSort.col === 'roi') { va = a.spent > 0 ? (a.revenue_generated - a.spent) / a.spent : 0; vb = b.spent > 0 ? (b.revenue_generated - b.spent) / b.spent : 0 }
                const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb))
                return campSort.asc ? cmp : -cmp
              }).map(campaign => {
                const cpl = campaign.leads_generated > 0 ? campaign.spent / campaign.leads_generated : 0
                const campaignROI = campaign.spent > 0 ? ((campaign.revenue_generated - campaign.spent) / campaign.spent * 100) : 0
                return (
                  <tr key={campaign.id} className="border-t border-slate-700 hover:bg-slate-700">
                    <td className="p-4 font-semibold">{campaign.name}</td>
                    <td className="p-4">
                      <span className={`${channelColors[campaign.channel]} px-2 py-1 rounded text-sm`}>
                        {campaign.channel}
                      </span>
                    </td>
                    <td className="p-4">${(campaign.spent || 0).toLocaleString('es-MX')}</td>
                    <td className="p-4">{campaign.leads_generated || 0}</td>
                    <td className="p-4">${cpl.toFixed(0)}</td>
                    <td className="p-4">{campaign.sales_closed || 0}</td>
                    <td className="p-4">
                      <span className={campaignROI >= 0 ? 'text-green-400 bg-green-500/20 p-2 rounded-xl' : 'text-red-400 bg-red-500/20 p-2 rounded-xl'}>
                        {campaignROI.toFixed(0)}%
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        campaign.status === 'active' ? 'bg-green-600' :
                        campaign.status === 'paused' ? 'bg-yellow-600' :
                        'bg-gray-600'
                      }`}>
                        {{ active: 'Activa', paused: 'Pausada', completed: 'Completada', draft: 'Borrador' }[campaign.status] || campaign.status}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2">
                      <button onClick={() => setEditingCampaign(campaign)} className="bg-blue-600 p-2 rounded hover:bg-blue-700">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => deleteCampaign(campaign.id)} className="bg-red-600 p-2 rounded hover:bg-red-700">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
          {campaigns.length === 0 && (
            <div className="empty-state text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-700/50 mb-4">
                <span className="text-5xl">📢</span>
              </div>
              <p className="text-slate-300 text-xl mb-2">No hay campanas activas</p>
              <p className="text-slate-500 text-sm mb-4">Crea tu primera campana para empezar a generar leads</p>
              <button onClick={() => setShowNewCampaign(true)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold">
                Crear Primera Campana
              </button>
            </div>
          )}
        </div>

        {/* Tarjetas de Integraciones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mt-6">
          {/* Tarjeta Conexion Facebook/Instagram Leads */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 md:p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 md:p-3 bg-blue-600 rounded-xl">
                <Facebook size={20} />
              </div>
              <div>
                <h3 className="text-base md:text-xl font-semibold">Facebook/Instagram Leads</h3>
                <p className="text-slate-400 text-xs md:text-sm">Recibe leads automaticamente desde tus anuncios</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm block mb-1">URL del Webhook</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${API_BASE}/webhook/facebook-leads`}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${API_BASE}/webhook/facebook-leads`)
                      showToast('URL copiada!', 'success')
                    }}
                    className="bg-slate-600 hover:bg-slate-500 px-3 py-2 rounded-lg"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-sm block mb-1">Verify Token</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value="sara_fb_leads_token"
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('sara_fb_leads_token')
                      showToast('Token copiado!', 'success')
                    }}
                    className="bg-slate-600 hover:bg-slate-500 px-3 py-2 rounded-lg"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              <div className="bg-slate-700/50 p-4 rounded-xl text-sm">
                <p className="font-semibold mb-2">📋 Instrucciones:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>Ve a <a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Meta Business Suite</a> → Integraciones</li>
                  <li>Busca "Webhooks" o ve a tu App en developers.facebook.com</li>
                  <li>Suscribe al objeto <strong>Page</strong> → campo <strong>leadgen</strong></li>
                  <li>Pega la URL y el token de arriba</li>
                </ol>
              </div>

              <div className={`flex items-center gap-2 p-3 rounded-xl ${leads.filter(l => l.source === 'facebook_ads').length > 0 ? 'bg-green-600/20 border border-green-500' : 'bg-slate-700/50'}`}>
                {leads.filter(l => l.source === 'facebook_ads').length > 0 ? (
                  <>
                    <CheckCircle className="text-green-400" size={20} />
                    <span className="text-green-400 font-semibold">{leads.filter(l => l.source === 'facebook_ads').length} leads recibidos de Facebook/IG</span>
                  </>
                ) : (
                  <>
                    <Clock className="text-slate-400" size={20} />
                    <span className="text-slate-400">Esperando conexion...</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tarjeta Importar Leads CSV/Excel */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 md:p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 md:p-3 bg-green-600 rounded-xl">
                <Upload size={20} />
              </div>
              <div>
                <h3 className="text-base md:text-xl font-semibold">Leads (CSV/Excel)</h3>
                <p className="text-slate-400 text-xs md:text-sm">Carga leads masivamente desde archivos</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-700/50 p-4 rounded-xl text-sm">
                <p className="font-semibold mb-2">📄 Formato esperado:</p>
                <code className="text-xs bg-slate-800 p-2 rounded block text-green-400">
                  nombre, telefono, email, interes, notas
                </code>
                <p className="text-slate-400 mt-2 text-xs">
                  El telefono debe ser de 10 digitos (se agregara 521 automaticamente)
                </p>
              </div>

              <button
                onClick={() => {
                  const csvContent = "nombre,telefono,email,interes,notas\nJuan Perez,4921234567,juan@email.com,Santa Rita,Interesado en casa 3 recamaras\nMaria Garcia,4929876543,maria@email.com,Los Alamos,Busca credito INFONAVIT"
                  const blob = new Blob([csvContent], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'plantilla_leads.csv'
                  a.click()
                }}
                className="w-full bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <Download size={16} /> Descargar Plantilla CSV
              </button>

              <label className="w-full bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer">
                <Upload size={20} /> Subir Archivo CSV
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return

                    const text = await file.text()
                    const lines = text.split('\n').filter(l => l.trim())
                    const headers = lines[0].toLowerCase().split(',').map(h => h.trim())

                    const leadsToImport: any[] = []

                    for (let i = 1; i < lines.length; i++) {
                      const values = lines[i].split(',').map(v => v.trim())
                      const row: any = {}
                      headers.forEach((h, idx) => {
                        row[h] = values[idx] || ''
                      })

                      let phone = (row.telefono || row.phone || row.celular || '').replace(/\D/g, '')
                      if (phone.length === 10) phone = '521' + phone
                      else if (phone.length === 12 && phone.startsWith('52')) phone = '521' + phone.slice(2)

                      if (row.nombre || row.name) {
                        leadsToImport.push({
                          name: row.nombre || row.name,
                          phone: phone || null,
                          email: row.email || row.correo || null,
                          property_interest: row.interes || row.interest || row.propiedad || null,
                          notes: row.notas || row.notes || null,
                          source: 'agency_import',
                          status: 'new',
                          score: 50,
                          temperature: 'COLD'
                        })
                      }
                    }

                    if (leadsToImport.length === 0) {
                      showToast('No se encontraron leads validos en el archivo', 'error')
                      return
                    }

                    // Importar usando el backend API (asignacion inteligente)
                    try {
                      let importados = 0
                      let errores = 0

                      for (const lead of leadsToImport) {
                        try {
                          const response = await fetch(`${API_BASE}/api/leads`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(lead)
                          })
                          if (response.ok) {
                            importados++
                          } else {
                            errores++
                          }
                        } catch {
                          errores++
                        }
                      }

                      showToast(`${importados} leads importados${errores > 0 ? ` (${errores} errores)` : ''}`, 'success')
                      loadData()
                    } catch (err) {
                      console.error('Error importando:', err)
                      showToast('Error al importar leads', 'error')
                    }

                    e.target.value = ''
                  }}
                />
              </label>

              <div className={`flex items-center gap-2 p-3 rounded-xl ${leads.filter(l => l.source === 'agency_import').length > 0 ? 'bg-green-600/20 border border-green-500' : 'bg-slate-700/50'}`}>
                {leads.filter(l => l.source === 'agency_import').length > 0 ? (
                  <>
                    <CheckCircle className="text-green-400" size={20} />
                    <span className="text-green-400 font-semibold">{leads.filter(l => l.source === 'agency_import').length} leads importados</span>
                  </>
                ) : (
                  <>
                    <Clock className="text-slate-400" size={20} />
                    <span className="text-slate-400">Sin importaciones aun</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Modal */}
      {(editingCampaign || showNewCampaign) && (
        <CampaignModal
          campaign={editingCampaign}
          onSave={(c) => {
            saveCampaign(c)
            setEditingCampaign(null)
            setShowNewCampaign(false)
          }}
          onClose={() => { setEditingCampaign(null); setShowNewCampaign(false); }}
        />
      )}
    </>
  )
}
