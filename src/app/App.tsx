// ═══════════════════════════════════════════════════════════════════════════
// APP — Root component with Router + Auth + White-label branding
// 16 routes: 10 public, 3 protected, 1 admin, 1 root, 1 catch-all
// ═══════════════════════════════════════════════════════════════════════════

import { Routes, Route, Navigate } from 'react-router-dom'
import LegacyApp from '../App'
import { CrmProvider } from '../context/CrmContext'
import InstallPrompt from '../components/InstallPrompt'
import { LoginPage } from '../pages/LoginPage'
import { SignupPage } from '../pages/SignupPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { LandingPage } from '../pages/LandingPage'
import { PricingPage } from '../pages/PricingPage'
import { BillingPage } from '../pages/BillingPage'
import { SettingsPage } from '../pages/SettingsPage'
import { AcceptInvitationPage } from '../pages/AcceptInvitationPage'
import { SuperAdminPage } from '../pages/SuperAdminPage'
import { ApiDocsPage } from '../pages/ApiDocsPage'
import { PrivacyPage } from '../pages/PrivacyPage'
import { TermsPage } from '../pages/TermsPage'
import { ContactPage } from '../pages/ContactPage'
import { useAuth } from '../hooks/useAuth'
import { useBranding } from '../hooks/useBranding'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!isAuthenticated) {
    const hasToken = localStorage.getItem('sara_access_token')
    if (hasToken) {
      return <Navigate to="/login" replace />
    }
  }

  return <>{children}</>
}

function RootPage() {
  const { isAuthenticated, isLoading } = useAuth()
  useBranding() // Apply tenant colors when authenticated

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const hasLegacySession = localStorage.getItem('sara_user_phone') || localStorage.getItem('sara_auth_session')
  if (isAuthenticated || hasLegacySession) {
    return (
      <CrmProvider>
        <LegacyApp />
        <InstallPrompt />
      </CrmProvider>
    )
  }

  return <LandingPage />
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/docs" element={<ApiDocsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/invitations/accept" element={<AcceptInvitationPage />} />
      <Route path="/admin" element={<SuperAdminPage />} />

      {/* JWT-protected routes */}
      <Route path="/onboarding" element={
        <AuthGuard><OnboardingPage /></AuthGuard>
      } />
      <Route path="/billing" element={
        <AuthGuard><BillingPage /></AuthGuard>
      } />
      <Route path="/settings" element={
        <AuthGuard><SettingsPage /></AuthGuard>
      } />

      {/* Root: Landing (public) or CRM (authenticated) */}
      <Route path="/*" element={<RootPage />} />
    </Routes>
  )
}
