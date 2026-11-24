import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { LANGUAGES } from '../i18n'
import { HistoryChart } from './components/HistoryChart'
import { OwnerPanel } from './components/OwnerPanel'
import { StatusCards } from './components/StatusCards'
import { selectSource } from './index'
import { useDashboard } from './useDashboard'

export default function DashboardPage({ demo }: { demo: boolean }) {
  const { t, i18n } = useTranslation()
  const source = useMemo(() => selectSource(demo, import.meta.env), [demo])
  const { device, history, session, state, now, actions } = useDashboard(source)
  const isMock = source.kind === 'mock'

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <header className="bg-[var(--primary)] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 sm:px-16">
          <Link to="/" className="font-bold text-white hover:text-white">SmartPlants</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to={demo ? '/dashboard' : '/dashboard/demo'} className="text-white underline">
              {demo ? t('dash_go_live') : t('dash_go_demo')}
            </Link>
            {LANGUAGES.filter((lang) => lang.code !== i18n.resolvedLanguage).map((lang) => (
              <button key={lang.code} onClick={() => void i18n.changeLanguage(lang.code)} className="uppercase" title={lang.label}>
                {lang.code}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 px-6 py-8 sm:px-16">
        <div>
          <h4>{device?.name ?? t('dashboard')}</h4>
          {isMock && <p className="mt-2 bg-[var(--secondary)] px-4 py-2 text-sm">{demo ? t('dash_demo_banner') : t('dash_fallback_banner')}</p>}
        </div>

        {state === 'loading' && <p>{t('dash_loading')}</p>}
        {state === 'error' && <p>{t('dash_error_load')}</p>}
        {state === 'empty' && <p>{t('dash_empty')}</p>}

        {state === 'ready' && device && (
          <>
            <StatusCards device={device} now={now} />
            <HistoryChart history={history} thresholds={device.thresholds} />
            <OwnerPanel
              key={device.id}
              session={session}
              thresholds={device.thresholds}
              isDemo={isMock}
              onSignIn={actions.signIn}
              onSignOut={actions.signOut}
              onWaterNow={actions.waterNow}
              onUpdateThresholds={actions.updateThresholds}
            />
          </>
        )}
      </main>
    </div>
  )
}
