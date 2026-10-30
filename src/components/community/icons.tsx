/** Hand-authored 24x24 stroke icons matching the existing nav icon set (NotificationBell's bell, tabIcons.tsx — currentColor, strokeWidth 1.8) rather than mixing in color emoji as icon stand-ins. */

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

export function LockIcon({ size = 13 }: { size?: number }) {
  return (
    <svg {...iconProps(size)}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
    </svg>
  )
}

export function GlobeIcon({ size = 13 }: { size?: number }) {
  return (
    <svg {...iconProps(size)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.5 2.3 3.8 5.3 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.3-3.8-8.5S9.5 5.8 12 3.5Z" />
    </svg>
  )
}

export function MessageIcon({ size = 13 }: { size?: number }) {
  return (
    <svg {...iconProps(size)}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9l-4.5 4.5V5.5Z" />
    </svg>
  )
}

export function MegaphoneIcon({ size = 16 }: { size?: number }) {
  return (
    <svg {...iconProps(size)}>
      <path d="M3 10v4a1 1 0 0 0 1 1h2l1.5 5h2L8 15" />
      <path d="M6 10 17 5.5a1 1 0 0 1 1.4.9v11.2a1 1 0 0 1-1.4.9L6 14Z" />
      <path d="M19.5 9.5a3 3 0 0 1 0 5" />
    </svg>
  )
}
