import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import ChartTooltip from './ChartTooltip'

interface Props {
  data: { name: string; percent: number }[]
}

const BAR_COLORS = ['var(--gold)', 'var(--rose)', 'var(--violet)']

/** One horizontal bar per habit, showing this month's completion — sorted by the caller. */
function PerHabitBarChart({ data }: Props) {
  const height = Math.max(data.length * 34, 80)

  return (
    <div>
      <div className="micro-label" style={{ marginBottom: 12 }}>
        Per-Habit Completion
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap={10}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: 'var(--cream)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Tooltip
            cursor={{ fill: 'rgba(246,237,228,0.03)' }}
            content={({ active, payload, label }) => <ChartTooltip active={active} label={label} value={payload?.[0]?.value as number} suffix="%" />}
          />
          <Bar dataKey="percent" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={700} animationEasing="ease-out">
            {data.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PerHabitBarChart
