import { createContext, useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import type { AppData } from '../types'
import { appReducer, type Action } from './reducer'
import { normalizeAppData } from '../utils/normalizeAppData'
import { useAuth } from './AuthContext'
import { cloudHasAnyData, fetchCloudData, pushAppDataToCloud } from '../lib/cloudSync'
import MigratePrompt from '../components/MigratePrompt'
import CloudLoadErrorBanner from '../components/CloudLoadErrorBanner'

const STORAGE_KEY = 'anywherePathData'
const SYNC_DEBOUNCE_MS = 800

function loadLocalState(): AppData {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return normalizeAppData(JSON.parse(saved) as Partial<AppData>)
    }
  } catch (err) {
    console.error('Failed to load saved data', err)
  }
  return normalizeAppData({})
}

/** Every new account — local or cloud — starts completely empty. No seeded/sample content, ever. */
function freshState(): AppData {
  return normalizeAppData({})
}

/** Whether this device has anything actually worth offering to migrate into a fresh cloud account. */
function hasMeaningfulLocalData(data: AppData): boolean {
  return (
    data.courses.length > 0 ||
    data.habits.length > 0 ||
    data.roadmapDocs.length > 0 ||
    data.habitCategories.length > 0
  )
}

export interface AppContextValue {
  data: AppData
  dispatch: React.Dispatch<Action>
}

export const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  // Always start from whatever's local — instant first paint, and the
  // source for the one-time migration prompt below.
  const [data, dispatch] = useReducer(appReducer, undefined, loadLocalState)

  const [migratePrompt, setMigratePrompt] = useState<AppData | null>(null)
  // When the initial cloud fetch fails (network blip, RLS hiccup, etc.), we
  // must NOT mark sync as ready — syncReadyRef gates the background push
  // effect below, and that effect reconciles the cloud to exactly match
  // local `data` (deleting anything not present locally). If we'd silently
  // treated a failed fetch as "ready" with whatever empty/stale local state
  // happened to be loaded, the very next debounced push could wipe the
  // user's real courses/habits/roadmaps. So a failed fetch instead surfaces
  // a visible, retryable error and leaves the push effect disarmed.
  const [cloudLoadError, setCloudLoadError] = useState(false)
  const [retryNonce, setRetryNonce] = useState(0)
  const syncReadyRef = useRef(false) // true once it's safe to push `data` to the cloud
  const lastUserIdRef = useRef<string | null>(null)
  const pushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reacts to sign-in / sign-out, and to a manual retry after a failed
  // cloud load. Runs once per actual auth transition (guarded by
  // lastUserIdRef) or whenever retryNonce changes, not on every render.
  //
  // lastUserIdRef is committed only once an invocation's first await
  // resolves uncancelled, not synchronously up front — React 18 StrictMode
  // double-invokes effects in dev (mount, cleanup, mount again), and
  // committing the ref synchronously meant the *second* invocation would
  // see it already set and bail out immediately, leaving the component on
  // its empty initial state forever (no error, no data, just silently
  // "signed in with nothing"). The first invocation gets cancelled by the
  // synchronous StrictMode cleanup before its await resolves, so letting
  // both invocations start and only committing from the one that actually
  // finishes handles both StrictMode and real auth-transition churn.
  useEffect(() => {
    if (authLoading) return
    const userId = user?.id ?? null
    const isRetry = userId === lastUserIdRef.current && cloudLoadError
    if (userId === lastUserIdRef.current && !isRetry) return
    syncReadyRef.current = false
    setCloudLoadError(false)

    if (!userId) {
      // Signed out (or never signed in): local storage is the whole story.
      lastUserIdRef.current = userId
      dispatch({ type: 'HYDRATE', data: loadLocalState() })
      syncReadyRef.current = false
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const hasCloud = await cloudHasAnyData(userId)
        if (cancelled) return
        lastUserIdRef.current = userId

        if (hasCloud) {
          const cloud = await fetchCloudData(userId)
          if (cancelled) return
          dispatch({ type: 'HYDRATE', data: cloud })
          syncReadyRef.current = true
          return
        }

        // Fresh account: offer to bring in this device's local data, if any.
        const local = loadLocalState()
        if (hasMeaningfulLocalData(local)) {
          setMigratePrompt(local)
          // syncReadyRef stays false until the prompt is resolved below.
        } else {
          dispatch({ type: 'HYDRATE', data: freshState() })
          syncReadyRef.current = true
        }
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load your data from the cloud.', err)
        setCloudLoadError(true) // syncReadyRef stays false — nothing gets pushed until a retry succeeds
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, authLoading, retryNonce])

  // Background sync to Supabase, debounced, once we're past the initial
  // load/migration decision for the signed-in user.
  useEffect(() => {
    if (!user || !syncReadyRef.current) return
    if (pushTimeoutRef.current) clearTimeout(pushTimeoutRef.current)
    pushTimeoutRef.current = setTimeout(() => {
      pushAppDataToCloud(user.id, data).catch((err) => console.error('Cloud sync failed (will retry on next change):', err))
    }, SYNC_DEBOUNCE_MS)
    return () => {
      if (pushTimeoutRef.current) clearTimeout(pushTimeoutRef.current)
    }
  }, [data, user])

  // Local persistence only while signed out — once authenticated, the
  // cloud is the source of truth and the effect above takes over.
  useEffect(() => {
    if (user) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data, user])

  function resolveMigration(accept: boolean) {
    if (!migratePrompt || !user) return
    const chosen = accept ? migratePrompt : freshState()
    dispatch({ type: 'HYDRATE', data: chosen })
    setMigratePrompt(null)
    syncReadyRef.current = true
    pushAppDataToCloud(user.id, chosen).catch((err) => console.error('Initial cloud sync failed:', err))
  }

  return (
    <AppContext.Provider value={{ data, dispatch }}>
      {cloudLoadError && <CloudLoadErrorBanner onRetry={() => setRetryNonce((n) => n + 1)} />}
      {children}
      {migratePrompt && (
        <MigratePrompt onImport={() => resolveMigration(true)} onSkip={() => resolveMigration(false)} />
      )}
    </AppContext.Provider>
  )
}
