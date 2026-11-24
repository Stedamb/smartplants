import { createMockSource } from './mockSource'
import type { DashboardSource } from './source'
import { createSupabaseSource } from './supabaseSource'

export interface SourceEnv {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_ANON_KEY?: string
  VITE_SMARTPLANTS_DEVICE_ID?: string
}

/** The demo route is always mock; the live route falls back to mock when Supabase is not configured. */
export function selectSource(demo: boolean, env: SourceEnv): DashboardSource {
  if (!demo && env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY) {
    return createSupabaseSource(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, env.VITE_SMARTPLANTS_DEVICE_ID || undefined)
  }
  return createMockSource()
}
