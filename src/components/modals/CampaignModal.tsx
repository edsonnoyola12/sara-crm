import { useState } from 'react'
import { X, Save } from 'lucide-react'
import type { Campaign } from '../../types/crm'

function CampaignModal({ campaign, onSave, onClose }: { campaign: Campaign | null, onSave: (c: Partial<Campaign>) => void, onClose: () => void }) {
  const [form, setForm] = useState<Partial<Campaign>>(campaign || {
    name: '', channel: 'Facebook', status: 'active', budget: 0, spent: 0,
    impressions: 0, clicks: 0, leads_generated: 0, sales_closed: 0, revenue_generated: 0,
    start_date: '', end_date: '', notes: '', target_audience: '', creative_url: ''
  })

  const ctr = form.impressions && form.impressions > 0 ? ((form.clicks || 0) / form.impressions * 100) : 0
  const cpl = form.leads_generated && form.leads_generated > 0 ? ((form.spent || 0) / form.leads_generated) : 0
  const roi = (form.spent || 0) > 0 ? (((form.revenue_generated || 0) - (form.spent || 0)) / (form.spent || 1) * 100) : 0

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

export default CampaignModal
