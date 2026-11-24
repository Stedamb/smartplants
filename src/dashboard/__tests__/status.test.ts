import { describe, expect, it } from 'vitest'
import { isOnline, moistureLevel, validateThresholds } from '../status'
import { selectSource } from '../index'

describe('isOnline', () => {
  const now = new Date('2026-11-24T12:00:00Z').getTime()
  it('is online within three sync intervals', () => {
    expect(isOnline('2026-11-24T11:58:31Z', 30, now)).toBe(true)
  })
  it('is offline after three missed intervals', () => {
    expect(isOnline('2026-11-24T11:58:29Z', 30, now)).toBe(false)
  })
  it('is offline with no reading at all', () => {
    expect(isOnline(null, 30, now)).toBe(false)
  })
})

describe('moistureLevel', () => {
  const t = { dryPct: 25, warningPct: 62 }
  it('matches the board LEDs', () => {
    expect(moistureLevel(10, t)).toBe('dry')
    expect(moistureLevel(25, t)).toBe('warning')
    expect(moistureLevel(61, t)).toBe('warning')
    expect(moistureLevel(62, t)).toBe('ok')
  })
})

describe('validateThresholds', () => {
  it('accepts dry below warning', () => expect(validateThresholds({ dryPct: 20, warningPct: 60 })).toBeNull())
  it('rejects dry not below warning', () => expect(validateThresholds({ dryPct: 60, warningPct: 60 })).toBe('thresholds_order'))
  it('rejects out of range', () => expect(validateThresholds({ dryPct: -1, warningPct: 101 })).toBe('thresholds_range'))
})

describe('selectSource', () => {
  const env = { VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_ANON_KEY: 'anon' }
  it('uses mock on the demo route even when configured', () => expect(selectSource(true, env).kind).toBe('mock'))
  it('falls back to mock without env vars', () => expect(selectSource(false, {}).kind).toBe('mock'))
  it('uses Supabase when configured', () => expect(selectSource(false, env).kind).toBe('live'))
})
