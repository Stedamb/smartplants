import { describe, expect, it } from 'vitest'
import { buildSyncResponse, hashToken, parseReading, readDeviceToken } from '../../../supabase/functions/_shared/sync.ts'

describe('parseReading', () => {
  it('accepts a full reading and rounds values', () => {
    const result = parseReading({ raw: 412.6, moisture_pct: 47.4, pump_on: true, temperature_c: 21.5, light_lux: 300 })
    expect(result).toEqual({
      ok: true,
      reading: { raw: 413, moisture_pct: 47, pump_on: true, temperature_c: 21.5, light_lux: 300 },
    })
  })

  it('fills optional sensors with null and pump_on with false', () => {
    const result = parseReading({ raw: 500, moisture_pct: 25 })
    expect(result).toEqual({
      ok: true,
      reading: { raw: 500, moisture_pct: 25, pump_on: false, temperature_c: null, light_lux: null },
    })
  })

  it.each([
    [null, 'body must be a JSON object'],
    [{ moisture_pct: 50 }, 'raw must be'],
    [{ raw: 2000, moisture_pct: 50 }, 'raw must be'],
    [{ raw: 500, moisture_pct: 101 }, 'moisture_pct must be'],
    [{ raw: 500, moisture_pct: '50' }, 'moisture_pct must be'],
    [{ raw: 500, moisture_pct: 50, pump_on: 'yes' }, 'pump_on must be'],
    [{ raw: 500, moisture_pct: 50, temperature_c: 200 }, 'temperature_c must be'],
    [{ raw: 500, moisture_pct: 50, light_lux: -1 }, 'light_lux must be'],
  ])('rejects %j', (body, message) => {
    const result = parseReading(body)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain(message)
  })
})

describe('readDeviceToken', () => {
  const token = 'a'.repeat(64)
  it('returns the trimmed token', () => {
    expect(readDeviceToken(new Headers({ 'x-device-token': ` ${token} ` }))).toBe(token)
  })
  it('rejects a missing or short token', () => {
    expect(readDeviceToken(new Headers())).toBeNull()
    expect(readDeviceToken(new Headers({ 'x-device-token': 'short' }))).toBeNull()
  })
})

describe('hashToken', () => {
  it('returns the SHA-256 hex digest', async () => {
    expect(await hashToken('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
})

describe('buildSyncResponse', () => {
  it('maps settings and caps commands at five', () => {
    const commands = Array.from({ length: 7 }, (_, i) => ({ id: i + 1, kind: 'water' as const, duration_ms: 3000 }))
    const response = buildSyncResponse({ dry_threshold_pct: 25, warning_threshold_pct: 62, sync_interval_s: 30 }, commands)
    expect(response.thresholds).toEqual({ dry_pct: 25, warning_pct: 62 })
    expect(response.sync_interval_s).toBe(30)
    expect(response.commands).toHaveLength(5)
    expect(response.commands[0]).toEqual({ id: 1, kind: 'water', duration_ms: 3000 })
  })
})
