import { useState, useEffect, useCallback } from 'react'
import { Eye, EyeOff, Edit3, Lock, RotateCcw, Check, Shield } from 'lucide-react'
import { useCrm } from '../context/CrmContext'
import type { FieldPermission } from '../types/crm'

// ---- Field definitions per entity ----
const ENTITY_FIELDS: Record<string, { name: string; label: string }[]> = {
  lead: [
    { name: 'name', label: 'Nombre' },
    { name: 'phone', label: 'Telefono' },
    { name: 'budget', label: 'Presupuesto' },
    { name: 'score', label: 'Score' },
    { name: 'status', label: 'Status' },
    { name: 'source', label: 'Fuente' },
    { name: 'assigned_to', label: 'Asignado a' },
    { name: 'temperature', label: 'Temperatura' },
    { name: 'credit_status', label: 'Status crediticio' },
    { name: 'commission', label: 'Comision' },
    { name: 'notes', label: 'Notas' },
    { name: 'conversation_history', label: 'Historial conversacion' },
  ],
  property: [
    { name: 'name', label: 'Nombre' },
    { name: 'price', label: 'Precio' },
    { name: 'category', label: 'Categoria' },
    { name: 'neighborhood', label: 'Colonia' },
    { name: 'city', label: 'Ciudad' },
    { name: 'bedrooms', label: 'Recamaras' },
    { name: 'bathrooms', label: 'Banos' },
    { name: 'area_m2', label: 'Area m2' },
    { name: 'total_units', label: 'Unidades totales' },
    { name: 'sold_units', label: 'Unidades vendidas' },
    { name: 'description', label: 'Descripcion' },
  ],
  mortgage: [
    { name: 'lead_name', label: 'Nombre lead' },
    { name: 'bank', label: 'Banco' },
    { name: 'amount', label: 'Monto' },
    { name: 'status', label: 'Status' },
    { name: 'assigned_advisor_id', label: 'Asesor asignado' },
    { name: 'documents', label: 'Documentos' },
    { name: 'notes', label: 'Notas' },
    { name: 'created_at', label: 'Fecha creacion' },
  ],
  team_member: [
    { name: 'name', label: 'Nombre' },
    { name: 'phone', label: 'Telefono' },
    { name: 'role', label: 'Rol' },
    { name: 'active', label: 'Activo' },
    { name: 'commission_rate', label: 'Tasa comision' },
    { name: 'goal_monthly', label: 'Meta mensual' },
  ],
}

const ENTITY_TABS: { key: string; label: string }[] = [
  { key: 'lead', label: 'Leads' },
  { key: 'property', label: 'Propiedades' },
  { key: 'mortgage', label: 'Hipotecas' },
  { key: 'team_member', label: 'Equipo' },
]

const ROLES = ['admin', 'coordinador', 'vendedor', 'asesor', 'agencia']

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  coordinador: 'Coordinador',
  vendedor: 'Vendedor',
  asesor: 'Asesor',
  agencia: 'Agencia',
}

// ---- Default permissions per role ----
function getDefaultPermission(entityType: string, fieldName: string, role: string): { can_view: boolean; can_edit: boolean } {
  if (role === 'admin') return { can_view: true, can_edit: true }

  if (role === 'coordinador') {
    // View all, edit most (not score)
    return { can_view: true, can_edit: fieldName !== 'score' }
  }

  if (role === 'vendedor') {
    if (entityType === 'lead') {
      if (fieldName === 'commission') return { can_view: false, can_edit: false }
      if (fieldName === 'score') return { can_view: true, can_edit: false }
      return { can_view: true, can_edit: true }
    }
    if (entityType === 'property') return { can_view: true, can_edit: false }
    return { can_view: false, can_edit: false }
  }

  if (role === 'asesor') {
    if (entityType === 'mortgage') return { can_view: true, can_edit: true }
    if (entityType === 'lead' && ['name', 'phone', 'credit_status'].includes(fieldName)) {
      return { can_view: true, can_edit: false }
    }
    return { can_view: false, can_edit: false }
  }

  if (role === 'agencia') {
    if (entityType === 'lead' && ['source', 'status', 'temperature'].includes(fieldName)) {
      return { can_view: true, can_edit: false }
    }
    return { can_view: false, can_edit: false }
  }

  return { can_view: false, can_edit: false }
}

export default function FieldPermissionsManager() {
  const { supabase, showToast, fieldPermissions, loadData } = useCrm()
  const [activeEntity, setActiveEntity] = useState('lead')
  const [localPerms, setLocalPerms] = useState<Record<string, { can_view: boolean; can_edit: boolean }>>({})
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  // Build a lookup key: entityType::fieldName::role
  const permKey = (entity: string, field: string, role: string) => `${entity}::${field}::${role}`

  // Initialize local state from DB permissions
  const syncFromDb = useCallback(() => {
    const map: Record<string, { can_view: boolean; can_edit: boolean }> = {}
    // First populate with defaults for all combinations
    for (const entity of Object.keys(ENTITY_FIELDS)) {
      for (const field of ENTITY_FIELDS[entity]) {
        for (const role of ROLES) {
          const key = permKey(entity, field.name, role)
          map[key] = getDefaultPermission(entity, field.name, role)
        }
      }
    }
    // Override with DB values
    for (const fp of fieldPermissions) {
      const key = permKey(fp.entity_type, fp.field_name, fp.role)
      map[key] = { can_view: fp.can_view, can_edit: fp.can_edit }
    }
    setLocalPerms(map)
    setDirty(false)
  }, [fieldPermissions])

  useEffect(() => {
    syncFromDb()
  }, [syncFromDb])

  const toggleView = (entity: string, field: string, role: string) => {
    if (role === 'admin') return // admin always all
    const key = permKey(entity, field, role)
    const current = localPerms[key] || { can_view: false, can_edit: false }
    const newView = !current.can_view
    setLocalPerms(prev => ({
      ...prev,
      [key]: { can_view: newView, can_edit: newView ? current.can_edit : false }
    }))
    setDirty(true)
  }

  const toggleEdit = (entity: string, field: string, role: string) => {
    if (role === 'admin') return
    const key = permKey(entity, field, role)
    const current = localPerms[key] || { can_view: false, can_edit: false }
    const newEdit = !current.can_edit
    setLocalPerms(prev => ({
      ...prev,
      [key]: { can_view: newEdit ? true : current.can_view, can_edit: newEdit }
    }))
    setDirty(true)
  }

  // Bulk actions per role
  const bulkAllow = (role: string) => {
    if (role === 'admin') return
    const next = { ...localPerms }
    for (const field of ENTITY_FIELDS[activeEntity]) {
      next[permKey(activeEntity, field.name, role)] = { can_view: true, can_edit: true }
    }
    setLocalPerms(next)
    setDirty(true)
  }

  const bulkReadOnly = (role: string) => {
    if (role === 'admin') return
    const next = { ...localPerms }
    for (const field of ENTITY_FIELDS[activeEntity]) {
      next[permKey(activeEntity, field.name, role)] = { can_view: true, can_edit: false }
    }
    setLocalPerms(next)
    setDirty(true)
  }

  const bulkHide = (role: string) => {
    if (role === 'admin') return
    const next = { ...localPerms }
    for (const field of ENTITY_FIELDS[activeEntity]) {
      next[permKey(activeEntity, field.name, role)] = { can_view: false, can_edit: false }
    }
    setLocalPerms(next)
    setDirty(true)
  }

  const resetDefaults = () => {
    const map: Record<string, { can_view: boolean; can_edit: boolean }> = {}
    for (const entity of Object.keys(ENTITY_FIELDS)) {
      for (const field of ENTITY_FIELDS[entity]) {
        for (const role of ROLES) {
          map[permKey(entity, field.name, role)] = getDefaultPermission(entity, field.name, role)
        }
      }
    }
    setLocalPerms(map)
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Build rows to upsert
      const rows: Omit<FieldPermission, 'id'>[] = []
      for (const entity of Object.keys(ENTITY_FIELDS)) {
        for (const field of ENTITY_FIELDS[entity]) {
          for (const role of ROLES) {
            const key = permKey(entity, field.name, role)
            const perm = localPerms[key] || getDefaultPermission(entity, field.name, role)
            rows.push({
              entity_type: entity as FieldPermission['entity_type'],
              field_name: field.name,
              field_label: field.label,
              role,
              can_view: perm.can_view,
              can_edit: perm.can_edit,
            })
          }
        }
      }

      // Delete all existing and re-insert (simplest upsert strategy)
      await supabase.from('field_permissions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      const { error } = await supabase.from('field_permissions').insert(rows)
      if (error) {
        console.error('Error saving field permissions:', error)
        showToast('Error al guardar permisos: ' + error.message, 'error')
      } else {
        showToast('Permisos de campo guardados', 'success')
        setDirty(false)
        await loadData()
      }
    } catch (err) {
      console.error(err)
      showToast('Error inesperado al guardar', 'error')
    }
    setSaving(false)
  }

  const fields = ENTITY_FIELDS[activeEntity] || []

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
      <div className="flex items-center gap-3 mb-2">
        <Shield size={22} className="text-blue-400" />
        <div>
          <h3 className="text-xl font-semibold">Permisos de Campo</h3>
          <p className="text-slate-400 text-sm mt-1">Controla la visibilidad y edicion de cada campo por rol</p>
        </div>
      </div>

      {/* Entity tabs */}
      <div className="flex gap-2 mt-4 mb-5 overflow-x-auto pb-1">
        {ENTITY_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveEntity(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeEntity === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Matrix table */}
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-sm border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-700/60">
              <th className="text-left py-3 px-3 text-slate-400 font-medium text-xs uppercase tracking-wider sticky left-0 bg-slate-800/90 z-10 min-w-[140px]">
                Campo
              </th>
              {ROLES.map(role => (
                <th key={role} className="text-center py-3 px-2 min-w-[120px]">
                  <span className="text-slate-300 font-semibold text-xs uppercase tracking-wider">{ROLE_LABELS[role]}</span>
                  {role !== 'admin' && (
                    <div className="flex gap-1 mt-2 justify-center">
                      <button
                        onClick={() => bulkAllow(role)}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-green-600/20 text-green-400 hover:bg-green-600/40 transition-colors"
                        title="Permitir todo"
                      >
                        Todo
                      </button>
                      <button
                        onClick={() => bulkReadOnly(role)}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 transition-colors"
                        title="Solo lectura"
                      >
                        Leer
                      </button>
                      <button
                        onClick={() => bulkHide(role)}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors"
                        title="Ocultar todo"
                      >
                        Ocultar
                      </button>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((field, idx) => (
              <tr
                key={field.name}
                className={`border-b border-slate-700/30 ${idx % 2 === 0 ? 'bg-slate-800/30' : ''} hover:bg-slate-700/20 transition-colors`}
              >
                <td className="py-3 px-3 font-medium text-slate-200 sticky left-0 bg-inherit z-10">
                  {field.label}
                  <span className="block text-[10px] text-slate-500 font-normal">{field.name}</span>
                </td>
                {ROLES.map(role => {
                  const key = permKey(activeEntity, field.name, role)
                  const perm = localPerms[key] || { can_view: false, can_edit: false }
                  const isAdmin = role === 'admin'

                  return (
                    <td key={role} className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* View toggle */}
                        <button
                          onClick={() => toggleView(activeEntity, field.name, role)}
                          disabled={isAdmin}
                          className={`relative w-9 h-5 rounded-full transition-colors flex items-center ${
                            isAdmin
                              ? 'bg-green-600/40 cursor-not-allowed'
                              : perm.can_view
                                ? 'bg-green-600/60 hover:bg-green-600/80 cursor-pointer'
                                : 'bg-slate-600/60 hover:bg-slate-600/80 cursor-pointer'
                          }`}
                          title={perm.can_view ? 'Puede ver' : 'No puede ver'}
                        >
                          <span className={`absolute w-3.5 h-3.5 rounded-full transition-all flex items-center justify-center ${
                            perm.can_view
                              ? 'left-[18px] bg-green-300'
                              : 'left-[3px] bg-slate-400'
                          }`}>
                            {perm.can_view
                              ? <Eye size={8} className="text-green-900" />
                              : <EyeOff size={8} className="text-slate-700" />
                            }
                          </span>
                        </button>

                        {/* Edit toggle */}
                        <button
                          onClick={() => toggleEdit(activeEntity, field.name, role)}
                          disabled={isAdmin}
                          className={`relative w-9 h-5 rounded-full transition-colors flex items-center ${
                            isAdmin
                              ? 'bg-blue-600/40 cursor-not-allowed'
                              : perm.can_edit
                                ? 'bg-blue-600/60 hover:bg-blue-600/80 cursor-pointer'
                                : 'bg-slate-600/60 hover:bg-slate-600/80 cursor-pointer'
                          }`}
                          title={perm.can_edit ? 'Puede editar' : 'No puede editar'}
                        >
                          <span className={`absolute w-3.5 h-3.5 rounded-full transition-all flex items-center justify-center ${
                            perm.can_edit
                              ? 'left-[18px] bg-blue-300'
                              : 'left-[3px] bg-slate-400'
                          }`}>
                            {perm.can_edit
                              ? <Edit3 size={8} className="text-blue-900" />
                              : <Lock size={8} className="text-slate-700" />
                            }
                          </span>
                        </button>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-600/60 inline-block" /> <Eye size={10} /> Ver</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-600/60 inline-block" /> <Edit3 size={10} /> Editar</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-600/60 inline-block" /> <Lock size={10} /> Bloqueado</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-700/40">
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            dirty
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Check size={16} />
          {saving ? 'Guardando...' : 'Guardar permisos'}
        </button>
        <button
          onClick={resetDefaults}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <RotateCcw size={14} />
          Restablecer defaults
        </button>
        {dirty && (
          <span className="text-xs text-amber-400 ml-2">Cambios sin guardar</span>
        )}
      </div>
    </div>
  )
}
