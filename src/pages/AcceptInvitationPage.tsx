import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Bot, Loader2, AlertTriangle, Check } from 'lucide-react'
import { api } from '../lib/api'

export function AcceptInvitationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [step, setStep] = useState<'form' | 'loading' | 'success' | 'error'>('form')
  const [form, setForm] = useState({ name: '', password: '', confirmPassword: '', phone: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!token) setStep('error')
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Las contrasenas no coinciden')
      return
    }
    if (form.password.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres')
      return
    }

    setSaving(true)
    try {
      const res = await api.post('/api/invitations/accept', {
        token,
        password: form.password,
        name: form.name || undefined,
        phone: form.phone || undefined,
      })
      if (res.data?.success) {
        setStep('success')
      } else {
        setError(res.error || 'Error aceptando invitacion')
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexion')
    } finally {
      setSaving(false)
    }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  if (step === 'error' || !token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <AlertTriangle className="mx-auto text-amber-500 mb-4" size={40} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invitacion invalida</h2>
          <p className="text-gray-500 text-sm mb-6">
            Este enlace de invitacion no es valido o ha expirado. Pide a tu administrador que te envie una nueva invitacion.
          </p>
          <Link to="/login" className="text-green-600 hover:text-green-700 font-medium text-sm">
            Ir a iniciar sesion
          </Link>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-green-600" size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Cuenta creada</h2>
          <p className="text-gray-500 text-sm mb-6">
            Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesion.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800"
          >
            Iniciar sesion
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Bot size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Acepta tu invitacion</h1>
            <p className="text-gray-500 mt-2 text-sm">Crea tu contrasena para unirte al equipo</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tu nombre</label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Juan Perez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefono (WhatsApp)</label>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="5214921234567"
              />
              <p className="text-xs text-gray-400 mt-1">Incluye codigo de pais (52 para Mexico)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contrasena</label>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Minimo 8 caracteres"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contrasena</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Repite tu contrasena"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="animate-spin" size={16} /> Creando cuenta...</> : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Ya tienes cuenta?{' '}
            <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
              Inicia sesion
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
