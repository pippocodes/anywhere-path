/** Disclosure chevron for collapse/expand toggles — matches the app's hand-authored stroke icon set (currentColor, strokeWidth 1.8) instead of a Unicode glyph. Rotate it with a wrapping motion.span, same as before. */
function ChevronIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9.5 12 15.5 18 9.5" />
    </svg>
  )
}

export default ChevronIcon
