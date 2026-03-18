import { Link } from 'react-router-dom'
import { Bot, FileText } from 'lucide-react'

export function TermsPage() {
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
          <FileText className="text-green-600" size={28} />
          <h2 className="text-3xl font-bold text-gray-900">Terminos de Servicio</h2>
        </div>
        <p className="text-sm text-gray-400 mb-8">Ultima actualizacion: Marzo 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed text-gray-600">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Aceptacion de terminos</h3>
            <p>Al crear una cuenta en SARA CRM, aceptas estos terminos de servicio. Si no estas de acuerdo, no uses el servicio. SARA CRM es operado como una plataforma SaaS (Software as a Service) para gestion de ventas inmobiliarias.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Descripcion del servicio</h3>
            <p>SARA CRM proporciona:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Asistente de ventas con inteligencia artificial via WhatsApp</li>
              <li>CRM para gestion de leads, citas y pipeline de ventas</li>
              <li>Automatizaciones de seguimiento, reportes y alertas</li>
              <li>Integracion con WhatsApp Business API, Google Calendar y Retell.ai</li>
              <li>Dashboard y analytics de ventas</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Cuentas y acceso</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Debes proporcionar informacion veraz al registrarte</li>
              <li>Eres responsable de mantener la confidencialidad de tu contrasena</li>
              <li>Cada cuenta es para uso de una empresa/organizacion</li>
              <li>Puedes invitar miembros de equipo segun los limites de tu plan</li>
              <li>No compartas credenciales de API con terceros no autorizados</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Planes y facturacion</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Trial:</strong> 14 dias gratis con funciones Pro. No requiere tarjeta</li>
              <li><strong>Planes:</strong> Free, Starter ($1,499 MXN/mes), Pro ($3,999 MXN/mes), Enterprise (contacto)</li>
              <li><strong>Cobros:</strong> Mensuales via Stripe. Se cobran al inicio del periodo</li>
              <li><strong>Cancelacion:</strong> Puedes cancelar en cualquier momento. El acceso continua hasta el fin del periodo pagado</li>
              <li><strong>Reembolsos:</strong> 30 dias de garantia de devolucion en el primer pago</li>
              <li><strong>Limites:</strong> Cada plan tiene limites de leads, mensajes y miembros. Al exceder los limites, las automatizaciones se pausan</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Uso aceptable</h3>
            <p>No puedes usar SARA para:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Enviar spam o mensajes no solicitados masivos</li>
              <li>Violar las politicas de WhatsApp Business</li>
              <li>Almacenar o transmitir contenido ilegal</li>
              <li>Intentar acceder a datos de otros tenants</li>
              <li>Realizar ingenieria inversa del servicio</li>
              <li>Exceder intencionalmente los rate limits</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Propiedad de datos</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Tus datos son tuyos. SARA es solo el procesador</li>
              <li>Puedes exportar todos tus datos en cualquier momento</li>
              <li>Puedes solicitar la eliminacion completa de tu cuenta y datos</li>
              <li>No vendemos ni compartimos tus datos con terceros para marketing</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Disponibilidad y SLA</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nos esforzamos por mantener 99.9% de uptime</li>
              <li>Mantenimientos programados se notifican con 24h de anticipacion</li>
              <li>No garantizamos la disponibilidad de servicios de terceros (WhatsApp, Google, etc.)</li>
              <li>Planes Enterprise incluyen SLA personalizado</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">8. Limitacion de responsabilidad</h3>
            <p>SARA CRM se proporciona "como esta". No nos hacemos responsables por danos indirectos, perdida de ventas, o interrupciones del servicio causadas por terceros. Nuestra responsabilidad maxima se limita al monto pagado en los ultimos 12 meses.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">9. Modificaciones</h3>
            <p>Podemos actualizar estos terminos. Los cambios significativos se notifican por email con 30 dias de anticipacion. El uso continuado despues de los cambios constituye aceptacion.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">10. Contacto</h3>
            <p>Para preguntas sobre estos terminos: <strong>legal@sara-crm.com</strong></p>
          </section>
        </div>
      </div>

      <footer className="border-t py-8 px-4 mt-12">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} SARA CRM</p>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-gray-600">Inicio</Link>
            <Link to="/privacy" className="hover:text-gray-600">Privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
