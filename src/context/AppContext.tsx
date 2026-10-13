import { createContext, useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import type { AppData } from '../types'
import { seedCourses } from '../data/courses'
import { appReducer, type Action } from './reducer'
import { normalizeAppData } from '../utils/normalizeAppData'
import { useAuth } from './AuthContext'
import { cloudHasAnyData, fetchCloudData, pushAppDataToCloud } from '../lib/cloudSync'
import MigratePrompt from '../components/MigratePrompt'

const STORAGE_KEY = 'anywherePathData'
const SYNC_DEBOUNCE_MS = 800

function loadLocalState(): AppData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<AppData>
      return normalizeAppData({ courses: seedCourses, ...parsed })
    }
  } catch (err) {
    console.error('Failed to load saved data', err)
  }
  return normalizeAppData({ courses: seedCourses })
}

function freshState(): AppData {
  return normalizeAppData({ courses: seedCourses })
}

/** Anything beyond the seed courses — i.e. actually worth offering to migrate. */
function hasMeaningfulLocalData(data: AppData): boolean {
  return (
    data.courses.some((c) => c.isCustom) ||
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
  const syncReadyRef = useRef(false) // true once it's safe to push `data` to the cloud
  const lastUserIdRef = useRef<string | null>(null)
  const pushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reacts to sign-in / sign-out. Runs once per actual auth transition
  // (guarded by lastUserIdRef), not on every render.
  useEffect(() => {
    if (authLoading) return
    const userId = user?.id ?? null
    if (userId === lastUserIdRef.current) return
    lastUserIdRef.current = userId
    syncReadyRef.current = false

    if (!userId) {
      // Signed out (or never signed in): local storage is the whole story.
      dispatch({ type: 'HYDRATE', data: loadLocalState() })
      syncReadyRef.current = false
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const hasCloud = await cloudHasAnyData(userId)
        if (cancelled) return

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
        console.error('Failed to load your data from the cloud — continuing with what is loaded locally.', err)
        syncReadyRef.current = true // don't get stuck retrying forever inside this effect
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, authLoading])

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
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
      {children}
      {migratePrompt && (
        <MigratePrompt onImport={() => resolveMigration(true)} onSkip={() => resolveMigration(false)} />
      )}
    </AppContext.Provider>
  )
}
