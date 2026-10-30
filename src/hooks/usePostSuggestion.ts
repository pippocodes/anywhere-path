import { useEffect, useState } from 'react'
import { useApp } from './useApp'
import { evaluatePostSuggestions, type PostSuggestion, type PostSuggestionRule } from '../utils/postSuggestions'
import { toDateStr } from '../utils/habits'

const STORAGE_KEY = 'anywherePathPostSuggestionState'

interface StoredState {
  lastShownDate: string | null // YYYY-MM-DD — enforces "at most one suggestion a day"
  postedIds: string[] // achievement ids already posted about — never suggest the same one twice
  neverRules: PostSuggestionRule[] // rule types permanently opted out via "Never suggest"
}

function emptyState(): StoredState {
  return { lastShownDate: null, postedIds: [], neverRules: [] }
}

function load(): StoredState {
  try {
    // `window.localStorage`, not the bare global — see useExpandedRows.ts
    // for why (Node 22+'s own experimental localStorage shadows jsdom's in
    // tests and throws when read).
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...emptyState(), ...(JSON.parse(raw) as Partial<StoredState>) }
  } catch {
    // ignore — just start fresh
  }
  return emptyState()
}

/**
 * This is a per-device UX throttle (which suggestion the user has already
 * seen/posted/opted out of), not account data — deliberately kept in
 * localStorage rather than synced, same reasoning as useExpandedRows.
 *
 * The candidate is evaluated ONCE per mount (lazy useState initializer),
 * not recomputed reactively — recomputing from `state` would make the
 * banner vanish the instant the "shown today" write below flips
 * `lastShownDate`, since that same write is also what the recomputation
 * checks against. Evaluating once keeps it stable for this visit; the
 * write below still makes it correctly absent on the NEXT mount today
 * (e.g. navigating away and back, or reloading).
 *
 * "Not now" needs no hook state at all: the caller can just stop
 * rendering `suggestion` locally — it's already a stable value for this
 * visit, and tomorrow's mount re-evaluates fresh anyway.
 */
export function usePostSuggestion() {
  const { data } = useApp()
  const [state, setState] = useState<StoredState>(load)
  const [dismissed, setDismissed] = useState(false)
  const today = toDateStr(new Date())

  const [captured] = useState<PostSuggestion | null>(() => {
    if (state.lastShownDate === today) return null
    const candidate = evaluatePostSuggestions(data, new Date())
    if (!candidate) return null
    if (state.neverRules.includes(candidate.rule)) return null
    if (state.postedIds.includes(candidate.id)) return null
    return candidate
  })

  useEffect(() => {
    if (!captured) return
    persist({ ...state, lastShownDate: today })
    // Runs once per mount only — this just records "a suggestion was
    // shown today", independent of `state`/`today` changing afterward.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function persist(next: StoredState) {
    setState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore — worst case, the same suggestion can show again today
    }
  }

  function markPosted() {
    if (!captured) return
    persist({ ...state, postedIds: [...state.postedIds, captured.id] })
    setDismissed(true)
  }

  function neverSuggestThisRule() {
    if (!captured) return
    persist({ ...state, neverRules: [...state.neverRules, captured.rule] })
    setDismissed(true)
  }

  return { suggestion: dismissed ? null : captured, markPosted, neverSuggestThisRule }
}
