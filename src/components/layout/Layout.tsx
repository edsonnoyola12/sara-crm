// ═══════════════════════════════════════════════════════════════════════════
// LAYOUT — Main app layout with sidebar + header + content area
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import type { View } from '../../types'

interface LayoutProps {
  activeView: View
  onNavigate: (view: View) => void
  children: React.ReactNode
}

export function Layout({ activeView, onNavigate, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        activeView={activeView}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
