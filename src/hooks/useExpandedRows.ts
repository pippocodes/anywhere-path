import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'anywherePathExpandedRows'

function load(): Set<string> {
  try {
    // `window.localStorage`, not the bare global: Node 22+'s own
    // experimental `localStorage` global shadows jsdom's in tests and
    // throws when read, even though real browsers are unambiguous.
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch {
    // ignore — just start with nothing open
  }
  return new Set()
}

/**
 * Remembers which accordion rows (course/subtopic/module ids, all globally
 * unique via makeId) a user left open, persisted per-browser in
 * localStorage — this is a UI convenience, not account data, so it
 * deliberately doesn't go through cloud sync.
 */
export function useExpandedRows() {
  const [open, setOpen] = useState<Set<string>>(load)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(open)))
  }, [open])

  const isOpen = useCallback((id: string) => open.has(id), [open])

  const toggle = useCallback((id: string) => {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return { isOpen, toggle }
}
