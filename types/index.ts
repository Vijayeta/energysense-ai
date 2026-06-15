export interface EnergyReading {
  period: string
  kwh: number
  cost: number
}

export interface Anomaly {
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
}

export interface Recommendation {
  category: string
  action: string
  savings_annual: number
  rationale: string
}

export interface ClaudeAnalysis {
  summary: string
  anomalies: Anomaly[]
  recommendations: Recommendation[]
  savings_total: number
}
