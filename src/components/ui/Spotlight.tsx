import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

/** A subtle radial gradient that follows the cursor, mounted once at the app root. Does nothing under prefers-reduced-motion or on touch-only devices. */
function Spotlight() {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) return
    function handleMove(e: PointerEvent) {
      if (e.pointerType === 'touch' || !ref.current) return
      ref.current.style.setProperty('--spot-x', `${e.clientX}px`)
      ref.current.style.setProperty('--spot-y', `${e.clientY}px`)
    }
    window.addEventListener('pointermove', handleMove)
    return () => window.removeEventListener('pointermove', handleMove)
  }, [reduceMotion])

  if (reduceMotion) return null

  return <div ref={ref} className="cursor-spotlight" aria-hidden />
}

export default Spotlight
