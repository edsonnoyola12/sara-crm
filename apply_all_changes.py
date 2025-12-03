import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Agregar interface ReminderConfig después de Mortgage
content = content.replace(
    'interface Campaign {',
    '''interface ReminderConfig {
  id: string
  lead_category: string
  reminder_hours: number
  active: boolean
  message_template: string
  send_start_hour: number
  send_end_hour: number
}

interface Campaign {'''
)

# 2. Agregar estados
content = content.replace(
    '  const [campaigns, setCampaigns] = useState<Campaign[]>([])',
    '''  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [reminderConfigs, setReminderConfigs] = useState<ReminderConfig[]>([])
  const [editingReminder, setEditingReminder] = useState<ReminderConfig | null>(null)'''
)

# 3. Agregar fetch de reminders en useEffect
content = content.replace(
    "      const { data: campaignsData } = await supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false })",
    """      const { data: campaignsData } = await supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false })
      
      const { data: reminders } = await supabase.from('reminder_config').select('*').order('lead_category')
      if (reminders) setReminderConfigs(reminders)"""
)

# 4. Encontrar el segundo }, []) y agregar función después
parts = content.split('}, [])')
if len(parts) >= 3:
    # Insertar después del segundo }, [])
    parts[2] = '''

  const saveReminderConfig = async (config: ReminderConfig) => {
    try {
      const { error } = await supabase
        .from('reminder_config')
        .update({
          reminder_hours: config.reminder_hours,
          message_template: config.message_template,
          send_start_hour: config.send_start_hour,
          send_end_hour: config.send_end_hour
        })
        .eq('id', config.id)
      
      if (error) throw error
      
      setReminderConfigs(prev => prev.map(r => r.id === config.id ? config : r))
      setEditingReminder(null)
    } catch (error) {
      console.error('Error updating reminder config:', error)
    }
  }
''' + parts[2]
    content = '}, [])'.join(parts)

# 5. Agregar UI antes del cierre de configuración
# Buscar el cierre de notificaciones
old_section = '''            </div>
          </div>
        </div>
      )}

      {view === 'marketing' && ('''

new_section = '''            </div>
          </div>

          {/* Configuración de Recordatorios Automáticos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Configuración de Recordatorios Automáticos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reminderConfigs.map(config => (
                <div key={config.id} className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {config.lead_category === 'HOT' && <span className="text-2xl">🔥</span>}
                      {config.lead_category === 'WARM' && <span className="text-2xl">⚠️</span>}
                      {config.lead_category === 'COLD' && <span className="text-2xl">❄️</span>}
                      <span className={`font-bold ${
                        config.lead_category === 'HOT' ? 'text-red-500' :
                        config.lead_category === 'WARM' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`}>{config.lead_category}</span>
                    </div>
                    <button
                      onClick={() => setEditingReminder(config)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Editar
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">
                    Cada {config.reminder_hours} horas
                  </p>
                  <p className="text-gray-500 text-xs">
                    {config.message_template?.substring(0, 50)}...
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'marketing' && ('''

content = content.replace(old_section, new_section)

# 6. Agregar modal antes del export default
old_end = '''    </div>
  )
}

export default App'''

new_end = '''    </div>

      {/* Modal de Edición de Recordatorio */}
      {editingReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Editar Recordatorio {editingReminder.lead_category}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Frecuencia (horas)</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={editingReminder.reminder_hours}
                  onChange={(e) => setEditingReminder({...editingReminder, reminder_hours: parseInt(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Hora inicio (0-23)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={editingReminder.send_start_hour}
                  onChange={(e) => setEditingReminder({...editingReminder, send_start_hour: parseInt(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Hora fin (0-23)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={editingReminder.send_end_hour}
                  onChange={(e) => setEditingReminder({...editingReminder, send_end_hour: parseInt(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Mensaje Template</label>
                <textarea
                  value={editingReminder.message_template || ''}
                  onChange={(e) => setEditingReminder({...editingReminder, message_template: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 h-24"
                  placeholder="Usa {{name}}, {{score}}, {{hours}}"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => saveReminderConfig(editingReminder)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setEditingReminder(null)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
  )
}

export default App'''

content = content.replace(old_end, new_end)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("✅ Todos los cambios aplicados correctamente")
