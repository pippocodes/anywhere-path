import { useEffect, useMemo } from 'react'

const COLORS = ['#ff4d6d', '#ff8fa3', '#c9184a', '#ffccd5', '#800f2f', '#a4133c']

interface Props {
  onDone?: () => void
}

/** A short confetti burst for milestone celebrations — plain CSS keyframes, no library. */
function Confetti({ onDone }: Props) {
  const reduceMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  )

  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.25,
        duration: 1.1 + Math.random() * 0.7,
        color: COLORS[i % COLORS.length],
        rotate: Math.round(Math.random() * 360),
        drift: Math.round((Math.random() - 0.5) * 120),
      })),
    []
  )

  useEffect(() => {
    if (reduceMotion) {
      onDone?.()
      return
    }
    const t = setTimeout(() => onDone?.(), 2000)
    return () => clearTimeout(t)
  }, [onDone, reduceMotion])

  if (reduceMotion) return null

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }} aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={
            {
              left: `${p.left}%`,
              background: p.color,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              '--confetti-rotate': `${p.rotate}deg`,
              '--confetti-drift': `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

export default Confetti
