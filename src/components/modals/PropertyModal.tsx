import { useState } from 'react'
import { X, Save } from 'lucide-react'
import type { Property } from '../../types/crm'

function PropertyModal({ property, onSave, onClose }: { property: Property | null, onSave: (p: Partial<Property>) => void, onClose: () => void }) {
  const [form, setForm] = useState<Partial<Property>>(property || {
    name: '', category: '', price: 0, bedrooms: 0, bathrooms: 0, area_m2: 0,
    total_units: 0, sold_units: 0, photo_url: '', description: '',
    neighborhood: '', city: '', youtube_link: ''
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{property ? 'Editar Propiedad' : 'Nueva Propiedad'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Cerrar"><X /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nombre</label>
            <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Categoria</label>
            <input value={form.category || ''} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Precio Base</label>
            <input type="number" min="0" value={form.price || ''} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Precio Equipada</label>
            <input type="number" min="0" value={form.price_equipped || ''} onChange={e => setForm({...form, price_equipped: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Terreno m2</label>
            <input type="number" min="0" value={form.land_size || ''} onChange={e => setForm({...form, land_size: parseFloat(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Pisos</label>
            <input type="number" min="0" value={form.floors || ''} onChange={e => setForm({...form, floors: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Recamaras</label>
            <input type="number" min="0" value={form.bedrooms || ''} onChange={e => setForm({...form, bedrooms: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Banos</label>
            <input type="number" min="0" value={form.bathrooms || ''} onChange={e => setForm({...form, bathrooms: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">m2</label>
            <input type="number" min="0" value={form.area_m2 || ''} onChange={e => setForm({...form, area_m2: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Total Unidades</label>
            <input type="number" min="0" value={form.total_units || ''} onChange={e => setForm({...form, total_units: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Vendidas</label>
            <input type="number" min="0" value={form.sold_units || ''} onChange={e => setForm({...form, sold_units: parseInt(e.target.value)})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Descripcion</label>
            <textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={3} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">URL Imagen</label>
            <input value={form.photo_url || ''} onChange={e => setForm({...form, photo_url: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">YouTube Link</label>
            <input value={form.youtube_link || ''} onChange={e => setForm({...form, youtube_link: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://youtu.be/..." />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Matterport 3D</label>
            <input value={form.matterport_link || ''} onChange={e => setForm({...form, matterport_link: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://my.matterport.com/..." />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">GPS / Ubicacion</label>
            <input value={form.gps_link || ''} onChange={e => setForm({...form, gps_link: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://maps.google.com/..." />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Brochure PDF</label>
            <input value={form.brochure_urls || ''} onChange={e => setForm({...form, brochure_urls: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="URL del PDF..." />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Galeria (URLs separadas por coma)</label>
            <input value={form.gallery_urls || ''} onChange={e => setForm({...form, gallery_urls: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="url1, url2, url3..." />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Frase de Venta</label>
            <input value={form.sales_phrase || ''} onChange={e => setForm({...form, sales_phrase: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="El pitch de venta..." />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Cliente Ideal</label>
            <input value={form.ideal_client || ''} onChange={e => setForm({...form, ideal_client: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Para quien es esta propiedad..." />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Desarrollo</label>
            <input value={form.development || ''} onChange={e => setForm({...form, development: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Ciudad</label>
            <input value={form.city || ''} onChange={e => setForm({...form, city: e.target.value})} className="w-full bg-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
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

export default PropertyModal
