with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

# Eliminar líneas que contengan setAppointments pero no sean el useState
new_lines = []
for line in lines:
    # Si la línea tiene setAppointments pero NO es la declaración del useState
    if 'setAppointments' in line and 'useState' not in line and '= await Promise.all' not in line:
        # Skip esta línea
        print(f"❌ Eliminando: {line.strip()}")
        continue
    new_lines.append(line)

with open('src/App.tsx', 'w') as f:
    f.writelines(new_lines)

print("✅ Referencias sueltas eliminadas")
