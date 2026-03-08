import { useState, useEffect } from 'react'
import { Phone, Mail, ArrowRight, Loader2 } from 'lucide-react'

// ---- Session Helpers (kept for App.tsx compatibility) ----
const AUTH_PREFIX = 'sara_auth_'

export function createSession(userId: string, _keepSession?: boolean) {
  const session = {
    userId,
    token: crypto.randomUUID(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    createdAt: Date.now(),
  }
  localStorage.setItem(`${AUTH_PREFIX}session`, JSON.stringify(session))
}

export function getSession(): { userId: string; expiresAt: number } | null {
  const raw = localStorage.getItem(`${AUTH_PREFIX}session`)
  if (!raw) return null
  try {
    const session = JSON.parse(raw)
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(`${AUTH_PREFIX}session`)
      return null
    }
    return session
  } catch { return null }
}

export function clearSession() {
  localStorage.removeItem(`${AUTH_PREFIX}session`)
}

export function getSessionTimeRemaining(): number {
  const session = getSession()
  if (!session) return 0
  return Math.max(0, session.expiresAt - Date.now())
}

export function extendSession() {
  const raw = localStorage.getItem(`${AUTH_PREFIX}session`)
  if (!raw) return
  try {
    const session = JSON.parse(raw)
    session.expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000
    localStorage.setItem(`${AUTH_PREFIX}session`, JSON.stringify(session))
  } catch { /* ignore */ }
}

// ---- Types ----
interface TeamMemberBasic {
  id: string
  name: string
  phone: string
  email?: string
  role: string
  photo_url?: string
}

interface LoginScreenProps {
  team: TeamMemberBasic[]
  onLoginSuccess: (user: TeamMemberBasic) => void
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

// ---- Main LoginScreen ----
export default function LoginScreen({ team: teamProp, onLoginSuccess, showToast }: LoginScreenProps) {
  const [loginMode, setLoginMode] = useState<'phone' | 'email'>('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [teamLocal, setTeamLocal] = useState<TeamMemberBasic[]>([])
  const [loadingTeam, setLoadingTeam] = useState(true)

  // Load team directly from Supabase REST API (bypass SW cache)
  useEffect(() => {
    const url = `${import.meta.env.VITE_SUPABASE_URL || 'https://hwyrxlnycrlgohrecbpx.supabase.co'}/rest/v1/team_members?select=id,name,phone,email,role,photo_url`
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3eXJ4bG55Y3JsZ29ocmVjYnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDI5MzksImV4cCI6MjA3ODI3ODkzOX0.LqykcvHbFu5DPd0sByeLgznrOeA4V40lGgzrggG8wVU'
    fetch(url, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
      cache: 'no-store'
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setTeamLocal(data)
        else console.error('Login: unexpected response:', data)
        setLoadingTeam(false)
      })
      .catch(err => {
        console.error('Login: fetch error:', err)
        setLoadingTeam(false)
      })
  }, [])

  // Use whichever has data
  const team = teamLocal.length > 0 ? teamLocal : teamProp

  const handleLogin = () => {
    setError('')

    if (loadingTeam && team.length === 0) {
      setError('Cargando equipo... intenta en unos segundos')
      return
    }

    let user: TeamMemberBasic | undefined

    if (loginMode === 'phone') {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10)
      if (cleanPhone.length < 10) {
        setError('Ingresa un numero de 10 digitos')
        return
      }
      user = team.find(m => m.phone?.replace(/\D/g, '').slice(-10) === cleanPhone)
      if (!user) {
        setError(`Numero no registrado (${team.length} miembros cargados)`)
        return
      }
    } else {
      const cleanEmail = email.trim().toLowerCase()
      if (!cleanEmail || !cleanEmail.includes('@')) {
        setError('Ingresa un email valido')
        return
      }
      user = team.find(m => m.email?.toLowerCase() === cleanEmail)
      if (!user) {
        setError(`Email no registrado (${team.length} miembros cargados)`)
        return
      }
    }

    // Login success
    createSession(user.id)
    localStorage.setItem('sara_user_phone', user.phone?.replace(/\D/g, '').slice(-10) || '')
    showToast(`Bienvenido, ${user.name.split(' ')[0]}!`, 'success')
    onLoginSuccess(user)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 animate-gradient items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center px-12 animate-fade-in-up">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
            <span className="text-4xl font-bold bg-gradient-to-br from-cyan-300 to-blue-100 bg-clip-text text-transparent">S</span>
          </div>
          <h1 className="text-5xl font-bold mb-3">SARA</h1>
          <p className="text-xl text-blue-200 mb-2">CRM Inmobiliario con IA</p>
          <p className="text-blue-300/70 text-sm max-w-sm mx-auto">Gestiona leads, automatiza seguimiento y cierra mas ventas con inteligencia artificial</p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold">S</span>
            </div>
            <h1 className="text-3xl font-bold">SARA</h1>
            <p className="text-slate-400 text-sm mt-1">CRM Inmobiliario con IA</p>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Bienvenido</h2>
              <p className="text-slate-400 text-sm mt-1">Ingresa tu telefono o email para continuar</p>
            </div>

            {/* Tab toggle */}
            <div className="flex bg-slate-900/60 rounded-xl p-1 mb-5">
              <button
                onClick={() => { setLoginMode('phone'); setError('') }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${loginMode === 'phone' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-300'}`}
              >
                <Phone size={15} /> Telefono
              </button>
              <button
                onClick={() => { setLoginMode('email'); setError('') }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${loginMode === 'email' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-300'}`}
              >
                <Mail size={15} /> Email
              </button>
            </div>

            <div className="space-y-4">
              {loginMode === 'phone' ? (
                <div>
                  <label className="block text-sm text-slate-400 mb-2 font-medium">Numero de WhatsApp</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="5214922019052"
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/60 rounded-xl border border-slate-600/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all text-white placeholder:text-slate-500"
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      autoFocus
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-slate-400 mb-2 font-medium">Correo electronico</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="ocastelo@gruposantarita.com.mx"
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/60 rounded-xl border border-slate-600/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all text-white placeholder:text-slate-500"
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <span>!</span> {error}
                </div>
              )}

              <button
                onClick={handleLogin}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Entrar <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <p className="text-center text-slate-500 text-xs mt-6">
            Powered by <span className="text-slate-400">Grupo Santa Rita</span>
          </p>
          {loadingTeam && (
            <p className="text-center text-yellow-400 text-xs mt-2 flex items-center justify-center gap-1">
              <Loader2 size={12} className="animate-spin" /> Cargando equipo...
            </p>
          )}
          {!loadingTeam && team.length === 0 && (
            <p className="text-center text-red-400 text-xs mt-2">Error: no se pudo cargar el equipo de Supabase</p>
          )}
          {!loadingTeam && team.length > 0 && (
            <p className="text-center text-emerald-400/50 text-xs mt-2">{team.length} miembros cargados</p>
          )}
        </div>
      </div>
    </div>
  )
}
