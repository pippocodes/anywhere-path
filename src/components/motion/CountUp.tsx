import { useEffect, type CSSProperties } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'

interface Props {
  value: number
  decimals?: number
  suffix?: string
  className?: string
  style?: CSSProperties
}

/** Animates a displayed number smoothly toward `value` whenever it changes, instead of just snapping. */
function CountUp({ value, decimals = 0, suffix = '', className, style }: Props) {
  const reduceMotion = useReducedMotion()
  const motionValue = useMotionValue(value)
  const spring = useSpring(motionValue, { stiffness: 120, damping: 20 })
  const display = useTransform(spring, (v) => `${v.toFixed(decimals)}${suffix}`)

  useEffect(() => {
    if (reduceMotion) {
      spring.jump(value)
    } else {
      motionValue.set(value)
    }
  }, [value, reduceMotion, motionValue, spring])

  return (
    <motion.span className={className} style={style}>
      {display}
    </motion.span>
  )
}

export default CountUp
