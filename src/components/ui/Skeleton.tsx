import type { CSSProperties } from 'react'

interface Props {
  width?: number | string
  height?: number | string
  radius?: number
  style?: CSSProperties
  className?: string
}

/** A pulsing placeholder block for anything still loading — cards, chart areas, list rows. */
function Skeleton({ width = '100%', height = 16, radius = 8, style, className }: Props) {
  return (
    <div
      className={className ? `skeleton-shimmer ${className}` : 'skeleton-shimmer'}
      aria-hidden
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  )
}

export default Skeleton
