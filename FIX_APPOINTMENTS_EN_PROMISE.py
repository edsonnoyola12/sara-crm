with open('src/App.tsx', 'r') as f:
    content = f.read()

# Encontrar el Promise.all y agregar appointments
old_promise = """    const [leadsRes, propsRes, teamRes, mortgagesRes, campaignsRes, remindersRes] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('properties').select('*'),
      supabase.from('team_members').select('*'),
      supabase.from('mortgage_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('reminder_config').select('*').order('lead_category')
    ])
    setLeads(leadsRes.data || [])
    setProperties(propsRes.data || [])
    setTeam(teamRes.data || [])
    setMortgages(mortgagesRes.data || [])
    setCampaigns(campaignsRes.data || [])
    setReminderConfigs(remindersRes.data || [])"""

new_promise = """    const [leadsRes, propsRes, teamRes, mortgagesRes, campaignsRes, remindersRes, appointmentsRes] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('properties').select('*'),
      supabase.from('team_members').select('*'),
      supabase.from('mortgage_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('reminder_config').select('*').order('lead_category'),
      supabase.from('appointments').select('*').order('scheduled_date', { ascending: true })
    ])
    setLeads(leadsRes.data || [])
    setProperties(propsRes.data || [])
    setTeam(teamRes.data || [])
    setMortgages(mortgagesRes.data || [])
    setCampaigns(campaignsRes.data || [])
    setReminderConfigs(remindersRes.data || [])
    setAppointments(appointmentsRes.data || [])"""

content = content.replace(old_promise, new_promise)

# Eliminar el código duplicado que está mal ubicado (fuera de loadData)
# Buscar y eliminar el bloque suelto
import re
pattern = r"    // Cargar citas de Supabase\n    const \{ data: appointmentsData \}[^}]+\}[^)]+\)\n    setAppointments\(appointmentsData \|\| \[\]\)\n\n    "
content = re.sub(pattern, '', content)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("✅ Appointments agregado dentro de Promise.all")
