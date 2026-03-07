import { useState, useCallback } from 'react'
import { useCrm } from '../context/CrmContext'
import type { ApiToken, WebhookConfig } from '../types/crm'
import { Globe, Key, Copy, Trash2, RefreshCw, ExternalLink, Plus, Eye, Check, X, ChevronDown, ChevronRight, AlertTriangle, Zap } from 'lucide-react'

// ---- Permission groups for token creation ----
const PERMISSION_GROUPS = [
  { entity: 'Leads', permissions: [
    { key: 'leads:read', label: 'Lectura' },
    { key: 'leads:write', label: 'Escritura' },
    { key: 'leads:delete', label: 'Eliminacion' },
  ]},
  { entity: 'Propiedades', permissions: [
    { key: 'properties:read', label: 'Lectura' },
    { key: 'properties:write', label: 'Escritura' },
  ]},
  { entity: 'Citas', permissions: [
    { key: 'appointments:read', label: 'Lectura' },
    { key: 'appointments:write', label: 'Escritura' },
  ]},
  { entity: 'Hipotecas', permissions: [
    { key: 'mortgages:read', label: 'Lectura' },
  ]},
  { entity: 'Equipo', permissions: [
    { key: 'team:read', label: 'Lectura' },
  ]},
  { entity: 'Campanas', permissions: [
    { key: 'campaigns:read', label: 'Lectura' },
  ]},
]

// ---- Webhook event groups ----
const EVENT_GROUPS = [
  { group: 'Leads', events: [
    'lead.created', 'lead.updated', 'lead.deleted', 'lead.status_changed',
  ]},
  { group: 'Citas', events: [
    'appointment.created', 'appointment.cancelled', 'appointment.completed',
  ]},
  { group: 'Hipotecas', events: [
    'mortgage.created', 'mortgage.status_changed',
  ]},
  { group: 'Tareas', events: [
    'task.created', 'task.completed',
  ]},
  { group: 'Propiedades', events: [
    'property.created', 'property.updated',
  ]},
]

const EXPIRATION_OPTIONS = [
  { label: 'Nunca', value: '' },
  { label: '30 dias', value: '30' },
  { label: '90 dias', value: '90' },
  { label: '1 ano', value: '365' },
]

// ---- Sample data for demo ----
const SAMPLE_TOKENS: ApiToken[] = [
  {
    id: '1', name: 'Inmuebles24 Sync', token: '****-****-****-a3f7',
    permissions: ['leads:read', 'leads:write', 'properties:read'],
    created_by: 'admin-1', created_by_name: 'Carlos Admin',
    last_used_at: '2026-03-07T10:30:00Z', expires_at: '2026-06-07T00:00:00Z',
    active: true, created_at: '2026-01-15T08:00:00Z',
  },
  {
    id: '2', name: 'ERP Contabilidad', token: '****-****-****-d912',
    permissions: ['leads:read', 'mortgages:read', 'appointments:read'],
    created_by: 'admin-1', created_by_name: 'Carlos Admin',
    last_used_at: '2026-03-05T14:22:00Z', active: true,
    created_at: '2025-11-20T08:00:00Z',
  },
  {
    id: '3', name: 'Token Prueba (expirado)', token: '****-****-****-0001',
    permissions: ['leads:read'],
    created_by: 'admin-1', created_by_name: 'Carlos Admin',
    expires_at: '2026-02-01T00:00:00Z',
    active: false, created_at: '2025-12-01T08:00:00Z',
  },
]

const SAMPLE_WEBHOOKS: WebhookConfig[] = [
  {
    id: '1', name: 'ERP - Nuevos Leads', url: 'https://erp.santarita.mx/api/webhooks/leads',
    events: ['lead.created', 'lead.status_changed'],
    secret: 'whsec_****',
    active: true, last_triggered_at: '2026-03-07T09:15:00Z', last_status_code: 200,
    failure_count: 0, created_by: 'admin-1', created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: '2', name: 'Slack - Citas', url: 'https://hooks.slack.com/services/T00/B00/xxxx',
    events: ['appointment.created', 'appointment.cancelled', 'appointment.completed'],
    active: true, last_triggered_at: '2026-03-06T16:45:00Z', last_status_code: 200,
    failure_count: 0, created_by: 'admin-1', created_at: '2026-02-01T08:00:00Z',
  },
  {
    id: '3', name: 'Analytics - Todo', url: 'https://analytics.example.com/ingest',
    events: ['lead.created', 'lead.updated', 'appointment.created', 'mortgage.created', 'task.completed'],
    active: false, last_triggered_at: '2026-02-28T12:00:00Z', last_status_code: 503,
    failure_count: 12, created_by: 'admin-1', created_at: '2026-01-20T08:00:00Z',
  },
]

const SAMPLE_LOGS = [
  { id: '1', webhook_id: '1', event: 'lead.created', status_code: 200, response_time_ms: 142, created_at: '2026-03-07T09:15:00Z' },
  { id: '2', webhook_id: '1', event: 'lead.status_changed', status_code: 200, response_time_ms: 98, created_at: '2026-03-07T08:30:00Z' },
  { id: '3', webhook_id: '1', event: 'lead.created', status_code: 200, response_time_ms: 156, created_at: '2026-03-06T17:20:00Z' },
  { id: '4', webhook_id: '2', event: 'appointment.created', status_code: 200, response_time_ms: 210, created_at: '2026-03-06T16:45:00Z' },
  { id: '5', webhook_id: '3', event: 'lead.created', status_code: 503, response_time_ms: 5002, created_at: '2026-02-28T12:00:00Z' },
  { id: '6', webhook_id: '3', event: 'mortgage.created', status_code: 503, response_time_ms: 5001, created_at: '2026-02-28T11:55:00Z' },
]

// ---- Helpers ----
function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const segments = []
  for (let s = 0; s < 4; s++) {
    let seg = ''
    for (let i = 0; i < 8; i++) seg += chars[Math.floor(Math.random() * chars.length)]
    segments.push(seg)
  }
  return `sara_${segments.join('_')}`
}

function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'whsec_'
  for (let i = 0; i < 32; i++) result += chars[Math.floor(Math.random() * chars.length)]
  return result
}

function maskToken(token: string): string {
  if (token.startsWith('****')) return token
  const last4 = token.slice(-4)
  return `****-****-****-${last4}`
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return 'Nunca'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Hace un momento'
  if (mins < 60) return `Hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `Hace ${days}d`
}

function isExpired(dateStr?: string): boolean {
  if (!dateStr) return false
  return new Date(dateStr).getTime() < Date.now()
}

function getStatusColor(code?: number): string {
  if (!code) return 'bg-slate-600'
  if (code >= 200 && code < 300) return 'bg-emerald-500'
  if (code >= 400 && code < 500) return 'bg-amber-500'
  return 'bg-red-500'
}

// ---- Main Component ----
export default function ApiWebhooksView() {
  const { showToast } = useCrm()
  const [tab, setTab] = useState<'tokens' | 'webhooks'>('tokens')

  // Token state
  const [tokens, setTokens] = useState<ApiToken[]>(SAMPLE_TOKENS)
  const [showCreateToken, setShowCreateToken] = useState(false)
  const [newTokenName, setNewTokenName] = useState('')
  const [newTokenPerms, setNewTokenPerms] = useState<string[]>([])
  const [newTokenExpiry, setNewTokenExpiry] = useState('')
  const [generatedToken, setGeneratedToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Webhook state
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(SAMPLE_WEBHOOKS)
  const [showWebhookForm, setShowWebhookForm] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null)
  const [webhookForm, setWebhookForm] = useState({ name: '', url: '', events: [] as string[], secret: '' })
  const [webhookUrlError, setWebhookUrlError] = useState('')
  const [expandedWebhook, setExpandedWebhook] = useState<string | null>(null)
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null)
  const [deleteWebhookConfirm, setDeleteWebhookConfirm] = useState<string | null>(null)

  // ---- Token handlers ----
  const handleTogglePerm = useCallback((perm: string) => {
    setNewTokenPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm])
  }, [])

  const handleGenerateToken = useCallback(() => {
    if (!newTokenName.trim()) {
      showToast('Nombre del token es requerido', 'error')
      return
    }
    if (newTokenPerms.length === 0) {
      showToast('Selecciona al menos un permiso', 'error')
      return
    }

    const rawToken = generateToken()
    const expiresAt = newTokenExpiry
      ? new Date(Date.now() + parseInt(newTokenExpiry) * 86400000).toISOString()
      : undefined

    const newToken: ApiToken = {
      id: crypto.randomUUID(),
      name: newTokenName.trim(),
      token: maskToken(rawToken),
      permissions: [...newTokenPerms],
      created_by: 'current-user',
      created_by_name: 'Admin',
      expires_at: expiresAt,
      active: true,
      created_at: new Date().toISOString(),
    }

    setTokens(prev => [newToken, ...prev])
    setGeneratedToken(rawToken)
    showToast('Token generado exitosamente', 'success')
  }, [newTokenName, newTokenPerms, newTokenExpiry, showToast])

  const handleCopyToken = useCallback(async () => {
    if (!generatedToken) return
    try {
      await navigator.clipboard.writeText(generatedToken)
      setCopied(true)
      showToast('Token copiado al portapapeles', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('Error al copiar', 'error')
    }
  }, [generatedToken, showToast])

  const handleCloseCreateToken = useCallback(() => {
    setShowCreateToken(false)
    setNewTokenName('')
    setNewTokenPerms([])
    setNewTokenExpiry('')
    setGeneratedToken(null)
    setCopied(false)
  }, [])

  const handleToggleToken = useCallback((id: string) => {
    setTokens(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t))
    showToast('Token actualizado', 'success')
  }, [showToast])

  const handleDeleteToken = useCallback((id: string) => {
    setTokens(prev => prev.filter(t => t.id !== id))
    setDeleteConfirm(null)
    showToast('Token eliminado', 'success')
  }, [showToast])

  // ---- Webhook handlers ----
  const handleOpenWebhookForm = useCallback((webhook?: WebhookConfig) => {
    if (webhook) {
      setEditingWebhook(webhook)
      setWebhookForm({ name: webhook.name, url: webhook.url, events: [...webhook.events], secret: webhook.secret || '' })
    } else {
      setEditingWebhook(null)
      setWebhookForm({ name: '', url: '', events: [], secret: '' })
    }
    setWebhookUrlError('')
    setShowWebhookForm(true)
  }, [])

  const handleToggleEvent = useCallback((event: string) => {
    setWebhookForm(prev => ({
      ...prev,
      events: prev.events.includes(event) ? prev.events.filter(e => e !== event) : [...prev.events, event],
    }))
  }, [])

  const handleSaveWebhook = useCallback(() => {
    if (!webhookForm.name.trim()) {
      showToast('Nombre del webhook es requerido', 'error')
      return
    }
    if (!webhookForm.url.trim()) {
      showToast('URL es requerida', 'error')
      return
    }
    if (!webhookForm.url.startsWith('https://')) {
      setWebhookUrlError('La URL debe comenzar con https://')
      return
    }
    if (webhookForm.events.length === 0) {
      showToast('Selecciona al menos un evento', 'error')
      return
    }

    if (editingWebhook) {
      setWebhooks(prev => prev.map(w => w.id === editingWebhook.id ? {
        ...w,
        name: webhookForm.name.trim(),
        url: webhookForm.url.trim(),
        events: [...webhookForm.events],
        secret: webhookForm.secret || undefined,
      } : w))
      showToast('Webhook actualizado', 'success')
    } else {
      const newWebhook: WebhookConfig = {
        id: crypto.randomUUID(),
        name: webhookForm.name.trim(),
        url: webhookForm.url.trim(),
        events: [...webhookForm.events],
        secret: webhookForm.secret || undefined,
        active: true,
        failure_count: 0,
        created_by: 'current-user',
        created_at: new Date().toISOString(),
      }
      setWebhooks(prev => [newWebhook, ...prev])
      showToast('Webhook creado', 'success')
    }

    setShowWebhookForm(false)
    setEditingWebhook(null)
  }, [webhookForm, editingWebhook, showToast])

  const handleToggleWebhook = useCallback((id: string) => {
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, active: !w.active } : w))
    showToast('Webhook actualizado', 'success')
  }, [showToast])

  const handleDeleteWebhook = useCallback((id: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== id))
    setDeleteWebhookConfirm(null)
    showToast('Webhook eliminado', 'success')
  }, [showToast])

  const handleTestWebhook = useCallback(async (id: string) => {
    setTestingWebhook(id)
    // Simulate test request
    await new Promise(r => setTimeout(r, 1500))
    setTestingWebhook(null)
    showToast('Test enviado - Respuesta: 200 OK', 'success')
  }, [showToast])

  const handleAutoGenerateSecret = useCallback(() => {
    setWebhookForm(prev => ({ ...prev, secret: generateSecret() }))
  }, [])

  const logsForWebhook = useCallback((webhookId: string) => {
    return SAMPLE_LOGS.filter(l => l.webhook_id === webhookId)
  }, [])

  // ---- Render ----
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Globe className="w-7 h-7 text-blue-400" />
            API & Webhooks
          </h1>
          <p className="text-slate-400 mt-1">Gestiona tokens de acceso e integraciones con sistemas externos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('tokens')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'tokens' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Key className="w-4 h-4" />
          API Tokens
          <span className="ml-1 text-xs bg-slate-700/80 px-1.5 py-0.5 rounded-full">{tokens.length}</span>
        </button>
        <button
          onClick={() => setTab('webhooks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'webhooks' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Zap className="w-4 h-4" />
          Webhooks
          <span className="ml-1 text-xs bg-slate-700/80 px-1.5 py-0.5 rounded-full">{webhooks.length}</span>
        </button>
      </div>

      {/* ==================== TOKENS TAB ==================== */}
      {tab === 'tokens' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateToken(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Generar Token
            </button>
          </div>

          {/* Token list */}
          <div className="space-y-3">
            {tokens.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No hay tokens configurados</p>
              </div>
            )}
            {tokens.map(token => (
              <div key={token.id} className={`bg-slate-800/50 border rounded-lg p-4 transition-all ${
                token.active ? 'border-slate-700/50' : 'border-slate-700/30 opacity-60'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Key className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-semibold text-white">{token.name}</span>
                      {!token.active && <span className="text-xs bg-slate-600 text-slate-300 px-2 py-0.5 rounded">Revocado</span>}
                      {token.expires_at && isExpired(token.expires_at) && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />Expirado
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-sm text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded inline-block mb-3">
                      {token.token}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {token.permissions.map(p => (
                        <span key={p} className="text-xs bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/20">
                          {p}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Creado: {formatDate(token.created_at)}</span>
                      <span>Ultimo uso: {timeAgo(token.last_used_at)}</span>
                      {token.expires_at && <span>Expira: {formatDate(token.expires_at)}</span>}
                      <span>Por: {token.created_by_name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleToken(token.id)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${token.active ? 'bg-emerald-500' : 'bg-slate-600'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${token.active ? 'left-5.5' : 'left-0.5'}`}
                        style={{ left: token.active ? '22px' : '2px' }}
                      />
                    </button>
                    {deleteConfirm === token.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDeleteToken(token.id)} className="p-1.5 bg-red-600 hover:bg-red-500 rounded text-white transition-colors">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="p-1.5 bg-slate-600 hover:bg-slate-500 rounded text-white transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(token.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Create Token Modal */}
          {showCreateToken && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleCloseCreateToken}>
              <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                    <Key className="w-5 h-5 text-amber-400" />
                    {generatedToken ? 'Token Generado' : 'Generar Nuevo Token'}
                  </h2>

                  {!generatedToken ? (
                    <>
                      {/* Name */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre del Token</label>
                        <input
                          type="text"
                          value={newTokenName}
                          onChange={e => setNewTokenName(e.target.value)}
                          placeholder="Ej: Inmuebles24 Sync"
                          className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Permissions */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Permisos</label>
                        <div className="space-y-3">
                          {PERMISSION_GROUPS.map(group => (
                            <div key={group.entity} className="bg-slate-900/30 rounded-lg p-3">
                              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{group.entity}</div>
                              <div className="flex flex-wrap gap-2">
                                {group.permissions.map(p => (
                                  <label key={p.key} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={newTokenPerms.includes(p.key)}
                                      onChange={() => handleTogglePerm(p.key)}
                                      className="w-4 h-4 rounded border-slate-500 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                                    />
                                    <span className="text-sm text-slate-300">{p.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Expiration */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Expiracion</label>
                        <select
                          value={newTokenExpiry}
                          onChange={e => setNewTokenExpiry(e.target.value)}
                          className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        >
                          {EXPIRATION_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-3 justify-end">
                        <button onClick={handleCloseCreateToken} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">
                          Cancelar
                        </button>
                        <button onClick={handleGenerateToken} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
                          Generar Token
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Token display */}
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-sm text-amber-300">
                            Copia este token ahora. No se mostrara de nuevo por seguridad.
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-3">
                          <code className="flex-1 text-sm text-emerald-400 font-mono break-all select-all">
                            {generatedToken}
                          </code>
                          <button
                            onClick={handleCopyToken}
                            className={`p-2 rounded-lg transition-colors shrink-0 ${
                              copied ? 'bg-emerald-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                            }`}
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button onClick={handleCloseCreateToken} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors">
                          Cerrar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== WEBHOOKS TAB ==================== */}
      {tab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => handleOpenWebhookForm()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo Webhook
            </button>
          </div>

          {/* Webhook list */}
          <div className="space-y-3">
            {webhooks.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No hay webhooks configurados</p>
              </div>
            )}
            {webhooks.map(webhook => {
              const logs = logsForWebhook(webhook.id)
              const isExpanded = expandedWebhook === webhook.id
              return (
                <div key={webhook.id} className={`bg-slate-800/50 border rounded-lg transition-all ${
                  webhook.active ? 'border-slate-700/50' : 'border-slate-700/30 opacity-60'
                }`}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                          <span className="font-semibold text-white">{webhook.name}</span>
                          {/* Status indicator */}
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            !webhook.last_status_code ? 'bg-slate-600' : getStatusColor(webhook.last_status_code)
                          }`} title={webhook.last_status_code ? `Ultimo status: ${webhook.last_status_code}` : 'Nunca ejecutado'} />
                          {webhook.failure_count > 0 && (
                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />{webhook.failure_count} fallos
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-400 mb-2 flex items-center gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[400px] font-mono text-xs">{webhook.url}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <span className="text-xs bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20">
                            {webhook.events.length} evento{webhook.events.length !== 1 ? 's' : ''}
                          </span>
                          {webhook.secret && (
                            <span className="text-xs bg-slate-600/50 text-slate-400 px-2 py-0.5 rounded-full">
                              Con secreto
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Creado: {formatDate(webhook.created_at)}</span>
                          <span>Ultimo envio: {timeAgo(webhook.last_triggered_at)}</span>
                          {webhook.last_status_code && <span>Status: {webhook.last_status_code}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleTestWebhook(webhook.id)}
                          disabled={testingWebhook === webhook.id || !webhook.active}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors disabled:opacity-40"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${testingWebhook === webhook.id ? 'animate-spin' : ''}`} />
                          Test
                        </button>
                        <button
                          onClick={() => handleOpenWebhookForm(webhook)}
                          className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors"
                          title="Editar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleWebhook(webhook.id)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${webhook.active ? 'bg-emerald-500' : 'bg-slate-600'}`}
                        >
                          <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                            style={{ left: webhook.active ? '22px' : '2px' }}
                          />
                        </button>
                        {deleteWebhookConfirm === webhook.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDeleteWebhook(webhook.id)} className="p-1.5 bg-red-600 hover:bg-red-500 rounded text-white transition-colors">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteWebhookConfirm(null)} className="p-1.5 bg-slate-600 hover:bg-slate-500 rounded text-white transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteWebhookConfirm(webhook.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expand logs toggle */}
                    {logs.length > 0 && (
                      <button
                        onClick={() => setExpandedWebhook(isExpanded ? null : webhook.id)}
                        className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        Ultimos envios ({logs.length})
                      </button>
                    )}
                  </div>

                  {/* Expanded logs */}
                  {isExpanded && logs.length > 0 && (
                    <div className="border-t border-slate-700/50 px-4 py-3">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-slate-500">
                            <th className="text-left py-1 font-medium">Fecha</th>
                            <th className="text-left py-1 font-medium">Evento</th>
                            <th className="text-center py-1 font-medium">Status</th>
                            <th className="text-right py-1 font-medium">Tiempo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.map(log => (
                            <tr key={log.id} className="border-t border-slate-800/50">
                              <td className="py-1.5 text-slate-400">{formatDateTime(log.created_at)}</td>
                              <td className="py-1.5">
                                <span className="text-slate-300 font-mono">{log.event}</span>
                              </td>
                              <td className="py-1.5 text-center">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-white text-xs ${getStatusColor(log.status_code)}`}>
                                  {log.status_code}
                                </span>
                              </td>
                              <td className="py-1.5 text-right text-slate-400">{log.response_time_ms}ms</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Webhook Form Modal */}
          {showWebhookForm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowWebhookForm(false)}>
              <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                    <Zap className="w-5 h-5 text-purple-400" />
                    {editingWebhook ? 'Editar Webhook' : 'Nuevo Webhook'}
                  </h2>

                  {/* Name */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre</label>
                    <input
                      type="text"
                      value={webhookForm.name}
                      onChange={e => setWebhookForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej: ERP - Nuevos Leads"
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* URL */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">URL del Endpoint</label>
                    <input
                      type="url"
                      value={webhookForm.url}
                      onChange={e => { setWebhookForm(prev => ({ ...prev, url: e.target.value })); setWebhookUrlError('') }}
                      placeholder="https://tu-servidor.com/webhook"
                      className={`w-full bg-slate-900/50 border rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none ${
                        webhookUrlError ? 'border-red-500 focus:border-red-400' : 'border-slate-600 focus:border-blue-500'
                      }`}
                    />
                    {webhookUrlError && <p className="text-xs text-red-400 mt-1">{webhookUrlError}</p>}
                  </div>

                  {/* Events */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Eventos</label>
                    <div className="space-y-3">
                      {EVENT_GROUPS.map(group => (
                        <div key={group.group} className="bg-slate-900/30 rounded-lg p-3">
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{group.group}</div>
                          <div className="flex flex-wrap gap-2">
                            {group.events.map(event => (
                              <label key={event} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={webhookForm.events.includes(event)}
                                  onChange={() => handleToggleEvent(event)}
                                  className="w-4 h-4 rounded border-slate-500 bg-slate-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                                />
                                <span className="text-sm text-slate-300 font-mono">{event}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Secret */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Secreto (opcional)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={webhookForm.secret}
                        onChange={e => setWebhookForm(prev => ({ ...prev, secret: e.target.value }))}
                        placeholder="Clave para verificar firma HMAC"
                        className="flex-1 bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
                      />
                      <button
                        onClick={handleAutoGenerateSecret}
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors flex items-center gap-1.5"
                        title="Auto-generar secreto"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Generar
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Se enviara como header X-Webhook-Secret para verificar autenticidad</p>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button onClick={() => setShowWebhookForm(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">
                      Cancelar
                    </button>
                    <button onClick={handleSaveWebhook} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
                      {editingWebhook ? 'Guardar Cambios' : 'Crear Webhook'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== API DOCS REFERENCE ==================== */}
      <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <ExternalLink className="w-5 h-5 text-slate-400" />
          Referencia API
        </h2>
        <div className="space-y-4">
          {/* Base URL */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Base URL</span>
            <div className="font-mono text-sm text-emerald-400 bg-slate-900/50 px-3 py-2 rounded-lg mt-1">
              https://sara-backend.edson-633.workers.dev/api/v1
            </div>
          </div>

          {/* Auth */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Autenticacion</span>
            <div className="font-mono text-sm text-slate-300 bg-slate-900/50 px-3 py-2 rounded-lg mt-1">
              Authorization: Bearer &lt;token&gt;
            </div>
          </div>

          {/* Endpoints table */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Endpoints Disponibles</span>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs border-b border-slate-700/50">
                    <th className="text-left py-2 font-medium">Metodo</th>
                    <th className="text-left py-2 font-medium">Ruta</th>
                    <th className="text-left py-2 font-medium">Descripcion</th>
                    <th className="text-left py-2 font-medium">Permiso</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {[
                    { method: 'GET', path: '/leads', desc: 'Listar leads', perm: 'leads:read' },
                    { method: 'POST', path: '/leads', desc: 'Crear lead', perm: 'leads:write' },
                    { method: 'PUT', path: '/leads/:id', desc: 'Actualizar lead', perm: 'leads:write' },
                    { method: 'DELETE', path: '/leads/:id', desc: 'Eliminar lead', perm: 'leads:delete' },
                    { method: 'GET', path: '/properties', desc: 'Listar propiedades', perm: 'properties:read' },
                    { method: 'POST', path: '/properties', desc: 'Crear propiedad', perm: 'properties:write' },
                    { method: 'GET', path: '/appointments', desc: 'Listar citas', perm: 'appointments:read' },
                    { method: 'POST', path: '/appointments', desc: 'Crear cita', perm: 'appointments:write' },
                    { method: 'GET', path: '/mortgages', desc: 'Listar hipotecas', perm: 'mortgages:read' },
                    { method: 'GET', path: '/team', desc: 'Listar equipo', perm: 'team:read' },
                    { method: 'GET', path: '/campaigns', desc: 'Listar campanas', perm: 'campaigns:read' },
                  ].map((ep, i) => (
                    <tr key={i} className="border-t border-slate-800/50">
                      <td className="py-2">
                        <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                          ep.method === 'GET' ? 'bg-emerald-500/15 text-emerald-400' :
                          ep.method === 'POST' ? 'bg-blue-500/15 text-blue-400' :
                          ep.method === 'PUT' ? 'bg-amber-500/15 text-amber-400' :
                          'bg-red-500/15 text-red-400'
                        }`}>{ep.method}</span>
                      </td>
                      <td className="py-2 font-mono text-xs text-slate-400">{ep.path}</td>
                      <td className="py-2 text-slate-400">{ep.desc}</td>
                      <td className="py-2">
                        <span className="text-xs bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded font-mono">{ep.perm}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Example curl */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ejemplo cURL</span>
            <pre className="font-mono text-xs text-slate-400 bg-slate-900/50 px-4 py-3 rounded-lg mt-1 overflow-x-auto whitespace-pre-wrap">
{`curl -X GET \\
  https://sara-backend.edson-633.workers.dev/api/v1/leads \\
  -H "Authorization: Bearer sara_xxxxxxxx_xxxxxxxx_xxxxxxxx_xxxxxxxx" \\
  -H "Content-Type: application/json"`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
