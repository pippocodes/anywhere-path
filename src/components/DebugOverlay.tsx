import { useEffect, useState } from 'react'

interface Metrics {
  innerHeight: number
  visualViewportHeight: number | null
  screenHeight: number
  safeAreaInsetBottom: string
  barBottom: number | null
  barHeight: number | null
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

  return {
    innerHeight: window.innerHeight,
    visualViewportHeight: window.visualViewport ? window.visualViewport.height : null,
    screenHeight: window.screen.height,
    safeAreaInsetBottom,
    barBottom: barRect ? barRect.bottom : null,
    barHeight: barRect ? barRect.height : null,
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
    ['bar.getBoundingClientRect().bottom', metrics.barBottom ?? 'no bar mounted'],
    ['bar height', metrics.barHeight ?? 'n/a'],
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
