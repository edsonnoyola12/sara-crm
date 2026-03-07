import { useState } from 'react'
import { useCrm } from '../context/CrmContext'
import type { ReminderConfig, CustomField } from '../types/crm'
import { Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react'
import FieldPermissionsManager from '../components/FieldPermissionsManager'

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Texto',
  number: 'Numero',
  date: 'Fecha',
  select: 'Seleccion',
  boolean: 'Si/No',
  url: 'URL',
}

const ENTITY_LABELS: Record<string, string> = {
  lead: 'Leads',
  property: 'Propiedades',
  mortgage: 'Hipotecas',
}

export default function ConfigView() {
  const { alertSettings, setAlertSettings, reminderConfigs, team, supabase, saveReminderConfig, saveCustomField, deleteCustomField, customFields, showToast } = useCrm()
  const [editingReminder, setEditingReminder] = useState<ReminderConfig | null>(null)

  // Custom fields form state
  const [showAddField, setShowAddField] = useState(false)
  const [newField, setNewField] = useState({
    entity_type: 'lead' as 'lead' | 'property' | 'mortgage',
    field_label: '',
    field_type: 'text' as CustomField['field_type'],
    options: '',
    required: false,
  })

  const handleAddField = async () => {
    if (!newField.field_label.trim()) {
      showToast('El nombre del campo es requerido', 'error')
      return
    }
    const field_name = newField.field_label
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')

    const maxOrder = customFields
      .filter(f => f.entity_type === newField.entity_type)
      .reduce((max, f) => Math.max(max, f.order || 0), 0)

    await saveCustomField({
      entity_type: newField.entity_type,
      field_name,
      field_label: newField.field_label.trim(),
      field_type: newField.field_type,
      options: newField.field_type === 'select' ? newField.options.split(',').map(o => o.trim()).filter(Boolean) : undefined,
      required: newField.required,
      visible: true,
      order: maxOrder + 1,
    })

    setNewField({ entity_type: 'lead', field_label: '', field_type: 'text', options: '', required: false })
    setShowAddField(false)
    showToast('Campo creado', 'success')
  }

  const handleMoveField = async (field: CustomField, direction: 'up' | 'down') => {
    const entityFields = customFields
      .filter(f => f.entity_type === field.entity_type)
      .sort((a, b) => a.order - b.order)
    const idx = entityFields.findIndex(f => f.id === field.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= entityFields.length) return

    const thisField = entityFields[idx]
    const otherField = entityFields[swapIdx]
    await saveCustomField({ id: thisField.id, order: otherField.order })
    await saveCustomField({ id: otherField.id, order: thisField.order })
  }

  const handleToggleVisible = async (field: CustomField) => {
    await saveCustomField({ id: field.id, visible: !field.visible })
  }

  const handleToggleRequired = async (field: CustomField) => {
    await saveCustomField({ id: field.id, required: !field.required })
  }

  return (
    <>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Configuracion</h2>

        <div className="bg-slate-800/50 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">Alertas de Estancamiento - Leads</h3>
          <p className="text-slate-400 text-sm mb-4">Dias maximos antes de alertar al vendedor</p>
          <div className="grid grid-cols-3 gap-4">
            {alertSettings.filter(s => s.category === 'leads').map(setting => (
              <div key={setting.id} className="bg-slate-700 p-4 rounded-xl">
                <label className="block text-sm text-slate-400 mb-2 capitalize">{setting.stage.replace('_', ' ')}</label>
                <input
                  type="number"
                  value={setting.max_days}
                  onChange={async (e) => {
                    const newDays = parseInt(e.target.value) || 1
                    await supabase.from('alert_settings').update({ max_days: newDays }).eq('id', setting.id)
                    setAlertSettings(alertSettings.map(s => s.id === setting.id ? {...s, max_days: newDays} : s))
                  }}
                  className="w-full p-2 bg-slate-600 rounded-lg text-center text-xl font-bold text-white"
                  min="1"
                />
                <p className="text-xs text-slate-400 mt-1 text-center">dias</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">Seguimiento a Asesores Hipotecarios</h3>
          <p className="text-slate-400 text-sm mb-4">SARA contacta al asesor y escala al vendedor si no responde</p>
          <div className="grid grid-cols-2 gap-4">
            {alertSettings.filter(s => s.category === 'asesor').map(setting => (
              <div key={setting.id} className="bg-slate-700 p-4 rounded-xl">
                <label className="block text-sm text-slate-400 mb-2">
                  {setting.stage === 'recordatorio' ? 'Recordatorio al Asesor' : 'Escalar al Vendedor'}
                </label>
                <input
                  type="number"
                  value={setting.max_days}
                  onChange={async (e) => {
                    const newDays = parseInt(e.target.value) || 1
                    await supabase.from('alert_settings').update({ max_days: newDays }).eq('id', setting.id)
                    setAlertSettings(alertSettings.map(s => s.id === setting.id ? {...s, max_days: newDays} : s))
                  }}
                  className="w-full p-2 bg-slate-600 rounded-lg text-center text-xl font-bold text-white"
                  min="1"
                />
                <p className="text-xs text-slate-400 mt-1 text-center">dias sin actualizar</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4">El asesor puede responder: "Aprobado Juan", "Rechazado Juan", "Documentos Juan"</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
          <h3 className="text-xl font-semibold mb-4">Notificaciones por WhatsApp</h3>
          <p className="text-slate-400 mb-4">Todos los miembros activos recibiran notificaciones segun su rol.</p>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Vendedores (reciben: nuevos leads, leads olvidados)</h4>
              <div className="space-y-2">
                {team.filter(t => t.role === 'vendedor').map(v => (
                  <div key={v.id} className="flex items-center justify-between bg-slate-700 p-3 rounded-xl">
                    <span>{v.name} - {v.phone}</span>
                    <span className={`px-2 py-1 rounded text-sm ${v.active ? 'bg-green-600' : 'bg-gray-600'}`}>
                      {v.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Asesores (reciben: solicitudes hipotecarias, solicitudes estancadas)</h4>
              <div className="space-y-2">
                {team.filter(t => t.role === 'asesor').map(a => (
                  <div key={a.id} className="flex items-center justify-between bg-slate-700 p-3 rounded-xl">
                    <span>{a.name} - {a.phone}</span>
                    <span className={`px-2 py-1 rounded text-sm ${a.active ? 'bg-green-600' : 'bg-gray-600'}`}>
                      {a.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Marketing (pueden reportar metricas, reciben: alertas ROI, CPL alto)</h4>
              <div className="space-y-2">
                {team.filter(t => t.role === 'agencia').map(m => (
                  <div key={m.id} className="flex items-center justify-between bg-slate-700 p-3 rounded-xl">
                    <span>{m.name} - {m.phone}</span>
                    <span className={`px-2 py-1 rounded text-sm ${m.active ? 'bg-green-600' : 'bg-gray-600'}`}>
                      {m.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Configuracion de Recordatorios */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all mt-6">
          <h3 className="text-xl font-semibold mb-4">Recordatorios Automaticos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reminderConfigs.map(config => (
              <div key={config.id} className="bg-slate-700 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-bold ${
                    config.lead_category === 'HOT' ? 'text-red-400 bg-red-500/20 p-2 rounded-xl' :
                    config.lead_category === 'WARM' ? 'text-yellow-500' : 'text-blue-400 bg-blue-500/20 p-2 rounded-xl'
                  }`}>{config.lead_category}</span>
                  <button onClick={() => setEditingReminder(config)} className="text-blue-400 hover:text-blue-300">
                    Editar
                  </button>
                </div>
                <p className="text-2xl font-bold">Cada {config.reminder_hours}h</p>
                <p className="text-sm text-slate-400 mt-2">
                  {config.send_start_hour}:00 - {config.send_end_hour}:00
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== CAMPOS PERSONALIZADOS ===== */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold">Campos Personalizados</h3>
              <p className="text-slate-400 text-sm mt-1">Define campos adicionales para leads, propiedades e hipotecas</p>
            </div>
            <button
              onClick={() => setShowAddField(!showAddField)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus size={16} /> Agregar campo
            </button>
          </div>

          {/* Add field form */}
          {showAddField && (
            <div className="bg-slate-700/60 border border-slate-600/50 rounded-xl p-5 mb-6">
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-300">Nuevo campo</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Entidad</label>
                  <select
                    value={newField.entity_type}
                    onChange={e => setNewField({ ...newField, entity_type: e.target.value as any })}
                    className="w-full bg-slate-600 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="lead">Lead</option>
                    <option value="property">Propiedad</option>
                    <option value="mortgage">Hipoteca</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Nombre del campo</label>
                  <input
                    type="text"
                    value={newField.field_label}
                    onChange={e => setNewField({ ...newField, field_label: e.target.value })}
                    placeholder="Ej: Fecha de nacimiento"
                    className="w-full bg-slate-600 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Tipo</label>
                  <select
                    value={newField.field_type}
                    onChange={e => setNewField({ ...newField, field_type: e.target.value as any })}
                    className="w-full bg-slate-600 rounded-lg px-3 py-2 text-sm"
                  >
                    {Object.entries(FIELD_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newField.required}
                      onChange={e => setNewField({ ...newField, required: e.target.checked })}
                      className="w-4 h-4 rounded bg-slate-600 border-slate-500"
                    />
                    <span className="text-sm">Requerido</span>
                  </label>
                </div>
              </div>

              {newField.field_type === 'select' && (
                <div className="mb-4">
                  <label className="block text-xs text-slate-400 mb-1.5">Opciones (separadas por coma)</label>
                  <input
                    type="text"
                    value={newField.options}
                    onChange={e => setNewField({ ...newField, options: e.target.value })}
                    placeholder="Opcion 1, Opcion 2, Opcion 3"
                    className="w-full bg-slate-600 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setShowAddField(false)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm transition-colors">
                  Cancelar
                </button>
                <button onClick={handleAddField} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
                  Crear campo
                </button>
              </div>
            </div>
          )}

          {/* Fields grouped by entity */}
          {(['lead', 'property', 'mortgage'] as const).map(entityType => {
            const fields = customFields
              .filter(f => f.entity_type === entityType)
              .sort((a, b) => (a.order || 0) - (b.order || 0))

            if (fields.length === 0) return null

            return (
              <div key={entityType} className="mb-6 last:mb-0">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  {ENTITY_LABELS[entityType]} ({fields.length})
                </h4>
                <div className="space-y-2">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="flex items-center gap-3 bg-slate-700/50 border border-slate-600/30 rounded-xl px-4 py-3">
                      {/* Reorder arrows */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleMoveField(field, 'up')}
                          disabled={idx === 0}
                          className="text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => handleMoveField(field, 'down')}
                          disabled={idx === fields.length - 1}
                          className="text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>

                      {/* Field info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{field.field_label}</p>
                        <p className="text-xs text-slate-500">
                          {FIELD_TYPE_LABELS[field.field_type] || field.field_type}
                          {field.options && field.options.length > 0 && ` (${field.options.join(', ')})`}
                          {' '}&middot; {field.field_name}
                        </p>
                      </div>

                      {/* Required toggle */}
                      <button
                        onClick={() => handleToggleRequired(field)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          field.required ? 'bg-amber-600/30 text-amber-400' : 'bg-slate-600/50 text-slate-500'
                        }`}
                      >
                        {field.required ? 'Requerido' : 'Opcional'}
                      </button>

                      {/* Visible toggle */}
                      <button
                        onClick={() => handleToggleVisible(field)}
                        className={`p-1.5 rounded transition-colors ${
                          field.visible ? 'text-green-400 hover:text-green-300' : 'text-slate-500 hover:text-slate-400'
                        }`}
                        title={field.visible ? 'Visible' : 'Oculto'}
                      >
                        {field.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => deleteCustomField(field.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                        title="Eliminar campo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {customFields.length === 0 && !showAddField && (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">No hay campos personalizados definidos.</p>
              <p className="text-xs mt-1">Haz clic en "Agregar campo" para crear uno.</p>
            </div>
          )}
        </div>

        {/* ===== PERMISOS DE CAMPO ===== */}
        <FieldPermissionsManager />
      </div>

      {editingReminder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingReminder(null)}>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Editar {editingReminder.lead_category}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Frecuencia (horas)</label>
                <input type="number" defaultValue={editingReminder.reminder_hours} id="hrs" className="w-full bg-slate-700 rounded px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Inicio</label>
                  <input type="number" defaultValue={editingReminder.send_start_hour} id="start" className="w-full bg-slate-700 rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm mb-2">Fin</label>
                  <input type="number" defaultValue={editingReminder.send_end_hour} id="end" className="w-full bg-slate-700 rounded px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Mensaje</label>
                <textarea defaultValue={editingReminder.message_template} id="msg" rows={4} className="w-full bg-slate-700 rounded px-3 py-2" />
              </div>
              <div className="flex gap-3">
                                    <button onClick={() => setEditingReminder(null)} className="flex-1 bg-gray-600 hover:bg-slate-700 py-2 rounded">
                                      Cancelar
                                    </button>
                                    <button onClick={() => saveReminderConfig({...editingReminder, reminder_hours: parseInt((document.getElementById('hrs') as HTMLInputElement).value), send_start_hour: parseInt((document.getElementById('start') as HTMLInputElement).value), send_end_hour: parseInt((document.getElementById('end') as HTMLInputElement).value), message_template: (document.getElementById('msg') as HTMLTextAreaElement).value})} className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded">Guardar</button>
                                  </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
