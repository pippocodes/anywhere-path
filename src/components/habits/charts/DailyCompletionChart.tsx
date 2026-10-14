import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import ChartTooltip from './ChartTooltip'

interface Props {
  data: { day: number; percent: number }[]
}

/** Daily completion across the month — an animated gradient-filled area chart. */
function DailyCompletionChart({ data }: Props) {
  return (
    <div>
      <div className="micro-label" style={{ marginBottom: 12 }}>
        Daily Completion
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="dailyCompletionFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--rose)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: 'var(--mute)', fontSize: 10.5 }} axisLine={false} tickLine={false} interval={4} />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: 'var(--mute)', fontSize: 10.5 }}
            axisLine={false}
            tickLine={false}
            width={32}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            cursor={{ stroke: 'var(--line)' }}
            content={({ active, payload, label }) => (
              <ChartTooltip active={active} label={`Day ${label}`} value={payload?.[0]?.value as number} suffix="%" />
            )}
          />
          <Area
            type="monotone"
            dataKey="percent"
            stroke="var(--gold)"
            strokeWidth={2}
            fill="url(#dailyCompletionFill)"
            isAnimationActive
            animationDuration={900}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default DailyCompletionChart
