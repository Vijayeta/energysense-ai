const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'
const VOYAGE_MODEL = 'voyage-3-lite'

interface VoyageEmbeddingResponse {
  data: Array<{ embedding: number[]; index: number }>
}

export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) throw new Error('VOYAGE_API_KEY is not set')

  const response = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: VOYAGE_MODEL, input: [text], input_type: 'query' }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Voyage AI embedding failed: HTTP ${response.status} — ${body}`)
  }

  const json = (await response.json()) as VoyageEmbeddingResponse
  const embedding = json.data?.[0]?.embedding

  if (!Array.isArray(embedding) || embedding.length !== 512) {
    throw new Error(`Voyage AI returned unexpected embedding shape`)
  }

  return embedding
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) throw new Error('VOYAGE_API_KEY is not set')

  const response = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: VOYAGE_MODEL, input: texts, input_type: 'document' }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Voyage AI batch embedding failed: HTTP ${response.status} — ${body}`)
  }

  const json = (await response.json()) as VoyageEmbeddingResponse
  return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding)
}
