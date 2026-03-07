import { Phone } from 'lucide-react'

interface LoginScreenProps {
  loginPhone: string
  setLoginPhone: (v: string) => void
  loginError: string
  onLogin: () => void
}

export default function LoginScreen({ loginPhone, setLoginPhone, loginError, onLogin }: LoginScreenProps) {
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

      {/* Right side - Login form */}
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

          {/* Login card */}
          <div className="bg-slate-800/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 shadow-2xl">
            <div className="hidden lg:block mb-6">
              <h2 className="text-2xl font-bold">Bienvenido</h2>
              <p className="text-slate-400 text-sm mt-1">Ingresa con tu numero de WhatsApp</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2 font-medium">Numero de WhatsApp</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="5610016226"
                    className="w-full pl-11 pr-4 py-3 bg-slate-900/60 rounded-xl border border-slate-600/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all text-white placeholder:text-slate-500"
                    onKeyPress={(e) => e.key === 'Enter' && onLogin()}
                  />
                </div>
              </div>
              {loginError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <span>!</span> {loginError}
                </div>
              )}
              <button
                onClick={onLogin}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/25 active:scale-[0.98]"
              >
                Entrar
              </button>
            </div>
          </div>

          <p className="text-center text-slate-500 text-xs mt-6">
            Powered by <span className="text-slate-400">Grupo Santa Rita</span>
          </p>
        </div>
      </div>
    </div>
  )
}
