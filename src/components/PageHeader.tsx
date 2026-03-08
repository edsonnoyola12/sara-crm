import { type LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  badge?: string | number
  badgeColor?: string
  actions?: React.ReactNode
}

export default function PageHeader({ icon: Icon, title, subtitle, badge, badgeColor = 'bg-blue-500/20 text-blue-400', actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-800/80 rounded-xl flex items-center justify-center border border-slate-700/40 flex-shrink-0">
          <Icon size={20} className="text-blue-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-white">{title}</h1>
            {badge !== undefined && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
