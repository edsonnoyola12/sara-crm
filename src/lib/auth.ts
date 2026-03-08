// ═══════════════════════════════════════════════════════════════════════════
// AUTH LIBRARY — JWT token management + Supabase Auth for frontend
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from './supabase'

const TOKEN_KEY = 'sara_access_token'
const REFRESH_KEY = 'sara_refresh_token'

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp < Math.floor(Date.now() / 1000)
  } catch {
    return true
  }
}

export function getTokenPayload(token: string): any | null {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPABASE AUTH — email/password auth using phone-derived emails
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sign in via Supabase Auth using phone number (converted to email format).
 * Returns { user, error, legacy } where legacy=true means "user not found in Supabase Auth,
 * fall back to localStorage password check".
 */
export async function signInWithPhone(phone: string, password: string) {
  const email = `${phone.replace(/\D/g, '')}@sara-crm.app`
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { user: null, error: 'Credenciales invalidas', legacy: true }
    }
    return { user: null, error: error.message, legacy: false }
  }
  return { user: data.user, error: null, legacy: false }
}

/**
 * Register a user in Supabase Auth (migration from legacy localStorage auth).
 */
export async function signUpWithPhone(phone: string, password: string) {
  const email = `${phone.replace(/\D/g, '')}@sara-crm.app`
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { user: null, error: error.message }
  return { user: data.user, error: null }
}

/**
 * Sign out from Supabase Auth and clear all local session data.
 */
export async function supabaseSignOut() {
  await supabase.auth.signOut()
  localStorage.removeItem('sara_user_phone')
  localStorage.removeItem('sara_auth_session')
  localStorage.removeItem('sara_session')
  localStorage.removeItem('sara_session_token')
}

/**
 * Get current Supabase Auth session (if any).
 */
export async function getSupabaseSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

/**
 * Listen for Supabase Auth state changes.
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback)
}
