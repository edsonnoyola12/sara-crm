import { X, FileText } from 'lucide-react'

interface InputField {
  name: string
  label: string
  type?: string
  defaultValue?: string
}

interface InputModalProps {
  title: string
  fields: InputField[]
  onSubmit: (values: Record<string, string>) => void
  onClose: () => void
}

export default function InputModal({ title, fields, onSubmit, onClose }: InputModalProps) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText size={20} className="text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>

        <form onSubmit={e => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          const values: Record<string, string> = {}
          fields.forEach(f => { values[f.name] = formData.get(f.name) as string || '' })
          onSubmit(values)
          onClose()
        }}>
          {fields.map(field => (
            <div key={field.name} className="mb-4">
              <label className="block text-sm font-medium text-slate-400 mb-1.5">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  name={field.name}
                  defaultValue={field.defaultValue}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                  rows={3}
                  autoFocus={fields[0].name === field.name}
                />
              ) : (
                <input
                  name={field.name}
                  type={field.type || 'text'}
                  defaultValue={field.defaultValue}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                  autoFocus={fields[0].name === field.name}
                />
              )}
            </div>
          ))}
          <div className="flex items-center gap-3 justify-end mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-medium"
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
