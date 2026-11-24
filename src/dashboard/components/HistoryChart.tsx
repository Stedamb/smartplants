import { useTranslation } from 'react-i18next'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Reading, Thresholds } from '../source'

export function HistoryChart({ history, thresholds }: { history: Reading[]; thresholds: Thresholds }) {
  const { t, i18n } = useTranslation()
  const time = (iso: string) => new Date(iso).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })

  if (history.length === 0) return <p className="bg-white p-6 shadow-sm">{t('dash_no_history')}</p>

  return (
    <div className="bg-white p-6 shadow-sm">
      <p className="mb-4 text-sm uppercase tracking-wider opacity-70">{t('dash_history')}</p>
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <LineChart data={history} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="createdAt" tickFormatter={time} minTickGap={48} fontSize={12} />
            <YAxis domain={[0, 100]} unit="%" fontSize={12} />
            <Tooltip
              labelFormatter={(label) => new Date(String(label)).toLocaleString(i18n.language)}
              formatter={(value) => [`${value}%`, t('dash_moisture')]}
            />
            <ReferenceLine y={thresholds.dryPct} stroke="#c2410c" strokeDasharray="4 4" />
            <ReferenceLine y={thresholds.warningPct} stroke="#ca8a04" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="moisturePct" stroke="var(--primary)" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
