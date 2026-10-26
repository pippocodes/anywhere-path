import { useEffect, useState } from 'react'

interface Metrics {
  innerHeight: number
  visualViewportHeight: number | null
  screenHeight: number
  safeAreaInsetBottom: string
  barTop: number | null
  barBottom: number | null
  barHeight: number | null
  labelBottomToViewportBottom: number | null
  documentClientHeight: number
  displayModeStandalone: boolean
}

function measure(): Metrics {
  const probe = document.createElement('div')
  probe.style.paddingBottom = 'env(safe-area-inset-bottom)'
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  document.body.appendChild(probe)
  const safeAreaInsetBottom = getComputedStyle(probe).paddingBottom
  document.body.removeChild(probe)

  const bar = document.querySelector('.bottom-tab-bar')
  const barRect = bar ? bar.getBoundingClientRect() : null
  // The label span is the last child of the first tab link — same text
  // node the user sees, so its bottom edge is what "labels sit N px above
  // the gesture area" is actually measuring.
  const label = document.querySelector('.bottom-tab-bar a span:last-child')
  const labelRect = label ? label.getBoundingClientRect() : null

  return {
    innerHeight: window.innerHeight,
    visualViewportHeight: window.visualViewport ? window.visualViewport.height : null,
    screenHeight: window.screen.height,
    safeAreaInsetBottom,
    barTop: barRect ? barRect.top : null,
    barBottom: barRect ? barRect.bottom : null,
    barHeight: barRect ? barRect.height : null,
    labelBottomToViewportBottom: labelRect ? window.innerHeight - labelRect.bottom : null,
    documentClientHeight: document.documentElement.clientHeight,
    displayModeStandalone: window.matchMedia('(display-mode: standalone)').matches,
  }
}

/**
 * Temporary instrumented readout for diagnosing the "gap below the bottom
 * tab bar" report on real phones — only mounts with ?debug=1 in the URL.
 * Remove once the bar/safe-area numbers are confirmed correct on-device.
 */
function DebugOverlay() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const enabled = new URLSearchParams(window.location.search).get('debug') === '1'

  useEffect(() => {
    if (!enabled) return
    const update = () => setMetrics(measure())
    update()
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)
    // The bar only mounts once auth resolves (useAuth's user is null on
    // first render), which can land after this effect's initial measure —
    // poll briefly so the readout doesn't get stuck on a pre-auth snapshot.
    const poll = setInterval(update, 500)
    return () => {
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
      clearInterval(poll)
    }
  }, [enabled])

  if (!enabled || !metrics) return null

  const rows: [string, string | number][] = [
    ['window.innerHeight', metrics.innerHeight],
    ['visualViewport.height', metrics.visualViewportHeight ?? 'n/a'],
    ['screen.height', metrics.screenHeight],
    ['env(safe-area-inset-bottom)', metrics.safeAreaInsetBottom],
    ['bar rect top', metrics.barTop ?? 'no bar mounted'],
    ['bar rect bottom', metrics.barBottom ?? 'no bar mounted'],
    ['bar height', metrics.barHeight ?? 'n/a'],
    ['label bottom -> viewport bottom', metrics.labelBottomToViewportBottom ?? 'n/a'],
    ['documentElement.clientHeight', metrics.documentClientHeight],
    ['display-mode: standalone', String(metrics.displayModeStandalone)],
  ]

  return (
    <div
      style={{
        position: 'fixed',
        top: 8,
        left: 8,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: 11,
        lineHeight: 1.5,
        padding: '8px 10px',
        borderRadius: 6,
        pointerEvents: 'none',
        maxWidth: '90vw',
      }}
    >
      {rows.map(([label, value]) => (
        <div key={label}>
          {label}: {value}
        </div>
      ))}
    </div>
  )
}

export default DebugOverlay
