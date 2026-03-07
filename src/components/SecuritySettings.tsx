import { useState, useEffect, useRef } from 'react'
import { Shield, Lock, Eye, EyeOff, Smartphone, Monitor, LogOut, Clock, MapPin, X, ShieldCheck, ShieldOff, Key, History } from 'lucide-react'

const AUTH_PREFIX = 'sara_auth_'

// ---- Helpers (shared with LoginScreen) ----
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'sara_salt_2024')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
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

  return (
    <div className="flex gap-2 justify-center">
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
          className="w-10 h-12 text-center text-xl font-bold bg-slate-900/80 border-2 border-slate-600/50 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:outline-none transition-all text-white"
          autoFocus={i === 0}
        />
      ))}
    </div>
  )
}

// ---- Types ----
interface SecuritySettingsProps {
  userId: string
  userName: string
  onClose: () => void
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  onLogout: () => void
}

interface LoginHistoryEntry {
  timestamp: number
  ip: string
  browser: string
  os: string
}

interface ActiveSession {
  token: string
  browser: string
  os: string
  lastActive: number
  createdAt: number
}

export default function SecuritySettings({ userId, userName, onClose, showToast, onLogout }: SecuritySettingsProps) {
  const [activeTab, setActiveTab] = useState<'password' | '2fa' | 'sessions' | 'history'>('password')

  // Password change
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState(false)

  // 2FA
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [twoFASetupStep, setTwoFASetupStep] = useState<'idle' | 'setup' | 'verify'>('idle')
  const [setupKey, setSetupKey] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [twoFAError, setTwoFAError] = useState('')

  // Sessions & History
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([])

  useEffect(() => {
    setTwoFAEnabled(localStorage.getItem(`${AUTH_PREFIX}2fa_${userId}`) === 'true')
    const h = JSON.parse(localStorage.getItem(`${AUTH_PREFIX}login_history_${userId}`) || '[]')
    setLoginHistory(h)
    const s = JSON.parse(localStorage.getItem(`${AUTH_PREFIX}active_sessions_${userId}`) || '[]')
    setSessions(s)
  }, [userId])

  const handleChangePassword = async () => {
    setPwdError('')
    setPwdSuccess(false)

    const storedPwd = localStorage.getItem(`${AUTH_PREFIX}pwd_${userId}`)
    if (!storedPwd) {
      setPwdError('No hay contrasena configurada. Cierra sesion y vuelve a entrar.')
      return
    }
    const hashedCurrent = await hashPassword(currentPwd)
    if (hashedCurrent !== storedPwd) {
      setPwdError('Contrasena actual incorrecta')
      return
    }
    if (newPwd.length < 6) {
      setPwdError('La nueva contrasena debe tener al menos 6 caracteres')
      return
    }
    if (newPwd !== confirmPwd) {
      setPwdError('Las contrasenas no coinciden')
      return
    }
    const hashedNew = await hashPassword(newPwd)
    localStorage.setItem(`${AUTH_PREFIX}pwd_${userId}`, hashedNew)
    setPwdSuccess(true)
    setCurrentPwd('')
    setNewPwd('')
    setConfirmPwd('')
    showToast('Contrasena actualizada correctamente', 'success')
  }

  const handleEnable2FA = () => {
    // Generate a setup key (simulated)
    const key = Array.from({ length: 16 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[Math.floor(Math.random() * 32)]).join('')
    setSetupKey(key)
    setTwoFASetupStep('setup')
    setVerifyCode('')
    setTwoFAError('')
  }

  const handleVerify2FASetup = () => {
    setTwoFAError('')
    // For demo, accept any 6-digit code
    if (verifyCode.length !== 6 || !/^\d{6}$/.test(verifyCode)) {
      setTwoFAError('Ingresa un codigo de 6 digitos')
      return
    }
    localStorage.setItem(`${AUTH_PREFIX}2fa_${userId}`, 'true')
    localStorage.setItem(`${AUTH_PREFIX}2fa_key_${userId}`, setupKey)
    setTwoFAEnabled(true)
    setTwoFASetupStep('idle')
    showToast('Autenticacion de dos factores activada', 'success')
  }

  const handleDisable2FA = () => {
    localStorage.removeItem(`${AUTH_PREFIX}2fa_${userId}`)
    localStorage.removeItem(`${AUTH_PREFIX}2fa_key_${userId}`)
    setTwoFAEnabled(false)
    setTwoFASetupStep('idle')
    showToast('2FA desactivada', 'info')
  }

  const handleClearAllSessions = () => {
    localStorage.removeItem(`${AUTH_PREFIX}active_sessions_${userId}`)
    setSessions([])
    showToast('Todas las sesiones han sido cerradas. Seras redirigido al login.', 'info')
    setTimeout(() => onLogout(), 1500)
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const tabs = [
    { key: 'password' as const, label: 'Contrasena', icon: Lock },
    { key: '2fa' as const, label: '2FA', icon: ShieldCheck },
    { key: 'sessions' as const, label: 'Sesiones', icon: Monitor },
    { key: 'history' as const, label: 'Historial', icon: History },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center border border-blue-500/20">
              <Shield size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Seguridad</h2>
              <p className="text-xs text-slate-400">{userName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-5">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === tab.key ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ===== PASSWORD TAB ===== */}
          {activeTab === 'password' && (
            <div className="space-y-5 max-w-md">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Cambiar contrasena</h3>
                <p className="text-xs text-slate-500">Actualiza tu contrasena regularmente para mantener tu cuenta segura</p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5 font-medium">Contrasena actual</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showCurrentPwd ? 'text' : 'password'}
                    value={currentPwd}
                    onChange={e => setCurrentPwd(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 rounded-lg border border-slate-700/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none text-white text-sm placeholder:text-slate-600"
                    placeholder="Ingresa tu contrasena actual"
                  />
                  <button onClick={() => setShowCurrentPwd(!showCurrentPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5 font-medium">Nueva contrasena</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 rounded-lg border border-slate-700/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none text-white text-sm placeholder:text-slate-600"
                    placeholder="Minimo 6 caracteres"
                  />
                  <button onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <PasswordStrength password={newPwd} />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5 font-medium">Confirmar nueva contrasena</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    value={confirmPwd}
                    onChange={e => setConfirmPwd(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 rounded-lg border border-slate-700/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none text-white text-sm placeholder:text-slate-600"
                    placeholder="Repite la nueva contrasena"
                    onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                  />
                </div>
              </div>

              {pwdError && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {pwdError}
                </div>
              )}
              {pwdSuccess && (
                <div className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                  Contrasena actualizada correctamente
                </div>
              )}

              <button onClick={handleChangePassword}
                className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-semibold transition-colors">
                Guardar contrasena
              </button>
            </div>
          )}

          {/* ===== 2FA TAB ===== */}
          {activeTab === '2fa' && (
            <div className="space-y-5 max-w-md">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Autenticacion de dos factores</h3>
                <p className="text-xs text-slate-500">Agrega una capa adicional de seguridad a tu cuenta</p>
              </div>

              {/* Status card */}
              <div className={`p-4 rounded-xl border ${twoFAEnabled ? 'bg-green-500/5 border-green-500/20' : 'bg-slate-800/50 border-slate-700/30'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {twoFAEnabled ? <ShieldCheck size={24} className="text-green-400" /> : <ShieldOff size={24} className="text-slate-500" />}
                    <div>
                      <p className="text-sm font-medium text-white">{twoFAEnabled ? '2FA Activada' : '2FA Desactivada'}</p>
                      <p className="text-xs text-slate-400">{twoFAEnabled ? 'Tu cuenta tiene proteccion adicional' : 'Tu cuenta solo usa contrasena'}</p>
                    </div>
                  </div>
                  {twoFAEnabled ? (
                    <button onClick={handleDisable2FA}
                      className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors">
                      Desactivar
                    </button>
                  ) : twoFASetupStep === 'idle' ? (
                    <button onClick={handleEnable2FA}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors">
                      Activar
                    </button>
                  ) : null}
                </div>
              </div>

              {/* 2FA Setup flow */}
              {twoFASetupStep === 'setup' && (
                <div className="space-y-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                  <h4 className="text-sm font-semibold text-white">Configurar 2FA</h4>

                  {/* QR Code placeholder */}
                  <div className="flex justify-center">
                    <div className="w-40 h-40 bg-white rounded-xl flex items-center justify-center p-3">
                      <div className="w-full h-full border-4 border-slate-900 rounded-lg flex items-center justify-center bg-slate-100">
                        <div className="text-center">
                          <Key size={32} className="text-slate-700 mx-auto mb-1" />
                          <p className="text-[10px] text-slate-500 font-medium">QR Code</p>
                          <p className="text-[8px] text-slate-400">(Produccion)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Manual key */}
                  <div>
                    <p className="text-xs text-slate-400 mb-1.5">O ingresa esta clave manualmente en tu app:</p>
                    <div className="bg-slate-900 px-4 py-2.5 rounded-lg border border-slate-700/50 font-mono text-sm text-blue-400 tracking-widest text-center select-all">
                      {setupKey.match(/.{1,4}/g)?.join(' ')}
                    </div>
                  </div>

                  <button onClick={() => { setTwoFASetupStep('verify'); setVerifyCode('') }}
                    className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-semibold transition-colors">
                    Tengo la app configurada
                  </button>
                </div>
              )}

              {twoFASetupStep === 'verify' && (
                <div className="space-y-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                  <h4 className="text-sm font-semibold text-white">Verificar codigo</h4>
                  <p className="text-xs text-slate-400">Ingresa el codigo de 6 digitos de tu aplicacion de autenticacion</p>

                  <CodeInput value={verifyCode} onChange={setVerifyCode} onComplete={handleVerify2FASetup} />

                  {twoFAError && (
                    <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-center">
                      {twoFAError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => setTwoFASetupStep('idle')}
                      className="flex-1 py-2 text-sm text-slate-400 hover:text-white border border-slate-700/50 rounded-lg hover:bg-slate-800 transition-colors">
                      Cancelar
                    </button>
                    <button onClick={handleVerify2FASetup}
                      className="flex-1 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-sm font-semibold transition-colors">
                      Verificar y activar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== SESSIONS TAB ===== */}
          {activeTab === 'sessions' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Sesiones activas</h3>
                  <p className="text-xs text-slate-500">{sessions.length} sesion(es) registrada(s)</p>
                </div>
                {sessions.length > 0 && (
                  <button onClick={handleClearAllSessions}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors">
                    <LogOut size={14} /> Cerrar todas las sesiones
                  </button>
                )}
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No hay sesiones activas registradas</div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/30">
                      <div className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center">
                        <Monitor size={18} className="text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{s.browser} - {s.os}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <Clock size={11} />
                          <span>Ultimo acceso: {formatDate(s.lastActive)}</span>
                        </div>
                      </div>
                      {i === sessions.length - 1 && (
                        <span className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full font-medium">
                          Actual
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== HISTORY TAB ===== */}
          {activeTab === 'history' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Historial de accesos</h3>
                <p className="text-xs text-slate-500">Ultimos 10 inicios de sesion</p>
              </div>

              {loginHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">Sin historial de accesos</div>
              ) : (
                <div className="space-y-1.5">
                  {loginHistory.map((entry, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700/20 hover:bg-slate-800/60 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Clock size={15} className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{formatDate(entry.timestamp)}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1"><Monitor size={11} /> {entry.browser} / {entry.os}</span>
                          <span className="flex items-center gap-1"><MapPin size={11} /> {entry.ip}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
