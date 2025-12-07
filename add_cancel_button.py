with open('src/App.tsx', 'r') as f:
    content = f.read()

# Buscar el botón Guardar y agregar Cancelar antes
old_button = '<button onClick={() => saveReminderConfig'

new_buttons = '''<div className="flex gap-3">
                                            <button onClick={() => setEditingReminder(null)} className="flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded">
                                              Cancelar
                                            </button>
                                            <button onClick={() => saveReminderConfig'''

content = content.replace(old_button, new_buttons)

# Cerrar el div después del botón Guardar
content = content.replace(
    'rounded">Guardar</button>',
    'rounded">Guardar</button>\n                                          </div>'
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("✅ Botón Cancelar agregado")
