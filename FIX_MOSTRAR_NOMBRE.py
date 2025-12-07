with open('src/App.tsx', 'r') as f:
    content = f.read()

# Buscar donde muestra el cliente
old_cliente = """                            <div>
                              <p className="text-gray-400">👤 Cliente</p>
                              <p className="font-semibold">{appt.lead_phone}</p>
                            </div>"""

new_cliente = """                            <div>
                              <p className="text-gray-400">👤 Cliente</p>
                              <p className="font-semibold">{appt.lead_name || appt.lead_phone}</p>
                              {appt.lead_name && <p className="text-xs text-gray-400">{appt.lead_phone}</p>}
                            </div>"""

content = content.replace(old_cliente, new_cliente)

# También en citas canceladas
old_cancelada = """                              <p className="font-semibold">{appt.property_name} - {appt.lead_phone}</p>"""

new_cancelada = """                              <p className="font-semibold">{appt.property_name} - {appt.lead_name || appt.lead_phone}</p>"""

content = content.replace(old_cancelada, new_cancelada)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("✅ CRM actualizado para mostrar nombre")
