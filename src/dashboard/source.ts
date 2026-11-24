export interface Reading {
  createdAt: string
  raw: number
  moisturePct: number
  pumpOn: boolean
  temperatureC: number | null
  lightLux: number | null
}

export interface Thresholds {
  dryPct: number
  warningPct: number
}

export interface DeviceStatus {
  id: string
  name: string
  thresholds: Thresholds
  syncIntervalS: number
  last: Reading | null
}

export interface Snapshot {
  device: DeviceStatus | null
  history: Reading[]
}

export interface Session {
  email: string
}

/** Everything the dashboard needs, so the live and mock versions share one UI. */
export interface DashboardSource {
  kind: 'live' | 'mock'
  load(): Promise<Snapshot>
  /** Calls back on every new reading; returns an unsubscribe function. */
  subscribe(onReading: (reading: Reading) => void): () => void
  getSession(): Promise<Session | null>
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
  waterNow(durationMs: number): Promise<void>
  updateThresholds(thresholds: Thresholds): Promise<void>
}
