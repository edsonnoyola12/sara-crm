import { Link } from 'react-router-dom'
import { Bot, Shield } from 'lucide-react'

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">SARA</h1>
          </Link>
          <Link to="/signup" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
            Prueba gratis
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="text-green-600" size={28} />
          <h2 className="text-3xl font-bold text-gray-900">Politica de Privacidad</h2>
        </div>
        <p className="text-sm text-gray-400 mb-8">Ultima actualizacion: Marzo 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed text-gray-600">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Informacion que recopilamos</h3>
            <p>Recopilamos informacion que nos proporcionas directamente al usar SARA CRM:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Datos de cuenta:</strong> nombre de empresa, email, contrasena (hasheada)</li>
              <li><strong>Datos de leads:</strong> nombre, telefono, email, historial de conversaciones por WhatsApp</li>
              <li><strong>Datos del equipo:</strong> nombre, telefono, rol de cada miembro</li>
              <li><strong>Datos de uso:</strong> mensajes enviados, leads creados, citas agendadas</li>
              <li><strong>Datos de pago:</strong> procesados por Stripe (no almacenamos tarjetas)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Como usamos tu informacion</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Proveer y mejorar el servicio de CRM y asistente de ventas</li>
              <li>Enviar mensajes automaticos a tus leads via WhatsApp (en tu nombre)</li>
              <li>Generar reportes y analytics de ventas</li>
              <li>Procesar pagos y facturacion</li>
              <li>Enviar emails transaccionales (bienvenida, invitaciones, alertas)</li>
              <li>Soporte tecnico cuando lo solicites</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Procesadores de datos</h3>
            <p>Utilizamos los siguientes servicios para operar SARA:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Supabase</strong> — Base de datos (PostgreSQL, US/AWS)</li>
              <li><strong>Cloudflare</strong> — Edge computing, CDN, cache (Global)</li>
              <li><strong>Meta/WhatsApp</strong> — Envio de mensajes (US/EU)</li>
              <li><strong>Anthropic (Claude)</strong> — IA conversacional (US)</li>
              <li><strong>Stripe</strong> — Procesamiento de pagos (US/EU)</li>
              <li><strong>Resend</strong> — Emails transaccionales (US)</li>
              <li><strong>Retell.ai</strong> — Llamadas con IA (US)</li>
              <li><strong>Google</strong> — Calendar sync (US)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Retencion de datos</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Leads activos:</strong> mientras la cuenta este activa</li>
              <li><strong>Conversaciones:</strong> 90 dias activas, luego se recortan a 30 entradas</li>
              <li><strong>Datos de billing:</strong> retenidos para cumplimiento fiscal (anonimizados al borrar cuenta)</li>
              <li><strong>Analytics:</strong> 12 meses rolling</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Tus derechos (GDPR / LFPDPPP)</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Acceso:</strong> Exporta todos tus datos en JSON desde Configuracion &gt; Privacidad</li>
              <li><strong>Rectificacion:</strong> Edita cualquier dato desde el CRM</li>
              <li><strong>Eliminacion:</strong> Borra tu cuenta completa desde Configuracion &gt; Privacidad</li>
              <li><strong>Restriccion:</strong> Los leads pueden pedir DNC (Do Not Contact) via WhatsApp</li>
              <li><strong>Portabilidad:</strong> Exporta leads, citas y conversaciones en CSV/JSON</li>
              <li><strong>Objecion:</strong> Leads pueden optar-out con comandos de texto</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Seguridad</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>JWT authentication con refresh tokens</li>
              <li>Row Level Security (RLS) por tenant en base de datos</li>
              <li>Encriptacion en transito (HTTPS/TLS) en todas las comunicaciones</li>
              <li>Contrasenas hasheadas con bcrypt</li>
              <li>Rate limiting por IP y por tenant</li>
              <li>HMAC-SHA256 verificacion de webhooks de Meta y Stripe</li>
              <li>Audit trail de cambios criticos</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Contacto</h3>
            <p>Para ejercer tus derechos o preguntas sobre privacidad:</p>
            <p className="mt-2"><strong>Email:</strong> privacy@sara-crm.com</p>
          </section>
        </div>
      </div>

      <footer className="border-t py-8 px-4 mt-12">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} SARA CRM</p>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-gray-600">Inicio</Link>
            <Link to="/terms" className="hover:text-gray-600">Terminos</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
