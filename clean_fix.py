# Leer archivo
with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

# Eliminar TODAS las líneas duplicadas de reminderConfigs y editingReminder
cleaned = []
skip_next_reminder = 0

for i, line in enumerate(lines):
    # Si ya vimos esta declaración, saltarla
    if 'const [reminderConfigs, setReminderConfigs]' in line or 'const [editingReminder, setEditingReminder]' in line:
        if skip_next_reminder > 0:
            skip_next_reminder -= 1
            continue
        else:
            skip_next_reminder = 3  # Saltar las próximas 3 ocurrencias
    cleaned.append(line)

# Guardar
with open('src/App.tsx', 'w') as f:
    f.writelines(cleaned)

print("✅ Duplicados eliminados")
