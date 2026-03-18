import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Copy, Check, ChevronDown, ChevronUp, Code, Key, Globe, Zap } from 'lucide-react'

interface Section {
  id: string
  title: string
  endpoints: Endpoint[]
}

interface Endpoint {
  method: string
  path: string
  description: string
  auth: 'none' | 'jwt' | 'api_key'
  request?: string
  response?: string
}

const SECTIONS: Section[] = [
  {
    id: 'auth',
    title: 'Autenticacion',
    endpoints: [
      {
        method: 'POST', path: '/api/signup', auth: 'none',
        description: 'Crear nueva cuenta (tenant + admin). Retorna JWT tokens.',
        request: `{ "name": "Mi Inmobiliaria", "email": "admin@empresa.com", "password": "min8chars" }`,
        response: `{ "data": { "user_id": "uuid", "tenant_id": "uuid" }, "access_token": "jwt...", "refresh_token": "jwt...", "user": {...}, "tenant": {...} }`,
      },
      {
        method: 'POST', path: '/api/auth/login', auth: 'none',
        description: 'Login con email + password. Retorna JWT tokens.',
        request: `{ "email": "admin@empresa.com", "password": "secreto" }`,
        response: `{ "access_token": "jwt...", "refresh_token": "jwt...", "user": { "id": "uuid", "email": "...", "role": "admin" }, "tenant": { "id": "uuid", "name": "...", "plan": "free" } }`,
      },
      {
        method: 'POST', path: '/api/auth/refresh', auth: 'none',
        description: 'Renovar access token usando refresh token.',
        request: `{ "refresh_token": "jwt..." }`,
        response: `{ "access_token": "new_jwt..." }`,
      },
      {
        method: 'GET', path: '/api/auth/me', auth: 'jwt',
        description: 'Obtener usuario y tenant del token actual.',
        response: `{ "user": { "id": "uuid", "email": "...", "role": "admin" }, "tenant": { "id": "uuid", "name": "...", "plan": "pro" } }`,
      },
    ],
  },
  {
    id: 'onboarding',
    title: 'Onboarding',
    endpoints: [
      { method: 'GET', path: '/api/onboarding', auth: 'jwt', description: 'Estado actual del onboarding (4 pasos).', response: `{ "data": { "current_step": 2, "whatsapp_setup": true, ... } }` },
      { method: 'POST', path: '/api/onboarding/whatsapp/verify', auth: 'jwt', description: 'Validar credenciales de WhatsApp contra Meta API.', request: `{ "phone_number_id": "123...", "access_token": "EAA..." }`, response: `{ "valid": true, "phone_number": "+52...", "business_name": "..." }` },
      { method: 'POST', path: '/api/onboarding/whatsapp', auth: 'jwt', description: 'Guardar config de WhatsApp (paso 1).', request: `{ "phone_number_id": "123...", "access_token": "EAA..." }` },
      { method: 'POST', path: '/api/onboarding/team', auth: 'jwt', description: 'Invitar equipo (paso 2).', request: `{ "emails": ["a@b.com"] }` },
      { method: 'POST', path: '/api/onboarding/leads', auth: 'jwt', description: 'Registrar importacion de leads (paso 3).', request: `{ "count": 150 }` },
      { method: 'POST', path: '/api/onboarding/config', auth: 'jwt', description: 'Configuracion final (paso 4).', request: `{ "timezone": "America/Mexico_City", "developments": ["Monte Verde"] }` },
    ],
  },
  {
    id: 'billing',
    title: 'Billing',
    endpoints: [
      { method: 'GET', path: '/api/plans', auth: 'none', description: 'Listar planes disponibles con precios y limites.', response: `{ "data": [{ "id": "free", "name": "Free", "price_mxn": 0, ... }] }` },
      { method: 'POST', path: '/api/billing/checkout', auth: 'jwt', description: 'Crear sesion de pago en Stripe.', request: `{ "price_id": "price_xxx" }`, response: `{ "data": { "url": "https://checkout.stripe.com/..." } }` },
      { method: 'POST', path: '/api/billing/portal', auth: 'jwt', description: 'Abrir portal de Stripe para gestionar suscripcion.', response: `{ "data": { "url": "https://billing.stripe.com/..." } }` },
      { method: 'GET', path: '/api/billing/history', auth: 'jwt', description: 'Historial de eventos de billing.' },
      { method: 'GET', path: '/api/usage', auth: 'jwt', description: 'Metricas de uso del mes actual.' },
      { method: 'GET', path: '/api/usage/summary', auth: 'jwt', description: 'Resumen de uso con limites y porcentajes.' },
    ],
  },
  {
    id: 'features',
    title: 'Feature Gating',
    endpoints: [
      { method: 'GET', path: '/api/features', auth: 'jwt', description: 'Listar todas las features con acceso por plan actual.', response: `{ "data": { "features": { "ai_conversations": { "allowed": true }, "retell_calls": { "allowed": false, "upgrade_to": "pro" } }, "team": { "current": 3, "limit": 5 } } }` },
      { method: 'GET', path: '/api/features/:feature', auth: 'jwt', description: 'Verificar acceso a una feature especifica.', response: `{ "data": { "allowed": false, "reason": "Requiere plan pro", "upgrade_to": "pro" } }` },
    ],
  },
  {
    id: 'admin',
    title: 'Admin',
    endpoints: [
      { method: 'GET', path: '/api/admin/tenant', auth: 'jwt', description: 'Info del tenant actual (config, branding, integraciones).' },
      { method: 'PUT', path: '/api/admin/tenant', auth: 'jwt', description: 'Actualizar nombre, timezone, logo, colores.', request: `{ "name": "Nuevo Nombre", "primary_color": "#FF6B4A" }` },
      { method: 'GET', path: '/api/admin/users', auth: 'jwt', description: 'Listar usuarios del tenant.' },
    ],
  },
  {
    id: 'invitations',
    title: 'Invitaciones',
    endpoints: [
      { method: 'GET', path: '/api/invitations', auth: 'jwt', description: 'Listar invitaciones pendientes y aceptadas.' },
      { method: 'POST', path: '/api/invitations', auth: 'jwt', description: 'Crear invitacion (envia email automatico).', request: `{ "email": "vendedor@empresa.com", "role": "vendedor" }` },
      { method: 'POST', path: '/api/invitations/accept', auth: 'none', description: 'Aceptar invitacion con token.', request: `{ "token": "uuid", "password": "min8chars", "name": "Juan" }` },
      { method: 'DELETE', path: '/api/invitations/:id', auth: 'jwt', description: 'Revocar invitacion pendiente.' },
      { method: 'POST', path: '/api/invitations/:id/resend', auth: 'jwt', description: 'Reenviar invitacion (genera nuevo token).' },
    ],
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="p-1 text-gray-400 hover:text-gray-600"
      title="Copiar"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  )
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-blue-100 text-blue-700',
    POST: 'bg-green-100 text-green-700',
    PUT: 'bg-amber-100 text-amber-700',
    DELETE: 'bg-red-100 text-red-700',
  }
  return <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${colors[method] || 'bg-gray-100'}`}>{method}</span>
}

export function ApiDocsPage() {
  const [open, setOpen] = useState<string | null>('auth')

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">SARA</h1>
            <span className="text-sm text-gray-400 ml-2">API Docs</span>
          </Link>
          <Link to="/signup" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
            Comenzar gratis
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">API Reference</h2>
          <p className="text-gray-500 max-w-2xl">
            La API de SARA te permite integrar el CRM con tus sistemas existentes.
            Todas las rutas usan JSON y autenticacion via JWT o API Secret.
          </p>

          {/* Auth info */}
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border">
              <Key size={18} className="text-gray-400 mb-2" />
              <h4 className="font-semibold text-sm text-gray-900 mb-1">JWT Token</h4>
              <p className="text-xs text-gray-500">Header: <code className="bg-gray-100 px-1 rounded">Authorization: Bearer &lt;token&gt;</code></p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border">
              <Globe size={18} className="text-gray-400 mb-2" />
              <h4 className="font-semibold text-sm text-gray-900 mb-1">Base URL</h4>
              <code className="text-xs text-gray-600 break-all">https://sara-backend.edson-633.workers.dev</code>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border">
              <Zap size={18} className="text-gray-400 mb-2" />
              <h4 className="font-semibold text-sm text-gray-900 mb-1">Rate Limits</h4>
              <p className="text-xs text-gray-500">100 req/min por IP. Enterprise: custom.</p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {SECTIONS.map(section => (
            <div key={section.id} className="border rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === section.id ? null : section.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Code size={18} className="text-gray-400" />
                  <span className="font-semibold text-gray-900">{section.title}</span>
                  <span className="text-xs text-gray-400">{section.endpoints.length} endpoints</span>
                </div>
                {open === section.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </button>

              {open === section.id && (
                <div className="border-t divide-y">
                  {section.endpoints.map(ep => (
                    <div key={ep.path + ep.method} className="p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <MethodBadge method={ep.method} />
                        <code className="text-sm font-mono text-gray-700">{ep.path}</code>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          ep.auth === 'none' ? 'bg-gray-100 text-gray-500' :
                          ep.auth === 'jwt' ? 'bg-blue-50 text-blue-600' :
                          'bg-purple-50 text-purple-600'
                        }`}>
                          {ep.auth === 'none' ? 'Publico' : ep.auth === 'jwt' ? 'JWT' : 'API Key'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{ep.description}</p>

                      {ep.request && (
                        <div className="mb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500">Request</span>
                            <CopyButton text={ep.request} />
                          </div>
                          <pre className="bg-gray-950 text-green-400 text-xs p-3 rounded-lg overflow-x-auto font-mono">{ep.request}</pre>
                        </div>
                      )}

                      {ep.response && (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500">Response</span>
                            <CopyButton text={ep.response} />
                          </div>
                          <pre className="bg-gray-950 text-blue-400 text-xs p-3 rounded-lg overflow-x-auto font-mono">{ep.response}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 px-4 mt-12">
        <div className="max-w-5xl mx-auto text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} SARA CRM. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
