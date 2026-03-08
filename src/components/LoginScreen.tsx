import { useState, useEffect } from 'react'
import { Phone, Mail, ArrowRight } from 'lucide-react'

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

// Hardcoded fallback so login ALWAYS works even if fetch fails
const TEAM_FALLBACK: TeamMemberBasic[] = [
  {id:"a6394ed0-397e-4a74-bbed-0a2c785c7ef0",name:"Yuliana Belmontes",phone:"5214921745199",email:"santarita.elnogal@gmail.com",role:"coordinador"},
  {id:"fffebc85-8b20-49d0-9d89-7139daf23ca5",name:"Jimena Flores",phone:"5214921978248",email:"jimenaf@gruposantarita.com.mx",role:"vendedor"},
  {id:"2dc9dd1a-40cd-42a8-9794-b8cb9e11d337",name:"Refugio Pulido",phone:"5214929009122",email:"mrpulido@gruposantarita.com.mx",role:"vendedor"},
  {id:"78b0c71b-b08e-4ed7-ab45-f4ab625a151a",name:"Karla Muedano",phone:"5214925445525",email:"karlam@gruposantarita.com.mx",role:"vendedor"},
  {id:"451742c2-38a2-4741-8ba4-90185ab7f023",name:"Francisco de la Torre",phone:"5214921052522",email:"francisco@gruposantarita.com.mx",role:"vendedor"},
  {id:"eee59cb5-f4f6-4b0f-8d77-57ad6899f4b1",name:"Leticia Lara",phone:"5214929272839",email:"leticia.lara.garcia@banorte.com",role:"asesor"},
  {id:"ca06dd27-954d-4765-a99b-80c69dbdd8ff",name:"Oscar Castelo",phone:"5214922019052",email:"ocastelo@gruposantarita.com.mx",role:"admin"},
  {id:"7bb05214-826c-4d1b-a418-228b8d77bd64",name:"Vendedor Test",phone:"5212224558475",role:"vendedor"},
  {id:"f1395e8b-207a-4693-a4b9-024c8dd0886d",name:"Nancy Quinonez",phone:"5214922189988",email:"oficinaventasodinvespertino@gmail.com",role:"coordinador"},
  {id:"26eb6499-dd93-4fb4-9b20-9a293fa11610",name:"Sofia Martinez",phone:"5214921740817",email:"ventasdistritofalco@gmail.com",role:"coordinador"},
  {id:"440583ef-7467-459d-8e05-52da23b7086b",name:"Abril Sanchez",phone:"5214931084872",email:"gsr.ventas.fresnillo@gmail.com",role:"coordinador"},
  {id:"1dd517aa-7c42-4413-a176-4cb49c5cd75b",name:"Juanita Lara",phone:"5214922955516",email:"juanital@gruposantarita.com.mx",role:"vendedor"},
  {id:"967c2e62-e4d2-48a4-ae19-7bff9ee42292",name:"Veronica Vazquez",phone:"5214921037798",email:"oficinafresh23@gmail.com",role:"coordinador"},
  {id:"a23c812c-9bc3-49cf-a6ea-7952b3a8149e",name:"Rosalia del Rio",phone:"5214921226111",email:"rosaliar@gruposantarita.com.mx",role:"vendedor"},
  {id:"d81f53e8-25b3-45d5-99a5-aeb8eadbdf81",name:"Javier Frausto",phone:"5214929491343",email:"javierf@gruposantarita.com.mx",role:"vendedor"},
  {id:"a1ffd78f-5c03-4c98-9968-8443a5670ed8",name:"Fabian Fernandez",phone:"5214921375548",email:"fabianf@gruposantarita.com.mx",role:"vendedor"},
  {id:"5dbbadd6-8251-4fa0-a661-3707c37994c6",name:"Maricarmen Delgado",phone:"5214921320919",email:"maryventas0919@gmail.com",role:"coordinador"},
  {id:"fece2486-0812-4739-8f4b-7f9780d1f40c",name:"Adriana Valerio",phone:"5214921320167",email:"oficinaventascolinas@gmail.com",role:"coordinador"},
  {id:"44a419aa-e326-4a49-9407-63cc3f8c0dea",name:"Belinda Zarzosa",phone:"5214921052515",email:"oficinaventas.santarita@gmail.com",role:"coordinador"},
]

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
  // Start with hardcoded fallback so login works immediately
  const [team, setTeam] = useState<TeamMemberBasic[]>(TEAM_FALLBACK)

  // Try to load fresh data from Supabase (updates fallback if successful)
  useEffect(() => {
    const url = `${import.meta.env.VITE_SUPABASE_URL || 'https://hwyrxlnycrlgohrecbpx.supabase.co'}/rest/v1/team_members?select=id,name,phone,email,role,photo_url`
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3eXJ4bG55Y3JsZ29ocmVjYnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDI5MzksImV4cCI6MjA3ODI3ODkzOX0.LqykcvHbFu5DPd0sByeLgznrOeA4V40lGgzrggG8wVU'
    fetch(url, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` },
      cache: 'no-store'
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setTeam(data)
      })
      .catch(() => {}) // fallback already loaded
  }, [])

  const handleLogin = () => {
    setError('')


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
          <p className="text-center text-emerald-400/50 text-xs mt-2">{team.length} miembros cargados</p>
        </div>
      </div>
    </div>
  )
}
