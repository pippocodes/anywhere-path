import { useRef, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'

interface Props {
  children: ReactNode
  className?: string
  style?: CSSProperties
  maxTilt?: number // degrees
}

/**
 * Wraps children in a card that tilts toward the cursor in pseudo-3D (CSS
 * `rotateX`/`rotateY` via a perspective transform) — no WebGL needed for
 * this kind of delight. Springs back to flat on mouse-leave, and does
 * nothing but render flat children when the user prefers reduced motion.
 */
function TiltCard({ children, className, style, maxTilt = 6 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(py, [0, 1], [maxTilt, -maxTilt]), { stiffness: 300, damping: 25 })
  const rotateY = useSpring(useTransform(px, [0, 1], [-maxTilt, maxTilt]), { stiffness: 300, damping: 25 })

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (reduceMotion || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    px.set((e.clientX - rect.left) / rect.width)
    py.set((e.clientY - rect.top) / rect.height)
  }

  function handleMouseLeave() {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        ...style,
        rotateX: reduceMotion ? 0 : rotateX,
        rotateY: reduceMotion ? 0 : rotateY,
        transformPerspective: 800,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  )
}

export default TiltCard
