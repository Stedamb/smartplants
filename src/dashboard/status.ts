import type { Thresholds } from './source'

/** A board is offline after missing this many sync intervals. */
export const OFFLINE_AFTER_INTERVALS = 3

export function isOnline(lastSeenAt: string | null | undefined, syncIntervalS: number, now: number = Date.now()): boolean {
  if (!lastSeenAt) return false
  const age = now - new Date(lastSeenAt).getTime()
  return age <= OFFLINE_AFTER_INTERVALS * syncIntervalS * 1000
}

export type MoistureLevel = 'dry' | 'warning' | 'ok'

/** Same three states as the board's red / yellow / green LEDs. */
export function moistureLevel(moisturePct: number, thresholds: Thresholds): MoistureLevel {
  if (moisturePct < thresholds.dryPct) return 'dry'
  if (moisturePct < thresholds.warningPct) return 'warning'
  return 'ok'
}

export function validateThresholds({ dryPct, warningPct }: Thresholds): string | null {
  const valid = (n: number) => Number.isInteger(n) && n >= 0 && n <= 100
  if (!valid(dryPct) || !valid(warningPct)) return 'thresholds_range'
  if (dryPct >= warningPct) return 'thresholds_order'
  return null
}
