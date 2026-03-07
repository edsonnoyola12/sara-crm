// ═══════════════════════════════════════════════════════════════════════════
// SIDEBAR — Collapsible grouped navigation
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import {
  Users, Calendar, Settings, TrendingUp, DollarSign, Target, Building,
  CreditCard, Megaphone, BarChart3, MessageSquare, Gift, Bell,
  FileSpreadsheet, CheckSquare, Award, ChevronRight, Bot, Tag,
  CalendarDays, Monitor, Wrench, PieChart, Shield,
} from 'lucide-react'
import { useTenant } from '../../hooks/useTenant'
import type { View } from '../../types'

interface SidebarProps {
  activeView: View
  onNavigate: (view: View) => void
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  id: View
  label: string
  icon: any
}

interface NavSection {
  key: string
  title: string
  icon: any
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    key: 'principal',
    title: 'Principal',
    icon: BarChart3,
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
      { id: 'leads', label: 'Leads', icon: Users },
      { id: 'properties', label: 'Propiedades', icon: Building },
    ],
  },
  {
    key: 'ventas',
    title: 'Ventas',
    icon: Target,
    items: [
      { id: 'coordinator', label: 'Coordinador', icon: CheckSquare },
      { id: 'calendar', label: 'Calendario', icon: Calendar },
      { id: 'followups', label: 'Seguimientos', icon: Target },
      { id: 'mortgage', label: 'Hipotecas', icon: CreditCard },
      { id: 'promotions', label: 'Promociones', icon: Tag },
      { id: 'events', label: 'Eventos', icon: CalendarDays },
    ],
  },
  {
    key: 'comunicacion',
    title: 'Comunicacion',
    icon: MessageSquare,
    items: [
      { id: 'mensajes', label: 'Mensajes', icon: MessageSquare },
      { id: 'encuestas', label: 'Encuestas', icon: FileSpreadsheet },
      { id: 'referrals', label: 'Referidos', icon: Gift },
    ],
  },
  {
    key: 'inteligencia',
    title: 'Inteligencia',
    icon: PieChart,
    items: [
      { id: 'reportes', label: 'Reportes', icon: TrendingUp },
      { id: 'bi', label: 'Inteligencia Comercial', icon: PieChart },
      { id: 'marketing', label: 'Marketing', icon: Megaphone },
      { id: 'sara-ai', label: 'SARA IA', icon: Bot },
    ],
  },
  {
    key: 'monitoreo',
    title: 'Monitoreo',
    icon: Shield,
    items: [
      { id: 'alertas', label: 'Alertas', icon: Bell },
      { id: 'sla', label: 'SLA', icon: Award },
    ],
  },
  {
    key: 'admin',
    title: 'Admin',
    icon: Settings,
    items: [
      { id: 'team', label: 'Equipo', icon: Users },
      { id: 'goals', label: 'Metas', icon: DollarSign },
      { id: 'sistema', label: 'Sistema', icon: Monitor },
      { id: 'config', label: 'Configuracion', icon: Wrench },
    ],
  },
]

function findSectionForView(view: View): string | null {
  for (const section of NAV_SECTIONS) {
    if (section.items.some((item) => item.id === view)) return section.key
  }
  return null
}

export function Sidebar({ activeView, onNavigate, isOpen, onClose }: SidebarProps) {
  const { theme } = useTenant()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // Auto-expand the section containing the active view
  useEffect(() => {
    const activeSection = findSectionForView(activeView)
    if (activeSection && !expanded[activeSection]) {
      setExpanded((prev) => ({ ...prev, [activeSection]: true }))
    }
  }, [activeView])

  const toggleSection = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-gray-900 text-white flex flex-col transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo / Brand */}
        <div className="h-14 flex items-center px-4 border-b border-gray-800 shrink-0">
          {theme.logoUrl ? (
            <img src={theme.logoUrl} alt={theme.name} className="h-7" />
          ) : (
            <h1 className="text-lg font-bold" style={{ color: theme.primaryColor }}>
              SARA CRM
            </h1>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
          {NAV_SECTIONS.map((section) => {
            const isExpanded = expanded[section.key] ?? false
            const SectionIcon = section.icon
            const hasActiveItem = section.items.some((item) => item.id === activeView)

            return (
              <div key={section.key} className="mb-0.5">
                {/* Section header — clickable toggle */}
                <button
                  onClick={() => toggleSection(section.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors
                    ${hasActiveItem ? 'text-gray-200' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <span className="flex items-center gap-2">
                    <SectionIcon size={14} />
                    {section.title}
                  </span>
                  <ChevronRight
                    size={14}
                    className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </button>

                {/* Collapsible items */}
                <div
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${
                    isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const isActive = activeView === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => { onNavigate(item.id); onClose() }}
                        className={`w-full flex items-center gap-2.5 pl-9 pr-3 py-1.5 text-sm transition-colors
                          ${isActive
                            ? 'bg-gray-800 text-white border-l-2'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
                        style={isActive ? { borderColor: theme.primaryColor } : undefined}
                      >
                        <Icon size={16} />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Bottom: version */}
        <div className="px-4 py-2 border-t border-gray-800 shrink-0">
          <p className="text-[10px] text-gray-600">SARA CRM v2.0</p>
        </div>
      </aside>
    </>
  )
}
