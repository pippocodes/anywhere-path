import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { useTodayItems } from '../../hooks/useTodayItems'
import { toDateStr } from '../../utils/habits'
import { isReturningAfterGap } from '../../utils/reminders'
import CatchUpSheet from './CatchUpSheet'

const LAST_SHOWN_KEY = 'anywherePathCatchUpLastShown'

/**
 * Mounted once at the app root. Shows the daily catch-up sheet at most once
 * per day, only when there's something pending and the user hasn't turned
 * the reminder off in Settings — purely an in-app, check-on-open effect
 * (no service worker, no push). The "last shown" date is device-local
 * (localStorage, same convention as anywherePathExpandedRows etc.), not
 * synced across devices.
 */
function CatchUpTrigger() {
  const { user, loading: authLoading } = useAuth()
  const items = useTodayItems()
  const [open, setOpen] = useState(false)
  const [welcomeBack, setWelcomeBack] = useState(false)
  // AppData hydrates asynchronously after login, so `items` starts empty on
  // the first render(s) — this tracks whether we've actually reached a real
  // decision (shown, or genuinely nothing pending) vs. just not-loaded-yet,
  // so the effect can keep re-checking as `items` fills in without
  // re-showing once a decision has been made for today.
  const decidedRef = useRef(false)

  useEffect(() => {
    if (authLoading || !user || !supabase || decidedRef.current) return
    if (items.length === 0) return // could just be mid-hydration — try again once items changes

    const today = toDateStr(new Date())
    let lastShown: string | null = null
    try {
      lastShown = window.localStorage.getItem(LAST_SHOWN_KEY)
    } catch {
      decidedRef.current = true // localStorage unavailable — safer to not show than to show every load
      return
    }
    if (lastShown === today) {
      decidedRef.current = true
      return
    }
    const returningAfterGap = isReturningAfterGap(lastShown, today)

    supabase
      .from('profiles')
      .select('catchup_reminder_enabled')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        decidedRef.current = true
        const enabled = (data as { catchup_reminder_enabled?: boolean } | null)?.catchup_reminder_enabled
        if (enabled === false) return
        try {
          window.localStorage.setItem(LAST_SHOWN_KEY, today)
        } catch {
          // ignore — worst case it shows again next load
        }
        setWelcomeBack(returningAfterGap)
        setOpen(true)
      })
  }, [authLoading, user, items])

  if (!user) return null

  return <CatchUpSheet open={open} items={items} welcomeBack={welcomeBack} onClose={() => setOpen(false)} />
}

export default CatchUpTrigger
