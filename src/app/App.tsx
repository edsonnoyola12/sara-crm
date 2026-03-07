// ═══════════════════════════════════════════════════════════════════════════
// APP — Root component with Router + Auth
// Phase 2: Wraps the legacy App.tsx with router and auth layer
// Pages are progressively extracted from the monolith
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// APP — Root component
// Phase 2 (pending): Add React Router + JWT auth
// For now: render legacy App directly (has its own phone-based login)
// ═══════════════════════════════════════════════════════════════════════════

import LegacyApp from '../App'
import { CrmProvider } from '../context/CrmContext'

export default function App() {
  return (
    <CrmProvider>
      <LegacyApp />
    </CrmProvider>
  )
}
