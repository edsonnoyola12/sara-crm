import { useState, useEffect } from 'react'
import { Send, Star, MessageSquare, Calendar as CalendarIcon, Plus, Eye, Trash2, Edit, X, Save, Users, UserCheck, Award, Filter, ChevronRight, Lightbulb, MapPin, RefreshCw } from 'lucide-react'
import { Lead, Property, TeamMember, CRMEvent, EventRegistration, API_BASE, safeFetch } from '../types/crm'

// ── SegmentFilters type (local) ──
interface SegmentFilters {
  status: string[]
  temperature: string[]
  desarrollos: string[]
  needs_mortgage: boolean | null
  is_buyer: boolean | null
  source: string[]
  min_score: number | null
  max_score: number | null
}

// ── SegmentSelector sub-component ──
function SegmentSelector({
  filters,
  onChange,
  leads,
  properties
}: {
  filters: SegmentFilters,
  onChange: (f: SegmentFilters) => void,
  leads: Lead[],
  properties: Property[]
}) {
  const matchingLeads = leads.filter(lead => {
    if (filters.status.length > 0 && !filters.status.includes(lead.status)) return false
    if (filters.temperature.length > 0) {
      const temp = lead.score >= 70 ? 'hot' : lead.score >= 40 ? 'warm' : 'cold'
      if (!filters.temperature.includes(temp)) return false
    }
    if (filters.desarrollos.length > 0 && lead.property_interest) {
      const matchDesarrollo = filters.desarrollos.some(d =>
        lead.property_interest?.toLowerCase().includes(d.toLowerCase())
      )
      if (!matchDesarrollo) return false
    }
    if (filters.needs_mortgage === true && lead.credit_status !== 'active' && lead.credit_status !== 'approved') return false
    if (filters.needs_mortgage === false && (lead.credit_status === 'active' || lead.credit_status === 'approved')) return false
    if (filters.is_buyer === true && lead.status !== 'closed_won' && lead.status !== 'delivered') return false
    if (filters.is_buyer === false && (lead.status === 'closed_won' || lead.status === 'delivered')) return false
    if (filters.source.length > 0 && lead.source && !filters.source.includes(lead.source)) return false
    if (filters.min_score !== null && lead.score < filters.min_score) return false
    if (filters.max_score !== null && lead.score > filters.max_score) return false
    return true
  })

  const desarrollosUnicos = [...new Set(properties.map(p => p.name).filter(Boolean))]
  const sourcesUnicos = [...new Set(leads.map(l => l.source).filter(Boolean))]

  const toggleArrayValue = (arr: string[], value: string) => {
    return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
  }

  return (
    <div className="bg-slate-700/50 rounded-xl p-4 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-600 pb-2">
        <h4 className="font-semibold text-purple-400">Segmentación Avanzada</h4>
        <span className="bg-purple-600 px-3 py-1 rounded-full text-sm font-bold">
          {matchingLeads.length} leads
        </span>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">Estado del Lead</label>
        <div className="flex flex-wrap gap-2">
          {['new', 'contacted', 'qualified', 'appointment_scheduled', 'closed_won', 'fallen'].map(status => (
            <button
              key={status}
              onClick={() => onChange({...filters, status: toggleArrayValue(filters.status, status)})}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                filters.status.includes(status)
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
            >
              {status === 'new' ? 'Nuevos' :
               status === 'contacted' ? 'Contactados' :
               status === 'qualified' ? 'Calificados' :
               status === 'appointment_scheduled' ? 'Cita Agendada' :
               status === 'closed_won' ? 'Compradores' :
               status === 'fallen' ? 'Caídos' : status}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">Temperatura</label>
        <div className="flex gap-2">
          {[
            { value: 'hot', label: 'HOT', color: 'bg-red-600' },
            { value: 'warm', label: 'WARM', color: 'bg-yellow-600' },
            { value: 'cold', label: 'COLD', color: 'bg-blue-600' }
          ].map(temp => (
            <button
              key={temp.value}
              onClick={() => onChange({...filters, temperature: toggleArrayValue(filters.temperature, temp.value)})}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filters.temperature.includes(temp.value)
                  ? temp.color + ' text-white'
                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
            >
              {temp.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">Desarrollo de Interés</label>
        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
          {desarrollosUnicos.slice(0, 10).map(desarrollo => (
            <button
              key={desarrollo}
              onClick={() => onChange({...filters, desarrollos: toggleArrayValue(filters.desarrollos, desarrollo)})}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                filters.desarrollos.includes(desarrollo)
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
            >
              {desarrollo}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Crédito Hipotecario</label>
          <div className="flex gap-2">
            <button
              onClick={() => onChange({...filters, needs_mortgage: filters.needs_mortgage === true ? null : true})}
              className={`px-3 py-2 rounded-lg text-sm flex-1 ${
                filters.needs_mortgage === true ? 'bg-orange-600' : 'bg-slate-600 hover:bg-slate-500'
              }`}
            >
              Con Hipoteca
            </button>
            <button
              onClick={() => onChange({...filters, needs_mortgage: filters.needs_mortgage === false ? null : false})}
              className={`px-3 py-2 rounded-lg text-sm flex-1 ${
                filters.needs_mortgage === false ? 'bg-slate-500' : 'bg-slate-600 hover:bg-slate-500'
              }`}
            >
              Sin Hipoteca
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-2">Tipo</label>
          <div className="flex gap-2">
            <button
              onClick={() => onChange({...filters, is_buyer: filters.is_buyer === true ? null : true})}
              className={`px-3 py-2 rounded-lg text-sm flex-1 ${
                filters.is_buyer === true ? 'bg-green-600' : 'bg-slate-600 hover:bg-slate-500'
              }`}
            >
              Compradores
            </button>
            <button
              onClick={() => onChange({...filters, is_buyer: filters.is_buyer === false ? null : false})}
              className={`px-3 py-2 rounded-lg text-sm flex-1 ${
                filters.is_buyer === false ? 'bg-blue-600' : 'bg-slate-600 hover:bg-slate-500'
              }`}
            >
              Prospectos
            </button>
          </div>
        </div>
      </div>

      {sourcesUnicos.length > 0 && (
        <div>
          <label className="block text-sm text-slate-400 mb-2">Origen</label>
          <div className="flex flex-wrap gap-2">
            {sourcesUnicos.slice(0, 6).map(source => (
              <button
                key={source}
                onClick={() => onChange({...filters, source: toggleArrayValue(filters.source, source!)})}
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  filters.source.includes(source!)
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                }`}
              >
                {source}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => onChange({
          status: [], temperature: [], desarrollos: [],
          needs_mortgage: null, is_buyer: null, source: [],
          min_score: null, max_score: null
        })}
        className="w-full py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm text-slate-300"
      >
        Limpiar Filtros (Enviar a Todos)
      </button>
    </div>
  )
}

// ── Main Component ──
export default function EncuestasEventosView({ leads, crmEvents, eventRegistrations, properties, teamMembers, onSendSurvey, showToast }: {
  leads: Lead[],
  crmEvents: CRMEvent[],
  eventRegistrations: EventRegistration[],
  properties: Property[],
  teamMembers: TeamMember[],
  onSendSurvey: (config: any) => void,
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
}) {
  const [activeTab, setActiveTab] = useState<'encuestas' | 'resultados' | 'plantillas' | 'eventos'>('encuestas')
  const [showNewSurvey, setShowNewSurvey] = useState(false)
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [surveyMessage, setSurveyMessage] = useState('')
  const [showAdvancedSegment, setShowAdvancedSegment] = useState(false)
  const [segmentFilters, setSegmentFilters] = useState<SegmentFilters>({
    status: [],
    temperature: [],
    desarrollos: [],
    needs_mortgage: null,
    is_buyer: null,
    source: [],
    min_score: null,
    max_score: null
  })
  const [sendingSurvey, setSendingSurvey] = useState(false)

  // Nuevo: Tipo de destinatario y selección manual
  const [targetType, setTargetType] = useState<'leads' | 'vendedores' | 'manual'>('leads')
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Estado para resultados de encuestas
  const [surveyResults, setSurveyResults] = useState<any[]>([])
  const [surveyMetrics, setSurveyMetrics] = useState<any>(null)
  const [loadingSurveys, setLoadingSurveys] = useState(false)
  const [surveyFilter, setSurveyFilter] = useState<'all' | 'sent' | 'answered' | 'awaiting_feedback'>('all')

  // Cargar resultados de encuestas al montar + al cambiar tab/filtro
  useEffect(() => {
    fetchSurveyResults()
  }, [surveyFilter])

  useEffect(() => {
    if (activeTab === 'resultados') {
      fetchSurveyResults()
    }
  }, [activeTab])

  const fetchSurveyResults = async () => {
    setLoadingSurveys(true)
    try {
      const data = await safeFetch(`${API_BASE}/api/surveys?status=${surveyFilter}`)
      setSurveyResults(data.surveys || [])
      setSurveyMetrics(data.metrics || null)
    } catch (error) {
      console.error('Error fetching surveys:', error)
    } finally {
      setLoadingSurveys(false)
    }
  }

  // Estado para nueva plantilla
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'nps' as 'nps' | 'satisfaction' | 'post_cita' | 'rescate' | 'custom',
    greeting: '',
    questions: [{ text: '', type: 'rating' as 'rating' | 'text' | 'yesno' }],
    closing: ''
  })

  // Plantillas pre-hechas
  const prebuiltTemplates = [
    {
      id: 'nps',
      name: 'NPS - Net Promoter Score',
      type: 'nps',
      icon: '📊',
      color: 'blue',
      greeting: 'Hola {nombre}, nos encantaría conocer tu opinión.',
      questions: [
        { text: 'Del 0 al 10, ¿qué tan probable es que nos recomiendes con un amigo o familiar?', type: 'rating' },
        { text: '¿Qué podríamos mejorar?', type: 'text' }
      ],
      closing: '¡Gracias por tu tiempo! Tu opinión nos ayuda a mejorar.'
    },
    {
      id: 'post_cita',
      name: 'Post-Cita',
      type: 'post_cita',
      icon: '🏠',
      color: 'green',
      greeting: 'Hola {nombre}, gracias por visitarnos.',
      questions: [
        { text: '¿Cómo calificarías la atención de nuestro asesor? (1-5)', type: 'rating' },
        { text: '¿La propiedad cumplió tus expectativas?', type: 'yesno' },
        { text: '¿Tienes algún comentario adicional?', type: 'text' }
      ],
      closing: '¡Gracias! Estamos para servirte.'
    },
    {
      id: 'satisfaction',
      name: 'Satisfacción General',
      type: 'satisfaction',
      icon: '⭐',
      color: 'yellow',
      greeting: 'Hola {nombre}, queremos saber cómo fue tu experiencia.',
      questions: [
        { text: 'Del 1 al 5, ¿qué tan satisfecho estás con nuestro servicio?', type: 'rating' },
        { text: '¿Qué fue lo que más te gustó?', type: 'text' },
        { text: '¿En qué podemos mejorar?', type: 'text' }
      ],
      closing: '¡Tu opinión es muy valiosa para nosotros!'
    },
    {
      id: 'rescate',
      name: 'Rescate de Lead',
      type: 'rescate',
      icon: '🔄',
      color: 'purple',
      greeting: 'Hola {nombre}, hace tiempo no sabemos de ti.',
      questions: [
        { text: '¿Sigues interesado en adquirir una propiedad?', type: 'yesno' },
        { text: '¿Qué te ha detenido?', type: 'text' },
        { text: '¿Te gustaría que te contactemos?', type: 'yesno' }
      ],
      closing: 'Estamos aquí cuando nos necesites. ¡Gracias!'
    },
    {
      id: 'post_cierre',
      name: 'Post-Cierre / Comprador',
      type: 'post_cierre',
      icon: '🎉',
      color: 'emerald',
      greeting: '¡Felicidades {nombre} por tu nueva casa!',
      questions: [
        { text: 'Del 1 al 10, ¿cómo calificarías todo el proceso de compra?', type: 'rating' },
        { text: '¿Nos recomendarías con familiares o amigos?', type: 'yesno' },
        { text: '¿Algún comentario sobre tu experiencia?', type: 'text' }
      ],
      closing: '¡Gracias por confiar en nosotros! Bienvenido a tu nuevo hogar.'
    }
  ]

  const [customTemplates, setCustomTemplates] = useState<any[]>([])

  // Calcular estadísticas de encuestas desde la API de surveys
  const totalEncuestas = surveyMetrics?.total || 0
  const encuestasRespondidas = surveyMetrics?.answered || 0
  const npsPromedio = surveyMetrics?.avg_nps || 0
  const tasaRespuesta = totalEncuestas > 0 ? Math.round((encuestasRespondidas / totalEncuestas) * 100) : 0
  const conFeedbackSurveys = surveyResults.filter((s: any) => s.feedback)

  // Distribución NPS (0-10) agrupada
  const npsDistribution = [
    { label: 'Detractores (0-6)', count: surveyMetrics?.detractors || 0, color: 'bg-red-500', emoji: '😞' },
    { label: 'Pasivos (7-8)', count: surveyMetrics?.passives || 0, color: 'bg-yellow-500', emoji: '😐' },
    { label: 'Promotores (9-10)', count: surveyMetrics?.promoters || 0, color: 'bg-green-500', emoji: '🤩' },
  ]

  // Estadísticas de eventos
  const eventosActivos = crmEvents.filter(e => new Date(e.event_date) >= new Date())
  const eventosPasados = crmEvents.filter(e => new Date(e.event_date) < new Date())

  // Filtrar leads para encuestas según segmentación
  const filteredLeadsForSurvey = leads.filter(lead => {
    if (segmentFilters.status.length > 0 && !segmentFilters.status.includes(lead.status)) return false
    if (segmentFilters.temperature.length > 0 && !segmentFilters.temperature.includes(lead.temperature || '')) return false
    if (segmentFilters.desarrollos.length > 0) {
      const leadDesarrollo = lead.property_interest || ''
      if (!segmentFilters.desarrollos.some(d => leadDesarrollo.toLowerCase().includes(d.toLowerCase()))) return false
    }
    if (segmentFilters.needs_mortgage !== null && lead.needs_mortgage !== segmentFilters.needs_mortgage) return false
    if (segmentFilters.is_buyer !== null) {
      const isBuyer = lead.status === 'closed'
      if (isBuyer !== segmentFilters.is_buyer) return false
    }
    if (segmentFilters.source.length > 0 && !segmentFilters.source.includes(lead.source || '')) return false
    if (segmentFilters.min_score !== null && (lead.score || 0) < segmentFilters.min_score) return false
    if (segmentFilters.max_score !== null && (lead.score || 0) > segmentFilters.max_score) return false
    return true
  })

  const handleSendSurvey = async () => {
    if (!selectedTemplate) {
      showToast('Selecciona una plantilla primero', 'error')
      return
    }

    // Determinar destinatarios según el tipo seleccionado
    let destinatarios: { id: string; phone: string; name: string }[] = []

    if (targetType === 'vendedores') {
      const vendedoresSeleccionados = selectedVendorIds.length > 0
        ? teamMembers.filter(v => selectedVendorIds.includes(v.id))
        : teamMembers.filter(v => v.active && v.phone)
      destinatarios = vendedoresSeleccionados.map(v => ({ id: v.id, phone: v.phone || '', name: v.name }))
    } else if (targetType === 'manual') {
      const leadsSeleccionados = leads.filter(l => selectedLeadIds.includes(l.id))
      destinatarios = leadsSeleccionados.map(l => ({ id: l.id, phone: l.phone, name: l.name }))
    } else {
      const leadsToSend = showAdvancedSegment ? filteredLeadsForSurvey : leads
      destinatarios = leadsToSend.map(l => ({ id: l.id, phone: l.phone, name: l.name }))
    }

    if (destinatarios.length === 0) {
      showToast('No hay destinatarios seleccionados', 'error')
      return
    }

    setSendingSurvey(true)
    try {
      await onSendSurvey({
        template: selectedTemplate,
        message: surveyMessage,
        filters: showAdvancedSegment ? segmentFilters : null,
        leads: destinatarios,
        targetType
      })
      setShowNewSurvey(false)
      setSelectedTemplate(null)
      setSurveyMessage('')
      setSelectedLeadIds([])
      setSelectedVendorIds([])
      setTargetType('leads')
      setSearchTerm('')
      setSegmentFilters({
        status: [],
        temperature: [],
        desarrollos: [],
        needs_mortgage: null,
        is_buyer: null,
        source: [],
        min_score: null,
        max_score: null
      })
    } catch (error) {
      console.error('Error enviando encuesta:', error)
      showToast('Error al enviar encuestas', 'error')
    } finally {
      setSendingSurvey(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
          Encuestas & Eventos
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('encuestas')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'encuestas' ? 'bg-yellow-500 text-black' : 'bg-slate-700'}`}
          >
            <Send size={18} /> Enviar
          </button>
          <button
            onClick={() => setActiveTab('resultados')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'resultados' ? 'bg-blue-500 text-white' : 'bg-slate-700'}`}
          >
            <Star size={18} /> Resultados
          </button>
          <button
            onClick={() => setActiveTab('plantillas')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'plantillas' ? 'bg-purple-500 text-black' : 'bg-slate-700'}`}
          >
            <MessageSquare size={18} /> Plantillas
          </button>
          <button
            onClick={() => setActiveTab('eventos')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${activeTab === 'eventos' ? 'bg-emerald-500 text-black' : 'bg-slate-700'}`}
          >
            <CalendarIcon size={18} /> Eventos
          </button>
        </div>
      </div>

      {/* TAB ENCUESTAS */}
      {activeTab === 'encuestas' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowNewSurvey(true)}
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <Send size={18} /> Enviar Encuesta
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-yellow-900/50 to-amber-900/50 border border-yellow-500/30 p-5 rounded-xl">
              <div className="text-yellow-400 text-sm mb-1">NPS Promedio</div>
              <div className="text-4xl font-bold text-yellow-300">{npsPromedio} <span className="text-2xl">/ 10</span></div>
              <div className="text-yellow-400/60 text-xs mt-1">{encuestasRespondidas} respuestas</div>
            </div>
            <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border border-green-500/30 p-5 rounded-xl">
              <div className="text-green-400 text-sm mb-1">Encuestas Enviadas</div>
              <div className="text-4xl font-bold text-green-300">{totalEncuestas}</div>
              <div className="text-green-400/60 text-xs mt-1">{encuestasRespondidas} respondidas</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border border-blue-500/30 p-5 rounded-xl">
              <div className="text-blue-400 text-sm mb-1">Con Feedback</div>
              <div className="text-4xl font-bold text-blue-300">{conFeedbackSurveys.length}</div>
              <div className="text-blue-400/60 text-xs mt-1">comentarios recibidos</div>
            </div>
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-500/30 p-5 rounded-xl">
              <div className="text-purple-400 text-sm mb-1">Tasa de Respuesta</div>
              <div className="text-4xl font-bold text-purple-300">{tasaRespuesta}%</div>
              <div className="text-purple-400/60 text-xs mt-1">de encuestas enviadas</div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4">Distribución NPS</h3>
            <div className="flex gap-4 items-end h-40">
              {npsDistribution.map(r => (
                <div key={r.label} className="flex-1 flex flex-col items-center">
                  <div className="text-2xl mb-2">{r.emoji}</div>
                  <div
                    className={`w-full rounded-t-lg ${r.color}`}
                    style={{ height: `${Math.max((r.count / Math.max(...npsDistribution.map(x => x.count), 1)) * 100, 10)}%` }}
                  />
                  <div className="text-lg font-bold mt-2">{r.count}</div>
                  <div className="text-slate-400 text-sm text-center">{r.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4">Comentarios Recientes</h3>
            {loadingSurveys ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-slate-400">Cargando...</p>
              </div>
            ) : conFeedbackSurveys.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
                <p>No hay comentarios todavía</p>
                <p className="text-sm">Los comentarios aparecerán cuando los clientes completen encuestas</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {conFeedbackSurveys.slice(0, 20).map((survey: any) => (
                  <div key={survey.id} className="bg-slate-700/50 p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{survey.lead_name || survey.phone || 'Cliente'}</div>
                      <div className="flex items-center gap-2">
                        {survey.nps_score !== null && (
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            survey.nps_score >= 9 ? 'bg-green-500/20 text-green-400' :
                            survey.nps_score >= 7 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            NPS: {survey.nps_score}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          survey.nps_category === 'promotor' ? 'bg-green-500/20 text-green-400' :
                          survey.nps_category === 'pasivo' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {survey.nps_category || survey.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm italic">"{survey.feedback}"</p>
                    <div className="text-slate-400 text-xs mt-2">
                      {survey.template_type && <span className="mr-2">{survey.template_type}</span>}
                      {new Date(survey.answered_at || survey.sent_at || '').toLocaleDateString('es-MX')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB RESULTADOS */}
      {activeTab === 'resultados' && (
        <div className="space-y-6">
          {surveyMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="text-3xl font-bold text-blue-400">{surveyMetrics.total}</div>
                <div className="text-slate-400 text-sm">Total Encuestas</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="text-3xl font-bold text-green-400">{surveyMetrics.answered}</div>
                <div className="text-slate-400 text-sm">Respondidas</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="text-3xl font-bold text-yellow-400">{surveyMetrics.avg_nps || '-'}</div>
                <div className="text-slate-400 text-sm">NPS Promedio</div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">{surveyMetrics.promoters}</span>
                  <span className="text-slate-400">/</span>
                  <span className="text-yellow-400">{surveyMetrics.passives}</span>
                  <span className="text-slate-400">/</span>
                  <span className="text-red-400">{surveyMetrics.detractors}</span>
                </div>
                <div className="text-slate-400 text-sm">Promotores / Pasivos / Detractores</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <span className="text-slate-400">Filtrar:</span>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'Todas' },
                { value: 'sent', label: 'Enviadas' },
                { value: 'awaiting_feedback', label: 'Esperando' },
                { value: 'answered', label: 'Respondidas' }
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setSurveyFilter(f.value as any)}
                  className={`px-3 py-1 rounded-lg text-sm ${surveyFilter === f.value ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              onClick={fetchSurveyResults}
              className="ml-auto px-3 py-1 bg-slate-700 rounded-lg text-sm flex items-center gap-1"
            >
              <RefreshCw size={14} className={loadingSurveys ? 'animate-spin' : ''} /> Actualizar
            </button>
          </div>

          {loadingSurveys ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-slate-400">Cargando encuestas...</p>
            </div>
          ) : surveyResults.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700/50 mb-4">
                <Star size={32} className="text-yellow-500" />
              </div>
              <p className="text-slate-300 text-lg font-medium">Sin encuestas registradas</p>
              <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">Envia una encuesta NPS desde la pestana "Enviar" para conocer la satisfaccion de tus clientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {surveyResults.map((survey) => (
                <div key={survey.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-white">{survey.lead_name || 'Sin nombre'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          survey.status === 'answered' ? 'bg-green-500/20 text-green-400' :
                          survey.status === 'awaiting_feedback' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {survey.status === 'answered' ? 'Respondida' :
                           survey.status === 'awaiting_feedback' ? 'Esperando comentario' :
                           'Enviada'}
                        </span>
                        <span className="text-slate-400 text-xs">
                          {survey.survey_type?.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-slate-400 text-sm mt-1">
                        {survey.lead_phone}
                      </div>
                      {survey.nps_score !== null && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-slate-400 text-sm">NPS:</span>
                          <span className={`text-lg font-bold ${
                            survey.nps_score >= 9 ? 'text-green-400' :
                            survey.nps_score >= 7 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {survey.nps_score}
                          </span>
                          <span className={`text-xs ${
                            survey.nps_score >= 9 ? 'text-green-400' :
                            survey.nps_score >= 7 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {survey.nps_score >= 9 ? 'Promotor' :
                             survey.nps_score >= 7 ? 'Pasivo' :
                             'Detractor'}
                          </span>
                        </div>
                      )}
                      {survey.feedback && (
                        <div className="mt-2 p-2 bg-slate-700/50 rounded-lg">
                          <span className="text-slate-400 text-xs">Comentario:</span>
                          <p className="text-white text-sm">{survey.feedback}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <div>Enviada: {new Date(survey.sent_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      {survey.answered_at && (
                        <div>Respondida: {new Date(survey.answered_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB PLANTILLAS */}
      {activeTab === 'plantillas' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-slate-400">Selecciona una plantilla para enviar o crea una nueva</p>
            <button
              onClick={() => setShowCreateTemplate(true)}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <Plus size={18} /> Crear Plantilla
            </button>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Lightbulb size={20} className="text-yellow-400" /> Plantillas Prediseñadas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prebuiltTemplates.map(template => (
                <div
                  key={template.id}
                  className={`bg-slate-800/80 border-2 border-${template.color}-500/30 rounded-xl p-5 hover:border-${template.color}-500/60 transition-all cursor-pointer group`}
                  onClick={() => {
                    setSelectedTemplate(template)
                    setShowNewSurvey(true)
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{template.icon}</div>
                    <span className={`text-xs px-2 py-1 rounded bg-${template.color}-500/20 text-${template.color}-300`}>
                      {template.type}
                    </span>
                  </div>
                  <h4 className="font-bold text-lg mb-2">{template.name}</h4>
                  <p className="text-slate-400 text-sm mb-3 line-clamp-2">{template.greeting}</p>
                  <div className="text-xs text-slate-400 mb-3">
                    {template.questions.length} pregunta{template.questions.length > 1 ? 's' : ''}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTemplate(template)
                        setShowNewSurvey(true)
                      }}
                      className={`flex-1 bg-${template.color}-600 hover:bg-${template.color}-700 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1`}
                    >
                      <Send size={14} /> Enviar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        showToast(`Vista previa: ${template.greeting} | ${template.questions.map((q, i) => `${i+1}. ${q.text}`).join(' | ')} | ${template.closing}`, 'info')
                      }}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {customTemplates.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Edit size={20} className="text-purple-400" /> Mis Plantillas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customTemplates.map((template, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-800/80 border-2 border-purple-500/30 rounded-xl p-5 hover:border-purple-500/60 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">📝</div>
                      <button
                        onClick={() => {
                          setCustomTemplates(prev => prev.filter((_, i) => i !== idx))
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <h4 className="font-bold text-lg mb-2">{template.name}</h4>
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">{template.greeting}</p>
                    <div className="text-xs text-slate-400 mb-3">
                      {template.questions.length} pregunta{template.questions.length > 1 ? 's' : ''}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTemplate(template)
                        setShowNewSurvey(true)
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <Send size={14} /> Enviar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🤖</div>
              <div>
                <h4 className="font-bold text-lg mb-1">Tip: Usa IA para personalizar</h4>
                <p className="text-slate-400 text-sm">
                  Las encuestas se envían por WhatsApp y SARA puede adaptar las preguntas según el contexto de cada lead.
                  Por ejemplo, si el lead visitó una propiedad específica, mencionará ese desarrollo en el mensaje.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB EVENTOS */}
      {activeTab === 'eventos' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-900/50 to-green-900/50 border border-emerald-500/30 p-5 rounded-xl">
              <div className="text-emerald-400 text-sm mb-1">Eventos Activos</div>
              <div className="text-4xl font-bold text-emerald-300">{eventosActivos.length}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border border-blue-500/30 p-5 rounded-xl">
              <div className="text-blue-400 text-sm mb-1">Total Registrados</div>
              <div className="text-4xl font-bold text-blue-300">{eventRegistrations.length}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-500/30 p-5 rounded-xl">
              <div className="text-purple-400 text-sm mb-1">Eventos Pasados</div>
              <div className="text-4xl font-bold text-purple-300">{eventosPasados.length}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 border border-orange-500/30 p-5 rounded-xl">
              <div className="text-orange-400 text-sm mb-1">Tasa Asistencia</div>
              <div className="text-4xl font-bold text-orange-300">
                {eventRegistrations.length > 0
                  ? Math.round((eventRegistrations.filter(r => r.attended).length / eventRegistrations.length) * 100)
                  : 0}%
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4">Eventos y Registros</h3>
            {crmEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700/50 mb-4">
                  <CalendarIcon size={32} className="text-blue-400" />
                </div>
                <p className="text-slate-300 text-lg font-medium">Sin eventos creados</p>
                <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">Crea un evento desde la seccion Eventos para ver registros y asistencia aqui</p>
              </div>
            ) : (
              <div className="space-y-4">
                {crmEvents.map(evento => {
                  const registrados = eventRegistrations.filter(r => r.event_id === evento.id)
                  const asistieron = registrados.filter(r => r.attended).length
                  const isPast = new Date(evento.event_date) < new Date()

                  return (
                    <div key={evento.id} className={`bg-slate-700/50 p-4 rounded-xl border-l-4 ${isPast ? 'border-slate-500' : 'border-emerald-500'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-lg flex items-center gap-2">
                            {evento.name}
                            {isPast && <span className="text-xs bg-slate-600 px-2 py-0.5 rounded">Pasado</span>}
                          </div>
                          <div className="text-slate-400 text-sm">
                            {new Date(evento.event_date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                            {evento.event_time && ` - ${evento.event_time}`}
                          </div>
                          {evento.location && <div className="text-slate-400 text-sm flex items-center gap-1"><MapPin size={12} /> {evento.location}</div>}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-emerald-400">{registrados.length}</div>
                          <div className="text-slate-400 text-sm">
                            {evento.max_capacity ? `/ ${evento.max_capacity}` : ''} registrados
                          </div>
                          {isPast && (
                            <div className="text-xs text-slate-400 mt-1">
                              {asistieron} asistieron ({registrados.length > 0 ? Math.round((asistieron / registrados.length) * 100) : 0}%)
                            </div>
                          )}
                        </div>
                      </div>

                      {registrados.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-600">
                          <div className="text-sm text-slate-400 mb-2">Registrados:</div>
                          <div className="flex flex-wrap gap-2">
                            {registrados.slice(0, 10).map(reg => (
                              <span key={reg.id} className={`px-2 py-1 rounded text-xs ${reg.attended ? 'bg-green-500/20 text-green-300' : 'bg-slate-600 text-slate-300'}`}>
                                {reg.lead_name || 'Lead'} {reg.attended && '✓'}
                              </span>
                            ))}
                            {registrados.length > 10 && (
                              <span className="px-2 py-1 bg-slate-600 rounded text-xs">+{registrados.length - 10} más</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL ENVIAR ENCUESTA */}
      {showNewSurvey && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800 z-10">
              <h3 className="text-2xl font-bold text-yellow-400">
                {selectedTemplate ? `Enviar: ${selectedTemplate.name}` : 'Enviar Encuesta'}
              </h3>
              <button onClick={() => { setShowNewSurvey(false); setSelectedTemplate(null) }} className="text-slate-400 hover:text-white" aria-label="Cerrar">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selectedTemplate && (
                <div className="bg-slate-900/50 rounded-xl p-4 border border-yellow-500/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">{selectedTemplate.icon || '📝'}</div>
                    <div>
                      <div className="font-bold">{selectedTemplate.name}</div>
                      <div className="text-sm text-slate-400">{selectedTemplate.questions?.length || 0} preguntas</div>
                    </div>
                  </div>
                  <div className="bg-green-900/30 rounded-lg p-3 text-sm">
                    <p className="mb-2 text-green-300">{selectedTemplate.greeting}</p>
                    {selectedTemplate.questions?.map((q: any, i: number) => (
                      <p key={i} className="text-slate-300 mb-1">{i + 1}. {q.text}</p>
                    ))}
                    <p className="mt-2 text-slate-400 italic">{selectedTemplate.closing}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="mt-3 text-sm text-slate-400 hover:text-white"
                  >
                    Cambiar plantilla
                  </button>
                </div>
              )}

              {!selectedTemplate && (
                <div>
                  <label className="block text-sm font-medium mb-2">Selecciona una Plantilla</label>
                  <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                    {[...prebuiltTemplates, ...customTemplates].map(template => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className="p-3 rounded-xl border-2 border-slate-600 hover:border-yellow-500 text-left transition-all"
                      >
                        <div className="text-2xl mb-1">{template.icon || '📝'}</div>
                        <div className="font-bold text-sm">{template.name}</div>
                        <div className="text-xs text-slate-400">{template.questions?.length || 0} preguntas</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Enviar a</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => { setTargetType('leads'); setSelectedLeadIds([]); setSelectedVendorIds([]) }}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      targetType === 'leads' ? 'border-yellow-500 bg-yellow-500/20' : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <Users size={20} className="mx-auto mb-1" />
                    <div className="text-sm font-medium">Leads</div>
                    <div className="text-xs text-slate-400">Con filtros</div>
                  </button>
                  <button
                    onClick={() => { setTargetType('manual'); setSelectedVendorIds([]) }}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      targetType === 'manual' ? 'border-blue-500 bg-blue-500/20' : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <UserCheck size={20} className="mx-auto mb-1" />
                    <div className="text-sm font-medium">Específicos</div>
                    <div className="text-xs text-slate-400">Seleccionar</div>
                  </button>
                  <button
                    onClick={() => { setTargetType('vendedores'); setSelectedLeadIds([]) }}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      targetType === 'vendedores' ? 'border-purple-500 bg-purple-500/20' : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <Award size={20} className="mx-auto mb-1" />
                    <div className="text-sm font-medium">Vendedores</div>
                    <div className="text-xs text-slate-400">Interna</div>
                  </button>
                </div>
              </div>

              {targetType === 'manual' && (
                <div className="border border-blue-500/30 rounded-xl p-4">
                  <label className="block text-sm font-medium mb-2">Buscar y seleccionar leads</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nombre o teléfono..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 mb-3"
                  />
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {leads
                      .filter(l =>
                        l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        l.phone?.includes(searchTerm)
                      )
                      .slice(0, 20)
                      .map(lead => (
                        <label key={lead.id} className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedLeadIds.includes(lead.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLeadIds(prev => [...prev, lead.id])
                              } else {
                                setSelectedLeadIds(prev => prev.filter(id => id !== lead.id))
                              }
                            }}
                            className="rounded"
                          />
                          <span className="flex-1">{lead.name}</span>
                          <span className="text-xs text-slate-400">{lead.phone?.slice(-4)}</span>
                        </label>
                      ))}
                  </div>
                  {selectedLeadIds.length > 0 && (
                    <div className="mt-2 text-sm text-blue-400">
                      {selectedLeadIds.length} lead{selectedLeadIds.length > 1 ? 's' : ''} seleccionado{selectedLeadIds.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}

              {targetType === 'vendedores' && (
                <div className="border border-purple-500/30 rounded-xl p-4">
                  <label className="block text-sm font-medium mb-2">Seleccionar vendedores</label>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setSelectedVendorIds(teamMembers.filter(v => v.active && v.phone).map(v => v.id))}
                      className="text-xs bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded"
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setSelectedVendorIds([])}
                      className="text-xs bg-slate-600 hover:bg-slate-500 px-2 py-1 rounded"
                    >
                      Ninguno
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {teamMembers.filter(v => v.active && v.phone).map(vendor => (
                      <label key={vendor.id} className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedVendorIds.includes(vendor.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVendorIds(prev => [...prev, vendor.id])
                            } else {
                              setSelectedVendorIds(prev => prev.filter(id => id !== vendor.id))
                            }
                          }}
                          className="rounded"
                        />
                        <span className="flex-1">{vendor.name}</span>
                        <span className="text-xs text-slate-400">{vendor.role}</span>
                      </label>
                    ))}
                  </div>
                  {selectedVendorIds.length > 0 && (
                    <div className="mt-2 text-sm text-purple-400">
                      {selectedVendorIds.length} vendedor{selectedVendorIds.length > 1 ? 'es' : ''} seleccionado{selectedVendorIds.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Mensaje Adicional (opcional)</label>
                <textarea
                  value={surveyMessage}
                  onChange={(e) => setSurveyMessage(e.target.value)}
                  placeholder="Agrega un contexto adicional si lo deseas..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 h-20 resize-none"
                />
              </div>

              {targetType === 'leads' && (
                <div className="border border-slate-600 rounded-xl p-4">
                  <button
                    onClick={() => setShowAdvancedSegment(!showAdvancedSegment)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Filter size={20} className="text-yellow-400" />
                      <div>
                        <div className="font-medium">Segmentación Avanzada</div>
                        <div className="text-sm text-slate-400">Filtrar a quién enviar la encuesta</div>
                      </div>
                    </div>
                    <ChevronRight size={20} className={`transition-transform ${showAdvancedSegment ? 'rotate-90' : ''}`} />
                  </button>

                  {showAdvancedSegment && (
                    <div className="mt-4 pt-4 border-t border-slate-600">
                      <SegmentSelector
                        filters={segmentFilters}
                        onChange={setSegmentFilters}
                        leads={leads}
                        properties={properties}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-slate-400">Destinatarios</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {targetType === 'vendedores'
                      ? (selectedVendorIds.length > 0 ? selectedVendorIds.length : teamMembers.filter(v => v.active && v.phone).length)
                      : targetType === 'manual'
                        ? selectedLeadIds.length
                        : (showAdvancedSegment ? filteredLeadsForSurvey.length : leads.length)
                    } {targetType === 'vendedores' ? 'vendedor(es)' : 'lead(s)'}
                  </div>
                </div>
                {targetType === 'leads' && showAdvancedSegment && filteredLeadsForSurvey.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {filteredLeadsForSurvey.slice(0, 15).map(l => (
                      <span key={l.id} className="bg-slate-600 px-2 py-0.5 rounded text-xs">
                        {l.name}
                      </span>
                    ))}
                    {filteredLeadsForSurvey.length > 15 && (
                      <span className="bg-slate-600 px-2 py-0.5 rounded text-xs">
                        +{filteredLeadsForSurvey.length - 15} más
                      </span>
                    )}
                  </div>
                )}
                {targetType === 'manual' && selectedLeadIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {leads.filter(l => selectedLeadIds.includes(l.id)).map(l => (
                      <span key={l.id} className="bg-blue-600/50 px-2 py-0.5 rounded text-xs">
                        {l.name}
                      </span>
                    ))}
                  </div>
                )}
                {targetType === 'vendedores' && (
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {(selectedVendorIds.length > 0
                      ? teamMembers.filter(v => selectedVendorIds.includes(v.id))
                      : teamMembers.filter(v => v.active && v.phone)
                    ).map(v => (
                      <span key={v.id} className="bg-purple-600/50 px-2 py-0.5 rounded text-xs">
                        {v.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-slate-800">
              <button
                onClick={() => { setShowNewSurvey(false); setSelectedTemplate(null); setTargetType('leads'); setSelectedLeadIds([]); setSelectedVendorIds([]) }}
                className="px-6 py-2 bg-slate-600 rounded-lg hover:bg-slate-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendSurvey}
                disabled={sendingSurvey || !selectedTemplate || (
                  targetType === 'manual' && selectedLeadIds.length === 0
                ) || (
                  targetType === 'leads' && showAdvancedSegment && filteredLeadsForSurvey.length === 0
                )}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingSurvey ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Enviar Encuesta ({showAdvancedSegment ? filteredLeadsForSurvey.length : leads.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR PLANTILLA */}
      {showCreateTemplate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800 z-10">
              <h3 className="text-2xl font-bold text-purple-400">Crear Nueva Plantilla</h3>
              <button onClick={() => setShowCreateTemplate(false)} className="text-slate-400 hover:text-white" aria-label="Cerrar">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre de la Plantilla</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Encuesta de seguimiento mensual"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Saludo Inicial</label>
                <textarea
                  value={newTemplate.greeting}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, greeting: e.target.value }))}
                  placeholder="Hola {nombre}, ..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 h-20 resize-none"
                />
                <p className="text-xs text-slate-400 mt-1">Usa {'{nombre}'} para personalizar con el nombre del lead</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Preguntas</label>
                <div className="space-y-3">
                  {newTemplate.questions.map((q, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={q.text}
                        onChange={(e) => {
                          const newQuestions = [...newTemplate.questions]
                          newQuestions[idx].text = e.target.value
                          setNewTemplate(prev => ({ ...prev, questions: newQuestions }))
                        }}
                        placeholder={`Pregunta ${idx + 1}`}
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-lg p-2"
                      />
                      <select
                        value={q.type}
                        onChange={(e) => {
                          const newQuestions = [...newTemplate.questions]
                          newQuestions[idx].type = e.target.value as any
                          setNewTemplate(prev => ({ ...prev, questions: newQuestions }))
                        }}
                        className="bg-slate-700 border border-slate-600 rounded-lg px-2"
                      >
                        <option value="rating">Rating (1-5)</option>
                        <option value="text">Texto libre</option>
                        <option value="yesno">Si/No</option>
                      </select>
                      {newTemplate.questions.length > 1 && (
                        <button
                          onClick={() => {
                            setNewTemplate(prev => ({
                              ...prev,
                              questions: prev.questions.filter((_, i) => i !== idx)
                            }))
                          }}
                          className="text-red-400 hover:text-red-300 px-2"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setNewTemplate(prev => ({
                    ...prev,
                    questions: [...prev.questions, { text: '', type: 'text' }]
                  }))}
                  className="mt-3 text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                >
                  <Plus size={16} /> Agregar pregunta
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mensaje de Cierre</label>
                <textarea
                  value={newTemplate.closing}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, closing: e.target.value }))}
                  placeholder="Gracias por tu tiempo..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 h-20 resize-none"
                />
              </div>

              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-600">
                <div className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                  <Eye size={14} /> Vista Previa (WhatsApp)
                </div>
                <div className="bg-green-900/30 rounded-lg p-3 text-sm">
                  <p className="mb-2">{newTemplate.greeting || 'Hola {nombre}...'}</p>
                  {newTemplate.questions.filter(q => q.text).map((q, i) => (
                    <p key={i} className="mb-1">{i + 1}. {q.text}</p>
                  ))}
                  {newTemplate.closing && <p className="mt-2 text-slate-400">{newTemplate.closing}</p>}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex justify-end gap-3 sticky bottom-0 bg-slate-800">
              <button
                onClick={() => setShowCreateTemplate(false)}
                className="px-6 py-2 bg-slate-600 rounded-lg hover:bg-slate-500"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!newTemplate.name || !newTemplate.greeting || newTemplate.questions.every(q => !q.text)) {
                    showToast('Completa al menos el nombre, saludo y una pregunta', 'error')
                    return
                  }
                  setCustomTemplates(prev => [...prev, { ...newTemplate, id: Date.now().toString() }])
                  setNewTemplate({
                    name: '',
                    type: 'custom',
                    greeting: '',
                    questions: [{ text: '', type: 'rating' }],
                    closing: ''
                  })
                  setShowCreateTemplate(false)
                }}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold flex items-center gap-2"
              >
                <Save size={18} /> Guardar Plantilla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
