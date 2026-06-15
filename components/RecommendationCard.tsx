'use client'

import { useState } from 'react'
import { Thermometer, Lightbulb, Settings, Zap, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react'
import { Recommendation } from '@/types'
import { ElementType } from 'react'

interface RecommendationCardProps {
  recommendation: Recommendation
  index: number
}

const categoryConfig: Record<string, { icon: ElementType; color: string; bg: string; badge: string }> = {
  HVAC:       { icon: Thermometer,   color: 'text-blue-600',   bg: 'bg-blue-50',   badge: 'bg-blue-100 text-blue-700' },
  Lighting:   { icon: Lightbulb,     color: 'text-yellow-600', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700' },
  Equipment:  { icon: Settings,      color: 'text-purple-600', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-700' },
  Operations: { icon: ClipboardList, color: 'text-teal-600',   bg: 'bg-teal-50',   badge: 'bg-teal-100 text-teal-700' },
}

export default function RecommendationCard({ recommendation, index }: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const config = categoryConfig[recommendation.category] ?? { icon: Zap, color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-700' }
  const Icon = config.icon

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Collapsed view — always visible */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* Priority + icon */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {index + 1}
            </span>
            <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
              <Icon className={`h-4 w-4 ${config.color}`} />
            </div>
          </div>

          {/* Title + category */}
          <div className="flex-1 min-w-0">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badge}`}>
              {recommendation.category}
            </span>
            <p className="font-semibold text-gray-800 text-sm leading-snug mt-1.5">
              {recommendation.action}
            </p>
          </div>

          {/* Savings */}
          <div className="shrink-0 text-right ml-1">
            <p className="text-xs text-gray-400 mb-0.5">Annual savings</p>
            <p className="text-sm font-bold text-green-600">
              ₹{recommendation.savings_annual.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* View Details toggle */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-green-600 transition-colors"
        >
          {expanded ? (
            <><ChevronUp className="h-3.5 w-3.5" /> Hide details</>
          ) : (
            <><ChevronDown className="h-3.5 w-3.5" /> View details</>
          )}
        </button>
      </div>

      {/* Expanded rationale */}
      {expanded && (
        <div className="px-4 sm:px-5 pb-4 pt-0 border-t border-gray-50">
          <p className="text-sm text-gray-500 leading-relaxed pt-3">{recommendation.rationale}</p>
        </div>
      )}
    </div>
  )
}
