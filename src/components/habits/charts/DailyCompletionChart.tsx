import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import ChartTooltip from './ChartTooltip'
import ChartEmptyState from './ChartEmptyState'

interface Props {
  data: { day: number; percent: number }[]
}

/** Daily completion across the month — an animated gradient-filled area chart. Falls back to a ghost placeholder rather than a misleadingly flat line when nothing's been ticked yet. */
function DailyCompletionChart({ data }: Props) {
  const hasData = data.some((d) => d.percent > 0)
  // Recharts' hover-tracking Tooltip has no "release" signal on touch devices
  // — a tap opens it but there's no mouseleave to close it again, so it gets
  // stuck open. Only mounting <Tooltip> while actively pressed (mouse down
  // or touch active) means it's never rendered at all outside that window —
  // trivially fixing both "stuck on load" and "stuck after tap."
  const [pressed, setPressed] = useState(false)

  return (
    <div
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
    >
      <div className="micro-label" style={{ marginBottom: 12 }}>
        Daily Completion
      </div>
      {!hasData ? (
        <ChartEmptyState height={300} />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="dailyCompletionFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.02} />
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
            {pressed && (
              <Tooltip
                cursor={{ stroke: 'var(--line)' }}
                content={({ active, payload, label }) => (
                  <ChartTooltip active={active} label={`Day ${label}`} value={payload?.[0]?.value as number} suffix="%" />
                )}
              />
            )}
            <Area
              type="monotone"
              dataKey="percent"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#dailyCompletionFill)"
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default DailyCompletionChart
