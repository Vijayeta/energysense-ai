/**
 * One-time seeding script — embeds all KNOWLEDGE_CHUNKS via Voyage AI
 * and upserts them into the knowledge_chunks Supabase table.
 *
 * Run with: npx tsx scripts/seed-knowledge.ts
 *
 * Prerequisites:
 *   - SUPABASE_URL, SUPABASE_ANON_KEY, VOYAGE_API_KEY set in .env.local
 *   - Supabase SQL already run (pgvector extension + knowledge_chunks table)
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load env vars BEFORE any module that reads process.env is imported
config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env.local')
  process.exit(1)
}
if (!process.env.VOYAGE_API_KEY) {
  console.error('ERROR: VOYAGE_API_KEY must be set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  // Dynamic imports INSIDE the async function — dotenv has already run by now,
  // so lib/knowledge.ts → lib/supabase.ts sees the env vars when it calls createClient()
  const { KNOWLEDGE_CHUNKS } = await import('../lib/knowledge.js')
  const { embedBatch } = await import('../lib/embeddings.js')

  console.log(`\n[seed] Seeding knowledge base — ${KNOWLEDGE_CHUNKS.length} chunks`)

  console.log('[seed] Calling Voyage AI to embed all chunks...')
  const texts = KNOWLEDGE_CHUNKS.map((c) => c.content)
  let embeddings: number[][]

  try {
    embeddings = await embedBatch(texts)
  } catch (err) {
    console.error('[seed] Voyage AI embedding failed:', err)
    process.exit(1)
  }

  console.log(`[seed] Received ${embeddings.length} embeddings (${embeddings[0].length}d each)`)

  console.log('[seed] Clearing existing rows...')
  const { error: deleteError } = await supabase
    .from('knowledge_chunks')
    .delete()
    .neq('id', 0)

  if (deleteError) {
    console.error('[seed] Failed to clear table:', deleteError.message)
    process.exit(1)
  }

  const rows = KNOWLEDGE_CHUNKS.map((chunk, i) => ({
    content: chunk.content,
    embedding: embeddings[i],
    category: chunk.category,
    source: chunk.source,
  }))

  console.log('[seed] Inserting rows...')
  const { error: insertError, data } = await supabase
    .from('knowledge_chunks')
    .insert(rows)
    .select('id, category')

  if (insertError) {
    console.error('[seed] Insert failed:', insertError.message)
    process.exit(1)
  }

  const byCategory = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + 1
    return acc
  }, {})

  console.log(`\n[seed] Inserted ${data?.length ?? rows.length} chunks:`)
  for (const [cat, count] of Object.entries(byCategory)) {
    console.log(`  ${cat.padEnd(20)} ${count}`)
  }
  console.log('\n[seed] Done. Knowledge base is ready.\n')
}

seed().catch((err) => {
  console.error('[seed] Unexpected error:', err)
  process.exit(1)
})
