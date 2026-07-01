import { supabase } from '@/lib/supabase'

export interface KnowledgeChunk {
  content: string
  category: string
  source: string
}

export const KNOWLEDGE_CHUNKS: KnowledgeChunk[] = [
  // --- Indian Tariff Structures ---
  {
    category: 'tariff',
    source: 'CEA Tariff Order 2024 / Generic DISCOM HT Commercial',
    content:
      'Indian High-Tension (HT) commercial consumers (11 kV and above) typically pay a two-part tariff: a fixed demand charge (₹300–₹600 per kVA of contracted demand per month, varies by DISCOM) plus an energy charge (₹6–₹10 per kWh). The demand charge is levied on the highest 15-minute kVA recorded in the billing cycle, so even a brief peak can inflate the monthly bill significantly. Reducing contracted demand or flattening load curves through demand-response measures can save ₹50,000–₹2,00,000 per year for a typical 200–500 kVA commercial building.',
  },
  {
    category: 'tariff',
    source: 'TNERC / MERC / RERC ToD Orders 2022–2024',
    content:
      'Time-of-Day (ToD) or Time-of-Use (TOU) tariffs are now mandatory for HT consumers in most Indian states. Peak hours (typically 06:00–10:00 and 18:00–22:00) attract a 20–50% surcharge on the base energy rate, while off-peak (22:00–06:00) earns a 10–20% rebate. Shifting energy-intensive processes (chiller pre-cooling, EV charging, pump operations) to off-peak windows can reduce effective energy costs by 8–15% annually without any capital expenditure.',
  },
  {
    category: 'tariff',
    source: 'Indian Electricity Act / DISCOM Power Factor Regulations',
    content:
      'Most Indian DISCOMs impose a power factor penalty when the monthly average power factor falls below 0.90 or 0.95 (threshold varies by state). Penalty surcharges range from 1% to 3% of the energy bill per 0.01 drop in power factor below the threshold. Conversely, a power factor above 0.95 often earns a 0.5–1% rebate per 0.01 improvement. Installing capacitor banks sized to the reactive load typically has a payback period of 12–18 months for buildings with inductive motor loads.',
  },
  {
    category: 'tariff',
    source: 'MSEDCL / BESCOM / BSEB LT Commercial Slabs 2024',
    content:
      'Low-Tension (LT) commercial connections follow progressive slab tariffs. A representative slab structure: first 500 units/month at ₹5.50/kWh, next 500 units at ₹7.00/kWh, above 1000 units at ₹8.50/kWh. Because of this step structure, load shifting out of a billing month (e.g., pre-cooling before month-end) can move consumption from higher to lower slabs. Buildings crossing slab thresholds near month-end benefit most from active energy monitoring.',
  },

  // --- BEE EUI Benchmarks ---
  {
    category: 'bee_benchmark',
    source: 'BEE Star Rating Program for Commercial Buildings 2023',
    content:
      'BEE (Bureau of Energy Efficiency) benchmarks annual Energy Use Intensity (EUI) for Office buildings in India at 100–150 kWh/sqm/year for a 1-star rating and below 75 kWh/sqm/year for a 5-star rating. A best-practice conditioned office in a hot-dry climate (Delhi/Rajasthan) achieves 60–70 kWh/sqm/year; in a warm-humid climate (Mumbai/Chennai) the benchmark is 80–90 kWh/sqm/year due to higher cooling loads. EUI above 160 kWh/sqm/year in an office indicates major inefficiency, typically in HVAC or lighting.',
  },
  {
    category: 'bee_benchmark',
    source: 'BEE Star Rating Program — Hospital Buildings 2023',
    content:
      'Hospitals and healthcare facilities have the highest EUI benchmarks among all commercial building types in India. A 5-star rated hospital achieves 150–180 kWh/sqm/year; typical hospitals operate at 250–350 kWh/sqm/year. 24/7 HVAC requirements, medical equipment, and stringent ventilation (12–15 air changes/hour in OT) drive the high baseline. BEE recommends hospitals focus on heat recovery ventilation, occupancy-zoned HVAC, and LED replacement in wards (current LPD often 12–15 W/sqm, BEE target ≤ 8 W/sqm).',
  },
  {
    category: 'bee_benchmark',
    source: 'BEE Star Rating Program — Retail / Shopping Centres 2023',
    content:
      'BEE benchmarks for Retail/Shopping Centres (air-conditioned): 5-star ≤ 110 kWh/sqm/year, 3-star 130–160 kWh/sqm/year, below 1-star > 200 kWh/sqm/year. Retail buildings are dominated by lighting (typically 35–45% of total energy) and HVAC (40–50%). Key levers: reducing installed lighting power density (LPD) from the common 18–25 W/sqm to BEE ECBC target of ≤ 10 W/sqm, and demand-controlled ventilation tied to occupancy sensors in mall common areas.',
  },
  {
    category: 'bee_benchmark',
    source: 'BEE ECBC 2017 — Schools and Educational Buildings',
    content:
      'Educational buildings (schools, colleges) have a BEE EUI benchmark of 40–60 kWh/sqm/year, one of the lowest among commercial types because they typically operate 8–10 hours/day and are unoccupied on weekends and holidays. An EUI above 80 kWh/sqm/year for a school signals substantial after-hours consumption (equipment left on, HVAC not scheduled) or overcooling. Lighting represents 45–55% of school energy; LED retrofit with daylight-linked dimming controls typically delivers 50–60% lighting energy savings.',
  },
  {
    category: 'bee_benchmark',
    source: 'BEE Warehousing / Industrial Buildings Benchmark 2022',
    content:
      'Warehouses and storage facilities have the lowest commercial EUI benchmarks: BEE best practice is 15–30 kWh/sqm/year for non-refrigerated warehouses. Cold-storage warehouses range from 150–300 kWh/sqm/year depending on temperature setpoints. For non-refrigerated warehouses, >40 kWh/sqm/year indicates significant inefficiency (pumping, material handling, or excessive lighting hours). Roof insulation and cool-roof coatings (SRI > 78) can reduce cooling loads by 10–15% in Indian climate conditions.',
  },

  // --- HVAC Optimization ---
  {
    category: 'hvac',
    source: 'ASHRAE 90.1 / BEE HVAC Guidelines India',
    content:
      'Centrifugal and screw chiller efficiency is measured in COP (Coefficient of Performance) or kW/TR (kilowatts per ton of refrigeration). BEE minimum standard for chillers above 200 TR is 0.65 kW/TR (COP ≈ 5.4); best-in-class magnetic bearing chillers achieve 0.37–0.45 kW/TR at full load. For a typical Indian commercial building, raising chilled water supply temperature from 6°C to 7°C increases chiller COP by approximately 2–3% per °C with no perceptible comfort impact. Every 1°C increase in chilled water supply temperature saves roughly 2–3% on HVAC energy.',
  },
  {
    category: 'hvac',
    source: 'BEE Energy Audit Manual — HVAC Section',
    content:
      'Variable Frequency Drives (VFDs) on chilled water pumps and cooling tower fans represent one of the highest-ROI HVAC investments for Indian commercial buildings. Fan and pump power scales with the cube of flow/speed: reducing speed by 20% cuts power by ~49%. A 100 TR system with constant-speed secondary pumps running at 60% average load can save ₹1,50,000–₹2,50,000 annually by installing VFDs. Typical installed cost: ₹800–₹1,200 per kW of motor rating. Payback is typically 18–30 months.',
  },
  {
    category: 'hvac',
    source: 'NBC 2016 / ASHRAE 55 Thermal Comfort in Indian Context',
    content:
      'Overcooling is a pervasive problem in Indian commercial buildings. The ASHRAE 55 adaptive comfort model allows thermostat setpoints of 24–26°C (PMV neutral) in mixed-mode and mechanically conditioned Indian offices. Each 1°C increase in thermostat setpoint saves approximately 6–8% in HVAC energy for a building in a tropical climate zone. Raising setpoints from the common 21–22°C to 24–25°C can alone save 15–25% on HVAC costs, equivalent to ₹80,000–₹2,00,000/year for a mid-sized office.',
  },

  // --- Lighting ---
  {
    category: 'lighting',
    source: 'BEE ECBC 2017 / EESL LED Program India',
    content:
      'LED retrofit of fluorescent tube lights (T8/T5) is the single fastest-payback energy project in Indian commercial buildings. Replacing a 36W T8 fluorescent tube (including ballast losses, ~48W system) with a 16–18W LED tube of equivalent lumen output saves ₹800–₹1,200 per tube per year at ₹8/kWh over 3,000 operating hours. A 5,000 sqm office with 500 fixtures can save ₹4,00,000–₹6,00,000 annually. EESL (Energy Efficiency Services Ltd.) offers zero-upfront ESCO models for bulk LED replacement.',
  },
  {
    category: 'lighting',
    source: 'BEE ECBC 2017 — Lighting Power Density Standards',
    content:
      'BEE ECBC 2017 specifies Lighting Power Density (LPD) limits by space type. Key limits: Office general areas ≤ 10 W/sqm; Retail showrooms ≤ 14 W/sqm; Corridors and lobbies ≤ 5 W/sqm; Warehouses ≤ 8 W/sqm; Classrooms ≤ 9 W/sqm. Many older Indian buildings operate at 18–30 W/sqm with fluorescent fittings. Achieving ECBC LPD through LED + controls typically reduces lighting energy by 50–70%. Occupancy sensors in conference rooms and toilets alone save 20–30% of those zones\' lighting energy.',
  },

  // --- Energy Audit Types ---
  {
    category: 'audit',
    source: 'BEE Energy Audit Regulations under EC Act 2001',
    content:
      'BEE mandates three energy audit levels for Indian commercial and industrial facilities. Level 1 (Walk-through audit): visual inspection, utility bill analysis, EUI benchmarking — typically 1–2 days, cost ₹20,000–₹50,000, identifies 3–5 high-level opportunities. Level 2 (Detailed audit): sub-metering, equipment efficiency measurement, full energy balance — 1–2 weeks, cost ₹50,000–₹2,00,000, identifies all major savings opportunities with financial analysis. Level 3 (Investment-grade audit): detailed engineering analysis, precise savings verification, bankable for financing — 4–8 weeks, cost ₹2,00,000–₹10,00,000, used for ESCO contracts and bank lending.',
  },

  // --- Operations ---
  {
    category: 'operations',
    source: 'BEE Energy Audit Manual — Base Load Analysis',
    content:
      'After-hours base load (the electricity consumed between midnight and 5:00 AM on a weekday) reveals parasitic losses that are entirely avoidable. In a well-managed Indian office, base load should not exceed 10–15% of peak-day consumption. Common culprits: UPS systems kept powered for unused servers (draws 200–500W per UPS at 0% load), HVAC running in unoccupied areas (chiller minimum load ~30% of rated capacity even with no cooling demand), vending machines without timers, and display lighting left on overnight. A simple midnight check on smart meters can identify ₹30,000–₹1,50,000 in annual waste.',
  },
  {
    category: 'operations',
    source: 'POSOCO / NLDC Demand Response Framework India 2023',
    content:
      'Demand response (DR) programs allow Indian HT consumers to curtail load during grid stress events in exchange for incentive payments or bill credits. Under POSOCO\'s ancillary services mechanism, participants reducing load by ≥ 100 kW within 15 minutes can earn ₹5–₹20 per kWh of curtailed energy. Building-level DR strategies include: raising chiller setpoints by 2°C for 30–60 minutes (pre-cooled thermal mass provides comfort buffer), dimming non-critical lighting by 20%, and deferring non-urgent pumping cycles. A 500 kVA office enrolling in DR can earn ₹50,000–₹1,50,000 per year in grid-support payments.',
  },

  // --- Solar PV ---
  {
    category: 'solar',
    source: 'MNRE Rooftop Solar Guidelines 2023 / CEEW India Solar Atlas',
    content:
      'India receives 4.5–6.5 kWh/sqm/day of solar irradiance depending on location: Rajasthan/Gujarat (6.0–6.5), Maharashtra/Karnataka (5.5–6.0), Tamil Nadu (5.5–5.8), Delhi NCR (5.0–5.5), West Bengal/Odisha (4.5–5.0). A standard rooftop PV system in India generates approximately 1,200–1,600 kWh per kWp installed per year. A 100 kWp rooftop system (requiring ~600–700 sqm of shadow-free roof) costs ₹50–₹70 lakh installed, generates 1.3–1.5 lakh kWh/year, and at ₹8/kWh grid offset saves ₹10–₹12 lakh/year. Net metering under MNRE guidelines allows export of surplus generation, with payback of 4–6 years.',
  },
  {
    category: 'solar',
    source: 'PM Surya Ghar / MNRE RESCO Model 2024',
    content:
      'For Indian commercial buildings that cannot afford upfront solar capital expenditure, RESCO (Renewable Energy Service Company) and PPA (Power Purchase Agreement) models are available. Under a PPA, the developer installs solar at zero cost and sells power at ₹4–₹6/kWh (vs. grid rate of ₹7–₹10/kWh), delivering immediate savings of 20–40% on solar-covered units. MNRE\'s PM Surya Ghar scheme provides subsidies for installations up to 10 kWp for commercial micro-enterprises. Group captive models allow commercial parks to share a larger solar plant and claim the ₹/unit benefit without roof ownership.',
  },

  // --- ISO 50001 / BEE Star Label ---
  {
    category: 'iso',
    source: 'ISO 50001:2018 / BEE Star Label Program for Buildings',
    content:
      'ISO 50001:2018 Energy Management Systems (EnMS) provides a Plan-Do-Check-Act framework for continuous energy improvement. Certified organisations report a median 10% energy savings in the first 3 years. Mandatory elements: energy policy, energy baseline (EnB), energy performance indicators (EnPIs), energy targets, and internal energy audits. In India, the BEE Star Label for commercial buildings (1–5 star) is based on EUI benchmarks and serves as the equivalent national certification. Star-labelled buildings in Tier-1 cities command 5–8% higher lease premiums and improve ESG disclosures under SEBI BRSR requirements.',
  },
]

// ---------------------------------------------------------------------------
// Retrieval
// ---------------------------------------------------------------------------

export interface RetrievedChunk {
  id: number
  content: string
  category: string
  similarity: number
}

export async function retrieveKnowledge(
  queryEmbedding: number[],
  matchCount: number = 3
): Promise<RetrievedChunk[]> {
  const { data, error } = await supabase.rpc('match_knowledge_chunks', {
    query_embedding: queryEmbedding,
    match_count: matchCount,
  })

  if (error) {
    console.warn('[RAG] retrieveKnowledge RPC error:', error.message)
    return []
  }

  return (data ?? []) as RetrievedChunk[]
}
