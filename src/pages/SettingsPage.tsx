import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Bot, Building2, Palette, MessageSquare, Users, Shield,
  Save, Loader2, Check, Copy, Eye, EyeOff, RefreshCw, Mail, Trash2,
  Globe, Clock
} from 'lucide-react'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/authStore'

interface TenantSettings {
  id: string
  name: string
  slug: string
  plan: string
  timezone: string
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  whatsapp_phone_number_id?: string
  whatsapp_access_token?: string
  whatsapp_business_id?: string
  google_calendar_id?: string
  retell_api_key?: string
  retell_agent_id?: string
  retell_phone_number?: string
  created_at: string
}

interface AuthUser {
  id: string
  email: string
  role: string
  created_at: string
  last_login?: string
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  expires_at: string
  created_at: string
}

type Tab = 'general' | 'whatsapp' | 'team' | 'integrations'

export function SettingsPage() {
  const navigate = useNavigate()
  const tenant = useAuthStore(s => s.tenant)
  const [tab, setTab] = useState<Tab>('general')
  const [settings, setSettings] = useState<TenantSettings | null>(null)
  const [users, setUsers] = useState<AuthUser[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showTokens, setShowTokens] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('vendedor')
  const [inviting, setInviting] = useState(false)

  // Editable fields
  const [name, setName] = useState('')
  const [timezone, setTimezone] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#16A34A')
  const [logoUrl, setLogoUrl] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [tenantRes, usersRes, invRes] = await Promise.all([
        api.get('/api/admin/tenant').catch(() => ({ data: null })),
        api.get('/api/admin/users').catch(() => ({ data: [] })),
        api.get('/api/invitations').catch(() => ({ data: [] })),
      ])

      const t = tenantRes.data
      if (t) {
        setSettings(t)
        setName(t.name || '')
        setTimezone(t.timezone || 'America/Mexico_City')
        setPrimaryColor(t.primary_color || '#16A34A')
        setLogoUrl(t.logo_url || '')
      }
      setUsers(usersRes.data || [])
      setInvitations(invRes.data || [])
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveGeneral() {
    setSaving(true)
    setSaved(false)
    try {
      await api.put('/api/admin/tenant', {
        name,
        timezone,
        primary_color: primaryColor,
        logo_url: logoUrl || undefined,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      alert(err.message || 'Error guardando')
    } finally {
      setSaving(false)
    }
  }

  async function handleInvite() {
    if (!inviteEmail.includes('@')) return
    setInviting(true)
    try {
      await api.post('/api/invitations', { email: inviteEmail, role: inviteRole })
      setInviteEmail('')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Error enviando invitacion')
    } finally {
      setInviting(false)
    }
  }

  async function handleRevokeInvite(id: string) {
    try {
      await api.delete(`/api/invitations/${id}`)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Error revocando')
    }
  }

  async function handleResendInvite(id: string) {
    try {
      await api.post(`/api/invitations/${id}/resend`)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Error reenviando')
    }
  }

  const TABS: { id: Tab; label: string; icon: typeof Building2 }[] = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'team', label: 'Equipo', icon: Users },
    { id: 'integrations', label: 'Integraciones', icon: Globe },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-green-500" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Bot size={14} className="text-white" />
              </div>
              <span className="font-bold text-gray-900">SARA</span>
            </div>
          </div>
          <h2 className="text-sm font-medium text-gray-600">Configuracion</h2>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row gap-8">
          {/* Sidebar tabs */}
          <div className="sm:w-56 flex-shrink-0">
            <nav className="space-y-1">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    tab === t.id
                      ? 'bg-green-50 text-green-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <t.icon size={18} />
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* General */}
            {tab === 'general' && (
              <div className="bg-white rounded-xl border p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Informacion general</h3>
                  <p className="text-sm text-gray-500">Datos de tu empresa y personalizacion</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la empresa</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
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
                      <option value="America/Sao_Paulo">Sao Paulo (UTC-3)</option>
                      <option value="America/New_York">New York (UTC-5)</option>
                      <option value="America/Los_Angeles">Los Angeles (UTC-8)</option>
                      <option value="Europe/Madrid">Madrid (UTC+1)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color principal</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)}
                        className="w-12 h-12 rounded-lg border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)}
                        className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-32 font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (opcional)</label>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={e => setLogoUrl(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="https://tu-dominio.com/logo.png"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <span className="text-xs text-gray-400">Slug: {settings?.slug}</span>
                    <span className="text-xs text-gray-400 ml-4">Plan: {settings?.plan}</span>
                  </div>
                  <button
                    onClick={handleSaveGeneral}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm font-medium"
                  >
                    {saving ? <Loader2 className="animate-spin" size={14} /> : saved ? <Check size={14} /> : <Save size={14} />}
                    {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            )}

            {/* WhatsApp */}
            {tab === 'whatsapp' && (
              <div className="bg-white rounded-xl border p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">WhatsApp Business API</h3>
                  <p className="text-sm text-gray-500">Credenciales de tu cuenta de Meta WhatsApp Business</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number ID</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={settings?.whatsapp_phone_number_id || ''}
                        readOnly
                        className="flex-1 px-4 py-3 border rounded-lg bg-gray-50 text-gray-600 font-mono text-sm"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(settings?.whatsapp_phone_number_id || '')}
                        className="p-3 border rounded-lg hover:bg-gray-50"
                        title="Copiar"
                      >
                        <Copy size={16} className="text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                    <div className="flex items-center gap-2">
                      <input
                        type={showTokens ? 'text' : 'password'}
                        value={settings?.whatsapp_access_token ? '***configured***' : 'No configurado'}
                        readOnly
                        className="flex-1 px-4 py-3 border rounded-lg bg-gray-50 text-gray-600 font-mono text-sm"
                      />
                      <button
                        onClick={() => setShowTokens(!showTokens)}
                        className="p-3 border rounded-lg hover:bg-gray-50"
                      >
                        {showTokens ? <EyeOff size={16} className="text-gray-400" /> : <Eye size={16} className="text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Account ID</label>
                    <input
                      type="text"
                      value={settings?.whatsapp_business_id || 'No configurado'}
                      readOnly
                      className="w-full px-4 py-3 border rounded-lg bg-gray-50 text-gray-600 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-400">
                    Para cambiar credenciales de WhatsApp, ve a{' '}
                    <button onClick={() => navigate('/onboarding')} className="text-green-600 hover:underline">
                      Onboarding &gt; Paso 1
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* Team */}
            {tab === 'team' && (
              <div className="space-y-6">
                {/* Invite */}
                <div className="bg-white rounded-xl border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Invitar miembro</h3>
                  <p className="text-sm text-gray-500 mb-4">Envia una invitacion por email</p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="email@empresa.com"
                    />
                    <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                      className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="vendedor">Vendedor</option>
                      <option value="asesor">Asesor</option>
                      <option value="coordinador">Coordinador</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={handleInvite}
                      disabled={inviting || !inviteEmail.includes('@')}
                      className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm font-medium flex items-center gap-2 justify-center"
                    >
                      {inviting ? <Loader2 className="animate-spin" size={14} /> : <Mail size={14} />}
                      Invitar
                    </button>
                  </div>
                </div>

                {/* Current users */}
                <div className="bg-white rounded-xl border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Usuarios activos</h3>
                  {users.length > 0 ? (
                    <div className="space-y-3">
                      {users.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{u.email}</p>
                            <p className="text-xs text-gray-500">
                              {u.role} &middot; Creado {new Date(u.created_at).toLocaleDateString('es-MX')}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            u.role === 'admin' ? 'bg-purple-50 text-purple-700' :
                            u.role === 'vendedor' ? 'bg-blue-50 text-blue-700' :
                            u.role === 'asesor' ? 'bg-amber-50 text-amber-700' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {u.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Solo el admin esta registrado</p>
                  )}
                </div>

                {/* Pending invitations */}
                {invitations.length > 0 && (
                  <div className="bg-white rounded-xl border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Invitaciones pendientes</h3>
                    <div className="space-y-3">
                      {invitations.map(inv => (
                        <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{inv.email}</p>
                            <p className="text-xs text-gray-500">
                              {inv.role} &middot; Expira {new Date(inv.expires_at).toLocaleDateString('es-MX')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleResendInvite(inv.id)}
                              className="p-1.5 text-gray-400 hover:text-gray-600"
                              title="Reenviar"
                            >
                              <RefreshCw size={14} />
                            </button>
                            <button
                              onClick={() => handleRevokeInvite(inv.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500"
                              title="Revocar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Integrations */}
            {tab === 'integrations' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Google Calendar</h3>
                  <p className="text-sm text-gray-500 mb-4">Sincroniza citas automaticamente</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${settings?.google_calendar_id ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm text-gray-600">
                      {settings?.google_calendar_id ? 'Conectado' : 'No configurado'}
                    </span>
                  </div>
                  {settings?.google_calendar_id && (
                    <p className="mt-2 text-xs text-gray-400 font-mono">{settings.google_calendar_id}</p>
                  )}
                </div>

                <div className="bg-white rounded-xl border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Retell.ai (Llamadas IA)</h3>
                  <p className="text-sm text-gray-500 mb-4">Llamadas automaticas a leads</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${settings?.retell_api_key ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm text-gray-600">
                      {settings?.retell_api_key ? 'Conectado' : 'No configurado'}
                    </span>
                  </div>
                  {settings?.retell_phone_number && (
                    <p className="mt-2 text-xs text-gray-400">{settings.retell_phone_number}</p>
                  )}
                </div>

                <div className="bg-white rounded-xl border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">API Access</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {settings?.plan === 'enterprise'
                      ? 'Accede a la API de SARA para integraciones custom'
                      : 'Disponible en el plan Enterprise'
                    }
                  </p>
                  {settings?.plan === 'enterprise' ? (
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-xs text-gray-500 mb-1">Endpoint</p>
                      <code className="text-sm text-gray-700">https://sara-backend.edson-633.workers.dev/api/</code>
                    </div>
                  ) : (
                    <button
                      onClick={() => navigate('/billing')}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      Upgrade a Enterprise
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
