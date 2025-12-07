with open('src/App.tsx', 'r') as f:
    content = f.read()

# Reemplazar saveMember para usar API
old_save = '''  async function saveMember(member: Partial<TeamMember>) {
    if (member.id) {
      await supabase.from('team_members').update(member).eq('id', member.id)
    } else {
      await supabase.from('team_members').insert([member])
    }
    loadData()
    setEditingMember(null)
    setShowNewMember(false)
  }'''

new_save = '''  async function saveMember(member: Partial<TeamMember>) {
    try {
      const API_URL = 'https://sara-backend.edson-633.workers.dev/api/team-members'
      
      if (member.id) {
        // Editar existente
        await fetch(`${API_URL}/${member.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(member)
        })
      } else {
        // Crear nuevo
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(member)
        })
      }
      
      loadData()
      setEditingMember(null)
      setShowNewMember(false)
    } catch (error) {
      console.error('Error guardando miembro:', error)
      alert('Error al guardar. Revisa la consola.')
    }
  }

  async function deleteMember(id: string) {
    if (!confirm('¿Eliminar este miembro del equipo?')) return
    
    try {
      await fetch(`https://sara-backend.edson-633.workers.dev/api/team-members/${id}`, {
        method: 'DELETE'
      })
      loadData()
    } catch (error) {
      console.error('Error eliminando miembro:', error)
      alert('Error al eliminar. Revisa la consola.')
    }
  }'''

content = content.replace(old_save, new_save)

# Agregar campo email en modal (ya existe, solo verificar)
# Agregar botón de eliminar en la vista de team

# Buscar el botón de editar y agregar botón de eliminar después
old_edit_button = '''                        <button onClick={() => setEditingMember(member)} className="opacity-0 group-hover:opacity-100 bg-blue-600 p-2 rounded-lg">
                          <Edit size={16} />
                        </button>'''

new_edit_button = '''                        <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                          <button onClick={() => setEditingMember(member)} className="bg-blue-600 p-2 rounded-lg hover:bg-blue-700">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => deleteMember(member.id)} className="bg-red-600 p-2 rounded-lg hover:bg-red-700">
                            <Trash2 size={16} />
                          </button>
                        </div>'''

content = content.replace(old_edit_button, new_edit_button)

# Agregar campo email en MemberModal
old_modal = '''          <div>
            <label className="block text-sm text-gray-400 mb-1">WhatsApp</label>
            <input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-gray-700 rounded-lg p-3" placeholder="+5215512345678" />
          </div>'''

new_modal = '''          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-gray-700 rounded-lg p-3" placeholder="nombre@gruposantarita.com" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">WhatsApp</label>
            <input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-gray-700 rounded-lg p-3" placeholder="+5215512345678" />
          </div>'''

content = content.replace(old_modal, new_modal)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("✅ App.tsx actualizado con API y botón de eliminar")
