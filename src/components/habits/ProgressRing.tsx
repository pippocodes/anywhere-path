import { motion } from 'framer-motion'
import CountUp from '../motion/CountUp'

interface Props {
  percent: number // 0-100
  size?: number
  color?: string
  label?: string
}

/** An animated progress ring — SVG stroke-dashoffset (not conic-gradient, which can't be smoothly transitioned across browsers) so it genuinely animates whenever `percent` changes, not just snaps. */
function ProgressRing({ percent, size = 96, color = 'var(--pink)', label }: Props) {
  const clamped = Math.max(0, Math.min(100, percent))
  const strokeWidth = size * 0.11
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div
      style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}
      role="img"
      aria-label={`${label ? label + ': ' : ''}${Math.round(clamped)}% complete`}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--pink-pale)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: circumference - (clamped / 100) * circumference }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: size / 4.2, color: 'var(--ink)' }}>
          <CountUp value={Math.round(clamped)} suffix="%" />
        </div>
        {label && <div style={{ fontSize: 10.5, color: 'var(--rose)', fontWeight: 600 }}>{label}</div>}
      </div>
    </div>
  )
}

export default ProgressRing
