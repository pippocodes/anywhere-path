import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import ChartTooltip from './ChartTooltip'
import ChartEmptyState from './ChartEmptyState'

interface Props {
  data: { label: string; percent: number }[]
}

/** Average completion by weekday across the month — surfaces which days tend to slip. */
function WeekdayPatternChart({ data }: Props) {
  const hasData = data.some((d) => d.percent > 0)
  const weakestIndex = data.reduce((weakest, d, i) => (d.percent < data[weakest].percent ? i : weakest), 0)

  return (
    <div>
      <div className="micro-label" style={{ marginBottom: 12 }}>
        Weekday Pattern
      </div>
      {!hasData ? (
        <ChartEmptyState height={280} message="A pattern will show up here once you've ticked a few days" />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }} barCategoryGap={12}>
            <XAxis dataKey="label" tick={{ fill: 'var(--mute)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: 'var(--mute)', fontSize: 10.5 }} axisLine={false} tickLine={false} width={32} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              cursor={{ fill: 'color-mix(in srgb, var(--text) 3%, transparent)' }}
              content={({ active, payload, label }) => <ChartTooltip active={active} label={label} value={payload?.[0]?.value as number} suffix="%" />}
            />
            <Bar dataKey="percent" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={700} animationEasing="ease-out">
              {data.map((_, i) => (
                <Cell key={i} fill={i === weakestIndex ? 'var(--chart-2)' : 'var(--chart-1)'} fillOpacity={i === weakestIndex ? 0.9 : 0.6} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default WeekdayPatternChart
