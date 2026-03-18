import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import { MessageSquare, Users, Upload, Settings, Check, ChevronRight, ArrowLeft } from 'lucide-react'

const STEPS = [
  { num: 1, title: 'Conectar WhatsApp', icon: MessageSquare, desc: 'Configura tu WhatsApp Business API' },
  { num: 2, title: 'Invitar equipo', icon: Users, desc: 'Invita a tus vendedores y asesores' },
  { num: 3, title: 'Importar leads', icon: Upload, desc: 'Sube tu base de datos de clientes' },
  { num: 4, title: 'Configurar', icon: Settings, desc: 'Horarios, zona horaria y desarrollos' },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const tenant = useAuthStore(s => s.tenant)
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Step 1 state
  const [waPhoneId, setWaPhoneId] = useState('')
  const [waToken, setWaToken] = useState('')
  const [waBusinessId, setWaBusinessId] = useState('')

  // Step 2 state
  const [emails, setEmails] = useState([''])

  // Step 3 state
  const [leadsCount, setLeadsCount] = useState(0)
  const [csvUploaded, setCsvUploaded] = useState(false)

  // Step 4 state
  const [timezone, setTimezone] = useState('America/Mexico_City')
  const [developments, setDevelopments] = useState('')

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    try {
      const res = await api.get('/api/onboarding')
      setCurrentStep(res.data.current_step)
    } catch {
      setCurrentStep(0)
    } finally {
      setLoading(false)
    }
  }

  async function handleStep1() {
    if (!waPhoneId || !waToken) {
      setError('Phone Number ID y Access Token son obligatorios')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await api.post('/api/onboarding/whatsapp', {
        phone_number_id: waPhoneId,
        access_token: waToken,
        business_id: waBusinessId || undefined,
      })
      if (res.success) setCurrentStep(res.next_step)
      else setError(res.error || 'Error guardando WhatsApp config')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleStep2() {
    const validEmails = emails.filter(e => e.includes('@'))
    setSaving(true)
    setError('')
    try {
      const res = await api.post('/api/onboarding/team', { emails: validEmails })
      if (res.success) setCurrentStep(res.next_step)
      else setError(res.error || 'Error invitando equipo')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleStep3() {
    setSaving(true)
    setError('')
    try {
      const res = await api.post('/api/onboarding/leads', { count: leadsCount })
      if (res.success) setCurrentStep(res.next_step)
      else setError(res.error || 'Error importando leads')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleStep4() {
    setSaving(true)
    setError('')
    try {
      const devList = developments.split(',').map(d => d.trim()).filter(Boolean)
      const res = await api.post('/api/onboarding/config', {
        timezone,
        developments: devList.length > 0 ? devList : undefined,
      })
      if (res.success) {
        navigate('/')
      } else {
        setError(res.error || 'Error guardando configuracion')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  function handleSkip() {
    const handlers = [handleStep1, handleStep2, handleStep3, handleStep4]
    // For steps 2 and 3, allow skipping by submitting empty data
    if (activeStep === 2) {
      api.post('/api/onboarding/team', { emails: [] })
        .then(res => { if (res.success) setCurrentStep(res.next_step) })
    } else if (activeStep === 3) {
      api.post('/api/onboarding/leads', { count: 0 })
        .then(res => { if (res.success) setCurrentStep(res.next_step) })
    }
  }

  const activeStep = currentStep + 1 // onboarding_step=0 means step 1 is next

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (currentStep >= 4) {
    navigate('/')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-green-800">SARA CRM</h1>
            <p className="text-sm text-gray-500">Configuracion de {tenant?.name || 'tu empresa'}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Saltar setup
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, i) => (
            <div key={step.num} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                step.num < activeStep
                  ? 'bg-green-500 border-green-500 text-white'
                  : step.num === activeStep
                  ? 'border-green-500 text-green-600 bg-green-50'
                  : 'border-gray-300 text-gray-400'
              }`}>
                {step.num < activeStep ? <Check size={18} /> : step.num}
              </div>
              <span className={`ml-2 text-sm hidden sm:inline ${
                step.num === activeStep ? 'font-medium text-green-700' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
              {i < STEPS.length - 1 && (
                <ChevronRight size={16} className="mx-2 text-gray-300" />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Step content */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="text-green-600" size={24} />
                <div>
                  <h2 className="text-lg font-semibold">Conecta tu WhatsApp Business</h2>
                  <p className="text-sm text-gray-500">Necesitas una cuenta de WhatsApp Business API (Meta)</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number ID *</label>
                <input
                  type="text"
                  value={waPhoneId}
                  onChange={e => setWaPhoneId(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="123456789012345"
                />
                <p className="text-xs text-gray-400 mt-1">Lo encuentras en Meta Business Suite &gt; WhatsApp &gt; API Setup</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Token *</label>
                <input
                  type="password"
                  value={waToken}
                  onChange={e => setWaToken(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="EAAxxxxxxx..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Account ID (opcional)</label>
                <input
                  type="text"
                  value={waBusinessId}
                  onChange={e => setWaBusinessId(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="123456789012345"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={handleStep1} disabled={saving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Continuar'}
                </button>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-green-600" size={24} />
                <div>
                  <h2 className="text-lg font-semibold">Invita a tu equipo</h2>
                  <p className="text-sm text-gray-500">Agrega los emails de tus vendedores y asesores</p>
                </div>
              </div>

              {emails.map((email, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={e => {
                      const next = [...emails]
                      next[i] = e.target.value
                      setEmails(next)
                    }}
                    className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="vendedor@empresa.com"
                  />
                  {emails.length > 1 && (
                    <button onClick={() => setEmails(emails.filter((_, j) => j !== i))}
                      className="px-3 text-red-400 hover:text-red-600">x</button>
                  )}
                </div>
              ))}

              <button onClick={() => setEmails([...emails, ''])}
                className="text-sm text-green-600 hover:text-green-700">
                + Agregar otro email
              </button>

              <div className="flex justify-between pt-4">
                <button onClick={handleSkip}
                  className="px-6 py-2 text-gray-500 hover:text-gray-700">
                  Saltar por ahora
                </button>
                <button onClick={handleStep2} disabled={saving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {saving ? 'Enviando...' : 'Enviar invitaciones'}
                </button>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Upload className="text-green-600" size={24} />
                <div>
                  <h2 className="text-lg font-semibold">Importa tus leads</h2>
                  <p className="text-sm text-gray-500">Sube un CSV con tu base de datos de clientes (opcional)</p>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                <p className="text-gray-500 mb-2">Arrastra un archivo CSV aqui</p>
                <p className="text-xs text-gray-400 mb-4">Columnas: nombre, telefono, email, desarrollo_interes</p>
                <label className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200">
                  Seleccionar archivo
                  <input type="file" accept=".csv" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      // Count lines as rough lead count
                      const reader = new FileReader()
                      reader.onload = (ev) => {
                        const lines = (ev.target?.result as string)?.split('\n').filter(l => l.trim()).length - 1
                        setLeadsCount(Math.max(0, lines))
                        setCsvUploaded(true)
                      }
                      reader.readAsText(file)
                    }
                  }} />
                </label>
              </div>

              {csvUploaded && (
                <p className="text-sm text-green-600">{leadsCount} leads detectados en el archivo</p>
              )}

              <div className="flex justify-between pt-4">
                <button onClick={handleSkip}
                  className="px-6 py-2 text-gray-500 hover:text-gray-700">
                  Saltar por ahora
                </button>
                <button onClick={handleStep3} disabled={saving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {saving ? 'Importando...' : csvUploaded ? 'Importar leads' : 'Continuar sin leads'}
                </button>
              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="text-green-600" size={24} />
                <div>
                  <h2 className="text-lg font-semibold">Configuracion final</h2>
                  <p className="text-sm text-gray-500">Ajusta tu zona horaria y desarrollos</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zona horaria</label>
                <select value={timezone} onChange={e => setTimezone(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="America/Mexico_City">Ciudad de Mexico (UTC-6)</option>
                  <option value="America/Monterrey">Monterrey (UTC-6)</option>
                  <option value="America/Cancun">Cancun (UTC-5)</option>
                  <option value="America/Tijuana">Tijuana (UTC-8)</option>
                  <option value="America/Hermosillo">Hermosillo (UTC-7)</option>
                  <option value="America/Bogota">Bogota (UTC-5)</option>
                  <option value="America/Lima">Lima (UTC-5)</option>
                  <option value="America/Santiago">Santiago (UTC-3)</option>
                  <option value="America/Buenos_Aires">Buenos Aires (UTC-3)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desarrollos / Proyectos (separados por coma)</label>
                <textarea
                  value={developments}
                  onChange={e => setDevelopments(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Monte Verde, Los Encinos, Distrito Falco"
                  rows={3}
                />
                <p className="text-xs text-gray-400 mt-1">Puedes agregar mas despues en Configuracion</p>
              </div>

              <div className="flex justify-end pt-4">
                <button onClick={handleStep4} disabled={saving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Finalizar setup'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
