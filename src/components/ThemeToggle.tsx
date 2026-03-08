import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('sara-theme')
    if (saved) return saved === 'dark'
    return true // default dark
  })

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
    }
    localStorage.setItem('sara-theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <button
      onClick={() => setDark(d => !d)}
      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 dark:text-slate-400 dark:hover:text-white transition-colors"
      title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
