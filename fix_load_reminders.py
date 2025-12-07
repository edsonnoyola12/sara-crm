with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

# Buscar el useEffect que carga datos (después de línea 150, antes de 400)
# Buscar donde se cargan leads, campaigns, etc y agregar reminders
insert_at = None
for i, line in enumerate(lines):
    if "const { data: leadsData } = await supabase.from('leads')" in line:
        # Buscar el cierre de este bloque y agregar después
        for j in range(i, min(i+30, len(lines))):
            if 'setLeads(' in lines[j]:
                insert_at = j + 1
                break
        break

if insert_at:
    reminder_load = """      
      // Cargar configuración de recordatorios
      const { data: reminders } = await supabase.from('reminder_config').select('*').order('lead_category')
      console.log('🔍 Reminders cargados:', reminders)
      if (reminders) {
        console.log('🔍 Seteando reminders:', reminders)
        setReminderConfigs(reminders)
      }

"""
    lines.insert(insert_at, reminder_load)
    
    with open('src/App.tsx', 'w') as f:
        f.writelines(lines)
    
    print(f"✅ Código de carga agregado después de línea {insert_at}")
else:
    print("❌ No encontré donde insertar")
