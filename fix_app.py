with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

# Encontrar dónde termina Campaign (buscar su cierre "}")
campaign_end = None
in_campaign = False
for i, line in enumerate(lines):
    if 'interface Campaign {' in line:
        in_campaign = True
    elif in_campaign and line.strip() == '}':
        campaign_end = i
        break

# Insertar ReminderConfig después de Campaign
if campaign_end:
    reminder_config = """
interface ReminderConfig {
  id: string
  lead_category: string
  reminder_hours: number
  active: boolean
  message_template: string
  send_start_hour: number
  send_end_hour: number
}

"""
    lines.insert(campaign_end + 1, reminder_config)
    
    with open('src/App.tsx', 'w') as f:
        f.writelines(lines)
    print(f"✅ ReminderConfig insertado después de línea {campaign_end}")
else:
    print("❌ No encontré dónde termina Campaign")
