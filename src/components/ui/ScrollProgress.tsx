import { motion, useScroll, useSpring } from 'framer-motion'

/** Thin gold→rose bar across the very top of the viewport, tracking scroll position. */
function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 300, damping: 40, restDelta: 0.001 })

  return <motion.div className="scroll-progress" style={{ scaleX }} />
}

export default ScrollProgress
