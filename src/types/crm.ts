// All interfaces matching the monolith's actual data shapes

export type View = 'dashboard' | 'leads' | 'properties' | 'team' | 'calendar' | 'mortgage' | 'marketing' | 'referrals' | 'goals' | 'config' | 'followups' | 'promotions' | 'events' | 'reportes' | 'encuestas' | 'coordinator' | 'bi' | 'mensajes' | 'sistema' | 'sara-ai' | 'alertas' | 'sla' | 'inbox'

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
