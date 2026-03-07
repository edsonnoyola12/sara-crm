import { Bell, X } from 'lucide-react'
import type { Lead } from '../types/crm'

interface Notification {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  leadId?: string
}

interface NotificationDrawerProps {
  open: boolean
  onClose: () => void
  notifications: Notification[]
  readNotificationIds: Set<string>
  setReadNotificationIds: (fn: (prev: Set<string>) => Set<string>) => void
  unreadNotifCount: number
  notifCategory: 'all' | 'leads' | 'citas' | 'sistema'
  setNotifCategory: (c: 'all' | 'leads' | 'citas' | 'sistema') => void
  notifTimeFilter: 'today' | '24h' | '7d' | 'all'
  setNotifTimeFilter: (f: 'today' | '24h' | '7d' | 'all') => void
  leads: Lead[]
  onSelectLead: (lead: Lead) => void
}

export default function NotificationDrawer({
  open, onClose, notifications, readNotificationIds, setReadNotificationIds,
  unreadNotifCount, notifCategory, setNotifCategory, notifTimeFilter, setNotifTimeFilter,
  leads, onSelectLead
}: NotificationDrawerProps) {
  if (!open) return null

  const notifDotColor = (type: string) => {
    if (type === 'new_lead') return 'bg-green-400'
    if (type === 'hot_inactive') return 'bg-red-400'
    if (type === 'no_followup') return 'bg-yellow-400'
    if (type === 'appointment_today') return 'bg-cyan-400'
    if (type === 'appointment_tomorrow') return 'bg-blue-400'
    if (type === 'status_change') return 'bg-purple-400'
    if (type === 'mortgage_stalled') return 'bg-orange-400'
    if (type === 'score_jump') return 'bg-emerald-400'
    return 'bg-slate-400'
  }

  const filterByCategory = (n: Notification) => {
    if (notifCategory === 'all') return true
    if (notifCategory === 'leads') return ['new_lead','hot_inactive','no_followup','score_jump'].includes(n.type)
    if (notifCategory === 'citas') return ['appointment_today','appointment_tomorrow'].includes(n.type)
    return ['status_change','mortgage_stalled'].includes(n.type)
  }

  const catFiltered = notifications.filter(filterByCategory)
  const now = Date.now()
  const timeFiltered = catFiltered.filter(n => {
    if (notifTimeFilter === 'all') return true
    const age = now - new Date(n.timestamp).getTime()
    if (notifTimeFilter === 'today') return age < 16 * 3600000
    if (notifTimeFilter === '24h') return age < 24 * 3600000
    return age < 7 * 24 * 3600000
  })

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="notif-drawer fixed top-0 right-0 z-50 w-96 max-w-full h-full bg-slate-800 border-l border-slate-700 shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-700/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base">Notificaciones</h3>
              {unreadNotifCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">{unreadNotifCount}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadNotifCount > 0 && (
                <button onClick={() => setReadNotificationIds(() => new Set(notifications.map(n => n.id)))}
                  className="text-[11px] text-blue-400 hover:text-blue-300">Marcar todo leido</button>
              )}
              <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><X size={18} /></button>
            </div>
          </div>
          {/* Category tabs */}
          <div className="flex gap-1 mb-2">
            {([['all','Todos'],['leads','Leads'],['citas','Citas'],['sistema','Sistema']] as [typeof notifCategory, string][]).map(([key, label]) => {
              const catNotifs = notifications.filter(n => {
                if (key === 'all') return true
                if (key === 'leads') return ['new_lead','hot_inactive','no_followup','score_jump'].includes(n.type)
                if (key === 'citas') return ['appointment_today','appointment_tomorrow'].includes(n.type)
                return ['status_change','mortgage_stalled'].includes(n.type)
              })
              const catUnread = catNotifs.filter(n => !readNotificationIds.has(n.id)).length
              return (
                <button key={key} onClick={() => setNotifCategory(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    notifCategory === key ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'
                  }`}>
                  {label}
                  {catUnread > 0 && <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${notifCategory === key ? 'bg-blue-500' : 'bg-slate-600'}`}>{catUnread}</span>}
                </button>
              )
            })}
          </div>
          {/* Time filters */}
          <div className="flex gap-1">
            {([['today','Hoy'],['24h','24h'],['7d','7d'],['all','Todos']] as [typeof notifTimeFilter, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setNotifTimeFilter(key)}
                className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                  notifTimeFilter === key ? 'bg-slate-600 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}>{label}</button>
            ))}
          </div>
        </div>
        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {timeFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Bell size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">Sin notificaciones</p>
              <p className="text-[11px] text-slate-500 mt-1">{notifTimeFilter !== 'all' ? 'Intenta con otro rango de tiempo' : notifCategory !== 'all' ? 'No hay en esta categoria' : 'Todo al dia'}</p>
            </div>
          ) : timeFiltered.map(n => {
            const isUnread = !readNotificationIds.has(n.id)
            const diff = now - new Date(n.timestamp).getTime()
            const mins = Math.floor(diff / 60000)
            const timeAgo = mins < 1 ? 'ahora' : mins < 60 ? `${mins}m` : mins < 1440 ? `${Math.floor(mins / 60)}h` : `${Math.floor(mins / 1440)}d`
            return (
              <div key={n.id}
                className={`notif-drawer-item px-5 py-3 border-b border-slate-700/30 cursor-pointer ${isUnread ? 'notif-drawer-item-unread' : ''}`}
                onClick={() => {
                  setReadNotificationIds(prev => new Set([...prev, n.id]))
                  if (n.leadId) {
                    const lead = leads.find((l: any) => l.id === n.leadId)
                    if (lead) { onSelectLead(lead); onClose() }
                  }
                }}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`w-7 h-7 rounded-lg ${notifDotColor(n.type)} bg-opacity-20 flex items-center justify-center text-xs font-bold`}>
                      <div className={`w-2 h-2 rounded-full ${notifDotColor(n.type)}`} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isUnread ? 'font-semibold text-slate-200' : 'text-slate-400'}`}>{n.title}</p>
                    {n.description && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{n.description}</p>}
                    <span className="text-[10px] text-slate-600 mt-0.5 block">{timeAgo}</span>
                  </div>
                  {n.leadId && (
                    <span className="flex-shrink-0 text-[10px] text-blue-400 font-medium mt-1">Ver →</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
