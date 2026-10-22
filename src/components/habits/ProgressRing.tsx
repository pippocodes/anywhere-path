import { useId } from 'react'
import { motion } from 'framer-motion'
import CountUp from '../motion/CountUp'

interface Props {
  percent: number // 0-100
  size?: number
  color?: string
  label?: string
  gradient?: boolean // uses the accent->accent-2 gradient instead of a flat stroke color — the Month tab's big hero ring
}

/** An animated progress ring — SVG stroke-dashoffset (not conic-gradient, which can't be smoothly transitioned across browsers) so it genuinely animates whenever `percent` changes, not just snaps. */
function ProgressRing({ percent, size = 96, color = 'var(--gold)', label, gradient = false }: Props) {
  const gradientId = useId()
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
        {gradient && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--accent-2)" />
            </linearGradient>
          </defs>
        )}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--ring-track)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gradient ? `url(#${gradientId})` : color}
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
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: size / 4, color: 'var(--cream)' }}>
          <CountUp value={Math.round(clamped)} suffix="%" />
        </div>
        {label && (
          <div className="micro-label" style={{ marginTop: size > 120 ? 6 : 2, fontSize: size > 120 ? 12 : 9.5 }}>
            {label}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProgressRing
