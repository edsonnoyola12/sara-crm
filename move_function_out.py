with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

# 1. Eliminar la función de dentro del useEffect (líneas 434-453)
cleaned = []
skip = False
for i, line in enumerate(lines, 1):
    if i == 434 and 'const saveReminderConfig' in line:
        skip = True
    if skip and i <= 453:
        continue
    if i == 454:
        skip = False
    cleaned.append(line)

# 2. Insertar la función DESPUÉS del }, []) (que ahora está en línea ~434)
function_code = """
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

# Buscar }, []) y agregar después
for i, line in enumerate(cleaned):
    if '}, [])' in line and i > 400:
        cleaned.insert(i + 1, function_code)
        break

with open('src/App.tsx', 'w') as f:
    f.writelines(cleaned)

print("✅ Función movida fuera del useEffect")
