import { AlertTriangle, X } from 'lucide-react'

interface ConfirmModalProps {
  title: string
  message: string
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmModal({ title, message, onConfirm, onClose }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>

        <p className="text-sm text-slate-400 mb-6">{message}</p>

        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm()
            }}
            className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors font-medium"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
