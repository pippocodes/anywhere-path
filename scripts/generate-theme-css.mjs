// Generates src/theme.css from src/theme-tokens.json — the single source of
// truth for all 8 theme x mode combinations. Run after editing
// theme-tokens.json (e.g. while iterating against the contrast checker);
// never hand-edit the generated block in theme.css directly.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const tokens = JSON.parse(readFileSync(path.join(root, 'src/theme-tokens.json'), 'utf8'))

const LINE_ALPHA = { dark: 0.16, light: 0.13 }
const LINE_STRONG_ALPHA = { dark: 0.6, light: 0.55 }
const SURFACE_ALPHA = { dark: 0.045, light: 0.035 }
const SURFACE_HOVER_ALPHA = { dark: 0.075, light: 0.06 }

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function toHex(n) {
  return Math.round(n).toString(16).padStart(2, '0')
}
/** The exact flat color a translucent `rgba(tintRgb, alpha)` surface renders as once composited over a solid bg — used for sticky/opaque cells that need to visually match a card's own (translucent) background without being see-through themselves. */
function flattenOverBg(tintRgb, alpha, bgHex) {
  const tint = tintRgb.split(',').map((v) => parseFloat(v.trim()))
  const bg = hexToRgb(bgHex)
  const mixed = tint.map((c, i) => c * alpha + bg[i] * (1 - alpha))
  return `#${mixed.map(toHex).join('')}`
}

function block(themeKey, mode, t) {
  const lineA = LINE_ALPHA[mode]
  const lineStrongA = LINE_STRONG_ALPHA[mode]
  const surfA = SURFACE_ALPHA[mode]
  const surfHoverA = SURFACE_HOVER_ALPHA[mode]
  const line = `rgba(${t.lineRgb}, ${lineA})`
  const lineStrong = `rgba(${t.lineRgb}, ${lineStrongA})`
  const surface = `rgba(${t.surfaceTintRgb}, ${surfA})`
  const surfaceHover = `rgba(${t.surfaceTintRgb}, ${surfHoverA})`
  const surfaceOpaque = flattenOverBg(t.surfaceTintRgb, surfA, t.bg)
  const shadow = `rgba(${t.shadowRgb}, ${t.shadowAlpha})`
  const gradient = `linear-gradient(135deg, ${t.accent}, ${t.accent2})`

  const lines = [
    // Not scoped to the html tag: a nested element can carry its own
    // data-theme/data-mode pair (e.g. a Settings theme card's live mini
    // preview) and everything inside it re-themes independently, since CSS
    // custom properties inherit down the DOM from whichever element last
    // set them.
    `[data-theme="${themeKey}"][data-mode="${mode}"] {`,
    `  /* semantic tokens */`,
    `  --bg: ${t.bg};`,
    `  --surface: ${surface};`,
    `  --surface-hover: ${surfaceHover};`,
    `  --surface-opaque: ${surfaceOpaque};`,
    `  --surface-2: ${t.surface2};`,
    `  --text: ${t.text};`,
    `  --text-muted: ${t.textMuted};`,
    `  --line: ${line};`,
    `  --line-strong: ${lineStrong};`,
    `  --accent: ${t.accent};`,
    `  --accent-2: ${t.accent2};`,
    `  --gradient-primary: ${gradient};`,
    `  --success: ${t.success};`,
    `  --warning: ${t.warning};`,
    `  --danger: ${t.danger};`,
    `  --info: ${t.chart[2]};`,
    `  --ring-track: ${line};`,
    ...t.chart.map((c, i) => `  --chart-${i + 1}: ${c};`),
    ...t.heat.map((c, i) => `  --heat-${i}: ${c};`),
    ...t.member.map((c, i) => `  --member-${i + 1}: ${c};`),
    `  --shadow: ${shadow};`,
    `  --grain-opacity: ${t.grainOpacity};`,
    `  --orb-1: ${t.orb1};`,
    `  --orb-2: ${t.orb2};`,
    ``,
    `  /* legacy bridge — old variable names used throughout the app,`,
    `     remapped so every existing component re-themes automatically`,
    `     without needing its own edit. New code should prefer the`,
    `     semantic names above. */`,
    `  --ink: var(--bg);`,
    `  --ink-2: var(--surface-2);`,
    `  --cream: var(--text);`,
    `  --mute: var(--text-muted);`,
    `  --gold: var(--accent);`,
    `  --rose: var(--accent-2);`,
    `  --violet: var(--chart-3);`,
    `  --plum: var(--text);`,
    `  color-scheme: ${mode === 'light' ? 'light' : 'dark'};`,
    `}`,
  ]
  return lines.join('\n')
}

const header = `/* ---------------------------------------------------------------------
   GENERATED FILE — do not hand-edit.
   Source: src/theme-tokens.json + scripts/generate-theme-css.mjs
   Regenerate with: node scripts/generate-theme-css.mjs
   --------------------------------------------------------------------- */

`

const themeMeta = Object.entries(tokens.themes).map(([key, t]) => ({ key, name: t.name, swatches: t.swatches }))

const metaComment =
  '/* Theme catalogue (for Settings UI / docs):\n' +
  themeMeta.map((t) => `   ${t.key} = "${t.name}" [${t.swatches.join(', ')}]`).join('\n') +
  '\n*/\n\n'

let css = header + metaComment

for (const [key, t] of Object.entries(tokens.themes)) {
  css += block(key, 'dark', t.dark) + '\n\n'
  css += block(key, 'light', t.light) + '\n\n'
}

// Fallback for the brief window before JS sets the attributes (and for any
// context where they're absent) — mirrors the default theme/mode.
css += `/* fallback before data-theme/data-mode are set (see index.html inline script) */\n`
css += `:root {\n`
css += `  color-scheme: dark;\n`
css += `}\n`

writeFileSync(path.join(root, 'src/theme.css'), css)
console.log(`Generated src/theme.css (${Object.keys(tokens.themes).length} themes x 2 modes = ${Object.keys(tokens.themes).length * 2} combinations)`)
