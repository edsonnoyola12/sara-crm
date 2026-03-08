import { useState, useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'

const shortcuts = [
  { category: 'Navegacion', items: [
    { keys: ['⌘', 'K'], description: 'Busqueda global' },
    { keys: ['G', 'D'], description: 'Ir a Dashboard' },
    { keys: ['G', 'L'], description: 'Ir a Leads' },
    { keys: ['G', 'P'], description: 'Ir a Propiedades' },
    { keys: ['G', 'T'], description: 'Ir a Tareas' },
    { keys: ['G', 'C'], description: 'Ir a Calendario' },
  ]},
  { category: 'Acciones', items: [
    { keys: ['N'], description: 'Nuevo lead / nueva tarea (segun vista)' },
    { keys: ['?'], description: 'Mostrar atajos de teclado' },
    { keys: ['Esc'], description: 'Cerrar modal / panel' },
  ]},
]

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) return
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-blue-400" />
            <h2 className="text-lg font-bold text-white">Atajos de teclado</h2>
          </div>
          <button onClick={() => setOpen(false)} className="p-1 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-5">
          {shortcuts.map(cat => (
            <div key={cat.category}>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{cat.category}</h3>
              <div className="space-y-2">
                {cat.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, j) => (
                        <span key={j}>
                          <kbd className="px-1.5 py-0.5 text-[11px] bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono">{key}</kbd>
                          {j < item.keys.length - 1 && <span className="text-slate-600 text-xs mx-0.5">+</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-600 mt-4 text-center">Presiona <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px]">?</kbd> para cerrar</p>
      </div>
    </div>
  )
}
