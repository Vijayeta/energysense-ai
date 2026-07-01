import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'
import { embedText } from '@/lib/embeddings'
import { retrieveKnowledge, RetrievedChunk } from '@/lib/knowledge'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ─── Guardrail constants ───────────────────────────────────────────────────
const MIN_INPUT_LENGTH = 3
const MAX_INPUT_LENGTH = 500
const MAX_HISTORY_MESSAGES = 10
const TIMEOUT_MS = 30_000

// Guardrail 3: prompt injection patterns
const INJECTION_PATTERNS = [
  /ignore\s+(previous|prior|above)\s+instructions/i,
  /system\s*:/i,
  /you\s+are\s+now\s+/i,
  /act\s+as\s+(a\s+)?(different|new|another)/i,
  /jailbreak/i,
  /forget\s+(everything|all|previous|your)/i,
  /new\s+persona/i,
  /disregard\s+(previous|prior|all)/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /roleplay\s+as/i,
]

// Guardrail 5: clearly off-topic request patterns
const OFFTOPIC_PATTERNS = [
  /write\s+(me\s+)?(a\s+)?(poem|story|essay|song|joke|code)/i,
  /tell\s+(me\s+)?a\s+joke/i,
  /recipe\s+for/i,
  /who\s+is\s+the\s+(president|prime\s+minister)/i,
  /what\s+is\s+the\s+weather/i,
  /sports?\s+score/i,
]

// Guardrail 10: sensitive personal data patterns (Indian context)
const SENSITIVE_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,  // email
  /\b[6-9]\d{9}\b/,                                      // Indian mobile
  /\b[A-Z]{5}[0-9]{4}[A-Z]\b/,                          // PAN card
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,                   // Aadhaar
]

// ─── Helpers ───────────────────────────────────────────────────────────────

// Guardrail 9: strip HTML/script tags before processing
function sanitizeInput(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim()
}

// Guardrail 11: map errors to user-friendly messages
function classifyError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'AbortError') return 'Request timed out. Please try again.'
    const msg = error.message.toLowerCase()
    if (msg.includes('rate_limit') || msg.includes('rate limit'))
      return 'The AI is busy right now. Please try again in a few seconds.'
    if (msg.includes('overloaded'))
      return 'The AI is temporarily overloaded. Please try again shortly.'
    if (msg.includes('fetch failed') || msg.includes('econnrefused') || msg.includes('network'))
      return 'Connection issue. Please check your internet and try again.'
  }
  return 'Something went wrong. Please try again.'
}

// ─── Route handler ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { uploadId, messages } = await request.json()

    if (!uploadId || !Array.isArray(messages)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Guardrail 9: sanitize raw input before all other checks
    const rawContent =
      [...messages].reverse().find((m: { role: string }) => m.role === 'user')?.content ?? ''
    const latestUserMessage = sanitizeInput(rawContent)

    // Guardrail 4: empty input
    if (!latestUserMessage) {
      return Response.json({ error: 'Please enter a message.' }, { status: 400 })
    }

    // Guardrail 6: minimum length
    if (latestUserMessage.length < MIN_INPUT_LENGTH) {
      return Response.json(
        { error: 'Message too short. Please ask a complete question.' },
        { status: 400 }
      )
    }

    // Guardrail 2: maximum length
    if (latestUserMessage.length > MAX_INPUT_LENGTH) {
      return Response.json(
        { error: `Message too long (${latestUserMessage.length} chars). Please keep it under ${MAX_INPUT_LENGTH} characters.` },
        { status: 400 }
      )
    }

    // Guardrail 10: sensitive data warning
    if (SENSITIVE_PATTERNS.some((p) => p.test(latestUserMessage))) {
      return Response.json(
        { error: "Please don't share personal information (email, phone, PAN, Aadhaar) in chat." },
        { status: 400 }
      )
    }

    // Guardrail 3: prompt injection
    if (INJECTION_PATTERNS.some((p) => p.test(latestUserMessage))) {
      return Response.json(
        { error: "I'm here to help with your energy data. Please ask about your building's consumption, costs, or savings." },
        { status: 400 }
      )
    }

    // Guardrail 5: off-topic hard block
    if (OFFTOPIC_PATTERNS.some((p) => p.test(latestUserMessage))) {
      return Response.json(
        { error: 'I can only help with questions about your energy data — consumption patterns, costs, or savings opportunities.' },
        { status: 400 }
      )
    }

    // Guardrail 8: duplicate message — return cached reply instantly
    const userMessages = messages.filter((m: { role: string }) => m.role === 'user')
    if (userMessages.length >= 2) {
      const last = userMessages[userMessages.length - 1]?.content
      const prev = userMessages[userMessages.length - 2]?.content
      if (last && last === prev) {
        const lastAssistant = [...messages]
          .reverse()
          .find((m: { role: string }) => m.role === 'assistant')
        if (lastAssistant) return Response.json({ reply: lastAssistant.content })
      }
    }

    // Guardrail 1: cap history sent to Claude
    const trimmedMessages = messages.slice(-MAX_HISTORY_MESSAGES)

    // RAG retrieval — gracefully degrade if unavailable
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
- Always cite specific months, kWh figures, or ₹ amounts from the data above
- Whenever you perform a calculation, show the working inline in plain text. For example: "August consumed 1,850 kWh against a monthly average of 950 kWh, so (1850 - 950) / 950 × 100 = 94.7% above average — an extra ₹7,200 at your current rate."
- For savings estimates, show the formula: consumption figure × efficiency gain % × tariff rate = annual ₹ saving
- If asked for advice, give a practical action the facility manager can take this week
- When domain knowledge above is relevant, reference specific standards (BEE benchmarks, tariff rates) to add credibility
- If asked something unrelated to energy, politely redirect to the energy data
- Do not make up numbers that aren't in the data or the knowledge section above`

    // Guardrail 7: 30-second timeout on Claude API call
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS)

    let response
    try {
      response = await anthropic.messages.create(
        {
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: systemPrompt,
          messages: trimmedMessages,
        },
        { signal: abortController.signal }
      )
    } finally {
      clearTimeout(timeoutId)
    }

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''
    return Response.json({ reply })
  } catch (error) {
    console.error('Chat error:', error)
    // Guardrail 11: friendly error classification
    return Response.json({ error: classifyError(error) }, { status: 500 })
  }
}
