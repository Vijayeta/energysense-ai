# EnergySense AI

AI-powered energy management platform for commercial buildings. Upload monthly energy data, get AI-generated anomaly detection, savings recommendations, and a conversational chat assistant grounded in Indian energy standards (BEE, ASHRAE, DISCOM tariffs).

PM portfolio project by Vijayeta Meher.

## Features

- **Data upload** — CSV/Excel upload with building context (name, type, floor area)
- **Dashboard** — KPI cards, consumption trend chart, AI anomaly detection, savings recommendations
- **AI analysis** — Claude-generated insights with a structural eval + auto-fix + retry layer (`lib/claude.ts`)
- **Conversational chat** — Hybrid RAG assistant (Voyage AI embeddings + Supabase pgvector) that answers questions grounded in the user's own data and a 20-chunk Indian energy knowledge base
- **Guardrails** — 11 input/output guardrails on the chat endpoint (prompt injection, sensitive data, rate limiting, etc.)

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack), TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL + pgvector)
- **AI:** Claude (claude-sonnet-4-6) for analysis and chat, Voyage AI (voyage-3-lite) for embeddings
- **Charts:** Recharts
- **Parsing:** PapaParse (CSV), xlsx (Excel)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env.local`:
   ```
   SUPABASE_URL=
   SUPABASE_ANON_KEY=
   ANTHROPIC_API_KEY=
   VOYAGE_API_KEY=
   ```

3. Seed the RAG knowledge base (one-time, idempotent):
   ```bash
   npx tsx scripts/seed-knowledge.ts
   ```

4. Run the dev server:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## RAG Eval Suite

Run the 15-point regression suite against a live upload:

```bash
npm run eval -- --upload-id=<uuid> [--base-url=http://localhost:3000]
```

Requires the dev server running (for localhost) and a JSON report is written to `scripts/eval-report-<timestamp>.json`.

## Project Structure

See `CLAUDE.md` for full architecture, database schema, AI prompt design, and eval framework details.

## Deployment

Deployed on [Vercel](https://vercel.com), connected to this repo's `main` branch for automatic deploys.
