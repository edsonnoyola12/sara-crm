with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

# Eliminar la función mal ubicada (buscar y eliminar)
cleaned = []
skip = False
skip_count = 0

for line in lines:
    if 'const saveReminderConfig = async' in line:
        skip = True
        skip_count = 0
    
    if skip:
        skip_count += 1
        if skip_count > 25:  # La función tiene ~25 líneas
            skip = False
        continue
    
    cleaned.append(line)

# Insertar después de línea 454 (ahora será menos porque eliminamos líneas)
# Buscar el segundo }, [])
useeffect_closes = [i for i, line in enumerate(cleaned) if '}, [])' in line]
insert_at = useeffect_closes[1] + 1 if len(useeffect_closes) > 1 else useeffect_closes[0] + 1

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

cleaned.insert(insert_at, function_code)

with open('src/App.tsx', 'w') as f:
    f.writelines(cleaned)
    
print(f"✅ Función reubicada después de línea {insert_at}")
