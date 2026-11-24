import { useTranslation } from 'react-i18next'
import type { DeviceStatus } from '../source'
import { isOnline, moistureLevel } from '../status'

const levelColor = { dry: '#c2410c', warning: '#ca8a04', ok: 'var(--primary)' } as const

export function StatusCards({ device, now }: { device: DeviceStatus; now: number }) {
  const { t, i18n } = useTranslation()
  const last = device.last
  const online = isOnline(last?.createdAt, device.syncIntervalS, now)
  const level = last ? moistureLevel(last.moisturePct, device.thresholds) : null
  const lastSeen = last ? new Date(last.createdAt).toLocaleString(i18n.language) : t('dash_never')

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="bg-white p-6 shadow-sm sm:col-span-2 lg:col-span-1">
        <p className="text-sm uppercase tracking-wider opacity-70">{t('dash_moisture')}</p>
        <p className="mt-2 text-5xl font-bold" style={{ color: level ? levelColor[level] : undefined }}>
          {last ? `${last.moisturePct}%` : '—'}
        </p>
        {level && <p className="mt-1 text-sm">{t(`dash_level_${level}`)}</p>}
        {last && (
          <div className="mt-4 h-2 w-full bg-[var(--tertairy)]" aria-hidden>
            <div className="h-2" style={{ width: `${last.moisturePct}%`, background: level ? levelColor[level] : undefined }} />
          </div>
        )}
      </div>

      <div className="bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-wider opacity-70">{t('dash_board')}</p>
        <p className="mt-2 flex items-center gap-2 text-2xl font-bold">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: online ? '#16a34a' : '#9ca3af' }} />
          {online ? t('dash_online') : t('dash_offline')}
        </p>
        <p className="mt-1 text-sm opacity-70">
          {t('dash_last_seen')}: {lastSeen}
        </p>
      </div>

      <div className="bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-wider opacity-70">{t('dash_pump')}</p>
        <p className="mt-2 text-2xl font-bold">{last?.pumpOn ? t('dash_pump_on') : t('dash_pump_off')}</p>
        <p className="mt-1 text-sm opacity-70">
          {t('dash_thresholds')}: {device.thresholds.dryPct}% / {device.thresholds.warningPct}%
        </p>
      </div>

      <div className="bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-wider opacity-70">{t('dash_environment')}</p>
        <p className="mt-2 text-2xl font-bold">{last?.temperatureC != null ? `${last.temperatureC} °C` : '—'}</p>
        <p className="mt-1 text-sm opacity-70">{last?.lightLux != null ? `${last.lightLux} lux` : t('dash_no_sensor')}</p>
      </div>
    </div>
  )
}
