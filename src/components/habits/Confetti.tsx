import { useEffect, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface Props {
  onDone?: () => void
}

const SPARKLE_COUNT = 10

/** A brief, tasteful gold sparkle burst for milestone celebrations — a handful of ✦ glyphs, not a confetti cannon. */
function Confetti({ onDone }: Props) {
  const reduceMotion = useReducedMotion()

  const sparkles = useMemo(
    () =>
      Array.from({ length: SPARKLE_COUNT }, (_, i) => {
        const angle = (i / SPARKLE_COUNT) * Math.PI * 2 + Math.random() * 0.3
        const distance = 60 + Math.random() * 50
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          delay: Math.random() * 0.1,
          size: 10 + Math.random() * 10,
          color: i % 2 === 0 ? 'var(--gold)' : 'var(--rose)',
        }
      }),
    []
  )

  useEffect(() => {
    const t = setTimeout(() => onDone?.(), reduceMotion ? 0 : 900)
    return () => clearTimeout(t)
  }, [onDone, reduceMotion])

  if (reduceMotion) return null

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 100,
        left: '50%',
        width: 0,
        height: 0,
        pointerEvents: 'none',
        zIndex: 999,
      }}
    >
      {sparkles.map((s) => (
        <motion.span
          key={s.id}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.4, rotate: 0 }}
          animate={{ opacity: [0, 1, 0], x: s.x, y: s.y, scale: [0.4, 1, 0.7], rotate: 90 }}
          transition={{ duration: 0.8, delay: s.delay, ease: [0.3, 1.6, 0.5, 1] }}
          style={{
            position: 'absolute',
            fontSize: s.size,
            color: s.color,
          }}
        >
          ✦
        </motion.span>
      ))}
    </div>
  )
}

export default Confetti
