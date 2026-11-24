// Pure logic for the device-sync function. No Deno or Node APIs, so Vitest
// can test it and the Edge Function can import it unchanged.

export interface ReadingInput {
  raw: number
  moisture_pct: number
  pump_on: boolean
  temperature_c: number | null
  light_lux: number | null
}

export type ParseResult =
  | { ok: true; reading: ReadingInput }
  | { ok: false; error: string }

const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

function optionalNumber(v: unknown, min: number, max: number): number | null | undefined {
  if (v === undefined || v === null) return null
  if (!isNumber(v) || v < min || v > max) return undefined
  return v
}

export function parseReading(body: unknown): ParseResult {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'body must be a JSON object' }
  const b = body as Record<string, unknown>

  if (!isNumber(b.raw) || b.raw < 0 || b.raw > 1024) return { ok: false, error: 'raw must be a number between 0 and 1024' }
  if (!isNumber(b.moisture_pct) || b.moisture_pct < 0 || b.moisture_pct > 100) {
    return { ok: false, error: 'moisture_pct must be a number between 0 and 100' }
  }
  if (b.pump_on !== undefined && typeof b.pump_on !== 'boolean') return { ok: false, error: 'pump_on must be a boolean' }

  const temperature_c = optionalNumber(b.temperature_c, -40, 85)
  if (temperature_c === undefined) return { ok: false, error: 'temperature_c must be between -40 and 85' }
  const light_lux = optionalNumber(b.light_lux, 0, 200000)
  if (light_lux === undefined) return { ok: false, error: 'light_lux must be between 0 and 200000' }

  return {
    ok: true,
    reading: {
      raw: Math.round(b.raw),
      moisture_pct: Math.round(b.moisture_pct),
      pump_on: b.pump_on === true,
      temperature_c,
      light_lux,
    },
  }
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function readDeviceToken(headers: Headers): string | null {
  const token = headers.get('x-device-token')?.trim()
  // Tokens are generated as 32 random bytes in hex (64 chars); reject anything short.
  return token && token.length >= 32 ? token : null
}

export interface DeviceSettings {
  dry_threshold_pct: number
  warning_threshold_pct: number
  sync_interval_s: number
}

export interface PendingCommand {
  id: number
  kind: 'water'
  duration_ms: number
}

export const MAX_COMMANDS = 5

// The response stays small: the ESP8266 parses it with a fixed-size JSON buffer.
export function buildSyncResponse(settings: DeviceSettings, commands: PendingCommand[]) {
  return {
    thresholds: {
      dry_pct: settings.dry_threshold_pct,
      warning_pct: settings.warning_threshold_pct,
    },
    sync_interval_s: settings.sync_interval_s,
    commands: commands.slice(0, MAX_COMMANDS).map((c) => ({ id: c.id, kind: c.kind, duration_ms: c.duration_ms })),
  }
}
