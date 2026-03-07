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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <form onSubmit={e => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          const values: Record<string, string> = {}
          fields.forEach(f => { values[f.name] = formData.get(f.name) as string || '' })
          onSubmit(values)
          onClose()
        }}>
          {fields.map(field => (
            <div key={field.name} className="mb-3">
              <label className="block text-sm text-slate-400 mb-1">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea name={field.name} defaultValue={field.defaultValue} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" rows={3} autoFocus={fields[0].name === field.name} />
              ) : (
                <input name={field.name} type={field.type || 'text'} defaultValue={field.defaultValue} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" autoFocus={fields[0].name === field.name} />
              )}
            </div>
          ))}
          <div className="flex gap-2 justify-end mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium">Confirmar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
