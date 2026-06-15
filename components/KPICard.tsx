import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
  accent: string
  trend?: number | null
  trendLabel?: string
  invertTrend?: boolean
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  accent,
  trend,
  trendLabel = 'vs prev month',
  invertTrend = false,
}: KPICardProps) {
  const isPositive = trend != null && trend > 0
  const isNegative = trend != null && trend < 0

  const trendColor =
    trend == null || trend === 0
      ? 'text-gray-400'
      : invertTrend
      ? isPositive ? 'text-green-500' : 'text-red-500'
      : isPositive ? 'text-red-500' : 'text-green-500'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`h-1 w-full ${accent}`} />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide truncate">{title}</p>
            <p className="text-lg font-bold text-gray-900 mt-1.5 leading-tight break-words">{value}</p>
            {trend != null ? (
              <p className={`text-xs mt-1.5 flex items-center gap-0.5 font-medium ${trendColor}`}>
                {isPositive && <TrendingUp className="h-3 w-3" />}
                {isNegative && <TrendingDown className="h-3 w-3" />}
                {trend > 0 ? '+' : ''}{trend}% {trendLabel}
              </p>
            ) : subtitle ? (
              <p className="text-xs text-gray-400 mt-1.5">{subtitle}</p>
            ) : null}
          </div>
          <div className={`p-2.5 rounded-xl shrink-0 ml-3 ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </div>
    </div>
  )
}
