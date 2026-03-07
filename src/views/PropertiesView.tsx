import { useState } from 'react'
import { Plus, X, Building, Edit, Trash2, Save } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { useCrm } from '../context/CrmContext'
import type { Property } from '../types/crm'

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

// Skeleton loading placeholder
const SkeletonBlock = ({ h = '1rem', w = '100%' }: { h?: string; w?: string }) => (
  <div className="animate-pulse rounded-lg bg-slate-700/50" style={{ height: h, width: w }} />
)

const SkeletonCards = () => (
  <div className="space-y-4 animate-fade-in-up">
    <SkeletonBlock h="2rem" w="30%" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <SkeletonBlock h="8rem" w="100%" />
          <div className="p-4 space-y-2">
            <SkeletonBlock h="1rem" w="70%" />
            <SkeletonBlock h="0.75rem" w="50%" />
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default function PropertiesView() {
  const { properties, permisos, loading, saveProperty, deleteProperty, getYoutubeThumbnail } = useCrm()

  // Local state for filters
  const [propZoneFilter, setPropZoneFilter] = useState<string>('')
  const [propPriceMax, setPropPriceMax] = useState<number>(0)
  const [propBedFilter, setPropBedFilter] = useState<number>(0)

  // Local state for modals
  const [showNewProperty, setShowNewProperty] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)

  if (loading) return <SkeletonCards />

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          icon={Building}
          title="Propiedades"
          badge={properties.length}
          actions={
            permisos.puedeEditarPropiedades() ? (
              <button onClick={() => setShowNewProperty(true)} className="bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2">
                <Plus size={20} /> Agregar Propiedad
              </button>
            ) : (
              <span className="text-xs text-slate-400 bg-slate-700 px-3 py-2 rounded-lg">Solo lectura</span>
            )
          }
        />
        {properties.length > 0 && (() => {
          const zones = [...new Set(properties.map(p => p.development).filter(Boolean))] as string[]
          const beds = [...new Set(properties.map(p => p.bedrooms).filter(Boolean))].sort((a, b) => (a || 0) - (b || 0)) as number[]
          const priceRanges = [
            { label: 'Cualquier precio', max: 0 },
            { label: '< $1M', max: 1000000 },
            { label: '< $2M', max: 2000000 },
            { label: '< $3M', max: 3000000 },
            { label: '< $5M', max: 5000000 },
            { label: '$5M+', max: -1 },
          ]
          return (
            <div className="flex flex-wrap items-center gap-3">
              {/* Zone pills */}
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setPropZoneFilter('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!propZoneFilter ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Todas ({properties.length})</button>
                {zones.map(z => {
                  const cnt = properties.filter(p => p.development === z).length
                  return <button key={z} onClick={() => setPropZoneFilter(z)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${propZoneFilter === z ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{z} ({cnt})</button>
                })}
              </div>
              <div className="h-6 w-px bg-slate-700" />
              {/* Price filter */}
              <select value={propPriceMax} onChange={e => setPropPriceMax(Number(e.target.value))}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs cursor-pointer hover:border-blue-500 focus:border-blue-500 focus:outline-none">
                {priceRanges.map(r => <option key={r.max} value={r.max}>{r.label}</option>)}
              </select>
              {/* Bedrooms filter */}
              {beds.length > 1 && (
                <select value={propBedFilter} onChange={e => setPropBedFilter(Number(e.target.value))}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs cursor-pointer hover:border-blue-500 focus:border-blue-500 focus:outline-none">
                  <option value={0}>Recamaras: Todas</option>
                  {beds.map(b => <option key={b} value={b}>{b} rec</option>)}
                </select>
              )}
              {/* Active filter count */}
              {(propZoneFilter || propPriceMax || propBedFilter) ? (
                <button onClick={() => { setPropZoneFilter(''); setPropPriceMax(0); setPropBedFilter(0) }}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                  <X size={14} /> Limpiar filtros
                </button>
              ) : null}
            </div>
          )
        })()}
        {properties.length === 0 ? (
          <EmptyState
            icon={Building}
            title="No hay propiedades"
            description="Agrega tu primer desarrollo para empezar a gestionar tu inventario."
            actionLabel={permisos.puedeEditarPropiedades() ? "Agregar Propiedad" : undefined}
            onAction={permisos.puedeEditarPropiedades() ? () => setShowNewProperty(true) : undefined}
          />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.filter(p => {
            if (propZoneFilter && p.development !== propZoneFilter) return false
            if (propPriceMax > 0 && (p.price || 0) >= propPriceMax) return false
            if (propPriceMax === -1 && (p.price || 0) < 5000000) return false
            if (propBedFilter > 0 && p.bedrooms !== propBedFilter) return false
            return true
          }).map(prop => (
            <div key={prop.id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden group relative hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-200">
              <div className="property-image-container h-40 bg-slate-700 flex items-center justify-center">
                {prop.photo_url ? (
                  <img src={prop.photo_url} alt={prop.name} className="w-full h-full object-cover" />
                ) : prop.youtube_link ? (
                  <img src={getYoutubeThumbnail(prop.youtube_link) || ''} alt={prop.name} className="w-full h-full object-cover" />
                ) : (
                  <Building size={48} className="text-slate-400" />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1">{prop.name}</h3>
                <p className="text-xs text-slate-400 mb-2">{prop.development || ''} - {prop.city || ''}</p>
                <p className="text-2xl font-bold text-green-400 bg-green-500/20 p-2 rounded-xl mb-2">${(prop.price || 0).toLocaleString('es-MX')}</p>
                <p className="text-slate-400 text-sm mb-2">{prop.bedrooms || 0} rec | {prop.bathrooms || 0} banos | {prop.area_m2 || 0}m2</p>
                <p className="text-cyan-400 text-xs mb-3 line-clamp-2">{prop.sales_phrase || prop.description || ''}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {prop.youtube_link && (
                    <a href={prop.youtube_link} target="_blank" rel="noreferrer" className="bg-red-600/20 text-red-400 px-2 py-1 rounded text-xs hover:bg-red-600/40">Video</a>
                  )}
                  {prop.matterport_link && (
                    <a href={prop.matterport_link} target="_blank" rel="noreferrer" className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded text-xs hover:bg-purple-600/40">3D</a>
                  )}
                  {prop.gps_link && (
                    <a href={prop.gps_link} target="_blank" rel="noreferrer" className="bg-green-600/20 text-green-400 px-2 py-1 rounded text-xs hover:bg-green-600/40">GPS</a>
                  )}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-400 bg-green-500/20 p-2 rounded-xl">{prop.sold_units || 0} vendidas</span>
                  <span className="text-blue-400 bg-blue-500/20 p-2 rounded-xl">{(prop.total_units || 0) - (prop.sold_units || 0)} disponibles</span>
                </div>
              </div>
              {permisos.puedeEditarPropiedades() && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button onClick={() => setEditingProperty(prop)} className="bg-blue-600 p-2 rounded-xl hover:bg-blue-700">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => deleteProperty(prop.id)} className="bg-red-600 p-2 rounded-xl hover:bg-red-700">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        )}
      </div>

      {(editingProperty || showNewProperty) && (
        <PropertyModal
          property={editingProperty}
          onSave={saveProperty}
          onClose={() => { setEditingProperty(null); setShowNewProperty(false); }}
        />
      )}
    </>
  )
}
