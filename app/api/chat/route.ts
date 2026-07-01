import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'
import { embedText } from '@/lib/embeddings'
import { retrieveKnowledge, RetrievedChunk } from '@/lib/knowledge'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const { uploadId, messages } = await request.json()

    if (!uploadId || !Array.isArray(messages)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Extract latest user message for embedding
    const latestUserMessage =
      [...messages].reverse().find((m: { role: string }) => m.role === 'user')?.content ?? ''

    // Retrieve relevant domain knowledge — gracefully degrade if unavailable
    let knowledgeChunks: RetrievedChunk[] = []
    try {
      const queryEmbedding = await embedText(latestUserMessage)
      knowledgeChunks = await retrieveKnowledge(queryEmbedding, 3)
    } catch (ragErr) {
      console.warn('[RAG] Knowledge retrieval failed, continuing without it:', ragErr)
    }

    const [uploadsResult, readingsResult, analysisResult] = await Promise.all([
      supabase.from('energy_uploads').select('*').eq('id', uploadId).single(),
      supabase.from('energy_readings').select('*').eq('upload_id', uploadId).order('created_at'),
      supabase.from('ai_analyses').select('*').eq('upload_id', uploadId).single(),
    ])

    const upload = uploadsResult.data
    const readings = (readingsResult.data ?? []) as Array<{ period: string; kwh: number; cost: number }>
    const analysis = analysisResult.data

    const buildingLine = upload?.building_name
      ? `Building: ${upload.building_name} (${upload.building_type ?? 'Commercial'}${upload.floor_area_sqft ? `, ${Number(upload.floor_area_sqft).toLocaleString()} sq ft` : ''})`
      : 'Building: Commercial building'

    const dataTable = readings
      .map((r) => `  ${r.period}: ${r.kwh} kWh, ₹${r.cost}`)
      .join('\n')

    const analysisContext = analysis
      ? `\nKey AI findings:\n- Summary: ${analysis.summary}\n- Anomalies: ${JSON.stringify(analysis.anomalies)}\n- Recommendations: ${JSON.stringify(analysis.recommendations)}\n- Total savings potential: ₹${Number(analysis.savings_total).toLocaleString('en-IN')}`
      : ''

    const knowledgeContext =
      knowledgeChunks.length > 0
        ? `\n\nRelevant domain knowledge (Indian energy standards & benchmarks):\n${knowledgeChunks
            .map((c, i) => `[${i + 1}] (${c.category}) ${c.content}`)
            .join('\n\n')}`
        : ''

    const systemPrompt = `You are an expert energy consultant answering questions about a specific building's energy data. Be concise and specific — always refer to actual numbers from the data.

${buildingLine}

Monthly energy data:
${dataTable}
${analysisContext}${knowledgeContext}

Guidelines:
- Write in plain conversational prose — no markdown, no bullet points, no headers
- Do not use #, *, or - characters for formatting
- Use short paragraphs separated by a blank line when more than one point is needed
- Answer in 2–4 sentences unless more detail is genuinely needed
- Always cite specific months, kWh figures, or ₹ amounts from the data above
- If asked for advice, give a practical action the facility manager can take this week
- When domain knowledge above is relevant, reference specific standards (BEE benchmarks, tariff rates) to add credibility
- If asked something unrelated to energy, politely redirect to the energy data
- Do not make up numbers that aren't in the data or the knowledge section above`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: systemPrompt,
      messages,
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''
    return Response.json({ reply })
  } catch (error) {
    console.error('Chat error:', error)
    return Response.json({ error: 'Failed to get response' }, { status: 500 })
  }
}
