with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

# Insertar función en línea 245 (después del useEffect)
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

lines.insert(245, function_code)

with open('src/App.tsx', 'w') as f:
    f.writelines(lines)
    
print("✅ Función insertada")
