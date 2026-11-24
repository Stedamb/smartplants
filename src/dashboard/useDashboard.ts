import { useEffect, useMemo, useState } from 'react'
import type { DashboardSource, DeviceStatus, Reading, Session, Thresholds } from './source'

/** How many readings the chart keeps while live updates arrive. */
export const LIVE_HISTORY_MAX = 1000

export function useDashboard(source: DashboardSource) {
  const [device, setDevice] = useState<DeviceStatus | null>(null)
  const [history, setHistory] = useState<Reading[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let stop: (() => void) | undefined
    let cancelled = false
    source
      .load()
      .then((snapshot) => {
        if (cancelled) return
        if (!snapshot.device) return setState('empty')
        setDevice(snapshot.device)
        setHistory(snapshot.history)
        setState('ready')
        stop = source.subscribe((reading) => {
          setHistory((h) => [...h, reading].slice(-LIVE_HISTORY_MAX))
          setDevice((d) => (d ? { ...d, last: reading } : d))
        })
      })
      .catch(() => !cancelled && setState('error'))
    source.getSession().then((s) => !cancelled && setSession(s))
    return () => {
      cancelled = true
      stop?.()
    }
  }, [source])

  // Re-evaluate online/offline even when no reading arrives.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(id)
  }, [])

  const actions = useMemo(
    () => ({
      async signIn(email: string, password: string) {
        await source.signIn(email, password)
        setSession(await source.getSession())
      },
      async signOut() {
        await source.signOut()
        setSession(null)
      },
      waterNow: (durationMs: number) => source.waterNow(durationMs),
      async updateThresholds(thresholds: Thresholds) {
        await source.updateThresholds(thresholds)
        setDevice((d) => (d ? { ...d, thresholds } : d))
      },
    }),
    [source],
  )

  return { device, history, session, state, now, actions }
}
