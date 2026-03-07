// All interfaces matching the monolith's actual data shapes

export type View = 'dashboard' | 'leads' | 'properties' | 'team' | 'calendar' | 'mortgage' | 'marketing' | 'referrals' | 'goals' | 'config' | 'followups' | 'promotions' | 'events' | 'reportes' | 'encuestas' | 'coordinator' | 'bi' | 'mensajes' | 'sistema' | 'sara-ai' | 'alertas' | 'sla' | 'inbox' | 'forecast' | 'tasks' | 'report-builder' | 'workflows' | 'approvals' | 'api-webhooks' | 'organization'

export interface Tenant {
  id: string
  name: string
  slug: string
  logo_url?: string
  primary_color?: string
  plan: 'free' | 'starter' | 'pro' | 'enterprise'
  max_users: number
  max_leads: number
  features: string[]
  created_at: string
  active: boolean
}

export interface TenantMember {
  id: string
  tenant_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
}

export interface ApprovalRequest {
  id: string
  type: 'discount' | 'reservation' | 'cancellation' | 'price_change' | 'commission_change' | 'lead_delete' | 'refund'
  entity_type: 'lead' | 'property' | 'mortgage' | 'appointment'
  entity_id: string
  entity_name: string
  requested_by: string
  requested_by_name: string
  approved_by?: string
  approved_by_name?: string
  status: 'pending' | 'approved' | 'rejected'
  details: Record<string, any>
  reason: string
  rejection_reason?: string
  created_at: string
  resolved_at?: string
}

export interface ApprovalRule {
  id: string
  type: string
  description: string
  requires_role: string
  auto_approve_threshold?: number
  active: boolean
}

export interface Lead {
  id: string
  name: string
  phone: string
  property_interest: string
  budget: string
  score: number
  status: string
  created_at: string
  conversation_history: any[]
  assigned_to?: string
  source?: string
  campaign_id?: string
  updated_at?: string
  fallen_reason?: string
  notes?: any
  credit_status?: string
  status_changed_at?: string
  template_sent?: string
  template_sent_at?: string
  sara_activated?: boolean
  sara_activated_at?: string
  survey_completed?: boolean
  survey_rating?: number
  survey_feedback?: string
  survey_step?: number
  temperature?: string
  needs_mortgage?: boolean
  last_message_at?: string
  referred_by?: string
  referred_by_name?: string
  referral_date?: string
  custom_data?: Record<string, any>
}

export interface FieldPermission {
  id: string
  entity_type: 'lead' | 'property' | 'mortgage' | 'team_member'
  field_name: string
  field_label: string
  role: string
  can_view: boolean
  can_edit: boolean
}

export interface CustomField {
  id: string
  entity_type: 'lead' | 'property' | 'mortgage'
  field_name: string
  field_label: string
  field_type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'url'
  options?: string[]
  required: boolean
  visible: boolean
  order: number
  created_at: string
}

export interface Property {
  id: string
  name: string
  category: string
  price: number
  price_equipped: number
  land_size: number
  bedrooms: number
  bathrooms: number
  area_m2: number
  total_units: number
  sold_units: number
  photo_url: string
  description: string
  neighborhood: string
  city: string
  development: string
  ideal_client: string
  sales_phrase: string
  youtube_link: string
  matterport_link: string
  gps_link: string
  brochure_urls: string
  gallery_urls: string
  address: string
  floors: number
}

export interface TeamMember {
  id: string
  name: string
  phone: string
  role: string
  sales_count: number
  commission: number
  active: boolean
  photo_url: string
  email: string
  vacation_start?: string
  vacation_end?: string
  is_on_duty?: boolean
  work_start?: string
  work_end?: string
  working_days?: number[]
  hora_inicio?: number
  hora_fin?: number
}

export interface MortgageApplication {
  id: string
  lead_id: string
  lead_name: string
  lead_phone: string
  property_id: string
  property_name: string
  monthly_income: number
  additional_income: number
  current_debt: number
  down_payment: number
  requested_amount: number
  credit_term_years: number
  prequalification_score: number
  max_approved_amount: number
  estimated_monthly_payment: number
  assigned_advisor_id: string
  assigned_advisor_name: string
  bank: string
  status: string
  status_notes: string
  pending_at: string
  in_review_at: string
  sent_to_bank_at: string
  decision_at: string
  stalled_alert_sent: boolean
  created_at: string
  updated_at: string
}

export interface AlertSetting {
  id: string
  category: string
  stage: string
  max_days: number
}

export interface LeadActivity {
  id: string
  lead_id: string
  team_member_id: string
  activity_type: string
  notes: string
  created_at: string
  team_member_name?: string
}

export interface Campaign {
  id: string
  name: string
  channel: string
  status: string
  budget: number
  spent: number
  impressions: number
  clicks: number
  leads_generated: number
  sales_closed: number
  revenue_generated: number
  start_date: string
  end_date: string
  notes: string
  target_audience: string
  creative_url: string
  created_at: string
}

export interface Appointment {
  id: string
  lead_id: string
  lead_phone: string
  lead_name?: string
  property_id: string
  property_name: string
  vendedor_id?: string
  vendedor_name?: string
  asesor_id?: string
  asesor_name?: string
  scheduled_date: string
  scheduled_time: string
  status: 'scheduled' | 'cancelled' | 'completed'
  appointment_type: string
  duration_minutes: number
  google_event_vendedor_id?: string
  google_event_asesor_id?: string
  cancelled_by?: string
  created_at: string
  updated_at: string
  mode?: string
  notificar?: boolean
  confirmation_sent?: boolean
  confirmation_sent_at?: string
  client_responded?: boolean
  client_responded_at?: string
  team_member_id?: string
}

export interface ReminderConfig {
  id: string
  lead_category: string
  reminder_hours: number
  active: boolean
  message_template: string
  send_start_hour: number
  send_end_hour: number
}

export interface Insight {
  type: 'opportunity' | 'warning' | 'success'
  title: string
  description: string
  action?: string
  icon: any
}

export interface Promotion {
  id: string
  name: string
  description?: string
  start_date: string
  end_date: string
  message: string
  image_url?: string
  video_url?: string
  pdf_url?: string
  target_segment: string
  segment_filters?: string | object
  reminder_enabled: boolean
  reminder_frequency: string
  last_reminder_sent?: string
  reminders_sent_count: number
  total_reached: number
  total_responses: number
  status: string
  created_by?: string
  created_at: string
  updated_at?: string
}

export interface CRMEvent {
  id: string
  name: string
  description?: string
  event_type: string
  event_date: string
  event_time?: string
  location?: string
  location_url?: string
  max_capacity?: number
  registered_count: number
  image_url?: string
  video_url?: string
  pdf_url?: string
  invitation_message?: string
  target_segment?: string
  segment_filters?: string | object
  status: string
  created_at: string
  created_by?: string
}

export interface EventRegistration {
  id: string
  event_id: string
  lead_id: string
  status: string
  registered_at: string
  lead_name?: string
  lead_phone?: string
  attended?: boolean
}

export interface Document {
  id: string
  entity_type: 'lead' | 'property' | 'mortgage'
  entity_id: string
  name: string
  file_url: string
  file_type: string // 'pdf', 'image', 'doc', etc
  file_size: number // bytes
  category: string // 'ine', 'comprobante_domicilio', 'comprobante_ingresos', 'estado_cuenta', 'contrato', 'escritura', 'avaluo', 'otro'
  uploaded_by: string // team_member_id
  uploaded_by_name: string
  notes?: string
  created_at: string
}

export const DOCUMENT_CATEGORIES = [
  { key: 'ine', label: 'INE' },
  { key: 'comprobante_domicilio', label: 'Comprobante de Domicilio' },
  { key: 'comprobante_ingresos', label: 'Comprobante de Ingresos' },
  { key: 'estado_cuenta', label: 'Estado de Cuenta' },
  { key: 'contrato', label: 'Contrato' },
  { key: 'escritura', label: 'Escritura' },
  { key: 'avaluo', label: 'Avaluo' },
  { key: 'otro', label: 'Otro' },
] as const

export interface AuditEntry {
  id: string
  entity_type: 'lead' | 'property' | 'mortgage' | 'appointment' | 'team_member' | 'campaign' | 'promotion' | 'event'
  entity_id: string
  entity_name: string
  action: 'create' | 'update' | 'delete' | 'status_change'
  changes: Record<string, { old: any; new: any }>
  user_id: string
  user_name: string
  timestamp: string
}

export interface Task {
  id: string
  title: string
  description?: string
  due_date?: string
  due_time?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  category: 'llamada' | 'tramite' | 'documento' | 'seguimiento' | 'notaria' | 'avaluo' | 'otro'
  assigned_to: string
  assigned_to_name: string
  lead_id?: string
  lead_name?: string
  property_id?: string
  property_name?: string
  created_by: string
  created_by_name: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export const TASK_CATEGORIES = [
  { key: 'llamada', label: 'Llamada', color: 'bg-amber-500' },
  { key: 'tramite', label: 'Tramite', color: 'bg-blue-500' },
  { key: 'documento', label: 'Documento', color: 'bg-purple-500' },
  { key: 'seguimiento', label: 'Seguimiento', color: 'bg-green-500' },
  { key: 'notaria', label: 'Notaria', color: 'bg-rose-500' },
  { key: 'avaluo', label: 'Avaluo', color: 'bg-cyan-500' },
  { key: 'otro', label: 'Otro', color: 'bg-slate-500' },
] as const

export const TASK_PRIORITIES = [
  { key: 'low', label: 'Baja', color: 'bg-slate-400', dot: 'bg-slate-400' },
  { key: 'medium', label: 'Media', color: 'bg-yellow-500', dot: 'bg-yellow-500' },
  { key: 'high', label: 'Alta', color: 'bg-orange-500', dot: 'bg-orange-500' },
  { key: 'urgent', label: 'Urgente', color: 'bg-red-500', dot: 'bg-red-500' },
] as const

export const STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo', contacted: 'Contactado', qualified: 'Calificado', scheduled: 'Cita',
  visited: 'Visito', negotiation: 'Negociacion', reserved: 'Reservado', closed: 'Cerrado',
  delivered: 'Entregado', sold: 'Vendido', lost: 'Perdido', fallen: 'Caido', inactive: 'Inactivo', paused: 'Pausado'
}

export const API_BASE = 'https://sara-backend.edson-633.workers.dev'

export async function safeFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const APPT_TYPES: Record<string, { bg: string; dot: string; badge: string; label: string; icon: string }> = {
  visita:                  { bg: 'bg-blue-500/80',   dot: 'bg-blue-400',   badge: 'bg-blue-600',   label: 'Visita',     icon: '🏠' },
  visit:                   { bg: 'bg-blue-500/80',   dot: 'bg-blue-400',   badge: 'bg-blue-600',   label: 'Visita',     icon: '🏠' },
  mortgage_consultation:   { bg: 'bg-purple-500/80', dot: 'bg-purple-400', badge: 'bg-purple-600', label: 'Credito',    icon: '🏦' },
  asesoria_credito:        { bg: 'bg-purple-500/80', dot: 'bg-purple-400', badge: 'bg-purple-600', label: 'Credito',    icon: '🏦' },
  follow_up:               { bg: 'bg-green-500/80',  dot: 'bg-green-400',  badge: 'bg-green-600',  label: 'Seguimiento',icon: '📋' },
  seguimiento:             { bg: 'bg-green-500/80',  dot: 'bg-green-400',  badge: 'bg-green-600',  label: 'Seguimiento',icon: '📋' },
  llamada:                 { bg: 'bg-amber-500/80',  dot: 'bg-amber-400',  badge: 'bg-amber-600',  label: 'Llamada',    icon: '📞' },
  entrega:                 { bg: 'bg-emerald-500/80',dot: 'bg-emerald-400',badge: 'bg-emerald-600',label: 'Entrega',    icon: '🔑' },
  firma:                   { bg: 'bg-rose-500/80',   dot: 'bg-rose-400',   badge: 'bg-rose-600',   label: 'Firma',      icon: '✍️' },
}
const APPT_DEFAULT = { bg: 'bg-blue-500/80', dot: 'bg-blue-400', badge: 'bg-blue-600', label: 'Cita', icon: '📅' }
export function getApptStyle(type?: string) { return APPT_TYPES[type || 'visit'] || APPT_DEFAULT }

export const APPT_LEGEND = [
  { key: 'visita', ...APPT_TYPES.visita },
  { key: 'mortgage_consultation', ...APPT_TYPES.mortgage_consultation },
  { key: 'follow_up', ...APPT_TYPES.follow_up },
  { key: 'llamada', ...APPT_TYPES.llamada },
  { key: 'entrega', ...APPT_TYPES.entrega },
  { key: 'firma', ...APPT_TYPES.firma },
]

export const sourceLabel = (src: string) => {
  const map: Record<string, string> = {
    'phone_inbound': '📞 Llamada',
    'facebook_ads': '📘 Facebook',
    'referral': '🤝 Referido',
    'agency_import': '📥 Importado',
    'whatsapp': '💬 WhatsApp',
    'website': '🌐 Web',
    'Directo': '➡️ Directo',
  }
  return map[src] || src
}

export const getScoreColor = (score: number) => {
  if (score >= 70) return 'bg-red-500 badge-pulse score-hot'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-slate-500'
}

export const getScoreLabel = (score: number) => {
  if (score >= 70) return 'Caliente'
  if (score >= 40) return 'Tibio'
  return 'Frio'
}

export const mortgageStatuses = [
  { key: 'pending', label: 'Pendiente', color: 'bg-gray-500' },
  { key: 'in_review', label: 'En Revision', color: 'bg-yellow-500' },
  { key: 'sent_to_bank', label: 'Enviado a Banco', color: 'bg-blue-500' },
  { key: 'approved', label: 'Aprobado', color: 'bg-green-500' },
  { key: 'rejected', label: 'Rechazado', color: 'bg-red-500' }
]

export const channelColors: Record<string, string> = {
  'Facebook': 'bg-blue-600',
  'Google Ads': 'bg-red-500',
  'Instagram': 'bg-pink-500',
  'TikTok': 'bg-slate-800/50 backdrop-blur-sm border border-slate-700/50',
  'TV': 'bg-purple-600',
  'Radio': 'bg-yellow-600',
  'Espectaculares': 'bg-green-600',
  'Referidos': 'bg-cyan-500'
}

export interface ApiToken {
  id: string
  name: string
  token: string
  permissions: string[]
  created_by: string
  created_by_name: string
  last_used_at?: string
  expires_at?: string
  active: boolean
  created_at: string
}

export interface WebhookConfig {
  id: string
  name: string
  url: string
  events: string[]
  secret?: string
  active: boolean
  last_triggered_at?: string
  last_status_code?: number
  failure_count: number
  created_by: string
  created_at: string
}
