// ═══════════════════════════════════════════════════════════════════════════
// AUTH STORE — Zustand store for user + tenant state
// ═══════════════════════════════════════════════════════════════════════════

import { create } from 'zustand'
import type { AuthUser, Tenant } from '../types'
import { api } from '../lib/api'
import { setTokens, clearTokens, getAccessToken } from '../lib/auth'

interface AuthState {
  user: AuthUser | null
  tenant: Tenant | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const data = await api.login(email, password)
      setTokens(data.access_token, data.refresh_token)
      set({
        user: data.user,
        tenant: data.tenant,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
      return true
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Error de autenticacion',
      })
      return false
    }
  },

  logout: () => {
    clearTokens()
    set({
      user: null,
      tenant: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  },

  checkAuth: async () => {
    const token = getAccessToken()
    if (!token) {
      set({ isLoading: false, isAuthenticated: false })
      return
    }

    try {
      const data = await api.me()
      set({
        user: data.user,
        tenant: data.tenant,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      clearTokens()
      set({
        user: null,
        tenant: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },
}))
