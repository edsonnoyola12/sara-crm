import { useState, useEffect, useRef, useCallback } from 'react'
import { Phone, Mail, Eye, EyeOff, Lock, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react'
import { signInWithPhone, signUpWithPhone } from '../lib/auth'

// ---- Auth Helpers ----
const AUTH_PREFIX = 'sara_auth_'

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'sara_salt_2024')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function getStoredPassword(userId: string): string | null {
  return localStorage.getItem(`${AUTH_PREFIX}pwd_${userId}`)
}

function storePassword(userId: string, hashedPwd: string) {
  localStorage.setItem(`${AUTH_PREFIX}pwd_${userId}`, hashedPwd)
}

function is2FAEnabled(userId: string): boolean {
  return localStorage.getItem(`${AUTH_PREFIX}2fa_${userId}`) === 'true'
}

function generate2FACode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function store2FACode(userId: string, code: string) {
  localStorage.setItem(`${AUTH_PREFIX}2fa_code_${userId}`, JSON.stringify({ code, timestamp: Date.now() }))
}

function verify2FACode(userId: string, inputCode: string): boolean {
  const raw = localStorage.getItem(`${AUTH_PREFIX}2fa_code_${userId}`)
  if (!raw) return false
  try {
    const { code, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > 5 * 60 * 1000) return false // expired
    return code === inputCode
  } catch { return false }
}

function getLoginAttempts(identifier: string): { count: number; lockedUntil: number } {
  const raw = localStorage.getItem(`${AUTH_PREFIX}attempts_${identifier}`)
  if (!raw) return { count: 0, lockedUntil: 0 }
  try { return JSON.parse(raw) } catch { return { count: 0, lockedUntil: 0 } }
}

function recordFailedAttempt(identifier: string) {
  const current = getLoginAttempts(identifier)
  const newCount = current.count + 1
  const lockedUntil = newCount >= 5 ? Date.now() + 15 * 60 * 1000 : 0
  localStorage.setItem(`${AUTH_PREFIX}attempts_${identifier}`, JSON.stringify({ count: newCount, lockedUntil }))
}

function clearLoginAttempts(identifier: string) {
  localStorage.removeItem(`${AUTH_PREFIX}attempts_${identifier}`)
}

export function createSession(userId: string, keepSession: boolean) {
  const expiry = keepSession ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
  const session = {
    userId,
    token: crypto.randomUUID(),
    expiresAt: Date.now() + expiry,
    keepSession,
    createdAt: Date.now(),
    browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Otro',
    os: navigator.platform.includes('Mac') ? 'macOS' : navigator.platform.includes('Win') ? 'Windows' : navigator.platform.includes('Linux') ? 'Linux' : 'Otro',
  }
  localStorage.setItem(`${AUTH_PREFIX}session`, JSON.stringify(session))

  // Record login history
  const historyKey = `${AUTH_PREFIX}login_history_${userId}`
  const history = JSON.parse(localStorage.getItem(historyKey) || '[]')
  history.unshift({
    timestamp: Date.now(),
    ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    browser: session.browser,
    os: session.os,
  })
  localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 10)))

  // Store active session
  const sessionsKey = `${AUTH_PREFIX}active_sessions_${userId}`
  const sessions = JSON.parse(localStorage.getItem(sessionsKey) || '[]')
  sessions.push({ token: session.token, browser: session.browser, os: session.os, lastActive: Date.now(), createdAt: Date.now() })
  localStorage.setItem(sessionsKey, JSON.stringify(sessions.slice(-5)))
}

export function getSession(): { userId: string; expiresAt: number; keepSession: boolean } | null {
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
    const expiry = session.keepSession ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    session.expiresAt = Date.now() + expiry
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

// ---- 2FA Code Input ----
function CodeInput({ value, onChange, onComplete }: { value: string; onChange: (v: string) => void; onComplete: () => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.padEnd(6, '').split('').slice(0, 6)

  const handleChange = (index: number, char: string) => {
    if (!/^\d?$/.test(char)) return
    const arr = digits.slice()
    arr[index] = char
    const next = arr.join('')
    onChange(next.replace(/ /g, ''))
    if (char && index < 5) refs.current[index + 1]?.focus()
    if (next.replace(/ /g, '').length === 6) setTimeout(onComplete, 100)
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    if (pasted.length === 6) setTimeout(onComplete, 100)
    else refs.current[pasted.length]?.focus()
  }

  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3, 4, 5].map(i => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i]?.trim() || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className="w-12 h-14 text-center text-2xl font-bold bg-slate-900/80 border-2 border-slate-600/50 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:outline-none transition-all text-white caret-blue-400"
          autoFocus={i === 0}
        />
      ))}
    </div>
  )
}

// ---- Password Strength ----
function PasswordStrength({ password }: { password: string }) {
  const getStrength = (): { level: number; label: string; color: string } => {
    if (!password) return { level: 0, label: '', color: 'bg-slate-700' }
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    if (score <= 1) return { level: 1, label: 'Debil', color: 'bg-red-500' }
    if (score <= 3) return { level: 2, label: 'Media', color: 'bg-yellow-500' }
    return { level: 3, label: 'Fuerte', color: 'bg-green-500' }
  }
  const s = getStrength()
  if (!password) return null
  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= s.level ? s.color : 'bg-slate-700'}`} />
        ))}
      </div>
      <p className={`text-xs mt-1 transition-colors duration-300 ${s.level === 1 ? 'text-red-400' : s.level === 2 ? 'text-yellow-400' : 'text-green-400'}`}>{s.label}</p>
    </div>
  )
}

// ---- Main LoginScreen ----
export default function LoginScreen({ team, onLoginSuccess, showToast }: LoginScreenProps) {
  const [step, setStep] = useState<'login' | '2fa' | 'setup-password' | 'reset-password'>('login')
  const [loginMode, setLoginMode] = useState<'phone' | 'email'>('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [keepSession, setKeepSession] = useState(false)
  const [error, setError] = useState('')
  const [matchedUser, setMatchedUser] = useState<TeamMemberBasic | null>(null)

  // 2FA state
  const [twoFACode, setTwoFACode] = useState('')
  const [twoFAError, setTwoFAError] = useState('')
  const [twoFATimer, setTwoFATimer] = useState(300) // 5 min in seconds

  // Setup password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Lockout
  const [lockCountdown, setLockCountdown] = useState(0)

  // 2FA timer
  useEffect(() => {
    if (step !== '2fa') return
    const interval = setInterval(() => {
      setTwoFATimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [step])

  // Lockout countdown
  useEffect(() => {
    if (lockCountdown <= 0) return
    const interval = setInterval(() => {
      setLockCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [lockCountdown])

  const findUser = useCallback((): TeamMemberBasic | null => {
    if (loginMode === 'phone') {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10)
      if (cleanPhone.length !== 10) return null
      return team.find(m => m.phone?.replace(/\D/g, '').slice(-10) === cleanPhone) || null
    } else {
      const cleanEmail = email.trim().toLowerCase()
      if (!cleanEmail) return null
      return team.find(m => m.email?.toLowerCase() === cleanEmail) || null
    }
  }, [loginMode, phone, email, team])

  const handleLogin = async () => {
    setError('')
    const identifier = loginMode === 'phone' ? phone.replace(/\D/g, '').slice(-10) : email.trim().toLowerCase()

    // Check lockout
    const attempts = getLoginAttempts(identifier)
    if (attempts.lockedUntil > Date.now()) {
      const remaining = Math.ceil((attempts.lockedUntil - Date.now()) / 1000)
      setLockCountdown(remaining)
      setError('Cuenta bloqueada por demasiados intentos fallidos')
      return
    }

    // Find user in team
    const user = findUser()
    if (!user) {
      setError(loginMode === 'phone' ? 'Numero no registrado en el equipo' : 'Email no registrado en el equipo')
      recordFailedAttempt(identifier)
      return
    }

    // --- Try Supabase Auth first (phone mode only for now) ---
    if (loginMode === 'phone' && password) {
      const phoneClean = phone.replace(/\D/g, '').slice(-10)
      const supaResult = await signInWithPhone(phoneClean, password)

      if (!supaResult.legacy) {
        // Supabase Auth handled it (success or real error)
        if (supaResult.error) {
          recordFailedAttempt(identifier)
          const newAttempts = getLoginAttempts(identifier)
          if (newAttempts.lockedUntil > 0) {
            setLockCountdown(Math.ceil((newAttempts.lockedUntil - Date.now()) / 1000))
            setError('Cuenta bloqueada por 15 minutos')
          } else {
            setError(`Contrasena incorrecta (${5 - newAttempts.count} intentos restantes)`)
          }
          return
        }

        // Supabase Auth success — complete login
        clearLoginAttempts(identifier)
        setMatchedUser(user)

        if (is2FAEnabled(user.id)) {
          const code = generate2FACode()
          store2FACode(user.id, code)
          setTwoFATimer(300)
          setTwoFACode('')
          setStep('2fa')
          showToast(`Codigo 2FA: ${code} (demo - en produccion se envia por SMS)`, 'info')
          return
        }

        createSession(user.id, keepSession)
        localStorage.setItem('sara_user_phone', user.phone?.replace(/\D/g, '').slice(-10) || '')
        onLoginSuccess(user)
        return
      }
      // If legacy=true, fall through to legacy localStorage password check below
    }

    // --- Legacy localStorage password flow ---

    // Check if password is set up
    const storedPwd = getStoredPassword(user.id)
    if (!storedPwd) {
      // First time login - need to set up password
      setMatchedUser(user)
      setStep('setup-password')
      return
    }

    // Verify password against localStorage hash
    const hashed = await hashPassword(password)
    if (hashed !== storedPwd) {
      recordFailedAttempt(identifier)
      const newAttempts = getLoginAttempts(identifier)
      if (newAttempts.lockedUntil > 0) {
        setLockCountdown(Math.ceil((newAttempts.lockedUntil - Date.now()) / 1000))
        setError('Cuenta bloqueada por 15 minutos')
      } else {
        setError(`Contrasena incorrecta (${5 - newAttempts.count} intentos restantes)`)
      }
      return
    }

    // Legacy password correct - clear attempts
    clearLoginAttempts(identifier)
    setMatchedUser(user)

    // Auto-migrate: register this user in Supabase Auth for future logins
    if (loginMode === 'phone') {
      const phoneClean = phone.replace(/\D/g, '').slice(-10)
      const signUpResult = await signUpWithPhone(phoneClean, password)
      if (signUpResult.error) {
        console.warn('[auth-migration] Could not auto-register in Supabase Auth:', signUpResult.error)
      } else {
        console.log('[auth-migration] User migrated to Supabase Auth successfully')
      }
    }

    // Check 2FA
    if (is2FAEnabled(user.id)) {
      const code = generate2FACode()
      store2FACode(user.id, code)
      setTwoFATimer(300)
      setTwoFACode('')
      setStep('2fa')
      showToast(`Codigo 2FA: ${code} (demo - en produccion se envia por SMS)`, 'info')
      return
    }

    // Direct login
    createSession(user.id, keepSession)
    localStorage.setItem('sara_user_phone', user.phone?.replace(/\D/g, '').slice(-10) || '')
    onLoginSuccess(user)
  }

  const handleVerify2FA = () => {
    if (!matchedUser) return
    setTwoFAError('')
    if (twoFATimer === 0) {
      setTwoFAError('Codigo expirado. Solicita uno nuevo.')
      return
    }
    if (!verify2FACode(matchedUser.id, twoFACode)) {
      setTwoFAError('Codigo incorrecto')
      return
    }
    createSession(matchedUser.id, keepSession)
    localStorage.setItem('sara_user_phone', matchedUser.phone?.replace(/\D/g, '').slice(-10) || '')
    onLoginSuccess(matchedUser)
  }

  const handleResend2FA = () => {
    if (!matchedUser) return
    const code = generate2FACode()
    store2FACode(matchedUser.id, code)
    setTwoFATimer(300)
    setTwoFACode('')
    setTwoFAError('')
    showToast(`Nuevo codigo 2FA: ${code} (demo)`, 'info')
  }

  const handleSetupPassword = async () => {
    if (!matchedUser) return
    if (newPassword.length < 6) { setError('La contrasena debe tener al menos 6 caracteres'); return }
    if (newPassword !== confirmPassword) { setError('Las contrasenas no coinciden'); return }
    const hashed = await hashPassword(newPassword)
    storePassword(matchedUser.id, hashed)

    // Also register in Supabase Auth
    if (matchedUser.phone) {
      const phoneClean = matchedUser.phone.replace(/\D/g, '').slice(-10)
      const signUpResult = await signUpWithPhone(phoneClean, newPassword)
      if (signUpResult.error) {
        console.warn('[auth-migration] Could not register in Supabase Auth on setup:', signUpResult.error)
      } else {
        console.log('[auth-migration] User registered in Supabase Auth on first setup')
      }
    }

    createSession(matchedUser.id, keepSession)
    localStorage.setItem('sara_user_phone', matchedUser.phone?.replace(/\D/g, '').slice(-10) || '')
    showToast('Contrasena configurada correctamente', 'success')
    onLoginSuccess(matchedUser)
  }

  const handleResetPassword = async () => {
    // For demo: find user, reset their password
    const user = findUser()
    if (!user) {
      setError(loginMode === 'phone' ? 'Numero no registrado' : 'Email no registrado')
      return
    }
    if (newPassword.length < 6) { setError('La contrasena debe tener al menos 6 caracteres'); return }
    if (newPassword !== confirmPassword) { setError('Las contrasenas no coinciden'); return }
    const hashed = await hashPassword(newPassword)
    storePassword(user.id, hashed)
    clearLoginAttempts(loginMode === 'phone' ? phone.replace(/\D/g, '').slice(-10) : email.trim().toLowerCase())
    showToast('Contrasena actualizada. Ahora puedes iniciar sesion.', 'success')
    setPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setStep('login')
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // ---- RENDER ----
  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Left side - Branding (hidden on mobile) */}
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

          {/* ========== STEP: LOGIN ========== */}
          {step === 'login' && (
            <div className="bg-slate-800/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Bienvenido</h2>
                <p className="text-slate-400 text-sm mt-1">Ingresa tus credenciales para continuar</p>
              </div>

              {/* Tab toggle: Phone / Email */}
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
                {/* Identifier input */}
                {loginMode === 'phone' ? (
                  <div>
                    <label className="block text-sm text-slate-400 mb-2 font-medium">Numero de WhatsApp</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="5610016226"
                        className="w-full pl-11 pr-4 py-3 bg-slate-900/60 rounded-xl border border-slate-600/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all text-white placeholder:text-slate-500"
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
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
                        placeholder="usuario@gruposantarita.com"
                        className="w-full pl-11 pr-4 py-3 bg-slate-900/60 rounded-xl border border-slate-600/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all text-white placeholder:text-slate-500"
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      />
                    </div>
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2 font-medium">Contrasena</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Tu contrasena"
                      className="w-full pl-11 pr-11 py-3 bg-slate-900/60 rounded-xl border border-slate-600/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all text-white placeholder:text-slate-500"
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Keep session + forgot password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={keepSession}
                      onChange={e => setKeepSession(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500/30 focus:ring-offset-0"
                    />
                    <span className="text-sm text-slate-400">Mantener sesion</span>
                  </label>
                  <button
                    onClick={() => { setStep('reset-password'); setError(''); setNewPassword(''); setConfirmPassword('') }}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Olvidaste tu contrasena?
                  </button>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <span>!</span> {error}
                  </div>
                )}

                {/* Lockout countdown */}
                {lockCountdown > 0 && (
                  <div className="text-center text-sm text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
                    Cuenta bloqueada. Intenta de nuevo en {formatTime(lockCountdown)}
                  </div>
                )}

                {/* Login button */}
                <button
                  onClick={handleLogin}
                  disabled={lockCountdown > 0}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Iniciar Sesion
                </button>
              </div>
            </div>
          )}

          {/* ========== STEP: 2FA ========== */}
          {step === '2fa' && (
            <div className="bg-slate-800/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 shadow-2xl">
              <button onClick={() => { setStep('login'); setTwoFACode(''); setTwoFAError('') }} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4 transition-colors">
                <ArrowLeft size={16} /> Volver
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-blue-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                  <ShieldCheck size={28} className="text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold">Verificacion 2FA</h2>
                <p className="text-slate-400 text-sm mt-2">
                  Ingresa el codigo de 6 digitos enviado a tu dispositivo
                </p>
              </div>

              <div className="space-y-5">
                <CodeInput value={twoFACode} onChange={setTwoFACode} onComplete={handleVerify2FA} />

                {/* Timer */}
                <div className="text-center">
                  <span className={`text-sm font-mono ${twoFATimer < 60 ? 'text-red-400' : 'text-slate-400'}`}>
                    {twoFATimer > 0 ? `Expira en ${formatTime(twoFATimer)}` : 'Codigo expirado'}
                  </span>
                </div>

                {/* Error */}
                {twoFAError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 justify-center">
                    <span>!</span> {twoFAError}
                  </div>
                )}

                <button
                  onClick={handleVerify2FA}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/25 active:scale-[0.98]"
                >
                  Verificar
                </button>

                <button onClick={handleResend2FA} className="w-full flex items-center justify-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors py-2">
                  <RefreshCw size={14} /> Reenviar codigo
                </button>
              </div>
            </div>
          )}

          {/* ========== STEP: SETUP PASSWORD (first time) ========== */}
          {step === 'setup-password' && (
            <div className="bg-slate-800/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-green-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                  <Lock size={28} className="text-green-400" />
                </div>
                <h2 className="text-xl font-bold">Configura tu contrasena</h2>
                <p className="text-slate-400 text-sm mt-2">
                  Hola {matchedUser?.name?.split(' ')[0]}! Es tu primer inicio de sesion.
                  <br />Crea una contrasena para tu cuenta.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2 font-medium">Nueva contrasena</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Minimo 6 caracteres"
                      className="w-full pl-11 pr-11 py-3 bg-slate-900/60 rounded-xl border border-slate-600/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all text-white placeholder:text-slate-500"
                    />
                    <button onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <PasswordStrength password={newPassword} />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2 font-medium">Confirmar contrasena</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repite tu contrasena"
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/60 rounded-xl border border-slate-600/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all text-white placeholder:text-slate-500"
                      onKeyDown={e => e.key === 'Enter' && handleSetupPassword()}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <span>!</span> {error}
                  </div>
                )}

                <button
                  onClick={handleSetupPassword}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-green-500/25 active:scale-[0.98]"
                >
                  Crear contrasena e ingresar
                </button>
              </div>
            </div>
          )}

          {/* ========== STEP: RESET PASSWORD ========== */}
          {step === 'reset-password' && (
            <div className="bg-slate-800/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 shadow-2xl">
              <button onClick={() => { setStep('login'); setError(''); setNewPassword(''); setConfirmPassword('') }} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4 transition-colors">
                <ArrowLeft size={16} /> Volver al login
              </button>

              <div className="mb-6">
                <h2 className="text-xl font-bold">Restablecer contrasena</h2>
                <p className="text-slate-400 text-sm mt-1">Ingresa tu {loginMode === 'phone' ? 'telefono' : 'email'} y una nueva contrasena</p>
              </div>

              <div className="space-y-4">
                {loginMode === 'phone' ? (
                  <div>
                    <label className="block text-sm text-slate-400 mb-2 font-medium">Numero de WhatsApp</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="5610016226"
                        className="w-full pl-11 pr-4 py-3 bg-slate-900/60 rounded-xl border border-slate-600/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all text-white placeholder:text-slate-500" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm text-slate-400 mb-2 font-medium">Correo electronico</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@gruposantarita.com"
                        className="w-full pl-11 pr-4 py-3 bg-slate-900/60 rounded-xl border border-slate-600/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all text-white placeholder:text-slate-500" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-slate-400 mb-2 font-medium">Nueva contrasena</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimo 6 caracteres"
                      className="w-full pl-11 pr-11 py-3 bg-slate-900/60 rounded-xl border border-slate-600/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all text-white placeholder:text-slate-500" />
                    <button onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <PasswordStrength password={newPassword} />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2 font-medium">Confirmar contrasena</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repite tu contrasena"
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/60 rounded-xl border border-slate-600/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all text-white placeholder:text-slate-500"
                      onKeyDown={e => e.key === 'Enter' && handleResetPassword()} />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <span>!</span> {error}
                  </div>
                )}

                <button onClick={handleResetPassword}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/25 active:scale-[0.98]">
                  Restablecer contrasena
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-slate-500 text-xs mt-6">
            Powered by <span className="text-slate-400">Grupo Santa Rita</span>
          </p>
        </div>
      </div>
    </div>
  )
}
