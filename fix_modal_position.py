with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

# Eliminar modal de donde está (después de línea ~1539)
cleaned = []
in_modal = False
brace_count = 0

for i, line in enumerate(lines):
    if '{/* Modal de Edición de Recordatorio */}' in line:
        in_modal = True
        continue
    
    if in_modal:
        if '{' in line:
            brace_count += line.count('{')
        if '}' in line:
            brace_count -= line.count('}')
        if brace_count <= 0 and ')}' in line:
            in_modal = False
        continue
    
    cleaned.append(line)

# Encontrar línea "    </div>\n" antes de "  )\n"
for i in range(len(cleaned) - 1, 0, -1):
    if cleaned[i].strip() == ')' and cleaned[i-1].strip() == '</div>':
        # Insertar modal antes del cierre
        modal = """
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
"""
        cleaned.insert(i, modal)
        break

with open('src/App.tsx', 'w') as f:
    f.writelines(cleaned)

print("✅ Modal reubicado correctamente")
