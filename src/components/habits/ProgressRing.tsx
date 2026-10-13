interface Props {
  percent: number // 0-100
  size?: number
  color?: string
  label?: string
}

/** A simple CSS conic-gradient ring — no charting library needed for one number. */
function ProgressRing({ percent, size = 96, color = 'var(--pink)', label }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)))
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `conic-gradient(${color} ${clamped * 3.6}deg, var(--pink-pale) 0deg)`,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
      role="img"
      aria-label={`${label ? label + ': ' : ''}${clamped}% complete`}
    >
      <div
        style={{
          width: size - 18,
          height: size - 18,
          borderRadius: '50%',
          background: 'var(--card-bg)',
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
        }}
      >
        <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: size / 4.2, color: 'var(--ink)' }}>
          {clamped}%
        </div>
        {label && <div style={{ fontSize: 10.5, color: 'var(--rose)', fontWeight: 600 }}>{label}</div>}
      </div>
    </div>
  )
}

export default ProgressRing
