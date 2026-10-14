import type { CSSProperties, ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface Props {
  children: ReactNode
  delay?: number
  style?: CSSProperties
  className?: string
  as?: 'div' | 'section'
}

/** Scroll-triggered reveal — fade + rise + blur-to-sharp, once per element, used for static page content below the fold. */
function Reveal({ children, delay = 0, style, className, as = 'div' }: Props) {
  const reduceMotion = useReducedMotion()
  const Component = motion[as]

  if (reduceMotion) {
    const Static = as
    return (
      <Static className={className} style={style}>
        {children}
      </Static>
    )
  }

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: 28, filter: 'blur(5px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: [0.2, 0.8, 0.2, 1] }}
      style={style}
    >
      {children}
    </Component>
  )
}

export default Reveal
