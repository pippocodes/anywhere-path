import { motion, AnimatePresence } from 'framer-motion'
import type { ThemeKey } from '../../context/ThemeContext'

interface Props {
  themeKey: ThemeKey
  name: string
  swatches: readonly string[]
  previewMode: 'light' | 'dark' // the user's currently-resolved mode — each card previews itself in that mode
  selected: boolean
  onSelect: () => void
}

/** One selectable theme card: name, swatch strip, and a live mini preview rendered with that theme's own tokens via a nested data-theme/data-mode scope — independent of whichever theme the rest of the page is using. */
function ThemeCard({ themeKey, name, swatches, previewMode, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="card"
      style={{
        textAlign: 'left',
        padding: 18,
        cursor: 'pointer',
        border: selected ? '2px solid var(--gold)' : '1px solid var(--line)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <AnimatePresence>
        {selected && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'var(--gradient-primary)',
              color: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            ✦
          </motion.span>
        )}
      </AnimatePresence>

      <div>
        <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 8 }}>{name}</div>
        <div style={{ display: 'flex', gap: 5 }}>
          {swatches.map((c, i) => (
            <span key={i} style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: '1px solid rgba(0,0,0,0.15)' }} />
          ))}
        </div>
      </div>

      {/* Live mini preview, scoped to this theme + the user's current light/dark mode */}
      <div
        data-theme={themeKey}
        data-mode={previewMode}
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 11,
            color: 'var(--text)',
            fontWeight: 600,
          }}
        >
          Aa <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>sample card</span>
        </div>
        <div
          style={{
            alignSelf: 'flex-start',
            background: 'var(--gradient-primary)',
            color: 'var(--bg)',
            fontSize: 10.5,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 999,
          }}
        >
          Button
        </div>
        <div style={{ height: 5, borderRadius: 4, background: 'var(--line)', overflow: 'hidden' }}>
          <div style={{ width: '64%', height: '100%', background: 'var(--gradient-primary)', borderRadius: 4 }} />
        </div>
      </div>
    </button>
  )
}

export default ThemeCard
