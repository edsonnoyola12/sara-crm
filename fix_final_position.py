with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

# 1. Eliminar modal mal ubicado (después de línea 1560)
cleaned = []
skip = False
for i, line in enumerate(lines):
    if i >= 1560 and '{editingReminder && (' in line:
        skip = True
    if skip:
        if '      )}' in line and i > 1590:
            skip = False
        continue
    cleaned.append(line)

# 2. Buscar el cierre del return de App (ANTES de CampaignModal, línea ~1100)
# Buscar "      {(editingProperty"
insert_at = None
for i, line in enumerate(cleaned):
    if '{(editingProperty || showNewProperty) && (' in line:
        insert_at = i
        break

if insert_at:
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
              <button onClick={() => saveReminderConfig({...editingReminder, reminder_hours: parseInt((document.getElementById('hrs') as HTMLInputElement).value), send_start_hour: parseInt((document.getElementById('start') as HTMLInputElement).value), send_end_hour: parseInt((document.getElementById('end') as HTMLInputElement).value), message_template: (document.getElementById('msg') as HTMLTextAreaElement).value})} className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded">Guardar</button>
            </div>
          </div>
        </div>
      )}

"""
    cleaned.insert(insert_at, modal)
    print(f"✅ Modal insertado en línea {insert_at}")
else:
    print("❌ No encontré dónde insertar")

with open('src/App.tsx', 'w') as f:
    f.writelines(cleaned)
