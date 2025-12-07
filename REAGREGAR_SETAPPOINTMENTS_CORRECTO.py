with open('src/App.tsx', 'r') as f:
    content = f.read()

# Buscar donde están los otros set...
old_line = "    setReminderConfigs(remindersRes.data || [])"
new_line = "    setReminderConfigs(remindersRes.data || [])\n    setAppointments(appointmentsRes.data || [])"

content = content.replace(old_line, new_line)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("✅ setAppointments agregado en el lugar correcto")
