import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Zap, Check, ArrowRight } from 'lucide-react'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  feature: string
  requiredPlan: string
  reason?: string
}

const PLAN_INFO: Record<string, { name: string; price: string; color: string; features: string[] }> = {
  starter: {
    name: 'Starter',
    price: '$1,499/mes',
    color: 'blue',
    features: ['IA conversacional', 'Reportes y analytics', 'Google Calendar sync', 'Credito hipotecario', 'SLA monitoring', 'Hasta 500 leads'],
  },
  pro: {
    name: 'Pro',
    price: '$3,999/mes',
    color: 'green',
    features: ['Todo en Starter', 'Llamadas IA (Retell)', 'Cadencia inteligente', 'Videos personalizados', 'Desarrollos ilimitados', 'Hasta 5,000 leads'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    color: 'purple',
    features: ['Todo en Pro', 'Multi-linea WhatsApp', 'API dedicada', 'White-label', 'Soporte prioritario', 'Leads ilimitados'],
  },
}

export function UpgradeModal({ open, onClose, feature, requiredPlan, reason }: UpgradeModalProps) {
  const navigate = useNavigate()
  const plan = PLAN_INFO[requiredPlan] || PLAN_INFO.starter

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-center relative">
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white">
            <X size={18} />
          </button>
          <div className="w-12 h-12 bg-amber-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Zap className="text-amber-400" size={24} />
          </div>
          <h3 className="text-lg font-bold text-white">Funcion Premium</h3>
          <p className="text-gray-400 text-sm mt-1">
            {reason || `${feature} requiere el plan ${plan.name}`}
          </p>
        </div>

        {/* Plan card */}
        <div className="p-6">
          <div className="border rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-900">Plan {plan.name}</h4>
              <span className="text-lg font-bold text-gray-900">{plan.price}</span>
            </div>
            <ul className="space-y-2">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={14} className="text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => { onClose(); navigate('/billing'); }}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 flex items-center justify-center gap-2"
            >
              Upgrade a {plan.name} <ArrowRight size={16} />
            </button>
            {requiredPlan === 'enterprise' && (
              <button
                onClick={() => { onClose(); navigate('/contact'); }}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
              >
                Contactar ventas
              </button>
            )}
            <button onClick={onClose} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600">
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook for easy usage
export function useUpgradeModal() {
  const [state, setState] = useState<{ open: boolean; feature: string; plan: string; reason?: string }>({
    open: false, feature: '', plan: '', reason: undefined,
  })

  const show = (feature: string, plan: string, reason?: string) => {
    setState({ open: true, feature, plan, reason })
  }

  const close = () => setState(s => ({ ...s, open: false }))

  return {
    modal: <UpgradeModal open={state.open} onClose={close} feature={state.feature} requiredPlan={state.plan} reason={state.reason} />,
    showUpgrade: show,
  }
}
