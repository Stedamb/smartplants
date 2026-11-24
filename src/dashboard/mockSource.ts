import type { DashboardSource, Reading, Session, Snapshot, Thresholds } from './source'
import { moistureLevel } from './status'

/** Mock tuning, in one place so the demo's feel can be adjusted. */
export const MOCK = {
  seed: 42,
  /** Seconds between readings in the simulated history. */
  historyIntervalS: 300,
  /** Number of past readings generated on load (24 h at 5 min). */
  historyLength: 288,
  /** How often the live demo produces a new reading, in ms. */
  liveTickMs: 3000,
  /** Moisture lost per simulated minute, in percentage points. */
  dryingPerMinute: 0.035,
  /** Moisture gained per second of pumping, in percentage points. */
  wateringPerSecond: 4,
  /** Length of one automatic pump pulse, in seconds (matches the firmware). */
  pumpPulseS: 1,
  startMoisturePct: 70,
} as const

/** Deterministic PRNG so tests and the first render are stable. */
export function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp = (n: number) => Math.min(100, Math.max(0, n))

/** Inverse of the firmware mapping: 600 raw = 0 %, 200 raw = 100 %. */
export const pctToRaw = (pct: number) => Math.round(600 - pct * 4)

export interface PlantState {
  moisturePct: number
  pendingWaterMs: number
}

/**
 * Advances the plant by `seconds`. Drying is steady with a little noise; below the
 * dry threshold the board pulses the pump; queued "water now" runs pour extra water.
 */
export function step(state: PlantState, seconds: number, thresholds: Thresholds, rand: () => number) {
  let moisture = state.moisturePct - (MOCK.dryingPerMinute * seconds) / 60 + (rand() - 0.5) * 0.4
  let pumpOn = false

  if (moistureLevel(moisture, thresholds) === 'dry') {
    moisture += MOCK.wateringPerSecond * MOCK.pumpPulseS
    pumpOn = true
  }

  let pendingWaterMs = state.pendingWaterMs
  if (pendingWaterMs > 0) {
    moisture += (MOCK.wateringPerSecond * pendingWaterMs) / 1000
    pendingWaterMs = 0
    pumpOn = true
  }

  return { state: { moisturePct: clamp(moisture), pendingWaterMs }, pumpOn }
}

function toReading(moisturePct: number, pumpOn: boolean, at: Date, rand: () => number): Reading {
  const pct = Math.round(moisturePct)
  const hour = at.getHours() + at.getMinutes() / 60
  const daylight = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI))
  return {
    createdAt: at.toISOString(),
    raw: pctToRaw(pct),
    moisturePct: pct,
    pumpOn,
    temperatureC: Math.round((19 + daylight * 4 + rand()) * 10) / 10,
    lightLux: Math.round(daylight * 800 + rand() * 20),
  }
}

export function generateHistory(now: Date, thresholds: Thresholds, rand: () => number) {
  let state: PlantState = { moisturePct: MOCK.startMoisturePct, pendingWaterMs: 0 }
  const history: Reading[] = []
  for (let i = MOCK.historyLength - 1; i >= 0; i--) {
    const at = new Date(now.getTime() - i * MOCK.historyIntervalS * 1000)
    const next = step(state, MOCK.historyIntervalS, thresholds, rand)
    state = next.state
    history.push(toReading(state.moisturePct, next.pumpOn, at, rand))
  }
  return { history, state }
}

export function createMockSource(options: { now?: () => Date; seed?: number } = {}): DashboardSource {
  const now = options.now ?? (() => new Date())
  const rand = mulberry32(options.seed ?? MOCK.seed)
  let thresholds: Thresholds = { dryPct: 25, warningPct: 62 }
  let state: PlantState | null = null
  let last: Reading | null = null

  const ensure = (): Snapshot => {
    const { history, state: s } = generateHistory(now(), thresholds, rand)
    state = s
    last = history[history.length - 1] ?? null
    return {
      device: { id: 'demo', name: 'Demo plant', thresholds, syncIntervalS: MOCK.liveTickMs / 1000, last },
      history,
    }
  }

  const tick = (): Reading => {
    if (!state) ensure()
    const next = step(state!, MOCK.liveTickMs / 1000, thresholds, rand)
    state = next.state
    last = toReading(state.moisturePct, next.pumpOn, now(), rand)
    return last
  }

  const demoSession: Session = { email: 'demo@smartplants' }

  return {
    kind: 'mock',
    load: async () => ensure(),
    subscribe(onReading) {
      const id = setInterval(() => onReading(tick()), MOCK.liveTickMs)
      return () => clearInterval(id)
    },
    // In the demo the controls are open to everyone: they only change the simulation.
    getSession: async () => demoSession,
    signIn: async () => {},
    signOut: async () => {},
    async waterNow(durationMs) {
      if (!state) ensure()
      state!.pendingWaterMs += durationMs
    },
    async updateThresholds(next) {
      thresholds = next
    },
  }
}
