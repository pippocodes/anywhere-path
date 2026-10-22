interface Props {
  values: number[] // 0-100
  width?: number
  height?: number
}

/** A tiny trend line for a stat card — no chart library, just a polyline sized to its data. */
function Sparkline({ values, width = 72, height = 24 }: Props) {
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const step = width / (values.length - 1)
  const points = values.map((v, i) => `${i * step},${height - (v / max) * height}`).join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
    </svg>
  )
}

export default Sparkline
