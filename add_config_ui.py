with open('src/App.tsx', 'r') as f:
    content = f.read()

# Buscar donde termina la sección de notificaciones
config_ui = """
            </div>
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
      )}"""

# Reemplazar el cierre de la sección de notificaciones
old_close = """            </div>
          </div>
        </div>
      )}"""

content = content.replace(old_close, config_ui)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("✅ UI de configuración agregada")
