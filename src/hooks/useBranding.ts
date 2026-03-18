// ═══════════════════════════════════════════════════════════════════════════
// WHITE-LABEL BRANDING HOOK
// Applies tenant's primary_color and logo_url dynamically
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'

/**
 * Applies tenant branding (primary color, logo) as CSS variables.
 * Usage: call useBranding() in a top-level component.
 * CSS can then use: var(--brand-primary), var(--brand-logo-url)
 */
export function useBranding() {
  const tenant = useAuthStore(s => s.tenant)

  useEffect(() => {
    if (!tenant) return

    const root = document.documentElement

    // Apply primary color as CSS variable + Tailwind-compatible HSL
    if (tenant.primary_color) {
      root.style.setProperty('--brand-primary', tenant.primary_color)

      // Convert hex to RGB for opacity variants
      const hex = tenant.primary_color.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      root.style.setProperty('--brand-primary-rgb', `${r}, ${g}, ${b}`)

      // Apply to key UI elements via meta theme-color
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) meta.setAttribute('content', tenant.primary_color)
    }

    // Logo URL
    if (tenant.logo_url) {
      root.style.setProperty('--brand-logo-url', `url(${tenant.logo_url})`)
    }

    // Document title
    if (tenant.name) {
      document.title = `${tenant.name} - SARA CRM`
    }

    return () => {
      root.style.removeProperty('--brand-primary')
      root.style.removeProperty('--brand-primary-rgb')
      root.style.removeProperty('--brand-logo-url')
      document.title = 'SARA CRM'
    }
  }, [tenant?.primary_color, tenant?.logo_url, tenant?.name])

  return {
    primaryColor: tenant?.primary_color || '#16A34A',
    logoUrl: tenant?.logo_url || null,
    tenantName: tenant?.name || 'SARA CRM',
  }
}
