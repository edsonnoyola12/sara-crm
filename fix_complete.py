with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Agregar interface ReminderConfig después de Campaign (línea ~102)
content = content.replace(
    """  created_at: string
}

interface Insight {""",
    """  created_at: string
}

interface ReminderConfig {
  id: string
  lead_category: string
  reminder_hours: number
  active: boolean
  message_template: string
  send_start_hour: number
  send_end_hour: number
}

interface Insight {"""
)

# 2. Agregar states después de campaigns
content = content.replace(
    "  const [campaigns, setCampaigns] = useState<Campaign[]>([])",
    """  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [reminderConfigs, setReminderConfigs] = useState<ReminderConfig[]>([])
  const [editingReminder, setEditingReminder] = useState<ReminderConfig | null>(null)"""
)

# 3. Agregar carga en useEffect (después de cargar campaigns)
content = content.replace(
    """      const { data: campaignsData } = await supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false })
      
      setCampaigns(campaignsData || [])""",
    """      const { data: campaignsData } = await supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false })
      
      setCampaigns(campaignsData || [])
      
      const { data: reminders } = await supabase.from('reminder_config').select('*').order('lead_category')
      if (reminders) setReminderConfigs(reminders)"""
)

# 4. Agregar función saveReminderConfig después del useEffect que cierra en }, [])
# Buscar el SEGUNDO }, [])
parts = content.split('}, [])')
# Insertar después del segundo cierre
if len(parts) >= 3:
    parts[1] = parts[1] + """

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
"""
    content = '}, [])'.join(parts)

# 5. Agregar UI de configuración ANTES del cierre de config
content = content.replace(
    """              </div>
            </div>
          </div>
        )}
      </div>

      {(editingProperty || showNewProperty) && (""",
    """              </div>
            </div>

            {/* Configuración de Recordatorios */}
            <div className="bg-gray-800 p-6 rounded-xl mt-6">
              <h3 className="text-xl font-semibold mb-4">⏰ Recordatorios Automáticos</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reminderConfigs.map(config => (
                  <div key={config.id} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold ${
                        config.lead_category === 'HOT' ? 'text-red-500' :
                        config.lead_category === 'WARM' ? 'text-yellow-500' : 'text-blue-500'
                      }`}>{config.lead_category}</span>
                      <button onClick={() => setEditingReminder(config)} className="text-blue-400 hover:text-blue-300">
                        Editar
                      </button>
                    </div>
                    <p className="text-2xl font-bold">Cada {config.reminder_hours}h</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {config.send_start_hour}:00 - {config.send_end_hour}:00
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {(editingProperty || showNewProperty) && ("""
)

# 6. Agregar modal ANTES de export default App
content = content.replace(
    """    </div>
  )
}

export default App""",
    """    </div>

      {editingReminder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingReminder(null)}>
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Editar {editingReminder.lead_category}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Frecuencia (horas)</label>
                <input type="number" defaultValue={editingReminder.reminder_hours} id="hrs" className="w-full bg-gray-700 rounded px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Inicio</label>
                  <input type="number" defaultValue={editingReminder.send_start_hour} id="start" className="w-full bg-gray-700 rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm mb-2">Fin</label>
                  <input type="number" defaultValue={editingReminder.send_end_hour} id="end" className="w-full bg-gray-700 rounded px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Mensaje</label>
                <textarea defaultValue={editingReminder.message_template} id="msg" rows={4} className="w-full bg-gray-700 rounded px-3 py-2" />
              </div>
              <button
                onClick={() => saveReminderConfig({
                  ...editingReminder,
                  reminder_hours: parseInt((document.getElementById('hrs') as HTMLInputElement).value),
                  send_start_hour: parseInt((document.getElementById('start') as HTMLInputElement).value),
                  send_end_hour: parseInt((document.getElementById('end') as HTMLInputElement).value),
                  message_template: (document.getElementById('msg') as HTMLTextAreaElement).value
                })}
                className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-semibold"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
  )
}

export default App"""
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("✅ COMPLETADO")
