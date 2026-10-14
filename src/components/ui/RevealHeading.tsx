import type { CSSProperties, ElementType } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface Props {
  children: string
  as?: ElementType
  className?: string
  style?: CSSProperties
  delay?: number
}

const CONTAINER_VARIANTS = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045 } },
}

const WORD_VARIANTS = {
  hidden: { opacity: 0, y: 14, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
}

/** Splits a heading into words and reveals them with a short stagger on mount — used for page titles and hero headlines. */
function RevealHeading({ children, as: Tag = 'h1', className, style, delay = 0 }: Props) {
  const reduceMotion = useReducedMotion()
  const words = children.split(' ')

  if (reduceMotion) {
    return (
      <Tag className={className} style={style}>
        {children}
      </Tag>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={CONTAINER_VARIANTS}
      transition={{ delayChildren: delay }}
      style={{ display: 'inline-block' }}
    >
      <Tag className={className} style={{ ...style, margin: 0 }}>
        {words.map((word, i) => (
          <motion.span
            key={i}
            variants={WORD_VARIANTS}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ display: 'inline-block' }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        ))}
      </Tag>
    </motion.div>
  )
}

export default RevealHeading
