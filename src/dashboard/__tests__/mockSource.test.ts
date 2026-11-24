import { describe, expect, it, vi } from 'vitest'
import { createMockSource, generateHistory, MOCK, mulberry32, pctToRaw, step } from '../mockSource'

const thresholds = { dryPct: 25, warningPct: 62 }
const noNoise = () => 0.5

describe('mock plant simulation', () => {
  it('generates a full history with valid values', () => {
    const { history } = generateHistory(new Date('2026-11-24T12:00:00Z'), thresholds, mulberry32(1))
    expect(history).toHaveLength(MOCK.historyLength)
    for (const r of history) {
      expect(r.moisturePct).toBeGreaterThanOrEqual(0)
      expect(r.moisturePct).toBeLessThanOrEqual(100)
      expect(r.raw).toBe(pctToRaw(r.moisturePct))
    }
    expect(history[history.length - 1].createdAt).toBe('2026-11-24T12:00:00.000Z')
  })

  it('dries out over time without watering', () => {
    const { state, pumpOn } = step({ moisturePct: 60, pendingWaterMs: 0 }, 600, thresholds, noNoise)
    expect(state.moisturePct).toBeLessThan(60)
    expect(pumpOn).toBe(false)
  })

  it('pulses the pump below the dry threshold', () => {
    const { state, pumpOn } = step({ moisturePct: 20, pendingWaterMs: 0 }, 3, thresholds, noNoise)
    expect(pumpOn).toBe(true)
    expect(state.moisturePct).toBeGreaterThan(20)
  })

  it('pours queued "water now" and clears it', () => {
    const { state, pumpOn } = step({ moisturePct: 50, pendingWaterMs: 3000 }, 3, thresholds, noNoise)
    expect(pumpOn).toBe(true)
    expect(state.moisturePct).toBeGreaterThan(50 + MOCK.wateringPerSecond * 2)
    expect(state.pendingWaterMs).toBe(0)
  })

  it('is deterministic for the same seed and time', async () => {
    const now = () => new Date('2026-11-24T12:00:00Z')
    const a = await createMockSource({ now, seed: 7 }).load()
    const b = await createMockSource({ now, seed: 7 }).load()
    expect(a.history).toEqual(b.history)
  })

  it('emits live readings and reacts to "water now"', async () => {
    vi.useFakeTimers()
    const source = createMockSource({ now: () => new Date('2026-11-24T12:00:00Z'), seed: 3 })
    const { device } = await source.load()
    const before = device!.last!.moisturePct
    await source.waterNow(3000)
    const readings: number[] = []
    const stop = source.subscribe((r) => readings.push(r.moisturePct))
    vi.advanceTimersByTime(MOCK.liveTickMs)
    stop()
    vi.useRealTimers()
    expect(readings).toHaveLength(1)
    expect(readings[0]).toBeGreaterThan(before)
  })
})
