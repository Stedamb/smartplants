import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { DashboardSource, DeviceStatus, Reading, Snapshot } from './source'

/** How much history the chart loads. */
export const HISTORY_HOURS = 24
export const HISTORY_LIMIT = 1000

interface ReadingRow {
  created_at: string
  raw: number
  moisture_pct: number
  pump_on: boolean
  temperature_c: number | null
  light_lux: number | null
}

interface DeviceStatusRow {
  id: string
  name: string
  dry_threshold_pct: number
  warning_threshold_pct: number
  sync_interval_s: number
  last_seen_at: string | null
  raw: number | null
  moisture_pct: number | null
  pump_on: boolean | null
  temperature_c: number | null
  light_lux: number | null
}

export function toReading(row: ReadingRow): Reading {
  return {
    createdAt: row.created_at,
    raw: row.raw,
    moisturePct: row.moisture_pct,
    pumpOn: row.pump_on,
    temperatureC: row.temperature_c,
    lightLux: row.light_lux,
  }
}

export function toDeviceStatus(row: DeviceStatusRow): DeviceStatus {
  const hasReading = row.last_seen_at !== null && row.moisture_pct !== null && row.raw !== null
  return {
    id: row.id,
    name: row.name,
    thresholds: { dryPct: row.dry_threshold_pct, warningPct: row.warning_threshold_pct },
    syncIntervalS: row.sync_interval_s,
    last: hasReading
      ? toReading({
          created_at: row.last_seen_at!,
          raw: row.raw!,
          moisture_pct: row.moisture_pct!,
          pump_on: row.pump_on ?? false,
          temperature_c: row.temperature_c,
          light_lux: row.light_lux,
        })
      : null,
  }
}

export function createSupabaseSource(url: string, anonKey: string, deviceId?: string): DashboardSource {
  const supabase: SupabaseClient = createClient(url, anonKey)
  let currentDeviceId: string | null = deviceId ?? null

  const requireDevice = () => {
    if (!currentDeviceId) throw new Error('no_device')
    return currentDeviceId
  }

  return {
    kind: 'live',

    async load(): Promise<Snapshot> {
      let query = supabase.from('device_status').select('*').limit(1)
      if (deviceId) query = query.eq('id', deviceId)
      const { data: rows, error } = await query
      if (error) throw error
      const row = rows?.[0] as DeviceStatusRow | undefined
      if (!row) return { device: null, history: [] }
      currentDeviceId = row.id

      const since = new Date(Date.now() - HISTORY_HOURS * 3600 * 1000).toISOString()
      const { data: readings, error: readingsError } = await supabase
        .from('readings')
        .select('created_at, raw, moisture_pct, pump_on, temperature_c, light_lux')
        .eq('device_id', row.id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT)
      if (readingsError) throw readingsError

      return { device: toDeviceStatus(row), history: (readings as ReadingRow[]).map(toReading).reverse() }
    },

    subscribe(onReading) {
      const id = requireDevice()
      const channel = supabase
        .channel(`readings:${id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'readings', filter: `device_id=eq.${id}` },
          (payload) => onReading(toReading(payload.new as ReadingRow)),
        )
        .subscribe()
      return () => {
        void supabase.removeChannel(channel)
      }
    },

    async getSession() {
      const { data } = await supabase.auth.getSession()
      const email = data.session?.user.email
      return email ? { email } : null
    },

    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    },

    async signOut() {
      await supabase.auth.signOut()
    },

    async waterNow(durationMs) {
      const { error } = await supabase.from('commands').insert({ device_id: requireDevice(), kind: 'water', duration_ms: durationMs })
      if (error) throw error
    },

    async updateThresholds({ dryPct, warningPct }) {
      const { error } = await supabase
        .from('devices')
        .update({ dry_threshold_pct: dryPct, warning_threshold_pct: warningPct })
        .eq('id', requireDevice())
      if (error) throw error
    },
  }
}
