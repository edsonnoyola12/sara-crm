import re

# Leer archivo
with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

# Encontrar línea de campaigns state
campaigns_line = None
for i, line in enumerate(lines):
    if "const [campaigns, setCampaigns] = useState<Campaign[]>([])" in line:
        campaigns_line = i
        break

if campaigns_line is None:
    print("❌ No encontré campaigns state")
    exit(1)

# Insertar states después de campaigns
lines.insert(campaigns_line + 1, "  const [reminderConfigs, setReminderConfigs] = useState<ReminderConfig[]>([])\n")
lines.insert(campaigns_line + 2, "  const [editingReminder, setEditingReminder] = useState<ReminderConfig | null>(null)\n")

# Guardar
with open('src/App.tsx', 'w') as f:
    f.writelines(lines)

print("✅ Todo arreglado - compilando...")
