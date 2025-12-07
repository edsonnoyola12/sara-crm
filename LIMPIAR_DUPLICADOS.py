with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

# Eliminar TODAS las líneas que contengan "const [appointments"
new_lines = []
appointments_line_added = False

for i, line in enumerate(lines):
    # Si es la línea de appointments
    if 'const [appointments, setAppointments] = useState<Appointment[]>([])' in line:
        # Solo agregar UNA VEZ, justo después de calendarEvents
        if not appointments_line_added and i > 0 and 'calendarEvents' in lines[i-1]:
            new_lines.append(line)
            appointments_line_added = True
        # Si no, skip
    else:
        new_lines.append(line)

# Si no se agregó (porque no estaba después de calendarEvents), agregarlo ahora
if not appointments_line_added:
    for i, line in enumerate(new_lines):
        if 'const [calendarEvents, setCalendarEvents]' in line:
            new_lines.insert(i+1, "  const [appointments, setAppointments] = useState<Appointment[]>([])\n")
            break

with open('src/App.tsx', 'w') as f:
    f.writelines(new_lines)

print("✅ Duplicados eliminados, appointments agregado correctamente")
