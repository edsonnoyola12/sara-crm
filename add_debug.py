with open('src/App.tsx', 'r') as f:
    content = f.read()

# Buscar la línea donde se cargan los reminders
if "const { data: reminders } = await supabase.from('reminder_config')" in content:
    content = content.replace(
        "const { data: reminders } = await supabase.from('reminder_config').select('*').order('lead_category')",
        "const { data: reminders } = await supabase.from('reminder_config').select('*').order('lead_category')\n      console.log('🔍 Reminders cargados:', reminders)"
    )
    content = content.replace(
        "if (reminders) setReminderConfigs(reminders)",
        "console.log('🔍 Seteando reminders:', reminders)\n      if (reminders) setReminderConfigs(reminders)"
    )

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("✅ Debug agregado")
