with open('src/App.tsx', 'r') as f:
    content = f.read()

# Buscar el archivo original desde GitHub para restaurar la estructura correcta
# Por ahora, voy a eliminar todas las líneas relacionadas con ReminderConfig mal insertadas

lines = content.split('\n')
cleaned_lines = []
skip_until_close = False
brace_count = 0

for i, line in enumerate(lines):
    # Si encontramos una ReminderConfig en lugar incorrecto (dentro de otra interface)
    if 'interface ReminderConfig {' in line:
        # Verificar si la línea anterior no es un cierre de interface
        if i > 0 and cleaned_lines and cleaned_lines[-1].strip() != '}':
            skip_until_close = True
            brace_count = 1
            continue
    
    if skip_until_close:
        if '{' in line:
            brace_count += line.count('{')
        if '}' in line:
            brace_count -= line.count('}')
        if brace_count == 0:
            skip_until_close = False
        continue
    
    cleaned_lines.append(line)

# Ahora encontrar dónde insertar ReminderConfig correctamente
final_lines = []
for i, line in enumerate(cleaned_lines):
    final_lines.append(line)
    # Insertar después de Campaign
    if i < len(cleaned_lines) - 1:
        if 'interface Campaign {' in line:
            # Buscar el cierre
            brace_count = 1
            j = i + 1
            while j < len(cleaned_lines) and brace_count > 0:
                if '{' in cleaned_lines[j]:
                    brace_count += cleaned_lines[j].count('{')
                if '}' in cleaned_lines[j]:
                    brace_count -= cleaned_lines[j].count('}')
                final_lines.append(cleaned_lines[j])
                j += 1
                if brace_count == 0:
                    # Insertar ReminderConfig aquí
                    final_lines.append('')
                    final_lines.append('interface ReminderConfig {')
                    final_lines.append('  id: string')
                    final_lines.append('  lead_category: string')
                    final_lines.append('  reminder_hours: number')
                    final_lines.append('  active: boolean')
                    final_lines.append('  message_template: string')
                    final_lines.append('  send_start_hour: number')
                    final_lines.append('  send_end_hour: number')
                    final_lines.append('}')
                    final_lines.append('')
                    # Saltar las líneas que ya agregamos
                    i = j - 1
                    break

with open('src/App.tsx', 'w') as f:
    f.write('\n'.join(final_lines))

print("✅ Archivo limpiado y ReminderConfig insertado correctamente")
