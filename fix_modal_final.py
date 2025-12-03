with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

# 1. Encontrar y eliminar el modal mal ubicado
new_lines = []
skip_modal = False
for i, line in enumerate(lines):
    if '{editingReminder && (' in line and i > 1500:
        skip_modal = True
        continue
    if skip_modal:
        if '      )}' in line and 'editingReminder' in ''.join(lines[max(0,i-20):i]):
            skip_modal = False
        continue
    new_lines.append(line)

# 2. Encontrar el cierre del return de App (buscar '  )' seguido de '}' cerca del final)
insert_pos = None
for i in range(len(new_lines)-1, 0, -1):
    if new_lines[i].strip() == ')' and new_lines[i+1].strip() == '}' and 'function' not in ''.join(new_lines[i:i+5]):
        insert_pos = i
        break

if insert_pos:
    # Insertar modal antes del cierre del return
    modal = """
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
"""
    new_lines.insert(insert_pos, modal)

with open('src/App.tsx', 'w') as f:
    f.writelines(new_lines)

print("✅ Modal reubicado dentro del return")
