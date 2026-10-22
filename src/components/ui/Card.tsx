import { useRef, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface Props {
  children: ReactNode
  className?: string
  style?: CSSProperties
  onClick?: () => void
  hoverLift?: boolean
}

/** The hairline-border, translucent surface every panel in the app sits on — hover lift + a soft diagonal light-sweep, no gimmicks. */
function Card({ children, className, style, onClick, hoverLift = true }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (reduceMotion || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--sweep-x', `${((e.clientX - rect.left) / rect.width) * 100}%`)
    ref.current.style.setProperty('--sweep-y', `${((e.clientY - rect.top) / rect.height) * 100}%`)
  }

  return (
    <motion.div
      ref={ref}
      className={className ? `card card-sweep ${className}` : 'card card-sweep'}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      whileHover={reduceMotion || !hoverLift ? undefined : { y: -5, borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)' }}
      transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
      style={{ cursor: onClick ? 'pointer' : undefined, ...style }}
    >
      {children}
    </motion.div>
  )
}

export default Card
