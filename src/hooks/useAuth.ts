// ═══════════════════════════════════════════════════════════════════════════
// useAuth — React hook for auth state
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'

export function useAuth() {
  const { user, tenant, isAuthenticated, isLoading, error, login, logout, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return { user, tenant, isAuthenticated, isLoading, error, login, logout }
}
