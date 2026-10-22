interface Props {
  height?: number
  message?: string
}

/** A faint placeholder "ghost" chart shown instead of a real (and misleadingly flat) chart when there's no data to plot yet. */
function ChartEmptyState({ height = 300, message = 'Tick your first habit to see your progress here' }: Props) {
  return (
    <div style={{ height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <svg width="88%" height={Math.min(height * 0.5, 120)} viewBox="0 0 320 100" preserveAspectRatio="none" aria-hidden style={{ opacity: 0.35 }}>
        <path
          d="M0,80 C40,78 60,60 100,62 C140,64 160,30 200,28 C240,26 260,50 300,44 L320,42"
          fill="none"
          stroke="var(--line-strong)"
          strokeWidth={2}
          strokeDasharray="6 7"
          strokeLinecap="round"
        />
        {[0, 100, 200, 320].map((x) => (
          <circle key={x} cx={x} cy={[80, 62, 28, 42][[0, 100, 200, 320].indexOf(x)]} r={3.5} fill="var(--line-strong)" />
        ))}
      </svg>
      <p style={{ fontSize: 13, color: 'var(--mute)', textAlign: 'center', maxWidth: 240, margin: 0 }}>{message}</p>
    </div>
  )
}

export default ChartEmptyState
