interface Props {
  label: string // username or email — first letter is shown
  size?: number
  colorIndex?: number // rotates through the member-N palette (friend-style lists); omit for the default gold ring look
}

/** The initial-letter avatar used throughout the app — no image upload, just a themed circle. */
function Avatar({ label, size = 40, colorIndex }: Props) {
  const initial = (label || '?').charAt(0).toUpperCase()

  if (colorIndex !== undefined) {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `var(--member-${(colorIndex % 4) + 1})`,
          color: 'var(--ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontWeight: 600,
          fontSize: size * 0.4,
          flexShrink: 0,
        }}
      >
        {initial}
      </span>
    )
  }

  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        padding: 3,
        background: 'var(--gradient-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: 'var(--ink-2)',
          color: 'var(--gold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontWeight: 600,
          fontSize: size * 0.4375,
        }}
      >
        {initial}
      </span>
    </span>
  )
}

export default Avatar
