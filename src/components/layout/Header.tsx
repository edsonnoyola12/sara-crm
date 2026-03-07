// ═══════════════════════════════════════════════════════════════════════════
// HEADER — Top bar with search, notifications, user menu
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { Search, Bell, LogOut, Menu } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTenant } from '../../hooks/useTenant'

interface HeaderProps {
  onMenuToggle: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth()
  const { theme } = useTenant()
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* Left: Menu + Search */}
      <div className="flex items-center gap-4">
        <button onClick={onMenuToggle} className="lg:hidden text-gray-500 hover:text-gray-700">
          <Menu size={24} />
        </button>
        <div className="relative hidden sm:block">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar leads, propiedades..."
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
          />
        </div>
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
          <Bell size={20} />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="hidden md:inline text-sm text-gray-700">{user?.email}</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
              <div className="px-4 py-2 border-b">
                <p className="text-sm font-medium text-gray-700">{user?.email}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} />
                Cerrar sesion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
