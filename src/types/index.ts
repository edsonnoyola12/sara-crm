// ═══════════════════════════════════════════════════════════════════════════
// SHARED TYPES — TypeScript interfaces used across the CRM frontend
// ═══════════════════════════════════════════════════════════════════════════

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
  email?: string
  preferred_channel?: string
}

export interface Property {
  id: string
  name: string
  development: string
  price_min: number
  price_max: number
  bedrooms: number
  bathrooms: number
  construction_m2: number
  land_m2: number
  gps_url?: string
  brochure_url?: string
  video_url?: string
  matterport_url?: string
  features?: string[]
  available?: boolean
  created_at: string
}

export interface TeamMember {
  id: string
  phone: string
  name: string
  role: string
  active: boolean
  last_sara_interaction?: string
  monthly_goal?: number
  monthly_sales?: number
  created_at: string
  recibe_briefing?: boolean
}

export interface Appointment {
  id: string
  lead_id: string
  scheduled_date: string
  scheduled_time: string
  appointment_type: string
  development?: string
  status: string
  vendor_id?: string
  notes?: string
  google_event_id?: string
  created_at: string
  updated_at?: string
  leads?: Lead
}

export interface MortgageApplication {
  id: string
  lead_id: string
  status: string
  assigned_advisor_id?: string
  bank?: string
  credit_type?: string
  monthly_income?: number
  requested_amount?: number
  approved_amount?: number
  documents?: any
  notes?: string
  created_at: string
  updated_at?: string
}

export interface AuthUser {
  id: string
  email: string
  role: string
  team_member_id?: string
}

export interface Tenant {
  id: string
  slug: string
  name: string
  timezone: string
  plan: string
  logo_url?: string
  primary_color?: string
  secondary_color?: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: AuthUser
  tenant: Tenant
}

export type View =
  | 'dashboard' | 'leads' | 'properties' | 'team' | 'calendar'
  | 'mortgage' | 'marketing' | 'referrals' | 'goals' | 'config'
  | 'followups' | 'promotions' | 'events' | 'reportes' | 'encuestas'
  | 'coordinator' | 'bi' | 'mensajes' | 'sistema' | 'sara-ai'
  | 'alertas' | 'sla'

export const STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo', contacted: 'Contactado', qualified: 'Calificado', scheduled: 'Cita',
  visited: 'Visito', negotiation: 'Negociacion', reserved: 'Reservado', closed: 'Cerrado',
  delivered: 'Entregado', sold: 'Vendido', lost: 'Perdido', fallen: 'Caido', inactive: 'Inactivo', paused: 'Pausado'
}
