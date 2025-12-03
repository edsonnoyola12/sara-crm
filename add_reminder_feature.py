with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Agregar interface después de Mortgage
insert_after = "}\n\ninterface Campaign {"
reminder_interface = """}\n\ninterface ReminderConfig {
  id: string
  lead_category: string
  reminder_hours: number
  active: boolean
  message_template: string
  send_start_hour: number
  send_end_hour: number
}

interface Campaign {"""

content = content.replace(insert_after, reminder_interface)

# 2. Agregar states después de campaigns
state_insert = "  const [campaigns, setCampaigns] = useState<Campaign[]>([])"
new_states = """  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [reminderConfigs, setReminderConfigs] = useState<ReminderConfig[]>([])
  const [editingReminder, setEditingReminder] = useState<ReminderConfig | null>(null)"""

content = content.replace(state_insert, new_states)

# 3. Agregar carga de datos en useEffect
fetch_insert = "      const { data: campaignsData } = await supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false })"
new_fetch = """      const { data: campaignsData } = await supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false })
      
      const { data: reminders } = await supabase.from('reminder_config').select('*').order('lead_category')
      if (reminders) setReminderConfigs(reminders)"""

content = content.replace(fetch_insert, new_fetch)

# Guardar
with open('src/App.tsx', 'w') as f:
    f.write(content)

print("✅ Interfaces y states agregados")
