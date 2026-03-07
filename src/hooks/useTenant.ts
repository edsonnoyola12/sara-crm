// ═══════════════════════════════════════════════════════════════════════════
// useTenant — React hook for tenant theming and config
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo } from 'react'
import { useAuthStore } from '../stores/authStore'

export function useTenant() {
  const tenant = useAuthStore((s) => s.tenant)

  const theme = useMemo(() => ({
    primaryColor: tenant?.primary_color || '#2d5a27',
    secondaryColor: tenant?.secondary_color || '#ffffff',
    logoUrl: tenant?.logo_url || null,
    name: tenant?.name || 'SARA CRM',
  }), [tenant])

  return { tenant, theme }
}
