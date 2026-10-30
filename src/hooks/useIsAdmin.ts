import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { checkIsAdmin } from '../lib/adminApi'

/** Just the cheap "show the Admin link or not" check — the Navbar's own concern, separate from useAdmin (which also loads reports/announcements, too much to run on every page). */
export function useIsAdmin(): boolean {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      return
    }
    let cancelled = false
    checkIsAdmin()
      .then((admin) => {
        if (!cancelled) setIsAdmin(admin)
      })
      .catch(() => {
        // ignore — just don't show the link
      })
    return () => {
      cancelled = true
    }
  }, [user])

  return isAdmin
}
