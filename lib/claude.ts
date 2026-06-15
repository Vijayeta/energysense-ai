import Anthropic from '@anthropic-ai/sdk'
import { EnergyReading, ClaudeAnalysis } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const MAX_RETRIES = 2
const VALID_SEVERITIES = new Set(['high', 'medium', 'low'])
const VALID_CATEGORIES = ['HVAC', 'Lighting', 'Equipment', 'Operations'] as const

interface BuildingContext {
  buildingName: string
  buildingType: string
  floorAreaSqft?: number
}

interface EvalResult {
  data: ClaudeAnalysis
  autoFixes: string[]
  failures: string[]
}

function evalAndFix(raw: unknown): EvalResult {
  const autoFixes: string[] = []
  const failures: string[] = []

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    failures.push('Response is not a JSON object')
    return { data: raw as ClaudeAnalysis, autoFixes, failures }
  }

  const d = raw as Record<string, unknown>

  // --- Schema completeness ---
  if (typeof d.summary !== 'string' || !d.summary.trim()) {
    failures.push('Missing or empty "summary" field')
  }
  if (!Array.isArray(d.anomalies)) {
    failures.push('"anomalies" must be an array')
  }
  if (!Array.isArray(d.recommendations)) {
    failures.push('"recommendations" must be an array')
  }
  if (typeof d.savings_total !== 'number') {
    failures.push('"savings_total" must be a number')
  }

  if (failures.length > 0) {
    return { data: d as unknown as ClaudeAnalysis, autoFixes, failures }
  }

  const anomalies = d.anomalies as Array<Record<string, unknown>>
  const recommendations = d.recommendations as Array<Record<string, unknown>>

  // --- Count bounds ---
  if (anomalies.length < 2) {
    failures.push(`Too few anomalies: got ${anomalies.length}, need at least 2`)
  } else if (anomalies.length > 4) {
    d.anomalies = anomalies.slice(0, 4)
    autoFixes.push(`Truncated anomalies from ${anomalies.length} to 4`)
  }

  if (recommendations.length < 3) {
    failures.push(`Too few recommendations: got ${recommendations.length}, need at least 3`)
  } else if (recommendations.length > 4) {
    d.recommendations = recommendations.slice(0, 4)
    autoFixes.push(`Truncated recommendations from ${recommendations.length} to 4`)
  }

  // --- Severity constraint (auto-fix case, fail on unknown value) ---
  for (let i = 0; i < anomalies.length; i++) {
    const sev = anomalies[i].severity
    if (typeof sev === 'string') {
      const lower = sev.toLowerCase()
      if (VALID_SEVERITIES.has(lower)) {
        if (sev !== lower) {
          anomalies[i].severity = lower
          autoFixes.push(`Anomaly ${i}: corrected severity case "${sev}" → "${lower}"`)
        }
      } else {
        failures.push(`Anomaly ${i}: invalid severity "${sev}" — must be high, medium, or low`)
      }
    } else {
      failures.push(`Anomaly ${i}: severity field is missing`)
    }
  }

  // --- Category constraint (auto-fix case, fail on unknown value) ---
  for (let i = 0; i < recommendations.length; i++) {
    const cat = recommendations[i].category
    if (typeof cat === 'string') {
      const match = VALID_CATEGORIES.find((c) => c.toLowerCase() === cat.toLowerCase())
      if (match) {
        if (cat !== match) {
          recommendations[i].category = match
          autoFixes.push(`Recommendation ${i}: corrected category case "${cat}" → "${match}"`)
        }
      } else {
        failures.push(
          `Recommendation ${i}: invalid category "${cat}" — must be one of: ${VALID_CATEGORIES.join(', ')}`
        )
      }
    } else {
      failures.push(`Recommendation ${i}: category field is missing`)
    }
  }

  // --- Savings math (always auto-fix) ---
  const computedTotal = (d.recommendations as Array<Record<string, unknown>>).reduce(
    (sum, r) => sum + (typeof r.savings_annual === 'number' ? r.savings_annual : 0),
    0
  )
  const reportedTotal = d.savings_total as number
  if (Math.abs(computedTotal - reportedTotal) > 1000) {
    d.savings_total = computedTotal
    autoFixes.push(
      `Corrected savings_total: ₹${reportedTotal.toLocaleString('en-IN')} → ₹${computedTotal.toLocaleString('en-IN')} (recalculated from individual savings_annual values)`
    )
  }

  return { data: d as unknown as ClaudeAnalysis, autoFixes, failures }
}

function buildPrompt(
  readings: EnergyReading[],
  building?: BuildingContext
): string {
  const tableText = readings
    .map((r) => `${r.period}: ${r.kwh} kWh, ₹${r.cost}`)
    .join('\n')

  const buildingLine = building
    ? `Building: ${building.buildingName} (${building.buildingType}${building.floorAreaSqft ? `, ${building.floorAreaSqft.toLocaleString()} sq ft` : ''})`
    : 'Building: Commercial building (type unknown)'

  return `You are an expert energy consultant analyzing commercial building energy data in India.

${buildingLine}

Monthly energy consumption data:
${tableText}

Analyze this data and respond with ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "summary": "Write exactly 6 blocks separated by \\n\\n in this exact format:\n1. '⚠ Critical Finding' if any high-severity anomaly exists, otherwise '✓ Healthy Performance'\n2. One or two sentences: name the highest-consumption month, its exact kWh value, and the % above monthly average or seasonal baseline\n3. 'Likely Cause:\\n' followed by a short phrase (e.g. HVAC inefficiency or after-hours operation)\n4. 'Potential Impact:\\n' followed by an estimated ₹ range of avoidable cost (e.g. ₹35,000–40,000 avoidable cost)\n5. 'Priority:\\nHigh' or 'Priority:\\nMedium' or 'Priority:\\nLow' based on severity\n6. 'Recommended Action:\\n' followed by one sentence on what the facility manager should do first",
  "anomalies": [
    {
      "title": "Short anomaly title (5-8 words)",
      "description": "Plain English explanation of the anomaly, its likely cause for this type of building, and business impact",
      "severity": "high"
    }
  ],
  "recommendations": [
    {
      "category": "HVAC",
      "action": "Specific, actionable recommendation tailored to this building type that a facility manager can implement",
      "savings_annual": 180000,
      "rationale": "Why this saves energy for this specific building type and the estimated impact"
    }
  ],
  "savings_total": 315000
}

Rules:
- severity must be exactly "high", "medium", or "low"
- savings_annual values must be realistic estimates in Indian Rupees (₹) calibrated to the building size and type
- Identify 2-4 anomalies based on actual data patterns (spikes, base load issues, weekend consumption)
- Provide 3-4 specific recommendations tailored to the building type (${building?.buildingType ?? 'commercial'}) with realistic annual ₹ savings (range: ₹50,000 to ₹3,00,000 each)
- savings_total must equal the exact sum of all savings_annual values
- category must be one of: HVAC, Lighting, Equipment, Operations
- Respond with ONLY the raw JSON object, no markdown fences, no explanation text`
}

export async function analyzeEnergyData(
  readings: EnergyReading[],
  building?: BuildingContext
): Promise<ClaudeAnalysis> {
  const conversation: Anthropic.MessageParam[] = [
    { role: 'user', content: buildPrompt(readings, building) },
  ]

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: conversation,
    })

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    const jsonText = rawText.replace(/^```json?\n?/, '').replace(/\n?```$/, '')

    // Keep Claude's response in conversation for multi-turn correction
    conversation.push({ role: 'assistant', content: rawText })

    // --- JSON parse ---
    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText)
    } catch (e) {
      const parseError = `Response is not valid JSON: ${(e as Error).message}`
      console.error(`[Eval] Attempt ${attempt}/${MAX_RETRIES + 1} — JSON parse failed: ${parseError}`)

      if (attempt <= MAX_RETRIES) {
        conversation.push({
          role: 'user',
          content: `Your response could not be parsed as JSON. Error: ${parseError}\n\nReturn ONLY a valid JSON object — no markdown, no explanation text.`,
        })
        continue
      }
      throw new Error(`Claude returned unparseable JSON after ${attempt} attempt(s)`)
    }

    // --- Structural evals ---
    const { data, autoFixes, failures } = evalAndFix(parsed)

    if (autoFixes.length > 0) {
      console.log(`[Eval] Attempt ${attempt} auto-fixes:`, autoFixes)
    }

    if (failures.length === 0) {
      if (attempt > 1) {
        console.log(`[Eval] Passed on attempt ${attempt} after ${attempt - 1} retry(s)`)
      }
      return data
    }

    console.error(`[Eval] Attempt ${attempt}/${MAX_RETRIES + 1} failures:`, failures)

    if (attempt <= MAX_RETRIES) {
      conversation.push({
        role: 'user',
        content: `Your response failed these validation checks:\n${failures.map((f) => `- ${f}`).join('\n')}\n\nPlease return a corrected JSON object that fixes all of the above issues.`,
      })
    } else {
      throw new Error(
        `Claude response failed structural evals after ${attempt} attempt(s). Failures: ${failures.join(' | ')}`
      )
    }
  }

  throw new Error('analyzeEnergyData: exceeded retry limit')
}
