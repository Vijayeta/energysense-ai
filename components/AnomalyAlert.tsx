import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { Anomaly } from '@/types'

interface AnomalyAlertProps {
  anomaly: Anomaly
}

const severityConfig = {
  high: {
    icon: AlertTriangle,
    accent: 'bg-red-500',
    badge: 'bg-red-100 text-red-700',
    iconColor: 'text-red-500',
    label: 'High Priority',
  },
  medium: {
    icon: AlertCircle,
    accent: 'bg-amber-400',
    badge: 'bg-amber-100 text-amber-700',
    iconColor: 'text-amber-500',
    label: 'Medium',
  },
  low: {
    icon: Info,
    accent: 'bg-blue-400',
    badge: 'bg-blue-100 text-blue-700',
    iconColor: 'text-blue-500',
    label: 'Low',
  },
}

export default function AnomalyAlert({ anomaly }: AnomalyAlertProps) {
  const config = severityConfig[anomaly.severity] ?? severityConfig.medium
  const Icon = config.icon

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex">
      <div className={`w-1 shrink-0 ${config.accent}`} />
      <div className="flex gap-3.5 p-4 flex-1">
        <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-gray-800 text-sm">{anomaly.title}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.badge}`}>
              {config.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">{anomaly.description}</p>
        </div>
      </div>
    </div>
  )
}
