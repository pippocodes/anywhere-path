/** Hand-authored 24x24 stroke icons for the phone bottom tab bar — matches NotificationBell's existing bell glyph (currentColor, strokeWidth 1.8) rather than pulling in an icon library for five glyphs. */

function iconProps(size: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
}

export function HomeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg {...iconProps(size)}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  )
}

export function CoursesIcon({ size = 20 }: { size?: number }) {
  return (
    <svg {...iconProps(size)}>
      <path d="M4 5.5A2 2 0 0 1 6 3.5h5v17H6a2 2 0 0 1-2-2z" />
      <path d="M11 3.5h7a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-7" />
      <path d="M7 8h2M7 12h2" />
    </svg>
  )
}

export function HabitsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg {...iconProps(size)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.3 11 14.8l4.5-5.6" />
    </svg>
  )
}

export function FriendsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg {...iconProps(size)}>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M15.5 19c0-2.4 1.8-4 3.5-4.6" />
    </svg>
  )
}
