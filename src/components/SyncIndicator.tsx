import { useState, useEffect } from 'react'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useCrm } from '../context/CrmContext'

export default function SyncIndicator() {
  const { lastRefresh, loading, loadData } = useCrm()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(interval)
  }, [])

  const secondsAgo = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000)

  let color = 'bg-emerald-500'
  let label = 'Sincronizado'
  let textColor = 'text-emerald-400'

  if (loading) {
    color = 'bg-yellow-500'
    label = 'Sincronizando...'
    textColor = 'text-yellow-400'
  } else if (secondsAgo > 300) {
    color = 'bg-red-500'
    label = 'Desconectado'
    textColor = 'text-red-400'
  } else if (secondsAgo > 60) {
    const mins = Math.floor(secondsAgo / 60)
    color = 'bg-orange-500'
    label = `Hace ${mins} min`
    textColor = 'text-orange-400'
  }

  return (
    <button
      onClick={() => loadData()}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/50 hover:bg-slate-700/80 transition-colors cursor-pointer`}
      title="Click para sincronizar"
    >
      {loading ? (
        <RefreshCw size={10} className="text-yellow-400 animate-spin" />
      ) : secondsAgo > 300 ? (
        <WifiOff size={10} className={textColor} />
      ) : (
        <div className={`w-1.5 h-1.5 rounded-full ${color} ${secondsAgo < 60 ? 'animate-pulse' : ''}`} />
      )}
      <span className={`text-[10px] font-medium ${textColor}`}>{label}</span>
    </button>
  )
}
