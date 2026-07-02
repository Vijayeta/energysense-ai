import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Zap, Activity, DollarSign, Leaf, ArrowLeft, AlertTriangle, Building2, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { EnergyReading, ClaudeAnalysis } from '@/types'
import KPICard from '@/components/KPICard'
import ConsumptionChart from '@/components/ConsumptionChart'
import AnomalyAlert from '@/components/AnomalyAlert'
import RecommendationCard from '@/components/RecommendationCard'
import SavingsTable from '@/components/SavingsTable'
import ShareButton from '@/components/ShareButton'
import EnergyChat from '@/components/EnergyChat'

interface Props {
  params: Promise<{ id: string }>
}

function calcTrend(current: number, previous: number): number | null {
  if (!previous || previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

function AISummaryCard({ summary }: { summary: string }) {
  const blocks = summary.split('\n\n')
  const header = blocks[0] ?? ''
  const observation = blocks[1] ?? ''
  const isCritical = header.includes('⚠')

  const parseLabeled = (block: string) => {
    const idx = block.indexOf('\n')
    if (idx === -1) return { label: '', value: block }
    return { label: block.slice(0, idx).replace(':', '').trim(), value: block.slice(idx + 1).trim() }
  }

  const cause    = parseLabeled(blocks[2] ?? '')
  const impact   = parseLabeled(blocks[3] ?? '')
  const priority = parseLabeled(blocks[4] ?? '')
  const action   = parseLabeled(blocks[5] ?? '')

  return (
    <div className="rounded-2xl bg-green-50 border border-green-200 p-4 sm:p-5">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="h-3 w-3 text-green-600" />
        <p className="text-xs font-semibold uppercase tracking-widest text-green-600">AI Summary</p>
      </div>
      <p className={`text-sm font-bold mb-1 ${isCritical ? 'text-amber-700' : 'text-green-700'}`}>
        {header}
      </p>
      <p className="text-sm text-gray-700 leading-relaxed mb-4">{observation}</p>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{cause.label}</p>
          <p className="text-sm text-gray-700">{cause.value}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{impact.label}</p>
          <p className="text-sm text-gray-700">{impact.value}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{priority.label}</p>
          <p className="text-sm text-gray-700">{priority.value}</p>
        </div>
      </div>
      <div className="flex items-start gap-2 pt-3 border-t border-green-200">
        <span className="text-green-600 font-bold text-sm shrink-0 mt-0.5">→</span>
        <p className="text-sm text-gray-700 leading-relaxed">{action.value}</p>
      </div>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-1 h-5 bg-green-600 rounded-full" />
      <h2 className="text-base font-semibold text-gray-800">{children}</h2>
    </div>
  )
}

export default async function DashboardPage({ params }: Props) {
  const { id } = await params

  const [uploadsResult, readingsResult, analysisResult] = await Promise.all([
    supabase.from('energy_uploads').select('*').eq('id', id).single(),
    supabase.from('energy_readings').select('*').eq('upload_id', id).order('created_at'),
    supabase.from('ai_analyses').select('*').eq('upload_id', id).single(),
  ])

  if (uploadsResult.error || !uploadsResult.data) {
    notFound()
  }

  const readings = (readingsResult.data ?? []) as EnergyReading[]
  const analysis = analysisResult.data as (ClaudeAnalysis & { savings_total: number }) | null

  const totalKwh = readings.reduce((sum, r) => sum + Number(r.kwh), 0)
  const totalCost = readings.reduce((sum, r) => sum + Number(r.cost), 0)
  const avgMonthlyKwh = readings.length > 0 ? Math.round(totalKwh / readings.length) : 0
  const savingsPotential = analysis?.savings_total ?? 0

  const floorArea = uploadsResult.data.floor_area_sqft ? Number(uploadsResult.data.floor_area_sqft) : null
  const energyIntensity =
    floorArea && floorArea > 0 && readings.length > 0
      ? (totalKwh / floorArea / readings.length).toFixed(2)
      : null

  const lastReading = readings[readings.length - 1]
  const prevReading = readings[readings.length - 2]
  const kwhTrend = lastReading && prevReading
    ? calcTrend(Number(lastReading.kwh), Number(prevReading.kwh))
    : null
  const costTrend = lastReading && prevReading
    ? calcTrend(Number(lastReading.cost), Number(prevReading.cost))
    : null

  const bestMonth  = readings.length > 0 ? readings.reduce((min, r) => Number(r.kwh) < Number(min.kwh) ? r : min) : null
  const worstMonth = readings.length > 0 ? readings.reduce((max, r) => Number(r.kwh) > Number(max.kwh) ? r : max) : null
  const worstVsBest = bestMonth && worstMonth && Number(bestMonth.kwh) > 0
    ? Math.round(((Number(worstMonth.kwh) - Number(bestMonth.kwh)) / Number(bestMonth.kwh)) * 100)
    : null


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="EnergySense AI" className="h-20 w-auto" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <ShareButton />
            <Link
              href="/"
              className="flex items-center gap-1 sm:gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">New upload</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Building identity */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1.5 bg-green-100 rounded-lg">
            <Building2 className="h-4 w-4 text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
            {uploadsResult.data.building_name ?? 'Energy Dashboard'}
          </h1>
          {uploadsResult.data.building_type && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
              {uploadsResult.data.building_type}
            </span>
          )}
          {uploadsResult.data.floor_area_sqft && (
            <span className="text-xs text-gray-400">
              {Number(uploadsResult.data.floor_area_sqft).toLocaleString('en-IN')} sq ft
            </span>
          )}
        </div>

        {/* AI Summary Banner */}
        {analysis?.summary && <AISummaryCard summary={analysis.summary} />}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <KPICard
            title="Total Consumption"
            value={`${totalKwh.toLocaleString('en-IN')} kWh`}
            subtitle={`${readings.length} months`}
            icon={Activity}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            accent="bg-green-500"
            trend={kwhTrend}
          />
          <KPICard
            title="Total Cost"
            value={`₹${totalCost.toLocaleString('en-IN')}`}
            subtitle="All periods"
            icon={DollarSign}
            iconColor="text-orange-600"
            iconBg="bg-orange-50"
            accent="bg-green-500"
            trend={costTrend}
          />
          <KPICard
            title="Monthly Average"
            value={energyIntensity ? `${energyIntensity} kWh/sq ft` : `${avgMonthlyKwh.toLocaleString('en-IN')} kWh`}
            subtitle={energyIntensity ? 'Per sq ft per month' : 'Per month'}
            icon={Zap}
            iconColor="text-yellow-600"
            iconBg="bg-yellow-50"
            accent="bg-green-500"
          />
          <KPICard
            title="Savings Potential"
            value={`₹${savingsPotential.toLocaleString('en-IN')}`}
            subtitle="Annual estimate"
            icon={Leaf}
            iconColor="text-green-600"
            iconBg="bg-green-50"
            accent="bg-green-500"
            invertTrend
          />
        </div>

        {/* Chart */}
        <ConsumptionChart readings={readings} />

        {/* Best / Worst month callout */}
        {bestMonth && worstMonth && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
              <span className="text-green-500 text-lg leading-none mt-0.5">↓</span>
              <div>
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-0.5">Best Month</p>
                <p className="text-sm font-semibold text-gray-800">{bestMonth.period}</p>
                <p className="text-xs text-gray-500">{Number(bestMonth.kwh).toLocaleString('en-IN')} kWh</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              <span className="text-red-400 text-lg leading-none mt-0.5">↑</span>
              <div>
                <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-0.5">Worst Month</p>
                <p className="text-sm font-semibold text-gray-800">{worstMonth.period}</p>
                <p className="text-xs text-gray-500">
                  {Number(worstMonth.kwh).toLocaleString('en-IN')} kWh
                  {worstVsBest !== null && <span className="text-red-500 font-medium"> · {worstVsBest}% above best</span>}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AI analysis failed state */}
        {!analysis && (
          <div className="flex gap-3 p-5 rounded-2xl border border-amber-200 bg-amber-50">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">AI analysis could not be completed</p>
              <p className="text-sm text-amber-700 mt-1">
                Your energy data was saved but the AI failed to generate insights.{' '}
                <Link href="/" className="underline font-medium">
                  Try uploading again
                </Link>
                .
              </p>
            </div>
          </div>
        )}

        {/* Anomalies */}
        {analysis && analysis.anomalies.length > 0 && (
          <div>
            <SectionHeading>AI Insights</SectionHeading>
            <div className="space-y-2.5">
              {analysis.anomalies.map((anomaly, i) => (
                <AnomalyAlert key={i} anomaly={anomaly} />
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {analysis && analysis.recommendations.length > 0 && (
          <div>
            <SectionHeading>Recommended Actions</SectionHeading>
            <div className="space-y-2.5">
              {analysis.recommendations.map((rec, i) => (
                <RecommendationCard key={i} recommendation={rec} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Savings Table */}
        {analysis && analysis.recommendations.length > 0 && (
          <div>
            <SectionHeading>Savings Estimator</SectionHeading>
            <SavingsTable
              recommendations={analysis.recommendations}
              savingsTotal={analysis.savings_total}
            />
          </div>
        )}

      </main>

      {/* Floating AI chat widget */}
      <EnergyChat uploadId={id} />
    </div>
  )
}
