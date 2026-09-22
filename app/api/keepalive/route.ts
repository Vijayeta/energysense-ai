import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

// Daily Vercel Cron ping so the free-tier Supabase project is never paused for inactivity.
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Vercel Cron sends "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set.
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase.from('energy_uploads').select('id').limit(1)
  if (error) {
    console.error('Keepalive failed:', error.message)
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true, at: new Date().toISOString() })
}
