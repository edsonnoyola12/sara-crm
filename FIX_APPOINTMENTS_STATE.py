with open('src/App.tsx', 'r') as f:
    content = f.read()

# Buscar donde están los useState
find_after = "const [calendarEvents, setCalendarEvents] = useState<any[]>([])"
insert_pos = content.find(find_after)

if insert_pos == -1:
    print("❌ No encontré calendarEvents")
    exit(1)

# Insertar DESPUÉS de esa línea
insert_pos = content.find("\n", insert_pos) + 1

appointments_state = "  const [appointments, setAppointments] = useState<Appointment[]>([])\n"

# Verificar que no exista ya
if "const [appointments" in content:
    print("⚠️ appointments ya existe, eliminando duplicado")
    # Eliminar la línea existente mal insertada
    lines = content.split('\n')
    new_lines = [line for line in lines if 'const [appointments' not in line or 'useState<Appointment[]>' in line]
    content = '\n'.join(new_lines)

content = content[:insert_pos] + appointments_state + content[insert_pos:]

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("✅ Estado appointments agregado correctamente")
