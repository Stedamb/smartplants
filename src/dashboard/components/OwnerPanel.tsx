import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Session, Thresholds } from '../source'
import { validateThresholds } from '../status'

/** Length of a manual "water now" run, in ms. The firmware caps it too. */
export const WATER_NOW_MS = 3000

interface Props {
  session: Session | null
  thresholds: Thresholds
  isDemo: boolean
  onSignIn(email: string, password: string): Promise<void>
  onSignOut(): Promise<void>
  onWaterNow(durationMs: number): Promise<void>
  onUpdateThresholds(thresholds: Thresholds): Promise<void>
}

const button = 'bg-[var(--primary)] px-4 py-2 text-white hover:bg-[var(--accent)] disabled:opacity-50'
const input = 'w-full border border-gray-300 px-3 py-2'

export function OwnerPanel(props: Props) {
  const { t } = useTranslation()
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [dry, setDry] = useState(props.thresholds.dryPct)
  const [warning, setWarning] = useState(props.thresholds.warningPct)

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true)
    setMessage(null)
    try {
      await action()
      setMessage(t(success))
    } catch {
      setMessage(t('dash_error_action'))
    } finally {
      setBusy(false)
    }
  }

  if (!props.session) {
    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const form = new FormData(e.currentTarget)
      void run(() => props.onSignIn(String(form.get('email')), String(form.get('password'))), 'dash_signed_in')
    }
    return (
      <form onSubmit={onSubmit} className="bg-white p-6 shadow-sm">
        <p className="mb-4 text-sm uppercase tracking-wider opacity-70">{t('dash_controls')}</p>
        <p className="mb-4 text-sm">{t('dash_login_hint')}</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input name="email" type="email" required autoComplete="email" placeholder="Email" className={input} />
          <input name="password" type="password" required autoComplete="current-password" placeholder="Password" className={input} />
          <button disabled={busy} className={button}>{t('dash_sign_in')}</button>
        </div>
        {message && <p className="mt-3 text-sm">{message}</p>}
      </form>
    )
  }

  const thresholdError = validateThresholds({ dryPct: dry, warningPct: warning })

  return (
    <div className="bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm uppercase tracking-wider opacity-70">{t('dash_controls')}</p>
        {!props.isDemo && (
          <button onClick={() => void props.onSignOut()} className="text-sm underline">
            {t('dash_sign_out')}
          </button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="mb-2">{t('dash_water_hint')}</p>
          <button disabled={busy} className={button} onClick={() => void run(() => props.onWaterNow(WATER_NOW_MS), 'dash_water_sent')}>
            {t('dash_water_now')}
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!thresholdError) void run(() => props.onUpdateThresholds({ dryPct: dry, warningPct: warning }), 'dash_thresholds_saved')
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              {t('dash_dry_threshold')}
              <input type="number" min={0} max={100} value={dry} onChange={(e) => setDry(Number(e.target.value))} className={input} />
            </label>
            <label className="text-sm">
              {t('dash_warning_threshold')}
              <input type="number" min={0} max={100} value={warning} onChange={(e) => setWarning(Number(e.target.value))} className={input} />
            </label>
          </div>
          {thresholdError && <p className="mt-2 text-sm text-[#c2410c]">{t(`dash_error_${thresholdError}`)}</p>}
          <button disabled={busy || !!thresholdError} className={`${button} mt-3`}>{t('dash_save')}</button>
        </form>
      </div>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  )
}
