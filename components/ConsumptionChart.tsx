'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { EnergyReading } from '@/types'

interface ConsumptionChartProps {
  readings: EnergyReading[]
}

export default function ConsumptionChart({ readings }: ConsumptionChartProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-green-100 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-4">Consumption Trend</h3>
      {!mounted ? (
        <div className="h-[220px] bg-green-50/50 rounded-xl animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={readings} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="kwhGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #d1fae5',
                fontSize: 12,
              }}
              formatter={(value) => [`${Number(value).toLocaleString('en-IN')} kWh`, 'Energy']}
            />
            <Area
              type="monotone"
              dataKey="kwh"
              stroke="#16a34a"
              strokeWidth={2.5}
              fill="url(#kwhGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
