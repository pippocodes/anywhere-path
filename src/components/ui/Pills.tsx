import { motion } from 'framer-motion'

interface PillOption {
  value: string
  label: string
}

interface Props {
  options: PillOption[]
  value: string
  onChange: (value: string) => void
  layoutId: string
  size?: 'sm' | 'md'
}

/** Segmented pill control (tabs, Month|Year switchers) with a gold→rose indicator that glides between options via framer-motion layoutId. */
function Pills({ options, value, onChange, layoutId, size = 'md' }: Props) {
  const pad = size === 'sm' ? '6px 14px' : '8px 18px'
  const fontSize = size === 'sm' ? 12.5 : 13.5

  return (
    <div
      role="tablist"
      style={{
        display: 'inline-flex',
        gap: 4,
        padding: 4,
        borderRadius: 999,
        background: 'var(--surface)',
        border: '1px solid var(--line)',
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            style={{
              position: 'relative',
              padding: pad,
              fontSize,
              fontWeight: 700,
              borderRadius: 999,
              border: 'none',
              background: 'transparent',
              color: active ? 'var(--ink)' : 'var(--mute)',
              transition: 'color 0.2s var(--ease)',
            }}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 999,
                  background: 'var(--gradient-primary)',
                  zIndex: -1,
                }}
              />
            )}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export default Pills
