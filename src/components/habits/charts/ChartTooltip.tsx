import type { ReactNode } from 'react'

interface Props {
  active?: boolean
  label?: ReactNode
  value?: ReactNode
  suffix?: string
}

/** The dark, themed tooltip every chart in the habit tracker uses — Recharts' `content` render prop. */
function ChartTooltip({ active, label, value, suffix = '' }: Props) {
  if (!active || value === undefined) return null
  return (
    <div
      style={{
        background: 'var(--ink-2)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12.5,
        color: 'var(--cream)',
        boxShadow: '0 12px 32px var(--shadow)',
      }}
    >
      {label && <div style={{ color: 'var(--mute)', fontSize: 11, marginBottom: 2 }}>{label}</div>}
      <div style={{ fontWeight: 700 }}>
        {value}
        {suffix}
      </div>
    </div>
  )
}

export default ChartTooltip
