with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Agregar remindersRes al Promise.all
old_promise = """const [leadsRes, propsRes, teamRes, mortgagesRes, campaignsRes] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('properties').select('*'),
      supabase.from('team_members').select('*'),
      supabase.from('mortgage_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false })
    ])"""

new_promise = """const [leadsRes, propsRes, teamRes, mortgagesRes, campaignsRes, remindersRes] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('properties').select('*'),
      supabase.from('team_members').select('*'),
      supabase.from('mortgage_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('reminder_config').select('*').order('lead_category')
    ])"""

content = content.replace(old_promise, new_promise)

# 2. Agregar setReminderConfigs después de setCampaigns
old_sets = """setLeads(leadsRes.data || [])
    setProperties(propsRes.data || [])
    setTeam(teamRes.data || [])
    setMortgages(mortgagesRes.data || [])
    setCampaigns(campaignsRes.data || [])"""

new_sets = """setLeads(leadsRes.data || [])
    setProperties(propsRes.data || [])
    setTeam(teamRes.data || [])
    setMortgages(mortgagesRes.data || [])
    setCampaigns(campaignsRes.data || [])
    setReminderConfigs(remindersRes.data || [])
    console.log('🔍 Reminders cargados:', remindersRes.data)"""

content = content.replace(old_sets, new_sets)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("✅ Carga de reminders agregada al Promise.all")
