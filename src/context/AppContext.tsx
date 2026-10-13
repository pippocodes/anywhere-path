import { createContext, useEffect, useReducer, type ReactNode } from 'react'
import type { AppData } from '../types'
import { seedCourses } from '../data/courses'
import { appReducer, initialData, type Action } from './reducer'

const STORAGE_KEY = 'anywherePathData'

function loadInitialState(): AppData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      // Merge onto defaults rather than trusting the blob wholesale — this
      // keeps older saved data working as new AppData fields get added.
      const parsed = JSON.parse(saved) as Partial<AppData>
      return { ...initialData, courses: seedCourses, ...parsed }
    }
  } catch (err) {
    console.error('Failed to load saved data', err)
  }
  return { ...initialData, courses: seedCourses }
}

export interface AppContextValue {
  data: AppData
  dispatch: React.Dispatch<Action>
}

export const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(appReducer, undefined, loadInitialState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  return <AppContext.Provider value={{ data, dispatch }}>{children}</AppContext.Provider>
}
