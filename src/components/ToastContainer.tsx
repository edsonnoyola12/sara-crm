import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useCrm } from '../context/CrmContext'

export default function ToastContainer() {
  const { toasts, setToasts } = useCrm()

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  if (toasts.length === 0) return null

  const icons = {
    success: <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />,
    error: <XCircle size={16} className="text-red-400 flex-shrink-0" />,
    info: <Info size={16} className="text-blue-400 flex-shrink-0" />,
  }

  const borders = {
    success: 'border-emerald-500/30',
    error: 'border-red-500/30',
    info: 'border-blue-500/30',
  }

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 bg-slate-900/95 backdrop-blur-sm border ${borders[toast.type]} rounded-xl shadow-2xl animate-slide-up`}
        >
          {icons[toast.type]}
          <p className="text-sm text-slate-200 flex-1">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
