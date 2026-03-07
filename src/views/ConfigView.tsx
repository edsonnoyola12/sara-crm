import { useState } from 'react'
import { useCrm } from '../context/CrmContext'
import type { ReminderConfig } from '../types/crm'

export default function ConfigView() {
  const { alertSettings, setAlertSettings, reminderConfigs, team, supabase, saveReminderConfig, showToast } = useCrm()
  const [editingReminder, setEditingReminder] = useState<ReminderConfig | null>(null)

  return (
    <>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Configuracion</h2>

        <div className="bg-slate-800/50 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">⏰ Alertas de Estancamiento - Leads</h3>
          <p className="text-slate-400 text-sm mb-4">Dias maximos antes de alertar al vendedor</p>
          <div className="grid grid-cols-3 gap-4">
            {alertSettings.filter(s => s.category === 'leads').map(setting => (
              <div key={setting.id} className="bg-slate-700 p-4 rounded-xl">
                <label className="block text-sm text-slate-400 mb-2 capitalize">{setting.stage.replace('_', ' ')}</label>
                <input
                  type="number"
                  value={setting.max_days}
                  onChange={async (e) => {
                    const newDays = parseInt(e.target.value) || 1
                    await supabase.from('alert_settings').update({ max_days: newDays }).eq('id', setting.id)
                    setAlertSettings(alertSettings.map(s => s.id === setting.id ? {...s, max_days: newDays} : s))
                  }}
                  className="w-full p-2 bg-slate-600 rounded-lg text-center text-xl font-bold text-white"
                  min="1"
                />
                <p className="text-xs text-slate-400 mt-1 text-center">dias</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">👔 Seguimiento a Asesores Hipotecarios</h3>
          <p className="text-slate-400 text-sm mb-4">SARA contacta al asesor y escala al vendedor si no responde</p>
          <div className="grid grid-cols-2 gap-4">
            {alertSettings.filter(s => s.category === 'asesor').map(setting => (
              <div key={setting.id} className="bg-slate-700 p-4 rounded-xl">
                <label className="block text-sm text-slate-400 mb-2">
                  {setting.stage === 'recordatorio' ? '📱 Recordatorio al Asesor' : '🚨 Escalar al Vendedor'}
                </label>
                <input
                  type="number"
                  value={setting.max_days}
                  onChange={async (e) => {
                    const newDays = parseInt(e.target.value) || 1
                    await supabase.from('alert_settings').update({ max_days: newDays }).eq('id', setting.id)
                    setAlertSettings(alertSettings.map(s => s.id === setting.id ? {...s, max_days: newDays} : s))
                  }}
                  className="w-full p-2 bg-slate-600 rounded-lg text-center text-xl font-bold text-white"
                  min="1"
                />
                <p className="text-xs text-slate-400 mt-1 text-center">dias sin actualizar</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4">El asesor puede responder: "Aprobado Juan", "Rechazado Juan", "Documentos Juan"</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all">
          <h3 className="text-xl font-semibold mb-4">Notificaciones por WhatsApp</h3>
          <p className="text-slate-400 mb-4">Todos los miembros activos recibiran notificaciones segun su rol.</p>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Vendedores (reciben: nuevos leads, leads olvidados)</h4>
              <div className="space-y-2">
                {team.filter(t => t.role === 'vendedor').map(v => (
                  <div key={v.id} className="flex items-center justify-between bg-slate-700 p-3 rounded-xl">
                    <span>{v.name} - {v.phone}</span>
                    <span className={`px-2 py-1 rounded text-sm ${v.active ? 'bg-green-600' : 'bg-gray-600'}`}>
                      {v.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Asesores (reciben: solicitudes hipotecarias, solicitudes estancadas)</h4>
              <div className="space-y-2">
                {team.filter(t => t.role === 'asesor').map(a => (
                  <div key={a.id} className="flex items-center justify-between bg-slate-700 p-3 rounded-xl">
                    <span>{a.name} - {a.phone}</span>
                    <span className={`px-2 py-1 rounded text-sm ${a.active ? 'bg-green-600' : 'bg-gray-600'}`}>
                      {a.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Marketing (pueden reportar metricas, reciben: alertas ROI, CPL alto)</h4>
              <div className="space-y-2">
                {team.filter(t => t.role === 'agencia').map(m => (
                  <div key={m.id} className="flex items-center justify-between bg-slate-700 p-3 rounded-xl">
                    <span>{m.name} - {m.phone}</span>
                    <span className={`px-2 py-1 rounded text-sm ${m.active ? 'bg-green-600' : 'bg-gray-600'}`}>
                      {m.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Configuracion de Recordatorios */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all mt-6">
          <h3 className="text-xl font-semibold mb-4">⏰ Recordatorios Automaticos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reminderConfigs.map(config => (
              <div key={config.id} className="bg-slate-700 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-bold ${
                    config.lead_category === 'HOT' ? 'text-red-400 bg-red-500/20 p-2 rounded-xl' :
                    config.lead_category === 'WARM' ? 'text-yellow-500' : 'text-blue-400 bg-blue-500/20 p-2 rounded-xl'
                  }`}>{config.lead_category}</span>
                  <button onClick={() => setEditingReminder(config)} className="text-blue-400 hover:text-blue-300">
                    Editar
                  </button>
                </div>
                <p className="text-2xl font-bold">Cada {config.reminder_hours}h</p>
                <p className="text-sm text-slate-400 mt-2">
                  {config.send_start_hour}:00 - {config.send_end_hour}:00
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editingReminder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingReminder(null)}>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 rounded-2xl hover:border-slate-600/50 transition-all w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Editar {editingReminder.lead_category}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Frecuencia (horas)</label>
                <input type="number" defaultValue={editingReminder.reminder_hours} id="hrs" className="w-full bg-slate-700 rounded px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Inicio</label>
                  <input type="number" defaultValue={editingReminder.send_start_hour} id="start" className="w-full bg-slate-700 rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm mb-2">Fin</label>
                  <input type="number" defaultValue={editingReminder.send_end_hour} id="end" className="w-full bg-slate-700 rounded px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Mensaje</label>
                <textarea defaultValue={editingReminder.message_template} id="msg" rows={4} className="w-full bg-slate-700 rounded px-3 py-2" />
              </div>
              <div className="flex gap-3">
                                    <button onClick={() => setEditingReminder(null)} className="flex-1 bg-gray-600 hover:bg-slate-700 py-2 rounded">
                                      Cancelar
                                    </button>
                                    <button onClick={() => saveReminderConfig({...editingReminder, reminder_hours: parseInt((document.getElementById('hrs') as HTMLInputElement).value), send_start_hour: parseInt((document.getElementById('start') as HTMLInputElement).value), send_end_hour: parseInt((document.getElementById('end') as HTMLInputElement).value), message_template: (document.getElementById('msg') as HTMLTextAreaElement).value})} className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded">Guardar</button>
                                  </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
