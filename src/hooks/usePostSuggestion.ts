import { useEffect, useMemo, useState } from 'react'
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
 * "Not now" needs no stored state at all: once a suggestion is actually
 * shown, `lastShownDate` is set immediately below, which already hides any
 * suggestion for the rest of today regardless of what the user does next.
 * The caller can just stop rendering it locally.
 */
export function usePostSuggestion() {
  const { data } = useApp()
  const [state, setState] = useState<StoredState>(load)
  const today = toDateStr(new Date())

  const suggestion: PostSuggestion | null = useMemo(() => {
    if (state.lastShownDate === today) return null
    const candidate = evaluatePostSuggestions(data, new Date())
    if (!candidate) return null
    if (state.neverRules.includes(candidate.rule)) return null
    if (state.postedIds.includes(candidate.id)) return null
    return candidate
  }, [data, state, today])

  useEffect(() => {
    if (!suggestion || state.lastShownDate === today) return
    const next = { ...state, lastShownDate: today }
    setState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore — worst case, the same suggestion can show again today
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestion, today])

  function persist(next: StoredState) {
    setState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  function markPosted() {
    if (!suggestion) return
    persist({ ...state, postedIds: [...state.postedIds, suggestion.id] })
  }

  function neverSuggestThisRule() {
    if (!suggestion) return
    persist({ ...state, neverRules: [...state.neverRules, suggestion.rule] })
  }

  return { suggestion, markPosted, neverSuggestThisRule }
}
