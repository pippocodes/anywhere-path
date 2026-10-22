// WCAG AA contrast checker for every theme x mode combination defined in
// src/theme-tokens.json. Checks the real text/background and
// UI-component/background pairs the app actually renders, prints a report,
// and exits non-zero if anything fails — so this can gate CI later too.
//
// Thresholds (WCAG 2.1 AA): 4.5:1 for normal text, 3:1 for large text
// (>=18.66px bold or >=24px regular — this app's micro-labels/buttons are
// bold and >=11px, headings are >=28px) and for UI-component boundaries
// (focus rings, borders that convey meaning).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const tokens = JSON.parse(readFileSync(path.join(root, 'src/theme-tokens.json'), 'utf8'))

const LINE_ALPHA = { dark: 0.16, light: 0.13 }
const LINE_STRONG_ALPHA = { dark: 0.6, light: 0.55 }
const SURFACE_ALPHA = { dark: 0.045, light: 0.035 }

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// Flattens any CSS color this script needs to a solid RGB — including
// alpha-composited "rgba(...) over bg" since every translucent token here
// (surface, line) is always rendered on top of --bg in practice.
function resolveColor(value, bgRgb) {
  if (value.startsWith('#')) return hexToRgb(value)
  const m = value.match(/rgba?\(([\d., ]+)\)/)
  if (!m) throw new Error(`Unrecognised color: ${value}`)
  const parts = m[1].split(',').map((s) => parseFloat(s.trim()))
  const [r, g, b, a = 1] = parts
  if (a >= 1) return [r, g, b]
  return [
    Math.round(r * a + bgRgb[0] * (1 - a)),
    Math.round(g * a + bgRgb[1] * (1 - a)),
    Math.round(b * a + bgRgb[2] * (1 - a)),
  ]
}

function relLuminance([r, g, b]) {
  const srgb = [r, g, b].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}

function contrastRatio(rgb1, rgb2) {
  const l1 = relLuminance(rgb1)
  const l2 = relLuminance(rgb2)
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (lighter + 0.05) / (darker + 0.05)
}

function buildPairs(themeKey, mode, t) {
  const bg = hexToRgb(t.bg)
  const surface2 = hexToRgb(t.surface2)
  const line = resolveColor(`rgba(${t.lineRgb}, ${LINE_ALPHA[mode]})`, bg)
  const lineStrong = resolveColor(`rgba(${t.lineRgb}, ${LINE_STRONG_ALPHA[mode]})`, bg)
  const surfaceOnBg = resolveColor(`rgba(${t.surfaceTintRgb}, ${SURFACE_ALPHA[mode]})`, bg)

  const pairs = [
    { label: 'body text on bg', fg: hexToRgb(t.text), bg, min: 4.5, kind: 'text' },
    { label: 'body text on surface-2 (cards/dropdowns)', fg: hexToRgb(t.text), bg: surface2, min: 4.5, kind: 'text' },
    { label: 'body text on translucent surface', fg: hexToRgb(t.text), bg: surfaceOnBg, min: 4.5, kind: 'text' },
    { label: 'muted text on bg', fg: hexToRgb(t.textMuted), bg, min: 4.5, kind: 'text' },
    { label: 'muted text on surface-2', fg: hexToRgb(t.textMuted), bg: surface2, min: 4.5, kind: 'text' },
    { label: 'accent as text/link on bg', fg: hexToRgb(t.accent), bg, min: 4.5, kind: 'text' },
    { label: 'accent-2 as text/link on bg', fg: hexToRgb(t.accent2), bg, min: 4.5, kind: 'text' },
    { label: 'danger text on bg', fg: hexToRgb(t.danger), bg, min: 4.5, kind: 'text' },
    { label: 'success text on bg', fg: hexToRgb(t.success), bg, min: 4.5, kind: 'text' },
    { label: 'warning text on bg', fg: hexToRgb(t.warning), bg, min: 4.5, kind: 'text' },
    { label: '"ink" text on accent button (primary .btn)', fg: hexToRgb(t.bg), bg: hexToRgb(t.accent), min: 4.5, kind: 'text' },
    // Decorative card/divider borders: not a WCAG 1.4.11 pair, since the
    // card already has its own background tint — the border isn't the sole
    // way the boundary is perceived. Reported for visibility, not gated.
    { label: 'line (decorative card border) vs bg — informational', fg: line, bg, min: 0, kind: 'info' },
    // line-strong: the few places a border IS the sole boundary cue (text
    // input fields, an empty/"not done" habit cell) — this one must hit 3:1.
    { label: 'line-strong (input/empty-cell border) vs bg — UI component', fg: lineStrong, bg, min: 3.0, kind: 'ui' },
  ]

  // Chart/heat/member tokens render as graphical objects (bars, rings,
  // heatmap cells, member dots) against a card's surface-2 background —
  // WCAG 1.4.11 covers "graphical objects required to understand content"
  // at 3:1, same threshold as UI components.
  t.chart.forEach((c, i) => {
    pairs.push({ label: `chart-${i + 1} vs surface-2 (graphical object)`, fg: hexToRgb(c), bg: surface2, min: 3.0, kind: 'ui' })
  })
  t.member.forEach((c, i) => {
    pairs.push({ label: `member-${i + 1} vs surface-2 (graphical object)`, fg: hexToRgb(c), bg: surface2, min: 3.0, kind: 'ui' })
  })
  return pairs.map((p) => ({ ...p, theme: themeKey, mode, ratio: contrastRatio(p.fg, p.bg) }))
}

const results = []
for (const [key, t] of Object.entries(tokens.themes)) {
  results.push(...buildPairs(key, 'dark', t.dark))
  results.push(...buildPairs(key, 'light', t.light))
}

let failCount = 0
let lastCombo = ''
for (const r of results) {
  const combo = `${r.theme} / ${r.mode}`
  if (combo !== lastCombo) {
    console.log(`\n=== ${combo} ===`)
    lastCombo = combo
  }
  const pass = r.ratio >= r.min
  if (!pass) failCount++
  const ratioStr = r.ratio.toFixed(2)
  console.log(`  [${pass ? 'PASS' : 'FAIL'}] ${r.label}: ${ratioStr}:1 (need ${r.min}:1)`)
}

console.log(`\n${results.length - failCount}/${results.length} checks passed.`)
if (failCount > 0) {
  console.log(`${failCount} FAILED — adjust src/theme-tokens.json, re-run scripts/generate-theme-css.mjs, then re-run this check.`)
  process.exit(1)
} else {
  console.log('All combinations pass WCAG AA for every checked pair.')
}
