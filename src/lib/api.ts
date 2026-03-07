// ═══════════════════════════════════════════════════════════════════════════
// API CLIENT — Centralized HTTP client with JWT auth
// Replaces direct Supabase calls with backend API calls
// ═══════════════════════════════════════════════════════════════════════════

import { getAccessToken, getRefreshToken, setTokens, clearTokens, isTokenExpired } from './auth'

const API_BASE = import.meta.env.VITE_API_BASE || 'https://sara-backend.edson-633.workers.dev'

class ApiClient {
  private refreshPromise: Promise<boolean> | null = null

  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    let token = getAccessToken()

    // Auto-refresh if token is expired
    if (token && isTokenExpired(token)) {
      const refreshed = await this.refreshToken()
      if (refreshed) {
        token = getAccessToken()
      } else {
        clearTokens()
        window.location.href = '/login'
        throw new Error('Session expired')
      }
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  private async refreshToken(): Promise<boolean> {
    // Deduplicate concurrent refresh attempts
    if (this.refreshPromise) return this.refreshPromise

    this.refreshPromise = (async () => {
      try {
        const refreshToken = getRefreshToken()
        if (!refreshToken) return false

        const res = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })

        if (!res.ok) return false

        const data = await res.json()
        if (data.access_token) {
          setTokens(data.access_token, refreshToken)
          return true
        }
        return false
      } catch {
        return false
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  async get<T = any>(path: string): Promise<T> {
    const headers = await this.getHeaders()
    const res = await fetch(`${API_BASE}${path}`, { headers })
    if (!res.ok) {
      if (res.status === 401) {
        clearTokens()
        window.location.href = '/login'
      }
      throw new Error(`API error: ${res.status}`)
    }
    return res.json()
  }

  async post<T = any>(path: string, body?: any): Promise<T> {
    const headers = await this.getHeaders()
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      if (res.status === 401) {
        clearTokens()
        window.location.href = '/login'
      }
      throw new Error(`API error: ${res.status}`)
    }
    return res.json()
  }

  async put<T = any>(path: string, body?: any): Promise<T> {
    const headers = await this.getHeaders()
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  }

  async delete<T = any>(path: string): Promise<T> {
    const headers = await this.getHeaders()
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers,
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  }

  // Auth-specific methods
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error de conexion' }))
      throw new Error(err.error || 'Login failed')
    }
    return res.json()
  }

  async me() {
    return this.get('/api/auth/me')
  }
}

export const api = new ApiClient()
