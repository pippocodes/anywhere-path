import { motion, useReducedMotion } from 'framer-motion'

/** Shown while a route's code-split chunk loads — brief enough that the main concern is not flashing a jarring blank page. */
function PageLoading() {
  const reduceMotion = useReducedMotion()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px', gap: 14 }}>
      <motion.span
        aria-hidden
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '2px solid var(--line)',
          borderTopColor: 'var(--gold)',
        }}
      />
      <span className="micro-label">Loading</span>
    </div>
  )
}

export default PageLoading
