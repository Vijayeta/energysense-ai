import { TrendingDown } from 'lucide-react'
import { Recommendation } from '@/types'

interface SavingsTableProps {
  recommendations: Recommendation[]
  savingsTotal: number
}

function formatShort(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `₹${Math.round(value / 1000)}K`
  return `₹${value}`
}

const CATEGORY_COLORS: Record<string, string> = {
  HVAC: 'bg-green-600',
  Lighting: 'bg-green-500',
  Equipment: 'bg-green-400',
  Operations: 'bg-green-300',
}

export default function SavingsTable({ recommendations, savingsTotal }: SavingsTableProps) {
  const max = Math.max(...recommendations.map((r) => r.savings_annual))

  return (
    <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center gap-2">
        <TrendingDown className="h-5 w-5 text-green-600" />
        <h3 className="text-base font-semibold text-gray-800">Savings Opportunity Chart</h3>
      </div>

      <div className="p-5 space-y-4">
        {recommendations.map((rec, i) => {
          const pct = max > 0 ? (rec.savings_annual / max) * 100 : 0
          const barColor = CATEGORY_COLORS[rec.category] ?? 'bg-green-500'
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm text-gray-600 text-right">{rec.category}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-sm font-semibold text-gray-700 text-right">
                {formatShort(rec.savings_annual)}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mx-5 mb-5 flex items-center justify-between bg-green-600 rounded-xl px-5 py-3">
        <span className="text-sm font-semibold text-white">Total Annual Savings Potential</span>
        <span className="text-base font-bold text-white">{formatShort(savingsTotal)}</span>
      </div>

      <p className="px-5 pb-4 text-xs text-gray-400">
        * AI-generated estimates based on industry benchmarks. Actual results vary.
      </p>
    </div>
  )
}
