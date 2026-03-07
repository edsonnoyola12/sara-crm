interface ConfirmModalProps {
  title: string
  message: string
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmModal({ title, message, onConfirm, onClose }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-slate-400 mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium">Eliminar</button>
        </div>
      </div>
    </div>
  )
}
