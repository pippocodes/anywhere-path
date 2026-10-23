import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabaseClient'
import themeTokens from '../theme-tokens.json'

export type ThemeKey = keyof typeof themeTokens.themes
export type ColorMode = 'system' | 'light' | 'dark'

export const THEME_KEYS = Object.keys(themeTokens.themes) as ThemeKey[]
export const THEME_CATALOGUE = themeTokens.themes

const DEFAULT_THEME: ThemeKey = 'carousel'
const DEFAULT_MODE: ColorMode = 'system'
const THEME_STORAGE_KEY = 'anywherePathTheme'
const MODE_STORAGE_KEY = 'anywherePathColorMode'

function isThemeKey(v: unknown): v is ThemeKey {
  return typeof v === 'string' && (THEME_KEYS as string[]).includes(v)
}
function isColorMode(v: unknown): v is ColorMode {
  return v === 'system' || v === 'light' || v === 'dark'
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveMode(mode: ColorMode): 'light' | 'dark' {
  return mode === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : mode
}

const THEME_COLOR_META: Record<ThemeKey, { dark: string; light: string }> = Object.fromEntries(
  THEME_KEYS.map((key) => [key, { dark: themeTokens.themes[key].dark.bg, light: themeTokens.themes[key].light.bg }])
) as Record<ThemeKey, { dark: string; light: string }>

/** Writes data-theme/data-mode onto <html> and updates the browser theme-color meta tag — the one place that actually touches the DOM for theming, so every call site (initial load, a user click, a cross-device sync) goes through the same path. */
function applyToDocument(theme: ThemeKey, mode: ColorMode) {
  const resolved = resolveMode(mode)
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.setAttribute('data-mode', resolved)

  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', THEME_COLOR_META[theme][resolved])
}

export interface ThemeContextValue {
  theme: ThemeKey
  colorMode: ColorMode
  resolvedMode: 'light' | 'dark'
  setTheme: (theme: ThemeKey) => void
  setColorMode: (mode: ColorMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [theme, setThemeState] = useState<ThemeKey>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(THEME_STORAGE_KEY) : null
    return isThemeKey(saved) ? saved : DEFAULT_THEME
  })
  const [colorMode, setColorModeState] = useState<ColorMode>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(MODE_STORAGE_KEY) : null
    return isColorMode(saved) ? saved : DEFAULT_MODE
  })
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>(() => resolveMode(colorMode))

  // Which signed-in user's profile the initial pull-from-DB has completed
  // for — gates the write-through effect below so it can never race the
  // pull (without this, a fresh mount could write the localStorage-seeded
  // value to the DB before the account's actual saved value has even been
  // read back, depending on which network request happens to land first).
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null)

  const runTransition = useCallback((apply: () => void) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const canUseViewTransitions = 'startViewTransition' in document && !reduceMotion
    if (canUseViewTransitions) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(document as any).startViewTransition(apply)
      return
    }
    if (reduceMotion) {
      apply()
      return
    }
    // Cross-fade fallback for browsers without the View Transitions API:
    // briefly fade the page out and back in around the attribute swap.
    const root = document.documentElement
    root.style.transition = 'opacity 0.18s ease'
    root.style.opacity = '0'
    window.setTimeout(() => {
      apply()
      requestAnimationFrame(() => {
        root.style.opacity = '1'
        window.setTimeout(() => {
          root.style.transition = ''
        }, 400)
      })
    }, 180)
  }, [])

  const setTheme = useCallback(
    (next: ThemeKey) => {
      runTransition(() => {
        setThemeState(next)
        window.localStorage.setItem(THEME_STORAGE_KEY, next)
        applyToDocument(next, colorMode)
      })
    },
    [colorMode, runTransition]
  )

  const setColorMode = useCallback(
    (next: ColorMode) => {
      runTransition(() => {
        setColorModeState(next)
        window.localStorage.setItem(MODE_STORAGE_KEY, next)
        setResolvedMode(resolveMode(next))
        applyToDocument(theme, next)
      })
    },
    [theme, runTransition]
  )

  // Keep data-mode in sync with the OS theme while colorMode === 'system'.
  useEffect(() => {
    if (colorMode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    function handleChange() {
      setResolvedMode(resolveMode('system'))
      applyToDocument(theme, 'system')
    }
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [colorMode, theme])

  // Make sure the DOM matches state after any render that changed theme —
  // covers the profile-sync path below, which sets state directly rather
  // than through setTheme/setColorMode.
  useEffect(() => {
    applyToDocument(theme, colorMode)
    setResolvedMode(resolveMode(colorMode))
  }, [theme, colorMode])

  // On sign-in, the account's saved theme/color_mode follows the user to
  // this device — fetched once per session and applied if it differs from
  // what's already showing (e.g. a brand new device with no localStorage).
  // Runs to completion BEFORE the write-through effect below is allowed to
  // touch the DB at all (see syncedUserId), so the two can never race.
  useEffect(() => {
    const userId = session?.user?.id
    if (!supabase || !userId) {
      setSyncedUserId(null)
      return
    }
    let cancelled = false
    supabase
      .from('profiles')
      .select('theme, color_mode')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (cancelled) return
        const remoteTheme = isThemeKey(data?.theme) ? data.theme : null
        const remoteMode = isColorMode(data?.color_mode) ? data.color_mode : null
        if (remoteTheme) {
          setThemeState(remoteTheme)
          window.localStorage.setItem(THEME_STORAGE_KEY, remoteTheme)
        }
        if (remoteMode) {
          setColorModeState(remoteMode)
          window.localStorage.setItem(MODE_STORAGE_KEY, remoteMode)
        }
        setSyncedUserId(userId)
      })
    return () => {
      cancelled = true
    }
  }, [session?.user?.id])

  // Writes a user's own theme change through to their profile, so it
  // follows them to another device next time they log in. Gated on the
  // initial pull above having completed for this exact user, so this never
  // fires with a stale localStorage-seeded value before the account's own
  // saved choice has had a chance to load.
  useEffect(() => {
    const userId = session?.user?.id
    if (!supabase || !userId || syncedUserId !== userId) return
    supabase.from('profiles').update({ theme, color_mode: colorMode }).eq('id', userId).then()
  }, [theme, colorMode, session?.user?.id, syncedUserId])

  return (
    <ThemeContext.Provider value={{ theme, colorMode, resolvedMode, setTheme, setColorMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
