import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import ChartTooltip from './ChartTooltip'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface Props {
  values: number[] // 12 completion percentages, Jan..Dec
  activeMonth?: number
}

/** The Year view's 12-month completion bar chart. */
function MonthlyBarChart({ values, activeMonth }: Props) {
  const data = values.map((percent, i) => ({ month: MONTH_LABELS[i], percent }))

  return (
    <div>
      <div className="micro-label" style={{ marginBottom: 12 }}>
        Months at a Glance
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }} barCategoryGap={8}>
          <XAxis dataKey="month" tick={{ fill: 'var(--mute)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: 'var(--mute)', fontSize: 10.5 }} axisLine={false} tickLine={false} width={32} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            cursor={{ fill: 'color-mix(in srgb, var(--text) 3%, transparent)' }}
            content={({ active, payload, label }) => <ChartTooltip active={active} label={label} value={payload?.[0]?.value as number} suffix="%" />}
          />
          <Bar dataKey="percent" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={800} animationEasing="ease-out">
            {data.map((_, i) => (
              <Cell key={i} fill={i === activeMonth ? 'var(--rose)' : 'var(--gold)'} fillOpacity={i === activeMonth ? 1 : 0.55} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default MonthlyBarChart
