with open('src/App.tsx', 'r') as f:
    content = f.read()

# 4. Agregar función saveReminderConfig después de saveCampaign
save_function = """
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

# Insertar después de saveCampaign
insert_after = "    } catch (error) {\n      console.error('Error saving campaign:', error)\n    }\n  }"
content = content.replace(insert_after, insert_after + "\n" + save_function)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("✅ Función saveReminderConfig agregada")
