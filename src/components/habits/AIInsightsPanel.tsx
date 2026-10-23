import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Habit, HabitCategory } from '../../types'
import { buildHabitInsightStats, hasEnoughDataForInsights } from '../../utils/habitInsightStats'
import type { Suggestion } from '../../utils/suggestions'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../ui/Toast'
import Skeleton from '../ui/Skeleton'
import SuggestionsPanel from './SuggestionsPanel'

interface HabitInsightsResult {
  focusOn: string[]
  keepGoing: string[]
  easeUp: string[]
}

interface Props {
  habits: Habit[]
  categories: HabitCategory[]
  referenceDate: Date
  suggestions: Suggestion[]
}

type Status = 'insufficient-data' | 'loading' | 'loaded' | 'unavailable'

const SECTIONS: { key: keyof HabitInsightsResult; label: string; accent: string }[] = [
  { key: 'focusOn', label: 'Focus on', accent: 'var(--accent)' },
  { key: 'keepGoing', label: 'Keep going', accent: 'var(--success)' },
  { key: 'easeUp', label: 'Ease up on', accent: 'var(--accent-2)' },
]

function AITag() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className="outline-badge">✦ AI</span>
      <div className="micro-label" style={{ marginBottom: 0 }}>
        Insights
      </div>
    </div>
  )
}

/**
 * AI-generated habit insights, cached per-user-per-day server-side. Never
 * calls the API without enough tracking history, and never lets a failed
 * call surface as a page error — it falls back to the existing rule-based
 * SuggestionsPanel (or a friendly empty note) instead.
 */
function AIInsightsPanel({ habits, categories, referenceDate, suggestions }: Props) {
  const { session } = useAuth()
  const { show } = useToast()
  const enoughData = hasEnoughDataForInsights(habits)
  const [status, setStatus] = useState<Status>(() => (enoughData ? 'loading' : 'insufficient-data'))
  const [insights, setInsights] = useState<HabitInsightsResult | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const fetchedForDay = useRef<string | null>(null)

  // Fetches at most once per day per mount — habit/category changes from
  // ticking cells are deliberately NOT in this effect's deps, since
  // re-fetching the model on every click would be both slow and wasteful.
  const dayKey = referenceDate.toDateString()
  useEffect(() => {
    if (!enoughData) {
      setStatus('insufficient-data')
      fetchedForDay.current = null
      return
    }
    if (!session?.access_token) return
    if (fetchedForDay.current === dayKey) return
    fetchedForDay.current = dayKey
    setStatus('loading')
    void fetchInsights(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enoughData, session?.access_token, dayKey])

  async function fetchInsights(force: boolean) {
    if (force) setRefreshing(true)
    try {
      const stats = buildHabitInsightStats(habits, categories, referenceDate)
      const res = await fetch('/api/habit-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ stats, force }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        if (force) show(body?.message || "Couldn't refresh insights right now.", 'error')
        else setStatus('unavailable')
        return
      }
      setInsights(body.insights)
      setStatus('loaded')
    } catch {
      if (force) show("Couldn't reach the server — check your connection.", 'error')
      else setStatus('unavailable')
    } finally {
      setRefreshing(false)
    }
  }

  if (status === 'insufficient-data') {
    return (
      <div className="card" style={{ marginBottom: 24, padding: '16px 18px' }}>
        <div style={{ marginBottom: 6 }}>
          <AITag />
        </div>
        <p style={{ fontSize: 13, color: 'var(--mute)', margin: 0 }}>
          Keep ticking off days — AI insights unlock once you've got a few days of tracking history.
        </p>
      </div>
    )
  }

  if (status === 'unavailable') {
    if (suggestions.length > 0) return <SuggestionsPanel suggestions={suggestions} />
    return (
      <div className="card" style={{ marginBottom: 24, padding: '16px 18px' }}>
        <div style={{ marginBottom: 6 }}>
          <AITag />
        </div>
        <p style={{ fontSize: 13, color: 'var(--mute)', margin: 0 }}>Insights aren't available right now — check back soon.</p>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <AITag />
        {status === 'loaded' && (
          <button className="btn-outline" style={{ fontSize: 12 }} onClick={() => fetchInsights(true)} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : '↻ Refresh'}
          </button>
        )}
      </div>

      {status === 'loading' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {[0, 1].map((i) => (
            <div key={i} className="card" style={{ padding: '16px 18px' }}>
              <Skeleton width="40%" height={11} style={{ marginBottom: 10 }} />
              <Skeleton height={13} style={{ marginBottom: 6 }} />
              <Skeleton width="70%" height={13} />
            </div>
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={JSON.stringify(insights)}
            initial={{ opacity: refreshing ? 1 : 0, y: refreshing ? 0 : 10 }}
            animate={{ opacity: refreshing ? 0.6 : 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}
          >
            {SECTIONS.filter((s) => (insights?.[s.key]?.length ?? 0) > 0).map((section) => (
              <div key={section.key} className="card" style={{ padding: '16px 18px', borderLeft: `3px solid ${section.accent}` }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: section.accent,
                    marginBottom: 8,
                  }}
                >
                  {section.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {insights?.[section.key].map((item, i) => (
                    <p key={i} style={{ fontSize: 13.5, color: 'var(--cream)', lineHeight: 1.5, margin: 0 }}>
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

export default AIInsightsPanel
