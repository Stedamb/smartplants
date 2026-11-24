// device-sync: the board's only way in.
// POST a reading with the x-device-token header; get back thresholds and pending commands.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { buildSyncResponse, hashToken, MAX_COMMANDS, parseReading, readDeviceToken } from '../_shared/sync.ts'

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' })

  const token = readDeviceToken(req.headers)
  if (!token) return json(401, { error: 'missing device token' })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'invalid JSON' })
  }
  const parsed = parseReading(body)
  if (!parsed.ok) return json(400, { error: parsed.error })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })

  // token_hash is unique and compared inside Postgres, so no timing leak from string compare here.
  const { data: device, error: deviceError } = await supabase
    .from('devices')
    .select('id, dry_threshold_pct, warning_threshold_pct, sync_interval_s')
    .eq('token_hash', await hashToken(token))
    .maybeSingle()
  if (deviceError) return json(500, { error: 'lookup failed' })
  if (!device) return json(401, { error: 'unknown device' })

  const { error: insertError } = await supabase.from('readings').insert({ device_id: device.id, ...parsed.reading })
  if (insertError) return json(500, { error: 'could not store reading' })

  // Hand over at most MAX_COMMANDS per sync; only those are marked delivered, the rest wait.
  const { data: pending, error: pendingError } = await supabase
    .from('commands')
    .select('id')
    .eq('device_id', device.id)
    .is('delivered_at', null)
    .order('created_at')
    .limit(MAX_COMMANDS)
  if (pendingError) return json(500, { error: 'could not read commands' })

  let commands: { id: number; kind: 'water'; duration_ms: number }[] = []
  if (pending.length > 0) {
    const { data, error } = await supabase
      .from('commands')
      .update({ delivered_at: new Date().toISOString() })
      .in('id', pending.map((c) => c.id))
      .is('delivered_at', null)
      .select('id, kind, duration_ms')
    if (error) return json(500, { error: 'could not claim commands' })
    commands = data ?? []
  }

  return json(200, buildSyncResponse(device, commands))
})
