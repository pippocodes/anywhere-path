import { createContext, useEffect, useReducer, type ReactNode } from 'react'
import type { AppData } from '../types'
import { seedCourses } from '../data/courses'
import { appReducer, initialData, type Action } from './reducer'

const STORAGE_KEY = 'anywherePathData'

function loadInitialState(): AppData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved) as AppData
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
